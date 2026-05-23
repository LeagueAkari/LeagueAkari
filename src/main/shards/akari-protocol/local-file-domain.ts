import ofs from 'node:original-fs'
import path from 'node:path'

export function createLocalFileDomainHandler() {
  const mime = require('mime-types')

  return async (uri: string, _req: Request) => {
    const filePath = decodeURIComponent(uri)
    try {
      await ofs.promises.access(filePath, ofs.constants.R_OK)
      const stream = ofs.createReadStream(path.normalize(filePath))
      const contentType = mime.lookup(filePath) || 'application/octet-stream'
      return new Response(stream, {
        status: 200,
        headers: { 'Content-Type': contentType }
      })
    } catch (error: any) {
      switch (error.code) {
        case 'ENOENT':
          return new Response(
            JSON.stringify({
              error: error.message,
              filepath: filePath
            }),
            {
              statusText: 'Not Found',
              headers: { 'Content-Type': 'application/json' },
              status: 404
            }
          )
        case 'EACCES':
          return new Response(
            JSON.stringify({
              error: error.message,
              filepath: filePath
            }),
            {
              statusText: 'Forbidden',
              headers: { 'Content-Type': 'application/json' },
              status: 403
            }
          )
        default:
          return new Response(
            JSON.stringify({
              error: error.message,
              filepath: filePath
            }),
            {
              statusText: 'Internal Server Error',
              headers: { 'Content-Type': 'application/json' },
              status: 500
            }
          )
      }
    }
  }
}
