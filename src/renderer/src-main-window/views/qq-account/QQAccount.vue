<template>
  <div class="qq-account-page">
    <div class="header">
      <div class="title-row">
        <div class="title-left">
          <NIcon class="title-icon"><PeopleTeamIcon /></NIcon>
          <span class="title-label">{{ t('QQAccount.title') }}</span>
        </div>
      </div>
      <div class="game-path-row">
        <span class="game-path-label">游戏路径:</span>
        <NInput v-model:value="gamePath" placeholder="例如 E:\\WeGameApps\\英雄联盟" style="flex: 1" @blur="handleSaveGamePath" />
        <NButton size="small" @click="handleDetectGamePath" :loading="gamePathLoading">检测</NButton>
        <NButton size="small" @click="handleSaveGamePath">保存</NButton>
      </div>
      <NTabs v-model:value="currentTab" size="medium">
        <NTab name="accounts" :tab="t('QQAccount.tab.accounts')" />
        <NTab name="single" :tab="t('QQAccount.tab.single')" />
        <NTab name="batch" :tab="t('QQAccount.tab.batch')" />
      </NTabs>
    </div>

    <div class="content">
      <!-- 賬號管理 -->
      <div v-show="currentTab === 'accounts'" class="accounts-tab">
        <div class="add-row">
          <NInput
            v-model:value="addForm.qq"
            :placeholder="t('QQAccount.field.qq')"
            :maxlength="13"
            style="width: 150px"
            @keyup.enter="handleAdd"
          />
          <NSelect
            v-model:value="addForm.area"
            :options="areaOptions"
            :placeholder="t('QQAccount.field.area')"
            style="width: 160px"
            filterable
          />
          <NInput
            v-model:value="addForm.gameId"
            :placeholder="t('QQAccount.field.gameId')"
            style="width: 260px"
            @keyup.enter="handleAdd"
          />
          <NInput
            v-model:value="addForm.password"
            :type="showPassword ? 'text' : 'password'"
            placeholder="密码（留空则不启用快捷登录）"
            style="width: 180px"
            @keyup.enter="handleAdd"
          />
          <NButton size="small" @click="showPassword = !showPassword">
            {{ showPassword ? '隐' : '显' }}
          </NButton>
          <NButton type="primary" @click="handleAdd" :loading="adding">
            {{ t('QQAccount.action.add') }}
          </NButton>
          <NButton @click="loadAccounts" :loading="loading">
            {{ t('QQAccount.action.refresh') }}
          </NButton>
          <NButton size="small" type="warning" @click="handleBatchBanAll" :loading="bulkBanLoading">
            {{ t('QQAccount.action.batchBanAll') }}
          </NButton>
          <NButton size="small" type="info" @click="handleBatchRankAll" :loading="bulkRankLoading">
            {{ t('QQAccount.action.batchRankAll') }}
          </NButton>
        </div>

        <div
          class="accounts-table"
          @dragstart="onRowDragStart"
          @dragover="onRowDragOver"
          @drop="onRowDrop"
          @dragend="onRowDragEnd"
        >
          <NDataTable
            :columns="columns"
            :data="accounts"
            :bordered="false"
            :loading="loading"
            size="small"
            :row-key="(row: QQAccountDto) => row.id"
            :row-props="rowProps"
          />
        </div>
      </div>

      <!-- 單個封禁查詢 -->
      <div v-show="currentTab === 'single'" class="single-tab">
        <div class="query-row">
          <NInput
            v-model:value="singleQQ"
            :placeholder="t('QQAccount.field.qq')"
            :maxlength="13"
            style="width: 220px"
            @keyup.enter="handleSingleQuery"
          />
          <NButton type="primary" @click="handleSingleQuery" :loading="singleLoading">
            {{ t('QQAccount.action.query') }}
          </NButton>
        </div>
        <div class="result-box">
          <div v-if="singleResult" :class="['result-line', singleResult.isBanned ? 'banned' : 'normal']">
            <template v-if="singleResult.isBanned">
              <strong>{{ singleResult.qq }}</strong> · {{ t('QQAccount.status.banned') }} ·
              {{ singleResult.banUntil }} | {{ singleResult.banRemaining }}
            </template>
            <template v-else>
              <strong>{{ singleResult.qq }}</strong> · {{ t('QQAccount.status.normal') }}
            </template>
          </div>
          <div v-else-if="singleError" class="result-line error">{{ singleError }}</div>
        </div>
        <div class="history-section" v-if="queryHistory.length > 0">
          <div class="history-title">{{ t('QQAccount.history.title') }}</div>
          <ul class="history-list">
            <li
              v-for="(h, i) in queryHistory"
              :key="i"
              :class="['history-item', h.isBanned ? 'banned' : 'normal']"
              @dblclick="handleHistoryClick(h.qq)"
            >
              <span class="history-qq">{{ h.qq }}</span>
              <span class="history-status">
                {{ h.isBanned ? `${h.banUntil} | ${h.banRemaining}` : t('QQAccount.status.normal') }}
              </span>
            </li>
          </ul>
        </div>
      </div>

      <!-- 批量查詢 -->
      <div v-show="currentTab === 'batch'" class="batch-tab">
        <NInput
          v-model:value="batchInput"
          type="textarea"
          :placeholder="t('QQAccount.field.batchPlaceholder')"
          :autosize="{ minRows: 6, maxRows: 12 }"
          style="margin-bottom: 12px"
        />
        <div class="batch-row">
          <NButton type="primary" @click="handleBatchQuery" :loading="batchLoading">
            {{ t('QQAccount.action.batchQuery') }}
          </NButton>
          <span class="batch-hint">{{ t('QQAccount.field.batchHint') }}</span>
        </div>
        <div class="batch-results" v-if="batchResults.length > 0">
          <div
            v-for="(r, i) in batchResults"
            :key="i"
            :class="['batch-line', `batch-${r.color}`]"
          >
            <span class="batch-icon">{{ r.color === 'green' ? '✓' : r.color === 'red' ? '✗' : '?' }}</span>
            <span class="batch-qq">{{ r.qq }}</span>
            <span class="batch-status">{{ r.status }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 編輯彈窗 -->
    <NModal v-model:show="editModalOpen" preset="card" :title="t('QQAccount.action.edit')" style="width: 480px">
      <div class="edit-form">
        <div class="edit-row">
          <label>QQ</label>
          <NInput v-model:value="editForm.qq" :maxlength="13" style="flex: 1" />
        </div>
        <div class="edit-row">
          <label>{{ t('QQAccount.field.area') }}</label>
          <NSelect v-model:value="editForm.area" :options="areaOptions" filterable style="flex: 1" />
        </div>
        <div class="edit-row">
          <label>{{ t('QQAccount.field.gameId') }}</label>
          <NInput v-model:value="editForm.gameId" style="flex: 1" />
        </div>
        <div class="edit-row">
          <label>{{ t('QQAccount.field.password') }}</label>
          <NInput v-model:value="editForm.password" type="password" placeholder="留空则不修改" style="flex: 1" />
        </div>
        <div class="edit-actions">
          <NButton @click="editModalOpen = false">{{ t('QQAccount.action.cancel') }}</NButton>
          <NButton type="primary" @click="handleEditSave" :loading="editSaving">
            {{ t('QQAccount.action.save') }}
          </NButton>
        </div>
      </div>
    </NModal>
  </div>
</template>

<script setup lang="ts">
import { useInstance } from '@renderer-shared/shards'
import { AutoLoginCRenderer } from '@renderer-shared/shards/auto-login-c'
import {
  BatchBanQueryResult,
  CreateQQAccountDto,
  QQ_AREAS,
  QQAccountDto,
  QQAccountRenderer
} from '@renderer-shared/shards/qq-account'
import { useRouter } from 'vue-router'
import { PeopleTeam24Filled as PeopleTeamIcon } from '@vicons/fluent'
import { useTranslation } from 'i18next-vue'
import {
  DataTableColumns,
  NButton,
  NDataTable,
  NIcon,
  NInput,
  NModal,
  NSelect,
  NTab,
  NTabs,
  NTag,
  useDialog,
  useMessage
} from 'naive-ui'
import { computed, h, onMounted, onUnmounted, ref } from 'vue'

interface HistoryItem {
  qq: string
  isBanned: boolean
  banUntil: string
  banRemaining: string
}

const { t } = useTranslation()
const message = useMessage()
const dialog = useDialog()
const router = useRouter()
const qqAccount = useInstance(QQAccountRenderer)
const autoLoginC = useInstance(AutoLoginCRenderer)
const showPassword = ref(false)
const loggingInId = ref<string | null>(null)
const gamePath = ref('')
const gamePathLoading = ref(false)

async function loadGamePath() {
  gamePath.value = await autoLoginC.getGamePath()
}

async function handleSaveGamePath() {
  await autoLoginC.setGamePath(gamePath.value)
  message.success('游戏路径已保存')
}

async function handleDetectGamePath() {
  gamePathLoading.value = true
  try {
    const p = await autoLoginC.detectGamePath()
    if (p) { gamePath.value = p; await autoLoginC.setGamePath(p); message.success(`已检测到: ${p}`) }
    else message.warning('未检测到，请手动输入')
  } catch (e: any) { message.error(e?.message || String(e)) }
  finally { gamePathLoading.value = false }
}

const currentTab = ref<'accounts' | 'single' | 'batch'>('accounts')
const accounts = ref<QQAccountDto[]>([])
const loading = ref(false)
const adding = ref(false)
const bulkBanLoading = ref(false)
const bulkRankLoading = ref(false)

const areaOptions = QQ_AREAS.map((a) => ({ label: a, value: a }))

// ===== 新增表單 =====
const addForm = ref({
  qq: '',
  area: QQ_AREAS[0] as string,
  gameId: '',
  password: ''
})

async function handleAdd() {
  if (!addForm.value.qq.trim()) {
    message.warning(t('QQAccount.msg.qqRequired'))
    return
  }
  adding.value = true
  try {
    const dto: CreateQQAccountDto = {
      qq: addForm.value.qq.trim(),
      area: addForm.value.area,
      gameId: addForm.value.gameId.trim() || null,
      password: addForm.value.password || null
    }
    await qqAccount.createAccount(dto)
    message.success(t('QQAccount.msg.added'))
    addForm.value.qq = ''
    addForm.value.gameId = ''
    addForm.value.password = ''
    await loadAccounts()
  } catch (e: any) {
    message.error(e?.message || String(e))
  } finally {
    adding.value = false
  }
}

async function loadAccounts() {
  loading.value = true
  try {
    accounts.value = await qqAccount.listAccounts()
  } catch (e: any) {
    message.error(e?.message || String(e))
  } finally {
    loading.value = false
  }
}

async function handleDelete(row: QQAccountDto) {
  dialog.warning({
    title: t('QQAccount.confirm.delete'),
    content: `QQ ${row.qq}`,
    positiveText: t('QQAccount.action.delete'),
    negativeText: t('QQAccount.action.cancel'),
    onPositiveClick: async () => {
      try {
        await qqAccount.deleteAccount(row.id)
        message.success(t('QQAccount.msg.deleted'))
        await loadAccounts()
      } catch (e: any) {
        message.error(e?.message || String(e))
      }
    }
  })
}


async function handleOpenMatchHistory(row: QQAccountDto) {
  if (!row.gameId) {
    message.warning(t('QQAccount.msg.gameIdMissing'))
    return
  }
  try {
    const { puuid, sgpServerId } = await qqAccount.resolveAccountForMatchHistory(
      row.area,
      row.gameId
    )
    await router.push({ name: 'match-history', params: { puuid, sgpServerId } })
  } catch (e: any) {
    if (e?.code === 'LcuNotConnected') {
      message.warning(e?.message || t('QQAccount.msg.lcuNotConnected'))
    } else {
      message.error(e?.message || String(e))
    }
  }
}

// ===== 編輯彈窗 =====
const editModalOpen = ref(false)
const editSaving = ref(false)
const editForm = ref({
  id: '',
  qq: '',
  area: '',
  gameId: '',
  password: ''
})

function handleOpenEdit(row: QQAccountDto) {
  editForm.value = {
    id: row.id,
    qq: row.qq,
    area: row.area,
    gameId: row.gameId || '',
    password: ''
  }
  editModalOpen.value = true
}

async function handleEditSave() {
  editSaving.value = true
  try {
    await qqAccount.updateAccount({
      id: editForm.value.id,
      qq: editForm.value.qq.trim(),
      area: editForm.value.area,
      gameId: editForm.value.gameId.trim() || null,
      password: editForm.value.password || null
    })
    message.success(t('QQAccount.msg.saved'))
    editModalOpen.value = false
    await loadAccounts()
  } catch (e: any) {
    message.error(e?.message || String(e))
  } finally {
    editSaving.value = false
  }
}

// ===== 批量操作（右上角）=====
async function handleBatchBanAll() {
  if (accounts.value.length === 0) {
    message.warning(t('QQAccount.msg.emptyAccounts'))
    return
  }
  bulkBanLoading.value = true
  try {
    accounts.value = await qqAccount.queryAllAccountsBan()
    message.success(t('QQAccount.msg.batchBanDone'))
  } catch (e: any) {
    message.error(e?.message || String(e))
  } finally {
    bulkBanLoading.value = false
  }
}

async function handleBatchRankAll() {
  if (accounts.value.length === 0) {
    message.warning(t('QQAccount.msg.emptyAccounts'))
    return
  }
  bulkRankLoading.value = true
  try {
    const { accounts: updated, queried, skipped, currentArea } =
      await qqAccount.queryAllAccountsRank()
    accounts.value = updated
    if (queried === 0) {
      message.warning(
        `当前登录大区 [${currentArea}] 下无匹配账号；跳过 ${skipped} 个非当前大区账号（保留原段位）`
      )
    } else {
      message.success(
        `已查询 ${queried} 个 [${currentArea}] 账号；跳过 ${skipped} 个非当前大区账号（保留原段位）`
      )
    }
  } catch (e: any) {
    if (e?.code === 'LcuNotConnected') {
      message.warning(e?.message || t('QQAccount.msg.lcuNotConnected'))
      await loadAccounts() // 重載確保 UI 對齊 DB（上次查詢結果）
    } else {
      message.error(e?.message || String(e))
    }
  } finally {
    bulkRankLoading.value = false
  }
}

// ===== 表格列 =====
const dragIndex = ref(-1)

function rowProps(_row: QQAccountDto, index: number) {
  return {
    draggable: true as any,
    'data-row-index': index
  }
}

function onRowDragStart(e: DragEvent) {
  const tr = (e.target as HTMLElement).closest('tr')
  if (!tr) return
  dragIndex.value = parseInt(tr.dataset.rowIndex || '-1')
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', '')
  }
}

