const db = require('../config/database');

class AnimeMapping {
  static async findByAnilistId(anilistId) {
    const result = await db.query(
      'SELECT * FROM anime_mapping WHERE anilist_id = $1',
      [anilistId]
    );
    return result.rows[0];
  }

  static async findByMegapleyId(megapleyId) {
    const result = await db.query(
      'SELECT * FROM anime_mapping WHERE megapley_id = $1',
      [megapleyId]
    );
    return result.rows[0];
  }

  static async create(anilistId, megapleyId, title) {
    const result = await db.query(
      'INSERT INTO anime_mapping (anilist_id, megapley_id, title, last_updated) VALUES ($1, $2, $3, NOW()) RETURNING *',
      [anilistId, megapleyId, title]
    );
    return result.rows[0];
  }

  static async update(anilistId, megapleyId, title) {
    const result = await db.query(
      'UPDATE anime_mapping SET megapley_id = $1, title = $2, last_updated = NOW() WHERE anilist_id = $3 RETURNING *',
      [megapleyId, title, anilistId]
    );
    return result.rows[0];
  }

  static async upsert(anilistId, megapleyId, title) {
    const existing = await this.findByAnilistId(anilistId);
    if (existing) {
      return this.update(anilistId, megapleyId, title);
    }
    return this.create(anilistId, megapleyId, title);
  }

  static async getAll(limit = 100, offset = 0) {
    const result = await db.query(
      'SELECT * FROM anime_mapping ORDER BY last_updated DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );
    return result.rows;
  }

  static async delete(anilistId) {
    const result = await db.query(
      'DELETE FROM anime_mapping WHERE anilist_id = $1 RETURNING *',
      [anilistId]
    );
    return result.rows[0];
  }
}

module.exports = AnimeMapping;
