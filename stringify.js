const escapeNonAscii = (str) => String(str).replace(/[^\t\n\f\r -~]/g, (ch) => {
  const esc = ch.charCodeAt(0).toString(16)
  return '\\u' + ('0000' + esc).slice(-4)
})

const escapeValue = (str) => String(str)
  .replace(/\\/g, '\\\\')
  .replace(/\r/g, '\\r')
  .replace(/\n/g, '\\n')

const escapeKey = (str) => escapeValue(str).replace(/[ \t\f]/g, '\\$&')

const getFold = ({ ascii, indent, lineWidth, newline }) => (line) => {
  if (!lineWidth || lineWidth < 0) return line
  if (ascii) line = escapeNonAscii(line)
  let start = 0
  loop: while (line.length - start > lineWidth) {
    for (let i = 0; i <= lineWidth; ++i) {
      const ch = line[start + i]
      if (ch === '\r' || ch === '\n') {
        start += i + 1
        break loop
      }
    }
    let end = start + lineWidth
    let ch = line[end - 1]
    while (end > start && ch !== '\t' && ch !== '\f' && ch !== ' ' && ch !== '.') {
      end -= 1
      ch = line[end - 1]
    }
    if (end === start) {
      end = start + lineWidth
      while (line[end - 1] === '\\') end -= 1
      if (end <= start) throw new Error('Your input is \\\\silly\\\\.')
    }
    ch = line[end]
    const atWhitespace = (ch === '\t' || ch === '\f' || ch === ' ')
    line = line.slice(0, end) + '\\' + newline + indent + (atWhitespace ? '\\' : '') + line.slice(end)
    start = end + 1 + newline.length
  }
  return line
}

const toComment = (line, newline, prefix) => {
  if (!line) return ''
  line = String(line)
    .replace(/^\s*([#!][ \t\f]*)?/g, '')
    .replace(/\r?\n/g, newline + prefix)
  return line ? prefix + line : ''
}

const toLines = (obj, pathSep, defaultKey, prefix = '') => {
  return Object.keys(obj).reduce((lines, key) => {
    const value = obj[key]
    if (value && typeof value === 'object') {
      return lines.concat(toLines(value, pathSep, defaultKey, prefix + key + pathSep))
    } else {
      const k = key === defaultKey ? prefix.substr(0, -(pathSep.length)) : prefix + key
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
  const foldLine = getFold({ ascii, indent, lineWidth, newline })
  const foldComment = getFold({ ascii, indent: commentPrefix, lineWidth, newline })
  return input
    .map(line => Array.isArray(line) ? (
      foldLine(escapeKey(line[0]) + keySep + escapeValue(line[1]))
    ) : (
      foldComment(toComment(line, newline, commentPrefix))
    ))
    .join(newline)
}

module.exports = { stringify }
