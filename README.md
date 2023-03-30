# pgmock2

An NPM module for mocking a connection to a PostgreSQL database.

The module mocks a [pg](https://www.npmjs.com/package/pg) module
connection to a PostgreSQL database. Both the `pg.Client` and `pg.Pool`
classes have a `query` method, therefore the mock connection can be
used to simulate an instance of either class.

## Installation

Installation via `npm`.
```
npm add -D pgmock2
```

## Usage

The idea is to simulate a connection to a database. To enable that
simulation, we need to first `add` data.

### Adding Queries and their Responses

```typescript
import PgMock2 from 'pgmock2';
const pg = new PgMock2();

pg.add('SELECT * FROM employees where id=$1', {
  rowCount: 1,
  rows: [
    { id: 1, name: 'John Smith', position: 'application developer' }
  ]
});

const client = await pg.connect();
```

### Quering the Mock DB

Now we can create a mock connection and query for data.

```typescript
// Get a mock db connection.
client.connect();

client.query('select * from employees where id=$1;')
  .then((data) => console.log(data))
  .catch((err) => console.log(err.message));
```

Since the query is valid and the values passed are correct in number
and type, we should see the expected output.

```json
{
  "rowCount": 1,
  "rows": [{
    "id": 1,
    "name": "John Smith",
    "position": "Application developer"
  }]
}
```

### Mocking Pool/PoolClient

To mock a `pg` Pool/PoolClient workflow.

```typescript
import pgmock, { getPool } from 'pgmock2';

const pool = getPool(pg);

const client = await pool.connect();
const res =  await client.query('select * from employees');

console.log(res.rows);

client.release();
```

## Tests

Tests are found in the `test` directory. To execute them, run:

```
npm run test
```

### Docker Test
To run the tests in a docker environment:

```
npm run test:docker
```
