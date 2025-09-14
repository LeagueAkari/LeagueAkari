import { electronAPI } from '@electron-toolkit/preload'
import { contextBridge } from 'electron'

const akariWindowType = process.argv
  .find((arg) => arg.startsWith('--akari-window-type='))
  ?.split('=')[1]

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('akariWindowType', akariWindowType)
  } catch (error) {
    console.error('preload', error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.akariWindowType = akariWindowType
}
