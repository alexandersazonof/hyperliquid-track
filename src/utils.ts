import { WsUserFill } from './types';

export function formatUserFillMessage(fill: WsUserFill): string {
  const date = new Date(fill.time).toLocaleString();
  return `Fill Event: 📈\nCoin: ${fill.coin} 💰\nType: ${fill.dir} ↔️\nPrice: ${fill.px} 💸\nPosition: ${(+fill.sz * +fill.px).toFixed(2)}$ 📏\nTime: ${date} ⏰\nPnl: ${fill.closedPnl}$ 📈`;
}