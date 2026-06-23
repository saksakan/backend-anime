require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 8000;
const NODE_ENV = process.env.NODE_ENV || 'development';

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
];

const COMMON_REFERERS = [
  'https://megaplay.buzz/',
  'https://megaplay.buzz',
  'https://www.google.com/',
  'https://www.google.com',
];

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const parseTime = (timeStr) => {
  if (!timeStr) return null;
  if (typeof timeStr === 'number') return timeStr;
  const match = timeStr.match(/(\d+):(\d+):(\d+)/);
  if (match) {
    return parseInt(match[1]) * 3600 + parseInt(match[2]) * 60 + parseInt(match[3]);
  }
  const minMatch = timeStr.match(/(\d+):(\d+)/);
  if (minMatch) {
    return parseInt(minMatch[1]) * 60 + parseInt(minMatch[2]);
  }
  return parseInt(timeStr) || null;
};

const fetchWithRetryReferer = async (url, initialReferer, options = {}) => {
  const referers = [initialReferer, ...COMMON_REFERERS];
  const method = options.method || 'GET';
  const body = options.body || null;
  const headers = options.headers || {};

  for (const referer of referers) {
    const userAgent = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
    const requestHeaders = {
      'User-Agent': userAgent,
      'Referer': referer,
      'Origin': new URL(referer).origin,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'same-origin',
      'Sec-Fetch-User': '?1',
      ...headers,
    };

    try {
      const response = await axios({
        method,
        url,
        headers: requestHeaders,
        data: body,
        timeout: parseInt(process.env.REQUEST_TIMEOUT) || 30000,
        maxRedirects: 5,
        validateStatus: (status) => status < 500,
      });

      if (response.status === 403 || response.status === 401) {
        continue;
      }

      return { response, workingReferer: referer };
    } catch (error) {
      if (error.response && (error.response.status === 403 || error.response.status === 401)) {
        continue;
      }
      if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
        continue;
      }
      throw error;
    }
  }

  throw new Error('All retry attempts failed');
};

