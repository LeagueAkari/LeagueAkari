import type { RemoteConfigMainContext } from './context'

export class RemoteConfigDiagnostics {
  constructor(private readonly _context: RemoteConfigMainContext) {}

  /**
   * 三次平均值。
   */
  async testRepoLatency() {
    const { repository } = this._context
    const githubLatencies: number[] = []
    const giteeLatencies: number[] = []

    for (let i = 0; i < 3; i++) {
      const [githubLatency, giteeLatency] = await Promise.all([
        repository.testGitHubLatency().catch(() => -1),
        repository.testGiteeLatency().catch(() => -1)
      ])

      if (githubLatency !== -1) {
        githubLatencies.push(githubLatency)
      }

      if (giteeLatency !== -1) {
        giteeLatencies.push(giteeLatency)
      }
    }

    return {
      githubLatency: githubLatencies.reduce((a, b) => a + b, 0) / githubLatencies.length,
      giteeLatency: giteeLatencies.reduce((a, b) => a + b, 0) / giteeLatencies.length
    }
  }
}