function onRowDragOver(e: DragEvent) {
  e.preventDefault()
  if (e.dataTransfer) e.dataTransfer.dropEffect = 'move'
}

async function onRowDrop(e: DragEvent) {
  e.preventDefault()
  const tr = (e.target as HTMLElement).closest('tr')
  if (!tr || dragIndex.value < 0) return
  const dropIdx = parseInt(tr.dataset.rowIndex || '-1')
  if (dropIdx < 0 || dropIdx === dragIndex.value) {
    dragIndex.value = -1
    return
  }
  const items = [...accounts.value]
  const [moved] = items.splice(dragIndex.value, 1)
  items.splice(dropIdx, 0, moved)
  accounts.value = items
  dragIndex.value = -1
  try {
    await qqAccount.reorderAccounts(items.map((a) => a.id))
  } catch (err: any) {
    message.error(err?.message || String(err))
    await loadAccounts()
  }
}

function onRowDragEnd() {
  dragIndex.value = -1
}

const columns = computed<DataTableColumns<QQAccountDto>>(() => [
  {
    title: '',
    key: 'drag-handle',
    width: 36,
    render: () =>
      h('span', { class: 'drag-handle-icon', innerHTML: '&#x2630;' })
  },
  {
    title: 'QQ',
    key: 'qq',
    width: 140,
    render: (row) =>
      h(
        'span',
        {
          class: 'mono clickable',
          style: 'cursor: pointer; text-decoration: underline dotted rgba(160,160,160,0.5)',
          title: '点击复制',
          onClick: () => {
            navigator.clipboard.writeText(row.qq).then(
              () => message.success(t('QQAccount.msg.copied')),
              () => message.error(t('QQAccount.msg.copyFailed'))
            )
          }
        },
        row.qq
      )
  },
  {
    title: t('QQAccount.col.status'),
    key: 'banStatus',
    width: 200,
    render: (row) => {
      const status = row.banStatus || '未查询'
      let type: 'success' | 'error' | 'warning' | 'default' = 'default'
      let text = status
      if (status === '正常') type = 'success'
      else if (status === '已封禁') {
        type = 'error'
        if (row.banUntil) text = `${status} · ${row.banUntil}`
      } else if (status === '查询失败') type = 'warning'
      return h(NTag, { type, size: 'small', round: true }, () => text)
    }
  },
  { title: t('QQAccount.col.area'), key: 'area', width: 110 },
  {
    title: t('QQAccount.col.gameId'),
    key: 'gameId',
    width: 220,
    render: (row) => {
      if (!row.gameId) return h('span', { class: 'dim' }, '—')
      return h(
        'span',
        {
          class: 'mono clickable',
          style: 'cursor: pointer; text-decoration: underline dotted rgba(160,160,160,0.5)',
          title: '点击复制',
          onClick: () => {
            navigator.clipboard.writeText(row.gameId).then(
              () => message.success(t('QQAccount.msg.copied')),
              () => message.error(t('QQAccount.msg.copyFailed'))
            )
          }
        },
        row.gameId
      )
    }
  },
  {
    title: t('QQAccount.col.rank'),
    key: 'rankInfo',
    width: 240,
    render: (row) => {
      if (!row.rankInfo) return h('span', { class: 'dim' }, '—')
      const failed = row.rankInfo === '查询失败' || row.rankInfo === '游戏ID缺失'
        || row.rankInfo === 'ID格式错误' || row.rankInfo === '大区未支持'
      return h('span', { class: failed ? 'dim' : 'rank-text' }, row.rankInfo)
    }
  },
  {
    title: t('QQAccount.col.actions'),
    key: 'actions',
    fixed: 'right',
    width: 280,
    render: (row) => {
      const hasGameId = !!row.gameId
      return h('div', { class: 'action-cell' }, [
        h(
          NButton,
          {
            size: 'tiny',
            type: 'info',
            secondary: true,
            disabled: !hasGameId,
            onClick: () => handleOpenMatchHistory(row)
          },
          () => t('QQAccount.action.matchHistory')
        ),
        h(
          NButton,
          { size: 'tiny', secondary: true, onClick: () => handleOpenEdit(row) },
          () => t('QQAccount.action.edit')
        ),
        h(
          NButton,
          { size: 'tiny', type: 'error', secondary: true, onClick: () => handleDelete(row) },
          () => t('QQAccount.action.delete')
        ),
        row.hasPassword
          ? h(
              NButton,
              {
                size: 'tiny',
                type: 'primary',
                loading: loggingInId.value === row.id,
                disabled: loggingInId.value === row.id || row.banStatus === '已封禁',
                onClick: () => handleAutoLogin(row)
              },
              () => loggingInId.value === row.id ? '登录中...' : '快捷登录'
            )
          : null
      ])
    }
  }
])

