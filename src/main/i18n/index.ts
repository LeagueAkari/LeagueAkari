import commonEn from '@shared/i18n/en/common.yaml'
import mainEn from '@shared/i18n/en/main.yaml'
import commonEsMX from '@shared/i18n/es-MX/common.yaml'
import mainEsMX from '@shared/i18n/es-MX/main.yaml'
import commonZhCN from '@shared/i18n/zh-CN/common.yaml'
import mainZhCN from '@shared/i18n/zh-CN/main.yaml'
import i18next from 'i18next'

i18next.init({
  lng: 'zh-CN',
  debug: process.env.NODE_ENV === 'development',
  fallbackLng: { 'es-MX': ['en'], default: ['zh-CN'] },
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
    'es-MX': {
      main: mainEsMX,
      common: commonEsMX
    },
    'zh-CN': {
      main: mainZhCN,
      common: commonZhCN
    }
  }
})

export { i18next }
