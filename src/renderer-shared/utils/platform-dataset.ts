export function initRendererPlatformDataset() {
  // Used by CSS to apply small platform-specific tweaks (e.g. macOS traffic lights safe area).
  if (typeof document === 'undefined') return

  const ua = navigator.userAgent || ''
  let platform = 'unknown'
  if (ua.includes('Mac OS X')) platform = 'darwin'
  else if (ua.includes('Windows')) platform = 'win32'
  else if (ua.includes('Linux')) platform = 'linux'

  document.documentElement.dataset.platform = platform
}
