import { SpawnOptionsWithoutStdio, spawn } from 'node:child_process'

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

export interface UxCommandLine {
  port: number
  pid: number
  authToken: string
  certificate: string
  region: string
  rsoPlatformId: string
  riotClientPort: number
  riotClientAuthToken: string
}

const POWERSHELL_PATH = 'powershell'
const POWERSHELL_BASE_ARGS = [
  '-NoProfile',
  '-NonInteractive',
  '-ExecutionPolicy',
  'Bypass',
  '-Command'
]

function runCommand(
  command: string,
  args: string[] = [],
  options?: SpawnOptionsWithoutStdio
): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, options)
    let stdout = ''
    let stderr = ''

    child.stdout.on('data', (data) => {
      stdout += data.toString()
    })

    child.stderr.on('data', (data) => {
      stderr += data.toString()
    })

    child.on('error', (error) => {
      reject(error)
    })

    child.on('close', (code) => {
      if (code === 0) {
        resolve(stdout)
      } else {
        reject(new Error(`command failed with code ${code}: ${stderr}`))
      }
    })

    child.on('rejected', (error) => {
      console.log('an error occurred on executing command: ', error, command, args)
      reject(error)
    })
  })
}

const portRegex = /--app-port=([0-9]+)/
const remotingAuth = /--remoting-auth-token=([\w-_]+)/
const pidRegex = /--app-pid=([0-9]+)/
const rsoPlatformIdRegex = /--rso_platform_id=([\w-_]+)/
const regionRegex = /--region=([\w-_]+)/
const riotClientPortRegex = /--riotclient-app-port=([0-9]+)/
const riotClientAuthRegex = /--riotclient-auth-token=([\w-_]+)/

export function parseCommandLine(s: string): UxCommandLine | null {
  const [, port] = s.match(portRegex) || []
  const [, password] = s.match(remotingAuth) || []
  const [, pid] = s.match(pidRegex) || []
  const [, rsoPlatformId = ''] = s.match(rsoPlatformIdRegex) || []
  const [, region = ''] = s.match(regionRegex) || []
  const [, riotClientPort = ''] = s.match(riotClientPortRegex) || []
  const [, riotClientAuth = ''] = s.match(riotClientAuthRegex) || []

  if (!port || !password || !pid) {
    return null
  }

  return {
    port: Number(port),
    pid: Number(pid),
    authToken: password,
    rsoPlatformId,
    region,
    certificate: RIOT_CERTIFICATE,
    riotClientPort: Number(riotClientPort),
    riotClientAuthToken: riotClientAuth
  }
}

export async function queryUxCommandLine(clientName: string): Promise<UxCommandLine[]> {
  if (process.platform !== 'win32') {
    try {
      const out = runCommand('ps', ['axww', '-o', 'pid=,command='])
      const text = await out
      const needleA = clientName
      const needleB = clientName.replace(/\.exe$/i, '')

      const authObjects = text
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean)
        .filter((line) => line.includes(needleA) || (needleB && line.includes(needleB)))
        .map((line) => line.replace(/^\d+\s+/, ''))
        .map(parseCommandLine)
        .filter(Boolean) as UxCommandLine[]

      return authObjects
    } catch {
      return []
    }
  }

  const out = await runCommand(POWERSHELL_PATH, [
    ...POWERSHELL_BASE_ARGS,
    `Get-CimInstance -ClassName Win32_Process -Filter "Name='${clientName}'" -Property CommandLine | Select-Object -ExpandProperty CommandLine`
  ])

  const authObjects = out
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
    .map(parseCommandLine)
    .filter(Boolean) as UxCommandLine[]

  return authObjects
}
