/**
 * MQL5 Parser - Builds Abstract Syntax Tree from token stream
 * Converts tokens into a structured representation of the EA code
 */

import { TokenType } from './lexer.js';

// AST Node Classes
class ASTNode {
  constructor(type) {
    this.type = type;
  }
}

class Program extends ASTNode {
  constructor(declarations) {
    super('Program');
    this.declarations = declarations;
  }
}

class FunctionDeclaration extends ASTNode {
  constructor(returnType, name, parameters, body) {
    super('FunctionDeclaration');
    this.returnType = returnType;
    this.name = name;
    this.parameters = parameters;
    this.body = body;
  }
}

class VariableDeclaration extends ASTNode {
  constructor(varType, name, isInput, isStatic, isConst, defaultValue, arraySize) {
    super('VariableDeclaration');
    this.varType = varType;
    this.name = name;
    this.isInput = isInput;
    this.isStatic = isStatic;
    this.isConst = isConst;
    this.defaultValue = defaultValue;
    this.arraySize = arraySize;
  }
}

class IfStatement extends ASTNode {
  constructor(condition, thenBranch, elseBranch) {
    super('IfStatement');
    this.condition = condition;
    this.thenBranch = thenBranch;
    this.elseBranch = elseBranch;
  }
}

class ForStatement extends ASTNode {
  constructor(init, condition, increment, body) {
    super('ForStatement');
    this.init = init;
    this.condition = condition;
    this.increment = increment;
    this.body = body;
  }
}

class WhileStatement extends ASTNode {
  constructor(condition, body) {
    super('WhileStatement');
    this.condition = condition;
    this.body = body;
  }
}

class ReturnStatement extends ASTNode {
  constructor(value) {
    super('ReturnStatement');
    this.value = value;
  }
}

class BreakStatement extends ASTNode {
  constructor() {
    super('BreakStatement');
  }
}

class ContinueStatement extends ASTNode {
  constructor() {
    super('ContinueStatement');
  }
}

class ExpressionStatement extends ASTNode {
  constructor(expression) {
    super('ExpressionStatement');
    this.expression = expression;
  }
}

class CallExpression extends ASTNode {
  constructor(callee, args) {
    super('CallExpression');
    this.callee = callee;
    this.arguments = args;
  }
}

class BinaryExpression extends ASTNode {
  constructor(left, operator, right) {
    super('BinaryExpression');
    this.left = left;
    this.operator = operator;
    this.right = right;
  }
}

class UnaryExpression extends ASTNode {
  constructor(operator, operand, isPrefix) {
    super('UnaryExpression');
    this.operator = operator;
    this.operand = operand;
    this.isPrefix = isPrefix;
  }
}

class AssignmentExpression extends ASTNode {
  constructor(left, operator, right) {
    super('AssignmentExpression');
    this.left = left;
    this.operator = operator;
    this.right = right;
  }
}

class ConditionalExpression extends ASTNode {
  constructor(condition, thenExpr, elseExpr) {
    super('ConditionalExpression');
    this.condition = condition;
    this.thenExpr = thenExpr;
    this.elseExpr = elseExpr;
  }
}

class Identifier extends ASTNode {
  constructor(name) {
    super('Identifier');
    this.name = name;
  }
}

class NumberLiteral extends ASTNode {
  constructor(value) {
    super('NumberLiteral');
    this.value = value;
  }
}

class StringLiteral extends ASTNode {
  constructor(value) {
    super('StringLiteral');
    this.value = value;
  }
}

class BooleanLiteral extends ASTNode {
  constructor(value) {
    super('BooleanLiteral');
    this.value = value;
  }
}

class ArrayAccess extends ASTNode {
  constructor(array, index) {
    super('ArrayAccess');
    this.array = array;
    this.index = index;
  }
}

class BlockStatement extends ASTNode {
  constructor(statements) {
    super('BlockStatement');
    this.statements = statements;
  }
}

class Parser {
  constructor(tokens) {
    this.tokens = tokens;
    this.position = 0;
    this.currentToken = tokens[0];
  }

  error(message) {
    const token = this.currentToken;
    throw new Error(
      `Parser error at line ${token.line}, column ${token.column}: ${message}\n` +
      `Current token: ${token.type} (${token.value})`
    );
  }

