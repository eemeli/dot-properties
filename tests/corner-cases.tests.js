const fs = require('fs')
const path = require('path')
const { Pair, parse, parseLines, stringify } = require('../lib/index')

describe('lines', () => {
  const srcPath = path.resolve(
    __dirname,
    'node-properties-parser',
    'test.properties'
  )
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
    [
      'key with spaces',
      'This is the value that could be looked up with the key "key with spaces".'
    ],
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

  test('read lines with CRLF endings', () => {
    const src = `language = English\r\nmessage = Welcome to \\\r\n  Wikipedia!\r\n\r\n`
    const lines = parseLines(src)
    expect(lines).toMatchObject([
      ['language', 'English'],
      ['message', 'Welcome to Wikipedia!'],
      ''
    ])
  })

  test('write lines', () => {
    const str = stringify(exp)
    expect(parseLines(str)).not.toMatchObject(exp)
    const fix = str.replace('# The exclamation mark', '! The exclamation mark')
    expect(parseLines(fix)).toMatchObject(exp)
  })
})

describe('stringify', () => {
  test('empty input', () => {
    const res = stringify(null)
    expect(res).toBe('')
  })

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
    expect(stringify([['key', lorem]])).toBe(
      'key = ' + lorem.replace(/\r\n/g, '\\r\\n\\\n    ')
    )
  })

  test('lines with empty strings result in blank lines', () => {
    const emptyLine = ''
    expect(stringify([emptyLine])).toBe(emptyLine)
    const lines = [['key1', 'value1'], '', ['key2', 'value2']]
    expect(stringify(lines)).toBe('key1 = value1\n\nkey2 = value2')
  })

  test('empty comments', () => {
    const lines = [['key1', 'value1'], '#', '! ', ['key2', 'value2']]
    expect(stringify(lines)).toBe('key1 = value1\n# \n# \nkey2 = value2')
  })

  test('Negative linewidth', () => {
    const foo = 'foo '.repeat(200)
    expect(stringify([foo], { lineWidth: -1 })).toBe(`# ${foo}`)
  })

  test('Whitespace in comment at folding point', () => {
    const lines = ['comment\rcomment\ncomment\fcomment\t']
    expect(stringify(lines, { lineWidth: 10 })).toBe(
      '# comment\n# comment\n# comment\f\n# comment\t'
    )
  })
})

describe('options', () => {
  const obj = {
    '': 'root',
    a: { '': 'A.', a: 'A.A' },
    b: { '': 'B', b: 'B.B' }
  }

  test('read default values', () => {
    const src = `:root
a:A
a.:A.
a.a:A.A
b.b:B.B
b:B`
    expect(parse(src, true)).toMatchObject(obj)
  })

  test('write default values', () => {
    const src = `:root
a:A.
a.a:A.A
b:B
b.b:B.B`
    expect(stringify(obj, { keySep: ':' })).toBe(src)
  })

  test('custom path separator', () => {
    const src = `:root
a:A
a/:A.
a/a:A.A
b/b:B.B
b:B`
    expect(parse(src, '/')).toMatchObject(obj)
  })
})

describe('bad input', () => {
  test('malformed unicode escape', () => {
    const src = `foo: \\uabcx`
    expect(parse(src, true)).toMatchObject({ foo: 'uabcx' })
  })
})

describe('AST', () => {
  test('pair separator', () => {
    const src = 'key:\nkey2: value2'
    const ast = parseLines(src, true)
    expect(ast[0].separator(src)).toBe(':')
    expect(ast[1].separator(src)).toBe(': ')
  })

  test('add node', () => {
    const src = 'key:\nkey2: value2'
    const ast = parseLines(src, true)
    ast.push(new Pair('key3', 'value3'))
    expect(ast[2].separator(src)).toBeNull()

    expect(parse(ast)).toMatchObject({
      key: '',
      key2: 'value2',
      key3: 'value3'
    })
    expect(stringify(ast)).toBe('key = \nkey2 = value2\nkey3 = value3')
  })
})
