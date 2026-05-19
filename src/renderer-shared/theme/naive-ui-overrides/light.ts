import { GlobalThemeOverrides } from 'naive-ui'

import { AKARI, AKARI_RGB, AKARI_SHARED_COMPACT_OVERRIDES, rgba } from './shared'

const BRAND = AKARI[600]
const BRAND_HOVER = AKARI[500]
const BRAND_PRESSED = AKARI[700]
const BRAND_RGB = AKARI_RGB[600]
const SUCCESS = '#2f9e69'
const SUCCESS_HOVER = '#3fb978'
const SUCCESS_PRESSED = '#258356'
const WARNING = '#c47a1f'
const WARNING_HOVER = '#d99036'
const WARNING_PRESSED = '#a76415'
const TEXT_1 = 'rgb(31, 34, 37)'
const TEXT_2 = 'rgb(51, 54, 57)'
const TEXT_3 = 'rgb(118, 124, 130)'
const BORDER = 'rgb(224, 224, 230)'
const DIVIDER = 'rgb(239, 239, 245)'
const BODY = '#f3f3f4'
const SURFACE = '#f7f7f8'
const SURFACE_ELEVATED = '#fafafa'
const SURFACE_MODAL = '#f5f5f6'
const POPOVER = 'rgba(248, 248, 249, 0.98)'
const NEUTRAL_HOVER = 'rgb(243, 243, 245)'
const NEUTRAL_PRESSED = 'rgb(237, 237, 239)'
const NEUTRAL_TINT = 'rgba(46, 51, 56, 0.05)'
const NEUTRAL_TINT_HOVER = 'rgba(46, 51, 56, 0.08)'
const NEUTRAL_TINT_PRESSED = 'rgba(46, 51, 56, 0.12)'
const BRAND_SOFT = rgba(BRAND_RGB, 0.1)
const BRAND_ACTIVE = rgba(BRAND_RGB, 0.14)
const BRAND_FOCUS = rgba(BRAND_RGB, 0.2)

