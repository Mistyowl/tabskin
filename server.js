require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const fetch = require('node-fetch');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const path = require('path');
const { SocksProxyAgent } = require('socks-proxy-agent');

const app = express();
app.set('trust proxy', 1);

const UNSPLASH_KEY = process.env.UNSPLASH_KEY;
const HOST = process.env.HOST || '127.0.0.1';
const PORT = parseInt(process.env.PORT, 10) || 3000;
const CACHE_TTL = parseInt(process.env.CACHE_TTL, 10) || 43200000;

const PROXY_HOST = process.env.PROXY_HOST;
const PROXY_PORT = parseInt(process.env.PROXY_PORT, 10) || 1080;
const PROXY_USERNAME = process.env.PROXY_USERNAME;
const PROXY_PASSWORD = process.env.PROXY_PASSWORD;
const USE_PROXY = process.env.USE_PROXY === 'true';

if (!UNSPLASH_KEY) {
  console.error('Ошибка: UNSPLASH_KEY не задан в файле .env');
  process.exit(1);
}

async function logTime(message) {
  const time = new Date().toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  console.log(`${time} ${message}`);
}

const serveStatic = (req, res, next) => {
  const startTime = Date.now();
  const url = req.url;
  const allowedExtensions = ['.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp'];
  const ext = path.extname(url).toLowerCase();

  if (!allowedExtensions.includes(ext)) {
    return next();
  }

  const safePath = path.normalize(url).replace(/^(\.\.[\/\\])+/, '');
  const filePath = path.join(__dirname, 'site', safePath);
  const resolvedPath = path.resolve(filePath);
  const sitePath = path.resolve(path.join(__dirname, 'site'));

  if (!resolvedPath.startsWith(sitePath)) {
    logTime(`Попытка доступа к запрещенному пути: ${url}`);
    return res.status(403).send('Доступ запрещен');
  }

  if (!fs.existsSync(filePath)) {
    logTime(`Файл не найден: ${filePath}`);
    return res.status(404).send('Файл не найден');
  }

  const stats = fs.statSync(filePath);
  if (!stats.isFile()) {
    return res.status(404).send('Не файл');
  }

  const mimeTypes = {
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
  };

  res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
  const maxAge = ext === '.css' || ext === '.js' ? 3600 : 86400;
  res.setHeader('Cache-Control', `public, max-age=${maxAge}`);

  const etag = `"${stats.size}-${stats.mtime.getTime()}"`;
  res.setHeader('ETag', etag);

  if (req.headers['if-none-match'] === etag) {
    return res.status(304).end();
  }

  const responseTime = Date.now() - startTime;
  logTime(`Статический файл: ${url} (${stats.size} байт, ${responseTime}мс)`);

  res.sendFile(filePath, (err) => {
    if (err && !res.headersSent) {
      logTime(`Ошибка отправки файла ${url}: ${err.message}`);
      res.status(500).send('Ошибка сервера');
    }
  });
};

app.use(serveStatic);
app.use(express.static(path.join(__dirname, 'site')));
app.use(helmet());
app.use(cookieParser());

const limiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  handler: (req, res) => {
    logTime(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).send('Слишком много запросов с этого IP, попробуйте позже.');
  },
});

app.use('/photos', limiter);
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());

app.use((request, response, next) => {
  logTime(`Запрос: ${request.method} ${request.originalUrl}`);
  next();
});

const cache = new Map();

function createSocksAgent() {
  if (!USE_PROXY || !PROXY_HOST) {
    return null;
  }

  let proxyUrl = `socks5://${PROXY_HOST}:${PROXY_PORT}`;
  if (PROXY_USERNAME && PROXY_PASSWORD) {
    proxyUrl = `socks5://${PROXY_USERNAME}:${PROXY_PASSWORD}@${PROXY_HOST}:${PROXY_PORT}`;
  }

  return new SocksProxyAgent(proxyUrl);
}

function generateCacheKey(searchQuery) {
  return (searchQuery || 'wallpapers').trim().toLowerCase();
}

