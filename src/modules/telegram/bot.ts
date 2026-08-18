import { Bot } from 'grammy';

const token = process.env.TELEGRAM_BOT_TOKEN || '';

export const bot = new Bot(token || 'MOCK_TOKEN');

// /start command handler
bot.command('start', async (ctx) => {
  await ctx.reply(
    `🚀 *Developer Training System (DTS)*\n\n` +
    `Добро пожаловать в персональную систему подготовки на Middle Full-stack Developer!\n\n` +
    `Доступные команды:\n` +
    `• /today — Получить план и задания на сегодня\n` +
    `• /review — Карточки повторения (Recall Queue)\n` +
    `• /task — Главная практическая задача\n` +
    `• /explain — Задача на объяснение архитектуры/кода\n` +
    `• /progress — Текущий статус готовности и Middle Gate\n`,
    { parse_mode: 'Markdown' }
  );
});

// /today command handler
bot.command('today', async (ctx) => {
  await ctx.reply(
    `📅 *Дневная сессия DAY 1*\n\n` +
    `1. 🔄 *Recall*: 5 карточек повторения (/review)\n` +
    `2. 💻 *Coding Task*: Реализация middleware авторизации (/task)\n` +
    `3. 🗣️ *Explanation Task*: Как работает Event Loop в Node.js (/explain)\n\n` +
    `Используйте команды выше для выполнения. Удачи!`,
    { parse_mode: 'Markdown' }
  );
});

// /progress command handler
bot.command('progress', async (ctx) => {
  await ctx.reply(
    `📊 *Ваш прогресс подготовки*\n\n` +
    `• Retention: 85%\n` +
    `• Independent coding: 70%\n` +
    `• Project understanding: 75%\n` +
    `• Interview readiness: 45%\n\n` +
    `⚠️ *Middle Gate: NOT READY*\n` +
    `Критический блокер: *Debugging & System Design*\n\n` +
    `Рекомендация: Решите сегодня 1 задачу отладки.`,
    { parse_mode: 'Markdown' }
  );
});

// Catch errors
bot.catch((err) => {
  console.error('[Telegram Bot Error]', err);
});
