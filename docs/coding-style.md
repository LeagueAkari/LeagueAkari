# Coding Style

These are League Akari's general Vue/TypeScript coding preferences. Read the relevant sections when
authoring, refactoring, or reviewing code. Apply them to the touched area without unrelated rewrites.

Keep these conventions and their examples here. Project skills own domain-specific architecture and
UI guidance. Mechanical formatting remains in [`.prettierrc.yaml`](../.prettierrc.yaml); Prettier does
not choose logical grouping for you.

## Function syntax

- **Vue SFCs:** in both `<script>` and `<script setup>`, use arrow functions for authored functions,
  including async functions and callbacks. Do not use `function` declarations or expressions.
- **Ordinary TypeScript modules:** use `function` or `export function` for module-level named
  functions, including composables. Use arrow functions for nested functions and callbacks.
- Class methods, constructors, accessors, and function type signatures retain their native syntax.
  Preserve required `this` binding, overloads, and generator behavior rather than changing semantics
  for style.
- Arrow-function bindings must exist before any synchronous use, including immediate watchers and
  `watchEffect`. Check initialization order when replacing hoisted function declarations.

### Vue component functions

Bad — ordinary functions and no separation between independent handlers:

```vue
<script setup lang="ts">
const emit = defineEmits<{ select: [id: number]; retry: [] }>()

function select(id: number) {
  emit('select', id)
}
function retry() {
  emit('retry')
}
</script>
```

Good — arrow functions, with a blank line between independent handlers:

```vue
<script setup lang="ts">
const emit = defineEmits<{ select: [id: number]; retry: [] }>()

const select = (id: number) => {
  emit('select', id)
}

const retry = () => {
  emit('retry')
}
</script>
```

Short, single-purpose expressions may stay compact: `const retry = () => emit('retry')`.
Async functions follow the same rule: `const refresh = async () => { ... }`.

### Module functions and nested helpers

Bad — arrow functions at module scope and a `function` declaration inside another function:

```ts
const normalize = (value: string) => value.trim().toLowerCase()

export const filterNames = (names: string[], query: string) => {
  const normalizedQuery = normalize(query)

  function matches(name: string) {
    return normalize(name).includes(normalizedQuery)
  }

  return names.filter(matches)
}
```

Good — module-level declarations, with a nested arrow helper:

```ts
function normalize(value: string) {
  return value.trim().toLowerCase()
}

export function filterNames(names: string[], query: string) {
  const normalizedQuery = normalize(query)

  const matches = (name: string) => normalize(name).includes(normalizedQuery)

  return names.filter(matches)
}
```

## Whitespace and readability

- Use **one blank line between logical units**. Do not pack unrelated declarations or processing
  steps into an uninterrupted block.
- Always separate independent function definitions, arrow-function bindings, and class methods with
  a blank line. The same applies to independent multiline handlers inside objects.
- Group declarations by purpose: imports, component contracts, dependencies, state/computed values,
  handlers, lifecycle/watch registrations, and exports. Separate groups when their purpose changes;
  preserve dependency order rather than forcing a fixed section order.
- Inside functions, separate distinct phases such as guards, preparation, processing, side effects,
  and final results. Keep tightly related declarations, assignments, and simple guards together.
- Prefer braced, multiline control flow for substantive logic. Do not squeeze multiple statements
  onto one line; short, single-purpose expressions may remain compact.
- Keep comments attached to the code they explain. In long objects and types, separate meaningful
  groups rather than mechanically separating every field.
- Do not insert a blank line after every statement or stack multiple empty lines. The goal is clear
  grouping, not maximum vertical space.

### Separate phases, keep related statements together

Bad — guards, calculation, and the result run together:

```ts
export function summarize(values: number[]) {
  if (values.length === 0) {
    return null
  }
  const count = values.length
  const total = values.reduce((sum, value) => sum + value, 0)
  return { count, total }
}
```

Good — blank lines mark phase boundaries; related calculations stay together:

```ts
export function summarize(values: number[]) {
  if (values.length === 0) {
    return null
  }

  const count = values.length
  const total = values.reduce((sum, value) => sum + value, 0)

  return { count, total }
}
```

### Separate independent object handlers

These are excerpts from a Vue component. Blank lines separate behaviors, while each handler's
related statements stay together.

Bad:

```ts
const handlers = {
  select: (id: number) => {
    selectedId.value = id
    emit('select', id)
  },
  retry: () => {
    emit('retry')
  }
}
```

Good:

```ts
const handlers = {
  select: (id: number) => {
    selectedId.value = id
    emit('select', id)
  },

  retry: () => {
    emit('retry')
  }
}
```
