import { useInstance } from '@renderer-shared/shards'
import { AkariNavigationRenderer } from '@renderer-shared/shards/akari-navigation'
import type { AkariNavigationRequest } from '@shared/shards/akari-navigation'

export function useNavigateToTarget<Target extends AkariNavigationRequest = AkariNavigationRequest>(
  targetWindow: Target['window']
) {
  const navigation = useInstance(AkariNavigationRenderer)

  return (targetId: Target['targetId'], payload?: Target['payload']) =>
    navigation.requestNavigation({ window: targetWindow, targetId, payload })
}
