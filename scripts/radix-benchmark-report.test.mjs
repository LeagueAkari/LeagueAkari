import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, test } from 'vitest'

import {
  createRadixBenchmarkReport,
  createRadixBenchmarkReportPath
} from './radix-benchmark-report.mjs'

const repoRoot = process.cwd()

describe('radix benchmark report', () => {
  test('wraps Vitest bench output with runtime and hardware metadata', () => {
    const vitestReport = {
      files: [
        {
          filepath: 'C:/projects/LeagueAkari/src/shared/utils/radix-matcher.bench.ts',
          groups: [
            {
              fullName: 'RadixMatcher benchmark',
              benchmarks: [
                {
                  name: 'findOne static route',
                  hz: 1000,
                  mean: 0.001,
                  sampleCount: 500
                }
              ]
            }
          ]
        }
      ]
    }

    const report = createRadixBenchmarkReport({
      vitestReport,
      metadata: {
        generatedAt: '2026-06-27T00:00:00.000Z',
        benchmark: {
          name: 'benchmark:radix',
          source: 'src/shared/utils/radix-matcher.bench.ts'
        },
        runtime: {
          node: 'v26.0.0',
          vitest: '4.1.9'
        },
        os: {
          type: 'Windows_NT',
          release: '10.0.26100',
          arch: 'x64',
          platform: 'win32'
        },
        hardware: {
          cpuModel: 'Example CPU',
          logicalCores: 16,
          totalMemoryBytes: 34359738368,
          totalMemoryGb: 32
        },
        git: {
          branch: 'main',
          commit: 'abcdef1',
          dirty: true
        }
      }
    })

    expect(report).toEqual({
      schemaVersion: 1,
      metadata: {
        generatedAt: '2026-06-27T00:00:00.000Z',
        benchmark: {
          name: 'benchmark:radix',
          source: 'src/shared/utils/radix-matcher.bench.ts'
        },
        runtime: {
          node: 'v26.0.0',
          vitest: '4.1.9'
        },
        os: {
          type: 'Windows_NT',
          release: '10.0.26100',
          arch: 'x64',
          platform: 'win32'
        },
        hardware: {
          cpuModel: 'Example CPU',
          logicalCores: 16,
          totalMemoryBytes: 34359738368,
          totalMemoryGb: 32
        },
        git: {
          branch: 'main',
          commit: 'abcdef1',
          dirty: true
        }
      },
      results: vitestReport
    })
  })

  test('uses a timestamped report path for each benchmark run', () => {
    expect(
      createRadixBenchmarkReportPath({
        generatedAt: '2026-06-27T00:00:00.123Z'
      })
    ).toBe('bench-results/radix-matcher-benchmark-2026-06-27T00-00-00-123Z.json')
  })

  test('wires benchmark:radix to the report runner and excludes generated reports', () => {
    const packageJson = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'))
    const electronBuilderConfig = fs.readFileSync(
      path.join(repoRoot, 'electron-builder.yml'),
      'utf8'
    )
    const gitignore = fs.readFileSync(path.join(repoRoot, '.gitignore'), 'utf8')

    expect(packageJson.scripts['benchmark:radix']).toBe('node scripts/run-radix-benchmark.mjs')
    expect(electronBuilderConfig).toContain('!bench-results{,/**}')
    expect(gitignore).toMatch(/^bench-results\/$/m)
  })
})
