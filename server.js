// Подключаем необходимые модули
require('dotenv').config(); // Загружает переменные из файла .env
const express = require('express'); // Фреймворк для создания сервера
const cors = require('cors'); // Разрешает кросс-доменные запросы
const helmet = require('helmet'); // Улучшает безопасность HTTP-заголовков
const cookieParser = require('cookie-parser'); // Парсит cookies из запросов
const fetch = require('node-fetch'); // Выполняет HTTP-запросы
const rateLimit = require('express-rate-limit'); // Для ограничения частоты запросов

// Создаём экземпляр приложения Express
const app = express();

// Получаем переменные из файла .env
const UNSPLASH_KEY = process.env.UNSPLASH_KEY; // Ключ API Unsplash
const PORT = parseInt(process.env.PORT, 10) || 8000; // Порт сервера (по умолчанию 8000)
const CACHE_TTL = parseInt(process.env.CACHE_TTL, 10) || 43200000; // Время жизни кэша (по умолчанию 12 часов)

// Проверяем наличие ключа API
if (!UNSPLASH_KEY) {
  console.error('Ошибка: UNSPLASH_KEY не задан в файле .env');
  process.exit(1); // Завершаем процесс, если ключ отсутствует
}

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
    return response.status(500).json({ error: + 'Внутренняя ошибка сервера' });
  }
});

// Обрабатываем необработанные исключения
process.on('uncaughtException', (error) => {
  console.error('Необработанное исключение:', error);
});

// Обрабатываем необработанные отказы промисов
process.on('unhandledRejection', (reason) => {
  console.error('Необработанный отказ промиса:', reason);
});

// Запускаем сервер
app.listen(PORT, '0.0.0.0', () => {
  logTime(`Сервер Tabskin запущен на http с портом ${PORT}`); // Логируем время запуска сервера
});