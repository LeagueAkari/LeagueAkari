import MarkdownIt from 'markdown-it'

export const markdownIt = new MarkdownIt({
  html: true
})

const defaultRender =
  markdownIt.renderer.rules.link_open ||
  function (tokens, idx, options, _env, self) {
    return self.renderToken(tokens, idx, options)
  }

markdownIt.renderer.rules.link_open = function (tokens, idx, options, env, self) {
  const hrefIdx = tokens[idx].attrIndex('href')
  const href = hrefIdx >= 0 ? tokens[idx].attrs![hrefIdx][1] : ''

  if (!href.startsWith('akari://')) {
    tokens[idx].attrSet('target', '_blank')
  }

  return defaultRender(tokens, idx, options, env, self)
}
