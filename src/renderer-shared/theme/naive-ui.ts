import { AppColorTheme, AppThemeId } from '@shared/types/app-theme'
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

const CLASSIC_OVERRIDES: Record<string, GlobalThemeOverrides> = {
  light: {
    common: {
      modalColor: '#f5f5f6'
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
      colorModal: '#f5f5f6',
      borderColor: 'rgba(0, 0, 0, 0.1)',
      borderColorModal: 'rgba(0, 0, 0, 0.16)'
    },
    Dialog: {
      color: '#f5f5f6'
    },
    Modal: {
      color: '#f5f5f6'
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
      modalColor: '#1e1e22'
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
      colorModal: '#1e1e22'
    },
    Dialog: {
      color: '#1e1e22'
    },
    Modal: {
      color: '#1e1e22'
    },
    Dropdown: {
      color: '#1f1f1ffa'
    },
    Message: {
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
      bodyColor: '#09121c',
      cardColor: '#152436',
      modalColor: '#101c2c',
      tableColor: '#101c2c',
      popoverColor: '#101c2cf5',
      primaryColor: '#69caff',
      primaryColorHover: '#4ebeff',
      primaryColorPressed: '#2da6e6',
      primaryColorSuppl: 'rgba(105, 202, 255, 0.16)',
      infoColor: '#69caff',
      infoColorHover: '#4ebeff',
      infoColorPressed: '#2da6e6',
      infoColorSuppl: 'rgba(105, 202, 255, 0.16)',
      successColor: '#4cb882',
      successColorHover: '#3ea571',
      successColorPressed: '#338e61',
      successColorSuppl: 'rgba(76, 184, 130, 0.16)',
      warningColor: '#f0b36b',
      warningColorHover: '#e2a35a',
      warningColorPressed: '#c98a42',
      warningColorSuppl: 'rgba(242, 184, 106, 0.16)',
      errorColor: '#ff7c94',
      errorColorHover: '#ef6d86',
      errorColorPressed: '#d95c74',
      errorColorSuppl: 'rgba(255, 124, 148, 0.16)',
      textColorBase: '#e2edf7',
      textColor1: '#e2edf7',
      textColor2: 'rgba(226, 237, 247, 0.9)',
      textColor3: 'rgba(162, 182, 204, 0.94)',
      textColorDisabled: 'rgba(162, 182, 204, 0.45)',
      placeholderColor: 'rgba(162, 182, 204, 0.7)',
      iconColor: 'rgba(162, 182, 204, 0.85)',
      iconColorHover: '#e2edf7',
      iconColorPressed: 'rgba(226, 237, 247, 0.8)',
      borderColor: 'rgba(148, 173, 197, 0.24)',
      dividerColor: 'rgba(148, 173, 197, 0.18)',
      inputColor: 'rgba(148, 173, 197, 0.13)',
      actionColor: 'rgba(148, 173, 197, 0.08)',
      hoverColor: 'rgba(105, 202, 255, 0.11)',
      pressedColor: 'rgba(105, 202, 255, 0.16)',
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
      color: '#152436f2'
    },
    Card: {
      color: '#0000',
      colorModal: '#152436',
      borderColor: 'rgba(148, 173, 197, 0.24)',
      borderColorModal: 'rgba(148, 173, 197, 0.24)'
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
      railColorActive: '#69caff',
      buttonColor: '#e4f5ff',
      iconColor: '#07131d',
      textColor: 'rgba(158, 178, 198, 0.95)',
      loadingColor: '#e4f5ff',
      buttonBoxShadow: '0 0 0 1px rgba(7, 19, 29, 0.45)'
    },
    Checkbox: {
      color: 'rgba(148, 173, 197, 0.12)',
      colorChecked: '#69caff',
      border: '1px solid rgba(148, 173, 197, 0.34)',
      borderChecked: '1px solid #69caff',
      checkMarkColor: '#e6f4ff',
      textColor: '#dde7f1',
      boxShadowFocus: '0 0 0 2px rgba(105, 202, 255, 0.3)',
      fontSizeSmall: '13px'
    },
    Radio: {
      color: 'rgba(148, 173, 197, 0.28)',
      colorActive: '#69caff',
      buttonColor: 'rgba(148, 173, 197, 0.12)',
      buttonColorActive: '#69caff',
      buttonBorderColor: 'rgba(148, 173, 197, 0.34)',
      buttonBorderColorActive: '#69caff',
      buttonTextColor: '#dde7f1',
      buttonTextColorActive: '#e6f4ff',
      dotColorActive: '#69caff'
    },
    Message: {
      padding: '4px 8px',
      fontSize: '12px',
      iconSize: '16px',
      iconMargin: '0 4px 0 0',
      colorInfo: '#152436',
      colorSuccess: '#152436',
      colorWarning: '#152436',
      colorError: '#152436'
    },
    Popover: {
      color: '#101c2cf5',
      arrowColor: '#101c2cf5',
      borderColor: 'rgba(148, 173, 197, 0.24)',
      fontSize: '12px'
    },
    InternalSelectMenu: {
      color: '#152436f6'
    },
    Dropdown: {
      color: '#101c2cf5'
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
    bodyColor: '#fff4f6',
    cardColor: '#fffafb',
    modalColor: '#fff6f8',
    tableColor: '#fff6f8',
    popoverColor: '#fffafbf5',
    primaryColor: '#d45a86',
    primaryColorHover: '#c24b74',
    primaryColorPressed: '#aa3d63',
    infoColor: '#d45a86',
    infoColorHover: '#c24b74',
    infoColorPressed: '#aa3d63',
    successColor: '#7b9a55',
    warningColor: '#be731a',
    errorColor: '#cb4b6a',
    textColorBase: 'rgba(49, 44, 52, 0.92)',
    textColor1: 'rgba(49, 44, 52, 0.92)',
    textColor2: 'rgba(76, 69, 78, 0.82)',
    textColor3: 'rgba(108, 99, 109, 0.72)',
    textColorDisabled: 'rgba(108, 99, 109, 0.4)',
    placeholderColor: 'rgba(108, 99, 109, 0.52)',
    borderColor: 'rgba(200, 88, 135, 0.24)',
    dividerColor: 'rgba(200, 88, 135, 0.16)',
    inputColor: 'rgba(200, 88, 135, 0.08)',
    hoverColor: 'rgba(212, 90, 134, 0.12)',
    pressedColor: 'rgba(212, 90, 134, 0.18)'
  },
  Notification: {
    padding: '12px',
    titleFontSize: '13px',
    titleFontWeight: '700',
    descriptionFontSize: '13px',
    avatarSize: '20px',
    color: '#fff8f9f2'
  },
  Card: {
    color: '#0000',
    colorModal: '#fff6f8',
    borderColor: 'rgba(200, 88, 135, 0.24)',
    borderColorModal: 'rgba(200, 88, 135, 0.24)'
  },
  Button: {
    textColorPrimary: '#fffafc',
    textColorHoverPrimary: '#fffafc',
    textColorPressedPrimary: '#fffafc'
  },
  Switch: {
    railColorActive: '#d45a86'
  },
  Checkbox: {
    colorChecked: '#d45a86',
    borderChecked: '1px solid #d45a86',
    fontSizeSmall: '13px'
  },
  Radio: {
    buttonColorActive: '#d45a86',
    buttonBorderColorActive: '#d45a86'
  },
  Message: {
    padding: '4px 8px',
    fontSize: '12px',
    iconSize: '16px',
    iconMargin: '0 4px 0 0',
    colorInfo: '#fff0f4',
    colorSuccess: '#fff0f4',
    colorWarning: '#fff0f4',
    colorError: '#fff0f4'
  },
  Popover: {
    color: '#fffafbf5',
    arrowColor: '#fffafbf5',
    borderColor: 'rgba(200, 88, 135, 0.24)',
    fontSize: '12px'
  },
  Tooltip: {
    color: 'rgba(255, 248, 250, 0.98)',
    textColor: 'rgba(56, 47, 56, 0.92)'
  },
  InternalSelectMenu: {
    color: '#fffafbf6'
  },
  Dropdown: {
    color: '#fffafbf5'
  },
  Menu: {
    padding: '1px'
  },
  Scrollbar: {
    width: '6px'
  }
}

const CYBER_OVERRIDES: GlobalThemeOverrides = {
  common: {
    bodyColor: '#000000',
    cardColor: '#0c0c0c',
    modalColor: '#0a0a0a',
    tableColor: '#0a0a0a',
    popoverColor: '#0a0a0af5',
    primaryColor: '#dfff00',
    primaryColorHover: '#eaff4d',
    primaryColorPressed: '#b9d200',
    primaryColorSuppl: 'rgba(223, 255, 0, 0.16)',
    infoColor: '#dfff00',
    infoColorHover: '#eaff4d',
    infoColorPressed: '#b9d200',
    infoColorSuppl: 'rgba(223, 255, 0, 0.16)',
    successColor: '#39ff14',
    successColorHover: '#61ff43',
    successColorPressed: '#2ecb10',
    successColorSuppl: 'rgba(57, 255, 20, 0.16)',
    warningColor: '#ffea00',
    warningColorHover: '#fff14d',
    warningColorPressed: '#d4c300',
    warningColorSuppl: 'rgba(255, 234, 0, 0.16)',
    errorColor: '#ff003c',
    errorColorHover: '#ff3363',
    errorColorPressed: '#d40032',
    errorColorSuppl: 'rgba(255, 0, 60, 0.16)',
    textColorBase: 'rgba(244, 255, 230, 0.96)',
    textColor1: '#dfff00',
    textColor2: 'rgba(244, 255, 240, 0.9)',
    textColor3: 'rgba(200, 220, 200, 0.8)',
    textColorDisabled: 'rgba(200, 220, 200, 0.4)',
    placeholderColor: 'rgba(200, 220, 200, 0.6)',
    iconColor: '#dfff00',
    iconColorHover: '#eaff4d',
    borderColor: 'rgba(223, 255, 0, 0.35)',
    dividerColor: 'rgba(223, 255, 0, 0.18)',
    inputColor: 'rgba(223, 255, 0, 0.08)',
    actionColor: 'rgba(223, 255, 0, 0.05)',
    hoverColor: 'rgba(223, 255, 0, 0.1)',
    pressedColor: 'rgba(223, 255, 0, 0.16)',
    buttonColor2: 'rgba(223, 255, 0, 0.08)',
    buttonColor2Hover: 'rgba(223, 255, 0, 0.14)',
    buttonColor2Pressed: 'rgba(223, 255, 0, 0.1)'
  },
  Notification: {
    padding: '12px',
    titleFontSize: '13px',
    titleFontWeight: '700',
    descriptionFontSize: '13px',
    avatarSize: '20px',
    color: '#0c0c0cf2'
  },
  Card: {
    color: '#0000',
    colorModal: '#0c0c0c',
    borderColor: 'rgba(223, 255, 0, 0.25)',
    borderColorModal: 'rgba(223, 255, 0, 0.3)'
  },
  Button: {
    colorSecondary: 'rgba(223, 255, 0, 0.08)',
    colorSecondaryHover: 'rgba(223, 255, 0, 0.16)',
    colorSecondaryPressed: 'rgba(223, 255, 0, 0.12)',
    border: '1px solid rgba(223, 255, 0, 0.3)',
    borderHover: '1px solid rgba(223, 255, 0, 0.45)',
    borderPressed: '1px solid rgba(223, 255, 0, 0.35)',
    textColor: 'rgba(244, 247, 250, 0.92)',
    textColorHover: '#ffffff',
    textColorPressed: 'rgba(244, 247, 250, 0.9)',
    textColorPrimary: '#000000',
    textColorHoverPrimary: '#000000',
    textColorPressedPrimary: '#000000'
  },
  Switch: {
    railColor: 'rgba(223, 255, 0, 0.2)',
    railColorActive: '#dfff00',
    buttonColor: '#f2ff80',
    iconColor: '#000000',
    textColor: 'rgba(223, 255, 0, 0.92)',
    loadingColor: '#f2ff80',
    buttonBoxShadow: '0 0 0 1px rgba(0, 0, 0, 0.42)'
  },
  Checkbox: {
    color: 'rgba(223, 255, 0, 0.08)',
    colorChecked: '#dfff00',
    border: '1px solid rgba(223, 255, 0, 0.3)',
    borderChecked: '1px solid #dfff00',
    checkMarkColor: '#000000',
    textColor: 'rgba(244, 247, 250, 0.92)',
    boxShadowFocus: '0 0 0 2px rgba(223, 255, 0, 0.24)',
    fontSizeSmall: '13px'
  },
  Radio: {
    color: 'rgba(223, 255, 0, 0.2)',
    colorActive: '#dfff00',
    buttonColor: 'rgba(223, 255, 0, 0.08)',
    buttonColorActive: '#dfff00',
    buttonBorderColor: 'rgba(223, 255, 0, 0.3)',
    buttonBorderColorActive: '#dfff00',
    buttonTextColor: 'rgba(244, 247, 250, 0.92)',
    buttonTextColorActive: '#000000',
    dotColorActive: '#dfff00'
  },
  Message: {
    padding: '4px 8px',
    fontSize: '12px',
    iconSize: '16px',
    iconMargin: '0 4px 0 0',
    colorInfo: '#0c0c0c',
    colorSuccess: '#0c0c0c',
    colorWarning: '#0c0c0c',
    colorError: '#0c0c0c'
  },
  Popover: {
    color: '#0a0a0af5',
    arrowColor: '#0a0a0af5',
    borderColor: 'rgba(223, 255, 0, 0.3)',
    fontSize: '12px'
  },
  Tooltip: {
    color: 'rgba(10, 10, 10, 0.98)',
    textColor: 'rgba(223, 255, 0, 0.94)'
  },
  InternalSelectMenu: {
    color: '#0c0c0cf6'
  },
  Dropdown: {
    color: '#0a0a0af5'
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
    bodyColor: '#f3f8f5',
    cardColor: '#fbfdfc',
    modalColor: '#f6faf7',
    tableColor: '#f6faf7',
    popoverColor: '#f6faf7f5',
    primaryColor: '#248873',
    primaryColorHover: '#1c775f',
    primaryColorPressed: '#165f4d',
    infoColor: '#248873',
    infoColorHover: '#1c775f',
    infoColorPressed: '#165f4d',
    successColor: '#5c9e4f',
    warningColor: '#b07622',
    errorColor: '#c85d79',
    textColorBase: 'rgba(33, 45, 42, 0.94)',
    textColor1: 'rgba(33, 45, 42, 0.94)',
    textColor2: 'rgba(58, 70, 67, 0.84)',
    textColor3: 'rgba(92, 104, 101, 0.74)',
    textColorDisabled: 'rgba(92, 104, 101, 0.4)',
    placeholderColor: 'rgba(92, 104, 101, 0.52)',
    borderColor: 'rgba(50, 142, 108, 0.24)',
    dividerColor: 'rgba(50, 142, 108, 0.16)',
    inputColor: 'rgba(50, 142, 108, 0.08)',
    hoverColor: 'rgba(36, 136, 115, 0.1)',
    pressedColor: 'rgba(36, 136, 115, 0.16)'
  },
  Notification: {
    padding: '12px',
    titleFontSize: '13px',
    titleFontWeight: '700',
    descriptionFontSize: '13px',
    avatarSize: '20px',
    color: '#f6f8f7f2'
  },
  Card: {
    color: '#0000',
    colorModal: '#fbfdfc',
    borderColor: 'rgba(50, 142, 108, 0.24)',
    borderColorModal: 'rgba(50, 142, 108, 0.24)'
  },
  Button: {
    textColorPrimary: '#f8fffb',
    textColorHoverPrimary: '#f8fffb',
    textColorPressedPrimary: '#f8fffb'
  },
  Switch: {
    railColorActive: '#248873'
  },
  Checkbox: {
    colorChecked: '#248873',
    borderChecked: '1px solid #248873',
    fontSizeSmall: '13px'
  },
  Radio: {
    buttonColorActive: '#248873',
    buttonBorderColorActive: '#248873'
  },
  Message: {
    padding: '4px 8px',
    fontSize: '12px',
    iconSize: '16px',
    iconMargin: '0 4px 0 0',
    colorInfo: '#eef4f1',
    colorSuccess: '#eef4f1',
    colorWarning: '#eef4f1',
    colorError: '#eef4f1'
  },
  Popover: {
    color: '#f6faf7f5',
    arrowColor: '#f6faf7f5',
    borderColor: 'rgba(50, 142, 108, 0.24)',
    fontSize: '12px'
  },
  Tooltip: {
    color: 'rgba(248, 250, 249, 0.98)',
    textColor: 'rgba(38, 48, 45, 0.92)'
  },
  InternalSelectMenu: {
    color: '#fbfdfc'
  },
  Dropdown: {
    color: '#f6faf7f5'
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
    bodyColor: '#1e1b30',
    cardColor: '#2d2a42',
    modalColor: '#25233a',
    tableColor: '#25233a',
    popoverColor: '#25233af5',
    primaryColor: '#c1a8ff',
    primaryColorHover: '#ac8af5',
    primaryColorPressed: '#956ce3',
    infoColor: '#c1a8ff',
    infoColorHover: '#ac8af5',
    infoColorPressed: '#956ce3',
    successColor: '#67c2d4',
    warningColor: '#f0bb6d',
    errorColor: '#ff8eb9',
    textColorBase: '#f3f2f8',
    textColor1: '#f3f2f8',
    textColor2: 'rgba(243, 242, 248, 0.9)',
    textColor3: 'rgba(201, 201, 210, 0.9)',
    textColorDisabled: 'rgba(201, 201, 210, 0.46)',
    placeholderColor: 'rgba(201, 201, 210, 0.66)',
    borderColor: 'rgba(167, 149, 226, 0.28)',
    dividerColor: 'rgba(167, 149, 226, 0.18)',
    inputColor: 'rgba(167, 149, 226, 0.14)',
    hoverColor: 'rgba(193, 168, 255, 0.12)',
    pressedColor: 'rgba(193, 168, 255, 0.18)'
  },
  Notification: {
    padding: '12px',
    titleFontSize: '13px',
    titleFontWeight: '700',
    descriptionFontSize: '13px',
    avatarSize: '20px',
    color: '#2d2a42f2'
  },
  Card: {
    color: '#0000',
    colorModal: '#2d2a42',
    borderColor: 'rgba(167, 149, 226, 0.28)',
    borderColorModal: 'rgba(167, 149, 226, 0.28)'
  },
  Button: {
    textColorPrimary: '#17122d',
    textColorHoverPrimary: '#17122d',
    textColorPressedPrimary: '#17122d'
  },
  Switch: {
    railColorActive: '#c1a8ff'
  },
  Checkbox: {
    colorChecked: '#c1a8ff',
    borderChecked: '1px solid #c1a8ff',
    fontSizeSmall: '13px'
  },
  Radio: {
    buttonColorActive: '#c1a8ff',
    buttonBorderColorActive: '#c1a8ff'
  },
  Message: {
    padding: '4px 8px',
    fontSize: '12px',
    iconSize: '16px',
    iconMargin: '0 4px 0 0',
    colorInfo: '#29273d',
    colorSuccess: '#29273d',
    colorWarning: '#29273d',
    colorError: '#29273d'
  },
  Popover: {
    color: '#25233af5',
    arrowColor: '#25233af5',
    borderColor: 'rgba(167, 149, 226, 0.28)',
    fontSize: '12px'
  },
  InternalSelectMenu: {
    color: '#2d2a42f6'
  },
  Dropdown: {
    color: '#25233af5'
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
    bodyColor: '#fdf7ea',
    cardColor: '#fdfbf7',
    modalColor: '#fcf6ed',
    tableColor: '#fcf6ed',
    popoverColor: '#fdfbf7',
    primaryColor: '#c27f22',
    primaryColorHover: '#ad6e18',
    primaryColorPressed: '#935b10',
    infoColor: '#c27f22',
    infoColorHover: '#ad6e18',
    infoColorPressed: '#935b10',
    successColor: '#859851',
    warningColor: '#ab6915',
    errorColor: '#cf5f67',
    textColorBase: 'rgba(66, 57, 48, 0.93)',
    textColor1: 'rgba(66, 57, 48, 0.93)',
    textColor2: 'rgba(89, 78, 68, 0.84)',
    textColor3: 'rgba(120, 107, 94, 0.76)',
    textColorDisabled: 'rgba(120, 107, 94, 0.4)',
    placeholderColor: 'rgba(120, 107, 94, 0.52)',
    borderColor: 'rgba(182, 121, 27, 0.24)',
    dividerColor: 'rgba(182, 121, 27, 0.16)',
    inputColor: 'rgba(182, 121, 27, 0.08)',
    hoverColor: 'rgba(194, 127, 34, 0.1)',
    pressedColor: 'rgba(194, 127, 34, 0.16)'
  },
  Notification: {
    padding: '12px',
    titleFontSize: '13px',
    titleFontWeight: '700',
    descriptionFontSize: '13px',
    avatarSize: '20px',
    color: '#fdf8eff2'
  },
  Card: {
    color: '#0000',
    colorModal: '#fcf6ed',
    borderColor: 'rgba(182, 121, 27, 0.24)',
    borderColorModal: 'rgba(182, 121, 27, 0.24)'
  },
  Button: {
    textColorPrimary: '#fffaf5',
    textColorHoverPrimary: '#fffaf5',
    textColorPressedPrimary: '#fffaf5'
  },
  Switch: {
    railColorActive: '#c27f22'
  },
  Checkbox: {
    colorChecked: '#c27f22',
    borderChecked: '1px solid #c27f22',
    fontSizeSmall: '13px'
  },
  Radio: {
    buttonColorActive: '#c27f22',
    buttonBorderColorActive: '#c27f22'
  },
  Message: {
    padding: '4px 8px',
    fontSize: '12px',
    iconSize: '16px',
    iconMargin: '0 4px 0 0',
    colorInfo: '#f9f0e2',
    colorSuccess: '#f9f0e2',
    colorWarning: '#f9f0e2',
    colorError: '#f9f0e2'
  },
  Popover: {
    fontSize: '12px',
    borderColor: 'rgba(182, 121, 27, 0.24)'
  },
  Tooltip: {
    color: 'rgba(253, 250, 241, 0.98)',
    textColor: 'rgba(66, 57, 48, 0.92)'
  },
  InternalSelectMenu: {
    color: '#fdfcf8'
  },
  Dropdown: {
    color: '#fdfbf7'
  },
  Menu: {
    padding: '1px'
  },
  Scrollbar: {
    width: '6px'
  }
}

const THEME_OVERRIDES: Record<AppThemeId, GlobalThemeOverrides> = {
  light: CLASSIC_OVERRIDES.light,
  dark: CLASSIC_OVERRIDES.dark,
  graphite: CLASSIC_OVERRIDES.graphite,
  cyber: CYBER_OVERRIDES,
  sakura: SAKURA_OVERRIDES,
  mint: MINT_OVERRIDES,
  aurora: AURORA_OVERRIDES,
  butter: BUTTER_OVERRIDES
}

/**
 * 为了适配小窗口相关的 UI 组件，在这里对部分组件进行**仅尺寸**的调整
 */
const THEME_OVERRIDES_SMALL_SIZED: GlobalThemeOverrides = {
  Message: {
    padding: '4px 8px',
    fontSize: '12px',
    iconSize: '16px',
    iconMargin: '0 4px 0 0'
  }
}

export function getNaiveUiLocale(locale: string) {
  return NAIVE_UI_LOCALE_MAP[locale as keyof typeof NAIVE_UI_LOCALE_MAP] || NAIVE_UI_LOCALE_MAP.en
}

export function getNaiveUiTheme(colorTheme: AppColorTheme): GlobalTheme | null {
  return colorTheme === 'dark' ? darkTheme : lightTheme
}

export function getNaiveUiThemeOverrides(themeId: AppThemeId, fitSmallSize = false) {
  if (fitSmallSize) {
    return Object.assign({}, THEME_OVERRIDES[themeId], THEME_OVERRIDES_SMALL_SIZED)
  }

  return THEME_OVERRIDES[themeId]
}
