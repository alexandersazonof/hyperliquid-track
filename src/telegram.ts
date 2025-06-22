import { Telegraf } from 'telegraf';
import { config } from './config';
import { AddressEntry } from './types';
import HyperliquidWebSocket from './hyperliquid';

export class TelegramBot {
  private bot: Telegraf; // 🤖
  private addresses: AddressEntry[] = [];
  private ws: HyperliquidWebSocket;

  constructor() {
    this.bot = new Telegraf(config.telegramToken);
    this.ws = new HyperliquidWebSocket(this.bot);
  }

  public start(): void {
    this.ws.connect(); // 🔌

    this.bot.command('start', (ctx) => {
      ctx.reply('Bot started! 🚀 Use commands:\n/add {label} {address} - add address\n/remove {label} - remove address\n/list - list addresses\n/debug - show last message');
    });

    this.bot.command('add', (ctx) => {
      const args = ctx.message.text.split(' ').slice(1);
      if (args.length !== 2) {
        return ctx.reply('Usage: /add {label} {address} ❗');
      }
      const [label, address] = args;
      if (this.addresses.some((entry) => entry.label === label)) {
        return ctx.reply(`Label "${label}" already exists 😕`);
      }
      if (!address.match(/^0x[a-fA-F0-9]{40}$/)) {
        return ctx.reply('Invalid address format 🚫');
      }
      this.addresses.push({ label, address });
      this.ws.setAddresses(this.addresses);
      ctx.reply(`Added address: ${label} (${address}) ✅`);
    });

    this.bot.command('remove', (ctx) => {
      const args = ctx.message.text.split(' ').slice(1);
      if (args.length !== 1) {
        return ctx.reply('Usage: /remove {label} ❗');
      }
      const [label] = args;
      const index = this.addresses.findIndex((entry) => entry.label === label);
      if (index === -1) {
        return ctx.reply(`Label "${label}" not found 😕`);
      }
      this.addresses.splice(index, 1);
      this.ws.setAddresses(this.addresses);
      ctx.reply(`Removed label: ${label} 🗑️`);
    });

    this.bot.command('list', (ctx) => {
      if (this.addresses.length === 0) {
        return ctx.reply('Address list is empty 📭');
      }
      const list = this.addresses.map((entry) => `${entry.label}: ${entry.address}`).join('\n');
      ctx.reply(`Address list: 📋\n${list}`);
    });

    this.bot.command('debug', (ctx) => {
      const lastMessage = this.ws.getLastMessage();
      if (!lastMessage) {
        return ctx.reply('No recent messages 📪');
      }
      const messageStr = JSON.stringify(lastMessage, null, 2).substring(0, 4000);
      ctx.reply(`Last message: 📬\n\`\`\`json\n${messageStr}\n\`\`\``, { parse_mode: 'Markdown' });
    });

    this.bot.catch((err, ctx) => {
      console.error(`Bot error: ${err} 😱`);
    });

    this.bot.launch().then(() => {
      console.log('Telegram bot launched 🎉');
    });

    process.once('SIGINT', () => this.stop('SIGINT'));
    process.once('SIGTERM', () => this.stop('SIGTERM'));
  }

  public getBotInstance(): Telegraf {
    return this.bot; // 🤖
  }

  private stop(signal: string): void {
    this.ws.disconnect(); // 🔌
    this.bot.stop(signal);
    console.log('Telegram bot stopped 🛑');
  }
}

export default TelegramBot;