# TabBar

TabBar owns navigation, dragging and horizontal scrolling. The caller owns pages and their lifecycle.

```vue
<TabBar
  :items="tabItems"
  v-model:active-id="activeId"
  v-model:order="tabOrder"
  :min-tab-width="120"
  :max-tab-width="180"
/>
```

- `items: TabBarItems` is an unordered record of descriptions keyed by stable string IDs. Each
  description contains its name, optional icon, actions, closability and fixed position. The record
  key supplies the `id` received by slots and action callbacks.
- `order: string[]` is the only source of navigation order. It contains every item ID exactly once,
  including fixed items. Dragging emits a new array through `update:order`; it does not change
  `activeId`, item descriptions or page state.
- `activeId: string` identifies the selected tab. Clicking or keyboard navigation emits
  `update:activeId`.
- Fixed items form a contiguous prefix with `fixedPosition: 0, 1, ...`. Non-closable items can still
  be draggable when they have no fixed position.
- Adding and closing are caller-owned operations. Update the item record and ID order together;
  choose the next active ID when closing its page. Add-menu options and action callbacks request
  these operations without changing the models internally.
- Item widths divide the available space, capped by `maxTabWidth`. Horizontal overflow starts only
  when that division would fall below `minTabWidth`. Both defaults are shown above.

Render page content from a stable page collection, independently of `tabOrder`. Key content by page
ID and use the active ID to control visibility. Moving an existing content root in the DOM can reset
scroll offsets and restart CSS animations even when Vue preserves the component instance.
