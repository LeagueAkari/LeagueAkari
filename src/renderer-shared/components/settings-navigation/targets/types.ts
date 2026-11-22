export interface NavigationTargetGroup<TId extends string = string> {
  readonly groupKeys: readonly string[]
  readonly targets: readonly {
    readonly id: TId
    readonly labelKey: string
    readonly descriptionKey?: string
    readonly keywordKeys?: readonly string[]
    readonly searchable?: boolean
  }[]
}
