import { BaseConfig } from '@main/bootstrap/base-config'
import { AppThemeSetting } from '@shared/types/app-theme'
import { makeAutoObservable, observable } from 'mobx'

export class AppCommonState {
  isAdministrator: boolean = false

  /**
   * 仅用于展示, 是否禁用硬件加速
   */
  disableHardwareAcceleration: boolean = false

  baseConfig: BaseConfig | null = null

  shouldUseDarkColors: boolean = false

  /**
   * 跟随本次启动而来的 deep link
   */
  startupDeepLink: string | null = null

  isRunInTempDir: boolean = false

  nativeAddons: {
    nativeLoaded: boolean
    inputHookSupported: boolean
    inputInjectSupported: boolean
    toolsForegroundSupported: boolean
    toolsWindowPlacementSupported: boolean
    toolsFixWindowMethodASupported: boolean
  } = {
    nativeLoaded: false,
    inputHookSupported: false,
    inputInjectSupported: false,
    toolsForegroundSupported: false,
    toolsWindowPlacementSupported: false,
    toolsFixWindowMethodASupported: false
  }

  setAdministrator(s: boolean) {
    this.isAdministrator = s
  }

  setDisableHardwareAcceleration(s: boolean) {
    this.disableHardwareAcceleration = s
  }

  setBaseConfig(s: BaseConfig | null) {
    this.baseConfig = s
  }

  setShouldUseDarkColors(s: boolean) {
    this.shouldUseDarkColors = s
  }

  setStartupDeepLink(s: string | null) {
    this.startupDeepLink = s
  }

  setRunInTempDir(s: boolean) {
    this.isRunInTempDir = s
  }

  setNativeAddons(s: AppCommonState['nativeAddons']) {
    this.nativeAddons = s
  }

  constructor() {
    makeAutoObservable(this, { baseConfig: observable.ref, nativeAddons: observable.ref })
  }
}

export class AppCommonSettings {
  /**
   * 输出前置声明
   */
  showFreeSoftwareDeclaration: boolean = true

  /**
   * 是否位于调试模式
   */
  isInKyokoMode: boolean = false

  /**
   * 语言
   */
  locale: string = 'zh-CN'

  /**
   * 主题色
   */
  theme: AppThemeSetting = 'dark'

  /**
   * HTTP 代理
   */
  httpProxy: {
    strategy: 'force' | 'auto' | 'disable'
    port: number
    host: string
  } = {
    strategy: 'disable',
    port: 7890,
    host: '127.0.0.1'
  }

  streamerMode: boolean = false

  streamerModeUseAkariStyledName: boolean = false

  /**
   * 这里用来记录应用偏向的数据源
   *
   * - 当部分数据可以走 sgp 和 lcu 时，优先走 sgp
   * - 强制全部走 lcu
   *
   * 它同时要被多个地方使用，所以就提升到此模块中
   */
  preferredLolSource: 'sgp' | 'lcu' = 'sgp'

  setShowFreeSoftwareDeclaration(s: boolean) {
    this.showFreeSoftwareDeclaration = s
  }

  setIsInKyokoMode(s: boolean) {
    this.isInKyokoMode = s
  }

  setLocale(s: string) {
    this.locale = s
  }

  setTheme(s: AppThemeSetting) {
    this.theme = s
  }

  setHttpProxy(s: { strategy: 'force' | 'disable'; port: number; host: string }) {
    this.httpProxy = s
  }

  setStreamerMode(s: boolean) {
    this.streamerMode = s
  }

  setStreamerModeUseAkariStyledName(s: boolean) {
    this.streamerModeUseAkariStyledName = s
  }

  setPreferredLolSource(s: 'sgp' | 'lcu') {
    this.preferredLolSource = s
  }

  constructor() {
    makeAutoObservable(this, {
      httpProxy: observable.ref
    })
  }
}
