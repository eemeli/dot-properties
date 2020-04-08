class Node {
  constructor(type) {
    this.type = type
  }
}

class Pair extends Node {
  constructor(key, value) {
    super('PAIR')
    this.key = key
    this.value = value
  }
}

class Comment extends Node {
  constructor(comment) {
    super('COMMENT')
    this.comment = comment
  }
}

class EmptyLine extends Node {
  constructor() {
    super('EMPTY_LINE')
  }
}

module.exports = { Node, Pair, Comment, EmptyLine}
