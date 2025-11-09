<template>
  <div class="single-root">
    <NScrollbar class="outer-wrapper">
      <div style="margin-bottom: 12px">此页面被用于测试功能，仅在开发环境或 .rabi 版本中可见。</div>
      <div style="margin-bottom: 12px">
        This page is reserved for testing scenarios, can only be seen in dev or .rabi mode.
      </div>
      <div class="colors-container">
        <div
          class="card"
          v-for="(team, key) in teams"
          :key="key"
          :style="{
            backgroundColor: team.foregroundColor,
            color: team.color,
            border: '4px solid ' + team.borderColor
          }"
        >
          <div class="title">Team {{ key }}</div>
          <div class="info">foregroundColor: {{ team.foregroundColor }}</div>
          <div class="info">text color: {{ team.color }}</div>
          <div class="info">borderColor: {{ team.borderColor }}</div>
        </div>
      </div>
      <div class="markdown-body" v-html="html"></div>
    </NScrollbar>
  </div>
</template>

<script setup lang="ts">
import { PREMADE_TEAM_COLORS } from '@renderer-shared/components/ongoing-game-panel/ongoing-game-utils'
import { markdownIt } from '@renderer-shared/utils/markdown'
import { NScrollbar } from 'naive-ui'
import { reactive, ref } from 'vue'

const teams = reactive(PREMADE_TEAM_COLORS)

const show = ref(true)

const markdown = ref(`
[打开更新页面](akari://renderer-link/overlays/release-modal)
`)
const html = markdownIt.render(markdown.value)
</script>

<style lang="less" scoped>
[data-theme='dark'] {
.single-root {
  height: 100%;
}

.markdown-text {
  user-select: text;

  max-width: 800px;
}

.colors-container {
  padding: 16px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;

  .card {
    padding: 16px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .title {
    font-size: 1.5em;
    font-weight: bold;
    margin-bottom: 8px;
  }

  .info {
    font-size: 0.9em;
    margin-bottom: 4px;
  }
}

.section-icon-container {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  gap: 8px;
  color: #fffa;
  padding: 0 4px;

  .section-icon {
    font-size: 16px;
  }

  .session-label {
    font-size: 12px;
    font-weight: bold;
  }
}

}

[data-theme='light'] {
.single-root {
  height: 100%;
}

.markdown-text {
  user-select: text;

  max-width: 800px;
}

.colors-container {
  padding: 16px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;

  .card {
    padding: 16px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .title {
    font-size: 1.5em;
    font-weight: bold;
    margin-bottom: 8px;
  }

  .info {
    font-size: 0.9em;
    margin-bottom: 4px;
  }
}

.section-icon-container {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  gap: 8px;
  color: #000a;
  padding: 0 4px;

  .section-icon {
    font-size: 16px;
  }

  .session-label {
    font-size: 12px;
    font-weight: bold;
  }
}

}
</style>
