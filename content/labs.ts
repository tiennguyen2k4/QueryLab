/**
 * QueryLab MVP curriculum.
 * Content is independent of React, the SQL editor, and a particular SQL engine.
 * Every SELECT reference runs against the learner's isolated ecommerce dataset.
 * Index names are examples; validators inspect catalog definitions, never names.
 */
import { advancedLabs } from './advanced-labs';
export type LabCategory = 'sql' | 'index' | 'performance' | 'incident';
export type LabDifficulty = 'beginner' | 'intermediate' | 'advanced';

export type ValidationRule =
  | {
      kind: 'result-equivalent';
      referenceSql: string;
      ordered: boolean;
      explanation: string;
    }
  | {
      kind: 'has-index';
      table: string;
      leadingColumns: string[];
      operatorClass?: 'text_pattern_ops';
      explanation: string;
    }
  | {
      kind: 'plan-uses-index';
      table: string;
      /** Index Scan, Index Only Scan, or Bitmap Index Scan + Bitmap Heap Scan. */
      explanation: string;
    }
  | {
      kind: 'plan-has-node';
      nodeType: string;
      table?: string;
      explanation: string;
    }
  | {
      kind: 'plan-avoids-node';
      nodeType: string;
      explanation: string;
    }
  | {
      kind: 'less-work-than-baseline';
      table: string;
      minReduction: number;
      /** Compare access-node tuples visited, not an arbitrary elapsed-time limit. */
      explanation: string;
    }
  | { kind: 'plan-captured'; explanation: string };

export type IncidentQuery = {
  id: string;
  endpoint: string;
  callsPerMinute: number;
  sql: string;
  observation: string;
};

export type Lab = {
  id: string;
  number: number;
  slug: string;
  title: string;
  subtitle: string;
  category: LabCategory;
  difficulty: LabDifficulty;
  durationMinutes: number;
  xp: number;
  dataset: 'ecommerce';
  contentVersion: 1;
  goals: string[];
  concept: string;
  initialState: string;
  /** Reset the base dataset before applying these statements. */
  setupSql: string[];
  initialQuery: string;
  /** Capture this plan before executing learner DDL. */
  baselineQuery?: string;
  task: string;
  expectedBehavior: string;
  hints: string[];
  solutionSql: string;
  solutionExplanation: string;
  realWorldScenario: string;
  validationRules: ValidationRule[];
  incidentQueries?: IncidentQuery[];
};

export const categories: {
  id: LabCategory;
  title: string;
  description: string;
  color: string;
}[] = [
  { id: 'sql', title: 'SQL Fundamentals', description: 'Ask useful questions of real data.', color: '#72D8BE' },
  { id: 'index', title: 'Index & Performance', description: 'See how PostgreSQL finds a row.', color: '#A9B7FF' },
  { id: 'performance', title: 'Query Optimization', description: 'Read plans and reduce unnecessary work.', color: '#F7C875' },
  { id: 'incident', title: 'Real-world Debugging', description: 'Diagnose a production-like incident.', color: '#F294AA' },
];

const customerOrders = `SELECT *
FROM orders
WHERE customer_id = 42;`;

const recentOrders = `SELECT id, order_date, total
FROM orders
WHERE customer_id = 42
  AND order_date >= DATE '2024-06-01'
ORDER BY order_date DESC, id DESC
LIMIT 20;`;

const prefixCustomers = `SELECT id, name, email
FROM customers
WHERE email LIKE 'customer42%'
ORDER BY id;`;

const julyOrders = `SELECT id, order_date, total
FROM orders
WHERE order_date >= DATE '2024-07-01'
  AND order_date < DATE '2024-08-01'
ORDER BY id;`;

const incidentOrders = `SELECT id, order_date, total, status
FROM orders
WHERE customer_id = 42
ORDER BY order_date DESC, id DESC
LIMIT 20;`;

const equivalent = (referenceSql: string, ordered = false): ValidationRule => ({
  kind: 'result-equivalent', referenceSql, ordered,
  explanation: 'Return the same columns and values as the reference result. Any correct SQL formulation is accepted.',
});

const indexed = (table: string, leadingColumns: string[]): ValidationRule[] => [
  { kind: 'has-index', table, leadingColumns, explanation: `An index must start with ${leadingColumns.join(', ')} on ${table}. Its name is your choice.` },
  { kind: 'plan-uses-index', table, explanation: `The actual execution plan must use an index to access ${table}. Bitmap and index-only access are accepted.` },
];