// ===== 單個封禁查詢 =====
const singleQQ = ref('')
const singleLoading = ref(false)
const singleResult = ref<{ qq: string; isBanned: boolean; banUntil: string; banRemaining: string } | null>(null)
const singleError = ref('')
const queryHistory = ref<HistoryItem[]>([])
const HISTORY_KEY = 'akari-qq-query-history'
const MAX_HISTORY = 20

function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    if (raw) queryHistory.value = JSON.parse(raw)
  } catch (_) {
    /* ignore */
  }
}

function saveHistory() {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(queryHistory.value))
}

function addHistory(qq: string, isBanned: boolean, banUntil: string, banRemaining: string) {
  queryHistory.value = queryHistory.value.filter((h) => h.qq !== qq)
  queryHistory.value.unshift({ qq, isBanned, banUntil, banRemaining })
  if (queryHistory.value.length > MAX_HISTORY) queryHistory.value.pop()
  saveHistory()
}

async function handleSingleQuery() {
  const qq = singleQQ.value.trim()
  if (!qq) {
    message.warning(t('QQAccount.msg.qqRequired'))
    return
  }
  singleLoading.value = true
  singleError.value = ''
  singleResult.value = null
  try {
    const r = await qqAccount.querySingleBan(qq)
    singleResult.value = {
      qq: r.qq,
      isBanned: r.isBanned,
      banUntil: r.banUntil,
      banRemaining: r.banRemaining
    }
    addHistory(r.qq, r.isBanned, r.banUntil, r.banRemaining)
  } catch (e: any) {
    singleError.value = e?.message || String(e)
  } finally {
    singleLoading.value = false
  }
}

