import { GlobalThemeOverrides } from 'naive-ui'

export const AKARI = {
  50: '#fff0f3',
  100: '#ffe3e9',
  200: '#ffc9d6',
  300: '#ffa0b6',
  400: '#ff6e91',
  500: '#f83f6f',
  600: '#e61d4f',
  700: '#c20e3a',
  800: '#a10f34',
  900: '#861230',
  950: '#4a0415'
} as const

export const AKARI_RGB = {
  50: '255, 240, 243',
  100: '255, 227, 233',
  200: '255, 201, 214',
  300: '255, 160, 182',
  400: '255, 110, 145',
  500: '248, 63, 111',
  600: '230, 29, 79',
  700: '194, 14, 58',
  800: '161, 15, 52',
  900: '134, 18, 48',
  950: '74, 4, 21'
} as const

export const rgba = (rgb: string, alpha: number) => `rgba(${rgb}, ${alpha})`

export const AKARI_SHARED_COMPACT_OVERRIDES: GlobalThemeOverrides = {
  Notification: {
    padding: '12px',
    titleFontSize: '13px',
    titleFontWeight: '700',
    descriptionFontSize: '13px',
    avatarSize: '20px'
  },
  Message: {
    padding: '4px 8px',
    fontSize: '12px',
    iconSize: '16px',
    iconMargin: '0 4px 0 0'
  },
  Popover: {
    fontSize: '12px'
  },
  Menu: {
    padding: '1px'
  },
  Checkbox: {
    fontSizeSmall: '13px'
  },
  Scrollbar: {
    width: '6px'
  }
}
