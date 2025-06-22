import * as dotenv from 'dotenv';

dotenv.config();

export const config = {
  telegramToken: process.env.TELEGRAM_TOKEN || '',
  telegramChatId: process.env.TELEGRAM_CHAT_ID || '',
  hyperliquidWsUrl: 'wss://api.hyperliquid.xyz/ws',
  pingIntervalMs: 15000, // Send ping every 15 seconds
};

if (!config.telegramToken || !config.telegramChatId) {
  console.error('Missing required environment variables');
  process.exit(1);
}