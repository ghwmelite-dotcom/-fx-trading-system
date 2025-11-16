/**
 * MQL5 to JavaScript Transpiler
 * Converts MQL5 AST to executable JavaScript code
 */

class Transpiler {
  constructor(ast) {
    this.ast = ast;
    this.indentLevel = 0;
    this.globalVariables = [];
  }

  indent() {
    return '  '.repeat(this.indentLevel);
  }

  transpile() {
    // Extract input parameters and global variables
    const inputs = this.extractInputParameters(this.ast);
    const globals = this.extractGlobalVariables(this.ast);
    const functions = this.transpileFunctions(this.ast);

    // Generate JavaScript class
    return `// Auto-generated from MQL5 Expert Advisor
// Transpiled on ${new Date().toISOString()}

class EA {
  constructor(parameters = {}, mt5api) {
    // Inject MT5 API
    this.mt5 = mt5api;

    // Input parameters with defaults
${inputs.map(input => `    this.${input.name} = parameters.${input.name} !== undefined ? parameters.${input.name} : ${input.defaultValue};`).join('\n')}

    // Global variables
${globals.map(g => `    this.${g.name} = ${g.defaultValue};`).join('\n')}

    // Internal state
    this._initialized = false;
  }

${functions}
}

export default EA;
`;
  }

  extractInputParameters(ast) {
    const inputs = [];

    for (const decl of ast.declarations) {
      if (decl.type === 'VariableDeclaration' && decl.isInput) {
        inputs.push({
          name: decl.name,
          varType: decl.varType,
          defaultValue: decl.defaultValue ? this.transpileExpression(decl.defaultValue) : this.getDefaultValue(decl.varType)
        });
      }
    }

    return inputs;
  }

  extractGlobalVariables(ast) {
    const globals = [];

    for (const decl of ast.declarations) {
      if (decl.type === 'VariableDeclaration' && !decl.isInput) {
        this.globalVariables.push(decl.name);
        globals.push({
          name: decl.name,
          varType: decl.varType,
          defaultValue: decl.defaultValue ? this.transpileExpression(decl.defaultValue) : this.getDefaultValue(decl.varType)
        });
      }
    }

    return globals;
  }

  getDefaultValue(type) {
    const defaults = {
      'int': '0',
      'double': '0.0',
      'string': '""',
      'bool': 'false',
      'datetime': '0',
      'long': '0',
      'float': '0.0',
      'uint': '0',
      'ulong': '0',
      'short': '0',
      'ushort': '0',
      'char': '0',
      'uchar': '0',
      'color': '0'
    };

    return defaults[type.toLowerCase()] || '0';
  }

  transpileFunctions(ast) {
    const functions = [];

    for (const decl of ast.declarations) {
      if (decl.type === 'FunctionDeclaration') {
        functions.push(this.transpileFunction(decl));
      }
    }

    return functions.join('\n\n');
  }

  transpileFunction(func) {
    this.indentLevel = 1;
    const params = func.parameters.map(p => p.name).join(', ');
    const body = this.transpileStatement(func.body);

    return `  ${func.name}(${params}) {
${body}
  }`;
  }

  transpileStatement(stmt) {
    if (!stmt) return '';

    switch (stmt.type) {
      case 'BlockStatement':
        return this.transpileBlockStatement(stmt);
      case 'IfStatement':
        return this.transpileIfStatement(stmt);
      case 'ForStatement':
        return this.transpileForStatement(stmt);
      case 'WhileStatement':
        return this.transpileWhileStatement(stmt);
      case 'ReturnStatement':
        return this.transpileReturnStatement(stmt);
      case 'BreakStatement':
        return `${this.indent()}break;`;
      case 'ContinueStatement':
        return `${this.indent()}continue;`;
      case 'ExpressionStatement':
        return `${this.indent()}${this.transpileExpression(stmt.expression)};`;
      default:
        return `${this.indent()}// Unknown statement: ${stmt.type}`;
    }
  }

  transpileBlockStatement(stmt) {
    const statements = stmt.statements.map(s => this.transpileStatement(s)).join('\n');
    return statements;
  }

  transpileIfStatement(stmt) {
    const condition = this.transpileExpression(stmt.condition);

    this.indentLevel++;
    const thenBranch = this.transpileStatement(stmt.thenBranch);
    this.indentLevel--;

    let result = `${this.indent()}if (${condition}) {\n${thenBranch}\n${this.indent()}}`;

    if (stmt.elseBranch) {
      this.indentLevel++;
      const elseBranch = this.transpileStatement(stmt.elseBranch);
      this.indentLevel--;

      if (stmt.elseBranch.type === 'IfStatement') {
        // else if
        result += ` else ${elseBranch.trim()}`;
      } else {
        result += ` else {\n${elseBranch}\n${this.indent()}}`;
      }
    }

    return result;
  }

