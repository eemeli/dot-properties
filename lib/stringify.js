const { Pair, Comment, EmptyLine } = require('./ast')

const escapeNonPrintable = (str, latin1) =>
  String(str).replace(
    latin1 !== false ? /[^\t\n\f\r -~\xa1-\xff]/g : /[\0-\b\v\x0e-\x1f]/g,
    ch => '\\u' + ch.charCodeAt(0).toString(16).padStart(4, '0')
  )

const escape = str =>
  String(str)
    .replace(/\\/g, '\\\\')
    .replace(/\f/g, '\\f')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')
const escapeKey = key => escape(key).replace(/[ =:]/g, '\\$&')
const escapeValue = value => escape(value).replace(/^ /, '\\ ')

const prefixComment = (str, prefix) =>
  str.replace(/^\s*([#!][ \t\f]*)?/g, prefix)

function fold({ indent, latin1, lineWidth, newline, foldChars }, key, value) {
  const printKey = escapeNonPrintable(key, latin1)
  const printValue = escapeNonPrintable(value, latin1)
  let line = printKey + printValue
  if (!lineWidth || lineWidth < 0 || line.length <= lineWidth) return line
  let start = 0
  let split = undefined
  let i = 0
  if (key && printKey.length < lineWidth) {
    line = printKey + newline + indent + printValue
    start = printKey.length + newline.length
    i = start + indent.length
  }
  for (let ch = line[i]; ch; ch = line[++i]) {
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
            case '=':
            case ':':
              if (foldChars.includes(line[i])) split = i + 1
              break
            case 'f':
              if (foldChars.includes('\f')) split = i + 1
              break
            case 't':
              if (foldChars.includes('\t')) split = i + 1
              break
          }
          break
        default:
          if (foldChars.includes(ch)) split = i + 1
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

const toLines = (obj, pathSep, defaultKey, prefix = '') =>
  Object.keys(obj).reduce((lines, key) => {
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
    pathSep = '.',
    foldChars = '\f\t .'
  } = {}
) {
  if (!input) return ''
  if (!Array.isArray(input)) input = toLines(input, pathSep, defaultKey)
  const lineOpt = {
    indent,
    latin1,
    lineWidth,
    newline: '\\' + newline,
    foldChars
  }
  const commentOpt = {
    indent: commentPrefix,
    latin1,
    lineWidth,
    newline,
    foldChars
  }
  return input
    .map(line => {
      switch (true) {
        case !line:
        case line instanceof EmptyLine:
          return ''

        case Array.isArray(line):
          return fold(
            lineOpt,
            escapeKey(line[0]) + keySep,
            escapeValue(line[1])
          )
        case line instanceof Pair:
          return fold(
            lineOpt,
            escapeKey(line.key) + keySep,
            escapeValue(line.value)
          )

        case line instanceof Comment:
          return fold(
            commentOpt,
            '',
            prefixComment(line.comment, commentPrefix)
          )
        default:
          return fold(
            commentOpt,
            '',
            prefixComment(String(line), commentPrefix)
          )
      }
    })
    .join(newline)
}

module.exports = { stringify }
