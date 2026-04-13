import { getCurrentInstance } from 'vue'

const NO_COMPONENT_NAME = 'NotAComponent'
const DEFAULT_COMPONENT_NAME = 'AnonymousComponent'

export function useComponentName() {
  const instance = getCurrentInstance()

  if (!instance) {
    return NO_COMPONENT_NAME
  }

  return instance.type.name || instance.type.__name || DEFAULT_COMPONENT_NAME
}
