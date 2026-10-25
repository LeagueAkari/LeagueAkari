import type { Meta, StoryObj } from '@storybook/vue3-vite'
import Add from '@vicons/ionicons5/es/Add'
import Close from '@vicons/ionicons5/es/Close'
import Refresh from '@vicons/ionicons5/es/Refresh'
import { NButton } from 'naive-ui'
import { computed, h, markRaw, nextTick, ref } from 'vue'

import TabBar from './TabBar.vue'
import type { TabBarItems } from './tab-order'

const meta = {
  title: 'Shared/Tab Bar',
  component: TabBar,
  render: (args) => ({
    setup() {
      const tabs = ref(args.order.map((id) => ({ ...args.items[id], id })))
      const activeId = ref(args.activeId)
      const width = ref(480)
      const showAdd = ref(true)
      const mounted = ref(true)
      const lastAction = ref('')
      let nextId = 0

      const add = (kind = 'page') => {
        const tab = { id: `new-${++nextId}`, name: `New ${kind} ${nextId}` }
        tabs.value.push(tab)
        activeId.value = tab.id
      }

      const close = (id: string) => {
        const index = tabs.value.findIndex((tab) => tab.id === id)
        if (index < 0) return

        tabs.value.splice(index, 1)
        if (activeId.value === id) {
          activeId.value = tabs.value[index]?.id ?? tabs.value[index - 1]?.id ?? ''
        }
      }

      const displayItems = computed<TabBarItems>(() =>
        Object.fromEntries(
          tabs.value.map(({ id, ...tab }) => [
            id,
            {
              ...tab,
              actions: [
                {
                  id: 'refresh',
                  icon: markRaw(Refresh),
                  label: `Refresh ${tab.name}`,
                  onClick: () => {
                    lastAction.value = `refresh:${id}`
                  }
                },
                {
                  id: 'close',
                  kind: 'close' as const,
                  icon: markRaw(Close),
                  label: `Close ${tab.name}`,
                  onClick: () => close(id)
                }
              ]
            }
          ])
        )
      )

      const order = computed({
        get: () => tabs.value.map((tab) => tab.id),
        set: (ids: string[]) => {
          const byId = new Map(tabs.value.map((tab) => [tab.id, tab]))
          tabs.value = ids.map((id) => byId.get(id)!)
          lastAction.value = 'reorder'
        }
      })

      const button = (label: string, onClick: () => void) =>
        h(NButton, { size: 'tiny', onClick }, { default: () => label })

      return () =>
        h('div', { class: 'flex flex-col gap-3' }, [
          h('div', { class: 'flex flex-wrap gap-2' }, [
            button('Append', () => add()),
            button('Rapid add/remove', async () => {
              add()
              await nextTick()
              close(activeId.value)
            }),
            button('Resize', () => {
              width.value = width.value === 480 ? 320 : 480
            }),
            button('Toggle add', () => {
              showAdd.value = !showAdd.value
            }),
            button('Toggle mount', () => {
              mounted.value = !mounted.value
            })
          ]),
          h(
            'div',
            { 'data-testid': 'tab-demo', style: { width: `${width.value}px`, maxWidth: '100%' } },
            [
              mounted.value
                ? h(
                    TabBar,
                    {
                      ...args,
                      items: displayItems.value,
                      order: order.value,
                      addOptions: showAdd.value ? args.addOptions : [],
                      activeId: activeId.value,
                      'onUpdate:activeId': (id: string) => {
                        activeId.value = id
                      },
                      onAdd: add,
                      'onUpdate:order': (ids: string[]) => {
                        order.value = ids
                      },
                      onContextmenu: (event, tab) => {
                        event.preventDefault()
                        lastAction.value = `menu:${tab.id}`
                      }
                    },
                    args.addLabel === 'Custom menu' && showAdd.value
                      ? {
                          'add-menu': ({ select }: { select: (id: string) => void }) =>
                            button('Custom page', () => select('custom'))
                        }
                      : undefined
                  )
                : null
            ]
          ),
          h(
            'div',
            { role: 'status', 'data-testid': 'tab-state', class: 'text-xs opacity-60' },
            `${activeId.value} | ${tabs.value.map((tab) => tab.id).join(',')} | ${lastAction.value}`
          )
        ])
    }
  }),
  args: {
    activeId: 'home',
    items: { home: { name: 'Home', fixedPosition: 0, closable: false } },
    order: ['home'],
    addLabel: 'Add tab',
    resizeIdleMs: 1000,
    addOptions: [{ id: 'page', label: 'New page', icon: markRaw(Add) }]
  }
} satisfies Meta<typeof TabBar>
export default meta

type Story = StoryObj<typeof meta>

export const AddPages: Story = {}
export const Empty: Story = { args: { items: {}, order: [], activeId: '' } }
export const Overflow: Story = {
  args: {
    items: {
      home: { name: 'Home', fixedPosition: 0, closable: false },
      ...Object.fromEntries(
        Array.from({ length: 12 }, (_, i) => [String(i), { name: `Page ${i + 1}` }])
      )
    },
    order: ['home', ...Array.from({ length: 12 }, (_, i) => String(i))],
    activeId: '0'
  }
}
export const FlexibleWidths: Story = {
  args: {
    ...Overflow.args,
    minTabWidth: 80,
    maxTabWidth: 160,
    items: Object.fromEntries(['home', '0', '1'].map((id) => [id, Overflow.args!.items![id]])),
    order: ['home', '0', '1']
  }
}
export const MultipleFixed: Story = {
  args: {
    items: {
      home: { name: 'Home', fixedPosition: 0, closable: false },
      fixed: { name: 'Fixed page', fixedPosition: 1 },
      first: { name: 'First' },
      second: { name: 'Second' }
    },
    order: ['home', 'fixed', 'first', 'second']
  }
}
export const CustomMenu: Story = { args: { addLabel: 'Custom menu', addOptions: [] } }
