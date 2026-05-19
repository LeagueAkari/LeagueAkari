// @ts-nocheck

import { useActivated } from '@renderer-shared/composables/useActivated'
import { useMounted } from '@vueuse/core'

/**
 * 在当前作用于定义一些引导 item，注意，它需要配合 Guide 组件
 *
 * @param groupId 一个小组包含若干个 guide item
 * @param items 按照顺序标记的列表
 * @returns
 */
export function useGuide(groupId: string, items: string[]) {
  const isActivated = useActivated()
  const isMounted = useMounted()
}