const AKARI_LIGHT_COMMON: GlobalThemeOverrides['common'] = {
  baseColor: '#ffffff',
  bodyColor: BODY,
  cardColor: SURFACE_ELEVATED,
  modalColor: SURFACE_MODAL,
  tableColor: SURFACE,
  popoverColor: POPOVER,
  tagColor: NEUTRAL_TINT,
  avatarColor: NEUTRAL_TINT,
  invertedColor: '#1f2225',
  inputColor: SURFACE_ELEVATED,
  inputColorDisabled: 'rgba(46, 51, 56, 0.04)',
  codeColor: 'rgba(46, 51, 56, 0.06)',
  tabColor: NEUTRAL_TINT,
  actionColor: 'rgba(46, 51, 56, 0.04)',
  tableHeaderColor: 'rgba(46, 51, 56, 0.04)',
  hoverColor: NEUTRAL_HOVER,
  tableColorHover: 'rgba(46, 51, 56, 0.04)',
  tableColorStriped: 'rgba(46, 51, 56, 0.025)',
  pressedColor: NEUTRAL_PRESSED,
  primaryColor: BRAND,
  primaryColorHover: BRAND_HOVER,
  primaryColorPressed: BRAND_PRESSED,
  primaryColorSuppl: rgba(BRAND_RGB, 0.14),
  infoColor: BRAND,
  infoColorHover: BRAND_HOVER,
  infoColorPressed: BRAND_PRESSED,
  infoColorSuppl: rgba(BRAND_RGB, 0.14),
  successColor: SUCCESS,
  successColorHover: SUCCESS_HOVER,
  successColorPressed: SUCCESS_PRESSED,
  successColorSuppl: 'rgba(47, 158, 105, 0.14)',
  warningColor: WARNING,
  warningColorHover: WARNING_HOVER,
  warningColorPressed: WARNING_PRESSED,
  warningColorSuppl: 'rgba(196, 122, 31, 0.14)',
  errorColor: BRAND,
  errorColorHover: BRAND_HOVER,
  errorColorPressed: BRAND_PRESSED,
  errorColorSuppl: rgba(BRAND_RGB, 0.14),
  textColorBase: '#000000',
  textColor1: TEXT_1,
  textColor2: TEXT_2,
  textColor3: TEXT_3,
  textColorDisabled: 'rgba(118, 124, 130, 0.42)',
  placeholderColor: 'rgba(118, 124, 130, 0.64)',
  placeholderColorDisabled: 'rgba(118, 124, 130, 0.38)',
  iconColor: 'rgba(118, 124, 130, 0.82)',
  iconColorHover: BRAND,
  iconColorPressed: BRAND_PRESSED,
  iconColorDisabled: 'rgba(118, 124, 130, 0.38)',
  dividerColor: DIVIDER,
  borderColor: BORDER,
  closeIconColor: 'rgba(118, 124, 130, 0.72)',
  closeIconColorHover: TEXT_2,
  closeIconColorPressed: TEXT_1,
  closeColorHover: NEUTRAL_HOVER,
  closeColorPressed: NEUTRAL_PRESSED,
  clearColor: 'rgba(118, 124, 130, 0.48)',
  clearColorHover: TEXT_3,
  clearColorPressed: TEXT_2,
  scrollbarColor: 'rgba(0, 0, 0, 0.22)',
  scrollbarColorHover: 'rgba(0, 0, 0, 0.32)',
  progressRailColor: 'rgba(46, 51, 56, 0.12)',
  railColor: 'rgba(46, 51, 56, 0.16)',
  buttonColor2: NEUTRAL_TINT,
  buttonColor2Hover: NEUTRAL_TINT_HOVER,
  buttonColor2Pressed: NEUTRAL_TINT_PRESSED,
  boxShadow1: '0 1px 2px rgba(0, 0, 0, 0.08)',
  boxShadow2: '0 3px 12px rgba(0, 0, 0, 0.1)',
  boxShadow3: '0 6px 24px rgba(0, 0, 0, 0.12)'
}

