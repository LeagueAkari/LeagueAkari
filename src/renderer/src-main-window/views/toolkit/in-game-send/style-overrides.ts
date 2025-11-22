export const getDropdownOverrides = (isLight: boolean) => ({
  color: isLight ? '#eeeef4' : '#222e',
  fontSizeSmall: '13px',
  optionHeightSmall: '26px'
})

// For backwards compatibility
export const DROPDOWN_OVERRIDES = getDropdownOverrides(false)
