const axios = require('axios');
const config = require('../config');
const logger = require('../utils/logger');

const TRENDING_QUERY = `
  query {
    Page(page: 1, perPage: 20) {
      media(type: ANIME, sort: TRENDING_DESC) {
        id
        title { romaji english native }
        coverImage { large medium }
        bannerImage
        description
        episodes
        status
        genres
        averageScore
        season
        seasonYear
        studios { nodes { name } }
        trailer { id site thumbnail }
      }
    }
  }
`;

const SEASONAL_QUERY = `
  query ($season: MediaSeason, $seasonYear: Int, $page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      media(type: ANIME, season: $season, seasonYear: $seasonYear, sort: POPULARITY_DESC) {
        id
        title { romaji english native }
        coverImage { large medium }
        bannerImage
        description
        episodes
        status
        genres
        averageScore
        season
        seasonYear
        studios { nodes { name } }
      }
    }
  }
`;

const SEARCH_QUERY = `
  query ($search: String, $page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      media(type: ANIME, search: $search) {
        id
        title { romaji english native }
        coverImage { large medium }
        description
        episodes
        status
        genres
        averageScore
        season
        seasonYear
      }
    }
  }
`;

const DETAIL_QUERY = `
  query ($id: Int) {
    Media(id: $id, type: ANIME) {
      id
      title { romaji english native }
      coverImage { large medium }
      bannerImage
      description
      episodes
      status
      genres
      averageScore
      season
      seasonYear
      studios { nodes { name } }
      trailer { id site thumbnail }
      relations { nodes { id title { romaji } coverImage { large } } }
      characters(sort: ROLE, perPage: 10) {
        nodes { name { full } image { large } role }
      }
    }
  }
`;

const EPISODES_QUERY = `
  query ($id: Int) {
    Media(id: $id, type: ANIME) {
      id
      episodes
      title { romaji english }
      streamingEpisodes {
        title
        thumbnail
        url
      }
    }
  }
`;

class AnilistService {
  static async query(query, variables = {}) {
    try {
      const response = await axios.post(
        config.anilistApiUrl,
        { query, variables },
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          timeout: 10000,
        }
      );
      return response.data.data;
    } catch (error) {
      logger.error('AniList API error:', error.message);
      throw new Error('Failed to fetch data from AniList');
    }
  }

  static async getTrending() {
    return this.query(TRENDING_QUERY);
  }

  static async getSeasonal(season, seasonYear, page = 1, perPage = 20) {
    return this.query(SEASONAL_QUERY, { season, seasonYear, page, perPage });
  }

  static async search(query, page = 1, perPage = 20) {
    return this.query(SEARCH_QUERY, { search: query, page, perPage });
  }

  static async getDetail(id) {
    return this.query(DETAIL_QUERY, { id });
  }

  static async getEpisodes(id) {
    return this.query(EPISODES_QUERY, { id });
  }
}

module.exports = AnilistService;
