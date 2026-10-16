type Token = { value: string; kind: 'word' | 'quoted' | 'literal' | 'symbol'; end: number };

export class QueryGuardError extends Error {
  constructor(message: string) { super(message); this.name = 'QueryGuardError'; }
}

const blockedWords = new Set(`insert update delete merge truncate alter grant revoke vacuum analyze reindex refresh copy do call execute prepare deallocate set reset begin commit rollback savepoint release create drop into lock security definer recursive current_date current_time current_timestamp localtime localtimestamp current_user session_user current_role system_user tablesample operator collate`.split(' '));
const safeFunctions = new Set(`count sum avg min max round ceil ceiling floor abs mod power sqrt coalesce nullif greatest least lower upper length char_length trim ltrim rtrim substring substr left right replace concat concat_ws date_trunc date_part extract to_char to_date rank dense_rank row_number lag lead first_value last_value nth_value ntile percent_rank cume_dist`.split(' '));
// These syntax words can legally precede a parenthesized expression without being functions.
const parenSyntax = new Set(`select from where having and or not as in exists any all some over filter within group values distinct union except intersect on using case when then else end join inner left right full cross lateral with partition by order limit offset fetch cast`.split(' '));
const typeNames = new Set(`numeric decimal varchar character char bit timestamp time interval`.split(' '));
const tableColumns: Record<string, string[]> = {
  customers: ['id', 'name', 'email', 'city'],
  products: ['id', 'name', 'category', 'price'],
  orders: ['id', 'customer_id', 'order_date', 'status', 'total'],
  order_items: ['id', 'order_id', 'product_id', 'quantity', 'unit_price'],
};

/** Conservative PostgreSQL lexical boundary. Supports nested comments, quoted names and dollar strings.
 * Deliberately rejects unsupported syntax instead of attempting to "clean" dangerous SQL. */
export function tokenize(sql: string): Token[] {
  if (sql.length > 16000) throw new QueryGuardError('SQL is limited to 16,000 characters.');
  if (sql.includes('\0')) throw new QueryGuardError('SQL cannot contain a NUL character.');
  const result: Token[] = [];
  let i = 0;
  while (i < sql.length) {
    const c = sql[i];
    if (/\s/.test(c)) { i++; continue; }
    if (sql.startsWith('--', i)) { const end = sql.indexOf('\n', i + 2); i = end < 0 ? sql.length : end + 1; continue; }
    if (sql.startsWith('/*', i)) {
      let depth = 1; i += 2;
      while (i < sql.length && depth) {
        if (sql.startsWith('/*', i)) { depth++; i += 2; }
        else if (sql.startsWith('*/', i)) { depth--; i += 2; }
        else i++;
      }
      if (depth) throw new QueryGuardError('Unclosed SQL comment.');
      continue;
    }
    if (c === "'" || c === '"') {
      const delimiter = c; const start = i++; let value = ''; let closed = false;
      if (delimiter === "'" && result.at(-1)?.value === 'e' && result.at(-1)?.end === start) {
        throw new QueryGuardError('Escape-prefixed string literals are not supported; use ordinary quoted strings.');
      }
      while (i < sql.length) {
        if (sql[i] === delimiter) {
          if (sql[i + 1] === delimiter) { value += delimiter; i += 2; }
          else { i++; closed = true; break; }
        } else value += sql[i++];
      }
      if (!closed) throw new QueryGuardError('Unclosed SQL quote.');
      result.push({ value: delimiter === '"' ? value : '', kind: delimiter === '"' ? 'quoted' : 'literal', end: i });
      continue;
    }
    if (c === '$') {
      const tag = sql.slice(i).match(/^\$(?:[A-Za-z_][A-Za-z_0-9]*)?\$/)?.[0];
      if (!tag) throw new QueryGuardError('SQL parameters are not supported in this playground.');
      const end = sql.indexOf(tag, i + tag.length);
      if (end < 0) throw new QueryGuardError('Unclosed dollar-quoted string.');
      i = end + tag.length;
      result.push({ value: '', kind: 'literal', end: i });
      continue;
    }
    const word = sql.slice(i).match(/^[A-Za-z_][A-Za-z_0-9$]*/)?.[0];
    if (word) { i += word.length; result.push({ value: word.toLowerCase(), kind: 'word', end: i }); continue; }
    const number = sql.slice(i).match(/^(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?/i)?.[0];
    if (number) { i += number.length; result.push({ value: number, kind: 'literal', end: i }); continue; }
    if (!'(),;.*+-/%=<>!|:&[]'.includes(c)) throw new QueryGuardError(`Unsupported SQL character: ${c}`);
    result.push({ value: c, kind: 'symbol', end: ++i });
  }
  return result;
}

export type GuardedSql =
  | { kind: 'read'; sql: string; explained: boolean }
  | { kind: 'index'; sql: string; operation: 'create' | 'drop'; name: string; table?: string };

/** Uses the same lexical scanner so semicolons inside strings/comments cannot split a batch. */
export function splitStatements(input: string, maximum = 5): string[] {
  const tokens = tokenize(input);
  const statements: string[] = [];
  let start = 0;
  for (const token of tokens) {
    if (token.kind === 'symbol' && token.value === ';') {
      const statement = input.slice(start, token.end - 1).trim();
      if (tokenize(statement).length) statements.push(statement);
      start = token.end;
    }
  }
  const tail = input.slice(start).trim();
  if (tokenize(tail).length) statements.push(tail);
  if (!statements.length) throw new QueryGuardError('Write a SELECT query to begin.');
  if (statements.length > maximum) throw new QueryGuardError(`Run up to ${maximum} statements at a time.`);
  // Validate the entire batch before its first mutation, preventing partial writes for rejected syntax.
  statements.forEach(guardSql);
  return statements;
}

export function hasTopLevelOrder(sql: string): boolean {
  const tokens = tokenize(sql); let depth = 0;
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i].kind === 'symbol' && tokens[i].value === '(') depth++;
    else if (tokens[i].kind === 'symbol' && tokens[i].value === ')') depth--;
    else if (depth === 0 && tokens[i].kind === 'word' && tokens[i].value === 'order' && tokens[i + 1]?.value === 'by') return true;
  }
  return false;
}

