import { InjectionKey, MaybeRefOrGetter, Ref, inject, provide, toRef } from 'vue'

export type AppContext = {
  contentWidth: Ref<number>
  contentHeight: Ref<number>

  openSettingsSearch: () => void
  openSettingsModal: () => void
}

export const MainWindowAppContext: InjectionKey<AppContext> = Symbol('MainWindowAppContext')

export function provideMainWindowAppContext(props: {
  contentWidth: MaybeRefOrGetter<number>
  contentHeight: MaybeRefOrGetter<number>
  openSettingsSearch: () => void
  openSettingsModal: () => void
}) {
  provide(MainWindowAppContext, {
    contentWidth: toRef(props.contentWidth),
    contentHeight: toRef(props.contentHeight),
    openSettingsSearch: props.openSettingsSearch,
    openSettingsModal: props.openSettingsModal
  })
}

export function useMainWindowAppContext() {
  const context = inject(MainWindowAppContext)

  if (!context) {
    throw new Error('useMainWindowAppContext must be used within a main window component')
  }

  return context
}