  advance() {
    this.position++;
    this.currentToken = this.position < this.tokens.length
      ? this.tokens[this.position]
      : { type: TokenType.EOF, value: null, line: 0, column: 0 };
  }

  expect(type) {
    if (this.currentToken.type !== type) {
      this.error(`Expected ${type}, got ${this.currentToken.type}`);
    }
    const token = this.currentToken;
    this.advance();
    return token;
  }

  match(...types) {
    return types.includes(this.currentToken.type);
  }

  // Main parsing entry point
  parseProgram() {
    const declarations = [];

    while (this.currentToken.type !== TokenType.EOF) {
      try {
        const decl = this.parseDeclaration();
        if (decl) {
          declarations.push(decl);
        }
      } catch (error) {
        console.error('Parse error:', error.message);
        // Skip to next declaration
        this.synchronize();
      }
    }

    return new Program(declarations);
  }

  synchronize() {
    this.advance();

    while (this.currentToken.type !== TokenType.EOF) {
      if (this.currentToken.type === TokenType.SEMICOLON) {
        this.advance();
        return;
      }

      if (this.isDeclarationStart()) {
        return;
      }

      this.advance();
    }
  }

  isDeclarationStart() {
    return this.match(
      TokenType.VOID, TokenType.INT, TokenType.DOUBLE, TokenType.STRING,
      TokenType.BOOL, TokenType.DATETIME, TokenType.INPUT, TokenType.STATIC,
      TokenType.CONST, TokenType.ENUM
    );
  }

  parseDeclaration() {
    // Variable or function declaration
    if (this.isVariableDeclaration()) {
      return this.parseVariableDeclaration();
    }

    if (this.isFunctionDeclaration()) {
      return this.parseFunctionDeclaration();
    }

    // Enum declaration
    if (this.match(TokenType.ENUM)) {
      return this.parseEnumDeclaration();
    }

    // Unknown - skip
    this.advance();
    return null;
  }

  isVariableDeclaration() {
    // Check for modifiers
    let offset = 0;

    if (this.tokens[this.position + offset]?.type === TokenType.INPUT ||
        this.tokens[this.position + offset]?.type === TokenType.STATIC ||
        this.tokens[this.position + offset]?.type === TokenType.CONST) {
      offset++;
    }

    // Check for type
    const nextToken = this.tokens[this.position + offset];
    if (!nextToken) return false;

    const isType = [
      TokenType.INT, TokenType.DOUBLE, TokenType.STRING, TokenType.BOOL,
      TokenType.DATETIME, TokenType.COLOR, TokenType.LONG, TokenType.FLOAT
    ].includes(nextToken.type);

    if (!isType) return false;

    // Check if followed by identifier and then semicolon or assignment
    const afterType = this.tokens[this.position + offset + 1];
    const afterIdentifier = this.tokens[this.position + offset + 2];

    return afterType?.type === TokenType.IDENTIFIER &&
           (afterIdentifier?.type === TokenType.SEMICOLON ||
            afterIdentifier?.type === TokenType.ASSIGN ||
            afterIdentifier?.type === TokenType.LBRACKET);
  }

  isFunctionDeclaration() {
    // Check for return type
    let offset = 0;

    const currentType = this.tokens[this.position + offset]?.type;
    const isReturnType = [
      TokenType.VOID, TokenType.INT, TokenType.DOUBLE, TokenType.STRING,
      TokenType.BOOL, TokenType.DATETIME
    ].includes(currentType);

    if (!isReturnType) return false;

    // Check if followed by identifier and then (
    const afterType = this.tokens[this.position + offset + 1];
    const afterIdentifier = this.tokens[this.position + offset + 2];

    return afterType?.type === TokenType.IDENTIFIER &&
           afterIdentifier?.type === TokenType.LPAREN;
  }

  parseVariableDeclaration() {
    let isInput = false;
    let isStatic = false;
    let isConst = false;

    // Parse modifiers
    while (this.match(TokenType.INPUT, TokenType.STATIC, TokenType.CONST)) {
      if (this.currentToken.type === TokenType.INPUT) isInput = true;
      if (this.currentToken.type === TokenType.STATIC) isStatic = true;
      if (this.currentToken.type === TokenType.CONST) isConst = true;
      this.advance();
    }

    // Parse type
    const varType = this.currentToken.value;
    this.advance();

    // Parse name
    const name = this.expect(TokenType.IDENTIFIER).value;

    // Check for array
    let arraySize = null;
    if (this.match(TokenType.LBRACKET)) {
      this.advance();
      if (!this.match(TokenType.RBRACKET)) {
        arraySize = this.parseExpression();
      }
      this.expect(TokenType.RBRACKET);
    }

    // Parse default value
    let defaultValue = null;
    if (this.match(TokenType.ASSIGN)) {
      this.advance();
      defaultValue = this.parseExpression();
    }

    this.expect(TokenType.SEMICOLON);

    return new VariableDeclaration(varType, name, isInput, isStatic, isConst, defaultValue, arraySize);
  }

