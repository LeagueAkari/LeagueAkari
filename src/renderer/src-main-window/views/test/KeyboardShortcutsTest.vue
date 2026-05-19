<template>
  <NScrollbar class="h-full">
    <div class="keyboard-shortcuts-test">
      <div class="status-row">
        <div class="status-item">
          <span class="status-label">平台</span>
          <NTag size="small" :type="as.isWindows ? 'success' : 'warning'">
            {{ as.platform }}
          </NTag>
        </div>
        <div class="status-item">
          <span class="status-label">权限</span>
          <NTag size="small" :type="as.isElevated ? 'success' : 'warning'">
            {{ as.isElevated ? '已提权' : '未提权' }}
          </NTag>
        </div>
        <div class="status-item">
          <span class="status-label">Native Input</span>
          <NTag size="small" :type="as.nativeSupport.nativeInput.available ? 'success' : 'error'">
            {{ as.nativeSupport.nativeInput.available ? '可用' : '不可用' }}
          </NTag>
        </div>

        <NButton v-if="as.isWindows && !as.isElevated" size="small" @click="relaunchAsAdmin">
          <template #icon>
            <NIcon :component="Shield24Regular" />
          </template>
          提权重启
        </NButton>
      </div>

      <NAlert v-if="!canUseNativeInput" type="warning" :show-icon="false">
        {{ unavailableReason }}
      </NAlert>

      <template v-else>
        <section class="summary-grid">
          <div class="summary-panel summary-panel--wide">
            <div class="summary-title">目前激活的组合</div>
            <div class="combo-display">
              <template v-if="activeShortcut">
                <NTag
                  v-for="key in activeShortcut.keys"
                  :key="key.keyCode"
                  size="small"
                  type="success"
                  :bordered="false"
                >
                  {{ keyLabel(key.keyId) }}
                </NTag>
              </template>
              <span v-else class="placeholder">无</span>
            </div>
            <div class="summary-meta">
              {{ activeShortcut?.id || '没有按下的标准快捷键' }}
            </div>
          </div>

          <div class="summary-panel">
            <div class="summary-title">按下状态</div>
            <div class="metric-line">
              <span>修饰键</span>
              <strong>{{ debugState?.pressedModifierKeys.length ?? 0 }}</strong>
            </div>
            <div class="metric-line">
              <span>普通键</span>
              <strong>{{ debugState?.pressedOtherKeys.length ?? 0 }}</strong>
            </div>
          </div>

          <div class="summary-panel">
            <div class="summary-title">快捷键事件</div>
            <div class="metric-line">
              <span>普通</span>
              <strong>{{ lastShortcut?.id || '无' }}</strong>
            </div>
            <div class="metric-line">
              <span>Last Active</span>
              <strong>{{ lastActiveShortcut?.id || '无' }}</strong>
            </div>
            <div class="metric-line">
              <span>Stateful</span>
              <strong>{{ debugState?.activeStatefulShortcut?.id || '无' }}</strong>
            </div>
          </div>
        </section>

        <section class="stateful-control">
          <div class="section-title">Stateful 测试注册</div>
          <div class="stateful-row">
            <ShortcutSelector
              :target-id="KeyboardShortcutsRenderer.DEBUG_STATEFUL_TEST_TARGET_ID"
              v-model:shortcut-id="debugStatefulShortcutId"
            />
            <NButton
              size="small"
              type="primary"
              :disabled="!debugStatefulShortcutId"
              @click="registerDebugStatefulShortcut"
            >
              注册
            </NButton>
            <NButton
              size="small"
              secondary
              :disabled="!registeredStatefulShortcutId"
              @click="clearDebugStatefulShortcut"
            >
              取消
            </NButton>
            <NTag size="small" :type="registeredStatefulShortcutId ? 'success' : 'default'">
              {{
                registeredStatefulShortcutId ? `已注册 ${registeredStatefulShortcutId}` : '未注册'
              }}
            </NTag>
          </div>
          <div v-if="statefulRegistrationError" class="stateful-error">
            {{ statefulRegistrationError }}
          </div>
        </section>

        <section class="pressed-strip">
          <span class="section-title">正在按下</span>
          <div class="pressed-keys">
            <NTag
              v-for="key in pressedKeys"
              :key="key.keyCode"
              size="small"
              type="success"
              :bordered="false"
            >
              {{ keyLabel(key.keyId) }}
            </NTag>
            <span v-if="!pressedKeys.length" class="placeholder">无</span>
          </div>
        </section>

        <section class="keyboard-layout-panel">
          <div class="section-title">全尺寸键盘布局</div>
          <div class="keyboard-board">
            <div class="keyboard-cluster keyboard-main">
              <div
                v-for="(row, rowIndex) in mainKeyboardRows"
                :key="`main-${rowIndex}`"
                class="keyboard-row"
                :style="keyboardRowStyle(row)"
              >
                <template v-for="(key, keyIndex) in row.keys" :key="`main-${rowIndex}-${keyIndex}`">
                  <div
                    v-if="key.spacer"
                    class="keyboard-spacer"
                    :style="keyboardKeyStyle(key)"
                  ></div>
                  <div
                    v-else
                    class="key-tile"
                    :class="keyTileClass(key)"
                    :style="keyboardKeyStyle(key)"
                    :data-key-id="keyboardKeyId(key)"
                  >
                    <span class="key-label">{{ keyboardKeyLabel(key) }}</span>
                  </div>
                </template>
              </div>
            </div>

            <div class="keyboard-cluster keyboard-nav">
              <div
                v-for="(row, rowIndex) in navKeyboardRows"
                :key="`nav-${rowIndex}`"
                class="keyboard-row"
                :style="keyboardRowStyle(row)"
              >
                <template v-for="(key, keyIndex) in row.keys" :key="`nav-${rowIndex}-${keyIndex}`">
                  <div
                    v-if="key.spacer"
                    class="keyboard-spacer"
                    :style="keyboardKeyStyle(key)"
                  ></div>
                  <div
                    v-else
                    class="key-tile"
                    :class="keyTileClass(key)"
                    :style="keyboardKeyStyle(key)"
                    :data-key-id="keyboardKeyId(key)"
                    :title="keyboardKeyTitle(key)"
                  >
                    <span class="key-label">{{ keyboardKeyLabel(key) }}</span>
                  </div>
                </template>
              </div>
            </div>

            <div class="keyboard-numpad-grid">
              <div
                v-for="key in numpadKeyboardKeys"
                :key="`numpad-${key.code}-${key.row}-${key.col}`"
                class="key-tile"
                :class="keyTileClass(key)"
                :style="numpadKeyStyle(key)"
                :data-key-id="keyboardKeyId(key)"
                :title="keyboardKeyTitle(key)"
              >
                <span class="key-label">{{ keyboardKeyLabel(key) }}</span>
              </div>
            </div>
          </div>
        </section>

        <section class="event-log">
          <div class="section-title">最近事件</div>
          <div v-if="shortcutEvents.length" class="event-list">
            <div v-for="event in shortcutEvents" :key="event.id" class="event-row">
              <span class="event-time">{{ event.time }}</span>
              <NTag size="small" :type="event.type === 'shortcut' ? 'info' : 'success'">
                {{ event.type }}
              </NTag>
              <span class="event-shortcut">{{ event.shortcutId }}</span>
              <span class="event-unified">{{ event.unifiedId }}</span>
            </div>
          </div>
          <div v-else class="placeholder event-empty">暂无事件</div>
        </section>
      </template>
    </div>
  </NScrollbar>
