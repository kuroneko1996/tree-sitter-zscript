/**
 * @file ZScript language from ZDoom
 * @author kuroneko1996 <20803349+kuroneko1996@users.noreply.github.com>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

export default grammar({
  name: "zscript",

  rules: {
    // TODO: add the actual grammar rules
    source_file: $ => "hello"
  }
});
