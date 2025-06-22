export interface WsUserFill {
  coin: string;
  px: string;
  time: number;
  closedPnl: string;
  dir: string;
  sz: string;
}

export interface WsUserNonFundingLedgerUpdate {
  type: 'deposit' | 'withdrawal' | 'transfer' | 'liquidation';
  coin: string;
  amount: string;
  timestamp: number;
  txId: string;
  isSnapshot?: boolean;
  user?: string;
}

export interface SubscriptionMessage {
  method: 'subscribe';
  subscription: {
    type: 'userFills' | 'userNonFundingLedgerUpdates';
    user: string;
  };
}

export interface WsMessage {
  channel: 'subscriptionResponse' | 'userFills' | 'userNonFundingLedgerUpdates';
  data: any;
}

export interface AddressEntry {
  label: string;
  address: string;
}

// Type guard для WsUserNonFundingLedgerUpdate
export function isWsUserNonFundingLedgerUpdate(data: any): data is WsUserNonFundingLedgerUpdate {
  return (
    data &&
    typeof data === 'object' &&
    ['deposit', 'withdrawal', 'transfer', 'liquidation'].includes(data.type) &&
    typeof data.coin === 'string' &&
    typeof data.amount === 'string' &&
    typeof data.timestamp === 'number' &&
    typeof data.txId === 'string'
  );
}

export function isWsUserNonFundingLedgerUpdateArray(data: any): data is WsUserNonFundingLedgerUpdate[] {
  return Array.isArray(data) && data.every(isWsUserNonFundingLedgerUpdate);
}

export function isWsUserFill(data: any): data is WsUserFill {
  return (
    data &&
    typeof data === 'object' &&
    typeof data.user === 'string' &&
    typeof data.coin === 'string' &&
    typeof data.side === 'string' &&
    typeof data.px === 'string' &&
    typeof data.sz === 'string' &&
    typeof data.timestamp === 'number' &&
    typeof data.tradeId === 'string' &&
    typeof data.oid === 'number'
  );
}

export function isWsUserFillArray(data: any): data is WsUserFill[] {
  return Array.isArray(data) || data.every(isWsUserFill);
}