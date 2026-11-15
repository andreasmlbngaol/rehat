import "dotenv/config";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { Client } from "pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL belum diisi di .env");
}

const isLocal = /(?:localhost|127\.0\.0\.1)/.test(connectionString);
const sqlDir = path.join(process.cwd(), "prisma", "sql");

const files = (await readdir(sqlDir))
  .filter((file) => file.endsWith(".sql"))
  .sort();

if (files.length === 0) {
  console.log("Tidak ada file SQL untuk diterapkan.");
  process.exit(0);
}

const client = new Client({
  connectionString,
  ssl: isLocal ? undefined : { rejectUnauthorized: false },
});

await client.connect();

try {
  for (const file of files) {
    const sql = await readFile(path.join(sqlDir, file), "utf8");
    process.stdout.write(`→ ${file} ... `);
    await client.query(sql);
    console.log("ok");
  }
  console.log("SQL Supabase selesai diterapkan.");
} finally {
  await client.end();
}
