const escapeNonPrintable = (str, ascii) => {
  const re = ascii ? /[^\t\n\f\r -~]/g : /[\0-\b\v\x0e-\x1f]/g
  return String(str).replace(re, (ch) => {
    const esc = ch.charCodeAt(0).toString(16)
    return '\\u' + ('0000' + esc).slice(-4)
  })
}

const escape = (str) => String(str)
  .replace(/\\/g, '\\\\')
  .replace(/\f/g, '\\f')
  .replace(/\n/g, '\\n')
  .replace(/\r/g, '\\r')
  .replace(/\t/g, '\\t')

const escapeKey = (str) => escape(str).replace(/[ =:]/g, '\\$&')

const escapeValue = (str) => escape(str).replace(/^ /, '\\ ')

const getFold = ({ ascii, indent, lineWidth, newline }) => (line) => {
  if (!lineWidth || lineWidth < 0) return line
  line = escapeNonPrintable(line, ascii)
  let start = 0
  let split = undefined
  for (let i = 0, ch = line[0]; ch; ch = line[i += 1]) {
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
      const atWhitespace = (next === '\t' || next === '\f' || next === ' ')
      line = line.slice(0, lineEnd) + newline + indent + (atWhitespace ? '\\' : '') + line.slice(end)
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
      return lines.concat(toLines(value, pathSep, defaultKey, prefix + key + pathSep))
    } else {
      const k = key === defaultKey ? prefix.slice(0, -(pathSep.length)) : prefix + key
      lines.push([k, value])
      return lines
    }
  }, [])
}

/**
 * Stringifies a hierarchical object or an array of lines to .properties format
 *
 * If the input is a hierarchical object, keys will consist of the path parts
 * joined by '.' characters. With array input, string values represent blank or
 * comment lines and string arrays are [key, value] pairs. The characters \, \n
 * and \r will be appropriately escaped. If the ascii option is true, all
 * non-ASCII-printable characters will also be \u escaped.
 *
 * Output styling is controlled by the second options parameter; by default a
 * spaced '=' separates the key from the value, '\n' is the newline separator,
 * lines are folded at 80 characters, with subsequent lines indented by four
 * spaces, and comment lines are prefixed with a '#'. '' as a key value is
 * considered the default, and set as the value of a key corresponding to its
 * parent object's path.
 *
 * @param {Object | Array<string | string[]>} input
 * @param {Object} [options={}]
 * @param {boolean} [options.ascii=false]
 * @param {string} [options.commentPrefix='# ']
 * @param {string} [options.defaultKey='']
 * @param {string} [options.indent='    ']
 * @param {string} [options.keySep=' = ']
 * @param {number} [options.lineWidth=80]
 * @param {string} [options.newline='\n']
 * @param {string} [options.pathSep='.']
 */
function stringify (input, {
  ascii = false,
  commentPrefix = '# ',
  defaultKey = '',
  indent = '    ',
  keySep = ' = ',
  lineWidth = 80,
  newline = '\n',
  pathSep = '.'
} = {}) {
  if (!input) return ''
  if (!Array.isArray(input)) input = toLines(input, pathSep, defaultKey)
  const foldLine = getFold({ ascii, indent, lineWidth, newline: '\\' + newline })
  const foldComment = getFold({ ascii, indent: commentPrefix, lineWidth, newline })
  return input
    .map(line => Array.isArray(line) ? (
      foldLine(escapeKey(line[0]) + keySep + escapeValue(line[1]))
    ) : (
      foldComment(String(line || '').replace(/^\s*([#!][ \t\f]*)?/g, commentPrefix))
    ))
    .join(newline)
}

module.exports = { stringify }
