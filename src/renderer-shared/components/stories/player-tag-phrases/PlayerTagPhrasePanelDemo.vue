<template>
  <StoryPanel
    title="Player tag quick phrases"
    description="新增、删除并点击短语追加到玩家标记。此 Story 只使用本地状态，不依赖 LCU 或 saved-player shard。"
  >
    <div class="w-118 max-w-full text-black dark:text-white">
      <NInput
        ref="input"
        v-model:value="tag"
        type="textarea"
        :autosize="{ minRows: 3, maxRows: 4 }"
        placeholder="输入玩家标记"
      />

      <PlayerTagPhrasePanel
        v-model:phrases="phrases"
        v-model:expanded="expanded"
        class="mt-2"
        :can-clear="Boolean(tag)"
        @append="handleAppend"
        @clear="tag = ''"
      />
    </div>
  </StoryPanel>
</template>

<script setup lang="ts">
import PlayerTagPhrasePanel from '@renderer-shared/components/player-tag-edit/PlayerTagPhrasePanel.vue'
import {
  focusTextInput,
  insertTextAtSelection
} from '@renderer-shared/components/player-tag-edit/cursor'
import { NInput, type InputInst } from 'naive-ui'
import { nextTick, ref, useTemplateRef } from 'vue'

import StoryPanel from '../StoryPanel.vue'

const tag = ref('补位辅助，')
const phrases = ref(['沟通友好', '团队意识强', '擅长游走'])
const expanded = ref(true)
const input = useTemplateRef<InputInst>('input')

const handleAppend = (phrase: string) => {
  const result = insertTextAtSelection(input.value, tag.value, phrase)
  tag.value = result.value
  void nextTick(() => focusTextInput(input.value, result.cursorPosition))
}
</script>