function handleHistoryClick(qq: string) {
  singleQQ.value = qq
  handleSingleQuery()
}

// ===== 批量查詢 =====
const batchInput = ref('')
const batchLoading = ref(false)
const batchResults = ref<BatchBanQueryResult[]>([])

async function handleBatchQuery() {
  const qqs = batchInput.value
    .split(/[\r\n,，;；\s]+/)
    .map((q) => q.trim())
    .filter(Boolean)
  if (qqs.length === 0) {
    message.warning(t('QQAccount.msg.batchEmpty'))
    return
  }
  batchLoading.value = true
  batchResults.value = []
  try {
    batchResults.value = await qqAccount.queryBatchBan(qqs)
  } catch (e: any) {
    message.error(e?.message || String(e))
  } finally {
    batchLoading.value = false
  }
}

async function handleAutoLogin(row: QQAccountDto) {
  loggingInId.value = row.id
  loginStatus.value = '准备中...'
  try {
    await autoLoginC.autoLogin(row.id)
    message.success(`QQ ${row.qq} 登录成功`)
  } catch (e: any) {
    message.error(`QQ ${row.qq} 登录失败: ${e?.message || String(e)}`)
  } finally {
    loggingInId.value = null
    setTimeout(() => { loginStatus.value = '' }, 5000)
  }
}

