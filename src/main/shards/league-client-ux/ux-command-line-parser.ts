import { getProcessCommandLineOption } from '@main/native/process-command-line'
import { UxCommandLine } from '@shared/shards/league-client-ux'

/**
 * 来自 Riot 的证书文件
 */
export const RIOT_CERTIFICATE = `-----BEGIN CERTIFICATE-----
MIIEIDCCAwgCCQDJC+QAdVx4UDANBgkqhkiG9w0BAQUFADCB0TELMAkGA1UEBhMC
VVMxEzARBgNVBAgTCkNhbGlmb3JuaWExFTATBgNVBAcTDFNhbnRhIE1vbmljYTET
MBEGA1UEChMKUmlvdCBHYW1lczEdMBsGA1UECxMUTG9MIEdhbWUgRW5naW5lZXJp
bmcxMzAxBgNVBAMTKkxvTCBHYW1lIEVuZ2luZWVyaW5nIENlcnRpZmljYXRlIEF1
dGhvcml0eTEtMCsGCSqGSIb3DQEJARYeZ2FtZXRlY2hub2xvZ2llc0ByaW90Z2Ft
ZXMuY29tMB4XDTEzMTIwNDAwNDgzOVoXDTQzMTEyNzAwNDgzOVowgdExCzAJBgNV
BAYTAlVTMRMwEQYDVQQIEwpDYWxpZm9ybmlhMRUwEwYDVQQHEwxTYW50YSBNb25p
Y2ExEzARBgNVBAoTClJpb3QgR2FtZXMxHTAbBgNVBAsTFExvTCBHYW1lIEVuZ2lu
ZWVyaW5nMTMwMQYDVQQDEypMb0wgR2FtZSBFbmdpbmVlcmluZyBDZXJ0aWZpY2F0
ZSBBdXRob3JpdHkxLTArBgkqhkiG9w0BCQEWHmdhbWV0ZWNobm9sb2dpZXNAcmlv
dGdhbWVzLmNvbTCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBAKoJemF/
6PNG3GRJGbjzImTdOo1OJRDI7noRwJgDqkaJFkwv0X8aPUGbZSUzUO23cQcCgpYj
21ygzKu5dtCN2EcQVVpNtyPuM2V4eEGr1woodzALtufL3Nlyh6g5jKKuDIfeUBHv
JNyQf2h3Uha16lnrXmz9o9wsX/jf+jUAljBJqsMeACOpXfuZy+YKUCxSPOZaYTLC
y+0GQfiT431pJHBQlrXAUwzOmaJPQ7M6mLfsnpHibSkxUfMfHROaYCZ/sbWKl3lr
ZA9DbwaKKfS1Iw0ucAeDudyuqb4JntGU/W0aboKA0c3YB02mxAM4oDnqseuKV/CX
8SQAiaXnYotuNXMCAwEAATANBgkqhkiG9w0BAQUFAAOCAQEAf3KPmddqEqqC8iLs
lcd0euC4F5+USp9YsrZ3WuOzHqVxTtX3hR1scdlDXNvrsebQZUqwGdZGMS16ln3k
WObw7BbhU89tDNCN7Lt/IjT4MGRYRE+TmRc5EeIXxHkQ78bQqbmAI3GsW+7kJsoO
q3DdeE+M+BUJrhWorsAQCgUyZO166SAtKXKLIcxa+ddC49NvMQPJyzm3V+2b1roP
SvD2WV8gRYUnGmy/N0+u6ANq5EsbhZ548zZc+BI4upsWChTLyxt2RxR7+uGlS1+5
EcGfKZ+g024k/J32XP4hdho7WYAS2xMiV83CfLR/MNi8oSMaVQTdKD8cpgiWJk3L
XWehWA==
-----END CERTIFICATE-----`

export interface UxCommandLinePaths {
  applicationDirectory: string | null
  installationDirectory: string | null
}

function getNumericOption(commandLine: string, names: string | readonly string[]) {
  const value = getProcessCommandLineOption(commandLine, names)
  if (!value || !/^\d+$/.test(value)) {
    return null
  }

  const number = Number(value)
  return Number.isSafeInteger(number) ? number : null
}

function getPortOption(commandLine: string, name: string) {
  const port = getNumericOption(commandLine, name)
  return port !== null && port > 0 && port <= 65_535 ? port : null
}

export function parseUxCommandLinePaths(commandLine: string): UxCommandLinePaths {
  return {
    applicationDirectory:
      getProcessCommandLineOption(commandLine, ['app-directory', 'app_directory', 'app-root']) ??
      null,
    installationDirectory:
      getProcessCommandLineOption(commandLine, [
        'install-directory',
        'install_directory',
        'product-install-path',
        'product_install_full_path'
      ]) ?? null
  }
}

export function parseCommandLine(s: string): UxCommandLine | null {
  const port = getPortOption(s, 'app-port')
  const password = getProcessCommandLineOption(s, 'remoting-auth-token')
  const pid = getNumericOption(s, 'app-pid')
  // Some clients use `--rso_platform_id`, others use `--rso-platform-id`.
  const rsoPlatformId = getProcessCommandLineOption(s, ['rso_platform_id', 'rso-platform-id']) ?? ''
  const region = getProcessCommandLineOption(s, 'region') ?? ''
  const riotClientPort = getPortOption(s, 'riotclient-app-port') ?? 0
  const riotClientAuth = getProcessCommandLineOption(s, 'riotclient-auth-token') ?? ''

  if (port === null || !password || pid === null || pid <= 0) {
    return null
  }

  return {
    port,
    pid,
    authToken: password,
    rsoPlatformId,
    region,
    certificate: RIOT_CERTIFICATE,
    riotClientPort,
    riotClientAuthToken: riotClientAuth
  }
}
