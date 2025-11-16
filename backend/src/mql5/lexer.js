/**
 * MQL5 Lexer - Tokenizes MQL5 source code
 * Converts raw MQL5 text into a stream of tokens for parsing
 */

// Token types for MQL5 language
const TokenType = {
  // Data types
  VOID: 'VOID',
  INT: 'INT',
  DOUBLE: 'DOUBLE',
  STRING: 'STRING',
  BOOL: 'BOOL',
  DATETIME: 'DATETIME',
  COLOR: 'COLOR',
  UCHAR: 'UCHAR',
  UINT: 'UINT',
  LONG: 'LONG',
  ULONG: 'ULONG',
  FLOAT: 'FLOAT',
  SHORT: 'SHORT',
  USHORT: 'USHORT',
  CHAR: 'CHAR',

  // Modifiers and storage classes
  INPUT: 'INPUT',
  EXTERN: 'EXTERN',
  STATIC: 'STATIC',
  CONST: 'CONST',

  // Control flow
  IF: 'IF',
  ELSE: 'ELSE',
  FOR: 'FOR',
  WHILE: 'WHILE',
  DO: 'DO',
  SWITCH: 'SWITCH',
  CASE: 'CASE',
  DEFAULT: 'DEFAULT',
  BREAK: 'BREAK',
  CONTINUE: 'CONTINUE',
  RETURN: 'RETURN',

  // MQL5 specific keywords
  PROPERTY: 'PROPERTY',
  INCLUDE: 'INCLUDE',
  DEFINE: 'DEFINE',

  // Enumerations
  ENUM: 'ENUM',

  // Identifiers and literals
  IDENTIFIER: 'IDENTIFIER',
  NUMBER: 'NUMBER',
  STRING_LITERAL: 'STRING_LITERAL',
  TRUE: 'TRUE',
  FALSE: 'FALSE',
  NULL: 'NULL',

  // Operators - Arithmetic
  PLUS: 'PLUS',
  MINUS: 'MINUS',
  MULTIPLY: 'MULTIPLY',
  DIVIDE: 'DIVIDE',
  MODULO: 'MODULO',
  INCREMENT: 'INCREMENT',
  DECREMENT: 'DECREMENT',

  // Operators - Assignment
  ASSIGN: 'ASSIGN',
  PLUS_ASSIGN: 'PLUS_ASSIGN',
  MINUS_ASSIGN: 'MINUS_ASSIGN',
  MULTIPLY_ASSIGN: 'MULTIPLY_ASSIGN',
  DIVIDE_ASSIGN: 'DIVIDE_ASSIGN',

  // Operators - Comparison
  EQUAL: 'EQUAL',
  NOT_EQUAL: 'NOT_EQUAL',
  GREATER: 'GREATER',
  LESS: 'LESS',
  GREATER_EQUAL: 'GREATER_EQUAL',
  LESS_EQUAL: 'LESS_EQUAL',

  // Operators - Logical
  LOGICAL_AND: 'LOGICAL_AND',
  LOGICAL_OR: 'LOGICAL_OR',
  LOGICAL_NOT: 'LOGICAL_NOT',

  // Operators - Bitwise
  BITWISE_AND: 'BITWISE_AND',
  BITWISE_OR: 'BITWISE_OR',
  BITWISE_XOR: 'BITWISE_XOR',
  BITWISE_NOT: 'BITWISE_NOT',
  LEFT_SHIFT: 'LEFT_SHIFT',
  RIGHT_SHIFT: 'RIGHT_SHIFT',

  // Delimiters
  LPAREN: 'LPAREN',
  RPAREN: 'RPAREN',
  LBRACE: 'LBRACE',
  RBRACE: 'RBRACE',
  LBRACKET: 'LBRACKET',
  RBRACKET: 'RBRACKET',
  SEMICOLON: 'SEMICOLON',
  COMMA: 'COMMA',
  DOT: 'DOT',
  COLON: 'COLON',
  QUESTION: 'QUESTION',
  HASH: 'HASH',

  // Special
  NEWLINE: 'NEWLINE',
  EOF: 'EOF'
};

