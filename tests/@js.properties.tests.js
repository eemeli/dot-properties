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
})
