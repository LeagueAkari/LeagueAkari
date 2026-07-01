import { IAkariShardInitDispose, Shard } from '@shared/akari-shard'
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import iconv from 'iconv-lite'

import { AkariIpcError, AkariIpcMain } from '../ipc'
import { LeagueClientMain } from '../league-client'
import { LeagueClientUxMain } from '../league-client-ux'
import { AkariLogger, LoggerFactoryMain } from '../logger-factory'
import { QQAccountMain } from '../qq-account'
import { SettingFactoryMain } from '../setting-factory'
import { SetterSettingService } from '../setting-factory/setter-setting-service'
import { AutoLoginCSettings } from './types'

const CLIENT_TIMEOUT = 120000

@Shard(AutoLoginC.id)
export class AutoLoginC implements IAkariShardInitDispose {
  static id = 'auto-login-c-main'
  static dependencies = [
    AkariIpcMain.id, LoggerFactoryMain.id, QQAccountMain.id,
    LeagueClientUxMain.id, LeagueClientMain.id, SettingFactoryMain.id
  ]
  public readonly settings = new AutoLoginCSettings()
  private readonly _log: AkariLogger
  private readonly _setting: SetterSettingService

  constructor(
    private readonly _ipc: AkariIpcMain,
    private readonly _loggerFactory: LoggerFactoryMain,
    private readonly _qqAccount: QQAccountMain,
    private readonly _ux: LeagueClientUxMain,
    private readonly _lc: LeagueClientMain,
    private readonly _settingFactory: SettingFactoryMain
  ) {
    this._log = _loggerFactory.create(AutoLoginC.id)
    this._setting = _settingFactory.register(
      AutoLoginC.id,
      {
        gamePath: { default: this.settings.gamePath },
        toolPath: { default: this.settings.toolPath }
      },
      this.settings
    )
  }

  async onInit() {
    await this._setting.applyToState()
    this._ipc.onCall(AutoLoginC.id, 'autoLogin', (_, id: string) => this.autoLogin(id))
    this._ipc.onCall(AutoLoginC.id, 'getGamePath', () => this.settings.gamePath)
    this._ipc.onCall(AutoLoginC.id, 'setGamePath', (_, p: string) => this._setting.set('gamePath', p))
    this._ipc.onCall(AutoLoginC.id, 'getToolPath', () => this.settings.toolPath)
    this._ipc.onCall(AutoLoginC.id, 'setToolPath', (_, p: string) => this._setting.set('toolPath', p))
    this._ipc.onCall(AutoLoginC.id, 'detectGamePath', () => this._detectGamePath())
    this._ipc.onCall(AutoLoginC.id, 'detectToolPath', () => this._detectToolPath())
  }

  async onDispose() {}

  private async _detectGamePath(): Promise<string | null> {
    const launched = this._ux.state.launchedClients
    if (launched.length > 0) {
      try {
        const cmdLine = fs.readFileSync(`/proc/${launched[0].pid}/cmdline`, 'utf8').split('\0')[0]
        if (cmdLine) return path.resolve(path.dirname(cmdLine), '..', '..')
      } catch {}
    }
    for (const c of [
      'E:\\WeGameApps\\英雄联盟', 'D:\\WeGameApps\\英雄联盟', 'C:\\WeGameApps\\英雄联盟',
      'E:\\Games\\League of Legends', 'D:\\Games\\League of Legends', 'C:\\Games\\League of Legends'
    ]) {
      if (fs.existsSync(path.join(c, 'Launcher', 'Client.exe'))) return c
      if (fs.existsSync(path.join(c, 'TCLS', 'Client.exe'))) return c
    }
    return null
  }