class Token {
  constructor(type, value, line, column) {
    this.type = type;
    this.value = value;
    this.line = line;
    this.column = column;
  }
}

class Lexer {
  constructor(source) {
    this.source = source;
    this.position = 0;
    this.line = 1;
    this.column = 1;
    this.currentChar = source[0] || null;

    // MQL5 keywords mapping
    this.keywords = {
      'void': TokenType.VOID,
      'int': TokenType.INT,
      'double': TokenType.DOUBLE,
      'string': TokenType.STRING,
      'bool': TokenType.BOOL,
      'datetime': TokenType.DATETIME,
      'color': TokenType.COLOR,
      'uchar': TokenType.UCHAR,
      'uint': TokenType.UINT,
      'long': TokenType.LONG,
      'ulong': TokenType.ULONG,
      'float': TokenType.FLOAT,
      'short': TokenType.SHORT,
      'ushort': TokenType.USHORT,
      'char': TokenType.CHAR,
      'input': TokenType.INPUT,
      'extern': TokenType.EXTERN,
      'static': TokenType.STATIC,
      'const': TokenType.CONST,
      'if': TokenType.IF,
      'else': TokenType.ELSE,
      'for': TokenType.FOR,
      'while': TokenType.WHILE,
      'do': TokenType.DO,
      'switch': TokenType.SWITCH,
      'case': TokenType.CASE,
      'default': TokenType.DEFAULT,
      'break': TokenType.BREAK,
      'continue': TokenType.CONTINUE,
      'return': TokenType.RETURN,
      'property': TokenType.PROPERTY,
      'include': TokenType.INCLUDE,
      'define': TokenType.DEFINE,
      'enum': TokenType.ENUM,
      'true': TokenType.TRUE,
      'false': TokenType.FALSE,
      'NULL': TokenType.NULL
    };
  }

  error(message) {
    throw new Error(`Lexer error at line ${this.line}, column ${this.column}: ${message}`);
  }

  advance() {
    if (this.currentChar === '\n') {
      this.line++;
      this.column = 1;
    } else {
      this.column++;
    }

    this.position++;
    this.currentChar = this.position < this.source.length ? this.source[this.position] : null;
  }

  peek(offset = 1) {
    const peekPos = this.position + offset;
    return peekPos < this.source.length ? this.source[peekPos] : null;
  }

  skipWhitespace() {
    while (this.currentChar && /[ \t\r]/.test(this.currentChar)) {
      this.advance();
    }
  }

  skipSingleLineComment() {
    // Skip //
    this.advance();
    this.advance();

    // Skip until end of line
    while (this.currentChar && this.currentChar !== '\n') {
      this.advance();
    }
  }

  skipMultiLineComment() {
    // Skip /*
    this.advance();
    this.advance();

    // Skip until */
    while (this.currentChar) {
      if (this.currentChar === '*' && this.peek() === '/') {
        this.advance(); // Skip *
        this.advance(); // Skip /
        break;
      }
      this.advance();
    }
  }

  readNumber() {
    const startLine = this.line;
    const startColumn = this.column;
    let num = '';
    let hasDecimal = false;

    while (this.currentChar && (/\d/.test(this.currentChar) || this.currentChar === '.')) {
      if (this.currentChar === '.') {
        if (hasDecimal) break; // Second decimal point, not part of this number
        hasDecimal = true;
      }
      num += this.currentChar;
      this.advance();
    }

    // Handle scientific notation
    if (this.currentChar && (this.currentChar === 'e' || this.currentChar === 'E')) {
      num += this.currentChar;
      this.advance();

      if (this.currentChar && (this.currentChar === '+' || this.currentChar === '-')) {
        num += this.currentChar;
        this.advance();
      }

      while (this.currentChar && /\d/.test(this.currentChar)) {
        num += this.currentChar;
        this.advance();
      }
    }

    return new Token(TokenType.NUMBER, parseFloat(num), startLine, startColumn);
  }

