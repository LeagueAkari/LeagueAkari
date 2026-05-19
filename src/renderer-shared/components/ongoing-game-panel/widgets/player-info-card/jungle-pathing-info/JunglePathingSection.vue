<template>
  <div
    class="flex gap-3 rounded border border-indigo-500/12 bg-indigo-500/4 p-2 dark:border-indigo-300/10 dark:bg-indigo-300/5"
  >
    <div class="flex shrink-0 flex-col gap-1">
      <slot name="map" />
    </div>

    <div class="flex min-w-0 flex-1 flex-col gap-2 text-xs">
      <slot name="content" />
    </div>
  </div>
</template>
