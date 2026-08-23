import 'monaco-editor/languages/definitions/javascript/register.js'
import {
  ScriptTarget,
  javascriptDefaults
} from 'monaco-editor/languages/features/typescript/register.js'

const templateContextDeclaration = `
interface AkariManager {
  readonly global: Record<string, unknown>
  getInstance(id: string | symbol): any | undefined
}

interface InGameSendTemplateContext {
  readonly options: Readonly<{
    target: 'friendly' | 'enemy' | 'all'
  }>
  readonly runtime: Readonly<{
    manager: AkariManager
  }>
}

declare function getMessages(ctx: InGameSendTemplateContext): string[]
`

javascriptDefaults.setCompilerOptions({
  allowJs: true,
  allowNonTsExtensions: true,
  checkJs: true,
  target: ScriptTarget.ESNext
})
javascriptDefaults.setDiagnosticsOptions({
  noSemanticValidation: false,
  noSyntaxValidation: false,
  noSuggestionDiagnostics: false,
  onlyVisible: true
})
javascriptDefaults.addExtraLib(
  templateContextDeclaration,
  'inmemory://league-akari/in-game-send-template.d.ts'
)