</template>

<script setup lang="ts">
import { KeyboardShortcutsRenderer } from '@renderer-shared/shards/keyboard-shortcut'
import { AppCommonRenderer } from '@renderer-shared/shards/app-common'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { useInstance } from '@renderer-shared/shards'
import ShortcutSelector from '@main-window/components/ShortcutSelector.vue'
import type {
  KeyboardShortcutKeyState,
  KeyboardShortcutsDebugState,
  ShortcutDetails
} from '@shared/types/shards/keyboard-shortcut'
import { Shield24Regular } from '@vicons/fluent'
import { useIntervalFn } from '@vueuse/core'
import { NAlert, NButton, NIcon, NScrollbar, NTag } from 'naive-ui'
import { computed, onActivated, onBeforeUnmount, onDeactivated, ref, watch } from 'vue'

const as = useAppCommonStore()
const kbd = useInstance(KeyboardShortcutsRenderer)
const app = useInstance(AppCommonRenderer)

const debugState = ref<KeyboardShortcutsDebugState | null>(null)
const lastShortcut = ref<ShortcutDetails | null>(null)
const lastActiveShortcut = ref<ShortcutDetails | null>(null)
const debugStatefulShortcutId = ref<string | null>('LeftControl+Q')
const registeredStatefulShortcutId = ref<string | null>(null)
const statefulRegistrationError = ref<string | null>(null)
const shortcutEvents = ref<
  {
    id: string
    time: string
    type: 'shortcut' | 'last-active'
    shortcutId: string
    unifiedId: string
  }[]
