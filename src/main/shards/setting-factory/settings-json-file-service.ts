import { app } from 'electron'
import fs from 'node:original-fs'
import path from 'node:path'

import { AkariIpcError } from '../ipc'
import { StorageMain } from '../storage'
import { Setting } from '../storage/entities/Settings'
import type { SettingFactoryMainContext } from './context'
import { SetterSettingService } from './setter-setting-service'

export class SettingsJsonFileService {
  constructor(private readonly context: SettingFactoryMainContext) {}

  async readConfigFile<T = any>(namespace: string, filename: string): Promise<T> {
    if (!namespace) {
      throw new Error('domain is required')
    }

    const jsonPath = this._getConfigFilePath(namespace, filename)

    if (!fs.existsSync(jsonPath)) {
      throw new Error(`config file ${filename} does not exist`)
    }

    // 读取 UTF-8 格式的 JSON 文件
    const content = await fs.promises.readFile(jsonPath, 'utf-8')
    return JSON.parse(content)
  }

  async writeConfigFile(namespace: string, filename: string, data: any) {
    if (!namespace) {
      throw new Error('domain is required')
    }

    const jsonPath = this._getConfigFilePath(namespace, filename)

    await fs.promises.mkdir(path.dirname(jsonPath), { recursive: true })
    await fs.promises.writeFile(jsonPath, JSON.stringify(data, null, 2), 'utf-8')
  }

  async configFileExists(namespace: string, filename: string) {
    if (!namespace) {
      throw new Error('domain is required')
    }

    const jsonPath = this._getConfigFilePath(namespace, filename)

    return fs.promises
      .access(jsonPath, fs.constants.F_OK)
      .then(() => true)
      .catch(() => false)
  }

  async writeSettingsToJsonFile(filePath: string) {
    const all = await this.context.storage.dataSource.manager.find(Setting)

    const jsonContent = {
      databaseVersion: StorageMain.LEAGUE_AKARI_DB_CURRENT_VERSION,
      type: 'league-akari-settings',
      data: all
    }

    await fs.promises.writeFile(filePath, JSON.stringify(jsonContent), 'utf-8')

    return filePath
  }

  async readSettingsFromJsonFile(filePath: string) {
    await fs.promises.access(filePath, fs.constants.F_OK)

    const content = JSON.parse(await fs.promises.readFile(filePath, 'utf-8'))

    // 检查文件类型
    if (content.type !== 'league-akari-settings') {
      throw new AkariIpcError(`The file is not a valid settings file`, 'InvalidSettingsFile')
    }

    // 检查数据库版本
    if (content.databaseVersion > StorageMain.LEAGUE_AKARI_DB_CURRENT_VERSION) {
      throw new AkariIpcError(
        `The file is from a newer version of the application, please update the application first`,
        'InvalidDatabaseVersion'
      )
    }

    // 检查字段类型
    if (
      !Array.isArray(content.data) ||
      !content.data.every(
        (v: any) =>
          typeof v === 'object' && typeof v.key === 'string' && typeof v.value !== 'undefined'
      )
    ) {
      throw new AkariIpcError(`The file is not a valid settings file`, 'InvalidSettingsData')
    }

    // 替换数据库中上述提到的设置项
    await this.context.storage.dataSource.manager.save(Setting, content.data)

    this.context.shared.global.restart()
  }

  private _getConfigFilePath(namespace: string, filename: string) {
    return path.join(
      app.getPath('userData'),
      SetterSettingService.CONFIG_DIR_NAME,
      namespace,
      filename
    )
  }
}
