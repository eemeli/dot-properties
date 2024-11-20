export class Node {
  type: Node.Type
  range?: [number, number] | [number, number, number, number]
  constructor(
    type: Node.Type,
    range?: [number, number] | [number, number, number, number]
  )
}
declare namespace Node {
  type Type = 'COMMENT' | 'EMPTY_LINE' | 'PAIR'
}

export class Comment extends Node {
  type: 'COMMENT'
  comment: string
  range?: [number, number]
  constructor(comment: string, range?: [number, number])
}

export class EmptyLine extends Node {
  type: 'EMPTY_LINE'
  range?: [number, number]
}

export class Pair extends Node {
  type: 'PAIR'
  key: string
  value: string
  range?: [number, number, number, number]
  constructor(
    key: string,
    value: string,
    range?: [number, number, number, number]
  )
  separator(src: string): string | null
}

type Line = string | string[]
interface Tree {
  [key: string]: string | Tree
}

/**
 * Splits the input string into an array of logical lines
 *
 * Key-value pairs are `[key, value]` arrays with string values. Escape
 * sequences in keys and values are parsed. Empty lines are included as empty
 * strings, and comments as strings that start with `#` or `!` characters.
 * Leading whitespace is not included.
 */
export function parseLines(str: string, ast?: false): Line[]

/** Splits the input string into an array of AST nodes */
export function parseLines(str: string, ast: true): Required<Node>[]

/**
 * Parses an input string read from a .properties file into a JavaScript Object
 *
 * If the second `path` parameter is true, dots `.` in keys will result in a
 * multi-level object (use a string value to customise). If a parent level is
 * directly assigned a value while it also has a child with an assigned value,
 * the parent value will be assigned to its empty string `''` key. Repeated keys
 * will take the last assigned value. Key order is not guaranteed, but is likely
 * to match the order of the input lines.
 */
export function parse(
  str: string | Line[] | Node[],
  path?: boolean | string
): Tree

// prettier-ignore
interface StringifyOptions {
  commentPrefix?: '# ' | string,  // could also use e.g. '!'
  defaultKey?: '' | string,       // YAML 1.1 used '='
  indent?: '    ' | string,       // tabs are also valid
  keySep?: ' = ' | string,        // should have at most one = or :
  latin1?: true | boolean,        // default encoding for .properties files
  lineWidth?: 80 | number,        // use null to disable
  newline?: '\n' | string,        // Windows uses \r\n
  pathSep?: '.' | string          // if non-default, use the same in parse()
  foldChars?: '\f\t .' | string
}

/**
 * Stringifies a hierarchical object or an array of lines to .properties format
 *
 * If the input is a hierarchical object, keys will consist of the path parts
 * joined by `.` characters. With array input, string values represent blank or
 * comment lines and string arrays are [key, value] pairs. The characters `\`,
 * `\n` and `\r` will be appropriately escaped. If the `latin1` option is not
 * set to false, all non-Latin-1 characters will also be `\u` escaped.
 *
 * Output styling is controlled by the second options parameter; by default a
 * spaced `=` separates the key from the value, `\n` is the newline separator,
 * lines are folded at 80 characters, with subsequent lines indented by four
 * spaces, and comment lines are prefixed with a `#`. `''` as a key value is
 * considered the default, and set as the value of a key corresponding to its
 * parent object's path.
 */
export function stringify(object: object, options?: StringifyOptions): string
