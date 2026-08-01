import { InjectionKey, MaybeRefOrGetter, Ref, inject, provide, toRef } from 'vue'

import type { SearchPanePage } from './components/search-pane'

export type AppContext = {
  contentWidth: Ref<number>
  contentHeight: Ref<number>

  openSearch: (page?: SearchPanePage) => void
  openSettingsModal: () => void
}

export const MainWindowAppContext: InjectionKey<AppContext> = Symbol('MainWindowAppContext')

export function provideMainWindowAppContext(props: {
  contentWidth: MaybeRefOrGetter<number>
  contentHeight: MaybeRefOrGetter<number>
  openSearch: (page?: SearchPanePage) => void
  openSettingsModal: () => void
}) {
  provide(MainWindowAppContext, {
    contentWidth: toRef(props.contentWidth),
    contentHeight: toRef(props.contentHeight),
    openSearch: props.openSearch,
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
