// GTIMG descriptions mix HTML with entity-escaped League UI markup. Only emit
// presentation tags that our tooltip supports; never forward upstream attributes.
const tags = new Set([
  'br',
  'b',
  'i',
  'p',
  'div',
  'span',
  'strong',
  'em',
  'ul',
  'li',
  'attention',
  'stats',
  'maintext',
  'truedamage',
  'physicaldamage',
  'magicdamage',
  'healing',
  'shield',
  'speed',
  'festeal',
  'buffedstat',
  'ornnbonus',
  'nerfedstat',
  'passive',
  'active',
  'status',
  'rules',
  'scalead',
  'scaleap',
  'scalemana',
  'scalehealth',
  'scalearmor',
  'scalemr'
])

export function normalizeGuideDescription(value: string): string {
  const decoded = value.replace(/&lt;/gi, '<').replace(/&gt;/gi, '>')
  return decoded
    .split(/(<[^>]*>)/g)
    .map((part) => {
      const tag = /^<\s*(\/?)\s*([a-z][\w-]*)\b[^>]*>$/i.exec(part)
      if (tag) {
        const name = tag[2].toLowerCase()
        return tags.has(name) ? `<${tag[1]}${name}>` : ''
      }

      return part.replace(/</g, '&lt;').replace(/>/g, '&gt;')
    })
    .join('')
}
