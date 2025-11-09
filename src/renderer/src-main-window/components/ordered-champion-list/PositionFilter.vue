<template>
  <div class="position-filter">
    <div
      class="position"
      :class="{ active: positionModel === position }"
      v-for="position in POSITIONS"
      :key="position"
      @click="handleClick(position)"
    >
      <PositionIcon :position="position" />
    </div>
  </div>
</template>

<script setup lang="ts">
import PositionIcon from '@renderer-shared/components/icons/position-icons/PositionIcon.vue'

const positionModel = defineModel<string | null>('position', { default: null })

const POSITIONS = ['TOP', 'MIDDLE', 'JUNGLE', 'BOTTOM', 'UTILITY']

const handleClick = (position: string) => {
  if (positionModel.value === position) {
    positionModel.value = null
  } else {
    positionModel.value = position
  }
}
</script>

<style lang="less" scoped>
[data-theme='dark'] {
.position-filter {
  display: flex;
  gap: 4px;
  padding: 2px;
  box-sizing: border-box;
  height: 22px;

  .position {
    display: flex;
    justify-content: center;
    align-items: center;
    border: 1px solid #fff1;
    border-radius: 2px;
    aspect-ratio: 1;
    transition:
      background-color 0.2s ease,
      color 0.2s ease;
    color: #fff8;
  }

  .position:hover {
    background-color: #fff2;
    color: #fff;

    cursor: pointer;
  }

  .position.active {
    color: #fff;
    background-color: #fff2;
    border: 1px solid #fff4;
  }
}

}

[data-theme='light'] {
.position-filter {
  display: flex;
  gap: 4px;
  padding: 2px;
  box-sizing: border-box;
  height: 22px;

  .position {
    display: flex;
    justify-content: center;
    align-items: center;
    border: 1px solid #0001;
    border-radius: 2px;
    aspect-ratio: 1;
    transition:
      background-color 0.2s ease,
      color 0.2s ease;
    color: #0008;
  }

  .position:hover {
    background-color: #0002;
    color: #000;

    cursor: pointer;
  }

  .position.active {
    color: #000;
    background-color: #0002;
    border: 1px solid #0004;
  }
}

}
</style>
