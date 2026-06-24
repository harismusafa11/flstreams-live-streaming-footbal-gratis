const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:harismusafa@db.xdrzcwllpofydluolxyv.supabase.co:5432/postgres'
});

async function setup() {
  try {
    await client.connect();
    console.log('Connected to database');

    await client.query(`
      CREATE TABLE IF NOT EXISTS matches (
        id          TEXT PRIMARY KEY,
        "homeTeam"  TEXT NOT NULL,
        "awayTeam"  TEXT NOT NULL,
        "homeLogo"  TEXT,
        "awayLogo"  TEXT,
        competition TEXT,
        "startTime" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "embedCode" TEXT NOT NULL,
        status      TEXT NOT NULL DEFAULT 'SCHEDULED',
        "isFeatured" BOOLEAN NOT NULL DEFAULT FALSE,
        "createdAt"  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt"  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    console.log('Table matches created successfully!');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

setup();