  parseFunctionDeclaration() {
    // Parse return type
    const returnType = this.currentToken.value;
    this.advance();

    // Parse function name
    const name = this.expect(TokenType.IDENTIFIER).value;

    // Parse parameters
    this.expect(TokenType.LPAREN);
    const parameters = this.parseParameterList();
    this.expect(TokenType.RPAREN);

    // Parse body
    const body = this.parseBlockStatement();

    return new FunctionDeclaration(returnType, name, parameters, body);
  }

  parseParameterList() {
    const params = [];

    while (!this.match(TokenType.RPAREN)) {
      // Parse parameter type
      const type = this.currentToken.value;
      this.advance();

      // Check for & (reference parameter)
      let isReference = false;
      if (this.match(TokenType.BITWISE_AND)) {
        isReference = true;
        this.advance();
      }

      // Parse parameter name
      const name = this.expect(TokenType.IDENTIFIER).value;

      // Check for array
      let isArray = false;
      if (this.match(TokenType.LBRACKET)) {
        isArray = true;
        this.advance();
        this.expect(TokenType.RBRACKET);
      }

      // Check for default value
      let defaultValue = null;
      if (this.match(TokenType.ASSIGN)) {
        this.advance();
        defaultValue = this.parseExpression();
      }

      params.push({ type, name, isReference, isArray, defaultValue });

      if (this.match(TokenType.COMMA)) {
        this.advance();
      }
    }

    return params;
  }

  parseEnumDeclaration() {
    this.expect(TokenType.ENUM);
    const name = this.expect(TokenType.IDENTIFIER).value;
    this.expect(TokenType.LBRACE);

    const values = [];
    while (!this.match(TokenType.RBRACE)) {
      const valueName = this.expect(TokenType.IDENTIFIER).value;

      let value = null;
      if (this.match(TokenType.ASSIGN)) {
        this.advance();
        value = this.parseExpression();
      }

      values.push({ name: valueName, value });

      if (this.match(TokenType.COMMA)) {
        this.advance();
      }
    }

    this.expect(TokenType.RBRACE);
    this.expect(TokenType.SEMICOLON);

    return { type: 'EnumDeclaration', name, values };
  }

  parseBlockStatement() {
    this.expect(TokenType.LBRACE);
    const statements = [];

    while (!this.match(TokenType.RBRACE)) {
      const stmt = this.parseStatement();
      if (stmt) {
        statements.push(stmt);
      }
    }

    this.expect(TokenType.RBRACE);
    return new BlockStatement(statements);
  }

  parseStatement() {
    // Control flow statements
    if (this.match(TokenType.IF)) {
      return this.parseIfStatement();
    }

    if (this.match(TokenType.FOR)) {
      return this.parseForStatement();
    }

    if (this.match(TokenType.WHILE)) {
      return this.parseWhileStatement();
    }

    if (this.match(TokenType.RETURN)) {
      return this.parseReturnStatement();
    }

    if (this.match(TokenType.BREAK)) {
      this.advance();
      this.expect(TokenType.SEMICOLON);
      return new BreakStatement();
    }

    if (this.match(TokenType.CONTINUE)) {
      this.advance();
      this.expect(TokenType.SEMICOLON);
      return new ContinueStatement();
    }

    // Block statement
    if (this.match(TokenType.LBRACE)) {
      return this.parseBlockStatement();
    }

    // Expression statement
    const expr = this.parseExpression();
    this.expect(TokenType.SEMICOLON);
    return new ExpressionStatement(expr);
  }

  parseIfStatement() {
    this.expect(TokenType.IF);
    this.expect(TokenType.LPAREN);
    const condition = this.parseExpression();
    this.expect(TokenType.RPAREN);

    const thenBranch = this.parseStatement();

    let elseBranch = null;
    if (this.match(TokenType.ELSE)) {
      this.advance();
      elseBranch = this.parseStatement();
    }

    return new IfStatement(condition, thenBranch, elseBranch);
  }

