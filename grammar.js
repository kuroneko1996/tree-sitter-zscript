/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

const ZPREC = {
  DOT: 18,
  FUNCTION: 8,
  POSTFIX: 7,
  PREFIX: 6,
  COMPARE: 5,
  BITWISE: 4,
  MULT: 3,
  ADD: 2,
  LOGIC: 1,
};

export default grammar({
  name: "zscript",

  extras: ($) => [$.comment, /\s|\\\r?\n/],

  conflicts: ($) => [
    [$._left_expression, $._class_type],
    [$.default_declaration_flag, $._expression],
    [$.default_declaration_value, $._expression],
    [$.vector_expression, $.typecast_expression],
    [$._left_expression, $.predefined_type],
  ],

  supertypes: ($) => [$._definition, $._statement, $._expression, $._type],

  word: ($) => $.identifier,

  rules: {
    source_file: ($) => repeat($._definition),

    _definition: ($) =>
      choice(
        $.version_definition,
        $.include_definition,
        $.class_definition,
        $.struct_definition,
        $.const_definition,
        $.const_array_definition,
        $.enum_declaration,
      ),

    version_definition: ($) =>
      seq(
        alias(/version/i, "version"),
        field(
          "version",
          choice(
            token(prec(1, /\d+\.\d+\.\d+/)),
            $.number_literal,
            $.string_literal,
          ),
        ),
      ),

    include_definition: ($) =>
      seq(alias(/\#include/i, "_include"), field("path", $.string_literal)),

    class_definition: ($) =>
      seq(
        optional(alias(/extend/i, "_extend")),
        optional(alias(/mixin/i, "_mixin")),
        alias(/class/i, "_class"),
        field("name", $.identifier),
        field("inherit", optional(seq(":", $.identifier))),
        field("replaces", optional(seq("replaces", $.identifier))),
        repeat(choice($.scope, $.modifier)),
        "{",
        repeat(choice($._declaration, $.struct_definition)),
        "}",
      ),

    struct_definition: ($) =>
      seq(
        optional(/extend/i),
        alias(/struct/i, "_struct"),
        field("name", $.identifier),
        repeat(choice($.scope, $.modifier)),
        "{",
        repeat(
          choice(
            $.variable_declaration,
            $.method_declaration,
            $.const_definition,
            $.const_array_definition,
            $.enum_declaration,
          ),
        ),
        "}",
        optional(";"),
      ),

    const_definition: ($) =>
      prec(
        2,
        seq(
          alias(/const/i, "_const"),
          field("name", $.identifier),
          "=",
          field("value", $._expression),
          ";",
        ),
      ),

    const_array_definition: ($) =>
      prec(
        2,
        seq(
          optional(alias(/static/i, "_static")),
          alias(/const/i, "_const"),
          field("type", $._type),
          optional($.subscript_token),
          field("name", $.identifier),
          optional($.subscript_token),
          "=",
          field("contents", $.const_array_expression),
          ";",
        ),
      ),

    _struct_declaration: ($) =>
      choice(
        $.method_declaration,
        $.variable_declaration,
        $.enum_declaration,
        $.const_array_definition,
        $.const_definition,
      ),

    mixin_statement: ($) =>
      seq(alias(/mixin/i, "_mixin"), field("name", $.identifier), ";"),

    _declaration: ($) =>
      choice(
        $._struct_declaration,
        $.flagdef_declaration,
        $.property_declaration,
        $.default_declaration,
        $.states_declaration,
        $.mixin_statement,
      ),

    method_declaration: ($) =>
      seq(
        repeat(choice($.scope, $.modifier, $.access_level)),
        optional("@"),
        field("type", $._type),
        repeat(seq(",", optional("@"), field("type", $._type))),
        field("name", $.identifier),
        $.parameter_list,
        optional(alias(/const/i, "_const")),
        choice($.block, ";"),
      ),

    parameter_list: ($) => {
      const param = seq(
        optional(repeat(alias(/(out)|(in)/i, "_param_scope"))),
        optional("@"),
        field("type", $._type),
        field("name", $.identifier),
        field("default_value", optional(seq("=", $._expression))),
      );

      return seq(
        "(",
        optional(
          choice(
            alias(/void/i, $.predefined_type),
            "...",
            seq(
              field("parameter", seq(param, repeat(seq(",", param)))),
              optional(seq(",", "...")),
            ),
          ),
        ),
        ")",
      );
    },

    variable_declaration: ($) =>
      seq(
        repeat(choice($.scope, $.modifier, $.access_level)),
        optional("@"),
        field("type", $._type),
        optional($.subscript_token),
        field("name", $.identifier),
        optional($.subscript_token),
        repeat(
          seq(",", field("name", $.identifier), optional($.subscript_token)),
        ),
        ";",
      ),

    flagdef_declaration: ($) =>
      seq(
        alias(/flagdef/i, "flagdef"),
        field("name", $.identifier),
        ":",
        field("variable", $.identifier),
        ",",
        field("number", $.number_literal),
        ";",
      ),

    property_declaration: ($) =>
      seq(
        alias(/property/i, "property"),
        field("name", $.identifier),
        ":",
        field("variable", $.identifier),
        repeat(seq(",", field("variable", $.identifier))),
        ";",
      ),

    // as in the default actor values
    default_declaration: ($) =>
      seq(
        alias(/default/i, "_default"),
        "{",
        repeat(
          choice(
            seq($.default_declaration_flag, optional(";")),
            seq($.default_declaration_value, ";"),
            seq($._left_expression, ";"),
          ),
        ),
        "}",
      ),
    default_declaration_flag: ($) =>
      prec(
        1,
        seq(choice("+", "-"), choice($._left_expression, $.predefined_type)),
      ),
    default_declaration_value: ($) =>
      seq($._left_expression, $._expression, repeat(seq(",", $._expression))),

    enum_declaration: ($) =>
      seq(
        alias(/enum/i, "_enum"),
        field("name", $.identifier),
        "{",
        repeat($.enum_declaration_value),
        "}",
        optional(";"),
      ),
    enum_declaration_value: ($) =>
      seq(
        field("name", $.identifier),
        optional(seq("=", field("value", $._expression))),
        optional(","),
      ),

    states_declaration: ($) =>
      seq(
        alias(/states/i, "_states"),
        optional(seq("(", $.identifier, repeat(seq(",", $.identifier)), ")")),
        "{",
        repeat(choice($.state_label, $.frame_statement, $.control_statement)),
        "}",
      ),

    state_label: ($) =>
      seq(
        field(
          "label",
          alias(
            seq($.identifier, repeat(seq(".", $.identifier))),
            $.label_identifier,
          ),
        ),
        ":",
      ),

    empty_statement: ($) => ";",

    block: ($) =>
      seq("{", repeat(choice($._statement, $.empty_statement)), "}"),

    _type: ($) =>
      choice(
        $.predefined_type,
        $._class_type,
        $.classname_type,
        $.array_type,
        $.map_type,
        $.function_type,
        $.readonly_type,
      ),

    predefined_type: ($) =>
      choice(
        /int8/i,
        /uint8/i,
        /int16/i,
        /uint16/i,
        /int/i,
        /uint/i,
        /float/i,
        /double/i,
        /string/i,
        /bool/i,
        /void/i,
        /voidptr/i,
      ),

    _class_type: ($) => alias($.identifier, $.class_type),
    classname_type: ($) =>
      seq(
        alias(/class/i, "_class"),
        optional(seq("<", field("type", $._type), ">")),
      ),

    readonly_type: ($) =>
      prec(
        2,
        seq(
          alias(/readonly/i, "modifier"),
          "<",
          optional("@"),
          field("type", $._type),
          ">",
        ),
      ),

    array_type: ($) =>
      seq(
        alias(/array/i, "_array"),
        "<",
        optional("@"),
        field("type", $._type),
        ">",
      ),

    map_type: ($) =>
      seq(
        alias(/mapiterator|map/i, "_map"),
        "<",
        field("type", $._type),
        ",",
        field("type", $._type),
        ">",
      ),

    function_type: ($) =>
      seq(
        alias(/function/i, "_function"),
        "<",
        optional(field("scope", $.scope)),
        field("type", $._type),
        optional(
          seq(
            "(",
            optional(seq($._type, repeat(seq(optional(","), $._type)))),
            ")",
          ),
        ),
        ">",
      ),

    _statement: ($) =>
      choice(
        $.block,
        $.return_statement,
        $.continue_statement,
        $.break_statement,
        $.if_statement,
        $.switch_statement,
        $.case_statement,
        $.default_statement,
        $.while_statement,
        $.do_while_statement,
        $.for_statement,
        $.foreach_statement,
        $.declaration_statement,
        $.generic_statement,
        $.const_definition,
        $.const_array_definition,
      ),

    return_statement: ($) =>
      seq(
        alias(/return/i, "_return"),
        optional(seq($._expression, repeat(seq(",", $._expression)))),
        ";",
      ),

    continue_statement: ($) => seq("continue", ";"),
    break_statement: ($) => seq("break", ";"),

    declaration_statement: ($) => {
      const decl_item = choice(
        $.assignment_expression,
        field("name", $._left_expression),
      );

      return choice(
        seq(
          optional("@"),
          field("type", $._type),
          decl_item,
          repeat(seq(",", decl_item)),
          ";",
        ),
        seq(alias(/let/i, "let"), $.assignment_expression, ";"),
      );
    },

    if_statement: ($) =>
      prec.left(
        seq(
          alias(/if/i, "_if"),
          "(",
          field("condition", $._expression),
          ")",
          field("body", $._statement),
          optional(
            field("alternative", seq(alias(/else/i, "_else"), $._statement)),
          ),
        ),
      ),

    switch_statement: ($) =>
      prec.left(
        seq(
          alias(/switch/i, "_switch"),
          "(",
          field("variable", $._expression),
          ")",
          field("body", $.block),
        ),
      ),

    case_statement: ($) => seq(alias(/case/i, "_case"), $._expression, ":"),

    default_statement: ($) => seq(alias(/default/i, "_default"), ":"),

    while_statement: ($) =>
      seq(
        alias(/while/i, "_while"),
        "(",
        field("condition", $._expression),
        ")",
        field("body", $._statement),
      ),

    do_while_statement: ($) =>
      seq(
        alias(/do/i, "_do"),
        field("body", $._statement),
        alias(/while/i, "_while"),
        "(",
        field("condition", $._expression),
        ")",
      ),

    for_statement: ($) => {
      const expr_list = seq($._expression, repeat(seq(",", $._expression)));

      return seq(
        alias(/for/i, "_for"),
        "(",
        field(
          "initializer",
          choice($.declaration_statement, seq(optional(expr_list), ";")),
        ),
        field("condition", optional($._expression)),
        ";",
        field("update", optional(expr_list)),
        ")",
        field("body", $._statement),
      );
    },

    foreach_statement: ($) =>
      seq(
        alias(/foreach/i, "_foreach"),
        "(",
        field("left", $._expression),
        optional(seq(",", field("value", $._expression))),
        ":",
        field("right", $._expression),
        ")",
        field("body", $._statement),
      ),

    generic_statement: ($) => seq($._expression, ";"),

    _expression: ($) => choice($._nonleft_expression, $._left_expression),

    _nonleft_expression: ($) =>
      choice(
        $.assignment_expression,
        $.binary_expression,
        $.postfix_unary_expression,
        $.prefix_unary_expression,
        $.parenthesized_expression,
        $.array_expression,
        $.vector_expression,
        $.function_expression,
        $.typecast_expression,
        $.ternary_expression,
        $.string_concat_expression,
        $.const_array_expression,
        $._literal,
      ),

    _left_expression: ($) =>
      choice(
        $.member_access_expression,
        $.subscript_expression,
        $.identifier,
        alias(/string/i, $.identifier),
      ),

    member_access_expression: ($) =>
      prec.left(
        ZPREC.DOT,
        seq(
          choice($._expression, $.predefined_type),
          ".",
          field("member", choice($._left_expression, $.predefined_type)),
        ),
      ),

    assignment_expression: ($) =>
      prec.right(
        seq(
          field("left", choice($._left_expression, $.array_expression)),
          choice("=", "+=", "-=", "*=", "/=", "|=", "&=", "^=", ">>=", "<<="),
          field("right", $._expression),
        ),
      ),

    binary_expression: ($) => {
      /** @type {[number, RuleOrLiteral][]} */
      const table = [
        [ZPREC.ADD, "+"],
        [ZPREC.ADD, "-"],
        [ZPREC.MULT, "*"],
        [ZPREC.MULT, "/"],
        [ZPREC.MULT, "%"],
        [ZPREC.MULT, "**"],
        [ZPREC.MULT, /dot/i],
        [ZPREC.MULT, /cross/i],
        [ZPREC.BITWISE, "|"],
        [ZPREC.BITWISE, "&"],
        [ZPREC.BITWISE, "^"],
        [ZPREC.BITWISE, "<<"],
        [ZPREC.BITWISE, ">>"],
        [ZPREC.COMPARE, "<"],
        [ZPREC.COMPARE, ">"],
        [ZPREC.COMPARE, "<="],
        [ZPREC.COMPARE, ">="],
        [ZPREC.COMPARE, "=="],
        [ZPREC.COMPARE, "!="],
        [ZPREC.COMPARE, "~=="],
        [ZPREC.COMPARE, "is"],
        [ZPREC.LOGIC, "&&"],
        [ZPREC.LOGIC, "||"],
      ];

      return choice(
        ...table.map(([precedence, operator]) =>
          prec.left(
            precedence,
            prec.dynamic(
              2,
              seq(
                field("left", $._expression),
                field("operator", operator),
                field("right", $._expression),
              ),
            ),
          ),
        ),
      );
    },

    postfix_unary_expression: ($) =>
      prec.right(ZPREC.POSTFIX, seq($._expression, choice("++", "--"))),

    prefix_unary_expression: ($) =>
      prec.right(
        ZPREC.PREFIX,
        seq(choice("++", "--", "+", "-", "!", "~"), $._expression),
      ),

    parenthesized_expression: ($) => seq("(", $._expression, ")"),

    vector_expression: ($) =>
      seq(
        "(",
        field("x", $._expression),
        ",",
        field("y", $._expression),
        optional(seq(",", field("z", $._expression))),
        ")",
      ),

    function_expression: ($) =>
      prec(
        ZPREC.FUNCTION,
        seq(
          field("function", $._expression),
          "(",
          field(
            "argument",
            optional(
              seq(
                $._function_expression_argument,
                repeat(seq(",", $._function_expression_argument)),
              ),
            ),
          ),
          ")",
        ),
      ),
    _function_expression_argument: ($) =>
      seq(field("name", optional(seq($.identifier, ":"))), $._expression),

    typecast_expression: ($) =>
      prec(
        ZPREC.FUNCTION,
        seq(
          choice(seq("(", field("type", $._type), ")"), field("type", $._type)),
          "(",
          field("target", $._expression),
          repeat(seq(",", field("target", $._expression))),
          ")",
        ),
      ),

    ternary_expression: ($) =>
      prec.left(
        seq(
          field("condition", $._expression),
          "?",
          field("consequence", $._expression),
          ":",
          field("alternative", $._expression),
        ),
      ),

    string_concat_expression: ($) =>
      prec.right(seq($._expression, "..", $._expression)),

    subscript_expression: ($) =>
      prec.right(
        ZPREC.POSTFIX,
        seq(field("array", $._expression), $.subscript_token),
      ),

    subscript_token: ($) =>
      seq("[", field("index", optional($._expression)), "]"),

    array_expression: ($) =>
      seq("[", $._expression, repeat(seq(",", $._expression)), "]"),

    const_array_expression: ($) =>
      seq("{", $._expression, repeat(seq(",", $._expression)), "}"),

    _states_statement: ($) => choice($.frame_statement, $.control_statement),

    frame_statement: ($) =>
      seq(
        field("sprite", $.frame_sprite),
        field("keyword", repeat($.frame_keyword)),
        choice(
          ";",
          seq($.function_expression, ";"),
          seq(field("action", $.identifier), ";"),
          $.block,
        ),
      ),
    frame_sprite: ($) =>
      seq(
        choice($.identifier, '"----"', "----", '"####"', "####"),
        choice(
          token(/[\w\[\]\\]+/),
          /#+/,
          token(seq('"', /[\w\[\]\\#]+/, '"')),
        ),
        choice(seq(optional("-"), $.number_literal), $.frame_random_tic),
      ),

    frame_random_tic: ($) =>
      seq(
        alias(/random/i, "_frame_random_tic_func"),
        "(",
        $.number_literal,
        ",",
        $.number_literal,
        ")",
      ),

    frame_keyword: ($) =>
      choice(
        /bright/i,
        /canraise/i,
        /fast/i,
        /nodelay/i,
        /slow/i,
        seq(
          /offset/i,
          "(",
          field("x", $._expression),
          ",",
          field("y", $._expression),
          ")",
        ),
        seq(/light/i, "(", field("light", $._expression), ")"),
      ),

    control_statement: ($) =>
      choice(
        seq(
          field(
            "keyword",
            alias(token(prec(1, /loop|stop|wait|fail/i)), $.identifier),
          ),
          ";",
        ),
        seq(
          field("keyword", alias(token(prec(1, /goto/i)), $.identifier)),
          choice(
            seq(alias(token(prec(1, /super/i)), "_super"), "::", $._expression),
            $._expression,
          ),
          ";",
        ),
      ),

    scope: ($) =>
      choice(
        /clearscope/i,
        /virtualscope/i,
        /play/i,
        /ui/i,
        /action/i,
        /norollback/i,
      ),

    modifier: ($) =>
      choice(
        /abstract/i,
        /final/i,
        seq(
          /sealed/i,
          optional(seq("(", $.identifier, repeat(seq(",", $.identifier)), ")")),
        ),
        /virtual/i,
        /override/i,
        alias(/static/i, "_static"),
        /transient/i,
        /native/i,
        /readonly/i,
        /internal/i,
        /vararg/i,
        /latent/i,
        /meta/i,
        seq(/unsafe/i, "(", $.identifier, ")"),
        $.deprecated_modifier,
        $.version_modifier,
      ),

    deprecated_modifier: ($) =>
      seq(
        alias(/deprecated/i, "deprecated"),
        "(",
        field("version", $.string_literal),
        optional(seq(",", field("warning", $.string_literal))),
        ")",
      ),

    version_modifier: ($) =>
      seq(/version/i, "(", field("version", $.string_literal), ")"),

    access_level: ($) => choice(/private/i, /protected/i),

    // regex taken from tree-sitter-c-sharp
    // http://stackoverflow.com/questions/13014947/regex-to-match-a-c-style-multiline-comment/36328890#36328890
    comment: ($) =>
      token(
        choice(
          seq("//", /[^\n\r]*/),
          seq("/*", /[^*]*\*+([^/*][^*]*\*+)*/, "/"),
        ),
      ),

    _literal: ($) =>
      choice(
        $.string_literal,
        $.name_literal,
        $.number_literal,
        $.hex_literal,
        $.boolean_literal,
      ),

    string_literal: ($) =>
      seq(
        '"',
        repeat(
          choice(
            $._interpreted_string_literal_content,
            $.escape_sequence,
            $.colour_escape_sequence,
          ),
        ),
        '"',
      ),

    _interpreted_string_literal_content: (_) =>
      token.immediate(prec(1, /[^"\\]+/)),
    escape_sequence: (_) => token.immediate(/\\./),
    colour_escape_sequence: (_) =>
      token.immediate(/\\[a-z][a-zA-Z\-]?(\[[a-zA-Z]+\])?/),

    name_literal: ($) => /'[^']*'/,

    number_literal: ($) =>
      token(
        choice(
          /\d+\.\d*([eE][+-]?\d+)?[fF]?/,
          /\.\d+([eE][+-]?\d+)?[fF]?/,
          /\d+[eE][+-]?\d+[fF]?/,
          /\d+[uUfF]?/,
        ),
      ),

    hex_literal: ($) => /0x[\d\w]+/i,

    boolean_literal: ($) => choice(/true/i, /false/i),

    // copied from tree-sitter-c-sharp
    identifier: ($) =>
      token(/[\p{L}\p{Nl}_][\p{L}\p{Nl}\p{Nd}\p{Pc}\p{Cf}\p{Mn}\p{Mc}]*/u),
  },
});
