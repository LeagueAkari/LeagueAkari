// uuid-xor-util.ts

/**
 * 固定掩码（16 字节）
 */
const MASK_BYTES: readonly number[] = [
  129, 112, 118, 169, 244, 81, 80, 155, 149, 152, 104, 19, 206, 145, 23, 231
] as const

export type UuidString = string

/**
 * 判断字符串是否为标准 UUID 格式
 */
export function isValidUuidFormat(uuid: string): boolean {
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(uuid)
}

/**
 * 使用固定掩码对 UUID 做 XOR 加密（同一函数再次调用可用于解密）
 * 无效 UUID 返回空字符串 ""。
 */
export function encryptUuid(uuid: UuidString): UuidString {
  if (!isValidUuidFormat(uuid)) return ''

  const hexStr = uuid.replace(/-/g, '').toLowerCase()
  if (hexStr.length !== 32) return ''

  const originalBytes = hexToBytes(hexStr)
  if (originalBytes.length !== 16) return ''

  const resultBytes = new Uint8Array(16)
  for (let i = 0; i < 16; i++) {
    resultBytes[i] = originalBytes[i] ^ MASK_BYTES[i]
  }

  return bytesToUuid(resultBytes)
}

/**
 * 解密：再次 XOR 即可（与加密同一函数）
 * 无效 UUID 返回空字符串 ""。
 */
export function decryptUuid(encryptedUuid: UuidString): UuidString {
  return encryptUuid(encryptedUuid)
}

/**
 * 十六进制字符串 -> 字节数组
 * 传入应为偶数长度的 [0-9a-f] 字符串（不含 0x 前缀）
 */
export function hexToBytes(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) {
    throw new Error('hexToBytes: hex string length must be even.')
  }

  const len = hex.length
  const bytes = new Uint8Array(len / 2)

  for (let i = 0; i < len; i += 2) {
    const byteHex = hex.slice(i, i + 2)
    bytes[i / 2] = hexToInt(byteHex)
  }

  return bytes
}

/**
 * 字节数组 -> UUID 字符串
 * 要求 bytes.length === 16
 */
export function bytesToUuid(bytes: ArrayLike<number>): UuidString {
  if (bytes.length !== 16) {
    throw new Error('bytesToUuid: bytes length must be 16.')
  }

  let hexStr = ''
  for (let i = 0; i < bytes.length; i++) {
    hexStr += byteToHex(bytes[i])
  }

  // 格式化为 8-4-4-4-12
  return (
    hexStr.slice(0, 8) +
    '-' +
    hexStr.slice(8, 12) +
    '-' +
    hexStr.slice(12, 16) +
    '-' +
    hexStr.slice(16, 20) +
    '-' +
    hexStr.slice(20)
  )
}

/**
 * 单字节 -> 2 位十六进制字符串（小写）
 */
export function byteToHex(byteValue: number): string {
  const v = byteValue & 0xff
  const high = (v >> 4) & 0x0f
  const low = v & 0x0f

  return nibbleToHexChar(high) + nibbleToHexChar(low)
}

/**
 * 4 位（0~15） -> 1 个十六进制字符
 */
export function nibbleToHexChar(n: number): string {
  const hexChars = '0123456789abcdef'
  return hexChars[n & 0x0f]
}

/**
 * 十六进制字符串 -> 十进制整数
 * 无效字符会抛出异常
 */
export function hexToInt(hexText: string): number {
  let result = 0

  for (let i = 0; i < hexText.length; i++) {
    const ch = hexText[i]
    let value: number

    if (ch >= '0' && ch <= '9') {
      value = ch.charCodeAt(0) - '0'.charCodeAt(0)
    } else if (ch >= 'a' && ch <= 'f') {
      value = ch.charCodeAt(0) - 'a'.charCodeAt(0) + 10
    } else if (ch >= 'A' && ch <= 'F') {
      value = ch.charCodeAt(0) - 'A'.charCodeAt(0) + 10
    } else {
      throw new Error(`hexToInt: invalid hex char "${ch}".`)
    }

    result = result * 16 + value
  }

  return result
}
