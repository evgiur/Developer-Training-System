import { bot } from '../modules/telegram/bot';

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token || token === 'mock_telegram_token') {
  console.error('❌ TELEGRAM_BOT_TOKEN не задан или содержит mock-значение.');
  console.error('👉 Получите токен у @BotFather в Telegram и укажите его в файле .env');
  process.exit(1);
}

console.log('🤖 Запуск Telegram бота (Long Polling)...');

bot.start({
  onStart: (botInfo) => {
    console.log(`✅ Бот @${botInfo.username} успешно запущен и готов принимать сообщения!`);
  },
});
