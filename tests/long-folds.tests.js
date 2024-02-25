const { stringify } = require('../lib/index')

describe('Folding for long lines', () => {
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
})
