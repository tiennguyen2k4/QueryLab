import type { DatasetSize } from './types';

export function seedSql(size: DatasetSize): string {
  if (![10000, 50000, 100000, 1000000].includes(size)) throw new Error('Unsupported dataset size.');
  return `
    CREATE TABLE customers (id integer PRIMARY KEY, name text NOT NULL, email text NOT NULL, city text NOT NULL);
    CREATE TABLE products (id integer PRIMARY KEY, name text NOT NULL, category text NOT NULL, price numeric(12,2) NOT NULL CHECK (price >= 0));
    CREATE TABLE orders (id integer PRIMARY KEY, customer_id integer NOT NULL REFERENCES customers(id), order_date date NOT NULL, status text NOT NULL, total numeric(12,2) NOT NULL DEFAULT 0);
    CREATE TABLE order_items (id integer PRIMARY KEY, order_id integer NOT NULL REFERENCES orders(id), product_id integer NOT NULL REFERENCES products(id), quantity integer NOT NULL CHECK (quantity > 0), unit_price numeric(12,2) NOT NULL);
    INSERT INTO customers
      SELECT n, 'Customer ' || lpad(n::text, 4, '0'), 'customer' || n || '@example.com',
        (ARRAY['Ho Chi Minh City','Hanoi','Da Nang','Hue','Can Tho','Hai Phong','Nha Trang','Da Lat'])[((n * 7) % 8) + 1]
      FROM generate_series(1,1000) n;
    INSERT INTO products
      SELECT n, (ARRAY['Canvas bag','Desk lamp','Wireless mouse','Coffee grinder','Notebook','Sneakers','Travel bottle','Monitor stand'])[((n * 3) % 8) + 1] || ' ' || n,
        (ARRAY['Electronics','Home','Fashion','Books','Sports'])[((n * 7) % 5) + 1],
        10 + ((n * 137) % 99000)::numeric / 100
      FROM generate_series(1,100) n;
    INSERT INTO orders (id, customer_id, order_date, status)
      SELECT n, ((n * 37 + 13) % 1000) + 1, DATE '2024-01-01' + ((n * 97) % 730),
        CASE WHEN ((n * 19 + n / 1000) % 100) < 70 THEN 'completed' WHEN ((n * 19 + n / 1000) % 100) < 90 THEN 'pending' ELSE 'cancelled' END
      FROM generate_series(1,${size}) n;
    INSERT INTO order_items
      SELECT (o.id - 1) * 2 + slot, o.id, p.id, ((o.id + slot) % 3) + 1, p.price
      FROM orders o CROSS JOIN generate_series(1,2) slot
      JOIN products p ON p.id = ((o.id * 17 + slot * 13) % 100) + 1;
    UPDATE orders o SET total = totals.total
      FROM (SELECT order_id, SUM(quantity * unit_price) AS total FROM order_items GROUP BY order_id) totals
      WHERE o.id = totals.order_id;
    ANALYZE customers; ANALYZE products; ANALYZE orders; ANALYZE order_items;
  `;
}
