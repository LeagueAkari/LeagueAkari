type ClipboardWriter = Pick<Clipboard, 'writeText'>

export async function writeClipboardText(
  text: string,
  clipboard: ClipboardWriter | null | undefined = globalThis.navigator?.clipboard
) {
  if (!clipboard?.writeText) {
    throw new Error('Clipboard API is unavailable')
  }

  await clipboard.writeText(text)
}
