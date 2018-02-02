const fs = require('fs')
const path = require('path')
const { parse, parseLine, stringify } = require('../index')

const root = path.resolve(__dirname, '@js.properties')
const tests = fs.readdirSync(root).filter(name => /\.properties$/.test(name))

describe('@js.properties', () => {
  tests.forEach(name => {
    test(name, () => {
      const src = fs.readFileSync(path.resolve(root, name), 'utf8')
      const tgt = fs.readFileSync(path.resolve(root, name + '.json'), 'utf8')
      const exp = JSON.parse(tgt)
      const res = parse(src)
      expect(res).toMatchObject(exp)
      const src2 = stringify(res)
      const res2 = parse(src2)
      expect(res2).toMatchObject(exp)
    })
  })
  test('namespaced properties with path', () => {
    const src = fs.readFileSync(path.resolve(root, 'namespaced.properties'), 'utf8')
    const tgt = fs.readFileSync(path.resolve(root, 'namespaced.properties.namespaced.json'), 'utf8')
    const exp = JSON.parse(tgt)
    const res = parse(src, true)
    expect(res).toMatchObject(exp)
    const src2 = stringify(res)
    const res2 = parse(src2, true)
    expect(res2).toMatchObject(exp)
  })
})

// This test has been extracted from the node-properties-parser project by Xavi Ramirez, at:
// https://github.com/xavi-/node-properties-parser/tree/fb1b7038380fa295ff80ed0d1a1fad3ad1788738/test
// It has been made available under the MIT license
describe('node-properties-parser', () => {
  test('node-properties-parser', () => {
    const src =
`# You are reading the ".properties" entry.
! The exclamation mark can also mark text as comments.
lala=\\u210A the foo foo \\
                    lalala;
website = http://en.wikipedia.org/
language = English
# The backslash below tells the application to continue reading
# the value onto the next line.
message = Welcome to \\
          Wikipedia!
# Add spaces to the key
key\\ with\\ spaces = This is the value that could be looked up with the key "key with spaces".
# Unicode
tab : \\u0009
long-unicode : \\u00000009
space\\ separator     key val \\n three
another-test ::: hihi
   null-prop`
    const exp = {
      lala: 'ℊ the foo foo lalala;',
      website: 'http://en.wikipedia.org/',
      language: 'English',
      message: 'Welcome to Wikipedia!',
      'key with spaces': 'This is the value that could be looked up with the key "key with spaces".',
      tab: '\t',
      'long-unicode': '\u00000009', // sic
      'space separator': 'key val \n three',
      'another-test': ':: hihi',
      'null-prop': ''
    }
    const res = parse(src)
    expect(res).toMatchObject(exp)
    const src2 = stringify(res)
    const res2 = parse(src2)
    expect(res2).toMatchObject(exp)
  })
})