  readIdentifier() {
    const startLine = this.line;
    const startColumn = this.column;
    let id = '';

    while (this.currentChar && /[a-zA-Z0-9_]/.test(this.currentChar)) {
      id += this.currentChar;
      this.advance();
    }

    // Check if it's a keyword
    const type = this.keywords[id.toLowerCase()] || TokenType.IDENTIFIER;

    return new Token(type, id, startLine, startColumn);
  }

  readString() {
    const startLine = this.line;
    const startColumn = this.column;
    let str = '';
    const quote = this.currentChar; // Can be " or '

    this.advance(); // Skip opening quote

    while (this.currentChar && this.currentChar !== quote) {
      if (this.currentChar === '\\') {
        this.advance();
        // Handle escape sequences
        if (!this.currentChar) {
          this.error('Unterminated string');
        }

        switch (this.currentChar) {
          case 'n': str += '\n'; break;
          case 't': str += '\t'; break;
          case 'r': str += '\r'; break;
          case '\\': str += '\\'; break;
          case '"': str += '"'; break;
          case "'": str += "'"; break;
          case '0': str += '\0'; break;
          default: str += this.currentChar;
        }
      } else {
        str += this.currentChar;
      }
      this.advance();
    }

    if (!this.currentChar) {
      this.error('Unterminated string');
    }

    this.advance(); // Skip closing quote
    return new Token(TokenType.STRING_LITERAL, str, startLine, startColumn);
  }

  readPreprocessorDirective() {
    const startLine = this.line;
    const startColumn = this.column;
    let directive = '';

    this.advance(); // Skip #

    // Skip whitespace after #
    this.skipWhitespace();

    // Read directive name
    while (this.currentChar && /[a-zA-Z_]/.test(this.currentChar)) {
      directive += this.currentChar;
      this.advance();
    }

    // For now, we'll just skip preprocessor directives
    // In a full implementation, we'd parse #include, #define, #property
    while (this.currentChar && this.currentChar !== '\n') {
      this.advance();
    }

    return null; // Return null to skip this token
  }