>([])

const canUseNativeInput = computed(
  () => as.isWindows && as.isElevated && as.nativeSupport.nativeInput.available
)

const unavailableReason = computed(() => {
  if (!as.isWindows) {
    return '快捷键诊断仅在 Windows 可用。'
  }

  if (!as.isElevated) {
    return '快捷键诊断需要管理员权限。'
  }

  return '当前构建的原生输入能力不可用。'
})

interface KeyboardLayoutKey {
  code?: number
  label?: string
  w?: number
  h?: number
  row?: number
  col?: number
  spacer?: boolean
}

interface KeyboardLayoutRow {
  keys: KeyboardLayoutKey[]
  units?: number
}

const spacer = (w: number): KeyboardLayoutKey => ({ w, spacer: true })
const key = (code: number, label: string, w = 4): KeyboardLayoutKey => ({ code, label, w })
const numpadKey = (
  code: number,
  label: string,
  row: number,
  col: number,
  options: Pick<KeyboardLayoutKey, 'w' | 'h'> = {}
): KeyboardLayoutKey => ({ code, label, row, col, w: 1, ...options })

const mainKeyboardRows: KeyboardLayoutRow[] = [
  {
    keys: [
      key(27, 'Esc'),
      spacer(4),
      key(112, 'F1'),
      key(113, 'F2'),
      key(114, 'F3'),
      key(115, 'F4'),
      spacer(2),
      key(116, 'F5'),
      key(117, 'F6'),
      key(118, 'F7'),
      key(119, 'F8'),
      spacer(2),
      key(120, 'F9'),
      key(121, 'F10'),
      key(122, 'F11'),
      key(123, 'F12')
    ],
    units: 60
  },
  {
    keys: [
      key(192, '`'),
      key(49, '1'),
      key(50, '2'),
      key(51, '3'),
      key(52, '4'),
      key(53, '5'),
      key(54, '6'),
      key(55, '7'),
      key(56, '8'),
      key(57, '9'),
      key(48, '0'),
      key(189, '-'),
      key(187, '='),
      key(8, 'Backspace', 8)
    ],
    units: 60
  },
  {
    keys: [
      key(9, 'Tab', 6),
      key(81, 'Q'),
      key(87, 'W'),
      key(69, 'E'),
      key(82, 'R'),
      key(84, 'T'),
      key(89, 'Y'),
      key(85, 'U'),
      key(73, 'I'),
      key(79, 'O'),
      key(80, 'P'),
      key(219, '['),
      key(221, ']'),
      key(220, '\\', 6)
    ],
    units: 60
  },
  {
    keys: [
      key(20, 'Caps', 7),
      key(65, 'A'),
      key(83, 'S'),
      key(68, 'D'),
      key(70, 'F'),
      key(71, 'G'),
      key(72, 'H'),
      key(74, 'J'),
      key(75, 'K'),
      key(76, 'L'),
      key(186, ';'),
      key(222, "'"),
      key(13, 'Enter', 9)
    ],
    units: 60
  },
  {
    keys: [
      key(160, 'Shift', 9),
      key(90, 'Z'),
      key(88, 'X'),
      key(67, 'C'),
      key(86, 'V'),
      key(66, 'B'),
      key(78, 'N'),
      key(77, 'M'),
      key(188, ','),
      key(190, '.'),
      key(191, '/'),
      key(161, 'Shift', 11)
    ],
    units: 60
  },
  {
    keys: [
      key(162, 'Ctrl', 5),
      key(91, 'Win', 5),
      key(164, 'Alt', 5),
      key(32, 'Space', 25),
      key(165, 'Alt', 5),
      key(92, 'Win', 5),
      key(93, 'Menu', 5),
      key(163, 'Ctrl', 5)
    ],
    units: 60
  }
]

