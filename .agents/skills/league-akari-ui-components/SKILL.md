---
name: league-akari-ui-components
description: Use when implementing or reviewing League Akari renderer UI component details that involve i18n component interpolation, multiple independent pluralized counts, Tailwind utility usage in templates or SFC style blocks, or native semantic HTML elements in the Naive UI renderer.
---

# League Akari UI Components

Use this skill only for the UI component details listed here.

## Component Interpolation

Use `TranslationComponent` from `i18next-vue` when a translated sentence needs Vue-rendered fragments inside it, such as highlighted text or other inline component content.

Do not use the global `<i18next>` alias in Vue templates. Use the explicit `TranslationComponent` name so Vue tooling can provide component type hints.

Keep word order and punctuation in the locale file. In YAML, place named component slots with `{slotName}`. In the Vue component, provide matching named slots.

```vue
<TranslationComponent :translation="t('PlayerTab.collectMode.collectedPageDescription')">
  <template #scanned>
    <TranslationComponent
      :translation="t('PlayerTab.collectMode.scannedMatches', { count: scannedCount })"
    >
      <template #count>
        <span class="count-highlight">{{ scannedCount }}</span>
      </template>
    </TranslationComponent>
  </template>
  <template #collected>
    <TranslationComponent
      :translation="t('PlayerTab.collectMode.collectedMatches', { count: collectedCount })"
    >
      <template #count>
        <span class="count-highlight">{{ collectedCount }}</span>
      </template>
    </TranslationComponent>
  </template>
</TranslationComponent>
```

```yaml
collectedPageDescription: This page is a collection-mode result with {collected} from {scanned}.
scannedMatches_one: '{count} scanned match'
scannedMatches_other: '{count} scanned matches'
collectedMatches_one: '{count} collected match'
collectedMatches_other: '{count} collected matches'
```

Project references:

- `src/renderer/src-main-window/views/player-tabs/components/player-tab/widgets/match-history-filters/presets/FilterPresetExamples.vue`
- `src/renderer/src-main-window/views/player-tabs/components/player-tab/widgets/MatchHistoryPagination.vue`

## Pluralization

Use i18next plural suffixes for count-dependent text:

```yaml
someKey_one: '{{count}} game'
someKey_other: '{{count}} games'
```

Pass the controlling number as `count`.

When one UI sentence contains more than one independent count, do not put all count-dependent nouns in one translation key. Split the sentence into smaller translated phrases so each pluralized key has one `count` controller, then compose those phrases through `TranslationComponent`.

This avoids incorrect English such as treating both counts as plural when one of them is `1`.

Project references:

- `src/renderer-shared/components/ongoing-game-panel/widgets/player-info-card/jungle-pathing-info/FirstClearAndGankSummary.vue`
- `src/shared/i18n/en/renderer.yaml` keys under `JunglePathing.campPopover*`

## Tailwind Utilities

Use Tailwind CSS v4 syntax in templates and SFC styles.

When a Vue SFC uses Tailwind utilities inside a `<style>` block, add a Tailwind reference directive before `@apply` or other Tailwind-only CSS usage:

```vue
<style scoped>
@reference '@renderer-shared/assets/css/tailwind.css';

.count-highlight {
  @apply text-akari-700 font-bold;
}
</style>
```

Without this reference, `@tailwindcss/vite` can fail during dev with an error such as `Cannot apply unknown utility class`.

Prefer semantic scale utilities over arbitrary values whenever a matching token exists. Use arbitrary values only when the design truly needs a non-token value, a complex expression, or an authored CSS feature such as `[font-variant-numeric:tabular-nums]`.

Tailwind v4 syntax rules:

| Prefer                                                                        | Avoid                                                                                                   |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `h-6`, `w-52`, `gap-1.5`, `rounded`, `text-xs`, `leading-7`                   | `h-[24px]`, `w-[208px]`, `gap-[6px]`, `rounded-[4px]`, `text-[12px]`, `leading-[28px]`                  |
| `text-black/82`, `bg-white/10`, `border-black/10`                             | `text-black/[0.82]`, `bg-white/[0.1]`, `border-black/[0.1]`                                             |
| `opacity-75`                                                                  | `opacity-[0.75]`                                                                                        |
| `flex!`, `hover:bg-red-600/50!`                                               | `!flex`, `hover:!bg-red-600/50`                                                                         |
| `text-(--color-akari)`, `fill-(--icon-color)`                                 | `text-[var(--color-akari)]`, `fill-[var(--icon-color)]`                                                 |
| `text-(color:--title-color)`, `text-(length:--title-size)`                    | ambiguous `text-(--title-token)`                                                                        |
| `bg-black/50`, `text-black/50`, `border-black/50`                             | `bg-opacity-50`, `text-opacity-50`, `border-opacity-50`                                                 |
| `shadow-xs`, `shadow-sm`, `blur-xs`, `rounded-xs`, `outline-hidden`, `ring-3` | v3-era assumptions about `shadow-sm`, `shadow`, `blur-sm`, `rounded-sm`, `outline-none`, or bare `ring` |

Also:

- Write arbitrary values with v4 underscore spacing rules, such as `grid-cols-[1fr_500px_2fr]`; escape underscores only when they are literal text.
- Explicitly specify border/divide/ring colors instead of relying on v3 defaults, such as `border border-black/10 dark:border-white/10`.
- Prefer `gap-*` for flex/grid spacing. Use `space-*` only when its selector behavior is intentional.
- Explicitly set cursor utilities on native buttons when needed, such as `cursor-pointer` or `cursor-text`.
- When touching existing Tailwind code, modernize nearby outdated v3 syntax if it is in the edited class list.

Project references:

- `src/renderer-shared/components/widgets/ItemDisplay.vue`
- `src/renderer-shared/components/LcuImage.vue`
- `src/renderer/src-main-window/components/titlebar/CommonButtons.vue`

## Native Semantic Elements

League Akari uses Naive UI for component primitives and does not include Tailwind's base/preflight layer as the foundation for renderer styling.

When using native semantic elements such as `button`, `input`, `select`, `ul`, `ol`, or heading tags, do not assume browser defaults or Tailwind base normalization will match the surrounding UI. Either:

- Use the matching Naive UI component when it is available.
- Fully specify the native element's spacing, typography, border, background, focus, disabled, and interaction states.
- If the native element is only needed for semantics and its default rendering is undesirable, use a neutral element with the appropriate `role` and accessibility attributes instead.

The intent is to avoid accidental browser-default controls or text styles appearing inside an otherwise Naive UI-rendered surface.
