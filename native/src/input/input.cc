#include "input.h"
#include <atomic>
#include <condition_variable>
#include <cstdint>
#include <limits>
#include <mutex>
#include <string>
#include <thread>
#include <vector>

#include <windows.h>

static HHOOK hKeyboardHook = nullptr;
static DWORD keyboardThreadId = 0;
static std::thread keyboardThread;
static std::mutex lifecycleMtx;
static std::condition_variable hookSetupCv;
static bool hookSetupComplete = false;
static DWORD hookSetupError = ERROR_SUCCESS;
static bool inputInstalled = false;
static std::atomic<bool> running{false};

static Napi::ThreadSafeFunction tsfn;
static bool tsfnInitialized = false;
static std::mutex tsfnMtx;

// Global key state tracking for virtual-key codes 0-255.
static std::mutex keyStateMtx;
static bool keyStates[256] = {false};

static void ResetKeyStates() {
  std::lock_guard<std::mutex> lock(keyStateMtx);
  for (bool& keyState : keyStates) {
    keyState = false;
  }
}

static std::string FormatWindowsError(const char* operation, DWORD errorCode) {
  return std::string(operation) + " failed with Windows error " + std::to_string(errorCode);
}

static std::string FormatSendInputError(UINT expected, UINT actual, DWORD errorCode) {
  return "SendInput inserted " + std::to_string(actual) + " of " + std::to_string(expected) +
         " inputs, Windows error " + std::to_string(errorCode);
}

static void ReleaseKeyEventCallback() {
  std::lock_guard<std::mutex> lock(tsfnMtx);
  if (tsfnInitialized) {
    tsfn.Release();
    tsfnInitialized = false;
  }
}

static LRESULT CALLBACK KeyboardEvent(int nCode, WPARAM wParam, LPARAM lParam) {
  if (nCode == HC_ACTION) {
    KBDLLHOOKSTRUCT* pKeyBoard = reinterpret_cast<KBDLLHOOKSTRUCT*>(lParam);
    DWORD key = pKeyBoard->vkCode;
    std::string action = (wParam == WM_KEYDOWN || wParam == WM_SYSKEYDOWN) ? "DOWN" : "UP";

    if (key < 256) {
      std::lock_guard<std::mutex> lock(keyStateMtx);
      if (wParam == WM_KEYDOWN || wParam == WM_SYSKEYDOWN) {
        keyStates[key] = true;
      } else if (wParam == WM_KEYUP || wParam == WM_SYSKEYUP) {
        keyStates[key] = false;
      }
    }

    std::string keyEventOutput = std::to_string(key) + "," + action;
    std::lock_guard<std::mutex> lock(tsfnMtx);
    if (tsfnInitialized) {
      tsfn.NonBlockingCall([keyEventOutput](Napi::Env env, Napi::Function jsCallback) {
        jsCallback.Call({Napi::String::New(env, keyEventOutput)});
      });
    }
  }
  return CallNextHookEx(hKeyboardHook, nCode, wParam, lParam);
}

static void KeyboardHookThread() {
  MSG message;
  DWORD threadId = GetCurrentThreadId();

  // Force creation of this thread's message queue before install() returns.
  PeekMessage(&message, nullptr, WM_USER, WM_USER, PM_NOREMOVE);

  HINSTANCE hInstance = GetModuleHandle(nullptr);
  HHOOK hook = SetWindowsHookEx(WH_KEYBOARD_LL, KeyboardEvent, hInstance, 0);
  DWORD setupError = hook == nullptr ? GetLastError() : ERROR_SUCCESS;

  {
    std::lock_guard<std::mutex> lock(lifecycleMtx);
    keyboardThreadId = threadId;
    hKeyboardHook = hook;
    hookSetupError = setupError;
    hookSetupComplete = true;
  }
  hookSetupCv.notify_one();

  if (hook == nullptr) {
    return;
  }

  while (running.load()) {
    BOOL result = GetMessage(&message, nullptr, 0, 0);
    if (result <= 0) {
      break;
    }

    TranslateMessage(&message);
    DispatchMessage(&message);
  }

  UnhookWindowsHookEx(hook);

  {
    std::lock_guard<std::mutex> lock(lifecycleMtx);
    hKeyboardHook = nullptr;
    keyboardThreadId = 0;
  }
}