const navKeyboardRows: KeyboardLayoutRow[] = [
  { keys: [key(44, 'PrtSc'), key(145, 'Scroll'), key(19, 'Pause')], units: 12 },
  { keys: [spacer(12)], units: 12 },
  { keys: [key(45, 'Ins'), key(36, 'Home'), key(33, 'PgUp')], units: 12 },
  { keys: [key(46, 'Del'), key(35, 'End'), key(34, 'PgDn')], units: 12 },
  { keys: [spacer(12)], units: 12 },
  { keys: [spacer(4), key(38, 'Up'), spacer(4)], units: 12 },
  { keys: [key(37, 'Left'), key(40, 'Down'), key(39, 'Right')], units: 12 }
]

const numpadKeyboardKeys: KeyboardLayoutKey[] = [
  numpadKey(144, 'Num', 1, 1),
  numpadKey(111, '/', 1, 2),
  numpadKey(106, '*', 1, 3),
  numpadKey(109, '-', 1, 4),
  numpadKey(103, '7', 2, 1),
  numpadKey(104, '8', 2, 2),
  numpadKey(105, '9', 2, 3),
  numpadKey(107, '+', 2, 4, { h: 2 }),
  numpadKey(100, '4', 3, 1),
  numpadKey(101, '5', 3, 2),
  numpadKey(102, '6', 3, 3),
  numpadKey(97, '1', 4, 1),
  numpadKey(98, '2', 4, 2),
  numpadKey(99, '3', 4, 3),
  numpadKey(13, 'Enter', 4, 4, { h: 2 }),
  numpadKey(96, '0', 5, 1, { w: 2 }),
  numpadKey(110, '.', 5, 3)
]

const keyStateByCode = computed(() => {
  const map = new Map<number, KeyboardShortcutKeyState>()

  for (const key of debugState.value?.keyStates ?? []) {
    map.set(key.keyCode, key)
  }

  return map
})

const pressedKeys = computed(() => {
  return (debugState.value?.keyStates ?? []).filter((key) => key.pressed)
})

const activeShortcut = computed(() => debugState.value?.activeShortcut ?? null)

const displayKeyNames: Record<string, string> = {
  LeftControl: 'L Ctrl',
  RightControl: 'R Ctrl',
  Control: 'Ctrl',
  LeftShift: 'L Shift',
  RightShift: 'R Shift',
  Shift: 'Shift',
  LeftAlt: 'L Alt',
  RightAlt: 'R Alt',
  Alt: 'Alt',
  LeftMeta: 'L Win',
  RightMeta: 'R Win',
  Apps: 'Menu',
  Space: 'Space',
  Escape: 'Esc',
  Backspace: 'Backspace',
  CapsLock: 'Caps',
  PageUp: 'PgUp',
  PageDown: 'PgDn',
  LeftArrow: 'Left',
  UpArrow: 'Up',
  RightArrow: 'Right',
  DownArrow: 'Down',
  PrintScreen: 'PrtSc',
  NumpadMultiply: 'Num *',
  NumpadPlus: 'Num +',
  NumpadMinus: 'Num -',
  NumpadDot: 'Num .',
  NumpadDivkeyIde: 'Num /',
  NumpadClear: 'Clear',
  Semicolon: ';',
  Equals: '=',
  Comma: ',',
  Minus: '-',
  Dot: '.',
  ForwardSlash: '/',
  Section: '`',
  OpenBracket: '[',
  Backslash: '\\',
  CloseBracket: ']',
  Quote: "'",
  Backtick: '`'
}

const keyLabel = (keyId: string) => displayKeyNames[keyId] || keyId

const keyboardRowStyle = (row: KeyboardLayoutRow) => {
  const units = row.units ?? row.keys.reduce((sum, key) => sum + (key.w ?? 4), 0)
  return {
    '--keyboard-row-units': String(units)
  }
}