const scrapeMegaPlay = async (id, ep, type) => {
  const hostUrl = 'https://megaplay.buzz';
  const embedUrl = `${hostUrl}/stream/ani/${id}/${ep}/${type}`;

  let html;
  try {
    const result = await fetchWithRetryReferer(embedUrl, hostUrl);
    html = result.response.data;
  } catch (error) {
    throw new Error('Failed to fetch embed page');
  }

  const $ = cheerio.load(html);

  let iframeUrl = null;
  $('iframe').each((_, el) => {
    const src = $(el).attr('src');
    if (src) iframeUrl = src;
  });

  if (!iframeUrl) {
    const iframeMatch = html.match(/iframe.*?src=["'](.*?)["']/i);
    if (iframeMatch) iframeUrl = iframeMatch[1];
  }

  let internalId = null;
  if (iframeUrl) {
    try {
      const iframeResult = await fetchWithRetryReferer(iframeUrl, hostUrl);
      const iframeHtml = iframeResult.response.data;
      const iframe$ = cheerio.load(iframeHtml);

      const dataId = iframe$('[data-id]').attr('data-id');
      const dataRealid = iframe$('[data-realid]').attr('data-realid');
      internalId = dataId || dataRealid;

      if (!internalId) {
        const idMatch = iframeHtml.match(/["']id["']:\s*["'](\d+)["']/);
        if (idMatch) internalId = idMatch[1];
      }
    } catch (error) {
      console.error('Iframe fetch error:', error.message);
    }
  }

  if (!internalId) {
    const dataIdMatch = html.match(/data-id=["'](\d+)["']/);
    const dataRealidMatch = html.match(/data-realid=["'](\d+)["']/);
    internalId = dataIdMatch?.[1] || dataRealidMatch?.[1];
  }

  let videoData = null;
  if (internalId) {
    try {
      const sourcesUrl = `${hostUrl}/stream/getSources?id=${internalId}`;
      const sourcesResult = await fetchWithRetryReferer(sourcesUrl, hostUrl);
      videoData = sourcesResult.response.data;
    } catch (error) {
      console.error('Sources fetch error:', error.message);
    }
  }

  let sources = [];
  if (videoData?.sources) {
    sources = videoData.sources.map((s) => ({
      file: s.file,
      type: s.type || 'hls',
    }));
  } else {
    const m3u8Match = html.match(/["'](https?:\/\/.*?\.m3u8[^"']*)["']/);
    const mp4Match = html.match(/["'](https?:\/\/.*?\.mp4[^"']*)["']/);
    if (m3u8Match) {
      sources.push({ file: m3u8Match[1], type: 'hls' });
    } else if (mp4Match) {
      sources.push({ file: mp4Match[1], type: 'mp4' });
    }
  }

  let tracks = [];
  const subtitleMatches = html.match(/["'](https?:\/\/.*?\.vtt[^"']*)["']/g) || [];
  subtitleMatches.forEach((match) => {
    const url = match.replace(/["']/g, '');
    const labelMatch = match.match(/label["']?\s*[:=]\s*["']([^"']+)["']/i);
    tracks.push({
      file: url,
      label: labelMatch?.[1] || 'Subtitle',
    });
  });

  let skip = { intro: null, outro: null };
  const introMatch = html.match(/intro.*?(\d+).*?(\d+)/i);
  const outroMatch = html.match(/outro.*?(\d+).*?(\d+)/i);
  if (introMatch) {
    skip.intro = { start: parseInt(introMatch[1]), end: parseInt(introMatch[2]) };
  }
  if (outroMatch) {
    skip.outro = { start: parseInt(outroMatch[1]), end: parseInt(outroMatch[2]) };
  }

  if (sources.length === 0) {
    throw new Error('No video sources found');
  }

  return {
    success: true,
    id: parseInt(id),
    episode: parseInt(ep),
    type,
    data: {
      sources,
      skip,
      tracks,
    },
  };
};

const rewriteM3U8 = (content, baseUrl) => {
  return content.replace(/(https?:\/\/[^"'\s]+)/g, (url) => {
    if (url.includes('.m3u8') || url.includes('.ts')) {
      return `${baseUrl}/proxy/video?url=${encodeURIComponent(url)}`;
    }
    return url;
  });
};

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean);
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'HEAD', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  credentials: false,
}));

app.use(express.json({ limit: '1mb' }));

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/health',
});

app.use('/api', limiter);
app.use('/proxy', limiter);

app.options('*', (req, res) => {
  res.set(CORS_HEADERS);
  res.status(204).end();
});

app.get('/health', (req, res) => {
  res.set(CORS_HEADERS);
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.set(CORS_HEADERS);
  res.send(`
    <!DOCTYPE html>
    <html>
    <head><title>NimeCore Worker</title></head>
    <body>
      <h1>NimeCore Worker Scraper</h1>
      <p>Status: Running</p>
      <p>Version: 1.0.0</p>
    </body>
    </html>
  `);
});

app.get('/api', (req, res) => {
  res.set(CORS_HEADERS);
  res.json({
    name: 'NimeCore Worker',
    version: '1.0.0',
    status: 'running',
    endpoints: ['/health', '/proxy/m3u8', '/proxy/video', '/proxy/subtitle', '/:id/:ep/:type'],
  });
});

app.get('/proxy/m3u8', async (req, res) => {
  try {
    const { url, referer } = req.query;
    if (!url) {
      return res.status(400).json({ success: false, message: 'URL is required' });
    }

    const result = await fetchWithRetryReferer(url, referer || 'https://megaplay.buzz/');
    const content = result.response.data;
    const rewritten = rewriteM3U8(content, `${req.protocol}://${req.get('host')}`);

    res.set(CORS_HEADERS);
    res.set('Content-Type', 'application/vnd.apple.mpegurl');
    res.send(rewritten);
  } catch (error) {
    console.error('Proxy m3u8 error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/proxy/video', async (req, res) => {
  try {
    const { url, referer } = req.query;
    if (!url) {
      return res.status(400).json({ success: false, message: 'URL is required' });
    }

    const result = await fetchWithRetryReferer(url, referer || 'https://megaplay.buzz/');
    const data = result.response.data;

    res.set(CORS_HEADERS);
    res.set('Content-Type', result.response.headers['content-type'] || 'video/mp4');
    res.send(data);
  } catch (error) {
    console.error('Proxy video error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/proxy/subtitle', async (req, res) => {
  try {
    const { url, referer } = req.query;
    if (!url) {
      return res.status(400).json({ success: false, message: 'URL is required' });
    }

    const result = await fetchWithRetryReferer(url, referer || 'https://megaplay.buzz/');
    const content = result.response.data;

    res.set(CORS_HEADERS);
    res.set('Content-Type', 'text/vtt; charset=utf-8');
    res.send(content);
  } catch (error) {
    console.error('Proxy subtitle error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/:id/:ep/:type', async (req, res) => {
  try {
    const { id, ep, type } = req.params;
    const { intro_start, intro_end, outro_start, outro_end } = req.query;

    const result = await scrapeMegaPlay(id, ep, type);

    if (intro_start && intro_end) {
      result.data.skip.intro = {
        start: parseTime(intro_start),
        end: parseTime(intro_end),
      };
    }
    if (outro_start && outro_end) {
      result.data.skip.outro = {
        start: parseTime(outro_start),
        end: parseTime(outro_end),
      };
    }

    res.set(CORS_HEADERS);
    res.json(result);
  } catch (error) {
    console.error('Scrape error:', error);
    res.status(404).json({
      success: false,
      message: error.message || 'Failed to scrape video',
    });
  }
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Not found' });
});

const server = app.listen(PORT, () => {
  console.log(`NimeCore Worker running on port ${PORT} in ${NODE_ENV} mode`);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err);
  server.close(() => process.exit(1));
});

module.exports = app;
