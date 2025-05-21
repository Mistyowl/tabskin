// Подключаем необходимые модули
require('dotenv').config(); // Загружает переменные из файла .env
const express = require('express'); // Фреймворк для создания сервера
const cors = require('cors'); // Разрешает кросс-доменные запросы
const helmet = require('helmet'); // Улучшает безопасность HTTP-заголовков
const cookieParser = require('cookie-parser'); // Парсит cookies из запросов
const fetch = require('node-fetch'); // Выполняет HTTP-запросы

// Создаём экземпляр приложения Express
const app = express();

// Получаем переменные из файла .env
const UNSPLASH_KEY = process.env.UNSPLASH_KEY; // Ключ API Unsplash
const PORT = parseInt(process.env.PORT, 10) || 3000; // Порт сервера (по умолчанию 3000)
const CACHE_TTL = parseInt(process.env.CACHE_TTL, 10) || 43200000; // Время жизни кэша (по умолчанию 12 часов)

// Проверяем наличие ключа API
if (!UNSPLASH_KEY) {
  console.error('Ошибка: UNSPLASH_KEY не задан в файле .env');
  process.exit(1); // Завершаем процесс, если ключ отсутствует
}

// Подключаем middleware (промежуточные обработчики)
app.use(helmet()); // Защита HTTP-заголовков
app.use(cookieParser()); // Парсинг cookies
app.use(cors({ origin: '*', credentials: true })); // Разрешение CORS для всех источников
app.use(express.json()); // Парсинг JSON в теле запросов

// Логируем все входящие запросы
app.use((request, response, next) => {
  console.log(`[${new Date().toISOString()}] ${request.method} ${request.originalUrl}`);
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
        console.log(`→ [CACHE HIT] "${searchQuery}"`); // Данные найдены в кэше
        return response.json(imageData);
      }
      cache.delete(cacheKey); // Удаляем устаревшие данные
      console.log(`→ [CACHE EXPIRED] "${searchQuery}"`);
    } else {
      console.log(`→ [CACHE MISS] "${searchQuery}"`); // Данные отсутствуют в кэше
    }

    // Запрашиваем новые данные из Unsplash API
    const imageData = await fetchUnsplashImage(searchQuery);

    // Сохраняем данные в кэш, если не требуется принудительное обновление
    if (!shouldRefresh) {
      cache.set(cacheKey, { imageData, cacheTimestamp: currentTime });
      console.log(`→ [CACHE SET] "${searchQuery}"`);
    } else {
      console.log(`→ [REFRESH] "${searchQuery}" (кэш не обновлён)`);
    }

    return response.json(imageData); // Отправляем данные клиенту
  } catch (error) {
    console.error('Ошибка в маршруте /photos:', error);
    return response.status(500).json({ error: 'Внутренняя ошибка сервера' });
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
  console.log(`Unsplash proxy запущен на http://0.0.0.0:${PORT}`);
});