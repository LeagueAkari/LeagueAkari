export type TagTextEditResult = {
  text: string
  cursorPosition: number
}

export function appendTagText(currentText: string, phrase: string): TagTextEditResult {
  const text = `${currentText}${phrase}`
  return {
    text,
    cursorPosition: text.length
  }
}

export function clearTagText(): TagTextEditResult {
  return {
    text: '',
    cursorPosition: 0
  }
}
