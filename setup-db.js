const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:harismusafa@db.xdrzcwllpofydluolxyv.supabase.co:5432/postgres'
});

async function setup() {
  try {
    await client.connect();
    console.log('Connected to database');

    console.log('Dropping existing tables...');
    await client.query(`
      DROP TABLE IF EXISTS seo_metadata;
      DROP TABLE IF EXISTS match_streams;
      DROP TABLE IF EXISTS matches;
      DROP TABLE IF EXISTS teams;
      DROP TABLE IF EXISTS leagues;
    `);

    console.log('Creating table teams...');
    await client.query(`
      CREATE TABLE teams (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        "shortName" TEXT NOT NULL,
        country TEXT NOT NULL,
        logo TEXT,
        slug TEXT UNIQUE NOT NULL,
        active BOOLEAN NOT NULL DEFAULT TRUE,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    console.log('Creating table leagues...');
    await client.query(`
      CREATE TABLE leagues (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        logo TEXT,
        country TEXT NOT NULL,
        season TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        priority INTEGER NOT NULL DEFAULT 0,
        active BOOLEAN NOT NULL DEFAULT TRUE,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    console.log('Creating table matches...');
    await client.query(`
      CREATE TABLE matches (
        id TEXT PRIMARY KEY,
        "homeTeamId" TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
        "awayTeamId" TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
        "leagueId" TEXT NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
        "startTime" TIMESTAMPTZ NOT NULL,
        timezone TEXT NOT NULL DEFAULT 'Asia/Jakarta',
        venue TEXT,
        referee TEXT,
        round TEXT,
        status TEXT NOT NULL DEFAULT 'SCHEDULED',
        "isHot" BOOLEAN NOT NULL DEFAULT FALSE,
        "isFeatured" BOOLEAN NOT NULL DEFAULT FALSE,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    console.log('Creating table match_streams...');
    await client.query(`
      CREATE TABLE match_streams (
        id TEXT PRIMARY KEY,
        "matchId" TEXT NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
        "serverName" TEXT NOT NULL,
        "embedCode" TEXT NOT NULL,
        "isPrimary" BOOLEAN NOT NULL DEFAULT FALSE,
        status TEXT NOT NULL DEFAULT 'ACTIVE',
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    console.log('Creating table seo_metadata...');
    await client.query(`
      CREATE TABLE seo_metadata (
        id TEXT PRIMARY KEY,
        "matchId" TEXT UNIQUE NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
        slug TEXT UNIQUE NOT NULL,
        "metaTitle" TEXT,
        "metaDescription" TEXT,
        "canonicalUrl" TEXT,
        robots TEXT NOT NULL DEFAULT 'index, follow',
        "ogTitle" TEXT,
        "ogDescription" TEXT,
        "ogImage" TEXT,
        "focusKeyword" TEXT,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    console.log('Seeding initial master data...');
    
    // Seed Leagues
    const leagues = [
      { id: 'l1', name: 'FIFA World Cup 2026', logo: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=100', country: 'International', season: '2026', slug: 'fifa-world-cup-2026', priority: 10 },
      { id: 'l2', name: 'Premier League', logo: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=100', country: 'England', season: '2026/2027', slug: 'premier-league', priority: 9 },
      { id: 'l3', name: 'La Liga', logo: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=100', country: 'Spain', season: '2026/2027', slug: 'la-liga', priority: 8 }
    ];
    for (const l of leagues) {
      await client.query(
        `INSERT INTO leagues (id, name, logo, country, season, slug, priority) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [l.id, l.name, l.logo, l.country, l.season, l.slug, l.priority]
      );
    }

    // Seed Teams
    const teams = [
      { id: 't1', name: 'Belgium', shortName: 'BEL', country: 'Belgium', logo: 'https://flagsapi.com/BE/flat/64.png', slug: 'belgium' },
      { id: 't2', name: 'Senegal', shortName: 'SEN', country: 'Senegal', logo: 'https://flagsapi.com/SN/flat/64.png', slug: 'senegal' },
      { id: 't3', name: 'Arsenal', shortName: 'ARS', country: 'England', logo: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=64', slug: 'arsenal' },
      { id: 't4', name: 'Chelsea', shortName: 'CHE', country: 'England', logo: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=64', slug: 'chelsea' }
    ];
    for (const t of teams) {
      await client.query(
        `INSERT INTO teams (id, name, "shortName", country, logo, slug) VALUES ($1, $2, $3, $4, $5, $6)`,
        [t.id, t.name, t.shortName, t.country, t.logo, t.slug]
      );
    }

    console.log('Database tables successfully created and seeded!');
  } catch (err) {
    console.error('Error setting up database tables:', err);
  } finally {
    await client.end();
  }
}

setup();
