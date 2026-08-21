import { net } from 'electron'
import ofs from 'node:original-fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

export function createLocalFileDomainHandler() {
  return async (uri: string, req: Request) => {
    const queryIndex = uri.indexOf('?')
    const encodedFilePath = queryIndex === -1 ? uri : uri.slice(0, queryIndex)
    const filePath = decodeURIComponent(encodedFilePath)
    try {
      await ofs.promises.access(filePath, ofs.constants.R_OK)
      return net.fetch(pathToFileURL(path.normalize(filePath)).toString(), {
        method: req.method,
        headers: req.headers
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
