// Подключаем необходимые модули
require('dotenv').config(); // Загружает переменные из файла .env
const express = require('express'); // Фреймворк для создания сервера
const cors = require('cors'); // Разрешает кросс-доменные запросы
const helmet = require('helmet'); // Улучшает безопасность HTTP-заголовков
const cookieParser = require('cookie-parser'); // Парсит cookies из запросов
const fetch = require('node-fetch'); // Выполняет HTTP-запросы
const rateLimit = require('express-rate-limit'); // Для ограничения частоты запросов
const https = require('https'); // Для HTTPS сервера
const fs = require('fs'); // Для чтения сертификатов
const http = require('http'); // Для HTTP редиректа
const path = require('path'); // Для работы с путями

// Создаём экземпляр приложения Express
const app = express();

// Настраиваем доверие к прокси (необходимо для корректной работы rate limiting за прокси)
app.set('trust proxy', 1);

// Получаем переменные из файла .env
const UNSPLASH_KEY = process.env.UNSPLASH_KEY; // Ключ API Unsplash
const PORT = parseInt(process.env.PORT, 10) || 443; // Порт сервера (по умолчанию 443)
const CACHE_TTL = parseInt(process.env.CACHE_TTL, 10) || 43200000; // Время жизни кэша (по умолчанию 12 часов)

// Проверяем наличие ключа API
if (!UNSPLASH_KEY) {
  console.error('Ошибка: UNSPLASH_KEY не задан в файле .env');
  console.error('Создайте файл .env и добавьте ваш API ключ Unsplash');
  process.exit(1); // Завершаем процесс, если ключ отсутствует
}

// Надежная раздача статических файлов
const serveStatic = (req, res, next) => {
  const startTime = Date.now();
  const url = req.url;
  
  // Разрешенные расширения файлов
  const allowedExtensions = ['.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico'];
  const ext = path.extname(url).toLowerCase();
  
  if (!allowedExtensions.includes(ext)) {
    return next();
  }
  
  // Безопасный путь (защита от path traversal)
  const safePath = path.normalize(url).replace(/^(\.\.[\/\\])+/, '');
  const filePath = path.join(__dirname, 'site', safePath);
  
  // Проверяем, что файл находится в разрешенной директории
  const resolvedPath = path.resolve(filePath);
  const sitePath = path.resolve(path.join(__dirname, 'site'));
  
  if (!resolvedPath.startsWith(sitePath)) {
    logTime(`Попытка доступа к запрещенному пути: ${url}`);
    return res.status(403).send('Доступ запрещен');
  }
  
  // Проверяем существование файла
  if (!fs.existsSync(filePath)) {
    logTime(`Файл не найден: ${filePath}`);
    return res.status(404).send('Файл не найден');
  }
  
  // Получаем статистику файла
  const stats = fs.statSync(filePath);
  if (!stats.isFile()) {
    return res.status(404).send('Не файл');
  }
  
  // Устанавливаем правильные заголовки
  const mimeTypes = {
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
  };
  
  res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
  
  // Кэширование (1 час для CSS/JS, 24 часа для изображений)
  const maxAge = ext === '.css' || ext === '.js' ? 3600 : 86400;
  res.setHeader('Cache-Control', `public, max-age=${maxAge}`);
  
  // ETag для кэширования
  const etag = `"${stats.size}-${stats.mtime.getTime()}"`;
  res.setHeader('ETag', etag);
  
  // Проверяем If-None-Match
  if (req.headers['if-none-match'] === etag) {
    return res.status(304).end();
  }
  
  // Логируем успешный запрос
  const responseTime = Date.now() - startTime;
  logTime(`Статический файл: ${url} (${stats.size} байт, ${responseTime}мс)`);
  
  // Отправляем файл с обработкой ошибок
  res.sendFile(filePath, (err) => {
    if (err) {
      logTime(`Ошибка отправки файла ${url}: ${err.message}`);
      if (!res.headersSent) {
        res.status(500).send('Ошибка сервера');
      }
    }
  });
};

// Применяем middleware для статических файлов
app.use(serveStatic);

// Настраиваем раздачу статических файлов из папки site (ПЕРЕД Helmet)
app.use(express.static(path.join(__dirname, 'site')));

// Подключаем middleware (промежуточные обработчики)
app.use(helmet()); // Защита HTTP-заголовков
app.use(cookieParser()); // Парсинг cookies

// --- Rate Limiting ---
const limiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 час
  max: 20, // максимум 20 запросов с одного IP за 1 час
  message: 'Слишком много запросов с этого IP, попробуйте позже.',
  handler: (req, res, next) => {
    logTime(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).send('Слишком много запросов с этого IP, попробуйте позже.');
  }
});

// Применяем только к маршруту /photos
app.use('/photos', limiter);

app.use(cors({ origin: '*', credentials: true }));

app.use(express.json()); // Парсинг JSON в теле запросов

// Логируем все входящие запросы
app.use((request, response, next) => {
  logTime(`Запрос: ${request.method} ${request.originalUrl}`); // Логируем метод и URL запроса
  
  // Дополнительное логирование для статических файлов
  if (request.originalUrl.match(/\.(css|js|png|jpg|jpeg|gif|svg)$/)) {
    logTime(`Статический файл: ${request.originalUrl}`);
    
    // Проверяем, существует ли файл
    const filePath = path.join(__dirname, 'site', request.originalUrl);
    if (fs.existsSync(filePath)) {
      logTime(`Файл существует: ${filePath}`);
    } else {
      logTime(`Файл НЕ существует: ${filePath}`);
    }
  }
  
  next(); // Передаём управление следующему обработчику
});

