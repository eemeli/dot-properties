const { stringify } = require('../lib/index')

describe('Folding', () => {
  test('long value starts on new line', () => {
    const lines = [
      ['k0', '0 val0'],
      ['k1', '1 value1'],
      ['key', 'v0'],
      ['key1', 'value1'],
      ['key2', 'value2 continues']
    ]
    expect(stringify(lines, { indent: '  ', lineWidth: 8 })).toBe(
      `\
k0 = \\
  0 val0
k1 = \\
  1 \\
  value1
key = v0
key1 = \\
  value1
key2 = \\
  value2\\
  \\ \\
  contin\\
  ues`
    )
  })

  test('values after long keys do not start on new line', () => {
    const lines = [
      ['longish key', 'v0'],
      ['longkeyxx', '42'],
      ['somelongkey', 'withlongvalue']
    ]
    expect(stringify(lines, { indent: '  ', lineWidth: 8 })).toBe(
      `\
longish\\ \\
  key = \\
  v0
longkeyx\\
  x = 42
somelong\\
  key = \\
  withlo\\
  ngvalu\\
  e`
    )
  })

  describe('foldChars', () => {
    const lines = [
      ['key0', '12 345678'],
      ['key1', '12.345678'],
      ['key2', '12\t345678'],
      ['key3', '12\f345678'],
      ['key4', ' 12 345678'],
      ['key5', '12,345678']
    ]
    test('default', () => {
      expect(stringify(lines, { indent: '  ', lineWidth: 8 })).toBe(
        `\
key0 = \\
  12 \\
  345678
key1 = \\
  12.\\
  345678
key2 = \\
  12\\t\\
  345678
key3 = \\
  12\\f\\
  345678
key4 = \\
  \\ 12 \\
  345678
key5 = \\
  12,345\\
  678`
      )
    })

    test('empty', () => {
      expect(
        stringify(lines, { indent: '  ', lineWidth: 8, foldChars: '' })
      ).toBe(
        `\
key0 = \\
  12 345\\
  678
key1 = \\
  12.345\\
  678
key2 = \\
  12\\t34\\
  5678
key3 = \\
  12\\f34\\
  5678
key4 = \\
  \\ 12 3\\
  45678
key5 = \\
  12,345\\
  678`
      )
    })

    test('custom', () => {
      expect(
        stringify(lines, { indent: '  ', lineWidth: 8, foldChars: ',' })
      ).toBe(
        `\
key0 = \\
  12 345\\
  678
key1 = \\
  12.345\\
  678
key2 = \\
  12\\t34\\
  5678
key3 = \\
  12\\f34\\
  5678
key4 = \\
  \\ 12 3\\
  45678
key5 = \\
  12,\\
  345678`
      )
    })
  })
})
