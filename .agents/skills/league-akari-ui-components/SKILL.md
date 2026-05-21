---
name: league-akari-ui-components
description: Use when implementing or reviewing League Akari renderer UI component details that involve i18n component interpolation, multiple independent pluralized counts, Tailwind utilities inside SFC style blocks, or native semantic HTML elements in the Naive UI renderer.
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

## Tailwind In SFC Styles

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
