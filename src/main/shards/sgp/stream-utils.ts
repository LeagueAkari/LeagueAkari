import { Buffer } from 'node:buffer'
import { Readable } from 'node:stream'

export function isNodeReadableStream(value: any): value is Readable {
  return (
    !!value &&
    (value instanceof Readable || (typeof value === 'object' && typeof value.pipe === 'function'))
  )
}

export async function readNodeStreamToBuffer(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = []
  for await (const chunk of stream) {
    if (!chunk) continue
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }
  return Buffer.concat(chunks)
}
