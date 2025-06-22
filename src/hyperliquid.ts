import WebSocket from 'ws';
import { config } from './config';
import { SubscriptionMessage, WsMessage, WsUserFill, WsUserNonFundingLedgerUpdate, isWsUserNonFundingLedgerUpdate, isWsUserNonFundingLedgerUpdateArray, isWsUserFill, isWsUserFillArray, AddressEntry } from './types';
import { formatUserFillMessage } from './utils';
import { Telegraf } from 'telegraf';

export class HyperliquidWebSocket {
  private ws: WebSocket | null = null;
  private bot: Telegraf;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;
  private pingInterval: NodeJS.Timeout | null = null;
  private processedTxIds = new Set<string>();
  private addresses: AddressEntry[] = [];
  private lastMessage: WsMessage | null = null;

  constructor(bot: Telegraf) {
    this.bot = bot;
  }

  public setAddresses(addresses: AddressEntry[]): void {
    this.addresses = addresses;
    this.subscribe();
  }

  public getLastMessage(): WsMessage | null {
    return this.lastMessage;
  }

  public connect(): void {
    console.log('Attempting WebSocket connection...');
    this.ws = new WebSocket(config.hyperliquidWsUrl);

    this.ws.on('open', () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      this.startPing();
      this.subscribe();
    });

    this.ws.on('message', (data: Buffer) => {
      this.handleMessage(data);
    });

    this.ws.on('pong', () => {
      console.log('Received pong');
    });

    this.ws.on('error', (error: Error) => {
      console.error('WebSocket error:', error);
    });

    this.ws.on('close', (code: number, reason: Buffer) => {
      console.log(`WebSocket closed: Code ${code}, Reason: ${reason.toString()}`);
      this.stopPing();
      this.handleReconnect();
    });
  }

  private startPing(): void {
    if (this.pingInterval) return;

    this.pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        console.log('Sending ping');
        this.ws.ping();
      }
    }, config.pingIntervalMs);
  }

  private stopPing(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private subscribe(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    const subscriptionTypes = ['userFills'] as const;
    for (const addressEntry of this.addresses) {
      for (const type of subscriptionTypes) {
        const subscription: SubscriptionMessage = {
          method: 'subscribe',
          subscription: {
            type,
            user: addressEntry.address,
          },
        };
        this.ws.send(JSON.stringify(subscription));
        console.log(`Subscribed to ${type} for user: ${addressEntry.label} (${addressEntry.address})`);
      }
    }
  }

  private async handleMessage(data: Buffer): Promise<void> {
    try {
      const message: WsMessage = JSON.parse(data.toString());
      this.lastMessage = message;
      // console.log('Received message:', JSON.stringify(message, null, 2));

      if (message.channel === 'subscriptionResponse') {
        console.log('Subscription confirmed:', message.data);
        return;
      }

      if (message.channel === 'userFills' && message.data && !message.data.isSnapshot) {
        const user = message.data.user.toLowerCase();
        let fills: WsUserFill[] = message.data.fills;

        for (const fill of fills) {
          const addressEntry = this.addresses.find((entry) => entry.address.toLowerCase() === user);

          if (!addressEntry) {
            continue;
          }

          const messageText = formatUserFillMessage(fill) + `\nLabel: *${addressEntry.label}*`;
          await this.bot.telegram.sendMessage(config.telegramChatId, messageText, { parse_mode: 'Markdown' }).catch((err) => {
            console.error('Error sending Telegram message:', err);
          });
        }
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnect attempts reached. Exiting...');
      process.exit(1);
    }

    this.reconnectAttempts++;
    const baseDelayMs = Math.min(1000 * 2 ** this.reconnectAttempts, 30000);
    const jitterMs = Math.random() * 100;
    console.log(`Reconnecting in ${(baseDelayMs + jitterMs) / 1000}s...`);

    setTimeout(() => {
      if (this.ws) {
        this.ws.close();
        this.ws = null;
      }
      this.connect();
    }, baseDelayMs + jitterMs);
  }

  public disconnect(): void {
    this.stopPing();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      console.log('WebSocket disconnected');
    }
  }
}

export default HyperliquidWebSocket;