const keyboardKeyStyle = (key: KeyboardLayoutKey) => {
  return {
    gridColumn: `span ${key.w ?? 4}`
  }
}

const numpadKeyStyle = (key: KeyboardLayoutKey) => {
  return {
    gridColumn: `${key.col ?? 1} / span ${key.w ?? 1}`,
    gridRow: `${key.row ?? 1} / span ${key.h ?? 1}`
  }
}

const keyTileClass = (key: KeyboardLayoutKey) => {
  const state = key.code === undefined ? null : keyStateByCode.value.get(key.code)

  return {
    'key-tile--pressed': Boolean(state?.pressed),
    'key-tile--modifier': Boolean(state?.isModifier),
    'key-tile--wide': (key.w ?? 4) > 4,
    'key-tile--tall': (key.h ?? 1) > 1
  }
}

const keyboardKeyLabel = (key: KeyboardLayoutKey) => {
  if (key.label) {
    return key.label
  }

  if (key.code === undefined) {
    return ''
  }

  return keyLabel(keyStateByCode.value.get(key.code)?.keyId || `VK ${key.code}`)
}

const keyboardKeyId = (key: KeyboardLayoutKey) => {
  if (key.code === undefined) {
    return ''
  }

  return keyStateByCode.value.get(key.code)?.keyId || `VK ${key.code}`
}

const keyboardKeyTitle = (key: KeyboardLayoutKey) => {
  if (key.code === undefined) {
    return ''
  }

  return `${keyboardKeyId(key)} · VK ${key.code}`
}

const refreshDebugState = async () => {
  if (!canUseNativeInput.value) {
    debugState.value = null
    return
  }

  debugState.value = await kbd.getDebugState()
}

const registerDebugStatefulShortcut = async () => {
  if (!debugStatefulShortcutId.value) {
    return
  }

  statefulRegistrationError.value = null

  try {
    await kbd.setDebugStatefulShortcut(debugStatefulShortcutId.value)
    registeredStatefulShortcutId.value = debugStatefulShortcutId.value
  } catch (error: any) {
    statefulRegistrationError.value = error?.message || String(error)
  }
}

const clearDebugStatefulShortcut = async () => {
  statefulRegistrationError.value = null

  try {
    await kbd.setDebugStatefulShortcut(null)
    registeredStatefulShortcutId.value = null
  } catch (error: any) {
    statefulRegistrationError.value = error?.message || String(error)
  }
}

const pushShortcutEvent = (type: 'shortcut' | 'last-active', event: ShortcutDetails) => {
  shortcutEvents.value = [
    {
      id: `${type}:${event.id}:${event.pressed}:${performance.now()}`,
      time: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
      type,
      shortcutId: event.id || '无',
      unifiedId: event.unifiedId || '无'
    },
    ...shortcutEvents.value
  ].slice(0, 12)
}

kbd.onShortcut((event) => {
  lastShortcut.value = event
  pushShortcutEvent('shortcut', event)
})

kbd.onLastActiveShortcut((event) => {
  lastActiveShortcut.value = event
  pushShortcutEvent('last-active', event)
})

const { pause, resume } = useIntervalFn(refreshDebugState, 80, {
  immediate: false,
  immediateCallback: true
})

watch(
  canUseNativeInput,
  (canUse) => {
    if (canUse) {
      resume()
    } else {
      pause()
      debugState.value = null
    }
  },
  { immediate: true }
)

onActivated(() => {
  if (canUseNativeInput.value) {
    resume()
  }
})

onDeactivated(() => {
  pause()
  clearDebugStatefulShortcut()
})

onBeforeUnmount(() => {
  pause()
  clearDebugStatefulShortcut()
})

const relaunchAsAdmin = () => {
  app.relaunchAsAdministrator()
}
</script>

<style scoped>
.keyboard-shortcuts-test {
  box-sizing: border-box;
  min-height: 100%;
  padding: 16px;
  color: var(--la-color-text-primary);
}

