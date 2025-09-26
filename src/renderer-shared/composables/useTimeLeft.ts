import { MaybeRefOrGetter, useIntervalFn } from '@vueuse/core'
import { readonly, ref, toValue, watch } from 'vue'

const INTERVAL_CONSTANT = 50

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

export function useTimeLeft(
  finishAt: MaybeRefOrGetter<number>,
  startAt: MaybeRefOrGetter<number | null | undefined>
) {
  const _msLeft = ref(0)
  const _progress = ref(0)

  const tick = () => {
    const finishAtRaw = toValue(finishAt)
    const finishAtValue =
      typeof finishAtRaw === 'number' && Number.isFinite(finishAtRaw) && finishAtRaw > 0
        ? finishAtRaw
        : null

    if (!finishAtValue) {
      _msLeft.value = 0
      _progress.value = 0
      return false
    }

    const now = Date.now()
    const remaining = finishAtValue - now
    const hasRemaining = remaining > 0

    _msLeft.value = hasRemaining ? remaining : 0

    const startAtRaw = toValue(startAt)
    const hasValidStart =
      typeof startAtRaw === 'number' &&
      Number.isFinite(startAtRaw) &&
      startAtRaw > 0 &&
      finishAtValue > startAtRaw

    if (hasRemaining) {
      if (hasValidStart) {
        const ratio = (now - startAtRaw) / (finishAtValue - startAtRaw)
        _progress.value = clamp(ratio, 0, 1)
      } else {
        _progress.value = 0
      }
    } else {
      _progress.value = 1
    }

    return hasRemaining
  }

  const { pause, resume } = useIntervalFn(
    () => {
      if (!tick()) {
        pause()
      }
    },
    INTERVAL_CONSTANT,
    { immediate: false }
  )

  watch(
    [() => toValue(startAt), () => toValue(finishAt)],
    () => {
      if (tick()) {
        resume()
      } else {
        pause()
      }
    },
    { immediate: true }
  )

  return {
    timeLeft: readonly(_msLeft),
    progress: readonly(_progress)
  }
}
