import { describe, expect, it, vi } from 'vitest'

import { RadixEventEmitter } from './event-emitter'

describe('RadixEventEmitter', () => {
  it('emits static, placeholder, and wildcard listeners for the same URI', () => {
    const emitter = new RadixEventEmitter()
    const exact = vi.fn()
    const conversation = vi.fn()
    const allChat = vi.fn()

    emitter.on('/lol-chat/v1/conversations/conv-1/messages/msg-1', exact)
    emitter.on('/lol-chat/v1/conversations/:conversationId/messages/:messageId', conversation)
    emitter.on('/lol-chat/v1/**', allChat)

    const payload = { body: 'hello' }
    emitter.emit('/lol-chat/v1/conversations/conv-1/messages/msg-1', payload)

    expect(exact).toHaveBeenCalledWith(payload, undefined)
    expect(conversation).toHaveBeenCalledWith(payload, {
      conversationId: 'conv-1',
      messageId: 'msg-1'
    })
    expect(allChat).toHaveBeenCalledWith(payload, {
      __: 'conversations/conv-1/messages/msg-1'
    })
  })

  it('unsubscribes one listener without removing other listeners on the same route', () => {
    const emitter = new RadixEventEmitter()
    const first = vi.fn()
    const second = vi.fn()

    const offFirst = emitter.on('/lol-gameflow/v1/session', first)
    emitter.on('/lol-gameflow/v1/session', second)

    offFirst()
    emitter.emit('/lol-gameflow/v1/session', 'payload')

    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledWith('payload', undefined)
  })

  it('keeps exact prefix listeners separate from wildcard listeners', () => {
    const emitter = new RadixEventEmitter()
    const exact = vi.fn()
    const wildcard = vi.fn()

    emitter.on('/lol-gameflow/v1/session', exact)
    const offWildcard = emitter.on('/lol-gameflow/v1/session/**', wildcard)

    offWildcard()
    emitter.emit('/lol-gameflow/v1/session/actions/1', 'payload')
    emitter.emit('/lol-gameflow/v1/session', 'root')

    expect(wildcard).not.toHaveBeenCalled()
    expect(exact).toHaveBeenCalledTimes(1)
    expect(exact).toHaveBeenCalledWith('root', undefined)
  })

  it('removes routes after the final listener unsubscribes and supports clear', () => {
    const emitter = new RadixEventEmitter()
    const listener = vi.fn()
    const off = emitter.on('/lol-gameflow/v1/session', listener)

    off()
    emitter.emit('/lol-gameflow/v1/session', 'payload')
    expect(listener).not.toHaveBeenCalled()

    emitter.on('/lol-gameflow/v1/session', listener)
    emitter.clear()
    emitter.emit('/lol-gameflow/v1/session', 'payload')
    expect(listener).not.toHaveBeenCalled()
  })

  it('emits only relevant listeners among many wildcard subscriptions', () => {
    const emitter = new RadixEventEmitter()
    const broad = vi.fn()
    const listeners = Array.from({ length: 100 }, () => vi.fn())

    emitter.on('/lol-chat/**', broad)
    for (let i = 0; i < listeners.length; i++) {
      emitter.on(`/lol-chat/v1/conversations/${i}/**`, listeners[i])
    }

    emitter.emit('/lol-chat/v1/conversations/42/messages/1', 'payload')

    expect(broad).toHaveBeenCalledWith('payload', {
      __: 'v1/conversations/42/messages/1'
    })
    expect(listeners[42]).toHaveBeenCalledWith('payload', { __: 'messages/1' })
    expect(listeners[41]).not.toHaveBeenCalled()
    expect(listeners[43]).not.toHaveBeenCalled()
  })
})