.status-row,
.pressed-strip,
.stateful-control,
.event-log,
.keyboard-layout-panel,
.summary-panel {
  border: 1px solid rgba(0, 0, 0, 0.1);
  background: rgba(255, 255, 255, 0.56);
}

[data-theme='dark'] .status-row,
[data-theme='dark'] .pressed-strip,
[data-theme='dark'] .stateful-control,
[data-theme='dark'] .event-log,
[data-theme='dark'] .keyboard-layout-panel,
[data-theme='dark'] .summary-panel {
  border-color: rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.045);
}

.status-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 14px;
  padding: 10px 12px;
  border-radius: 8px;
  margin-bottom: 10px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.status-label,
.summary-title,
.section-title {
  color: rgba(0, 0, 0, 0.62);
  font-size: 12px;
  font-weight: 700;
}

[data-theme='dark'] .status-label,
[data-theme='dark'] .summary-title,
[data-theme='dark'] .section-title {
  color: rgba(255, 255, 255, 0.62);
}

.summary-grid {
  display: grid;
  grid-template-columns: minmax(280px, 1.3fr) repeat(2, minmax(220px, 1fr));
  gap: 10px;
  margin-top: 10px;
}

.summary-panel {
  min-width: 0;
  border-radius: 8px;
  padding: 12px;
}

.summary-panel--wide {
  min-height: 104px;
}

.combo-display {
  display: flex;
  min-height: 42px;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}

.combo-key {
  border-radius: 6px;
  border: 1px solid rgba(33, 133, 98, 0.36);
  background: rgba(43, 159, 118, 0.14);
  color: rgb(22, 112, 79);
  padding: 4px 8px;
  font-weight: 800;
}

[data-theme='dark'] .combo-key {
  border-color: rgba(74, 222, 128, 0.34);
  background: rgba(74, 222, 128, 0.13);
  color: rgb(134, 239, 172);
}

.summary-meta {
  overflow: hidden;
  color: rgba(0, 0, 0, 0.46);
  font-family: ui-monospace, SFMono-Regular, Consolas, 'Liberation Mono', monospace;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

[data-theme='dark'] .summary-meta {
  color: rgba(255, 255, 255, 0.44);
}

.metric-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-height: 26px;
  margin-top: 8px;
  font-size: 13px;
}

.metric-line strong {
  min-width: 0;
  overflow: hidden;
  font-family: ui-monospace, SFMono-Regular, Consolas, 'Liberation Mono', monospace;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pressed-strip,
.stateful-control,
.event-log {
  border-radius: 8px;
  margin-top: 10px;
  padding: 12px;
}

.stateful-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.stateful-error {
  margin-top: 8px;
  color: rgb(202, 85, 85);
  font-size: 12px;
}

.pressed-keys {
  display: flex;
  min-height: 24px;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}

.placeholder {
  color: rgba(0, 0, 0, 0.42);
}

[data-theme='dark'] .placeholder {
  color: rgba(255, 255, 255, 0.42);
}

.keyboard-layout-panel {
  overflow-x: auto;
  border-radius: 8px;
  margin-top: 10px;
  padding: 12px;
}

.keyboard-board {
  --key-gap: 4px;
  --key-height: 38px;

  display: grid;
  grid-template-columns: minmax(620px, 5fr) minmax(130px, 1fr) minmax(176px, 1.25fr);
  align-items: start;
  gap: 14px;
  min-width: 980px;
  margin-top: 8px;
}

.keyboard-cluster {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: var(--key-gap);
}

.keyboard-row {
  display: grid;
  grid-template-columns: repeat(var(--keyboard-row-units), minmax(0, 1fr));
  gap: var(--key-gap);
  min-height: var(--key-height);
}

.keyboard-spacer {
  min-height: var(--key-height);
}

.keyboard-numpad-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  grid-template-rows: repeat(5, var(--key-height));
  gap: var(--key-gap);
}

.key-tile {
  position: relative;
  display: flex;
  min-width: 0;
  min-height: var(--key-height);
  align-items: center;
  justify-content: center;
  flex-direction: column;
  border-radius: 6px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  background: rgba(0, 0, 0, 0.035);
  color: rgba(0, 0, 0, 0.72);
  box-shadow:
    inset 0 -2px 0 rgba(0, 0, 0, 0.08),
    0 1px 1px rgba(0, 0, 0, 0.05);
  transition:
    background-color 0.08s ease,
    border-color 0.08s ease,
    box-shadow 0.08s ease,
    color 0.08s ease;
}

