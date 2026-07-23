export type FocusableTextInput = {
  focus: () => void
  textareaElRef?: HTMLTextAreaElement | null
  inputElRef?: HTMLInputElement | null
}

export type TextInsertionResult = {
  value: string
  cursorPosition: number
}

const getTextInputElement = (input: FocusableTextInput | null | undefined) =>
  input?.textareaElRef || input?.inputElRef

export const insertTextAtSelection = (
  input: FocusableTextInput | null | undefined,
  value: string,
  insertedText: string
): TextInsertionResult => {
  const textInputEl = getTextInputElement(input)
  const selectionStart = textInputEl?.selectionStart
  const selectionEnd = textInputEl?.selectionEnd
  const start =
    selectionStart === null || selectionStart === undefined ? value.length : selectionStart
  const end = selectionEnd === null || selectionEnd === undefined ? start : selectionEnd

  return {
    value: `${value.slice(0, start)}${insertedText}${value.slice(end)}`,
    cursorPosition: start + insertedText.length
  }
}

export const focusTextInput = (
  input: FocusableTextInput | null | undefined,
  cursorPosition?: number
) => {
  if (!input) {
    return
  }

  input.focus()

  if (cursorPosition === undefined) {
    return
  }

  const textInputEl = getTextInputElement(input)
  textInputEl?.setSelectionRange(cursorPosition, cursorPosition)
}
