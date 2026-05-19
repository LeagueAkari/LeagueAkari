import { GlobalThemeOverrides } from 'naive-ui'

import { AKARI, AKARI_RGB, AKARI_SHARED_COMPACT_OVERRIDES, rgba } from './shared'

const BRAND = AKARI[400]
const BRAND_HOVER = AKARI[300]
const BRAND_PRESSED = AKARI[500]
const BRAND_RGB = AKARI_RGB[400]
const SUCCESS = '#63d49b'
const SUCCESS_HOVER = '#7de0ad'
const SUCCESS_PRESSED = '#4eba83'
const WARNING = '#f2c97d'
const WARNING_HOVER = '#ffd792'
const WARNING_PRESSED = '#dcae5f'
const TEXT_1 = 'rgba(255, 255, 255, 0.9)'
const TEXT_2 = 'rgba(255, 255, 255, 0.82)'
const TEXT_3 = 'rgba(255, 255, 255, 0.52)'
const TEXT_DISABLED = 'rgba(255, 255, 255, 0.38)'
const BORDER = 'rgba(255, 255, 255, 0.22)'
const DIVIDER = 'rgba(255, 255, 255, 0.09)'
const BODY = '#141416'
const SURFACE = '#1b1b1f'
const SURFACE_MODAL = '#1e1e22'
const POPOVER = '#202024fa'
const NEUTRAL_HOVER = 'rgba(255, 255, 255, 0.09)'
const NEUTRAL_PRESSED = 'rgba(255, 255, 255, 0.05)'
const NEUTRAL_TINT = 'rgba(255, 255, 255, 0.08)'
const NEUTRAL_TINT_HOVER = 'rgba(255, 255, 255, 0.12)'
const NEUTRAL_TINT_PRESSED = 'rgba(255, 255, 255, 0.16)'
const BRAND_SOFT = rgba(BRAND_RGB, 0.12)
const BRAND_ACTIVE = rgba(BRAND_RGB, 0.18)
const BRAND_FOCUS = rgba(BRAND_RGB, 0.26)

const AKARI_DARK_COMMON: GlobalThemeOverrides['common'] = {
  baseColor: '#000000',
  bodyColor: BODY,
  cardColor: SURFACE,
  modalColor: SURFACE_MODAL,
  tableColor: SURFACE,
  popoverColor: POPOVER,
  tagColor: NEUTRAL_TINT,
  avatarColor: NEUTRAL_TINT,
  invertedColor: '#ffffff',
  inputColor: 'rgba(255, 255, 255, 0.085)',
  inputColorDisabled: 'rgba(255, 255, 255, 0.06)',
  codeColor: 'rgba(255, 255, 255, 0.08)',
  tabColor: NEUTRAL_TINT,
  actionColor: 'rgba(255, 255, 255, 0.06)',
  tableHeaderColor: 'rgba(255, 255, 255, 0.06)',
  hoverColor: NEUTRAL_HOVER,
  tableColorHover: 'rgba(255, 255, 255, 0.07)',
  tableColorStriped: 'rgba(255, 255, 255, 0.04)',
  pressedColor: NEUTRAL_PRESSED,
  primaryColor: BRAND,
  primaryColorHover: BRAND_HOVER,
  primaryColorPressed: BRAND_PRESSED,
  primaryColorSuppl: rgba(BRAND_RGB, 0.2),
  infoColor: BRAND,
  infoColorHover: BRAND_HOVER,
  infoColorPressed: BRAND_PRESSED,
  infoColorSuppl: rgba(BRAND_RGB, 0.2),
  successColor: SUCCESS,
  successColorHover: SUCCESS_HOVER,
  successColorPressed: SUCCESS_PRESSED,
  successColorSuppl: 'rgba(99, 212, 155, 0.2)',
  warningColor: WARNING,
  warningColorHover: WARNING_HOVER,
  warningColorPressed: WARNING_PRESSED,
  warningColorSuppl: 'rgba(242, 201, 125, 0.2)',
  errorColor: BRAND,
  errorColorHover: BRAND_HOVER,
  errorColorPressed: BRAND_PRESSED,
  errorColorSuppl: rgba(BRAND_RGB, 0.22),
  textColorBase: '#ffffff',
  textColor1: TEXT_1,
  textColor2: TEXT_2,
  textColor3: TEXT_3,
  textColorDisabled: TEXT_DISABLED,
  placeholderColor: 'rgba(255, 255, 255, 0.46)',
  placeholderColorDisabled: 'rgba(255, 255, 255, 0.28)',
  iconColor: 'rgba(255, 255, 255, 0.62)',
  iconColorHover: BRAND_HOVER,
  iconColorPressed: BRAND,
  iconColorDisabled: 'rgba(255, 255, 255, 0.28)',
  dividerColor: DIVIDER,
  borderColor: BORDER,
  closeIconColor: 'rgba(255, 255, 255, 0.58)',
  closeIconColorHover: TEXT_1,
  closeIconColorPressed: '#ffffff',
  closeColorHover: NEUTRAL_HOVER,
  closeColorPressed: NEUTRAL_PRESSED,
  clearColor: 'rgba(255, 255, 255, 0.38)',
  clearColorHover: TEXT_3,
  clearColorPressed: TEXT_2,
  scrollbarColor: 'rgba(255, 255, 255, 0.22)',
  scrollbarColorHover: 'rgba(255, 255, 255, 0.32)',
  progressRailColor: 'rgba(255, 255, 255, 0.14)',
  railColor: 'rgba(255, 255, 255, 0.18)',
  buttonColor2: NEUTRAL_TINT,
  buttonColor2Hover: NEUTRAL_TINT_HOVER,
  buttonColor2Pressed: NEUTRAL_TINT_PRESSED,
  boxShadow1: '0 1px 2px rgba(0, 0, 0, 0.35)',
  boxShadow2: '0 4px 16px rgba(0, 0, 0, 0.38)',
  boxShadow3: '0 8px 28px rgba(0, 0, 0, 0.42)'
}

