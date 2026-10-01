import commonEn from '@shared/i18n/en/common.yaml'
import mainEn from '@shared/i18n/en/main.yaml'
import opggEn from '@shared/i18n/en/renderer/opgg.yaml'
import commonZhCN from '@shared/i18n/zh-CN/common.yaml'
import mainZhCN from '@shared/i18n/zh-CN/main.yaml'
import opggZhCN from '@shared/i18n/zh-CN/renderer/opgg.yaml'
import i18next from 'i18next'

i18next.init({
  lng: 'zh-CN',
  debug: process.env.NODE_ENV === 'development',
  fallbackLng: 'zh-CN',
  interpolation: {
    escapeValue: false
  },
  ns: ['main', 'common', 'opgg'],
  defaultNS: 'main',
  resources: {
    en: {
      main: mainEn,
      opgg: opggEn,
      common: commonEn
    },
    'zh-CN': {
      main: mainZhCN,
      opgg: opggZhCN,
      common: commonZhCN
    }
  }
})

export { i18next }