.key-tile[data-key-id]:hover::after {
  position: absolute;
  z-index: 2;
  bottom: calc(100% + 5px);
  left: 50%;
  max-width: 160px;
  transform: translateX(-50%);
  border-radius: 6px;
  background: rgba(20, 24, 31, 0.92);
  color: rgba(255, 255, 255, 0.94);
  content: attr(data-key-id);
  font-family: ui-monospace, SFMono-Regular, Consolas, 'Liberation Mono', monospace;
  font-size: 11px;
  font-weight: 700;
  line-height: 1;
  overflow: hidden;
  padding: 6px 7px;
  pointer-events: none;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.key-tile[data-key-id]:hover::before {
  position: absolute;
  z-index: 2;
  bottom: calc(100% + 4px);
  left: 50%;
  width: 7px;
  height: 7px;
  transform: translateX(-50%) rotate(45deg);
  background: rgba(20, 24, 31, 0.92);
  content: '';
  pointer-events: none;
}

[data-theme='dark'] .key-tile {
  border-color: rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.76);
  box-shadow:
    inset 0 -2px 0 rgba(0, 0, 0, 0.28),
    0 1px 1px rgba(0, 0, 0, 0.18);
}

.key-tile--modifier {
  border-color: rgba(49, 112, 196, 0.28);
  background: rgba(49, 112, 196, 0.09);
}

[data-theme='dark'] .key-tile--modifier {
  border-color: rgba(96, 165, 250, 0.5);
  background: rgba(59, 130, 246, 0.18);
  color: rgb(191, 219, 254);
}

.key-tile--pressed {
  border-color: rgba(43, 159, 118, 0.72);
  background: rgba(43, 159, 118, 0.24);
  box-shadow:
    inset 0 2px 0 rgba(0, 0, 0, 0.1),
    0 0 0 1px rgba(43, 159, 118, 0.16);
  color: rgb(20, 96, 70);
}

[data-theme='dark'] .key-tile--pressed {
  border-color: rgba(74, 222, 128, 0.74);
  background: rgba(74, 222, 128, 0.2);
  box-shadow:
    inset 0 2px 0 rgba(0, 0, 0, 0.24),
    0 0 0 1px rgba(74, 222, 128, 0.18);
  color: rgb(187, 247, 208);
}

[data-theme='dark'] .key-tile--modifier.key-tile--pressed {
  border-color: rgba(125, 211, 252, 0.82);
  background: linear-gradient(180deg, rgba(56, 189, 248, 0.28), rgba(74, 222, 128, 0.2));
  color: rgb(224, 242, 254);
}

.key-label {
  max-width: 100%;
  overflow: hidden;
  padding: 0 3px;
  font-size: 11px;
  font-weight: 800;
  line-height: 1.2;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.key-tile--wide .key-label {
  font-size: 12px;
}

.event-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 8px;
}

.event-row {
  display: grid;
  grid-template-columns: 76px 92px minmax(120px, 1fr) minmax(120px, 1fr);
  align-items: center;
  gap: 8px;
  min-height: 28px;
  border-radius: 6px;
  padding: 4px 6px;
  background: rgba(0, 0, 0, 0.035);
}

[data-theme='dark'] .event-row {
  background: rgba(255, 255, 255, 0.05);
}

.event-time,
.event-shortcut,
.event-unified {
  min-width: 0;
  overflow: hidden;
  font-family: ui-monospace, SFMono-Regular, Consolas, 'Liberation Mono', monospace;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.event-unified {
  color: rgba(0, 0, 0, 0.48);
}

[data-theme='dark'] .event-unified {
  color: rgba(255, 255, 255, 0.46);
}

.event-empty {
  margin-top: 8px;
}

@media (max-width: 900px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }

  .keyboard-board {
    min-width: 920px;
  }

  .event-row {
    grid-template-columns: 72px 88px minmax(80px, 1fr);
  }

  .event-unified {
    display: none;
  }
}
</style>
