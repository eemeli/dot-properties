interface StringifyOptions {
  commentPrefix?: "# "|string,  // could also use e.g. '!'
  defaultKey?: ""|string,       // YAML 1.1 used '='
  indent?: "    "|string,       // tabs are also valid
  keySep?: " = "|string,        // should have at most one = or :
  latin1?: true|false,         // default encoding for .properties files
  lineWidth?: 80|number,        // use null to disable
  newline?: "\n"|string,        // Windows uses \r\n
  pathSep?: "."|string          // if non-default, use the same in parse()
}

export function parse(str: string): {
  [key: string]: any;
};
export function parseLines(str: string): Array<string|string[]>;

export function stringify(object: any, options?: StringifyOptions): string;
