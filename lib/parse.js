const { Pair, Comment, EmptyLine } = require('./ast')

const atComment = (src, offset) => {
  const ch = src[offset]
  return ch === '#' || ch === '!'
}

const atLineEnd = (src, offset) => {
  const ch = src[offset]
  return !ch || ch === '\r' || ch === '\n'
}

const endOfIndent = (src, offset) => {
  let ch = src[offset]
  while (ch === '\t' || ch === '\f' || ch === ' ') {
    offset += 1
    ch = src[offset]
  }
  return offset
}

const endOfComment = (src, offset) => {
  let ch = src[offset]
  while (ch && ch !== '\r' && ch !== '\n') {
    offset += 1
    ch = src[offset]
  }
  return offset
}

const endOfKey = (src, offset) => {
  let ch = src[offset]
  while (
    ch &&
    ch !== '\r' &&
    ch !== '\n' &&
    ch !== '\t' &&
    ch !== '\f' &&
    ch !== ' ' &&
    ch !== ':' &&
    ch !== '='
  ) {
    if (ch === '\\') {
      if (src[offset + 1] === '\n') {
        offset = endOfIndent(src, offset + 2)
      } else {
        offset += 2
      }
    } else {
      offset += 1
    }
    ch = src[offset]
  }
  return offset
}

const endOfSeparator = (src, offset) => {
  let ch = src[offset]
  let hasEqSign = false
  loop: while (
    ch === '\t' ||
    ch === '\f' ||
    ch === ' ' ||
    ch === '=' ||
    ch === ':' ||
    ch === '\\'
  ) {
    switch (ch) {
      case '\\':
        if (src[offset + 1] !== '\n') break loop
        offset = endOfIndent(src, offset + 2)
        break
      case '=':
      case ':':
        if (hasEqSign) break loop
        hasEqSign = true
      // fallthrough
      default:
        offset += 1
    }
    ch = src[offset]
  }
  return offset
}

const endOfValue = (src, offset) => {
  let ch = src[offset]
  while (ch && ch !== '\r' && ch !== '\n') {
    offset += ch === '\\' ? 2 : 1
    ch = src[offset]
    if (ch === '\n' && src[offset - 1] === '\r') {
      // escaped CRLF line terminator
      offset += 1
      ch = src[offset]
    }
  }
  return offset
}

const unescape = str =>
  str.replace(/\\(u[0-9a-fA-F]{4}|\r?\n[ \t\f]*|.)?/g, (match, code) => {
    switch (code && code[0]) {
      case 'f':
        return '\f'
      case 'n':
        return '\n'
      case 'r':
        return '\r'
      case 't':
        return '\t'
      case 'u': {
        const c = parseInt(code.substr(1), 16)
        return isNaN(c) ? code : String.fromCharCode(c)
      }
      case '\r':
      case '\n':
      case undefined:
        return ''
      default:
        return code
    }
  })

function parseLines(src, ast) {
  const lines = []
  for (let i = 0; i < src.length; ++i) {
    if (src[i] === '\n' && src[i - 1] === '\r') i += 1
    if (!src[i]) break
    const keyStart = endOfIndent(src, i)
    if (atLineEnd(src, keyStart)) {
      lines.push(ast ? new EmptyLine([i, keyStart]) : '')
      i = keyStart
      continue
    }
    if (atComment(src, keyStart)) {
      const commentEnd = endOfComment(src, keyStart)
      const comment = src.slice(keyStart, commentEnd)
      lines.push(ast ? new Comment(comment, [keyStart, commentEnd]) : comment)
      i = commentEnd
      continue
    }
    const keyEnd = endOfKey(src, keyStart)
    const key = unescape(src.slice(keyStart, keyEnd))
    const valueStart = endOfSeparator(src, keyEnd)
    if (atLineEnd(src, valueStart)) {
      lines.push(
        ast
          ? new Pair(key, '', [keyStart, keyEnd, valueStart, valueStart])
          : [key, '']
      )
      i = valueStart
      continue
    }
    const valueEnd = endOfValue(src, valueStart)
    const value = unescape(src.slice(valueStart, valueEnd))
    lines.push(
      ast
        ? new Pair(key, value, [keyStart, keyEnd, valueStart, valueEnd])
        : [key, value]
    )
    i = valueEnd
  }
  return lines
}

function addPair(res, key, value, pathSep) {
  if (!pathSep) {
    res[key] = value
    return
  }

  const keyPath = key.split(pathSep)
  let parent = res
  while (keyPath.length >= 2) {
    const p = keyPath.shift()
    if (p === '__proto__') return
    if (!parent[p]) {
      parent[p] = {}
    } else if (typeof parent[p] !== 'object') {
      parent[p] = { '': parent[p] }
    }
    parent = parent[p]
  }
  const leaf = keyPath[0]
  if (typeof parent[leaf] === 'object') {
    parent[leaf][''] = value
  } else {
    parent[leaf] = value
  }
}

function parse(src, path) {
  const pathSep = path ? (typeof path === 'string' ? path : '.') : null
  const lines = Array.isArray(src) ? src : parseLines(src, false)
  const res = {}
  for (const line of lines) {
    if (line instanceof Pair) addPair(res, line.key, line.value, pathSep)
    else if (Array.isArray(line)) addPair(res, line[0], line[1], pathSep)
  }
  return res
}

module.exports = { parse, parseLines }
