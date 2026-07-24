import { EXECUTABLE_NAME } from './context'

export interface ApplyUpdaterArgumentsOptions {
  locale: string
  archivePath: string
  targetPath: string
}

export function createApplyUpdaterArguments(options: ApplyUpdaterArgumentsOptions) {
  return [
    '--lang',
    options.locale,
    '--executable',
    EXECUTABLE_NAME,
    'apply',
    '--archive',
    options.archivePath,
    '--target',
    options.targetPath,
    '--delete-archive',
    '--launch'
  ]
}

export interface UninstallUpdaterArgumentsOptions {
  locale: string
  appIds: readonly string[]
  appPath: string
  dataPath: string
}

export function createUninstallUpdaterArguments(options: UninstallUpdaterArgumentsOptions) {
  return [
    '--lang',
    options.locale,
    '--executable',
    EXECUTABLE_NAME,
    'uninstall',
    ...options.appIds.flatMap((appId) => ['--app-id', appId]),
    '--dirs-to-remove',
    options.appPath,
    '--dirs-to-remove',
    options.dataPath
  ]
}
