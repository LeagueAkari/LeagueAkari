export type MonacoApi = typeof import('monaco-editor/editor/editor.api.js')

let monacoPromise: Promise<MonacoApi> | null = null
let javascriptMonacoPromise: Promise<MonacoApi> | null = null

export function loadMonaco() {
  monacoPromise ??= import('./monaco-integration').then(({ monaco }) => monaco)
  return monacoPromise
}

export function loadJavaScriptMonaco() {
  javascriptMonacoPromise ??= loadMonaco().then(async (monaco) => {
    await import('./javascript-support')
    return monaco
  })
  return javascriptMonacoPromise
}
