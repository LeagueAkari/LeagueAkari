#ifndef LEAGUE_AKARI_NATIVE_TOOLS_H
#define LEAGUE_AKARI_NATIVE_TOOLS_H

#include <iostream>
#include <napi.h>
#include <shlobj.h>
#include <stdlib.h>
#include <string>
#include <windows.h>
#include <TlHelp32.h>
#include <winternl.h>

#ifndef STATUS_BUFFER_OVERFLOW
#define STATUS_BUFFER_OVERFLOW ((NTSTATUS)0x80000005L)
#endif

#ifndef STATUS_BUFFER_TOO_SMALL
#define STATUS_BUFFER_TOO_SMALL ((NTSTATUS)0xC0000023L)
#endif

#ifndef STATUS_INFO_LENGTH_MISMATCH
#define STATUS_INFO_LENGTH_MISMATCH ((NTSTATUS)0xC0000004L)
#endif

constexpr wchar_t APPLICATION_CLASS_NAME[] = L"RCLIENT";
constexpr wchar_t APPLICATION_NAME[] = L"League of Legends";
constexpr wchar_t CEF_WINDOW_NAME[] = L"CefBrowserWindow";

HANDLE OpenProcessFromPid(DWORD pid, DWORD access);
int GetProcessCommandLine1(DWORD pid, std::wstring* commandLine); // undocumented
bool IsProcessForeground(DWORD processID);
bool TerminateProcessByID(DWORD processID);

Napi::Value FixWindowMethodA(const Napi::CallbackInfo& info);

Napi::String GetCommandLine1(const Napi::CallbackInfo& info);
Napi::Array GetPidsByName(const Napi::CallbackInfo& info);
Napi::Value GetLeagueClientWindowPlacementInfo(const Napi::CallbackInfo& info);
Napi::Value IsElevated(const Napi::CallbackInfo& info);
Napi::Boolean TerminateProcessNode(const Napi::CallbackInfo& info);
Napi::Boolean IsProcessForegroundNode(const Napi::CallbackInfo& info);
Napi::Boolean IsProcessRunningNode(const Napi::CallbackInfo& info);

#endif // LEAGUE_AKARI_NATIVE_TOOLS_H
