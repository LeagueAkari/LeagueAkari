#include "input.h"
#include <condition_variable>
#include <functional>
#include <mutex>
#include <queue>
#include <thread>
#include <vector>

#include <windows.h>

static HHOOK hKeyboardHook;
static std::mutex mtx;
static std::condition_variable cv;
static bool running = true;
static Napi::ThreadSafeFunction tsfn;
static bool tsfnInitialized = false;

static std::queue<std::function<void()>> taskQueue;
static bool sendingThreadRunning = true;
static std::condition_variable taskCv;
static std::mutex taskMtx;

// 全局键状态追踪（0～255）
static std::mutex keyStateMtx;
static bool keyStates[256] = {false};

// 内部实现函数
static LRESULT CALLBACK KeyboardEvent(int nCode, WPARAM wParam, LPARAM lParam) {
  if (nCode == HC_ACTION) {
    KBDLLHOOKSTRUCT* pKeyBoard = reinterpret_cast<KBDLLHOOKSTRUCT*>(lParam);
    int key = pKeyBoard->vkCode;
    std::string action = (wParam == WM_KEYDOWN || wParam == WM_SYSKEYDOWN) ? "DOWN" : "UP";

    // 更新全局键状态
    {
      std::lock_guard<std::mutex> lock(keyStateMtx);
      if (wParam == WM_KEYDOWN || wParam == WM_SYSKEYDOWN) {
        keyStates[key] = true;
      } else if (wParam == WM_KEYUP || wParam == WM_SYSKEYUP) {
        keyStates[key] = false;
      }
    }

    std::string keyEventOutput = std::to_string(key) + "," + action;
    if (tsfnInitialized) {
      tsfn.BlockingCall([keyEventOutput](Napi::Env env, Napi::Function jsCallback) {
        jsCallback.Call({Napi::String::New(env, keyEventOutput)});
      });
    }
  }
  return CallNextHookEx(hKeyboardHook, nCode, wParam, lParam);
}

static void KeyboardHookThread() {
  HINSTANCE hInstance = GetModuleHandle(NULL);
  hKeyboardHook = SetWindowsHookEx(WH_KEYBOARD_LL, KeyboardEvent, hInstance, 0);
  MSG message;
  while (GetMessage(&message, NULL, 0, 0) && running) {
    TranslateMessage(&message);
    DispatchMessage(&message);
  }
  UnhookWindowsHookEx(hKeyboardHook);
}

static void SendTaskThread() {
  while (sendingThreadRunning) {
    std::function<void()> task;
    {
      std::unique_lock<std::mutex> lock(taskMtx);
      taskCv.wait(lock, [] { return !taskQueue.empty() || !sendingThreadRunning; });
      if (!sendingThreadRunning && taskQueue.empty()) {
        return;
      }
      task = std::move(taskQueue.front());
      taskQueue.pop();
    }
    task();
  }
}

static void SendUnicodeString(const std::u16string& msg) {
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
  SendInput(static_cast<UINT>(inputs.size()), &inputs[0], sizeof(INPUT));
}

static WORD GetScanCode(WORD virtualKeyCode) {
  return static_cast<WORD>(MapVirtualKey(virtualKeyCode, MAPVK_VK_TO_VSC));
}

static void PressKey(WORD key, bool press) {
  INPUT input = {0};
  input.type = INPUT_KEYBOARD;
  input.ki.wVk = key;
  input.ki.wScan = GetScanCode(key);
  if (!press) {
    input.ki.dwFlags = KEYEVENTF_KEYUP;
  }
  SendInput(1, &input, sizeof(INPUT));
}

// 对外 API 函数实现

Napi::Value InstallHook(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  std::thread(KeyboardHookThread).detach();
  std::thread(SendTaskThread).detach();
  return env.Undefined();
}

Napi::Value UninstallHook(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  {
    std::lock_guard<std::mutex> lock(mtx);
    running = false;
  }
  {
    std::lock_guard<std::mutex> lock(taskMtx);
    sendingThreadRunning = false;
  }
  taskCv.notify_all();
  cv.notify_one();
  return env.Undefined();
}

Napi::Value OnKeyEvent(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  if (!info[0].IsFunction()) {
    Napi::TypeError::New(env, "Expected a function as the first argument").ThrowAsJavaScriptException();
    return env.Undefined();
  }
  Napi::Function callback = info[0].As<Napi::Function>();
  tsfn = Napi::ThreadSafeFunction::New(
      env,
      callback,
      "KeyEventCallback",
      0,
      1);
  tsfnInitialized = true;
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
  WORD key = static_cast<WORD>(info[0].As<Napi::Number>().Uint32Value());
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

// 异步 Worker 类实现

// SendKeysWorker 实现
SendKeysWorker::SendKeysWorker(const Napi::Env& env, const std::u16string& msg)
    : Napi::AsyncWorker(env), msg(msg), deferred(Napi::Promise::Deferred::New(env)) {
}

void SendKeysWorker::Execute() {
  SendUnicodeString(msg);
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

// SendKeyWorker 实现
SendKeyWorker::SendKeyWorker(const Napi::Env& env, WORD key, bool press)
    : Napi::AsyncWorker(env), key(key), press(press), deferred(Napi::Promise::Deferred::New(env)) {
}

void SendKeyWorker::Execute() {
  PressKey(key, press);
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
  exports.Set("install", Napi::Function::New(env, InstallHook));
  exports.Set("uninstall", Napi::Function::New(env, UninstallHook));
  exports.Set("onKeyEvent", Napi::Function::New(env, OnKeyEvent));
  exports.Set("sendString", Napi::Function::New(env, SendString));
  exports.Set("sendKey", Napi::Function::New(env, SendKey));
  exports.Set("getKeyStates", Napi::Function::New(env, GetKeyStates));
  return exports;
}

NODE_API_MODULE(input, Init)
