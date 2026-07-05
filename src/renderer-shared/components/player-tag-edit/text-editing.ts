export type TagTextEditResult = {
  text: string
  cursorPosition: number
}

export const appendTagText = (currentText: string, phrase: string): TagTextEditResult => {
  const text = `${currentText}${phrase}`

  return {
    text,
    cursorPosition: text.length
  }
}

export const clearTagText = (): TagTextEditResult => ({
  text: '',
  cursorPosition: 0
})
