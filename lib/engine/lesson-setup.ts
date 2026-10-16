/** Authored fixture recipes, never SQL supplied by a learner or API caller. */
export const partitionMonths = Array.from({ length: 24 }, (_, index) => {
  const start = new Date(Date.UTC(2024, index, 1));
  const end = new Date(Date.UTC(2024, index + 1, 1));
  const date = start.toISOString().slice(0, 10);
  return { table: `orders_p${date.slice(0, 7).replace('-', '')}`, start: date, end: end.toISOString().slice(0, 10) };
});

export function lessonSetupSql(labId: string): string | null {
  if (labId !== 'partition-014') return null;
  return `
    DROP TABLE IF EXISTS orders_partitioned CASCADE;
    CREATE TABLE orders_partitioned (
      id integer NOT NULL, customer_id integer NOT NULL, order_date date NOT NULL,
      status text NOT NULL, total numeric(12,2) NOT NULL
    ) PARTITION BY RANGE (order_date);
    ${partitionMonths.map(month => `CREATE TABLE ${month.table} PARTITION OF orders_partitioned FOR VALUES FROM ('${month.start}') TO ('${month.end}');`).join('\n')}
    INSERT INTO orders_partitioned SELECT id, customer_id, order_date, status, total FROM orders;
    ANALYZE orders_partitioned;
    ${partitionMonths.map(month => `ANALYZE ${month.table};`).join('\n')}
  `;
}