  getNextToken() {
    while (this.currentChar) {
      const startLine = this.line;
      const startColumn = this.column;

      // Skip whitespace
      if (/[ \t\r]/.test(this.currentChar)) {
        this.skipWhitespace();
        continue;
      }

      // Handle newlines
      if (this.currentChar === '\n') {
        this.advance();
        continue; // Skip newlines for now
      }

      // Comments
      if (this.currentChar === '/' && this.peek() === '/') {
        this.skipSingleLineComment();
        continue;
      }

      if (this.currentChar === '/' && this.peek() === '*') {
        this.skipMultiLineComment();
        continue;
      }

      // Preprocessor directives
      if (this.currentChar === '#') {
        const token = this.readPreprocessorDirective();
        if (token) return token;
        continue;
      }

      // Numbers
      if (/\d/.test(this.currentChar)) {
        return this.readNumber();
      }

      // Identifiers and keywords
      if (/[a-zA-Z_]/.test(this.currentChar)) {
        return this.readIdentifier();
      }

      // Strings
      if (this.currentChar === '"' || this.currentChar === "'") {
        return this.readString();
      }

      // Two-character operators
      const twoChar = this.currentChar + (this.peek() || '');

      if (twoChar === '++') {
        this.advance();
        this.advance();
        return new Token(TokenType.INCREMENT, '++', startLine, startColumn);
      }

      if (twoChar === '--') {
        this.advance();
        this.advance();
        return new Token(TokenType.DECREMENT, '--', startLine, startColumn);
      }

      if (twoChar === '==') {
        this.advance();
        this.advance();
        return new Token(TokenType.EQUAL, '==', startLine, startColumn);
      }

      if (twoChar === '!=') {
        this.advance();
        this.advance();
        return new Token(TokenType.NOT_EQUAL, '!=', startLine, startColumn);
      }

      if (twoChar === '>=') {
        this.advance();
        this.advance();
        return new Token(TokenType.GREATER_EQUAL, '>=', startLine, startColumn);
      }

      if (twoChar === '<=') {
        this.advance();
        this.advance();
        return new Token(TokenType.LESS_EQUAL, '<=', startLine, startColumn);
      }

      if (twoChar === '&&') {
        this.advance();
        this.advance();
        return new Token(TokenType.LOGICAL_AND, '&&', startLine, startColumn);
      }

      if (twoChar === '||') {
        this.advance();
        this.advance();
        return new Token(TokenType.LOGICAL_OR, '||', startLine, startColumn);
      }

      if (twoChar === '<<') {
        this.advance();
        this.advance();
        return new Token(TokenType.LEFT_SHIFT, '<<', startLine, startColumn);
      }

      if (twoChar === '>>') {
        this.advance();
        this.advance();
        return new Token(TokenType.RIGHT_SHIFT, '>>', startLine, startColumn);
      }

      if (twoChar === '+=') {
        this.advance();
        this.advance();
        return new Token(TokenType.PLUS_ASSIGN, '+=', startLine, startColumn);
      }

      if (twoChar === '-=') {
        this.advance();
        this.advance();
        return new Token(TokenType.MINUS_ASSIGN, '-=', startLine, startColumn);
      }

      if (twoChar === '*=') {
        this.advance();
        this.advance();
        return new Token(TokenType.MULTIPLY_ASSIGN, '*=', startLine, startColumn);
      }

      if (twoChar === '/=') {
        this.advance();
        this.advance();
        return new Token(TokenType.DIVIDE_ASSIGN, '/=', startLine, startColumn);
      }

      // Single-character operators and delimiters
      const char = this.currentChar;
      this.advance();

      switch (char) {
        case '+': return new Token(TokenType.PLUS, '+', startLine, startColumn);
        case '-': return new Token(TokenType.MINUS, '-', startLine, startColumn);
        case '*': return new Token(TokenType.MULTIPLY, '*', startLine, startColumn);
        case '/': return new Token(TokenType.DIVIDE, '/', startLine, startColumn);
        case '%': return new Token(TokenType.MODULO, '%', startLine, startColumn);
        case '=': return new Token(TokenType.ASSIGN, '=', startLine, startColumn);
        case '>': return new Token(TokenType.GREATER, '>', startLine, startColumn);
        case '<': return new Token(TokenType.LESS, '<', startLine, startColumn);
        case '!': return new Token(TokenType.LOGICAL_NOT, '!', startLine, startColumn);
        case '&': return new Token(TokenType.BITWISE_AND, '&', startLine, startColumn);
        case '|': return new Token(TokenType.BITWISE_OR, '|', startLine, startColumn);
        case '^': return new Token(TokenType.BITWISE_XOR, '^', startLine, startColumn);
        case '~': return new Token(TokenType.BITWISE_NOT, '~', startLine, startColumn);
        case '(': return new Token(TokenType.LPAREN, '(', startLine, startColumn);
        case ')': return new Token(TokenType.RPAREN, ')', startLine, startColumn);
        case '{': return new Token(TokenType.LBRACE, '{', startLine, startColumn);
        case '}': return new Token(TokenType.RBRACE, '}', startLine, startColumn);
        case '[': return new Token(TokenType.LBRACKET, '[', startLine, startColumn);
        case ']': return new Token(TokenType.RBRACKET, ']', startLine, startColumn);
        case ';': return new Token(TokenType.SEMICOLON, ';', startLine, startColumn);
        case ',': return new Token(TokenType.COMMA, ',', startLine, startColumn);
        case '.': return new Token(TokenType.DOT, '.', startLine, startColumn);
        case ':': return new Token(TokenType.COLON, ':', startLine, startColumn);
        case '?': return new Token(TokenType.QUESTION, '?', startLine, startColumn);
        default:
          this.error(`Unexpected character: ${char}`);
      }
    }

    return new Token(TokenType.EOF, null, this.line, this.column);
  }

  tokenize() {
    const tokens = [];
    let token = this.getNextToken();

    while (token.type !== TokenType.EOF) {
      tokens.push(token);
      token = this.getNextToken();
    }

    tokens.push(token); // Add EOF token
    return tokens;
  }
}

export { Lexer, TokenType, Token };