  transpileForStatement(stmt) {
    const init = this.transpileExpression(stmt.init);
    const condition = this.transpileExpression(stmt.condition);
    const increment = this.transpileExpression(stmt.increment);

    this.indentLevel++;
    const body = this.transpileStatement(stmt.body);
    this.indentLevel--;

    if (stmt.body.type === 'BlockStatement') {
      return `${this.indent()}for (${init}; ${condition}; ${increment}) {\n${body}\n${this.indent()}}`;
    } else {
      return `${this.indent()}for (${init}; ${condition}; ${increment}) {\n${body}\n${this.indent()}}`;
    }
  }

  transpileWhileStatement(stmt) {
    const condition = this.transpileExpression(stmt.condition);

    this.indentLevel++;
    const body = this.transpileStatement(stmt.body);
    this.indentLevel--;

    return `${this.indent()}while (${condition}) {\n${body}\n${this.indent()}}`;
  }

  transpileReturnStatement(stmt) {
    if (stmt.value) {
      return `${this.indent()}return ${this.transpileExpression(stmt.value)};`;
    }
    return `${this.indent()}return;`;
  }

  transpileExpression(expr) {
    if (!expr) return '';

    switch (expr.type) {
      case 'NumberLiteral':
        return expr.value.toString();

      case 'StringLiteral':
        return `"${expr.value.replace(/"/g, '\\"')}"`;

      case 'BooleanLiteral':
        return expr.value ? 'true' : 'false';

      case 'Identifier':
        return this.transpileIdentifier(expr.name);

      case 'BinaryExpression':
        return this.transpileBinaryExpression(expr);

      case 'UnaryExpression':
        return this.transpileUnaryExpression(expr);

      case 'AssignmentExpression':
        return this.transpileAssignmentExpression(expr);

      case 'ConditionalExpression':
        return this.transpileConditionalExpression(expr);

      case 'CallExpression':
        return this.transpileCallExpression(expr);

      case 'ArrayAccess':
        return this.transpileArrayAccess(expr);

      default:
        return `/* Unknown expression: ${expr.type} */`;
    }
  }

  transpileIdentifier(name) {
    // Check if it's a global variable or input parameter
    if (this.globalVariables.includes(name)) {
      return `this.${name}`;
    }

    // Check for MQL5 built-in constants/functions that are just identifiers
    const builtInConstants = {
      'Bid': 'this.mt5.Bid()',
      'Ask': 'this.mt5.Ask()',
      'Point': 'this.mt5.Point()',
      'Digits': 'this.mt5.Digits()',
      'Bars': 'this.mt5.Bars()',
      'OP_BUY': '0',
      'OP_SELL': '1',
      'MODE_TRADES': '0',
      'MODE_HISTORY': '1',
      'PERIOD_M1': '1',
      'PERIOD_M5': '5',
      'PERIOD_M15': '15',
      'PERIOD_M30': '30',
      'PERIOD_H1': '60',
      'PERIOD_H4': '240',
      'PERIOD_D1': '1440',
      'PERIOD_W1': '10080',
      'PERIOD_MN1': '43200',
      'MODE_MAIN': '0',
      'MODE_SIGNAL': '1',
      'MODE_UPPER': '1',
      'MODE_LOWER': '2',
      'MODE_SMA': '0',
      'MODE_EMA': '1',
      'PRICE_CLOSE': '0',
      'PRICE_OPEN': '1',
      'PRICE_HIGH': '2',
      'PRICE_LOW': '3'
    };

    if (builtInConstants[name]) {
      return builtInConstants[name];
    }

    // Local variable
    return name;
  }

  transpileBinaryExpression(expr) {
    const left = this.transpileExpression(expr.left);
    const right = this.transpileExpression(expr.right);
    return `(${left} ${expr.operator} ${right})`;
  }

  transpileUnaryExpression(expr) {
    const operand = this.transpileExpression(expr.operand);

    if (expr.isPrefix) {
      return `${expr.operator}${operand}`;
    } else {
      return `${operand}${expr.operator}`;
    }
  }

