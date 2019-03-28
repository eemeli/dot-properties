const fs = require('fs')
const path = require('path')
const { parse, parseLines, stringify } = require('../index')

describe('lines', () => {
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
})

describe('stringify', () => {
  test('ascii', () => {
    const src = 'ipsum áé ĐѺ lore\0'
    const exp = 'ipsum áé \\u0110\\u047a lore\\u0000'
    const res0 = stringify([['', src]], { keySep: '' })
    const res1 = stringify([['', src]], { latin1: false, keySep: '' })
    expect(res0).toBe(exp)
    expect(res1).toBe(src.slice(0, -1) + '\\u0000')
  })

  test('\\\\ overdose', () => {
    const slash = '\\'.repeat(200)
    expect(() => stringify([[slash + slash]])).not.toThrow()
  })

  test('manual line breaks', () => {
    const lorem = `\r
Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed\r
do eiusmod tempor incididunt ut labore et dolore magna\r
aliqua. Ut enim ad minim veniam, quis nostrud exercitation\r
ullamco laboris nisi ut aliquip ex ea commodo consequat.\r
Duis aute irure dolor in reprehenderit in voluptate velit\r
esse cillum dolore eu fugiat nulla pariatur. Excepteur sint\r
occaecat cupidatat non proident, sunt in culpa qui officia\r
deserunt mollit anim id est laborum.`
    expect(stringify([lorem])).toBe(lorem.replace(/\r\n/gm, '\n# ').trim())
    expect(stringify([['key', lorem]])).toBe('key = ' + lorem.replace(/\r\n/g, '\\r\\n\\\n    '))
  })

  test('lines with empty strings result in blank lines', () => {
    const emptyLine = ''
    expect(stringify([emptyLine])).toBe(emptyLine)
    const lines = [['key1', 'value1'], '', ['key2', 'value2']];
    expect(stringify(lines)).toBe('key1 = value1\n\nkey2 = value2')
  })

  test('empty comments', () => {
    const lines = [['key1', 'value1'], '#', '! ', ['key2', 'value2']];
    expect(stringify(lines)).toBe('key1 = value1\n# \n# \nkey2 = value2')
  })
})

describe('default values', () => {
  const obj = {
    '': 'root',
    a: { '': 'A.', a: 'A.A' },
    b: { '': 'B', b: 'B.B' }
  }

  test('read default values', () => {
    const src =
`:root
a:A
a.:A.
a.a:A.A
b.b:B.B
b:B`
    expect(parse(src, true)).toMatchObject(obj)
  })

test('write default values', () => {
  const src =
`:root
a:A.
a.a:A.A
b:B
b.b:B.B`
    expect(stringify(obj, { keySep: ':' })).toBe(src)
  })
})