static void StopKeyboardHookThread() {
  std::thread threadToJoin;

  {
    std::lock_guard<std::mutex> lock(lifecycleMtx);
    running.store(false);

    if (keyboardThreadId != 0) {
      PostThreadMessage(keyboardThreadId, WM_QUIT, 0, 0);
    }

    if (keyboardThread.joinable()) {
      threadToJoin = std::move(keyboardThread);
    }
  }

  if (threadToJoin.joinable()) {
    threadToJoin.join();
  }

  {
    std::lock_guard<std::mutex> lock(lifecycleMtx);
    hKeyboardHook = nullptr;
    keyboardThreadId = 0;
    hookSetupComplete = false;
    hookSetupError = ERROR_SUCCESS;
    inputInstalled = false;
  }

  ResetKeyStates();
}

static void CleanupInputResources() {
  StopKeyboardHookThread();
  ReleaseKeyEventCallback();
}

static bool SendUnicodeString(const std::u16string& msg, std::string* errorMessage) {
  if (msg.empty()) {
    return true;
  }

  if (msg.length() > static_cast<size_t>(std::numeric_limits<UINT>::max() / 2)) {
    *errorMessage = "Input string is too long";
    return false;
  }

  size_t inputCount = msg.length() * 2;
  std::vector<INPUT> inputs(inputCount);
  for (size_t i = 0, j = 0; i < msg.length(); ++i, j += 2) {
    wchar_t ch = msg[i];
    inputs[j].type = INPUT_KEYBOARD;
    inputs[j].ki.wVk = 0;
    inputs[j].ki.wScan = ch;
    inputs[j].ki.dwFlags = KEYEVENTF_UNICODE;
    inputs[j].ki.time = 0;
    inputs[j].ki.dwExtraInfo = 0;
    inputs[j + 1].type = INPUT_KEYBOARD;
    inputs[j + 1].ki.wVk = 0;
    inputs[j + 1].ki.wScan = ch;
    inputs[j + 1].ki.dwFlags = KEYEVENTF_UNICODE | KEYEVENTF_KEYUP;
    inputs[j + 1].ki.time = 0;
    inputs[j + 1].ki.dwExtraInfo = 0;
  }

  UINT expected = static_cast<UINT>(inputs.size());
  UINT actual = SendInput(expected, inputs.data(), sizeof(INPUT));
  if (actual != expected) {
    *errorMessage = FormatSendInputError(expected, actual, GetLastError());
    return false;
  }

  return true;
}

static WORD GetScanCode(WORD virtualKeyCode) {
  return static_cast<WORD>(MapVirtualKey(virtualKeyCode, MAPVK_VK_TO_VSC));
}

static bool PressKey(WORD key, bool press, std::string* errorMessage) {
  INPUT input = {0};
  input.type = INPUT_KEYBOARD;
  input.ki.wVk = key;
  input.ki.wScan = GetScanCode(key);
  if (!press) {
    input.ki.dwFlags = KEYEVENTF_KEYUP;
  }

  UINT actual = SendInput(1, &input, sizeof(INPUT));
  if (actual != 1) {
    *errorMessage = FormatSendInputError(1, actual, GetLastError());
    return false;
  }

  return true;
}

Napi::Value InstallHook(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  {
    std::lock_guard<std::mutex> lock(lifecycleMtx);
    if (inputInstalled) {
      return env.Undefined();
    }

    if (keyboardThread.joinable()) {
      Napi::Error::New(env, "Input hook is already starting").ThrowAsJavaScriptException();
      return env.Undefined();
    }

    running.store(true);
    hookSetupComplete = false;
    hookSetupError = ERROR_SUCCESS;
    keyboardThread = std::thread(KeyboardHookThread);
  }

  DWORD setupError = ERROR_SUCCESS;
  std::thread failedThread;
  {
    std::unique_lock<std::mutex> lock(lifecycleMtx);
    hookSetupCv.wait(lock, [] { return hookSetupComplete; });
    setupError = hookSetupError;

    if (setupError == ERROR_SUCCESS) {
      inputInstalled = true;
    } else {
      running.store(false);
      if (keyboardThread.joinable()) {
        failedThread = std::move(keyboardThread);
      }
    }
  }

  if (failedThread.joinable()) {
    failedThread.join();
  }

  if (setupError != ERROR_SUCCESS) {
    Napi::Error::New(env, FormatWindowsError("SetWindowsHookEx", setupError)).ThrowAsJavaScriptException();
  }

  return env.Undefined();
}

Napi::Value UninstallHook(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  CleanupInputResources();
  return env.Undefined();
}

