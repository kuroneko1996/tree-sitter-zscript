# ZScript Tree-Sitter Grammar

[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

A tree-sitter grammar for the ZScript language, designed for parsing and analysis of ZScript files (used primarily in ZDoom/GZDoom).

This grammar was inspired by [dastrukar's tree-sitter-zscript](https://github.com/dastrukar/tree-sitter-zscript).

## ✨ Features

*   **Accurate Parsing:** Provides a robust and accurate representation of ZScript syntax.
*   **Tree-sitter Native:** Fully compatible with the tree-sitter parsing framework for language analysis, editor integration, and tooling.
*   **Extensible:** Built to support future features and extensions to the grammar as ZScript evolves.

## 🚀 Usage

### Installation

To use this grammar in your project, you typically need to add the relevant tree-sitter libraries and the grammar definition to your build system or parser configuration.

If you are using a standard tree-sitter setup, you can usually install it via:
```bash
# Example command - adjust based on your specific tooling/language
tree-sitter add zscript
