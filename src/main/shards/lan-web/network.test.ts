import { describe, expect, it } from 'vitest'

import { buildAccessUrls, isValidLanPort, listLanIpv4Addresses } from './network'

describe('LAN Web network helpers', () => {
  it('accepts only non-privileged TCP ports', () => {
    expect(isValidLanPort(1024)).toBe(true)
    expect(isValidLanPort(65535)).toBe(true)
    expect(isValidLanPort(1023)).toBe(false)
    expect(isValidLanPort(65536)).toBe(false)
    expect(isValidLanPort(8082.5)).toBe(false)
  })

  it('returns unique LAN IPv4 addresses without loopback or link-local addresses', () => {
    expect(
      listLanIpv4Addresses({
        Ethernet: [
          {
            address: '192.168.1.9',
            netmask: '255.255.255.0',
            family: 'IPv4',
            mac: '',
            internal: false,
            cidr: '192.168.1.9/24'
          },
          {
            address: '169.254.2.1',
            netmask: '255.255.0.0',
            family: 'IPv4',
            mac: '',
            internal: false,
            cidr: '169.254.2.1/16'
          }
        ],
        WiFi: [
          {
            address: '192.168.1.9',
            netmask: '255.255.255.0',
            family: 'IPv4',
            mac: '',
            internal: false,
            cidr: '192.168.1.9/24'
          },
          {
            address: '10.0.0.8',
            netmask: '255.0.0.0',
            family: 'IPv4',
            mac: '',
            internal: false,
            cidr: '10.0.0.8/8'
          }
        ],
        Loopback: [
          {
            address: '127.0.0.1',
            netmask: '255.0.0.0',
            family: 'IPv4',
            mac: '',
            internal: true,
            cidr: '127.0.0.1/8'
          }
        ]
      })
    ).toEqual(['10.0.0.8', '192.168.1.9'])
  })

  it('builds direct URLs and falls back to loopback when no LAN address exists', () => {
    expect(buildAccessUrls([], 8082)).toEqual(['http://127.0.0.1:8082/'])
    expect(buildAccessUrls(['192.168.1.9'], 8082)).toEqual(['http://192.168.1.9:8082/'])
  })
})