  async autoLogin(accountId: string): Promise<void> {
    const accounts = await this._qqAccount.listAccounts()
    const account = accounts.find((a) => a.id === accountId)
    if (!account) throw new AkariIpcError('账号不存在', 'AccountNotFound')
    if (this._lc.state.connectionState === 'connected') throw new AkariIpcError('已有客户端连接', 'AlreadyConnected')

    const pwd = await this._qqAccount.getDecryptedPassword(accountId)
    if (!pwd) throw new AkariIpcError('未设置密码', 'NoPassword')

    const toolPath = this.settings.toolPath || this._defaultToolPath()
    if (!fs.existsSync(toolPath)) throw new AkariIpcError('未找到登录工具', 'NoToolPath')

    this._failReason = null

    // 写凭据到工具的 set.ini（含用户设定的游戏路径）
    const gamePath = this.settings.gamePath || 'E:\\WeGameApps\\英雄联盟'
    const cfgPath = await this._writeToolConfig(toolPath, account.qq, pwd, account.area, gamePath)
    this._log.info(`AutoLoginC: launching tool for ***${account.qq.slice(-4)}`)

    // 关旧的 RiotClient/LeagueClient
    this._killExisting()

    // 启工具
    const toolDir = path.dirname(toolPath)
    const toolProc = spawn(toolPath, [], {
      cwd: toolDir,
      detached: true,
      stdio: 'ignore',
      windowsHide: true
    })
    toolProc.unref()

    let statusProc: ReturnType<typeof spawn> | null = null
    try {
      // 等窗口出现（工具需时间初始化）
      await this._sleep(2000)
      await this._clickToolLoginButton(toolProc.pid!)
      this._log.info('AutoLoginC: login button clicked')
      this._emitStatus('login_clicked', 'AutoLogin Service Start')

      // 启状态轮询进程（读工具窗口顶部Label文本）
      statusProc = this._spawnStatusPoller(toolProc.pid!)

      // 等LeagueClient启动
      this._log.info('AutoLoginC: waiting for LeagueClient...')
      const ok = await this._pollForLcu(CLIENT_TIMEOUT)
      if (!ok) {
        if (this._failReason) throw new AkariIpcError(this._failReason, 'ToolFail')
        throw new AkariIpcError('LeagueClient 启动超时', 'LcuTimeout')
      }
      this._log.info('AutoLoginC: done')
      this._emitStatus('success', '登录成功')
    } catch (e: any) {
      this._emitStatus('error', e.message || String(e))
      throw e
    } finally {
      if (statusProc && !statusProc.killed) { try { statusProc.kill() } catch {} }
      // 杀工具进程 + 子进程（登录器.exe + Plugins/exe.exe）
      this._killTool(toolProc.pid!)
      // 删除set.ini凭据（工具已读完配置）
      try { fs.unlinkSync(cfgPath) } catch {}
    }
  }

  private _killTool(pid: number): void {
    // taskkill /T 递归杀进程树；/F 强杀
    try {
      spawn('taskkill', ['/PID', String(pid), '/T', '/F'], { stdio: 'ignore' })
    } catch {}
    // 补：按名字杀 exe.exe（ASCII安全，登录器.exe名字含中文交由/T递归处理）
    try { spawn('taskkill', ['/F', '/IM', 'exe.exe'], { stdio: 'ignore' }) } catch {}
  }

  private _emitStatus(state: string, message: string): void {
    this._log.info(`AutoLoginC status: [${state}] ${message}`)
    this._ipc.sendEvent(AutoLoginC.id, 'status', { state, message, at: Date.now() })
  }

  private _spawnStatusPoller(toolPid: number): ReturnType<typeof spawn> {
    const psPath = path.join(process.cwd(), 'tool', '_poll.ps1')
    const script = `
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
using System.Text;
public class SP {
    [DllImport("user32.dll")] public static extern bool EnumWindows(EWP cb, IntPtr l);
    [DllImport("user32.dll")] public static extern bool EnumChildWindows(IntPtr h, ECP cb, IntPtr l);
    [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr h, out uint pid);
    [DllImport("user32.dll")] public static extern int GetClassName(IntPtr h, StringBuilder s, int n);
    [DllImport("user32.dll")] public static extern int GetWindowText(IntPtr h, StringBuilder s, int n);
    [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr h, out RECT r);
    public delegate bool EWP(IntPtr h, IntPtr l);
    public delegate bool ECP(IntPtr h, IntPtr l);
    [StructLayout(LayoutKind.Sequential)] public struct RECT { public int L,T,R,B; }
}
'@
$targetPid = ${toolPid}
$mainWin = [IntPtr]::Zero
[SP]::EnumWindows({
    param($w,$l)
    $p = [uint32]0
    [SP]::GetWindowThreadProcessId($w, [ref]$p) | Out-Null
    if ($p -eq $targetPid) {
        $tsb = New-Object System.Text.StringBuilder(80)
        [SP]::GetWindowText($w, $tsb, 80) | Out-Null
        if ($tsb.Length -gt 0) { $script:mainWin = $w; return $false }
    }
    return $true
}, [IntPtr]::Zero) | Out-Null
if ($mainWin -eq [IntPtr]::Zero) { [Console]::WriteLine("NOWIN"); exit }
$lastText = ""
for ($i = 0; $i -lt 120; $i++) {
    $statusText = ""
    [SP]::EnumChildWindows($mainWin, {
        param($ch,$cl)
        $csb = New-Object System.Text.StringBuilder(60)
        [SP]::GetClassName($ch, $csb, 60) | Out-Null
        $c = $csb.ToString()
        if ($c -ne '_EL_Label') { return $true }
        $r = New-Object SP+RECT
        [SP]::GetWindowRect($ch, [ref]$r) | Out-Null
        $wid = $r.R - $r.L
        # 顶部状态Label宽>=200（字段签均<=100）
        if ($wid -lt 200) { return $true }
        $tsb = New-Object System.Text.StringBuilder(200)
        [SP]::GetWindowText($ch, $tsb, 200) | Out-Null
        $t = $tsb.ToString()
        if ($t.Length -gt 0) { $script:statusText = $t }
        return $true
    }, [IntPtr]::Zero) | Out-Null
    if ($statusText -ne "" -and $statusText -ne $lastText) {
        [Console]::WriteLine("STATUS:" + $statusText)
        [Console]::Out.Flush()
        $lastText = $statusText
    }
    Start-Sleep -Milliseconds 500
}
`
    fs.writeFileSync(psPath, script, 'utf8')
    const proc = spawn('powershell', [
      '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', psPath
    ], { stdio: ['ignore', 'pipe', 'pipe'] })
    let buf = ''
    proc.stdout?.on('data', (chunk: Buffer) => {
      buf += chunk.toString('utf8')
      let idx
      while ((idx = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, idx).trim()
        buf = buf.slice(idx + 1)
        if (line.startsWith('STATUS:')) {
          const text = line.slice(7)
          // 过滤字段签（以冒号结尾如"大区:"/"账号:"/"密码:"）
          if (text.endsWith(':') || text.endsWith('：') || text.length < 5) continue
          this._emitStatus('tool_status', text)
          const failKw = this._detectFail(text)
          if (failKw) this._failReason = `工具报错: ${text} (匹配 ${failKw})`
        }
      }
    })
    proc.on('exit', () => { try { fs.unlinkSync(psPath) } catch {} })
    return proc
  }