  transpileAssignmentExpression(expr) {
    const left = this.transpileExpression(expr.left);
    const right = this.transpileExpression(expr.right);
    return `${left} ${expr.operator} ${right}`;
  }

  transpileConditionalExpression(expr) {
    const condition = this.transpileExpression(expr.condition);
    const thenExpr = this.transpileExpression(expr.thenExpr);
    const elseExpr = this.transpileExpression(expr.elseExpr);
    return `(${condition} ? ${thenExpr} : ${elseExpr})`;
  }

  transpileCallExpression(expr) {
    const args = expr.arguments.map(arg => this.transpileExpression(arg)).join(', ');

    // Map MQL5 functions to MT5 API methods
    const functionMap = {
      // Trading functions
      'OrderSend': 'this.mt5.OrderSend',
      'OrderClose': 'this.mt5.OrderClose',
      'OrderModify': 'this.mt5.OrderModify',
      'OrderDelete': 'this.mt5.OrderDelete',
      'OrdersTotal': 'this.mt5.OrdersTotal',
      'OrderSelect': 'this.mt5.OrderSelect',
      'OrderTicket': 'this.mt5.OrderTicket',
      'OrderType': 'this.mt5.OrderType',
      'OrderLots': 'this.mt5.OrderLots',
      'OrderOpenPrice': 'this.mt5.OrderOpenPrice',
      'OrderClosePrice': 'this.mt5.OrderClosePrice',
      'OrderStopLoss': 'this.mt5.OrderStopLoss',
      'OrderTakeProfit': 'this.mt5.OrderTakeProfit',
      'OrderProfit': 'this.mt5.OrderProfit',
      'OrderSymbol': 'this.mt5.OrderSymbol',
      'OrderMagicNumber': 'this.mt5.OrderMagicNumber',

      // Market data functions
      'Symbol': 'this.mt5.Symbol',
      'Period': 'this.mt5.Period',
      'iClose': 'this.mt5.iClose',
      'iOpen': 'this.mt5.iOpen',
      'iHigh': 'this.mt5.iHigh',
      'iLow': 'this.mt5.iLow',
      'iVolume': 'this.mt5.iVolume',
      'iTime': 'this.mt5.iTime',

      // Indicator functions
      'iMA': 'this.mt5.iMA',
      'iRSI': 'this.mt5.iRSI',
      'iMACD': 'this.mt5.iMACD',
      'iBands': 'this.mt5.iBands',
      'iATR': 'this.mt5.iATR',
      'iStochastic': 'this.mt5.iStochastic',
      'iCCI': 'this.mt5.iCCI',
      'iMomentum': 'this.mt5.iMomentum',
      'iADX': 'this.mt5.iADX',
      'iAlligator': 'this.mt5.iAlligator',
      'iAO': 'this.mt5.iAO',
      'iBearsPower': 'this.mt5.iBearsPower',
      'iBullsPower': 'this.mt5.iBullsPower',

      // Account functions
      'AccountBalance': 'this.mt5.AccountBalance',
      'AccountEquity': 'this.mt5.AccountEquity',
      'AccountProfit': 'this.mt5.AccountProfit',
      'AccountFreeMargin': 'this.mt5.AccountFreeMargin',

      // Utility functions
      'Print': 'console.log',
      'Alert': 'console.warn',
      'Comment': 'console.info',
      'MathMax': 'Math.max',
      'MathMin': 'Math.min',
      'MathAbs': 'Math.abs',
      'MathSqrt': 'Math.sqrt',
      'MathPow': 'Math.pow',
      'MathRound': 'Math.round',
      'MathFloor': 'Math.floor',
      'MathCeil': 'Math.ceil',
      'StringFormat': 'this.mt5.StringFormat'
    };

    const mappedFunction = functionMap[expr.callee] || expr.callee;

    return `${mappedFunction}(${args})`;
  }

  transpileArrayAccess(expr) {
    const array = this.transpileExpression(expr.array);
    const index = this.transpileExpression(expr.index);
    return `${array}[${index}]`;
  }

  // Extract input parameters for UI configuration
  extractInputParametersMetadata(ast) {
    const inputs = [];

    for (const decl of ast.declarations) {
      if (decl.type === 'VariableDeclaration' && decl.isInput) {
        inputs.push({
          name: decl.name,
          type: decl.varType,
          defaultValue: decl.defaultValue ? this.transpileExpression(decl.defaultValue) : this.getDefaultValue(decl.varType),
          description: `${decl.varType} parameter`
        });
      }
    }

    return inputs;
  }
}

export { Transpiler };
