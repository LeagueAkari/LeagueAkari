#ifndef INPUT_H
#define INPUT_H

#include <napi.h>
#include <string>
#include <windows.h>

Napi::Value InstallHook(const Napi::CallbackInfo& info);
Napi::Value UninstallHook(const Napi::CallbackInfo& info);
Napi::Value OnKeyEvent(const Napi::CallbackInfo& info);
Napi::Value SendString(const Napi::CallbackInfo& info);
Napi::Value SendKey(const Napi::CallbackInfo& info);
Napi::Value GetKeyStates(const Napi::CallbackInfo& info);

// 异步 Worker 类声明
class SendKeysWorker : public Napi::AsyncWorker {
public:
  SendKeysWorker(const Napi::Env& env, const std::u16string& msg);
  ~SendKeysWorker() override = default;

  void Execute() override;
  void OnOK() override;
  void OnError(const Napi::Error& e) override;

  Napi::Promise GetPromise();

private:
  std::u16string msg;
  Napi::Promise::Deferred deferred;
};

class SendKeyWorker : public Napi::AsyncWorker {
public:
  SendKeyWorker(const Napi::Env& env, WORD key, bool press);
  ~SendKeyWorker() override = default;

  void Execute() override;
  void OnOK() override;
  void OnError(const Napi::Error& e) override;

  Napi::Promise GetPromise();

private:
  WORD key;
  bool press;
  Napi::Promise::Deferred deferred;
};

#endif // INPUT_H
