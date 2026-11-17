(class_definition name: (identifier) @type)
(class_definition inherit: (identifier) @type)
(class_definition replaces: (identifier) @type)
(struct_definition name: (identifier) @type)

(class_definition (method_declaration name: (identifier) @function))
(struct_definition (method_declaration name: (identifier) @function))
(function_expression function: (identifier) @function)
(function_expression function: (member_access_expression member: (identifier) @function))
(function_expression function: (subscript_expression array: (identifier) @function)) ; function name with namespace
(function_expression function: (subscript_expression array: (member_access_expression member: (identifier) @function))) ; ditto but for member access

(function_expression
	argument: (identifier) @property
	":")

(parameter_list
	[
		(predefined_type)
		(class_type)
		(classname_type)
		(array_type)
		(map_type)
		(function_type)
	]
	.
	(identifier) @variable.parameter)


(state_label label: (label_identifier) @type)
(frame_statement sprite: (frame_sprite (frame_random_tic "_frame_random_tic_func" @keyword)))
(frame_statement keyword: (frame_keyword) @keyword)
(frame_statement action: (identifier) @function)
(control_statement keyword: (identifier) @keyword)

(enum_declaration name: (identifier) @type)

[
	(escape_sequence)
	(colour_escape_sequence)
] @string.escape

(name_literal) @string.special.symbol

[
	(predefined_type)
	(class_type)
	"_array"
	"_map"
	"_function"
] @type.builtin

(class_definition (variable_declaration type: (class_type) @type))

[
	(scope)
	(modifier)
	(access_level)
	"_extend"
	"_static"
	"_param_scope"
] @keyword.storage.modifier

[
	"version"
	"#include"
	"replaces"
	"flagdef"
	"property"
	"let"
	"_states"
	"_default"
	"_super"
	"_projectile"
	"_monster"
] @keyword

[
	"_class"
	"_const"
	"_struct"
	"_enum"
] @keyword.storage.type

[
	(boolean_literal)
] @boolean

[
	"do"
	"while"
	"for"
	"foreach"
] @keyword.control.repeat

[
	"_if"
	"_else"
	"_switch"
	"_case"
] @keyword.control.conditional

[
	"continue"
	"break"
] @keyword.control

"_return" @keyword.control.return

[
	"="
	"+="
	"-="
	"*="
	"/="
	"|="
	"&="
	"<<="
	">>="
	"^="
	"+"
	"-"
	"*"
	"/"
	"%"
	"|"
	"&"
	"<<"
	">>"
	"<"
	">"
	"<="
	">="
	"=="
	"!="
	"~=="
	"is"
	"&&"
	"||"
	"--"
	"++"
	"?"
	":"
	".."
	"!"
] @operator

(string_literal) @string
(number_literal) @number

(comment) @comment
