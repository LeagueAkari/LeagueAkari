import { InjectionKey, MaybeRefOrGetter, Ref, inject, provide, toRef } from 'vue'

export type AppContext = {
  contentWidth: Readonly<Ref<number>>
  contentHeight: Readonly<Ref<number>>

  openSettingsModal: (tabName?: string) => void
}

export const AppContextKey: InjectionKey<AppContext> = Symbol('LeagueAkariAppContext')

export function provideAppContext(props: {
  contentWidth: MaybeRefOrGetter<number>
  contentHeight: MaybeRefOrGetter<number>
  openSettingsModal: (tabName?: string) => void
}) {
  provide(AppContextKey, {
    contentWidth: toRef(props.contentWidth),
    contentHeight: toRef(props.contentHeight),
    openSettingsModal: props.openSettingsModal
  })
}

export function useAppContext() {
  const context = inject(AppContextKey)

  if (!context) {
    throw new Error('useAppContext must be used within a app component')
  }

  return context
}
