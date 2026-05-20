import FunnyPricing from '@renderer-shared/components/easter-eggs/FunnyPricing.vue'
import { useKeyboardCombo } from '@renderer-shared/composables/useKeyboardCombo'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { useTranslation } from 'i18next-vue'
import { defineComponent, ref } from 'vue'

import { type SimpleNotificationsRendererContext } from './context'

export function registerFunnyPricingModal(context: SimpleNotificationsRendererContext) {
  const Component = defineComponent({
    setup() {
      const { t } = useTranslation()
      const appCommonStore = useAppCommonStore()

      const show = ref(false)
      const balance = ref(0)
      const current = ref('basic')

      useKeyboardCombo('SUBSCRIBE', {
        onFinish: () => {
          show.value = true
        }
      })

      useKeyboardCombo('GIVEMEAKARI', {
        onFinish: () => {
          balance.value += 1000000
        }
      })

      return () => (
        <FunnyPricing
          {...{
            show: show.value,
            balance: balance.value,
            current: current.value,
            'onUpdate:show': (value: boolean) => (show.value = value),
            'onUpdate:balance': (value: number) => (balance.value = value),
            onPurchase: (item: { id: string; title: string; price: number }) => {
              balance.value -= item.price
              current.value = item.id

              // 彩蛋环节
              appCommonStore.overrideAppTitle = `${t('appName', { ns: 'common' })} ${item.title} ${
                appCommonStore.isElevated ? 'X' : ''
              }`
            }
          }}
        />
      )
    }
  })

  context.setupInAppScope.addRenderVNode(() => <Component />)
}
