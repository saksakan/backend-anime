const db = require('../config/database');

class Bookmark {
  static async add(userId, animeId) {
    const result = await db.query(
      `INSERT INTO bookmarks (user_id, anime_id, created_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (user_id, anime_id) DO NOTHING
       RETURNING *`,
      [userId, animeId]
    );
    return result.rows[0];
  }

  static async remove(userId, animeId) {
    const result = await db.query(
      'DELETE FROM bookmarks WHERE user_id = $1 AND anime_id = $2 RETURNING *',
      [userId, animeId]
    );
    return result.rows[0];
  }

  static async getByUser(userId, limit = 50) {
    const result = await db.query(
      `SELECT b.*, am.title, am.cover_image, am.average_score
       FROM bookmarks b
       LEFT JOIN anime_mapping am ON b.anime_id = am.anilist_id
       WHERE b.user_id = $1
       ORDER BY b.created_at DESC
       LIMIT $2`,
      [userId, limit]
    );
    return result.rows;
  }

  static async check(userId, animeId) {
    const result = await db.query(
      'SELECT * FROM bookmarks WHERE user_id = $1 AND anime_id = $2',
      [userId, animeId]
    );
    return result.rows[0];
  }

  static async getCount(animeId) {
    const result = await db.query(
      'SELECT COUNT(*) FROM bookmarks WHERE anime_id = $1',
      [animeId]
    );
    return parseInt(result.rows[0].count);
  }
}

module.exports = Bookmark;
