import { Pool } from "pg";

// When you don't pass connection details, the pg Pool constructor
// defaults to reading from environment variables like PGHOST, PGUSER, etc.
// Since we are using custom variable names (POSTGRES_*), we must
// pass them explicitly to the constructor.

const required = [
  'POSTGRES_HOST',
  'POSTGRES_USER',
  'POSTGRES_PASSWORD',
  'POSTGRES_DATABASE'
];

const missing = required.filter((k) => !process.env[k]);

let exportPool: Pool | null = null;

if (missing.length > 0) {
  const msg = `Missing required POSTGRES env vars: ${missing.join(', ')}`;
  console.error(msg);
  const err = new Error(msg);
  // Create a minimal object that mimics the Pool API we use
  exportPool = {
    query: async () => {
      throw err;
    },
    end: async () => {},
  } as unknown as Pool;
} else {
  exportPool = new Pool({
    host: process.env.POSTGRES_HOST,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DATABASE,
    port: process.env.POSTGRES_PORT
      ? parseInt(process.env.POSTGRES_PORT, 10)
      : 5432,
    max: 20,
    idleTimeoutMillis: 30000,
    // Increase connection timeout for slower networks / CI
    connectionTimeoutMillis: 10000,
  });
}

export default exportPool as Pool;