const loginStatus = ref('')
let disposeStatusListener: (() => void) | null = null

onMounted(() => {
  loadAccounts()
  loadHistory()
  loadGamePath()
  disposeStatusListener = autoLoginC.onStatus((s) => {
    console.log('[AutoLoginC status]', s)
    loginStatus.value = s.message
    if (s.state === 'error') {
      message.error(s.message)
    } else if (s.state === 'success') {
      message.success(s.message)
    } else if (s.state === 'tool_status') {
      message.info(`登录器: ${s.message}`)
    } else {
      message.info(s.message)
    }
  })
})

onUnmounted(() => {
  if (disposeStatusListener) disposeStatusListener()
})
</script>

<style lang="less" scoped>
.qq-account-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 16px;
  gap: 12px;
  overflow: hidden;
}

.header {
  display: flex;
  flex-direction: column;
  gap: 8px;

  .game-path-row {
    display: flex;
    align-items: center;
    gap: 8px;
    .game-path-label { font-size: 13px; white-space: nowrap; color: rgba(200,200,200,0.85); }
  }

  .title-row {
    display: flex;
    align-items: center;
    justify-content: space-between;

    .title-left {
      display: flex;
      align-items: center;
      gap: 8px;

      .title-icon {
        font-size: 20px;
      }

      .title-label {
        font-size: 16px;
        font-weight: 600;
      }
    }
  }
}

