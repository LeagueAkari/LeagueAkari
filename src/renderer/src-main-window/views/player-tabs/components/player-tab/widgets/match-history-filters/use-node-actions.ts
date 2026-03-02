import { computed } from 'vue'

import { useMatchHistoryFilters } from '../../data/match-history-filters'
import { createNotCombinator } from './combinator-factories'
import {
  CombinatorArg,
  CombinatorNode,
  NotCombinator,
  isNodeArg,
  nodeArg
} from './combinator-nodes'

function replaceNodeRef<T extends CombinatorArg[]>(args: T, fromId: string, toId: string): T {
  return args.map((arg) => {
    if (isNodeArg(arg) && arg.value === fromId) {
      return { kind: 'node', value: toId } as typeof arg
    }

    return arg
  }) as T
}

export function useNodeActions(getNodeId: () => string) {
  const { nodeMap, addNode, updateNode, deleteNode } = useMatchHistoryFilters()

  const currentNodeId = computed(() => getNodeId())

  const node = computed(() => nodeMap.value[currentNodeId.value] as CombinatorNode | undefined)

  const parentNode = computed(() => {
    if (!node.value?.parentId) {
      return null
    }

    return nodeMap.value[node.value.parentId] ?? null
  })

  const excludeWrapperNode = computed(() => {
    if (parentNode.value?.type !== 'not') {
      return null
    }

    return parentNode.value as NotCombinator
  })

  const canExclude = computed(() => {
    return !!node.value?.parentId
  })

  const isExcluded = computed(() => {
    return !!excludeWrapperNode.value
  })

  const deleteCurrent = () => {
    if (excludeWrapperNode.value) {
      deleteNode(excludeWrapperNode.value.id)
      return
    }

    deleteNode(currentNodeId.value)
  }

  const toggleExclude = () => {
    if (!node.value || !node.value.parentId) {
      return
    }

    if (excludeWrapperNode.value) {
      const notNode = excludeWrapperNode.value
      const grandParent = notNode.parentId ? nodeMap.value[notNode.parentId] : null

      if (!grandParent) {
        return
      }

      updateNode(currentNodeId.value, {
        ...node.value,
        parentId: grandParent.id
      })
      updateNode(grandParent.id, {
        ...grandParent,
        args: replaceNodeRef(grandParent.args, notNode.id, currentNodeId.value)
      })

      delete nodeMap.value[notNode.id]
      return
    }

    const parent = parentNode.value

    if (!parent) {
      return
    }

    const notNode = createNotCombinator(parent.id, {
      arg: nodeArg(currentNodeId.value)
    })

    addNode(notNode)
    updateNode(currentNodeId.value, {
      ...node.value,
      parentId: notNode.id
    })
    updateNode(parent.id, {
      ...parent,
      args: replaceNodeRef(parent.args, currentNodeId.value, notNode.id)
    })
  }

  return {
    canExclude,
    isExcluded,
    deleteCurrent,
    toggleExclude
  }
}
