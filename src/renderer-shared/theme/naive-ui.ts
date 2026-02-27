import {
  AppColorTheme,
  AppThemeId,
  DAISY_DARK_THEME_IDS,
  DAISY_LIGHT_THEME_IDS
} from '@shared/types/app-theme'
import {
  GlobalTheme,
  GlobalThemeOverrides,
  darkTheme,
  dateEnUS,
  dateZhCN,
  enUS,
  lightTheme,
  zhCN
} from 'naive-ui'

export const NAIVE_UI_LOCALE_MAP = {
  'zh-CN': {
    dateLocale: dateZhCN,
    locale: zhCN
  },
  en: {
    dateLocale: dateEnUS,
    locale: enUS
  }
}

const CLASSIC_OVERRIDES = {
  light: {
    common: {
      popoverColor: '#ffffff',
      primaryColor: '#0ea5e9',
      primaryColorHover: '#0284c7',
      successColor: '#3fa877',
      warningColor: '#d79642',
      errorColor: '#d95a6c'
    },
    Notification: {
      padding: '12px',
      titleFontSize: '13px',
      titleFontWeight: '700',
      descriptionFontSize: '13px',
      avatarSize: '20px'
    },
    Card: {
      color: '#0000',
      borderColor: 'rgba(0, 0, 0, 0.1)',
      borderColorModal: 'rgba(0, 0, 0, 0.16)',
      paddingSmall: '4px 12px'
    },
    Message: {
      padding: '4px 8px',
      fontSize: '12px',
      iconSize: '16px',
      iconMargin: '0 4px 0 0',
      colorInfo: '#f5f5f5',
      colorSuccess: '#f5f5f5',
      colorWarning: '#f5f5f5',
      colorError: '#f5f5f5'
    },
  Popover: {
    fontSize: '12px',
    borderColor: 'rgba(0, 0, 0, 0.2)'
  },
  Tooltip: {
    color: 'rgba(34, 34, 41, 0.94)',
    textColor: '#f7f7fa'
  },
  InternalSelectMenu: {
    color: '#ffffff'
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
  },
  dark: {
    common: {
      popoverColor: '#383838f8',
      primaryColor: '#54d399',
      primaryColorHover: '#3fc28b',
      successColor: '#4bc78f',
      warningColor: '#e4ac5b',
      errorColor: '#eb7485'
    },
    Notification: {
      padding: '12px',
      titleFontSize: '13px',
      titleFontWeight: '700',
      descriptionFontSize: '13px',
      avatarSize: '20px',
      color: '#313131fa'
    },
    Card: {
      color: '#0000',
      colorModal: '#232329',
      paddingSmall: '4px 12px'
    },
    Message: {
      padding: '4px 8px',
      fontSize: '12px',
      iconSize: '16px',
      iconMargin: '0 4px 0 0',
      colorInfo: '#2c2c2c',
      colorSuccess: '#2c2c2c',
      colorWarning: '#2c2c2c',
      colorError: '#2c2c2c'
    },
    Popover: {
      color: '#1f1f1ffa',
      arrowColor: '#1f1f1ffa',
      borderColor: 'rgba(255, 255, 255, 0.2)',
      fontSize: '12px'
    },
    InternalSelectMenu: {
      color: '#383838f8'
    },
    Dropdown: {
      color: '#222e'
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
  },
  graphite: {
    common: {
      bodyColor: '#0b1118',
      cardColor: '#162231',
      modalColor: '#111a24',
      tableColor: '#111a24',
      popoverColor: '#111a24f5',
      primaryColor: '#4ec3ff',
      primaryColorHover: '#2fadeb',
      primaryColorPressed: '#1f97d6',
      primaryColorSuppl: 'rgba(78, 195, 255, 0.16)',
      infoColor: '#4ec3ff',
      infoColorHover: '#2fadeb',
      infoColorPressed: '#1f97d6',
      infoColorSuppl: 'rgba(78, 195, 255, 0.16)',
      successColor: '#4bcb98',
      successColorHover: '#39b986',
      successColorPressed: '#2f9f72',
      successColorSuppl: 'rgba(75, 203, 152, 0.16)',
      warningColor: '#f2b86a',
      warningColorHover: '#e8aa57',
      warningColorPressed: '#d8943f',
      warningColorSuppl: 'rgba(242, 184, 106, 0.16)',
      errorColor: '#ff7e92',
      errorColorHover: '#f36f86',
      errorColorPressed: '#df5d74',
      errorColorSuppl: 'rgba(255, 126, 146, 0.16)',
      textColorBase: '#dde7f1',
      textColor1: '#dde7f1',
      textColor2: 'rgba(221, 231, 241, 0.88)',
      textColor3: 'rgba(158, 178, 198, 0.94)',
      textColorDisabled: 'rgba(158, 178, 198, 0.45)',
      placeholderColor: 'rgba(158, 178, 198, 0.7)',
      iconColor: 'rgba(158, 178, 198, 0.85)',
      iconColorHover: '#dde7f1',
      iconColorPressed: 'rgba(221, 231, 241, 0.8)',
      borderColor: 'rgba(148, 173, 197, 0.22)',
      dividerColor: 'rgba(148, 173, 197, 0.16)',
      inputColor: 'rgba(148, 173, 197, 0.12)',
      actionColor: 'rgba(148, 173, 197, 0.08)',
      hoverColor: 'rgba(78, 195, 255, 0.11)',
      pressedColor: 'rgba(78, 195, 255, 0.16)',
      buttonColor2: 'rgba(148, 173, 197, 0.12)',
      buttonColor2Hover: 'rgba(148, 173, 197, 0.18)',
      buttonColor2Pressed: 'rgba(148, 173, 197, 0.12)'
    },
    Notification: {
      padding: '12px',
      titleFontSize: '13px',
      titleFontWeight: '700',
      descriptionFontSize: '13px',
      avatarSize: '20px',
      color: '#162231f2'
    },
    Card: {
      color: '#0000',
      colorModal: '#162231',
      borderColor: 'rgba(148, 173, 197, 0.22)',
      borderColorModal: 'rgba(148, 173, 197, 0.22)',
      paddingSmall: '4px 12px'
    },
    Button: {
      colorSecondary: 'rgba(148, 173, 197, 0.12)',
      colorSecondaryHover: 'rgba(148, 173, 197, 0.2)',
      colorSecondaryPressed: 'rgba(148, 173, 197, 0.16)',
      border: '1px solid rgba(148, 173, 197, 0.26)',
      borderHover: '1px solid rgba(148, 173, 197, 0.4)',
      borderPressed: '1px solid rgba(148, 173, 197, 0.32)',
      textColor: '#dde7f1',
      textColorHover: '#f3f9ff',
      textColorPressed: '#d4e3f0',
      textColorPrimary: '#07131d',
      textColorHoverPrimary: '#07131d',
      textColorPressedPrimary: '#07131d'
    },
    Switch: {
      railColor: 'rgba(148, 173, 197, 0.32)',
      railColorActive: '#4ec3ff',
      buttonColor: '#e4f5ff',
      iconColor: '#07131d',
      textColor: 'rgba(158, 178, 198, 0.95)',
      loadingColor: '#e4f5ff',
      buttonBoxShadow: '0 0 0 1px rgba(7, 19, 29, 0.45)'
    },
    Checkbox: {
      color: 'rgba(148, 173, 197, 0.12)',
      colorChecked: '#4ec3ff',
      border: '1px solid rgba(148, 173, 197, 0.34)',
      borderChecked: '1px solid #4ec3ff',
      checkMarkColor: '#e6f4ff',
      textColor: '#dde7f1',
      boxShadowFocus: '0 0 0 2px rgba(78, 195, 255, 0.3)',
      fontSizeSmall: '13px'
    },
    Radio: {
      color: 'rgba(148, 173, 197, 0.28)',
      colorActive: '#4ec3ff',
      buttonColor: 'rgba(148, 173, 197, 0.12)',
      buttonColorActive: '#4ec3ff',
      buttonBorderColor: 'rgba(148, 173, 197, 0.34)',
      buttonBorderColorActive: '#4ec3ff',
      buttonTextColor: '#dde7f1',
      buttonTextColorActive: '#e6f4ff',
      dotColorActive: '#4ec3ff'
    },
    Message: {
      padding: '4px 8px',
      fontSize: '12px',
      iconSize: '16px',
      iconMargin: '0 4px 0 0',
      colorInfo: '#162231',
      colorSuccess: '#162231',
      colorWarning: '#162231',
      colorError: '#162231'
    },
    Popover: {
      color: '#111a24f5',
      arrowColor: '#111a24f5',
      borderColor: 'rgba(148, 173, 197, 0.22)',
      fontSize: '12px'
    },
    InternalSelectMenu: {
      color: '#162231f6'
    },
    Dropdown: {
      color: '#111a24f5'
    },
    Menu: {
      padding: '1px'
    },
    Scrollbar: {
      width: '6px'
    }
  }
}

const SAKURA_OVERRIDES: GlobalThemeOverrides = {
  common: {
    bodyColor: '#fff1f7',
    cardColor: '#fff9fc',
    modalColor: '#fff2f8',
    tableColor: '#fff2f8',
    popoverColor: '#fff9fcf5',
    primaryColor: '#ff6fa7',
    primaryColorHover: '#f95898',
    primaryColorPressed: '#e34285',
    infoColor: '#ff6fa7',
    infoColorHover: '#f95898',
    infoColorPressed: '#e34285',
    successColor: '#42b67c',
    warningColor: '#d48a1c',
    errorColor: '#d95d7b',
    textColorBase: 'rgba(0, 0, 0, 0.86)',
    textColor1: 'rgba(0, 0, 0, 0.86)',
    textColor2: 'rgba(0, 0, 0, 0.7)',
    textColor3: 'rgba(0, 0, 0, 0.55)',
    textColorDisabled: 'rgba(0, 0, 0, 0.35)',
    placeholderColor: 'rgba(0, 0, 0, 0.45)',
    borderColor: 'rgba(229, 119, 168, 0.24)',
    dividerColor: 'rgba(229, 119, 168, 0.16)',
    inputColor: 'rgba(229, 119, 168, 0.08)',
    hoverColor: 'rgba(255, 111, 167, 0.14)',
    pressedColor: 'rgba(255, 111, 167, 0.2)'
  },
  Notification: {
    padding: '12px',
    titleFontSize: '13px',
    titleFontWeight: '700',
    descriptionFontSize: '13px',
    avatarSize: '20px',
    color: '#fff4faf2'
  },
  Card: {
    color: '#0000',
    colorModal: '#fff3f8',
    borderColor: 'rgba(229, 119, 168, 0.24)',
    borderColorModal: 'rgba(229, 119, 168, 0.24)',
    paddingSmall: '4px 12px'
  },
  Button: {
    textColorPrimary: '#fffafc',
    textColorHoverPrimary: '#fffafc',
    textColorPressedPrimary: '#fffafc'
  },
  Switch: {
    railColorActive: '#ff6fa7'
  },
  Checkbox: {
    colorChecked: '#ff6fa7',
    borderChecked: '1px solid #ff6fa7',
    fontSizeSmall: '13px'
  },
  Radio: {
    buttonColorActive: '#ff6fa7',
    buttonBorderColorActive: '#ff6fa7'
  },
  Message: {
    padding: '4px 8px',
    fontSize: '12px',
    iconSize: '16px',
    iconMargin: '0 4px 0 0',
    colorInfo: '#ffeaf4',
    colorSuccess: '#ffeaf4',
    colorWarning: '#ffeaf4',
    colorError: '#ffeaf4'
  },
  Popover: {
    color: '#fff9fcf5',
    arrowColor: '#fff9fcf5',
    borderColor: 'rgba(229, 119, 168, 0.24)',
    fontSize: '12px'
  },
  Tooltip: {
    color: 'rgba(255, 246, 251, 0.98)',
    textColor: 'rgba(92, 37, 57, 0.92)'
  },
  InternalSelectMenu: {
    color: '#fff9fcf6'
  },
  Dropdown: {
    color: '#fff9fcf5'
  },
  Menu: {
    padding: '1px'
  },
  Scrollbar: {
    width: '6px'
  }
}

const MINT_OVERRIDES: GlobalThemeOverrides = {
  common: {
    bodyColor: '#eafbf2',
    cardColor: '#f7fff9',
    modalColor: '#f1fcf6',
    tableColor: '#f1fcf6',
    popoverColor: '#f1fcf6f5',
    primaryColor: '#48aa7f',
    primaryColorHover: '#399b71',
    primaryColorPressed: '#2f885f',
    infoColor: '#48aa7f',
    infoColorHover: '#399b71',
    infoColorPressed: '#2f885f',
    successColor: '#2ea46f',
    warningColor: '#c08b2a',
    errorColor: '#cb5f78',
    textColor1: 'rgba(18, 74, 52, 0.92)',
    textColor2: 'rgba(31, 95, 69, 0.84)',
    textColor3: 'rgba(56, 121, 94, 0.76)',
    borderColor: 'rgba(72, 170, 127, 0.24)',
    dividerColor: 'rgba(72, 170, 127, 0.16)',
    inputColor: 'rgba(72, 170, 127, 0.08)',
    hoverColor: 'rgba(72, 170, 127, 0.12)',
    pressedColor: 'rgba(72, 170, 127, 0.18)'
  },
  Notification: {
    padding: '12px',
    titleFontSize: '13px',
    titleFontWeight: '700',
    descriptionFontSize: '13px',
    avatarSize: '20px',
    color: '#f2fcf7f2'
  },
  Card: {
    color: '#0000',
    colorModal: '#f7fff9',
    borderColor: 'rgba(72, 170, 127, 0.24)',
    borderColorModal: 'rgba(72, 170, 127, 0.24)',
    paddingSmall: '4px 12px'
  },
  Button: {
    textColorPrimary: '#f8fffb',
    textColorHoverPrimary: '#f8fffb',
    textColorPressedPrimary: '#f8fffb'
  },
  Switch: {
    railColorActive: '#48aa7f'
  },
  Checkbox: {
    colorChecked: '#48aa7f',
    borderChecked: '1px solid #48aa7f',
    fontSizeSmall: '13px'
  },
  Radio: {
    buttonColorActive: '#48aa7f',
    buttonBorderColorActive: '#48aa7f'
  },
  Message: {
    padding: '4px 8px',
    fontSize: '12px',
    iconSize: '16px',
    iconMargin: '0 4px 0 0',
    colorInfo: '#e8f8ef',
    colorSuccess: '#e8f8ef',
    colorWarning: '#e8f8ef',
    colorError: '#e8f8ef'
  },
  Popover: {
    color: '#f1fcf6f5',
    arrowColor: '#f1fcf6f5',
    borderColor: 'rgba(72, 170, 127, 0.24)',
    fontSize: '12px'
  },
  Tooltip: {
    color: 'rgba(242, 252, 247, 0.98)',
    textColor: 'rgba(23, 83, 58, 0.92)'
  },
  InternalSelectMenu: {
    color: '#f7fff9'
  },
  Dropdown: {
    color: '#f1fcf6f5'
  },
  Menu: {
    padding: '1px'
  },
  Scrollbar: {
    width: '6px'
  }
}

const AURORA_OVERRIDES: GlobalThemeOverrides = {
  common: {
    bodyColor: '#1f1738',
    cardColor: '#2d2350',
    modalColor: '#261f46',
    tableColor: '#261f46',
    popoverColor: '#261f46f5',
    primaryColor: '#b596ff',
    primaryColorHover: '#a17cf6',
    primaryColorPressed: '#8b63e0',
    infoColor: '#b596ff',
    infoColorHover: '#a17cf6',
    infoColorPressed: '#8b63e0',
    successColor: '#74dbbf',
    warningColor: '#f3c174',
    errorColor: '#ff90bf',
    textColor1: '#ece2ff',
    textColor2: 'rgba(236, 226, 255, 0.9)',
    textColor3: 'rgba(196, 182, 232, 0.92)',
    borderColor: 'rgba(158, 139, 218, 0.27)',
    dividerColor: 'rgba(158, 139, 218, 0.2)',
    inputColor: 'rgba(158, 139, 218, 0.14)',
    hoverColor: 'rgba(181, 150, 255, 0.12)',
    pressedColor: 'rgba(181, 150, 255, 0.18)'
  },
  Notification: {
    padding: '12px',
    titleFontSize: '13px',
    titleFontWeight: '700',
    descriptionFontSize: '13px',
    avatarSize: '20px',
    color: '#2d2350f2'
  },
  Card: {
    color: '#0000',
    colorModal: '#2d2350',
    borderColor: 'rgba(158, 139, 218, 0.27)',
    borderColorModal: 'rgba(158, 139, 218, 0.27)',
    paddingSmall: '4px 12px'
  },
  Button: {
    textColorPrimary: '#17122d',
    textColorHoverPrimary: '#17122d',
    textColorPressedPrimary: '#17122d'
  },
  Switch: {
    railColorActive: '#b596ff'
  },
  Checkbox: {
    colorChecked: '#b596ff',
    borderChecked: '1px solid #b596ff',
    fontSizeSmall: '13px'
  },
  Radio: {
    buttonColorActive: '#b596ff',
    buttonBorderColorActive: '#b596ff'
  },
  Message: {
    padding: '4px 8px',
    fontSize: '12px',
    iconSize: '16px',
    iconMargin: '0 4px 0 0',
    colorInfo: '#2d2350',
    colorSuccess: '#2d2350',
    colorWarning: '#2d2350',
    colorError: '#2d2350'
  },
  Popover: {
    color: '#261f46f5',
    arrowColor: '#261f46f5',
    borderColor: 'rgba(158, 139, 218, 0.27)',
    fontSize: '12px'
  },
  InternalSelectMenu: {
    color: '#2d2350f6'
  },
  Dropdown: {
    color: '#261f46f5'
  },
  Menu: {
    padding: '1px'
  },
  Scrollbar: {
    width: '6px'
  }
}

const BUTTER_OVERRIDES: GlobalThemeOverrides = {
  common: {
    bodyColor: '#fff9e8',
    cardColor: '#fffef8',
    modalColor: '#fff8eb',
    tableColor: '#fff8eb',
    popoverColor: '#fffef8',
    primaryColor: '#e8a93a',
    primaryColorHover: '#dc9723',
    primaryColorPressed: '#c78310',
    infoColor: '#e8a93a',
    infoColorHover: '#dc9723',
    infoColorPressed: '#c78310',
    successColor: '#34b377',
    warningColor: '#cf8618',
    errorColor: '#d4545f',
    textColor1: 'rgba(74, 52, 16, 0.92)',
    textColor2: 'rgba(101, 70, 21, 0.86)',
    textColor3: 'rgba(131, 95, 39, 0.78)',
    borderColor: 'rgba(214, 151, 56, 0.24)',
    dividerColor: 'rgba(214, 151, 56, 0.16)',
    inputColor: 'rgba(214, 151, 56, 0.08)',
    hoverColor: 'rgba(232, 169, 58, 0.12)',
    pressedColor: 'rgba(232, 169, 58, 0.18)'
  },
  Notification: {
    padding: '12px',
    titleFontSize: '13px',
    titleFontWeight: '700',
    descriptionFontSize: '13px',
    avatarSize: '20px'
  },
  Card: {
    color: '#0000',
    borderColor: 'rgba(214, 151, 56, 0.24)',
    borderColorModal: 'rgba(214, 151, 56, 0.24)',
    paddingSmall: '4px 12px'
  },
  Message: {
    padding: '4px 8px',
    fontSize: '12px',
    iconSize: '16px',
    iconMargin: '0 4px 0 0',
    colorInfo: '#fff4dc',
    colorSuccess: '#fff4dc',
    colorWarning: '#fff4dc',
    colorError: '#fff4dc'
  },
  Popover: {
    fontSize: '12px',
    borderColor: 'rgba(214, 151, 56, 0.24)'
  },
  Tooltip: {
    color: 'rgba(255, 248, 233, 0.98)',
    textColor: 'rgba(75, 43, 8, 0.92)'
  },
  InternalSelectMenu: {
    color: '#fffdf9'
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

const DAISY_LIGHT_OVERRIDES: GlobalThemeOverrides = {
  ...CLASSIC_OVERRIDES.light
}

const DAISY_DARK_OVERRIDES: GlobalThemeOverrides = {
  ...CLASSIC_OVERRIDES.dark
}

const THEME_OVERRIDES: Record<AppThemeId, GlobalThemeOverrides> = {
  light: CLASSIC_OVERRIDES.light,
  dark: CLASSIC_OVERRIDES.dark,
  graphite: CLASSIC_OVERRIDES.graphite,
  sakura: SAKURA_OVERRIDES,
  mint: MINT_OVERRIDES,
  aurora: AURORA_OVERRIDES,
  butter: BUTTER_OVERRIDES,
  ...(Object.fromEntries(
    DAISY_LIGHT_THEME_IDS.map((themeId) => [themeId, DAISY_LIGHT_OVERRIDES])
  ) as Record<(typeof DAISY_LIGHT_THEME_IDS)[number], GlobalThemeOverrides>),
  ...(Object.fromEntries(
    DAISY_DARK_THEME_IDS.map((themeId) => [themeId, DAISY_DARK_OVERRIDES])
  ) as Record<(typeof DAISY_DARK_THEME_IDS)[number], GlobalThemeOverrides>)
}

export function getNaiveUiLocale(locale: string) {
  return NAIVE_UI_LOCALE_MAP[locale as keyof typeof NAIVE_UI_LOCALE_MAP] || NAIVE_UI_LOCALE_MAP.en
}

export function getNaiveUiTheme(colorTheme: AppColorTheme): GlobalTheme | null {
  return colorTheme === 'dark' ? darkTheme : lightTheme
}

export function getNaiveUiThemeOverrides(themeId: AppThemeId) {
  return THEME_OVERRIDES[themeId]
}