.content {
  flex: 1;
  min-height: 0;
  overflow: auto;
}

.accounts-tab {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
}

.add-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.accounts-table {
  flex: 1;
  min-height: 0;

  :deep(.drag-handle-icon) {
    cursor: grab;
    color: rgba(160, 160, 160, 0.6);
    font-size: 16px;
    line-height: 1;
    user-select: none;

    &:active {
      cursor: grabbing;
    }
  }

  :deep(tr[draggable='true']) {
    cursor: default;

    &.drag-over {
      background: rgba(100, 180, 255, 0.1);
    }
  }
}

:deep(.action-cell) {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

:deep(.mono) {
  font-family: Consolas, 'Courier New', monospace;
}

:deep(.dim) {
  color: rgba(160, 160, 160, 0.7);
}

:deep(.rank-text) {
  font-family: Consolas, 'Courier New', monospace;
  color: #b9e7c4;
}

.single-tab {
  display: flex;
  flex-direction: column;
  gap: 12px;

  .query-row {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .result-box {
    min-height: 40px;

    .result-line {
      padding: 10px 14px;
      border-radius: 4px;
      font-size: 14px;

      &.normal {
        background: rgba(76, 175, 80, 0.12);
        color: #4caf50;
      }

      &.banned {
        background: rgba(244, 67, 54, 0.12);
        color: #f44336;
      }

      &.error {
        background: rgba(255, 152, 0, 0.12);
        color: #ff9800;
      }
    }
  }

  .history-section {
    margin-top: 8px;

    .history-title {
      font-size: 13px;
      color: rgba(180, 180, 180, 0.7);
      margin-bottom: 6px;
    }

    .history-list {
      list-style: none;
      padding: 0;
      margin: 0;
      max-height: 240px;
      overflow: auto;
    }

    .history-item {
      display: flex;
      justify-content: space-between;
      padding: 6px 10px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 13px;

      &:hover {
        background: rgba(255, 255, 255, 0.04);
      }

      .history-qq {
        font-family: Consolas, monospace;
      }

      &.banned .history-status {
        color: #f44336;
      }

      &.normal .history-status {
        color: #4caf50;
      }
    }
  }
}

.batch-tab {
  display: flex;
  flex-direction: column;
  gap: 12px;

  .batch-row {
    display: flex;
    gap: 12px;
    align-items: center;
  }

  .batch-hint {
    font-size: 12px;
    color: rgba(160, 160, 160, 0.7);
  }

  .batch-results {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 8px;
    background: rgba(0, 0, 0, 0.08);
    border-radius: 4px;
    max-height: 360px;
    overflow: auto;
  }

  .batch-line {
    display: flex;
    gap: 12px;
    padding: 4px 8px;
    font-size: 13px;
    align-items: center;

    .batch-icon {
      width: 16px;
      text-align: center;
      font-weight: bold;
    }

    .batch-qq {
      font-family: Consolas, monospace;
      min-width: 120px;
    }

    &.batch-green {
      color: #4caf50;
    }

    &.batch-red {
      color: #f44336;
    }

    &.batch-gray {
      color: rgba(160, 160, 160, 0.7);
    }
  }
}

.edit-form {
  display: flex;
  flex-direction: column;
  gap: 12px;

  .edit-row {
    display: flex;
    align-items: center;
    gap: 10px;

    label {
      width: 80px;
      font-size: 13px;
      color: rgba(200, 200, 200, 0.8);
    }
  }

  .edit-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 8px;
  }
}
</style>
