import { z } from 'zod'

const AkariApiBootstrapSchema = z.object({
  schemaVersion: z.literal(1),
  generation: z.number(),
  baseUrls: z.object({
    api: z.string(),
    static: z.string()
  })
})

export function parseAkariApiBootstrapDocument(value: unknown) {
  return AkariApiBootstrapSchema.parse(value)
}

export function resolveAkariStaticUrl(baseUrl: string, path: string) {
  return new URL(path, `${baseUrl}/`).toString()
}
