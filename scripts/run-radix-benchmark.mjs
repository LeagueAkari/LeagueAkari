import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'

import {
  RADIX_BENCHMARK_REPORT_DIR,
  RADIX_BENCHMARK_SOURCE,
  writeRadixBenchmarkReport
} from './radix-benchmark-report.mjs'

const cwd = process.cwd()
const require = createRequire(import.meta.url)
const reportDir = path.resolve(cwd, RADIX_BENCHMARK_REPORT_DIR)
const rawVitestReportPath = path.join(
  reportDir,
  `.radix-matcher-benchmark.${process.pid}.${Date.now()}.vitest.json`
)

fs.mkdirSync(reportDir, { recursive: true })

const vitestPackagePath = require.resolve('vitest/package.json')
const vitestCliPath = path.join(path.dirname(vitestPackagePath), 'vitest.mjs')
const vitestResult = spawnSync(
  process.execPath,
  [vitestCliPath, 'bench', RADIX_BENCHMARK_SOURCE, '--outputJson', rawVitestReportPath],
  {
    cwd,
    stdio: 'inherit'
  }
)

if (vitestResult.error) {
  throw vitestResult.error
}

if (vitestResult.status !== 0) {
  process.exit(vitestResult.status ?? 1)
}

const writtenPath = writeRadixBenchmarkReport({
  cwd,
  vitestReportPath: rawVitestReportPath
})

fs.rmSync(rawVitestReportPath, { force: true })

console.log(`Radix benchmark report written to ${writtenPath}`)
