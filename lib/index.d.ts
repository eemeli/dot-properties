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
}

type Line = string | string[]
interface Tree {
  [key: string]: string | Tree
}

export function parseLines(str: string, ast?: false): Line[]
export function parseLines(str: string, ast: true): Required<Node>[]
export function parse(
  str: string | Line[] | Node[],
  path?: boolean | string
): Tree
export function stringify(object: object, options?: StringifyOptions): string