export const DARK_THEME_OVERRIDES: GlobalThemeOverrides = {
  common: AKARI_DARK_COMMON,
  ...AKARI_SHARED_COMPACT_OVERRIDES,
  Notification: {
    ...AKARI_SHARED_COMPACT_OVERRIDES.Notification,
    color: '#242428fa',
    textColor: TEXT_2,
    headerTextColor: TEXT_1,
    descriptionTextColor: TEXT_3,
    actionTextColor: BRAND_HOVER,
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
    colorEmbedded: 'rgba(255, 255, 255, 0.06)',
    colorEmbeddedModal: 'rgba(255, 255, 255, 0.07)',
    colorEmbeddedPopover: 'rgba(255, 255, 255, 0.07)',
    borderColor: 'rgba(255, 255, 255, 0.13)',
    borderColorModal: 'rgba(255, 255, 255, 0.16)',
    borderColorPopover: 'rgba(255, 255, 255, 0.16)',
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
    textColorHover: BRAND_HOVER,
    textColorPressed: BRAND,
    textColorFocus: BRAND_HOVER,
    textColorPrimary: AKARI[950],
    textColorHoverPrimary: AKARI[950],
    textColorPressedPrimary: AKARI[950],
    textColorFocusPrimary: AKARI[950]
  },
  Input: {
    color: 'rgba(255, 255, 255, 0.085)',
    colorFocus: 'rgba(255, 255, 255, 0.12)',
    borderHover: `1px solid ${BRAND}`,
    borderFocus: `1px solid ${BRAND}`,
    boxShadowFocus: `0 0 0 2px ${BRAND_FOCUS}`,
    caretColor: BRAND,
    loadingColor: BRAND
  },
  InternalSelection: {
    color: 'rgba(255, 255, 255, 0.085)',
    colorActive: 'rgba(255, 255, 255, 0.12)',
    borderHover: `1px solid ${BRAND}`,
    borderActive: `1px solid ${BRAND}`,
    borderFocus: `1px solid ${BRAND}`,
    boxShadowHover: `0 0 0 2px ${rgba(BRAND_RGB, 0.12)}`,
    boxShadowActive: `0 0 0 2px ${BRAND_ACTIVE}`,
    boxShadowFocus: `0 0 0 2px ${BRAND_FOCUS}`,
    caretColor: BRAND,
    loadingColor: BRAND
  },
  InternalSelectMenu: {
    color: POPOVER,
    optionTextColorActive: BRAND_HOVER,
    optionCheckColor: BRAND,
    optionColorPending: NEUTRAL_HOVER,
    optionColorActive: BRAND_SOFT,
    optionColorActivePending: BRAND_ACTIVE,
    loadingColor: BRAND
  },
  Select: {
    menuBoxShadow: '0 4px 18px rgba(0, 0, 0, 0.4)'
  },
  Dropdown: {
    color: POPOVER,
    optionColorHover: NEUTRAL_HOVER,
    optionColorActive: BRAND_SOFT,
    optionTextColorHover: TEXT_1,
    optionTextColorActive: BRAND_HOVER
  },
  Message: {
    ...AKARI_SHARED_COMPACT_OVERRIDES.Message,
    color: '#252529',
    colorInfo: '#252529',
    colorSuccess: '#252529',
    colorWarning: '#252529',
    colorError: '#252529',
    colorLoading: '#252529',
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
    borderColor: 'rgba(255, 255, 255, 0.2)',
    textColor: TEXT_2,
    dividerColor: DIVIDER
  },
  Tooltip: {
    color: 'rgba(245, 245, 248, 0.96)',
    textColor: '#1f2225'
  },
  Menu: {
    ...AKARI_SHARED_COMPACT_OVERRIDES.Menu,
    color: '#0000',
    itemColorHover: NEUTRAL_HOVER,
    itemColorActive: BRAND_SOFT,
    itemColorActiveHover: BRAND_ACTIVE,
    itemTextColorHover: TEXT_1,
    itemTextColorActive: BRAND_HOVER,
    itemTextColorActiveHover: BRAND_HOVER,
    itemIconColorHover: TEXT_1,
    itemIconColorActive: BRAND_HOVER,
    arrowColorActive: BRAND_HOVER
  },
  Tabs: {
    barColor: BRAND,
    tabTextColorActiveLine: BRAND_HOVER,
    tabTextColorHoverLine: BRAND,
    tabTextColorActiveBar: BRAND_HOVER,
    tabTextColorHoverBar: BRAND,
    tabTextColorActiveCard: BRAND_HOVER,
    tabTextColorHoverCard: BRAND,
    tabTextColorActiveSegment: BRAND_HOVER,
    tabTextColorHoverSegment: BRAND,
    colorSegment: NEUTRAL_TINT,
    tabColorSegment: 'rgba(255, 255, 255, 0.12)'
  },
  Switch: {
    railColor: 'rgba(255, 255, 255, 0.18)',
    railColorActive: BRAND,
    buttonColor: '#f7f7fa',
    iconColor: AKARI[950],
    loadingColor: BRAND
  },
  Checkbox: {
    ...AKARI_SHARED_COMPACT_OVERRIDES.Checkbox,
    color: 'rgba(255, 255, 255, 0.1)',
    colorChecked: BRAND,
    borderChecked: `1px solid ${BRAND}`,
    borderFocus: `1px solid ${BRAND}`,
    checkMarkColor: AKARI[950],
    boxShadowFocus: `0 0 0 2px ${BRAND_FOCUS}`
  },
  Radio: {
    color: 'rgba(255, 255, 255, 0.1)',
    colorActive: '#0000',
    buttonColor: NEUTRAL_TINT,
    buttonColorActive: BRAND,
    buttonBorderColorActive: BRAND,
    buttonTextColorActive: AKARI[950],
    dotColorActive: BRAND
  },
  Slider: {
    fillColor: BRAND,
    fillColorHover: BRAND_HOVER,
    handleColor: '#f7f7fa',
    handleBoxShadow: `0 0 0 2px ${BRAND}`,
    handleBoxShadowHover: `0 0 0 2px ${BRAND_HOVER}`,
    handleBoxShadowActive: `0 0 0 3px ${rgba(BRAND_RGB, 0.3)}`,
    handleBoxShadowFocus: `0 0 0 3px ${rgba(BRAND_RGB, 0.3)}`,
    indicatorColor: 'rgba(245, 245, 248, 0.96)',
    indicatorTextColor: '#1f2225'
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
    thColor: 'rgba(255, 255, 255, 0.06)',
    thColorHover: 'rgba(255, 255, 255, 0.08)',
    thColorSorting: 'rgba(255, 255, 255, 0.1)',
    tdColorHover: 'rgba(255, 255, 255, 0.07)',
    tdColorSorting: 'rgba(255, 255, 255, 0.06)',
    tdColorStriped: 'rgba(255, 255, 255, 0.04)',
    thIconColorActive: BRAND,
    loadingColor: BRAND
  },
  Table: {
    thColor: 'rgba(255, 255, 255, 0.06)',
    thTextColor: TEXT_2,
    tdColorStriped: 'rgba(255, 255, 255, 0.04)'
  },
  Pagination: {
    itemTextColorHover: BRAND_HOVER,
    itemTextColorPressed: BRAND,
    itemTextColorActive: BRAND_HOVER,
    itemColorHover: NEUTRAL_HOVER,
    itemColorPressed: NEUTRAL_PRESSED,
    itemColorActive: BRAND_SOFT,
    itemColorActiveHover: BRAND_ACTIVE,
    itemBorderActive: `1px solid ${BRAND}`,
    buttonIconColorHover: BRAND_HOVER,
    buttonIconColorPressed: BRAND
  },
  Tag: {
    textColorPrimary: BRAND_HOVER,
    colorPrimary: rgba(BRAND_RGB, 0.16),
    colorBorderedPrimary: rgba(BRAND_RGB, 0.1),
    borderPrimary: `1px solid ${rgba(BRAND_RGB, 0.32)}`,
    closeIconColorPrimary: BRAND_HOVER
  }
}
