const { Pair, Comment, EmptyLine } = require('./ast')

const escapeNonPrintable = (str, latin1) => {
  const re =
    latin1 !== false ? /[^\t\n\f\r -~\xa1-\xff]/g : /[\0-\b\v\x0e-\x1f]/g
  return String(str).replace(re, ch => {
    const esc = ch.charCodeAt(0).toString(16)
    return '\\u' + ('0000' + esc).slice(-4)
  })
}

const escape = str =>
  String(str)
    .replace(/\\/g, '\\\\')
    .replace(/\f/g, '\\f')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')

const pairWithSeparator = (key, value, sep) =>
  escape(key).replace(/[ =:]/g, '\\$&') +
  sep +
  escape(value).replace(/^ /, '\\ ')

const commentWithPrefix = (str, prefix) =>
  str.replace(/^\s*([#!][ \t\f]*)?/g, prefix)

const getFold = ({ indent, latin1, lineWidth, newline }) => line => {
  if (!lineWidth || lineWidth < 0) return line
  line = escapeNonPrintable(line, latin1)
  let start = 0
  let split = undefined
  for (let i = 0, ch = line[0]; ch; ch = line[(i += 1)]) {
    let end = i - start >= lineWidth ? split || i : undefined
    if (!end) {
      switch (ch) {
        case '\r':
          if (line[i + 1] === '\n') i += 1
        // fallthrough
        case '\n':
          end = i + 1
          break
        case '\\':
          i += 1
          switch (line[i]) {
            case 'r':
              if (line[i + 1] === '\\' && line[i + 2] === 'n') i += 2
            // fallthrough
            case 'n':
              end = i + 1
              break
            case ' ':
            case 'f':
            case 't':
              split = i + 1
              break
          }
          break
        case '\f':
        case '\t':
        case ' ':
        case '.':
          split = i + 1
          break
      }
    }
    if (end) {
      let lineEnd = end
      let ch = line[lineEnd - 1]
      while (ch === '\n' || ch === '\r') {
        lineEnd -= 1
        ch = line[lineEnd - 1]
      }
      const next = line[end]
      const atWhitespace = next === '\t' || next === '\f' || next === ' '
      line =
        line.slice(0, lineEnd) +
        newline +
        indent +
        (atWhitespace ? '\\' : '') +
        line.slice(end)
      start = lineEnd + newline.length
      split = undefined
      i = start + indent.length - 1
    }
  }
  return line
}

const toLines = (obj, pathSep, defaultKey, prefix = '') => {
  return Object.keys(obj).reduce((lines, key) => {
    const value = obj[key]
    if (value && typeof value === 'object') {
      return lines.concat(
        toLines(value, pathSep, defaultKey, prefix + key + pathSep)
      )
    } else {
      const k =
        key === defaultKey ? prefix.slice(0, -pathSep.length) : prefix + key
      lines.push([k, value])
      return lines
    }
  }, [])
}

function stringify(
  input,
  {
    commentPrefix = '# ',
    defaultKey = '',
    indent = '    ',
    keySep = ' = ',
    latin1 = true,
    lineWidth = 80,
    newline = '\n',
    pathSep = '.'
  } = {}
) {
  if (!input) return ''
  if (!Array.isArray(input)) input = toLines(input, pathSep, defaultKey)
  const foldLine = getFold({
    indent,
    latin1,
    lineWidth,
    newline: '\\' + newline
  })
  const foldComment = getFold({
    indent: commentPrefix,
    latin1,
    lineWidth,
    newline
  })
  return input
    .map(line => {
      switch (true) {
        case !line:
        case line instanceof EmptyLine:
          return ''

        case Array.isArray(line):
          return foldLine(pairWithSeparator(line[0], line[1], keySep))
        case line instanceof Pair:
          return foldLine(pairWithSeparator(line.key, line.value, keySep))

        case line instanceof Comment:
          return foldComment(commentWithPrefix(line.comment, commentPrefix))
        default:
          return foldComment(commentWithPrefix(String(line), commentPrefix))
      }
    })
    .join(newline)
}

module.exports = { stringify }