export const labs: Lab[] = [
  {
    id: 'sql-001', number: 1, slug: 'select-and-where', title: 'SELECT & WHERE',
    subtitle: 'Turn a business question into your first query.', category: 'sql', difficulty: 'beginner', durationMinutes: 6, xp: 50,
    dataset: 'ecommerce', contentVersion: 1,
    goals: ['Choose the columns a result needs.', 'Filter records with WHERE.', 'Use ORDER BY for a predictable result.'],
    concept: 'A table stores rows; SELECT chooses the columns you return. WHERE keeps rows whose condition is true. ORDER BY controls presentation. SQL does not promise a row order unless you request one, even if an earlier run looked sorted.',
    initialState: 'The ecommerce database has 1,000 customers and 50,000 orders. Table primary keys are present; no learning indexes have been added.',
    setupSql: [],
    initialQuery: `SELECT *
FROM orders
LIMIT 20;`,
    task: 'The support team needs every order for customer 42. Return only id, order_date, and total, sorted by id from smallest to largest.',
    expectedBehavior: 'Every returned row belongs to customer 42. The result has exactly the three requested columns and increases by id. Filtering changes returned rows; a fast query is not necessarily an efficient query.',
    hints: ['Find the column that relates an order to its customer.', 'Add WHERE customer_id = 42 after FROM orders.', 'Name the three columns after SELECT, then finish with ORDER BY id.'],
    solutionSql: `SELECT id, order_date, total
FROM orders
WHERE customer_id = 42
ORDER BY id;`,
    solutionExplanation: 'The projection returns only the requested fields. The equality condition identifies this customer, and the explicit sort gives support a stable order. PostgreSQL may still inspect every order because customer_id is not indexed yet.',
    realWorldScenario: 'A support agent needs a focused order history without downloading the whole orders table.',
    validationRules: [equivalent(`SELECT id, order_date, total FROM orders WHERE customer_id = 42 ORDER BY id;`, true)],
  },
  {
    id: 'sql-002', number: 2, slug: 'group-by', title: 'GROUP BY',
    subtitle: 'Summarize thousands of orders into customer revenue.', category: 'sql', difficulty: 'beginner', durationMinutes: 8, xp: 70,
    dataset: 'ecommerce', contentVersion: 1,
    goals: ['Aggregate many rows into one row per customer.', 'Distinguish row filters from group filters.', 'Make ties in a ranked result deterministic.'],
    concept: 'GROUP BY creates groups of rows. SUM and COUNT compute a value for each group. WHERE removes individual rows before aggregation; HAVING removes groups afterward. A selected column must either be grouped or aggregated, unless the database can prove a dependency.',
    initialState: 'Orders have completed, pending, and cancelled statuses. Revenue in this exercise includes completed orders only.',
    setupSql: [],
    initialQuery: `SELECT customer_id, total
FROM orders
WHERE status = 'completed'
LIMIT 20;`,
    task: 'Find the 10 customers with the highest completed-order revenue. Return customer_id and SUM(total) AS revenue. Sort revenue descending, then customer_id ascending to resolve ties.',
    expectedBehavior: 'The result contains 10 customer groups. Each revenue value sums only completed orders for that customer, and tied totals use the requested secondary order.',
    hints: ['Apply status = completed before grouping.', 'Group by customer_id and calculate SUM(total) AS revenue.', 'Order by revenue DESC, customer_id ASC and limit the result to 10.'],
    solutionSql: `SELECT customer_id, SUM(total) AS revenue
FROM orders
WHERE status = 'completed'
GROUP BY customer_id
ORDER BY revenue DESC, customer_id ASC
LIMIT 10;`,
    solutionExplanation: 'WHERE excludes unearned revenue before the aggregate is computed. One group represents one customer. SUM(total) measures that customer’s completed-order revenue; the secondary sort makes the top ten repeatable when totals tie.',
    realWorldScenario: 'An analyst builds a customer revenue report and must avoid counting pending or cancelled purchases.',
    validationRules: [equivalent(`SELECT customer_id, SUM(total) AS revenue FROM orders WHERE status = 'completed' GROUP BY customer_id ORDER BY revenue DESC, customer_id ASC LIMIT 10;`, true)],
  },
  {
    id: 'sql-003', number: 3, slug: 'join', title: 'JOIN',
    subtitle: 'Connect order facts to the people behind them.', category: 'sql', difficulty: 'beginner', durationMinutes: 8, xp: 75,
    dataset: 'ecommerce', contentVersion: 1,
    goals: ['Join tables through a foreign key relationship.', 'Qualify column names to avoid ambiguity.', 'Explain why joining on the wrong field multiplies rows.'],
    concept: 'A JOIN combines rows that satisfy a relationship. orders.customer_id refers to customers.id: many orders can belong to one customer. Join on that relationship, not on equal-looking names or totals. A missing or incorrect join condition can create a large Cartesian product.',
    initialState: 'customers.id is a primary key and orders.customer_id identifies the customer who placed an order.',
    setupSql: [],
    initialQuery: `SELECT id, customer_id, total
FROM orders
WHERE customer_id = 42
LIMIT 20;`,
    task: 'Show the support team customer 42’s orders with the customer’s name. Return o.id AS order_id, c.name AS customer_name, and o.total, sorted by order_id ascending.',
    expectedBehavior: 'Each order appears once with its correct customer name. The result contains no duplicated orders created by an incorrect join condition.',
    hints: ['Join orders o to customers c.', 'The relationship is o.customer_id = c.id.', 'Filter o.customer_id = 42 and give the requested output aliases.'],
    solutionSql: `SELECT o.id AS order_id, c.name AS customer_name, o.total
FROM orders AS o
JOIN customers AS c ON c.id = o.customer_id
WHERE o.customer_id = 42
ORDER BY o.id;`,
    solutionExplanation: 'The customer primary key gives each order one matching customer. Aliases make the source of each field clear and create the requested output names. The foreign key describes the relationship; it does not automatically create an index on orders.customer_id.',
    realWorldScenario: 'An operations dashboard needs readable names instead of internal customer IDs.',
    validationRules: [equivalent(`SELECT o.id AS order_id, c.name AS customer_name, o.total FROM orders o JOIN customers c ON c.id = o.customer_id WHERE o.customer_id = 42 ORDER BY o.id;`, true)],
  },
  {
    id: 'sql-004', number: 4, slug: 'window-function', title: 'Window Function',
    subtitle: 'Keep the details while ranking rows inside a group.', category: 'sql', difficulty: 'intermediate', durationMinutes: 12, xp: 100,
    dataset: 'ecommerce', contentVersion: 1,
    goals: ['Rank orders within each customer.', 'Use a CTE to filter a window calculation.', 'Handle equal dates with a stable tie-breaker.'],
    concept: 'An aggregate collapses a group, while a window function preserves individual rows. ROW_NUMBER assigns a position inside each PARTITION BY group. Its ORDER BY chooses the winner. Compute the row number in a CTE or subquery, then filter it in the outer query because WHERE is evaluated before window functions.',
    initialState: 'Customers can place multiple orders on the same date. When dates tie, the larger order id is defined as the more recent order.',
    setupSql: [],
    initialQuery: `SELECT id AS order_id, customer_id, order_date, total
FROM orders
ORDER BY customer_id, order_date DESC, id DESC
LIMIT 20;`,
    task: 'Return each customer’s latest order. Output customer_id, id AS order_id, order_date, and total. Resolve equal dates with the highest id, then sort the final result by customer_id ascending.',
    expectedBehavior: 'Exactly one order is returned for each customer with orders. Its date is the latest, and its id is the largest among orders on that date. Equivalent approaches such as DISTINCT ON are accepted.',
    hints: ['Partition ROW_NUMBER by customer_id.', 'Order each partition by order_date DESC, id DESC.', 'Put the ranking query in a CTE, then keep rn = 1 in an outer query.'],
    solutionSql: `WITH ranked_orders AS (
  SELECT customer_id, id, order_date, total,
         ROW_NUMBER() OVER (
           PARTITION BY customer_id
           ORDER BY order_date DESC, id DESC
         ) AS rn
  FROM orders
)
SELECT customer_id, id AS order_id, order_date, total
FROM ranked_orders
WHERE rn = 1
ORDER BY customer_id;`,
    solutionExplanation: 'Each customer gets an independent ranking. Ordering by both date and id avoids an arbitrary winner when dates tie. The CTE keeps the calculation readable; the outer filter chooses one row per customer. Correct alternatives are valid because understanding the result matters more than reproducing one syntax.',
    realWorldScenario: 'A customer health dashboard shows the latest purchase for every customer without losing the order’s fields.',
    validationRules: [equivalent(`SELECT DISTINCT ON (customer_id) customer_id, id AS order_id, order_date, total FROM orders ORDER BY customer_id, order_date DESC, id DESC;`, true)],
  },
  {
    id: 'index-005', number: 5, slug: 'full-table-scan', title: 'Full Table Scan',
    subtitle: 'See the work hidden behind a small result.', category: 'index', difficulty: 'beginner', durationMinutes: 6, xp: 60,
    dataset: 'ecommerce', contentVersion: 1,
    goals: ['Find a sequential scan in an execution plan.', 'Separate rows returned from rows inspected.', 'Explain why LIMIT is not a universal performance fix.'],
    concept: 'Without a suitable index, PostgreSQL can read the orders table and test the filter on each row. Only a small number may qualify. A small result does not mean little work: Actual Rows plus Rows Removed by Filter describe the scan’s inspected tuples. Sequential scans can still be the best choice when a query needs a large share of a table.',
    initialState: 'Only primary-key indexes exist. There is no index whose leading column is orders.customer_id.',
    setupSql: [], initialQuery: customerOrders,
    task: 'Run the unchanged customer 42 lookup, open its execution plan, and inspect the scan. Complete the experiment with a result that contains every order for customer 42.',
    expectedBehavior: 'The plan includes a sequential scan of orders. It returns matching orders while rejecting many other rows. The scan illustration shows inspected rows separately from returned rows.',
    hints: ['Run the query before adding any index.', 'Find Seq Scan on orders in the plan.', 'Compare Actual Rows with Rows Removed by Filter. Their sum estimates the tuples this scan checked.'],
    solutionSql: customerOrders,
    solutionExplanation: 'The database knows the requested customer but has no ordered structure that maps customer_id to rows. It scans the table and tests the predicate. Adding LIMIT would change the question and could still require substantial scanning; the next lab builds the missing lookup structure.',
    realWorldScenario: 'A query returns a small customer history but consumes much more database work than its result size suggests.',
    validationRules: [equivalent(customerOrders), { kind: 'plan-has-node', nodeType: 'Seq Scan', table: 'orders', explanation: 'Observe the unindexed orders scan in a fresh lab database.' }],
  },
  {
    id: 'index-006', number: 6, slug: 'your-first-index', title: 'Your First Index',
    subtitle: 'Build a shortcut to the rows you actually need.', category: 'index', difficulty: 'beginner', durationMinutes: 10, xp: 120,
    dataset: 'ecommerce', contentVersion: 1,
    goals: ['Create a B-tree index on a selective filter.', 'Compare baseline and optimized access paths.', 'Explain the storage and write cost of an index.'],
    concept: 'A B-tree stores ordered keys and references to table rows. PostgreSQL can descend through the tree to the requested customer, then fetch matching rows. Depending on its cost estimates, it may choose an Index Scan or a Bitmap Index Scan plus a Bitmap Heap Scan. An index uses storage and must be maintained on writes; it is not free.',
    initialState: 'The customer lookup has been measured without a customer_id index. The base dataset starts with primary-key indexes only.',
    setupSql: [], initialQuery: customerOrders, baselineQuery: customerOrders,
    task: 'Create an index that helps the customer 42 lookup, then run the same SELECT. Preserve every result row and reduce orders tuples inspected by at least 80% compared with the baseline.',
    expectedBehavior: 'A suitable customer_id index exists and the actual plan uses it. The same orders are returned with substantially less scan work. Elapsed time is shown as a measurement, but noisy browser timing is not a pass/fail threshold.',
    hints: ['The filter compares one customer_id value.', 'A B-tree on orders(customer_id) can find that group of rows.', 'Run CREATE INDEX, then the original SELECT. Index names are your choice.'],
    solutionSql: `CREATE INDEX idx_orders_customer
ON orders (customer_id);

${customerOrders}`,
    solutionExplanation: 'The new index narrows the search to one customer. Bitmap access is also a successful outcome: it collects matching row locations, then fetches their table pages. The visualization represents that traversal; the plan metrics come from the actual engine. Primary keys on orders.id do not help this customer_id predicate.',
    realWorldScenario: 'An Orders API runs a selective lookup many times each minute and needs an index matching that filter.',
    validationRules: [equivalent(customerOrders), ...indexed('orders', ['customer_id']), { kind: 'less-work-than-baseline', table: 'orders', minReduction: 0.8, explanation: 'Reduce orders access tuples by at least 80% without changing the result.' }],
  },
  {
    id: 'index-007', number: 7, slug: 'composite-index', title: 'Composite Index',
    subtitle: 'Match an equality filter and the order of a feed.', category: 'index', difficulty: 'intermediate', durationMinutes: 12, xp: 140,
    dataset: 'ecommerce', contentVersion: 1,
    goals: ['Choose the leading column of a composite index.', 'Use index order to serve a sorted LIMIT query.', 'Understand why column order changes useful access paths.'],
    concept: 'A composite B-tree orders rows first by its first column, then by later columns within equal earlier keys. With customer_id fixed, an index on (customer_id, order_date DESC, id DESC) can read the customer’s newest qualifying orders in result order and stop after 20. Leading with date may force more work across unrelated customers.',
    initialState: 'A single-column customer_id index exists. It can locate a customer’s orders but does not provide the requested date and id ordering.',
    setupSql: ['CREATE INDEX idx_orders_customer ON orders (customer_id);'],
    initialQuery: recentOrders, baselineQuery: recentOrders,
    task: 'Return the latest 20 orders for customer 42 on or after June 1, 2024. Add a composite index so PostgreSQL can produce this ordered page without a separate Sort.',
    expectedBehavior: 'The result stays the same, including tie order. The plan uses a customer_id, order_date, id index and does not need a Sort node. A backwards scan of an equivalent ascending index is valid.',
    hints: ['Put the equality-filtered customer_id first.', 'The remaining key order should match ORDER BY order_date DESC, id DESC.', 'A single-column customer index still requires sorting these matching rows.'],
    solutionSql: `CREATE INDEX idx_orders_customer_recent
ON orders (customer_id, order_date DESC, id DESC);

${recentOrders}`,
    solutionExplanation: 'The first key isolates one customer. The remaining keys support the date range and stable descending order. PostgreSQL can stop at LIMIT 20 instead of sorting the whole qualifying group. Including id makes pages deterministic when order dates tie.',
    realWorldScenario: 'An application repeatedly loads a customer’s recent orders and needs low work for the first page.',
    validationRules: [equivalent(recentOrders, true), ...indexed('orders', ['customer_id', 'order_date', 'id']), { kind: 'plan-avoids-node', nodeType: 'Sort', explanation: 'The index ordering should produce the requested page without a separate Sort.' }],
  },
  {
    id: 'index-008', number: 8, slug: 'like-and-index', title: 'LIKE and Index',
    subtitle: 'Compare a known prefix with a search anywhere.', category: 'index', difficulty: 'intermediate', durationMinutes: 10, xp: 110,
    dataset: 'ecommerce', contentVersion: 1,
    goals: ['Recognize an indexable prefix condition.', 'Explain why a leading wildcard prevents ordinary B-tree prefix lookup.', 'Use a PostgreSQL text operator class for prefix matching.'],
    concept: "LIKE 'customer42%' begins with known characters, so a suitable B-tree can narrow the search to a prefix range. LIKE '%42%' starts at an unknown position and usually cannot use that range. PostgreSQL text_pattern_ops makes prefix ordering useful under non-C collations. A trigram index is a different tool for substring searches and is outside this lab.",
    initialState: 'customers.email is TEXT. Emails follow customer{id}@example.com, with 1,000 customer rows and no email index.',
    setupSql: [], initialQuery: prefixCustomers, baselineQuery: prefixCustomers,
    task: 'Find all emails beginning with customer42 and return id, name, and email ordered by id. Add an index that PostgreSQL can use for this prefix query. Experiment with %42% afterward and observe the different access path.',
    expectedBehavior: 'The prefix result includes customer42@example.com and customer420@example.com through customer429@example.com. A suitable text prefix index is used for the submitted prefix query; the substring experiment may still scan.',
    hints: ['Keep the wildcard at the end: customer42%.', 'In PostgreSQL, email text_pattern_ops supports B-tree prefix matching for a TEXT field.', 'Create the index, then rerun the prefix query. Compare %42% separately.'],
    solutionSql: `CREATE INDEX idx_customers_email_prefix
ON customers (email text_pattern_ops);

${prefixCustomers}`,
    solutionExplanation: 'The index’s ordering lets PostgreSQL identify a small candidate range, then confirm the LIKE condition. It does not make every pattern fast: a leading wildcard lacks that fixed starting range. A regular B-tree may also support prefixes with a compatible collation, so validation focuses on actual index use and a correct result.',
    realWorldScenario: 'A customer autocomplete endpoint searches the beginning of an email while an investigation tool needs substring search.',
    validationRules: [equivalent(prefixCustomers, true), ...indexed('customers', ['email'])],
  },
  {
    id: 'performance-009', number: 9, slug: 'explain', title: 'EXPLAIN',
    subtitle: 'Read the database’s account of how it ran your query.', category: 'performance', difficulty: 'intermediate', durationMinutes: 10, xp: 100,
    dataset: 'ecommerce', contentVersion: 1,
    goals: ['Distinguish estimated rows from actual rows.', 'Interpret scan nodes and rows removed by a filter.', 'Know that ANALYZE executes the explained statement.'],
    concept: 'EXPLAIN reports the plan and its cost estimates. EXPLAIN ANALYZE runs the statement and adds actual rows, loops, and measured execution time. Cost is in planner units, not milliseconds. Node timings and rows are reported per loop; loops matter. Parent-node time includes child work, so adding all node times double-counts.',
    initialState: 'orders has no customer_id index. This read-only experiment explains the selective customer lookup.',
    setupSql: [],
    initialQuery: `EXPLAIN (ANALYZE, FORMAT JSON)
SELECT id, customer_id, total
FROM orders
WHERE customer_id = 42;`,
    task: 'Run EXPLAIN ANALYZE for the customer 42 lookup. Find the orders access node, compare Plan Rows with Actual Rows, and inspect Rows Removed by Filter. The lab completes when a real executed plan is captured.',
    expectedBehavior: 'The plan contains actual execution fields and an orders access node. The interface distinguishes planned cost, estimated rows, actual rows, rows removed, and elapsed time rather than treating them as interchangeable.',
    hints: ['Use EXPLAIN (ANALYZE, FORMAT JSON) before a SELECT.', 'Locate the Seq Scan node whose Relation Name is orders.', 'EXPLAIN without ANALYZE does not provide measured rows or execution time.'],
    solutionSql: `EXPLAIN (ANALYZE, FORMAT JSON)
SELECT id, customer_id, total
FROM orders
WHERE customer_id = 42;`,
    solutionExplanation: 'The plan shows how PostgreSQL executed this lookup, not merely the final rows. An orders sequential scan rejects most rows. Plan Rows are estimates; Actual Rows are observations from this run. The separate execution-time metric is measured in milliseconds, while Total Cost remains an estimate in planner units.',
    realWorldScenario: 'A backend engineer receives a slow-query report and uses the execution plan to locate unnecessary database work.',
    validationRules: [{ kind: 'plan-captured', explanation: 'Capture an actual executed plan with Actual Rows, Actual Loops, and Execution Time.' }, { kind: 'plan-has-node', nodeType: 'Seq Scan', table: 'orders', explanation: 'Observe the unindexed orders access in the fresh lab dataset.' }],
  },
  {
    id: 'performance-010', number: 10, slug: 'optimize-a-slow-query', title: 'Optimize a Slow Query',
    subtitle: 'Give an indexed date column a usable range.', category: 'performance', difficulty: 'intermediate', durationMinutes: 12, xp: 150,
    dataset: 'ecommerce', contentVersion: 1,
    goals: ['Identify functions applied to an indexed column.', 'Rewrite a calendar filter as a half-open range.', 'Preserve query meaning while improving the access path.'],
    concept: 'An index on order_date stores the original date values. EXTRACT applied to that column does not normally provide a range condition on the original B-tree. Rewrite July as order_date >= July 1 and order_date < August 1. A half-open range also handles timestamps without assuming the final second of a day.',
    initialState: 'An ordinary order_date index already exists, but the starter query wraps the indexed column in EXTRACT.',
    setupSql: ['CREATE INDEX idx_orders_date ON orders (order_date);'],
    initialQuery: `SELECT id, order_date, total
FROM orders
WHERE EXTRACT(YEAR FROM order_date) = 2024
  AND EXTRACT(MONTH FROM order_date) = 7
ORDER BY id;`,
    baselineQuery: `SELECT id, order_date, total FROM orders WHERE EXTRACT(YEAR FROM order_date) = 2024 AND EXTRACT(MONTH FROM order_date) = 7 ORDER BY id;`,
    task: 'Return exactly the same July 2024 orders, in the same id order. Rewrite the predicate so PostgreSQL uses the existing date index and inspects at least 80% fewer orders tuples.',
    expectedBehavior: 'The optimized query returns the same July records. Its plan uses the date index through an index or bitmap access path. Sorting the returned rows by id may still be necessary and is acceptable.',
    hints: ['Keep the indexed column unwrapped on one side of the comparison.', 'Use a start-inclusive and end-exclusive date range.', 'July begins at 2024-07-01; its exclusive end is 2024-08-01.'],
    solutionSql: julyOrders,
    solutionExplanation: 'The rewritten predicate matches the ordering stored in the existing index. It has the same meaning as the two EXTRACT comparisons for the dataset’s date values. A bitmap plan is valid because it reduces candidate rows before table access. An expression index could accelerate the original expression too, but learning a plain date range gives a broadly useful rewrite.',
    realWorldScenario: 'A monthly report has a date index but still scans the full orders table because its WHERE clause applies date functions.',
    validationRules: [equivalent(julyOrders, true), { kind: 'plan-uses-index', table: 'orders', explanation: 'The actual plan should use the existing date index or an equivalent useful index.' }, { kind: 'less-work-than-baseline', table: 'orders', minReduction: 0.8, explanation: 'Preserve the July result while reducing orders scan work by at least 80%.' }],
  },
  {
    id: 'performance-011', number: 11, slug: 'pagination-performance', title: 'Pagination Performance',
    subtitle: 'Continue from a cursor instead of skipping 40,000 rows.', category: 'performance', difficulty: 'intermediate', durationMinutes: 10, xp: 130,
    dataset: 'ecommerce', contentVersion: 1,
    goals: ['Measure work hidden in a large OFFSET.', 'Use keyset pagination with an indexed unique key.', 'Explain what a cursor means for changing data.'],
    concept: 'OFFSET asks PostgreSQL to produce rows and discard the first portion. An id index may help the sort but still visits the skipped rows. Keyset pagination says start after the last id already seen. It avoids walking earlier pages. A production cursor must contain the full deterministic sort key; using only a non-unique date can skip or repeat ties.',
    initialState: 'orders.id is an indexed primary key with deterministic ids 1 through 50,000. The previous page ended at id 40,000.',
    setupSql: [],
    initialQuery: `SELECT id, customer_id, order_date, total
FROM orders
ORDER BY id
LIMIT 20 OFFSET 40000;`,
    baselineQuery: `SELECT id, customer_id, order_date, total FROM orders ORDER BY id LIMIT 20 OFFSET 40000;`,
    task: 'Fetch the next 20 orders after cursor id 40000, returning id, customer_id, order_date, and total in ascending id order. Keep the same result as the starter query while reducing tuples visited by at least 80%.',
    expectedBehavior: 'Both queries return ids 40001 through 40020 in this fixed dataset. The optimized query uses an id range and visits roughly one page of rows instead of walking 40,020 rows.',
    hints: ['The cursor is the last id returned on the previous page.', 'Use WHERE id > 40000.', 'Keep ORDER BY id and LIMIT 20; remove the deep OFFSET.'],
    solutionSql: `SELECT id, customer_id, order_date, total
FROM orders
WHERE id > 40000
ORDER BY id
LIMIT 20;`,
    solutionExplanation: 'The primary-key B-tree locates the first id after the cursor, then reads the next 20 entries. The starter can use the same index but still discards 40,000 entries. Equivalence to this OFFSET page is specific to the deterministic gapless fixture; in production the cursor is taken from the actual last row, not calculated from a page number.',
    realWorldScenario: 'An activity feed becomes slower on later pages even though an index supplies the ORDER BY.',
    validationRules: [equivalent(`SELECT id, customer_id, order_date, total FROM orders WHERE id > 40000 ORDER BY id LIMIT 20;`, true), { kind: 'plan-uses-index', table: 'orders', explanation: 'Use the primary-key index to begin after the cursor.' }, { kind: 'less-work-than-baseline', table: 'orders', minReduction: 0.8, explanation: 'Inspect at least 80% fewer order tuples than deep OFFSET pagination.' }],
  },
  {
    id: 'incident-012', number: 12, slug: 'real-world-database-incident', title: 'Real-world Database Incident',
    subtitle: 'The Orders API is slow. Find the expensive access path.', category: 'incident', difficulty: 'advanced', durationMinutes: 18, xp: 200,
    dataset: 'ecommerce', contentVersion: 1,
    goals: ['Use query frequency and access plans to prioritize a bottleneck.', 'Apply an index that matches a filter and a stable ordering.', 'Verify a fix against both correctness and measured work.'],
    concept: 'An incident needs evidence: which query is frequent, what work it performs, and whether the proposed fix preserves behavior. A primary-key product lookup is already selective. A full revenue aggregate has a different workload. The repeated customer order feed scans orders and sorts a small matching set; a composite index can remove that repeated scan and sort.',
    initialState: 'Incident scenario metrics are illustrative fixtures, not live telemetry: p95 latency 4.7 s, CPU 91%, 187 connections. The browser experiment still runs against the actual 50,000-row dataset. Only primary-key indexes exist.',
    setupSql: [], initialQuery: incidentOrders, baselineQuery: incidentOrders,
    task: 'Investigate the query log and repair /api/customers/42/orders. Return the same newest 20 orders, including status. Add a useful composite index, avoid a separate Sort, and reduce orders tuples inspected by at least 80%.',
    expectedBehavior: 'The frequent customer order feed uses an index starting with customer_id, order_date, and id. Its result and tie order are unchanged, a separate Sort disappears, and scan work falls. The supplied incident latency remains a scenario value; the lab shows this device’s measured execution separately.',
    hints: ['Prioritize repeated queries that scan many rows for a small result.', 'The Orders API filters by customer_id and sorts by order_date DESC, id DESC.', 'Build a composite B-tree in that key order, rerun the endpoint query, and compare its plan.'],
    solutionSql: `CREATE INDEX idx_orders_incident_feed
ON orders (customer_id, order_date DESC, id DESC);

${incidentOrders}`,
    solutionExplanation: 'The index addresses the frequent endpoint’s actual access pattern. PostgreSQL can locate one customer’s key range, read in requested order, and stop after 20 rows. Check the result as well as the plan: a fast query that omits status, changes customer, or returns fewer rows has not fixed the API. A covering index with INCLUDE (total, status) is an optional later experiment; an Index Only Scan also depends on visibility information.',
    realWorldScenario: 'A backend team investigates a sudden increase in Orders API latency and chooses a fix from query-plan evidence instead of adding indexes indiscriminately.',
    incidentQueries: [
      { id: 'q1', endpoint: '/api/products/7', callsPerMinute: 35, sql: 'SELECT id, name, price FROM products WHERE id = 7;', observation: 'A selective primary-key lookup returns one row with little scan work.' },
      { id: 'q2', endpoint: '/api/customers/42/orders', callsPerMinute: 240, sql: incidentOrders, observation: 'A frequent lookup scans orders, filters one customer, then sorts the matching rows.' },
      { id: 'q3', endpoint: '/internal/revenue-summary', callsPerMinute: 1, sql: "SELECT status, SUM(total) AS revenue FROM orders GROUP BY status;", observation: 'A scheduled aggregate needs many orders and runs far less frequently.' },
    ],
    validationRules: [equivalent(incidentOrders, true), ...indexed('orders', ['customer_id', 'order_date', 'id']), { kind: 'plan-avoids-node', nodeType: 'Sort', explanation: 'Use index ordering for the recent-orders page.' }, { kind: 'less-work-than-baseline', table: 'orders', minReduction: 0.8, explanation: 'Reduce orders access work by at least 80% for the endpoint query.' }],
  },
  ...advancedLabs,
];

