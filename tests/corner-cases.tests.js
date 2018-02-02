const fs = require('fs')
const path = require('path')
const { parseLines, stringify } = require('../index')

const srcPath = path.resolve(__dirname, 'node-properties-parser', 'test.properties')
const src = fs.readFileSync(srcPath, 'utf8')

const exp = [
  '# You are reading the ".properties" entry.',
  '! The exclamation mark can also mark text as comments.',
  ['lala', '\u210A the foo foo lalala;'],
  ['website', 'http://en.wikipedia.org/'],
  ['language', 'English'],
  '# The backslash below tells the application to continue reading',
  '# the value onto the next line.',
  ['message', 'Welcome to Wikipedia!'],
  '# Add spaces to the key',
  ['key with spaces', 'This is the value that could be looked up with the key "key with spaces".'],
  '# Unicode',
  ['tab', '\u0009'],
  ['long-unicode', '\u00000009'],
  ['space separator', 'key val \n three'],
  ['another-test', ':: hihi'],
  ['null-prop', '']
]

test('read lines', () => {
  const lines = parseLines(src + '\n\n')
  expect(lines).toMatchObject([...exp, '', ''])
})

test('write lines', () => {
  const str = stringify(exp)
  expect(parseLines(str)).not.toMatchObject(exp)
  const fix = str.replace('# The exclamation mark', '! The exclamation mark')
  expect(parseLines(fix)).toMatchObject(exp)
})

test('\\\\ overdose', () => {
  const slash = '\\'.repeat(20)
  expect(() => stringify([[slash + slash]])).toThrow('Your input is \\\\silly\\\\.')
  expect(() => stringify([[slash, slash]])).not.toThrow()
})
