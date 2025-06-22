process.on('warning', (warning) => {
  if (warning.name === 'DeprecationWarning' && warning.message.includes('DEP0040')) {
    return;
  }
  console.warn(warning);
});

import TelegramBot from './telegram';

const telegramBot = new TelegramBot();

telegramBot.start();