/**
 * Implementation notes:
 * 1. Reset each lab to a base snapshot with PK/FK constraints, then apply setupSql.
 *    Capture baselineQuery in that state BEFORE running learner-created indexes.
 * 2. Execute arbitrary learner statements only in an isolated worker/database.
 *    For a DDL + SELECT batch, validate the last result-producing SELECT.
 * 3. Compare typed column names and values against referenceSql. Sort normalized
 *    rows only when ordered=false; preserve duplicate multiplicity. Normalize
 *    PostgreSQL numeric/date values without treating every value as a string.
 * 4. Read index definitions from pg_index/pg_attribute, including expression keys,
 *    key order and validity. Ignore the supplied example index names.
 * 5. Flatten actual EXPLAIN (ANALYZE, FORMAT JSON) nodes. For a base-table Seq Scan,
 *    tuple work is (Actual Rows + Rows Removed by Filter) * Actual Loops. For an
 *    Index Scan include rows removed by filter. For Bitmap Heap Scan use returned
 *    + filtered + rows removed by index recheck; do not count its child Bitmap Index
 *    Scan again. Never sum parent-node rows or parent-node execution times.
 *    If a metric is absent, report unavailable rather than inventing a measurement.
 * 6. Every performance pass requires correct results. Wall-clock speedup is useful
 *    evidence but is observational: caching and browser scheduling create noise.
 * 7. Small datasets can favor Seq Scan even with a valid index. If your fixture
 *    produces a different plan, show the observed result and either enlarge the
 *    fixture/selectivity or make the index-use criterion an explained warning.
 *    Do not SET enable_seqscan=off to manufacture success.
 * 8. EXPLAIN ANALYZE executes its statement. Permit it for these SELECT labs;
 *    never run arbitrary explained mutations against shared application data.
 * 9. Label B-tree artwork conceptual. Label projected billion-row scale metrics
 *    simulation. Browser PostgreSQL timing must never be marketed as production
 *    PostgreSQL latency. Browser buffer metrics may be unavailable.
 */
