const fs = require('fs')
const path = require('path')
const { parse, stringify } = require('../index')

describe('@js.properties', () => {
  const root = path.resolve(__dirname, '@js.properties')
  const tests = fs.readdirSync(root).filter(name => /\.properties$/.test(name))

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

describe('node-properties-parser', () => {
  const root = path.resolve(__dirname, 'node-properties-parser')
  test('node-properties-parser', () => {
    const src = fs.readFileSync(path.resolve(root, 'test.properties'), 'utf8')
    const tgt = fs.readFileSync(path.resolve(root, 'test.json'), 'utf8')
    const exp = JSON.parse(tgt)
    const res = parse(src)
    expect(res).toMatchObject(exp)
    const src2 = stringify(res)
    const res2 = parse(src2)
    expect(res2).toMatchObject(exp)
  })
})
