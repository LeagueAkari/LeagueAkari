import _ from 'lodash'
import { type ComputedRef, type WatchEffectOptions, computed, shallowRef, watchEffect } from 'vue'

/**
 * 在真正发生变化时触发变更时进行深度比较，当存在不同时触发更新
 * @param getter Getter
 */
export function useStableComputed<T>(
  getter: () => T,
  options?: WatchEffectOptions
): ComputedRef<T> {
  const previousValue = shallowRef<T>(getter())

  watchEffect(() => {
    const currentValue = getter()
    if (!_.isEqual(currentValue, previousValue.value)) {
      previousValue.value = currentValue
    }
  }, options)

  return computed(() => previousValue.value)
}
