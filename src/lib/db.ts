import { Pool } from "pg";

// When you don't pass connection details, the pg Pool constructor
// defaults to reading from environment variables like PGHOST, PGUSER, etc.
// Since we are using custom variable names (POSTGRES_*), we must
// pass them explicitly to the constructor.

const pool = new Pool({
  host: process.env.POSTGRES_HOST,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DATABASE,
  port: process.env.POSTGRES_PORT
    ? parseInt(process.env.POSTGRES_PORT, 10)
    : 5432,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export default pool;
