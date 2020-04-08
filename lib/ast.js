class Node {
  constructor(type, range) {
    this.type = type
    if (range) this.range = range
  }
}

class Pair extends Node {
  constructor(key, value, range) {
    super('PAIR', range)
    this.key = key
    this.value = value
  }

  separator(src) {
    if (Array.isArray(this.range) && this.range.length >= 3) {
      // eslint-disable-next-line no-unused-vars
      const [_, start, end] = this.range
      return src.slice(start, end)
    }
    return null
  }
}

class Comment extends Node {
  constructor(comment, range) {
    super('COMMENT', range)
    this.comment = comment
  }
}

class EmptyLine extends Node {
  constructor(range) {
    super('EMPTY_LINE', range)
  }
}

module.exports = { Node, Pair, Comment, EmptyLine }
