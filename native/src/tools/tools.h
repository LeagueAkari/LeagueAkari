#ifndef TOOL_H
#define TOOL_H

#include <iostream>
#include <napi.h>
#include <shlobj.h>
#include <stdlib.h>
#include <windows.h>
#include <TlHelp32.h>
#include <winternl.h>

// #include <ntstatus.h>
typedef LONG NTSTATUS;
#define NT_SUCCESS(Status) (((NTSTATUS)(Status)) >= 0)

#define STATUS_BUFFER_OVERFLOW ((NTSTATUS)0x80000005L)
#define STATUS_BUFFER_TOO_SMALL ((NTSTATUS)0xC0000023L)
#define STATUS_INFO_LENGTH_MISMATCH ((NTSTATUS)0xC0000004L)

constexpr wchar_t APPLICATION_CLASS_NAME[] = L"RCLIENT";
constexpr wchar_t APPLICATION_NAME[] = L"League of Legends";
constexpr wchar_t CEF_WINDOW_NAME[] = L"CefBrowserWindow";

// 工具方法
HANDLE OpenProcessFromPid(DWORD pid, DWORD access);
int GetProcessCommandLine1(DWORD pid, WCHAR** pdata, SIZE_T* psize); // undocumented
bool IsProcessForeground(DWORD processID);
bool TerminateProcessByID(DWORD processID);

// 修复客户端不完整显示的问题
Napi::Value FixWindowMethodA(const Napi::CallbackInfo& info);

Napi::String GetCommandLine1(const Napi::CallbackInfo& info);
Napi::Array GetPidsByName(const Napi::CallbackInfo& info);
Napi::Value GetLeagueClientWindowPlacementInfo(const Napi::CallbackInfo& info);
Napi::Value IsElevated(const Napi::CallbackInfo& info);
Napi::Boolean TerminateProcessNode(const Napi::CallbackInfo& info);
Napi::Boolean IsProcessForegroundNode(const Napi::CallbackInfo& info);
Napi::Boolean IsProcessRunningNode(const Napi::CallbackInfo& info);

#endif // TOOL_H