async function fetchUnsplashImage(searchQuery) {
  const url = `https://api.unsplash.com/photos/random?client_id=${UNSPLASH_KEY}&orientation=landscape&query=${encodeURIComponent(searchQuery)}`;
  const fetchOptions = {
    timeout: 30000,
    headers: {
      'User-Agent': 'TabSkin/1.0',
    },
  };

  const socksAgent = createSocksAgent();
  if (socksAgent) {
    fetchOptions.agent = socksAgent;
    await logTime(`Используется SOCKS5 прокси: ${PROXY_HOST}:${PROXY_PORT}`);
  } else {
    await logTime('Прямое подключение к Unsplash API (без прокси)');
  }

  const apiResponse = await fetch(url, fetchOptions);
  if (!apiResponse.ok) {
    const errorText = await apiResponse.text();
    throw new Error(`Unsplash API вернул ошибку ${apiResponse.status}: ${errorText}`);
  }

  return apiResponse.json();
}

app.get('/', (request, response) => {
  response.sendFile(path.join(__dirname, 'site', 'index.html'));
});

app.get('/photos', async (request, response) => {
  try {
    const searchQuery = request.query.query || 'wallpapers';
    const cacheKey = generateCacheKey(searchQuery);
    const currentTime = Date.now();
    const shouldRefresh = request.query.refresh !== undefined;

    if (!shouldRefresh && cache.has(cacheKey)) {
      const { imageData, cacheTimestamp } = cache.get(cacheKey);
      if (currentTime - cacheTimestamp < CACHE_TTL) {
        await logTime(`Кэш найден для "${searchQuery}"`);
        return response.json(imageData);
      }
      cache.delete(cacheKey);
      await logTime(`Кэш устарел для "${searchQuery}"`);
    } else {
      await logTime(`Кэш не найден для "${searchQuery}"`);
    }

    const imageData = await fetchUnsplashImage(searchQuery);

    if (!shouldRefresh) {
      cache.set(cacheKey, { imageData, cacheTimestamp: currentTime });
      await logTime(`Кэш обновлён для "${searchQuery}"`);
    } else {
      await logTime(`Кэш не обновлён для "${searchQuery}" (принудительное обновление)`);
    }

    return response.json(imageData);
  } catch (error) {
    console.error('Ошибка в маршруте /photos:', error);
    return response.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

app.post('/download', async (request, response) => {
  try {
    const { downloadLocation } = request.body;

    if (!downloadLocation) {
      return response.status(400).json({ error: 'downloadLocation is required' });
    }

    const downloadOptions = {
      method: 'GET',
      headers: {
        Authorization: `Client-ID ${UNSPLASH_KEY}`,
        'User-Agent': 'TabSkin/1.0',
      },
      timeout: 30000,
    };

    const socksAgent = createSocksAgent();
    if (socksAgent) {
      downloadOptions.agent = socksAgent;
    }

    const downloadResponse = await fetch(downloadLocation, downloadOptions);
    if (!downloadResponse.ok) {
      throw new Error(`Download endpoint returned status ${downloadResponse.status}`);
    }

    await logTime(`Download endpoint called for: ${downloadLocation}`);
    return response.json({ success: true });
  } catch (error) {
    console.error('Ошибка в маршруте /download:', error);
    return response.status(500).json({ error: 'Failed to call download endpoint' });
  }
});

app.use((req, res) => {
  logTime(`404 ошибка: ${req.method} ${req.originalUrl}`);
  res.status(404).send('Страница не найдена');
});

app.listen(PORT, HOST, () => {
  logTime(`Tabskin запущен на http://${HOST}:${PORT}`);
  logTime('Маршрутизация поддоменов: nginx');
  logTime('API: /photos, /download');

  if (USE_PROXY && PROXY_HOST) {
    logTime(`SOCKS5 прокси включен: ${PROXY_HOST}:${PROXY_PORT}`);
  } else {
    logTime('SOCKS5 прокси отключен');
  }
});

process.on('uncaughtException', (error) => {
  console.error('Необработанное исключение:', error);
});

process.on('unhandledRejection', (reason) => {
  console.error('Необработанный отказ промиса:', reason);
});
