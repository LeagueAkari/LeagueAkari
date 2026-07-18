export const REDACTED_SECRET = '<redacted>'

const SENSITIVE_KEY_PATTERN =
  /^(?:authorization|password|accessToken|authToken|riotClientAuthToken|remotingAuthToken|entitlementsToken|leagueSessionToken|token)$/i

const COMMAND_LINE_TOKEN_PATTERN =
  /(--(?:remoting-auth-token|riotclient-auth-token)(?:=|\s+))(?:(?:"[^"]*")|(?:'[^']*')|[^\s"']+)/gi
const AUTHORIZATION_PATTERN = /((?:authorization\s*[:=]\s*)?(?:basic|bearer)\s+)[^\s,"'}]+/gi
const LOOPBACK_CREDENTIAL_PATTERN =
  /((?:https?|wss?):\/\/[^:\s/@]+:)[^@\s/]+(@(?:127\.0\.0\.1|localhost)(?::\d+)?)/gi
const SERIALIZED_SECRET_PATTERN =
  /((?:"|')?(?:accessToken|authToken|riotClientAuthToken|remotingAuthToken|entitlementsToken|leagueSessionToken|token)(?:"|')?\s*[:=]\s*(?:"|')?)[^\s,"'}]+/gi

export function redactSecretsInString(value: string) {
  return value
    .replace(COMMAND_LINE_TOKEN_PATTERN, `$1${REDACTED_SECRET}`)
    .replace(AUTHORIZATION_PATTERN, `$1${REDACTED_SECRET}`)
    .replace(LOOPBACK_CREDENTIAL_PATTERN, `$1${REDACTED_SECRET}$2`)
    .replace(SERIALIZED_SECRET_PATTERN, `$1${REDACTED_SECRET}`)
}

export function createSecretRedactingJsonReplacer() {
  return (key: string, value: unknown) => {
    if (SENSITIVE_KEY_PATTERN.test(key)) {
      return REDACTED_SECRET
    }

    return typeof value === 'string' ? redactSecretsInString(value) : value
  }
}
