import type { NetworkInterfaceInfo } from 'node:os'

export function isValidLanPort(port: number) {
  return Number.isInteger(port) && port >= 1024 && port <= 65535
}

export function listLanIpv4Addresses(interfaces: NodeJS.Dict<NetworkInterfaceInfo[]>): string[] {
  const addresses = new Set<string>()

  for (const entries of Object.values(interfaces)) {
    for (const entry of entries ?? []) {
      if (entry.family !== 'IPv4' || entry.internal || entry.address.startsWith('169.254.')) {
        continue
      }

      addresses.add(entry.address)
    }
  }

  return [...addresses].sort()
}

export function buildAccessUrls(addresses: string[], port: number) {
  const hosts = addresses.length ? addresses : ['127.0.0.1']
  return hosts.map((address) => `http://${address}:${port}/`)
}
