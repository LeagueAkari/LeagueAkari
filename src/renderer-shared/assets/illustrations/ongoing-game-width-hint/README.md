# Ongoing game width hint

用于提示用户拉宽 League Akari 窗口，使每队五张玩家卡片排成一行。

- Logo 直接复用 `src/renderer-shared/assets/icon/AkariLogo.vue` 的原始路径，仅等比缩放。
- 配色来自 `src/renderer-shared/assets/css/tailwind.css` 的 Akari 色阶：品牌色 `#f83f6f`、浅色重点色 `#e61d4f`、深色重点色 `#ff6e91`；深色中性底色沿用 Akari 主题定义。
- 自包含 SVG + CSS 动画，无 JavaScript、字体、位图或外部资源依赖。
- 透明画布 `640 × 384`；展开后的应用窗口为 `576 × 324`（16:9）。
- 7.5 秒循环：窄窗口换行 → 水平拖动右边框 → 每队一排五张 → 停留 → 淡出复位。
- 根据 `prefers-color-scheme` 适配浅色、深色；Chromium 中通过 `<img>` 嵌入时遵循宿主的 `color-scheme`。League Akari 已在根元素同步该属性。
- `prefers-reduced-motion: reduce` 时显示最终的两排五张卡片，不播放动画。
- 图内没有可见文字，提示语和无障碍替代文本由调用方通过 i18n 提供。

## Vue 中使用

```vue
<script setup lang="ts">
import ongoingGameWidthHint from '@renderer-shared/assets/illustrations/ongoing-game-width-hint/ongoing-game-width-hint.svg?url'
</script>

<template>
  <img :src="ongoingGameWidthHint" alt="" width="320" height="192" />
</template>
```

建议在图旁显示提示语「拉宽窗口，每队五张卡片一排看全」。当旁边有等价文字时使用空 `alt`，避免重复朗读；单独使用图片时通过 i18n 提供完整替代文本。

只需引入 SVG；本目录暂未改变 ongoing game 页面的展示或提示触发逻辑。
