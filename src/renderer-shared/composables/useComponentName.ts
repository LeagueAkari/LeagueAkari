import { getCurrentInstance } from 'vue'

const DEFAULT_NAME = 'AnonymousComponent'

export function useComponentName() {
  const instance = getCurrentInstance()

  if (!instance) {
    return DEFAULT_NAME
  }

  return instance.type.name || instance.type.__name || DEFAULT_NAME
}
