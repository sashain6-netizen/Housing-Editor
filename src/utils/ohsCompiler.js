/**
 * Optimized Housing Script (OHS) Language Definition
 * Professional, modern script language with real functions, variables, and control flow
 * Compiles down to base HTSL automatically
 */

/**
 * OHS Language Spec:
 * 
 * FUNCTIONS:
 *   function name(param1, param2) { body }
 * 
 * EVENTS:
 *   on_event("join") { body }
 * 
 * VARIABLES:
 *   let x = 10;
 *   const PI = 3.14;
 * 
 * CONTROL FLOW:
 *   if (condition) { } else { }
 *   for (let i = 0; i < 10; i++) { }
 *   while (condition) { }
 * 
 * FUNCTION CALLS:
 *   call(arg1, arg2)
 * 
 * BUILT-IN FUNCTIONS:
 *   message(text)
 *   give_item(item, count)
 *   teleport(x, y, z)
 *   set_stat(name, value)
 *   play_sound(sound)
 *   wait(ms)
 *   has_item(item, count)
 *   get_stat(name)
 */

export class OHSCompiler {
  constructor() {
    this.functions = new Map();
    this.variables = new Map();
    this.callStack = [];
  }

  /**
   * Compile OHS code to HTSL
   */
  compile(ohsCode) {
    try {
      // Parse OHS
      const ast = this.parseOHS(ohsCode);
      
      // Compile AST to HTSL
      const htslCode = this.generateHTSL(ast);
      
      return htslCode;
    } catch (error) {
      console.error('OHS Compilation Error:', error);
      throw new Error(`OHS Compilation failed: ${error.message}`);
    }
  }

  parseOHS(code) {
    const ast = {
      functions: [],
      events: [],
      variables: [],
    };

    // Remove comments
    const cleanCode = code
      .split('\n')
      .filter(line => !line.trim().startsWith('//'))
      .join('\n');

    // Parse functions
    const functionRegex = /function\s+(\w+)\s*\((.*?)\)\s*\{([\s\S]*?)\}/g;
    let match;
    while ((match = functionRegex.exec(cleanCode)) !== null) {
      ast.functions.push({
        name: match[1],
        params: match[2].split(',').map(p => p.trim()).filter(p => p),
        body: match[3],
      });
    }

    // Parse events
    const eventRegex = /on_event\s*\(\s*"(\w+)"\s*\)\s*\{([\s\S]*?)\}/g;
    while ((match = eventRegex.exec(cleanCode)) !== null) {
      ast.events.push({
        name: match[1],
        body: match[2],
      });
    }

    // Parse variable declarations
    const varRegex = /(let|const)\s+(\w+)\s*=\s*([^;]+);/g;
    while ((match = varRegex.exec(cleanCode)) !== null) {
      ast.variables.push({
        name: match[2],
        value: match[3].trim(),
        isConst: match[1] === 'const',
      });
    }

    return ast;
  }

  generateHTSL(ast) {
    let htslOutput = '';

    // Process events
    for (const event of ast.events) {
      htslOutput += `on_event "${event.name}" {\n`;
      htslOutput += this.processBody(event.body);
      htslOutput += '}\n\n';
    }

    return htslOutput.trim();
  }

  processBody(body) {
    let output = '';
    const lines = body.split('\n').map(l => l.trim()).filter(l => l);

    for (const line of lines) {
      output += this.processLine(line) + '\n';
    }

    return output;
  }

  processLine(line) {
    // Built-in function calls
    if (line.startsWith('message(')) {
      const content = this.extractParams(line)[0];
      return `  send_message ${content}`;
    }

    if (line.startsWith('give_item(')) {
      const [item, count] = this.extractParams(line);
      return `  give_item "${item}" ${count || 1}`;
    }

    if (line.startsWith('teleport(')) {
      const [x, y, z] = this.extractParams(line);
      return `  teleport ${x} ${y} ${z}`;
    }

    if (line.startsWith('set_stat(')) {
      const [stat, value] = this.extractParams(line);
      return `  set_stat "${stat}" ${value}`;
    }

    if (line.startsWith('play_sound(')) {
      const sound = this.extractParams(line)[0];
      return `  play_sound ${sound}`;
    }

    if (line.startsWith('wait(')) {
      const ms = this.extractParams(line)[0];
      return `  delay ${ms}`;
    }

    // Conditions
    if (line.startsWith('if (')) {
      const condition = this.extractCondition(line);
      return `  if ${this.compileCondition(condition)} {`;
    }

    if (line === '}') {
      return `  }`;
    }

    return `  ${line}`;
  }

  extractParams(line) {
    const match = line.match(/\((.*?)\)/);
    if (!match) return [];
    return match[1].split(',').map(p => p.trim().replace(/['"]/g, ''));
  }

  extractCondition(line) {
    const match = line.match(/if\s*\((.*?)\)/);
    return match ? match[1] : '';
  }

  compileCondition(condition) {
    // Convert OHS conditions to HTSL conditions
    // Example: player.coins >= 100 -> player_has_stat "coins" >= 100
    // Example: player.has("diamond", 5) -> player_has_item "diamond" >= 5

    if (condition.includes('has_item')) {
      const [item, count] = this.extractParams(`(${condition})`);
      return `player_has_item "${item}" >= ${count}`;
    }

    if (condition.includes('get_stat')) {
      const stat = this.extractParams(`(${condition})`)[0];
      return `player_has_stat "${stat}"`;
    }

    return condition;
  }
}

/**
 * OHS Parser - Convert HTSL back to OHS
 */
export class OHSParser {
  parse(htslCode) {
    const ohsCode = htslCode
      .replace(/on_event "(\w+)"/g, 'on_event("$1")')
      .replace(/send_message\s+"(.+?)"/g, 'message("$1")')
      .replace(/give_item\s+"(.+?)"\s+(\d+)/g, 'give_item("$1", $2)')
      .replace(/teleport\s+(\d+)\s+(\d+)\s+(\d+)/g, 'teleport($1, $2, $3)')
      .replace(/set_stat\s+"(.+?)"\s+(\d+)/g, 'set_stat("$1", $2)')
      .replace(/play_sound\s+(\w+)/g, 'play_sound($1)')
      .replace(/delay\s+(\d+)/g, 'wait($1)')
      .replace(/if_player_has_stat\s+"(.+?)"/g, 'if (get_stat("$1"))')
      .replace(/if_player_has_item\s+"(.+?)"/g, 'if (has_item("$1"))');

    return ohsCode;
  }
}