export const LIGHT_THEME_OVERRIDES: GlobalThemeOverrides = {
  common: AKARI_LIGHT_COMMON,
  ...AKARI_SHARED_COMPACT_OVERRIDES,
  Notification: {
    ...AKARI_SHARED_COMPACT_OVERRIDES.Notification,
    color: 'rgba(247, 247, 248, 0.96)',
    textColor: TEXT_2,
    headerTextColor: TEXT_1,
    descriptionTextColor: TEXT_3,
    actionTextColor: BRAND,
    iconColor: BRAND,
    iconColorInfo: BRAND,
    iconColorSuccess: SUCCESS,
    iconColorWarning: WARNING,
    iconColorError: BRAND
  },
  Card: {
    color: '#0000',
    colorModal: SURFACE_MODAL,
    colorPopover: POPOVER,
    colorTarget: BRAND,
    colorEmbedded: 'rgba(46, 51, 56, 0.04)',
    colorEmbeddedModal: 'rgba(46, 51, 56, 0.04)',
    colorEmbeddedPopover: 'rgba(46, 51, 56, 0.04)',
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderColorModal: 'rgba(0, 0, 0, 0.16)',
    borderColorPopover: 'rgba(0, 0, 0, 0.14)',
    titleTextColor: TEXT_1,
    textColor: TEXT_2
  },
  Button: {
    colorSecondary: NEUTRAL_TINT,
    colorSecondaryHover: NEUTRAL_TINT_HOVER,
    colorSecondaryPressed: NEUTRAL_TINT_PRESSED,
    borderHover: `1px solid ${BRAND}`,
    borderPressed: `1px solid ${BRAND_PRESSED}`,
    borderFocus: `1px solid ${BRAND}`,
    rippleColor: BRAND,
    textColorHover: BRAND,
    textColorPressed: BRAND_PRESSED,
    textColorFocus: BRAND,
    textColorPrimary: '#ffffff',
    textColorHoverPrimary: '#ffffff',
    textColorPressedPrimary: '#ffffff',
    textColorFocusPrimary: '#ffffff'
  },
  Input: {
    color: SURFACE_ELEVATED,
    colorFocus: '#ffffff',
    borderHover: `1px solid ${BRAND}`,
    borderFocus: `1px solid ${BRAND}`,
    boxShadowFocus: `0 0 0 2px ${BRAND_FOCUS}`,
    caretColor: BRAND,
    loadingColor: BRAND
  },
  InternalSelection: {
    color: SURFACE_ELEVATED,
    colorActive: '#ffffff',
    borderHover: `1px solid ${BRAND}`,
    borderActive: `1px solid ${BRAND}`,
    borderFocus: `1px solid ${BRAND}`,
    boxShadowHover: `0 0 0 2px ${rgba(BRAND_RGB, 0.1)}`,
    boxShadowActive: `0 0 0 2px ${BRAND_ACTIVE}`,
    boxShadowFocus: `0 0 0 2px ${BRAND_FOCUS}`,
    caretColor: BRAND,
    loadingColor: BRAND
  },
  InternalSelectMenu: {
    color: POPOVER,
    optionTextColorActive: BRAND,
    optionCheckColor: BRAND,
    optionColorPending: NEUTRAL_TINT_HOVER,
    optionColorActive: BRAND_SOFT,
    optionColorActivePending: BRAND_ACTIVE,
    loadingColor: BRAND
  },
  Select: {
    menuBoxShadow: '0 4px 18px rgba(0, 0, 0, 0.12)'
  },
  Message: {
    ...AKARI_SHARED_COMPACT_OVERRIDES.Message,
    color: SURFACE,
    colorInfo: SURFACE,
    colorSuccess: SURFACE,
    colorWarning: SURFACE,
    colorError: SURFACE,
    colorLoading: SURFACE,
    iconColor: BRAND,
    iconColorInfo: BRAND,
    iconColorSuccess: SUCCESS,
    iconColorWarning: WARNING,
    iconColorError: BRAND,
    iconColorLoading: BRAND
  },
  Popover: {
    ...AKARI_SHARED_COMPACT_OVERRIDES.Popover,
    color: POPOVER,
    arrowColor: POPOVER,
    borderColor: 'rgba(0, 0, 0, 0.2)',
    textColor: TEXT_2,
    dividerColor: DIVIDER
  },
  Tooltip: {
    color: 'rgba(34, 34, 41, 0.94)',
    textColor: '#f7f7fa'
  },
  Dropdown: {
    color: POPOVER,
    optionColorHover: NEUTRAL_TINT_HOVER,
    optionColorActive: BRAND_SOFT,
    optionTextColorHover: TEXT_1,
    optionTextColorActive: BRAND
  },
  Menu: {
    ...AKARI_SHARED_COMPACT_OVERRIDES.Menu,
    color: '#0000',
    itemColorHover: NEUTRAL_TINT_HOVER,
    itemColorActive: BRAND_SOFT,
    itemColorActiveHover: BRAND_ACTIVE,
    itemTextColorHover: TEXT_1,
    itemTextColorActive: BRAND,
    itemTextColorActiveHover: BRAND_PRESSED,
    itemIconColorHover: TEXT_1,
    itemIconColorActive: BRAND,
    arrowColorActive: BRAND
  },
  Tabs: {
    barColor: BRAND,
    tabTextColorActiveLine: BRAND,
    tabTextColorHoverLine: BRAND_HOVER,
    tabTextColorActiveBar: BRAND,
    tabTextColorHoverBar: BRAND_HOVER,
    tabTextColorActiveCard: BRAND,
    tabTextColorHoverCard: BRAND_HOVER,
    tabTextColorActiveSegment: BRAND,
    tabTextColorHoverSegment: BRAND_HOVER,
    colorSegment: NEUTRAL_TINT,
    tabColorSegment: '#ffffff'
  },
  Switch: {
    railColor: 'rgba(46, 51, 56, 0.18)',
    railColorActive: BRAND,
    buttonColor: '#ffffff',
    iconColor: BRAND_PRESSED,
    loadingColor: BRAND
  },
  Checkbox: {
    ...AKARI_SHARED_COMPACT_OVERRIDES.Checkbox,
    color: '#ffffff',
    colorChecked: BRAND,
    borderChecked: `1px solid ${BRAND}`,
    borderFocus: `1px solid ${BRAND}`,
    checkMarkColor: '#ffffff',
    boxShadowFocus: `0 0 0 2px ${BRAND_FOCUS}`
  },
  Radio: {
    color: '#ffffff',
    colorActive: '#0000',
    buttonColor: NEUTRAL_TINT,
    buttonColorActive: BRAND,
    buttonBorderColorActive: BRAND,
    buttonTextColorActive: '#ffffff',
    dotColorActive: BRAND
  },
  Slider: {
    fillColor: BRAND,
    fillColorHover: BRAND_HOVER,
    handleColor: '#ffffff',
    handleBoxShadow: `0 0 0 2px ${BRAND}`,
    handleBoxShadowHover: `0 0 0 2px ${BRAND_HOVER}`,
    handleBoxShadowActive: `0 0 0 3px ${rgba(BRAND_RGB, 0.24)}`,
    handleBoxShadowFocus: `0 0 0 3px ${rgba(BRAND_RGB, 0.24)}`,
    indicatorColor: 'rgba(34, 34, 41, 0.94)',
    indicatorTextColor: '#f7f7fa'
  },
  Progress: {
    fillColor: BRAND,
    fillColorInfo: BRAND,
    fillColorSuccess: SUCCESS,
    fillColorWarning: WARNING,
    fillColorError: BRAND,
    iconColor: BRAND,
    iconColorInfo: BRAND,
    iconColorSuccess: SUCCESS,
    iconColorWarning: WARNING,
    iconColorError: BRAND
  },
  LoadingBar: {
    colorLoading: BRAND,
    colorError: BRAND
  },
  DataTable: {
    thColor: 'rgba(46, 51, 56, 0.04)',
    thColorHover: 'rgba(46, 51, 56, 0.06)',
    thColorSorting: 'rgba(46, 51, 56, 0.07)',
    tdColorHover: 'rgba(46, 51, 56, 0.04)',
    tdColorSorting: 'rgba(46, 51, 56, 0.035)',
    tdColorStriped: 'rgba(46, 51, 56, 0.025)',
    thIconColorActive: BRAND,
    loadingColor: BRAND
  },
  Table: {
    thColor: 'rgba(46, 51, 56, 0.04)',
    thTextColor: TEXT_2,
    tdColorStriped: 'rgba(46, 51, 56, 0.025)'
  },
  Pagination: {
    itemTextColorHover: BRAND,
    itemTextColorPressed: BRAND_PRESSED,
    itemTextColorActive: BRAND,
    itemColorHover: NEUTRAL_TINT_HOVER,
    itemColorPressed: NEUTRAL_TINT_PRESSED,
    itemColorActive: BRAND_SOFT,
    itemColorActiveHover: BRAND_ACTIVE,
    itemBorderActive: `1px solid ${BRAND}`,
    buttonIconColorHover: BRAND,
    buttonIconColorPressed: BRAND_PRESSED
  },
  Tag: {
    textColorPrimary: BRAND_PRESSED,
    colorPrimary: rgba(BRAND_RGB, 0.12),
    colorBorderedPrimary: rgba(BRAND_RGB, 0.08),
    borderPrimary: `1px solid ${rgba(BRAND_RGB, 0.28)}`,
    closeIconColorPrimary: BRAND
  }
}
