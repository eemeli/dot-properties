const fs = require('fs')
const { parse, parseLines, stringify } = require('..')

const src = fs.readFileSync('./example.properties', 'utf8')
const obj = parse(src)
console.log('PATH:', obj.path, '\n')
//  PATH: c:\wiki\templates

const str = stringify(obj, { lineWidth: 60 })
console.log(`PROPERTIES:\n${str}\n`)
/*  PROPERTIES:
 *  c:\wiki\templates
 *  website = https://en.wikipedia.org/
 *  language = English
 *  message = Welcome to Wikipedia!
 *  key\ with\ spaces = This is the value that could be looked \
 *      up with the key "key with spaces".
 *  tab = \t
 *  path = c:\\wiki\\templates
 */

const lines = parseLines(src)
console.log('LINE:', lines[9], '\n')
//  LINE: [ 'message', 'Welcome to Wikipedia!' ]

const str2 = stringify(lines.slice(7, 10))
console.log(`SLICE:\n${str2}\n`)
/*  SLICE:
 *  # The backslash below tells the application to continue reading
 *  # the value onto the next line.
 *  message = Welcome to Wikipedia!
 */
