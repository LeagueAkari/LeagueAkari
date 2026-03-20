import { SpawnOptionsWithoutStdio, spawn } from 'node:child_process'

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
  })
}

export async function getCommandLinePowershell(pid: number) {
  const out = await runCommand(POWERSHELL_PATH, [
    ...POWERSHELL_BASE_ARGS,
    `Get-CimInstance -ClassName Win32_Process -Filter "ProcessId=${pid}" -Property CommandLine | Select-Object -ExpandProperty CommandLine`
  ])

  return out.trim()
}
