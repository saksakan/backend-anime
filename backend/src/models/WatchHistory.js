const db = require('../config/database');

class WatchHistory {
  static async addOrUpdate(userId, animeId, episode, timestamp) {
    const result = await db.query(
      `INSERT INTO watch_history (user_id, anime_id, episode, timestamp, last_watched)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (user_id, anime_id, episode)
       DO UPDATE SET timestamp = $4, last_watched = NOW()
       RETURNING *`,
      [userId, animeId, episode, timestamp]
    );
    return result.rows[0];
  }

  static async getByUser(userId, limit = 50) {
    const result = await db.query(
      `SELECT wh.*, am.title, am.cover_image
       FROM watch_history wh
       LEFT JOIN anime_mapping am ON wh.anime_id = am.anilist_id
       WHERE wh.user_id = $1
       ORDER BY wh.last_watched DESC
       LIMIT $2`,
      [userId, limit]
    );
    return result.rows;
  }

  static async getByUserAndAnime(userId, animeId) {
    const result = await db.query(
      'SELECT * FROM watch_history WHERE user_id = $1 AND anime_id = $2 ORDER BY episode',
      [userId, animeId]
    );
    return result.rows;
  }

  static async delete(userId, animeId, episode) {
    const result = await db.query(
      'DELETE FROM watch_history WHERE user_id = $1 AND anime_id = $2 AND episode = $3 RETURNING *',
      [userId, animeId, episode]
    );
    return result.rows[0];
  }

  static async clearHistory(userId) {
    await db.query('DELETE FROM watch_history WHERE user_id = $1', [userId]);
  }
}

module.exports = WatchHistory;
