import { describe, expect, it, vi } from 'vitest'

import { writeClipboardText } from './clipboard'

describe('writeClipboardText', () => {
  it('writes text through the Clipboard API', async () => {
    const clipboard = {
      writeText: vi.fn().mockResolvedValue(undefined)
    }

    await writeClipboardText('hello', clipboard)

    expect(clipboard.writeText).toHaveBeenCalledWith('hello')
  })

  it('fails clearly when the Clipboard API is unavailable', async () => {
    await expect(writeClipboardText('hello', null)).rejects.toThrow('Clipboard API is unavailable')
  })
})
