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
  while (ch && ch !== '\r' && ch !== '\n' && ch !== '\t' && ch !== '\f' && ch !== ' ' && ch !== ':' && ch !== '=') {
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
  loop: while (ch === '\t' || ch === '\f' || ch === ' ' || ch === '=' || ch === ':' || ch === '\\') {
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
  }
  return offset
}

const unescape = (str) => str.replace(/\\(u[0-9a-fA-F]{4}|\r?\n[ \t\f]*|.)?/g, (match, code) => {
  switch (code && code[0]) {
    case 'f': return '\f'
    case 'n': return '\n'
    case 'r': return '\r'
    case 't': return '\t'
    case 'u':
      const c = parseInt(code.substr(1), 16)
      return isNaN(c) ? code : String.fromCharCode(c)
    case '\r':
    case '\n':
    case undefined:
      return ''
    default:
      return code
  }
})

/**
 * Splits the input string into an array of logical lines
 *
 * Key-value pairs are [key, value] arrays with string values. Escape sequences
 * in keys and values are parsed. Empty lines are included as empty strings, and
 * comments as strings that start with '#' or '! characters. Leading whitespace
 * is not included.
 *
 * @see https://docs.oracle.com/javase/9/docs/api/java/util/Properties.html#load(java.io.Reader)
 *
 * @param {string} src
 * @returns Array<string | string[]]>
 */
function parseLines (src) {
  const lines = []
  for (i = 0; i < src.length; ++i) {
    if (src[i] === '\n' && src[i - 1] === '\r') i += 1
    if (!src[i]) break
    const keyStart = endOfIndent(src, i)
    if (atLineEnd(src, keyStart)) {
      lines.push('')
      i = keyStart
      continue
    }
    if (atComment(src, keyStart)) {
      const commentEnd = endOfComment(src, keyStart)
      lines.push(src.slice(keyStart, commentEnd))
      i = commentEnd
      continue
    }
    const keyEnd = endOfKey(src, keyStart)
    const key = unescape(src.slice(keyStart, keyEnd))
    const valueStart = endOfSeparator(src, keyEnd)
    if (atLineEnd(src, valueStart)) {
      lines.push([key, ''])
      i = valueStart
      continue
    }
    const valueEnd = endOfValue(src, valueStart)
    const value = unescape(src.slice(valueStart, valueEnd))
    lines.push([key, value])
    i = valueEnd
  }
  return lines
}

/**
 * Parses an input string read from a .properties file into a JavaScript Object
 *
 * If the second `path` parameter is true, dots '.' in keys will result in a
 * multi-level object (use a string value to customise). If a parent level is
 * directly assigned a value while it also has a child with an assigned value,
 * the parent value will be assigned to its empty string '' key. Repeated keys
 * will take the last assigned value. Key order is not guaranteed, but is likely
 * to match the order of the input lines.
 *
 * @param {string} src
 * @param {boolean | string} [path=false]
 */
function parse (src, path) {
  const pathSep = typeof path === 'string' ? path : '.'
  return parseLines(src).reduce((res, line) => {
    if (Array.isArray(line)) {
      const [key, value] = line
      if (path) {
        const keyPath = key.split(pathSep)
        let parent = res
        while (keyPath.length >= 2) {
          const p = keyPath.shift()
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
      } else {
        res[key] = value
      }
    }
    return res
  }, {})
}

module.exports = { parse, parseLines }
