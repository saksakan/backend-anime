const db = require('./database');
const logger = require('../utils/logger');

const migrations = [
  `
    CREATE TABLE IF NOT EXISTS anime_mapping (
      id SERIAL PRIMARY KEY,
      anilist_id INTEGER UNIQUE NOT NULL,
      megapley_id VARCHAR(255),
      title VARCHAR(500),
      last_updated TIMESTAMP DEFAULT NOW()
    )
  `,
  `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(100) UNIQUE NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      last_login TIMESTAMP
    )
  `,
  `
    CREATE TABLE IF NOT EXISTS watch_history (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      anime_id INTEGER NOT NULL,
      episode INTEGER NOT NULL,
      timestamp FLOAT DEFAULT 0,
      last_watched TIMESTAMP DEFAULT NOW(),
      UNIQUE(user_id, anime_id, episode)
    )
  `,
  `
    CREATE TABLE IF NOT EXISTS bookmarks (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      anime_id INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(user_id, anime_id)
    )
  `,
];

const runMigrations = async () => {
  try {
    for (const migration of migrations) {
      await db.query(migration);
      logger.info('Migration executed successfully');
    }
    logger.info('All migrations completed');
    process.exit(0);
  } catch (error) {
    logger.error('Migration failed:', error);
    process.exit(1);
  }
};

runMigrations();
