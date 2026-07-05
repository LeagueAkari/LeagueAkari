export type FocusableTextInput = {
  focus: () => void
  textareaElRef?: HTMLTextAreaElement | null
  inputElRef?: HTMLInputElement | null
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

  const textInputEl = input.textareaElRef || input.inputElRef
  textInputEl?.setSelectionRange(cursorPosition, cursorPosition)
}
