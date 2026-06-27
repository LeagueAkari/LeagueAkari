import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import { createRequire } from 'node:module'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const RADIX_BENCHMARK_SOURCE = 'src/shared/utils/radix-matcher.bench.ts'
export const RADIX_BENCHMARK_REPORT_DIR = 'bench-results'
export const RADIX_BENCHMARK_REPORT_FILE_PREFIX = 'radix-matcher-benchmark'

const require = createRequire(import.meta.url)

export function createRadixBenchmarkReport({ vitestReport, metadata }) {
  return {
    schemaVersion: 1,
    metadata,
    results: vitestReport
  }
}

export function createRadixBenchmarkReportPath({ generatedAt = new Date().toISOString() } = {}) {
  const timestamp = (generatedAt instanceof Date ? generatedAt.toISOString() : generatedAt).replace(
    /[:.]/g,
    '-'
  )

  return `${RADIX_BENCHMARK_REPORT_DIR}/${RADIX_BENCHMARK_REPORT_FILE_PREFIX}-${timestamp}.json`
}

export function collectRadixBenchmarkMetadata({ cwd = process.cwd(), generatedAt } = {}) {
  const cpus = os.cpus()
  const totalMemoryBytes = os.totalmem()

  return {
    generatedAt: generatedAt ?? new Date().toISOString(),
    benchmark: {
      name: 'benchmark:radix',
      source: RADIX_BENCHMARK_SOURCE
    },
    runtime: {
      node: process.version,
      vitest: resolveVitestVersion(cwd)
    },
    os: {
      type: os.type(),
      release: os.release(),
      arch: os.arch(),
      platform: os.platform()
    },
    hardware: {
      cpuModel: cpus[0]?.model.trim() || null,
      logicalCores: cpus.length,
      totalMemoryBytes,
      totalMemoryGb: Number((totalMemoryBytes / 1024 ** 3).toFixed(2))
    },
    git: collectGitInfo(cwd)
  }
}

export function writeRadixBenchmarkReport({
  vitestReportPath,
  reportPath,
  generatedAt,
  cwd = process.cwd()
}) {
  const reportGeneratedAt = generatedAt ?? new Date().toISOString()
  const resolvedVitestReportPath = path.resolve(cwd, vitestReportPath)
  const resolvedReportPath = resolveUniqueReportPath({
    cwd,
    reportPath: reportPath ?? createRadixBenchmarkReportPath({ generatedAt: reportGeneratedAt })
  })
  const vitestReport = JSON.parse(fs.readFileSync(resolvedVitestReportPath, 'utf8'))
  const report = createRadixBenchmarkReport({
    vitestReport,
    metadata: collectRadixBenchmarkMetadata({ cwd, generatedAt: reportGeneratedAt })
  })

  fs.mkdirSync(path.dirname(resolvedReportPath), { recursive: true })
  fs.writeFileSync(resolvedReportPath, `${JSON.stringify(report, null, 2)}\n`)

  return resolvedReportPath
}

function resolveUniqueReportPath({ cwd, reportPath }) {
  const resolvedReportPath = path.resolve(cwd, reportPath)

  if (!fs.existsSync(resolvedReportPath)) {
    return resolvedReportPath
  }

  const parsedPath = path.parse(resolvedReportPath)

  for (let index = 2; ; index += 1) {
    const candidate = path.join(parsedPath.dir, `${parsedPath.name}-${index}${parsedPath.ext}`)

    if (!fs.existsSync(candidate)) {
      return candidate
    }
  }
}

function resolveVitestVersion(cwd) {
  try {
    return require('vitest/package.json').version
  } catch {
    try {
      const packageJson = JSON.parse(fs.readFileSync(path.join(cwd, 'package.json'), 'utf8'))
      return packageJson.devDependencies?.vitest ?? null
    } catch {
      return null
    }
  }
}

function collectGitInfo(cwd) {
  try {
    return {
      branch: runGit(cwd, ['branch', '--show-current']) || null,
      commit: runGit(cwd, ['rev-parse', '--short', 'HEAD']) || null,
      dirty: runGit(cwd, ['status', '--porcelain']).length > 0
    }
  } catch {
    return {
      branch: null,
      commit: null,
      dirty: null
    }
  }
}

function runGit(cwd, args) {
  return execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore']
  }).trim()
}

if (isCli()) {
  const [, , vitestReportPath, reportPath] = process.argv

  if (!vitestReportPath) {
    console.error(
      'Usage: node scripts/radix-benchmark-report.mjs <vitest-report-json> [report-json]'
    )
    process.exitCode = 1
  } else {
    const writtenPath = writeRadixBenchmarkReport({ vitestReportPath, reportPath })
    console.log(`Radix benchmark report written to ${writtenPath}`)
  }
}

function isCli() {
  return process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
}
