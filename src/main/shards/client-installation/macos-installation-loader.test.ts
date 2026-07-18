import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, test } from 'vitest'

import {
  MacInstallationLoader,
  buildMacBundleExecutablePath,
  getMacApplicationBundlePath,
  parseRiotClientInstallMetadata
} from './macos-installation-loader'

const temporaryDirectories: string[] = []

async function makeTemporaryDirectory() {
  const directory = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'league-akari-macos-'))
  temporaryDirectories.push(directory)
  return directory
}

async function createApplicationBundle(bundlePath: string, bundleExecutable: string) {
  const executablePath = buildMacBundleExecutablePath(bundlePath, bundleExecutable)
  if (!executablePath) {
    throw new Error('Invalid test bundle executable')
  }

  await fs.promises.mkdir(path.join(bundlePath, 'Contents'), { recursive: true })
  await fs.promises.mkdir(path.dirname(executablePath), { recursive: true })
  await fs.promises.writeFile(
    path.join(bundlePath, 'Contents', 'Info.plist'),
    `<?xml version="1.0" encoding="UTF-8"?>
<plist version="1.0"><dict>
  <key>CFBundleExecutable</key><string>${bundleExecutable}</string>
</dict></plist>`
  )
  await fs.promises.writeFile(executablePath, '#!/bin/sh\n')
  await fs.promises.chmod(executablePath, 0o755)

  return executablePath
}

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => fs.promises.rm(directory, { force: true, recursive: true }))
  )
})

describe('macOS client installation paths', () => {
  test('distinguishes outer and inner application bundles', () => {
    const executablePath = path.join(
      path.sep,
      'Applications',
      'League of Legends.app',
      'Contents',
      'LoL',
      'League of Legends.app',
      'Contents',
      'MacOS',
      'LeagueClientUx'
    )

    expect(getMacApplicationBundlePath(executablePath, 'outermost')).toBe(
      path.join(path.sep, 'Applications', 'League of Legends.app')
    )
    expect(getMacApplicationBundlePath(executablePath, 'innermost')).toBe(
      path.join(
        path.sep,
        'Applications',
        'League of Legends.app',
        'Contents',
        'LoL',
        'League of Legends.app'
      )
    )
  })

  test('resolves conventional and nested CFBundleExecutable values safely', () => {
    const bundlePath = path.join(path.sep, 'Applications', 'League of Legends.app')

    expect(buildMacBundleExecutablePath(bundlePath, 'LeagueClient')).toBe(
      path.join(bundlePath, 'Contents', 'MacOS', 'LeagueClient')
    )
    expect(
      buildMacBundleExecutablePath(bundlePath, 'LoL/LeagueClient.app/Contents/MacOS/LeagueClient')
    ).toBe(
      path.join(
        bundlePath,
        'Contents',
        'LoL',
        'LeagueClient.app',
        'Contents',
        'MacOS',
        'LeagueClient'
      )
    )
    expect(buildMacBundleExecutablePath(bundlePath, '../../outside')).toBeNull()
  })

  test('extracts custom League and Riot paths from Riot installation metadata', () => {
    expect(
      parseRiotClientInstallMetadata(
        JSON.stringify({
          associated_client: {
            '/Volumes/Games/League of Legends.app/Contents/LoL/LeagueClient.app':
              '/Volumes/Games/Riot Client.app/Contents/MacOS/RiotClientServices'
          },
          rc_default: '/Volumes/Games/Riot Client.app/Contents/MacOS/RiotClientServices',
          patchlines: {
            KeystoneFoundationLiveMac:
              '/Volumes/Games/Riot Client.app/Contents/MacOS/RiotClientServices'
          }
        })
      )
    ).toEqual({
      leagueClientCandidates: [
        path.normalize('/Volumes/Games/League of Legends.app/Contents/LoL/LeagueClient.app')
      ],
      riotClientCandidates: [
        path.normalize('/Volumes/Games/Riot Client.app/Contents/MacOS/RiotClientServices')
      ]
    })
  })

  test('prioritizes validated running clients and retains metadata fallbacks', async () => {
    const temporaryDirectory = await makeTemporaryDirectory()

    const runningLeagueBundle = path.join(temporaryDirectory, 'Running League.app')
    const runningLeagueExecutable = await createApplicationBundle(
      runningLeagueBundle,
      'LoL/LeagueClient.app/Contents/MacOS/LeagueClient'
    )
    await createApplicationBundle(
      path.join(runningLeagueBundle, 'Contents', 'LoL', 'LeagueClient.app'),
      'LeagueClient'
    )
    const runningUxBundle = path.join(
      runningLeagueBundle,
      'Contents',
      'LoL',
      'League of Legends.app'
    )
    const runningUxExecutable = await createApplicationBundle(runningUxBundle, 'LeagueClientUx')

    const runningRiotBundle = path.join(temporaryDirectory, 'Running Riot Client.app')
    const runningRiotExecutable = await createApplicationBundle(
      runningRiotBundle,
      'RiotClientServices'
    )

    const fallbackLeagueBundle = path.join(temporaryDirectory, 'Fallback LeagueClient.app')
    const fallbackLeagueExecutable = await createApplicationBundle(
      fallbackLeagueBundle,
      'LeagueClient'
    )
    const fallbackRiotBundle = path.join(temporaryDirectory, 'Fallback Riot Client.app')
    const fallbackRiotExecutable = await createApplicationBundle(
      fallbackRiotBundle,
      'RiotClientServices'
    )
    const metadataPath = path.join(temporaryDirectory, 'RiotClientInstalls.json')
    await fs.promises.writeFile(
      metadataPath,
      JSON.stringify({
        associated_client: {
          [fallbackLeagueBundle]: fallbackRiotExecutable
        },
        rc_default: fallbackRiotExecutable
      })
    )

    const loader = new MacInstallationLoader({
      listProcesses: async () => [
        {
          pid: 11,
          executablePath: runningRiotExecutable,
          name: 'RiotClientServices'
        },
        { pid: 12, executablePath: runningUxExecutable, name: 'LeagueClientUx' }
      ],
      getCommandLine: async () =>
        `${runningUxExecutable} ` +
        `--install-directory=${path.join(runningLeagueBundle, 'Contents', 'LoL')} ` +
        '--remoting-auth-token=synthetic-lcu-secret --riotclient-auth-token=synthetic-riot-secret',
      riotClientInstallMetadataPaths: [metadataPath],
      searchRoots: []
    })

    const installations = await loader.load()

    expect(installations.riotClientLaunchPath).toBe(runningRiotBundle)
    expect(installations.leagueClientExecutablePaths[0]).toBe(runningLeagueExecutable)
    expect(installations.leagueClientExecutablePaths).toContain(fallbackLeagueExecutable)
  })
})
