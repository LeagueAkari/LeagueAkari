import dayjs from 'dayjs'

import type { RendererLogLevel } from './context'

export class RendererConsoleLogEmitter {
  emit(level: RendererLogLevel, namespace: string, ...args: any[]) {
    const fn = {
      info: console.info,
      warn: console.warn,
      error: console.error,
      debug: console.debug
    }

    const scheme = this._getColorScheme()

    fn[level]?.(
      `%c[${dayjs().format('HH:mm:ss:SSS')}] %c[%c${namespace}%c] %c[${level}]`,
      scheme[level].timestamp,
      'color: inherit;',
      scheme[level].namespace,
      'color: inherit;',
      scheme[level].level,
      ...args
    )
  }

  private _getColorScheme() {
    const preferDark = window.matchMedia('(prefers-color-scheme: dark)').matches

    const darkColors = {
      debug: {
        timestamp: 'color: #9aa0a6; font-weight: bold;',
        namespace: 'color: #b39ddb; font-weight: bold;',
        level: 'color: #26a69a; font-weight: bold;'
      },
      info: {
        timestamp: 'color: #9aa0a6; font-weight: bold;',
        namespace: 'color: #b39ddb; font-weight: bold;',
        level: 'color: #42a5f5; font-weight: bold;'
      },
      warn: {
        timestamp: 'color: #9aa0a6; font-weight: bold;',
        namespace: 'color: #b39ddb; font-weight: bold;',
        level: 'color: #ffc107; font-weight: bold;'
      },
      error: {
        timestamp: 'color: #9aa0a6; font-weight: bold;',
        namespace: 'color: #b39ddb; font-weight: bold;',
        level: 'color: #ef5350; font-weight: bold;'
      }
    }

    const lightColors = {
      debug: {
        timestamp: 'color: #555; font-weight: bold;',
        namespace: 'color: #7e57c2; font-weight: bold;',
        level: 'color: #00897b; font-weight: bold;'
      },
      info: {
        timestamp: 'color: #555; font-weight: bold;',
        namespace: 'color: #7e57c2; font-weight: bold;',
        level: 'color: #1565c0; font-weight: bold;'
      },
      warn: {
        timestamp: 'color: #555; font-weight: bold;',
        namespace: 'color: #7e57c2; font-weight: bold;',
        level: 'color: #fb8c00; font-weight: bold;'
      },
      error: {
        timestamp: 'color: #555; font-weight: bold;',
        namespace: 'color: #7e57c2; font-weight: bold;',
        level: 'color: #d32f2f; font-weight: bold;'
      }
    }

    return preferDark ? darkColors : lightColors
  }
}