// Создаём глобальный кэш для хранения данных
const cache = new Map();

// Функция для создания уникального ключа кэша
function generateCacheKey(searchQuery) {
  return (searchQuery || 'wallpapers').trim().toLowerCase(); // Приводим запрос к нижнему регистру
}

// Функция для запроса изображения из Unsplash API
async function fetchUnsplashImage(searchQuery) {
  const url = `https://api.unsplash.com/photos/random?client_id=${UNSPLASH_KEY}&orientation=landscape&query=${encodeURIComponent(searchQuery)}`;
  const apiResponse = await fetch(url);
  if (!apiResponse.ok) {
    const errorText = await apiResponse.text();
    throw new Error(`Unsplash API вернул ошибку ${apiResponse.status}: ${errorText}`);
  }
  return apiResponse.json(); // Возвращаем данные в формате JSON
}

async function logTime(logTime) {
  const startCurrentTime = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  console.log(`${startCurrentTime} ${logTime}`); // Логируем время с заданным сообщением
}

// Главная страница - отдаем index.html
app.get('/', (request, response) => {
  response.sendFile(path.join(__dirname, 'site', 'index.html'));
});

// Маршрут для получения случайного изображения
app.get('/photos', async (request, response) => {
  try {
    const searchQuery = request.query.query || 'wallpapers'; // Запрос пользователя или значение по умолчанию
    const cacheKey = generateCacheKey(searchQuery); // Генерируем ключ для кэша
    const currentTime = Date.now(); // Текущее время
    const shouldRefresh = request.query.refresh !== undefined; // Проверяем, нужно ли обновить данные

    // Проверяем, есть ли данные в кэше
    if (!shouldRefresh && cache.has(cacheKey)) {
      const { imageData, cacheTimestamp } = cache.get(cacheKey);
      if (currentTime - cacheTimestamp < CACHE_TTL) {
        await logTime(`Кэш найден для "${searchQuery}"`); // Логируем время кэша
        return response.json(imageData);
      }
      cache.delete(cacheKey); // Удаляем устаревшие данные
      await logTime(`Кэш устарел для "${searchQuery}"`); // Логируем время устаревания кэша
    } else {
      await logTime(`Кэш не найден для "${searchQuery}"`); // Логируем время отсутствия кэша
    }

    // Запрашиваем новые данные из Unsplash API
    const imageData = await fetchUnsplashImage(searchQuery);

    // Сохраняем данные в кэш, если не требуется принудительное обновление
    if (!shouldRefresh) {
      cache.set(cacheKey, { imageData, cacheTimestamp: currentTime });
      await logTime(`Кэш обновлён для "${searchQuery}"`);
    } else {
      await logTime(`Кэш не обновлён для "${searchQuery}" (принудительное обновление)`);
    }

    return response.json(imageData); // Отправляем данные клиенту
  } catch (error) {
    console.error('Ошибка в маршруте /photos:', error);
    return response.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Маршрут для вызова download endpoint Unsplash API
app.post('/download', async (request, response) => {
  try {
    const { downloadLocation } = request.body;
    
    if (!downloadLocation) {
      return response.status(400).json({ error: 'downloadLocation is required' });
    }

    // Вызываем download endpoint Unsplash API
    const downloadResponse = await fetch(downloadLocation, {
      method: 'GET',
      headers: {
        'Authorization': `Client-ID ${UNSPLASH_KEY}`
      }
    });

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

// --- SSL сертификаты ---
const sslOptions = {
  key: fs.readFileSync('/etc/letsencrypt/live/tabskin.ru/privkey.pem'),
  cert: fs.readFileSync('/etc/letsencrypt/live/tabskin.ru/fullchain.pem')
};

// Запускаем HTTPS сервер на порту 443 (стандартный HTTPS порт)
https.createServer(sslOptions, app).listen(443, () => {
  logTime(`Сервер Tabskin запущен на https://tabskin.ru (порт 443)`);
  logTime(`Landing страница доступна по адресу: https://tabskin.ru/`);
  logTime(`API доступен по адресу: https://tabskin.ru/photos`);
  logTime(`HTTP редирект доступен на порту 80`);
});

// Запускаем HTTP сервер для редиректа на HTTPS
http.createServer((req, res) => {
  // Получаем хост и порт из заголовка
  const host = req.headers['host'] ? req.headers['host'].replace(/:\d+$/, '') : 'tabskin.ru';
  res.writeHead(301, { "Location": `https://${host}${req.url}` });
  res.end();
}).listen(80);

// Обработчик 404 ошибок
app.use((req, res) => {
  logTime(`404 ошибка: ${req.method} ${req.originalUrl}`);
  res.status(404).send('Страница не найдена');
});

// Обрабатываем необработанные исключения
process.on('uncaughtException', (error) => {
  console.error('Необработанное исключение:', error);
});

// Обрабатываем необработанные отказы промисов
process.on('unhandledRejection', (reason) => {
  console.error('Необработанный отказ промиса:', reason);
});