function singleStatement(sql: string): { sql: string; tokens: Token[] } {
  const tokens = tokenize(sql);
  if (!tokens.length) throw new QueryGuardError('Write a SELECT query to begin.');
  const separators = tokens.map((t, i) => t.value === ';' && t.kind === 'symbol' ? i : -1).filter(i => i >= 0);
  if (separators.length > 1 || (separators.length === 1 && separators[0] !== tokens.length - 1)) {
    throw new QueryGuardError('Run one SQL statement at a time.');
  }
  if (separators.length) {
    const final = tokens.pop()!;
    // Remove trailing comments too, so an injected wrapper cannot be commented out.
    sql = sql.slice(0, final.end - 1);
  }
  const normalized = sql.trim();
  return { sql: normalized, tokens: tokenize(normalized) };
}

function indexSql(tokens: Token[]): GuardedSql {
  let i = 0;
  const next = () => tokens[i++];
  const accept = (value: string) => { if (tokens[i]?.value === value) { i++; return true; } return false; };
  const need = (value: string) => { if (!accept(value)) throw new QueryGuardError(`Expected ${value.toUpperCase()} in index statement.`); };
  const identifier = () => {
    const t = next();
    if (!t || !['word', 'quoted'].includes(t.kind) || !/^[a-z_][a-z_0-9]{0,62}$/.test(t.value)) {
      throw new QueryGuardError('Use simple lowercase index, table and column names.');
    }
    return t.value;
  };
  const quote = (s: string) => `"${s}"`;
  const operation = identifier();
  need('index');
  let conditional = '';
  if (accept('if')) {
    if (operation === 'create') { need('not'); conditional = ' IF NOT EXISTS'; }
    else conditional = ' IF EXISTS';
    need('exists');
  }
  const name = identifier();
  if (/^(pg_|_datalab_)/.test(name) || ['orders_pkey', 'order_items_pkey', 'customers_pkey', 'products_pkey'].includes(name)) throw new QueryGuardError('Use a new index name; internal and primary-key index names are reserved.');
  if (operation === 'drop') {
    if (i !== tokens.length) throw new QueryGuardError('DROP INDEX supports one playground index name only.');
    return { kind: 'index', operation: 'drop', name, sql: `DROP INDEX${conditional} ${quote(name)}` };
  }
  need('on');
  let table = identifier();
  if (table === 'public') { need('.'); table = identifier(); }
  if (!tableColumns[table]) throw new QueryGuardError('Indexes can be created on the four ecommerce tables only.');
  if (accept('using')) need('btree');
  need('(');
  const columns: string[] = [];
  while (i < tokens.length && tokens[i].value !== ')') {
    const column = identifier();
    if (!tableColumns[table].includes(column)) throw new QueryGuardError(`Unknown column ${column} on ${table}.`);
    let operatorClass = '';
    if (accept('text_pattern_ops')) {
      if (!['name', 'email', 'city', 'category', 'status'].includes(column)) throw new QueryGuardError('text_pattern_ops requires a TEXT column.');
      operatorClass = ' text_pattern_ops';
    }
    let direction = '';
    if (accept('asc')) direction = ' ASC';
    else if (accept('desc')) direction = ' DESC';
    columns.push(quote(column) + operatorClass + direction);
    if (!accept(',')) break;
  }
  need(')');
  let include = '';
  if (accept('include')) {
    need('('); const included: string[] = [];
    while (i < tokens.length && tokens[i].value !== ')') {
      const column = identifier();
      if (!tableColumns[table].includes(column)) throw new QueryGuardError(`Unknown INCLUDE column ${column}.`);
      included.push(quote(column));
      if (!accept(',')) break;
    }
    need(')');
    if (!included.length) throw new QueryGuardError('INCLUDE requires at least one column.');
    include = ` INCLUDE (${included.join(', ')})`;
  }
  if (i !== tokens.length || !columns.length || columns.length > 4) throw new QueryGuardError('Use a simple B-tree index with up to four columns; expressions and partial indexes are not supported.');
  return { kind: 'index', operation: 'create', name, table, sql: `CREATE INDEX${conditional} ${quote(name)} ON public.${quote(table)} (${columns.join(', ')})${include}` };
}