  private _defaultToolPath(): string {
    // 测试用：优先查 LeagueGanYu-test/tool（避免污染源目录）
    const testToolDir = 'C:\\dev\\LeagueGanYu-test\\tool'
    try {
      for (const f of fs.readdirSync(testToolDir)) {
        if (!f.endsWith('.exe')) continue
        const fp = path.join(testToolDir, f)
        if (fp.includes('Plugins')) continue
        try { if (fs.statSync(fp).size > 1_000_000) return fp } catch {}
      }
    } catch {}

    const toolDir = path.join(process.cwd(), 'tool')
    try {
      for (const f of fs.readdirSync(toolDir)) {
        if (!f.endsWith('.exe')) continue
        const fp = path.join(toolDir, f)
        if (fp.includes('Plugins')) continue
        try { if (fs.statSync(fp).size > 1_000_000) return fp } catch {}
      }
    } catch {}

    const downloadDir = path.join(process.env.USERPROFILE || 'C:\\Users\\admin', 'Downloads')
    return this._findToolInDir(downloadDir, 4) || ''
  }

  private _findToolInDir(dir: string, depth: number): string | null {
    if (depth < 0) return null
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true })
      for (const entry of entries) {
        if (!entry.isDirectory()) continue
        const dp = path.join(dir, entry.name)
        // 此目录是否为工具根目录：含 set.ini + data/ 子目录
        if (fs.existsSync(path.join(dp, 'set.ini')) &&
            fs.statSync(path.join(dp, 'data')).isDirectory()) {
          for (const f of fs.readdirSync(dp)) {
            if (!f.endsWith('.exe')) continue
            const fp = path.join(dp, f)
            if (fp.includes('Plugins')) continue
            try { if (fs.statSync(fp).size > 1_000_000) return fp } catch {}
          }
        }
        // 递归子目录
        const found = this._findToolInDir(dp, depth - 1)
        if (found) return found
      }
    } catch {}
    return null
  }

  private async _writeToolConfig(toolPath: string, qq: string, pwd: string, area: string, gamePathStr: string): Promise<string> {
    const dir = path.dirname(toolPath)
    const cfgPath = path.join(dir, 'set.ini')

    // GBK key markers as Buffer for binary search/replace
    // 编辑框_帐号=  in GBK: B1 E0 BC AD BF F2 5F D5 CA BA C5 3D
    const keyQq = Buffer.from([0xB1, 0xE0, 0xBC, 0xAD, 0xBF, 0xF2, 0x5F, 0xD5, 0xCA, 0xBA, 0xC5, 0x3D])
    // 编辑框_密码=  in GBK: B1 E0 BC AD BF F2 5F C3 DC C2 EB 3D
    const keyPwd = Buffer.from([0xB1, 0xE0, 0xBC, 0xAD, 0xBF, 0xF2, 0x5F, 0xC3, 0xDC, 0xC2, 0xEB, 0x3D])
    // 编辑框_游戏路径= in GBK
    const keyGamePath = Buffer.from([0xB1, 0xE0, 0xBC, 0xAD, 0xBF, 0xF2, 0x5F, 0xD3, 0xCE, 0xCF, 0xB7, 0xC2, 0xB7, 0xBE, 0xB6, 0x3D])
    // 用户路径 UTF-8 → GBK bytes（结尾补 \\ 与工具原格式对齐）
    const gamePathGbk = iconv.encode(gamePathStr.endsWith('\\') ? gamePathStr : gamePathStr + '\\', 'gbk')

    let buf: Buffer
    if (fs.existsSync(cfgPath)) {
      // 读现有文件，替换账号密码行（保留组合框等节）
      buf = fs.readFileSync(cfgPath)
    } else {
      // 新建最小 set.ini（含编辑框 + 组合框默认大区）
      const crlf = Buffer.from('\r\n', 'ascii')
      // [编辑框]
      const s1 = Buffer.from([0x5B, 0xB1, 0xE0, 0xBC, 0xAD, 0xBF, 0xF2, 0x5D])
      const keyPath = keyGamePath
      const gamePath = gamePathGbk
      // [组合框]
      const s2 = Buffer.from([0x5B, 0xD7, 0xE9, 0xBA, 0xCF, 0xBF, 0xF2, 0x5D])
      // 组合框_游戏大区=艾欧尼亚<|>0
      const keyZone = Buffer.from([0xD7, 0xE9, 0xBA, 0xCF, 0xBF, 0xF2, 0x5F, 0xD3, 0xCE, 0xCF, 0xB7, 0xB4, 0xF3, 0xC7, 0xF8, 0x3D])
      const defZone = this._fullZoneList(area)
      // [编辑框] 节内预置空 keyPwd= 和 keyQq= 行（后续 _replaceLine 填值）
      buf = Buffer.concat([
        s1, crlf,
        keyPwd, crlf,
        keyPath, gamePath, crlf,
        keyQq, crlf,
        crlf,
        s2, crlf,
        keyZone, defZone, crlf
      ])
    }

    buf = this._replaceLine(buf, keyQq, Buffer.from(qq, 'ascii'))
    buf = this._replaceLine(buf, keyPwd, Buffer.from(pwd, 'ascii'))
    buf = this._replaceLine(buf, keyGamePath, gamePathGbk)

    // 确保存在 [组合框] 节
    if (buf.indexOf(Buffer.from([0x5B, 0xD7, 0xE9, 0xBA, 0xCF, 0xBF, 0xF2, 0x5D])) < 0) {
      const crlf = Buffer.from('\r\n', 'ascii')
      const s2 = Buffer.from([0x5B, 0xD7, 0xE9, 0xBA, 0xCF, 0xBF, 0xF2, 0x5D])
      const keyZone = Buffer.from([0xD7, 0xE9, 0xBA, 0xCF, 0xBF, 0xF2, 0x5F, 0xD3, 0xCE, 0xCF, 0xB7, 0xB4, 0xF3, 0xC7, 0xF8, 0x3D])
      const defZone = this._fullZoneList(area)
      buf = Buffer.concat([buf, crlf, s2, crlf, keyZone, defZone, crlf])
    } else {
      // 已存在则替换 组合框_游戏大区= 行
      const keyZone = Buffer.from([0xD7, 0xE9, 0xBA, 0xCF, 0xBF, 0xF2, 0x5F, 0xD3, 0xCE, 0xCF, 0xB7, 0xB4, 0xF3, 0xC7, 0xF8, 0x3D])
      buf = this._replaceLine(buf, keyZone, this._fullZoneList(area))
    }
    fs.writeFileSync(cfgPath, buf, { mode: 0o600 })
    // 调试：log大区行的hex
    const zoneKeyMarker = Buffer.from([0xD7, 0xE9, 0xBA, 0xCF, 0xBF, 0xF2, 0x5F, 0xD3, 0xCE, 0xCF, 0xB7, 0xB4, 0xF3, 0xC7, 0xF8, 0x3D])
    const zIdx = buf.indexOf(zoneKeyMarker)
    if (zIdx >= 0) {
      const end = buf.indexOf(0x0D, zIdx)
      const zoneLine = buf.subarray(zIdx, end > 0 ? end : buf.length)
      this._log.info(`AutoLoginC: set.ini zone line (${zoneLine.length}b) tail: ${zoneLine.subarray(-20).toString('hex')}`)
    }
    return cfgPath
  }

  // 大区名 → GBK bytes 映射
  private _areaGbk(area: string): Buffer | null {
    const m: Record<string, number[]> = {
      '艾欧尼亚': [0xB0, 0xAC, 0xC5, 0xB7, 0xC4, 0xE1, 0xD1, 0xC7],
      '黑色玫瑰': [0xBA, 0xDA, 0xC9, 0xAB, 0xC3, 0xB5, 0xB9, 0xE5],
      '比尔吉沃特': [0xB1, 0xC8, 0xB6, 0xFB, 0xBC, 0xAA, 0xCE, 0xD6, 0xCC, 0xD8],
      '祖安': [0xD7, 0xE6, 0xB0, 0xB2],
      '诺克萨斯': [0xC5, 0xB5, 0xBF, 0xCB, 0xC8, 0xF8, 0xCB, 0xB9],
      '班德尔城': [0xB0, 0xE0, 0xB5, 0xC2, 0xB6, 0xFB, 0xB3, 0xC7],
      '德玛西亚': [0xB5, 0xC2, 0xC2, 0xEA, 0xCE, 0xF7, 0xD1, 0xC7],
      '皮尔特沃夫': [0xC6, 0xA4, 0xB6, 0xFB, 0xCC, 0xD8, 0xCE, 0xD6, 0xB7, 0xF2],
      '战争学院': [0xD5, 0xBD, 0xD5, 0xF9, 0xD1, 0xA7, 0xD4, 0xBA],
      '弗雷尔卓德': [0xB8, 0xA5, 0xC0, 0xD7, 0xB6, 0xFB, 0xD7, 0xBF, 0xB5, 0xC2],
      '巨神峰': [0xBE, 0xDE, 0xC9, 0xF1, 0xB7, 0xE5],
      '雷瑟守备': [0xC0, 0xD7, 0xC9, 0xAA, 0xCA, 0xD8, 0xB1, 0xB8],
      '无畏先锋': [0xCE, 0xDE, 0xCE, 0xB7, 0xCF, 0xC8, 0xB7, 0xE6],
      '裁决之地': [0xB2, 0xC3, 0xBE, 0xF6, 0xD6, 0xAE, 0xB5, 0xD8],
      '暗影岛': [0xB0, 0xB5, 0xD3, 0xB0, 0xB5, 0xBA],
      '钢铁烈阳': [0xB8, 0xD6, 0xCC, 0xFA, 0xC1, 0xD2, 0xD1, 0xF4],
      '水晶之痕': [0xCB, 0xAE, 0xBE, 0xA7, 0xD6, 0xAE, 0xBA, 0xDB],
      '影流': [0xD3, 0xB0, 0xC1, 0xF7],
      '守望之海': [0xCA, 0xD8, 0xCD, 0xFB, 0xD6, 0xAE, 0xBA, 0xA3],
      '征服之海': [0xD5, 0xF7, 0xB7, 0xFE, 0xD6, 0xAE, 0xBA, 0xA3],
      '恕瑞玛': [0xCB, 0xA1, 0xC8, 0xF0, 0xC2, 0xEA],
      '扭曲丛林': [0xC5, 0xA4, 0xC7, 0xFA, 0xB4, 0xD4, 0xC1, 0xD6],
      '卡拉曼达': [0xBF, 0xA8, 0xC0, 0xAD, 0xC2, 0xFC, 0xB4, 0xEF],
      '皮城警备': [0xC6, 0xA4, 0xB3, 0xC7, 0xBE, 0xAF, 0xB1, 0xB8],
      '巨龙之巢': [0xBE, 0xDE, 0xC1, 0xFA, 0xD6, 0xAE, 0xB3, 0xB2],
      '男爵领域': [0xC4, 0xD0, 0xBE, 0xF4, 0xC1, 0xEC, 0xD3, 0xF2],
      '均衡教派': [0xBE, 0xF9, 0xBA, 0xE2, 0xBD, 0xCC, 0xC5, 0xC9],
      '峡谷之巅': [0xCF, 0xBF, 0xB9, 0xC8, 0xD6, 0xAE, 0xE1, 0xDB],
      '教育网专区': [0xBD, 0xCC, 0xD3, 0xFD, 0xCD, 0xF8, 0xD7, 0xA8, 0xC7, 0xF8]
    }
    return m[area] ? Buffer.from(m[area]) : null
  }

  private _fullZoneList(area: string): Buffer {
    const listPart = Buffer.from([
      0xB0, 0xAC, 0xC5, 0xB7, 0xC4, 0xE1, 0xD1, 0xC7, 0x3C, 0x7C, 0x3E, 0x30, 0x3C, 0x7C, 0x7C, 0x3E,
      0xD7, 0xE6, 0xB0, 0xB2, 0x3C, 0x7C, 0x3E, 0x30, 0x3C, 0x7C, 0x7C, 0x3E, 0xC5, 0xB5, 0xBF, 0xCB,
      0xC8, 0xF8, 0xCB, 0xB9, 0x3C, 0x7C, 0x3E, 0x30, 0x3C, 0x7C, 0x7C, 0x3E, 0xB0, 0xE0, 0xB5, 0xC2,
      0xB6, 0xFB, 0xB3, 0xC7, 0x3C, 0x7C, 0x3E, 0x30, 0x3C, 0x7C, 0x7C, 0x3E, 0xC6, 0xA4, 0xB6, 0xFB,
      0xCC, 0xD8, 0xCE, 0xD6, 0xB7, 0xF2, 0x3C, 0x7C, 0x3E, 0x30, 0x3C, 0x7C, 0x7C, 0x3E, 0xD5, 0xBD,
      0xD5, 0xF9, 0xD1, 0xA7, 0xD4, 0xBA, 0x3C, 0x7C, 0x3E, 0x30, 0x3C, 0x7C, 0x7C, 0x3E, 0xBE, 0xDE,
      0xC9, 0xF1, 0xB7, 0xE5, 0x3C, 0x7C, 0x3E, 0x30, 0x3C, 0x7C, 0x7C, 0x3E, 0xC0, 0xD7, 0xC9, 0xAA,
      0xCA, 0xD8, 0xB1, 0xB8, 0x3C, 0x7C, 0x3E, 0x30, 0x3C, 0x7C, 0x7C, 0x3E, 0xB8, 0xD6, 0xCC, 0xFA,
      0xC1, 0xD2, 0xD1, 0xF4, 0x3C, 0x7C, 0x3E, 0x30, 0x3C, 0x7C, 0x7C, 0x3E, 0xB2, 0xC3, 0xBE, 0xF6,
      0xD6, 0xAE, 0xB5, 0xD8, 0x3C, 0x7C, 0x3E, 0x30, 0x3C, 0x7C, 0x7C, 0x3E, 0xBA, 0xDA, 0xC9, 0xAB,
      0xC3, 0xB5, 0xB9, 0xE5, 0x3C, 0x7C, 0x3E, 0x30, 0x3C, 0x7C, 0x7C, 0x3E, 0xB0, 0xB5, 0xD3, 0xB0,
      0xB5, 0xBA, 0x3C, 0x7C, 0x3E, 0x30, 0x3C, 0x7C, 0x7C, 0x3E, 0xBE, 0xF9, 0xBA, 0xE2, 0xBD, 0xCC,
      0xC5, 0xC9, 0x3C, 0x7C, 0x3E, 0x30, 0x3C, 0x7C, 0x7C, 0x3E, 0xCB, 0xAE, 0xBE, 0xA7, 0xD6, 0xAE,
      0xBA, 0xDB, 0x3C, 0x7C, 0x3E, 0x30, 0x3C, 0x7C, 0x7C, 0x3E, 0xD3, 0xB0, 0xC1, 0xF7, 0x3C, 0x7C,
      0x3E, 0x30, 0x3C, 0x7C, 0x7C, 0x3E, 0xCA, 0xD8, 0xCD, 0xFB, 0xD6, 0xAE, 0xBA, 0xA3, 0x3C, 0x7C,
      0x3E, 0x30, 0x3C, 0x7C, 0x7C, 0x3E, 0xD5, 0xF7, 0xB7, 0xFE, 0xD6, 0xAE, 0xBA, 0xA3, 0x3C, 0x7C,
      0x3E, 0x30, 0x3C, 0x7C, 0x7C, 0x3E, 0xBF, 0xA8, 0xC0, 0xAD, 0xC2, 0xFC, 0xB4, 0xEF, 0x3C, 0x7C,
      0x3E, 0x30, 0x3C, 0x7C, 0x7C, 0x3E, 0xC6, 0xA4, 0xB3, 0xC7, 0xBE, 0xAF, 0xB1, 0xB8, 0x3C, 0x7C,
      0x3E, 0x30, 0x3C, 0x7C, 0x7C, 0x3E, 0xB1, 0xC8, 0xB6, 0xFB, 0xBC, 0xAA, 0xCE, 0xD6, 0xCC, 0xD8,
      0x3C, 0x7C, 0x3E, 0x30, 0x3C, 0x7C, 0x7C, 0x3E, 0xB5, 0xC2, 0xC2, 0xEA, 0xCE, 0xF7, 0xD1, 0xC7,
      0x3C, 0x7C, 0x3E, 0x30, 0x3C, 0x7C, 0x7C, 0x3E, 0xB8, 0xA5, 0xC0, 0xD7, 0xB6, 0xFB, 0xD7, 0xBF,
      0xB5, 0xC2, 0x3C, 0x7C, 0x3E, 0x30, 0x3C, 0x7C, 0x7C, 0x3E, 0xCE, 0xDE, 0xCE, 0xB7, 0xCF, 0xC8,
      0xB7, 0xE6, 0x3C, 0x7C, 0x3E, 0x30, 0x3C, 0x7C, 0x7C, 0x3E, 0xCB, 0xA1, 0xC8, 0xF0, 0xC2, 0xEA,
      0x3C, 0x7C, 0x3E, 0x30, 0x3C, 0x7C, 0x7C, 0x3E, 0xC5, 0xA4, 0xC7, 0xFA, 0xB4, 0xD4, 0xC1, 0xD6,
      0x3C, 0x7C, 0x3E, 0x30, 0x3C, 0x7C, 0x7C, 0x3E, 0xBE, 0xDE, 0xC1, 0xFA, 0xD6, 0xAE, 0xB3, 0xB2,
      0x3C, 0x7C, 0x3E, 0x30, 0x3C, 0x7C, 0x7C, 0x3E, 0xBD, 0xCC, 0xD3, 0xFD, 0xCD, 0xF8, 0xD7, 0xA8,
      0xC7, 0xF8, 0x3C, 0x7C, 0x3E, 0x30, 0x3C, 0x7C, 0x7C, 0x3E, 0xC4, 0xD0, 0xBE, 0xF4, 0xC1, 0xEC,
      0xD3, 0xF2, 0x3C, 0x7C, 0x3E, 0x30, 0x3C, 0x7C, 0x7C, 0x3E
    ])
    // 末尾 <索引><|>选中大区
    const idx = this._areaIndex(area)
    const selBytes = this._areaGbk(area) || Buffer.from([0xB0, 0xAC, 0xC5, 0xB7, 0xC4, 0xE1, 0xD1, 0xC7])
    const idxBytes = Buffer.from(String(idx), 'ascii')
    const sep = Buffer.from([0x3C, 0x7C, 0x3E]) // <|>
    return Buffer.concat([listPart, idxBytes, sep, selBytes])
  }

  private _areaIndex(area: string): number {
    const order = ['艾欧尼亚','祖安','诺克萨斯','班德尔城','皮尔特沃夫','战争学院','巨神峰','雷瑟守备','钢铁烈阳','裁决之地','黑色玫瑰','暗影岛','均衡教派','水晶之痕','影流','守望之海','征服之海','卡拉曼达','皮城警备','比尔吉沃特','德玛西亚','弗雷尔卓德','无畏先锋','恕瑞玛','扭曲丛林','巨龙之巢','教育网专区','男爵领域']
    const i = order.indexOf(area)
    return i < 0 ? 0 : i
  }

  // 在 Buffer 中替换 key= 后的值（到 \r\n 为止）
  private _replaceLine(buf: Buffer, key: Buffer, value: Buffer): Buffer {
    const idx = buf.indexOf(key)
    if (idx < 0) {
      // key not found, append
      const crlf = Buffer.from('\r\n', 'ascii')
      return Buffer.concat([buf, key, value, crlf])
    }
    const start = idx + key.length
    let end = start
    while (end < buf.length && buf[end] !== 0x0D) end++ // find \r
    return Buffer.concat([buf.subarray(0, start), value, buf.subarray(end)])
  }

  private _detectToolPath(): string | null {
    return this._defaultToolPath() || null
  }

  private _killExisting(): void {
    for (const name of ['LeagueClient.exe', 'LeagueClientUx.exe', 'RiotClientServices.exe']) {
      try { spawn('taskkill', ['/f', '/im', name], { stdio: 'ignore' }) } catch {}
    }
  }

  private async _clickToolLoginButton(toolPid: number): Promise<void> {
    const psPath = path.join(process.cwd(), 'tool', '_click.ps1')
    const script = `
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
using System.Text;
public class AL {
    [DllImport("user32.dll")] public static extern bool EnumWindows(EWP cb, IntPtr l);
    [DllImport("user32.dll")] public static extern bool EnumChildWindows(IntPtr h, ECP cb, IntPtr l);
    [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr h, out uint pid);
    [DllImport("user32.dll")] public static extern int GetClassName(IntPtr h, StringBuilder s, int n);
    [DllImport("user32.dll")] public static extern int GetWindowText(IntPtr h, StringBuilder s, int n);
    [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr h, out RECT r);
    [DllImport("user32.dll")] public static extern IntPtr SendMessage(IntPtr h, uint msg, IntPtr wp, IntPtr lp);
    [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr h, int cmd);
    public delegate bool EWP(IntPtr h, IntPtr l);
    public delegate bool ECP(IntPtr h, IntPtr l);
    public const uint BM_CLICK = 0x00F5;
    public const int SW_HIDE = 0;
    [StructLayout(LayoutKind.Sequential)] public struct RECT { public int L,T,R,B; }
}
'@
$targetPid = ${toolPid}
$mainWin = [IntPtr]::Zero
[AL]::EnumWindows({
    param($w,$l)
    $p = [uint32]0
    [AL]::GetWindowThreadProcessId($w, [ref]$p) | Out-Null
    if ($p -eq $targetPid) {
        $tsb = New-Object System.Text.StringBuilder(80)
        [AL]::GetWindowText($w, $tsb, 80) | Out-Null
        if ($tsb.Length -gt 0) { $script:mainWin = $w; return $false }
    }
    return $true
}, [IntPtr]::Zero) | Out-Null
if ($mainWin -eq [IntPtr]::Zero) { [Console]::WriteLine("NOWIN"); exit }
[Console]::WriteLine("WIN:" + $mainWin)
[AL]::ShowWindow($mainWin, [AL]::SW_HIDE) | Out-Null
$bestBtn = [IntPtr]::Zero
$bestArea = 0
[AL]::EnumChildWindows($mainWin, {
    param($ch,$cl)
    $csb = New-Object System.Text.StringBuilder(60)
    [AL]::GetClassName($ch, $csb, 60) | Out-Null
    $c = $csb.ToString()
    $tsb = New-Object System.Text.StringBuilder(60)
    [AL]::GetWindowText($ch, $tsb, 60) | Out-Null
    $t = $tsb.ToString()
    $r = New-Object AL+RECT
    [AL]::GetWindowRect($ch, [ref]$r) | Out-Null
    $wid = $r.R - $r.L
    $hei = $r.B - $r.T
    $area = $wid * $hei
    [Console]::WriteLine("CTL:$c|$t|$($wid)x$($hei)")
    if ($c -eq 'Button' -and $t.Length -gt 0 -and $area -gt $script:bestArea) {
        $script:bestArea = $area
        $script:bestBtn = $ch
    }
    return $true
}, [IntPtr]::Zero) | Out-Null
if ($bestBtn -ne [IntPtr]::Zero) {
    [Console]::WriteLine("CLICK:" + $bestBtn + " area=" + $bestArea)
    [AL]::SendMessage($bestBtn, [AL]::BM_CLICK, [IntPtr]::Zero, [IntPtr]::Zero) | Out-Null
} else {
    [Console]::WriteLine("NOBTN")
}
`
    fs.writeFileSync(psPath, script, 'utf8')
    await new Promise<void>((resolve) => {
      const proc = spawn('powershell', [
        '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', psPath
      ], { stdio: ['ignore', 'pipe', 'pipe'] })
      let out = ''
      let err = ''
      proc.stdout?.setEncoding('utf8')
      proc.stderr?.setEncoding('utf8')
      proc.stdout?.on('data', (d: string) => { out += d })
      proc.stderr?.on('data', (d: string) => { err += d })
      const kill = setTimeout(() => { try { proc.kill() } catch {} }, 60000)
      proc.on('exit', () => {
        clearTimeout(kill)
        this._log.info(`AutoLoginC: ps out: ${out.trim().replace(/\n/g, ' | ')}`)
        if (err) this._log.warn(`AutoLoginC: ps err: ${err.trim()}`)
        try { fs.unlinkSync(psPath) } catch {}
        resolve()
      })
      proc.on('error', (e) => {
        clearTimeout(kill)
        this._log.warn(`AutoLoginC: ps spawn err: ${e.message}`)
        try { fs.unlinkSync(psPath) } catch {}
        resolve()
      })
    })
  }

  private _sleep(ms: number) { return new Promise<void>((r) => setTimeout(r, ms)) }

  private async _pollForLcu(to: number): Promise<boolean> {
    const dl = Date.now() + to
    while (Date.now() < dl) {
      if (this._lc.state.connectionState === 'connected') return true
      if (this._failReason) return false
      await this._sleep(1000)
    }
    return false
  }

  private _failReason: string | null = null
  private _failKeywords = ['密码错误', '账号错误', '账号或密码', '验证失败', '登录失败', '实名', '异常', '封禁', '禁止']
  private _successKeywords = ['登录成功', '启动游戏', '进入游戏']

  private _detectFail(text: string): string | null {
    for (const k of this._failKeywords) if (text.includes(k)) return k
    return null
  }

  private _detectSuccess(text: string): boolean {
    return this._successKeywords.some((k) => text.includes(k))
  }
}
