<template>
  <div class="indicator-pulse size-2.5 rounded-full bg-green-500 dark:bg-[#00ff00]"></div>
</template>

<style scoped>
.indicator-pulse {
  animation: indicator-pulse 4s infinite;
}

@keyframes indicator-pulse {
  0% {
    box-shadow: 0 0 0 0 #00ff0066;
  }
  20% {
    box-shadow: 0 0 0 10px #00ff0000;
  }
  100% {
    box-shadow: 0 0 0 0 #00ff0000;
  }
}
</style>