export function guardSql(input: string): GuardedSql {
  const statement = singleStatement(input);
  let { sql, tokens } = statement;
  let explained = false;
  if (tokens[0].value === 'explain') {
    explained = true; let i = 1;
    if (tokens[i]?.value === 'analyze') i++;
    if (tokens[i]?.value === '(') {
      let close = i + 1;
      const permitted = new Set(['analyze', 'analyse', 'buffers', 'costs', 'timing', 'summary', 'verbose', 'format', 'json', 'text', 'true', 'false', 'on', 'off', ',', '0', '1']);
      while (close < tokens.length && tokens[close].value !== ')') {
        if (!permitted.has(tokens[close].value) || tokens[close].kind === 'quoted') throw new QueryGuardError('Unsupported EXPLAIN option.');
        close++;
      }
      if (tokens[close]?.value !== ')') throw new QueryGuardError('Unclosed EXPLAIN options.');
      i = close + 1;
    }
    const start = tokens[i - 1].end;
    sql = sql.slice(start).trim(); tokens = tokens.slice(i);
  }
  if (!tokens.length) throw new QueryGuardError('EXPLAIN requires a SELECT query.');
  if (!explained && ['create', 'drop'].includes(tokens[0].value)) return indexSql(tokens);
  if (!['select', 'with'].includes(tokens[0].value)) throw new QueryGuardError('Only SELECT, WITH, EXPLAIN, CREATE INDEX and DROP INDEX are supported.');
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t.kind === 'literal' || t.kind === 'symbol') continue;
    const name = t.value.toLowerCase();
    if (t.kind === 'word' && blockedWords.has(name)) throw new QueryGuardError(`The ${name.toUpperCase()} operation is unavailable in this playground.`);
    if (/^(pg_|information_schema$)/.test(name) || ['dblink', 'lo_import', 'lo_export'].includes(name)) {
      throw new QueryGuardError('System catalogs, filesystem and session functions are unavailable.');
    }
    if (t.kind === 'word' && name === 'u' && tokens[i + 1]?.value === '&') throw new QueryGuardError('Unicode escape syntax is unavailable.');
    if (tokens[i + 1]?.value === '(') {
      let aliasEnd = i + 2;
      while (aliasEnd < tokens.length && tokens[aliasEnd].value !== ')' && (['word', 'quoted'].includes(tokens[aliasEnd].kind) || tokens[aliasEnd].value === ',')) aliasEnd++;
      const simpleAliasColumns = tokens[aliasEnd]?.value === ')';
      const cteDefinition = simpleAliasColumns && tokens[aliasEnd + 1]?.value === 'as' && tokens[aliasEnd + 2]?.value === '(' && ['with', ','].includes(tokens[i - 1]?.value);
      const relationDefinition = simpleAliasColumns && ['as', ')'].includes(tokens[i - 1]?.value);
      const allowed = safeFunctions.has(name) || (t.kind === 'word' && (parenSyntax.has(name) || typeNames.has(name))) || cteDefinition || relationDefinition;
      if (!allowed) throw new QueryGuardError(`Function ${t.value} is unavailable; use supported aggregate, string, date or window functions.`);
      // Schema-qualified function syntax is deliberately blocked, even for allowlisted names.
      if (tokens[i - 1]?.value === '.') throw new QueryGuardError('Use unqualified function names.');
    }
  }
  // Always end with a newline: a final -- comment must not swallow the caller's closing parenthesis.
  return { kind: 'read', sql: sql.trim() + '\n', explained };
}