  parseForStatement() {
    this.expect(TokenType.FOR);
    this.expect(TokenType.LPAREN);

    // Init
    const init = this.parseExpression();
    this.expect(TokenType.SEMICOLON);

    // Condition
    const condition = this.parseExpression();
    this.expect(TokenType.SEMICOLON);

    // Increment
    const increment = this.parseExpression();
    this.expect(TokenType.RPAREN);

    // Body
    const body = this.parseStatement();

    return new ForStatement(init, condition, increment, body);
  }

  parseWhileStatement() {
    this.expect(TokenType.WHILE);
    this.expect(TokenType.LPAREN);
    const condition = this.parseExpression();
    this.expect(TokenType.RPAREN);

    const body = this.parseStatement();

    return new WhileStatement(condition, body);
  }

  parseReturnStatement() {
    this.expect(TokenType.RETURN);

    let value = null;
    if (!this.match(TokenType.SEMICOLON)) {
      value = this.parseExpression();
    }

    this.expect(TokenType.SEMICOLON);
    return new ReturnStatement(value);
  }

  // Expression parsing (operator precedence)
  parseExpression() {
    return this.parseConditional();
  }

  parseConditional() {
    let expr = this.parseLogicalOr();

    if (this.match(TokenType.QUESTION)) {
      this.advance();
      const thenExpr = this.parseExpression();
      this.expect(TokenType.COLON);
      const elseExpr = this.parseExpression();
      return new ConditionalExpression(expr, thenExpr, elseExpr);
    }

    return expr;
  }

  parseLogicalOr() {
    let left = this.parseLogicalAnd();

    while (this.match(TokenType.LOGICAL_OR)) {
      const operator = this.currentToken.value;
      this.advance();
      const right = this.parseLogicalAnd();
      left = new BinaryExpression(left, operator, right);
    }

    return left;
  }

  parseLogicalAnd() {
    let left = this.parseBitwiseOr();

    while (this.match(TokenType.LOGICAL_AND)) {
      const operator = this.currentToken.value;
      this.advance();
      const right = this.parseBitwiseOr();
      left = new BinaryExpression(left, operator, right);
    }

    return left;
  }

  parseBitwiseOr() {
    let left = this.parseBitwiseXor();

    while (this.match(TokenType.BITWISE_OR)) {
      const operator = this.currentToken.value;
      this.advance();
      const right = this.parseBitwiseXor();
      left = new BinaryExpression(left, operator, right);
    }

    return left;
  }

  parseBitwiseXor() {
    let left = this.parseBitwiseAnd();

    while (this.match(TokenType.BITWISE_XOR)) {
      const operator = this.currentToken.value;
      this.advance();
      const right = this.parseBitwiseAnd();
      left = new BinaryExpression(left, operator, right);
    }

    return left;
  }

  parseBitwiseAnd() {
    let left = this.parseEquality();

    while (this.match(TokenType.BITWISE_AND)) {
      const operator = this.currentToken.value;
      this.advance();
      const right = this.parseEquality();
      left = new BinaryExpression(left, operator, right);
    }

    return left;
  }

  parseEquality() {
    let left = this.parseComparison();

    while (this.match(TokenType.EQUAL, TokenType.NOT_EQUAL)) {
      const operator = this.currentToken.value;
      this.advance();
      const right = this.parseComparison();
      left = new BinaryExpression(left, operator, right);
    }

    return left;
  }

  parseComparison() {
    let left = this.parseShift();

    while (this.match(TokenType.GREATER, TokenType.LESS, TokenType.GREATER_EQUAL, TokenType.LESS_EQUAL)) {
      const operator = this.currentToken.value;
      this.advance();
      const right = this.parseShift();
      left = new BinaryExpression(left, operator, right);
    }

    return left;
  }

  parseShift() {
    let left = this.parseAddition();

    while (this.match(TokenType.LEFT_SHIFT, TokenType.RIGHT_SHIFT)) {
      const operator = this.currentToken.value;
      this.advance();
      const right = this.parseAddition();
      left = new BinaryExpression(left, operator, right);
    }

    return left;
  }

