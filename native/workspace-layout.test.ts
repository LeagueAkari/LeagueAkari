import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

function readJson<T>(relativePath: string): T {
  return JSON.parse(fs.readFileSync(path.resolve(relativePath), 'utf8')) as T
}

describe('native workspace runtime contract', () => {
  it('keeps the Windows addon wrapper resolvable from checked-in package artifacts', () => {
    const rootPackage = readJson<{
      optionalDependencies?: Record<string, string>
      workspaces: string[]
    }>('package.json')
    const nativePackage = readJson<{
      files: string[]
      main: string
      types: string
      exports: Record<string, { require: string; types: string }>
    }>('native/win32-x64/package.json')

    expect(rootPackage.workspaces).toContain('native/win32-x64')
    expect(rootPackage.optionalDependencies).toMatchObject({
      'league-akari-native-win32': 'workspace:*'
    })
    expect(nativePackage).toMatchObject({
      main: 'dist/index.js',
      types: 'dist/index.d.ts',
      files: ['addons/*.node', 'dist/**/*']
    })
    expect(nativePackage.exports['.']).toMatchObject({
      require: './dist/index.js',
      types: './dist/index.d.ts'
    })
    expect(fs.existsSync(path.resolve('native/win32-x64/dist/index.js'))).toBe(true)
    expect(fs.existsSync(path.resolve('native/win32-x64/addons/akari-input-win64.node'))).toBe(true)
    expect(fs.existsSync(path.resolve('native/win32-x64/addons/akari-tools-win64.node'))).toBe(true)
  })
})
