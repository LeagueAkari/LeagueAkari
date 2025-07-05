import commonEn from '@shared/i18n/en/common.yaml'
import rendererEn from '@shared/i18n/en/renderer.yaml'
import commonZhCN from '@shared/i18n/zh-CN/common.yaml'
import rendererZhCN from '@shared/i18n/zh-CN/renderer.yaml'
import i18next from 'i18next'

i18next.init({
  lng: 'en',
  fallbackLng: 'zh-CN',
  debug: import.meta.env.DEV,
  interpolation: {
    escapeValue: false
  },
  ns: ['renderer', 'common'],
  defaultNS: 'renderer',
  resources: {
    'zh-CN': {
      renderer: rendererZhCN,
      common: commonZhCN
    },
    en: {
      renderer: rendererEn,
      common: commonEn
    }
  }
})

export { i18next }