  parseAddition() {
    let left = this.parseMultiplication();

    while (this.match(TokenType.PLUS, TokenType.MINUS)) {
      const operator = this.currentToken.value;
      this.advance();
      const right = this.parseMultiplication();
      left = new BinaryExpression(left, operator, right);
    }

    return left;
  }

  parseMultiplication() {
    let left = this.parseUnary();

    while (this.match(TokenType.MULTIPLY, TokenType.DIVIDE, TokenType.MODULO)) {
      const operator = this.currentToken.value;
      this.advance();
      const right = this.parseUnary();
      left = new BinaryExpression(left, operator, right);
    }

    return left;
  }

  parseUnary() {
    if (this.match(TokenType.LOGICAL_NOT, TokenType.BITWISE_NOT, TokenType.MINUS, TokenType.PLUS)) {
      const operator = this.currentToken.value;
      this.advance();
      const operand = this.parseUnary();
      return new UnaryExpression(operator, operand, true);
    }

    if (this.match(TokenType.INCREMENT, TokenType.DECREMENT)) {
      const operator = this.currentToken.value;
      this.advance();
      const operand = this.parsePostfix();
      return new UnaryExpression(operator, operand, true);
    }

    return this.parsePostfix();
  }

  parsePostfix() {
    let expr = this.parseAssignment();

    while (true) {
      if (this.match(TokenType.INCREMENT, TokenType.DECREMENT)) {
        const operator = this.currentToken.value;
        this.advance();
        expr = new UnaryExpression(operator, expr, false);
      } else if (this.match(TokenType.LBRACKET)) {
        this.advance();
        const index = this.parseExpression();
        this.expect(TokenType.RBRACKET);
        expr = new ArrayAccess(expr, index);
      } else {
        break;
      }
    }

    return expr;
  }

  parseAssignment() {
    let expr = this.parsePrimary();

    if (this.match(TokenType.ASSIGN, TokenType.PLUS_ASSIGN, TokenType.MINUS_ASSIGN,
                   TokenType.MULTIPLY_ASSIGN, TokenType.DIVIDE_ASSIGN)) {
      const operator = this.currentToken.value;
      this.advance();
      const right = this.parseExpression();
      return new AssignmentExpression(expr, operator, right);
    }

    return expr;
  }

  parsePrimary() {
    // Literals
    if (this.match(TokenType.NUMBER)) {
      const value = this.currentToken.value;
      this.advance();
      return new NumberLiteral(value);
    }

    if (this.match(TokenType.STRING_LITERAL)) {
      const value = this.currentToken.value;
      this.advance();
      return new StringLiteral(value);
    }

    if (this.match(TokenType.TRUE, TokenType.FALSE)) {
      const value = this.currentToken.type === TokenType.TRUE;
      this.advance();
      return new BooleanLiteral(value);
    }

    if (this.match(TokenType.NULL)) {
      this.advance();
      return new NumberLiteral(0); // MQL5 NULL is 0
    }

    // Identifiers and function calls
    if (this.match(TokenType.IDENTIFIER)) {
      const name = this.currentToken.value;
      this.advance();

      // Function call
      if (this.match(TokenType.LPAREN)) {
        this.advance();
        const args = this.parseArgumentList();
        this.expect(TokenType.RPAREN);
        return new CallExpression(name, args);
      }

      // Variable reference
      return new Identifier(name);
    }

    // Parenthesized expression
    if (this.match(TokenType.LPAREN)) {
      this.advance();
      const expr = this.parseExpression();
      this.expect(TokenType.RPAREN);
      return expr;
    }

    this.error(`Unexpected token in expression: ${this.currentToken.type}`);
  }

  parseArgumentList() {
    const args = [];

    while (!this.match(TokenType.RPAREN)) {
      args.push(this.parseExpression());

      if (this.match(TokenType.COMMA)) {
        this.advance();
      } else {
        break;
      }
    }

    return args;
  }
}

export {
  Parser,
  Program,
  FunctionDeclaration,
  VariableDeclaration,
  IfStatement,
  ForStatement,
  WhileStatement,
  ReturnStatement,
  BreakStatement,
  ContinueStatement,
  ExpressionStatement,
  CallExpression,
  BinaryExpression,
  UnaryExpression,
  AssignmentExpression,
  ConditionalExpression,
  Identifier,
  NumberLiteral,
  StringLiteral,
  BooleanLiteral,
  ArrayAccess,
  BlockStatement
};
