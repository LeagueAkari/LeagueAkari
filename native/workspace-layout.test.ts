import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, test } from 'vitest'

const repoRoot = process.cwd()

function readJson<T>(relativePath: string): T {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, relativePath), 'utf8')) as T
}

describe('native workspace layout', () => {
  test('uses a platform-architecture package directory', () => {
    const rootPackage = readJson<{
      dependencies: Record<string, string>
      optionalDependencies?: Record<string, string>
      scripts: Record<string, string>
      workspaces: string[]
    }>('package.json')
    const rootTsconfig = readJson<{ references: Array<{ path: string }> }>('tsconfig.json')
    const nodeTsconfig = readJson<{
      compilerOptions: { paths: Record<string, string[]> }
      include: string[]
    }>('tsconfig.node.json')

    expect(rootPackage.workspaces).toContain('native/win32-x64')
    expect(rootPackage.workspaces).not.toContain('native')
    expect(rootPackage.dependencies).not.toHaveProperty('league-akari-native-win32')
    expect(rootPackage.optionalDependencies).toMatchObject({
      'league-akari-native-win32': 'workspace:*'
    })
    expect(rootPackage.scripts['build:native']).toBeUndefined()
    expect(rootPackage.scripts['build:native:win']).toBe('node native/win32-x64/scripts/build.js')
    expect(rootPackage.scripts['build:native:win32-x64']).toBeUndefined()
    expect(rootPackage.scripts['build:win']).toBe(
      'npm run build:native:win && npm run build:win:skip-native'
    )
    expect(rootPackage.scripts['build:win:skip-native']).toBe(
      'npm run build && electron-builder --win --config'
    )
    expect(rootPackage.scripts.postinstall).toBe('node scripts/clear-electron-rebuild-metadata.cjs')
    expect(rootPackage.scripts.postinstall).not.toContain('-f')
    expect(rootPackage.scripts.postinstall).not.toContain('native/win32-x64/scripts/build.js')
    expect(rootTsconfig.references).toContainEqual({ path: './native/win32-x64/tsconfig.json' })
    expect(nodeTsconfig.compilerOptions.paths['league-akari-native-win32']).toEqual([
      './native/win32-x64/lib/index.ts'
    ])
    expect(nodeTsconfig.compilerOptions.paths['league-akari-native-win32/*']).toEqual([
      './native/win32-x64/lib/*'
    ])
    expect(nodeTsconfig.include).toContain('native/**/*.ts')
    expect(fs.existsSync(path.join(repoRoot, 'native/win32-x64/package.json'))).toBe(true)
    expect(fs.existsSync(path.join(repoRoot, 'native/win32-x64/binding.gyp'))).toBe(true)
    expect(fs.existsSync(path.join(repoRoot, 'native/win32-x64/gyp/binding.gyp'))).toBe(false)
  })

  test('keeps packaged app build commands aligned with electron-vite defaults', () => {
    const rootPackage = readJson<{
      scripts: Record<string, string>
    }>('package.json')
    const electronBuilderConfig = fs.readFileSync(
      path.join(repoRoot, 'electron-builder.yml'),
      'utf8'
    )

    expect(rootPackage.scripts['build:mac']).toBe(
      'npm run build && electron-builder --mac --config'
    )
    expect(rootPackage.scripts['build:mac:dir']).toBeUndefined()
    expect(rootPackage.scripts['build:mac:package']).toBeUndefined()
    expect(electronBuilderConfig).toContain('afterSign: ./scripts/macos/ensure-codesign.cjs')
  })

  test('defaults package entrypoints to the checked-in build artifact location', () => {
    const nativePackage = readJson<{
      cpu?: string[]
      files?: string[]
      main: string
      os?: string[]
      types: string
      exports: Record<string, { types: string; require: string; default: string }>
    }>('native/win32-x64/package.json')

    expect(nativePackage.os).toEqual(['win32'])
    expect(nativePackage.cpu).toEqual(['x64'])
    expect(nativePackage.main).toBe('dist/index.js')
    expect(nativePackage.types).toBe('dist/index.d.ts')
    expect(nativePackage.files).toEqual(['addons/*.node', 'dist/**/*'])
    expect(nativePackage.exports['.']).toMatchObject({
      types: './dist/index.d.ts',
      require: './dist/index.js',
      default: './dist/index.js'
    })
    expect(nativePackage.exports['./input']).toMatchObject({
      types: './dist/input/index.d.ts',
      require: './dist/input/index.js',
      default: './dist/input/index.js'
    })
    expect(nativePackage.exports['./tools']).toMatchObject({
      types: './dist/tools/index.d.ts',
      require: './dist/tools/index.js',
      default: './dist/tools/index.js'
    })
    expect(nativePackage).not.toHaveProperty('gypfile')
  })
})
