const fs = require('fs')
const path = require('path')
const { parse, stringify } = require('../lib/index')

function testCase({
  name,
  root,
  srcPath,
  tgtPath,
  options: { parsePath = false } = {}
}) {
  test(name, () => {
    const src = fs.readFileSync(path.resolve(root, srcPath), 'utf8')
    const tgt = fs.readFileSync(path.resolve(root, tgtPath), 'utf8')
    const exp = JSON.parse(tgt)
    const res = parse(src, parsePath)
    expect(res).toMatchObject(exp)
    const src2 = stringify(res)
    const res2 = parse(src2, parsePath)
    expect(res2).toMatchObject(exp)
  })
}

describe('@js.properties', () => {
  const root = path.resolve(__dirname, '@js.properties')
  const tests = fs.readdirSync(root).filter(name => /\.properties$/.test(name))
  tests.forEach(name => {
    testCase({
      name,
      root,
      srcPath: name,
      tgtPath: name + '.json'
    })
  })

  testCase({
    name: 'namespaced properties with path',
    root,
    srcPath: 'namespaced.properties',
    tgtPath: 'namespaced.properties.namespaced.json',
    options: { parsePath: true }
  })
})

describe('node-properties-parser', () => {
  testCase({
    name: 'test',
    root: path.resolve(__dirname, 'node-properties-parser'),
    srcPath: 'test.properties',
    tgtPath: 'test.json'
  })
})
