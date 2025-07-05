import commonEn from '@shared/i18n/en/common.yaml'
import mainEn from '@shared/i18n/en/main.yaml'
import commonZhCN from '@shared/i18n/zh-CN/common.yaml'
import mainZhCN from '@shared/i18n/zh-CN/main.yaml'
import i18next from 'i18next'

i18next.init({
  lng: 'zh-CN',
  debug: process.env.NODE_ENV === 'development',
  fallbackLng: 'zh-CN',
  interpolation: {
    escapeValue: false
  },
  ns: ['main', 'common'],
  defaultNS: 'main',
  resources: {
    en: {
      main: mainEn,
      common: commonEn
    },
    'zh-CN': {
      main: mainZhCN,
      common: commonZhCN
    }
  }
})

export { i18next }