Napi::Value OnKeyEvent(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  if (info.Length() < 1 || !info[0].IsFunction()) {
    Napi::TypeError::New(env, "Expected a function as the first argument").ThrowAsJavaScriptException();
    return env.Undefined();
  }

  Napi::Function callback = info[0].As<Napi::Function>();
  {
    std::lock_guard<std::mutex> lock(tsfnMtx);
    if (tsfnInitialized) {
      tsfn.Release();
      tsfnInitialized = false;
    }

    tsfn = Napi::ThreadSafeFunction::New(
        env,
        callback,
        "KeyEventCallback",
        0,
        1);
    tsfn.Unref(env);
    tsfnInitialized = true;
  }

  return env.Undefined();
}

Napi::Value SendString(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  if (info.Length() < 1 || !info[0].IsString()) {
    Napi::TypeError::New(env, "Expected one string argument").ThrowAsJavaScriptException();
    return env.Undefined();
  }
  std::u16string msg = info[0].As<Napi::String>().Utf16Value();
  auto* worker = new SendKeysWorker(env, msg);
  Napi::Promise promise = worker->GetPromise();
  worker->Queue();
  return promise;
}

Napi::Value SendKey(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  if (info.Length() < 2 || !info[0].IsNumber() || !info[1].IsBoolean()) {
    Napi::TypeError::New(env, "Expected arguments: [uint32, bool]").ThrowAsJavaScriptException();
    return env.Undefined();
  }

  uint32_t keyCode = info[0].As<Napi::Number>().Uint32Value();
  if (keyCode > 255) {
    Napi::RangeError::New(env, "Virtual key code must be between 0 and 255").ThrowAsJavaScriptException();
    return env.Undefined();
  }

  WORD key = static_cast<WORD>(keyCode);
  bool press = info[1].As<Napi::Boolean>().Value();
  auto* worker = new SendKeyWorker(env, key, press);
  Napi::Promise promise = worker->GetPromise();
  worker->Queue();
  return promise;
}

Napi::Value GetKeyStates(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  std::lock_guard<std::mutex> lock(keyStateMtx);
  Napi::Array arr = Napi::Array::New(env, 256);
  for (int vk = 0; vk < 256; ++vk) {
    Napi::Object obj = Napi::Object::New(env);
    obj.Set("vkCode", Napi::Number::New(env, vk));
    obj.Set("pressed", Napi::Boolean::New(env, keyStates[vk]));
    obj.Set("scanCode", Napi::Number::New(env, MapVirtualKey(vk, MAPVK_VK_TO_VSC)));
    arr.Set(vk, obj);
  }
  return arr;
}

SendKeysWorker::SendKeysWorker(const Napi::Env& env, const std::u16string& msg)
    : Napi::AsyncWorker(env), msg(msg), deferred(Napi::Promise::Deferred::New(env)) {
}

void SendKeysWorker::Execute() {
  std::string errorMessage;
  if (!SendUnicodeString(msg, &errorMessage)) {
    SetError(errorMessage);
  }
}

void SendKeysWorker::OnOK() {
  deferred.Resolve(Env().Undefined());
}

void SendKeysWorker::OnError(const Napi::Error& e) {
  deferred.Reject(e.Value());
}

Napi::Promise SendKeysWorker::GetPromise() {
  return deferred.Promise();
}

SendKeyWorker::SendKeyWorker(const Napi::Env& env, WORD key, bool press)
    : Napi::AsyncWorker(env), key(key), press(press), deferred(Napi::Promise::Deferred::New(env)) {
}

void SendKeyWorker::Execute() {
  std::string errorMessage;
  if (!PressKey(key, press, &errorMessage)) {
    SetError(errorMessage);
  }
}

void SendKeyWorker::OnOK() {
  deferred.Resolve(Env().Undefined());
}

void SendKeyWorker::OnError(const Napi::Error& e) {
  deferred.Reject(e.Value());
}

Napi::Promise SendKeyWorker::GetPromise() {
  return deferred.Promise();
}

Napi::Object Init(Napi::Env env, Napi::Object exports) {
  env.AddCleanupHook(CleanupInputResources);

  exports.Set("install", Napi::Function::New(env, InstallHook));
  exports.Set("uninstall", Napi::Function::New(env, UninstallHook));
  exports.Set("onKeyEvent", Napi::Function::New(env, OnKeyEvent));
  exports.Set("sendString", Napi::Function::New(env, SendString));
  exports.Set("sendKey", Napi::Function::New(env, SendKey));
  exports.Set("getKeyStates", Napi::Function::New(env, GetKeyStates));
  return exports;
}

NODE_API_MODULE(input, Init)
