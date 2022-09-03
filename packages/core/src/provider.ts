import {
  getObjectExistsResponse,
  JsonRpcProvider,
  RpcTxnDataSerializer,
  SuiMoveObject,
  SuiObject,
  getTransferObjectTransaction,
  getTransferSuiTransaction,
  getTransactionData,
  getExecutionStatusType,
  getMoveObject,
  getCoinAfterMerge,
  getCoinAfterSplit,
} from '@mysten/sui.js';
import { TxnHistroyEntry } from './storage/types';
import { SignedTx } from './vault/types';
import { Vault } from './vault/Vault';

export const SUI_SYSTEM_STATE_OBJECT_ID =
  '0x0000000000000000000000000000000000000005';

export class Provider {
  provider: JsonRpcProvider;
  coin: CoinProvider;

  constructor(endpoint: string) {
    this.provider = new JsonRpcProvider(endpoint);
    this.coin = new CoinProvider(endpoint);
  }

  public async getActiveValidators(): Promise<SuiMoveObject[]> {
    const contents = await this.provider.getObject(SUI_SYSTEM_STATE_OBJECT_ID);
    const data = (contents.details as SuiObject).data;
    const validators = (data as SuiMoveObject).fields.validators;
    const activeValidators = (validators as SuiMoveObject).fields
      .active_validators;
    return activeValidators as SuiMoveObject[];
  }

  public async getOwnedObjects(address: string): Promise<SuiObject[]> {
    await this.provider.syncAccountState(address);
    const objectInfos = await this.provider.getObjectsOwnedByAddress(address);
    const objectIds = objectInfos.map((obj) => obj.objectId);
    const resps = await this.provider.getObjectBatch(objectIds);
    return resps
      .filter((resp) => resp.status === 'Exists')
      .map((resp) => getObjectExistsResponse(resp) as SuiObject);
  }

  public async getOwnedCoins(address: string): Promise<CoinObject[]> {
    await this.provider.syncAccountState(address);
    const objects = await this.getOwnedObjects(address);
    const res = objects
      .map((item) => ({
        id: item.reference.objectId,
        object: getMoveObject(item),
      }))
      .filter((item) => item.object && Coin.isCoin(item.object))
      .map((item) => {
        const obj = item.object as SuiMoveObject;
        const arg = Coin.getCoinTypeArg(obj);
        const symbol = arg ? Coin.getCoinSymbol(arg) : '';
        const balance = Coin.getBalance(obj);
        return {
          objectId: item.id,
          symbol,
          balance,
        };
      });
    return res;
  }

  public async getTransactionsForAddress(
    address: string
  ): Promise<TxnHistroyEntry[]> {
    await this.provider.syncAccountState(address);
    const txs = await this.provider.getTransactionsForAddress(address);
    const digests = txs
      .map((tx) => tx[1])
      .filter((value, index, self) => self.indexOf(value) === index);
    const effects = await this.provider.getTransactionWithEffectsBatch(digests);
    const results = [];
    for (const effect of effects) {
      const data = getTransactionData(effect.certificate);
      for (const tx of data.transactions) {
        const transferSui = getTransferSuiTransaction(tx);
        if (transferSui) {
          results.push({
            timestamp_ms: effect.timestamp_ms,
            txStatus: getExecutionStatusType(effect),
            from: data.sender,
            to: transferSui.recipient,
            object: {
              type: 'coin' as 'coin',
              balance: transferSui.amount
                ? BigInt(transferSui.amount)
                : BigInt(0),
              symbol: 'SUI',
            },
          });
        } else {
          const transferObject = getTransferObjectTransaction(tx);
          if (transferObject) {
            const resp = await this.provider.getObject(
              transferObject.objectRef.objectId
            );
            const obj = getMoveObject(resp);
            if (obj && Coin.isCoin(obj)) {
              const balance = Coin.getBalance(obj);
              const arg = Coin.getCoinTypeArg(obj);
              const symbol = arg ? Coin.getCoinSymbol(arg) : '';
              // TODO: for now provider does not support to get histrorical object data,
              // so the record here may not be accurate.
              results.push({
                timestamp_ms: effect.timestamp_ms,
                txStatus: getExecutionStatusType(effect),
                from: data.sender,
                to: transferObject.recipient,
                object: {
                  type: 'coin' as 'coin',
                  balance,
                  symbol,
                },
              });
            }
            // TODO: handle more object types
          }
        }
      }
    }
    return results;
  }

  async transferCoin(
    symbol: string,
    amount: bigint,
    recipient: string,
    vault: Vault
  ) {
    const coins = (await this.getOwnedCoins(vault.getAddress())).filter(
      (coin) => coin.symbol === symbol
    );
    if (symbol === GAS_SYMBOL) {
      await this.coin.transferSui(coins, amount, recipient, vault);
    } else {
      await this.coin.transferCoin(coins, amount, recipient, vault);
    }
  }
}

class Coin {
  public static isCoin(obj: SuiMoveObject) {
    return obj.type.startsWith(COIN_TYPE);
  }

  public static getCoinTypeArg(obj: SuiMoveObject) {
    const res = obj.type.match(COIN_TYPE_ARG_REGEX);
    return res ? res[1] : null;
  }

  public static isSUI(obj: SuiMoveObject) {
    const arg = Coin.getCoinTypeArg(obj);
    return arg ? Coin.getCoinSymbol(arg) === 'SUI' : false;
  }

  public static getCoinSymbol(coinTypeArg: string) {
    return coinTypeArg.substring(coinTypeArg.lastIndexOf(':') + 1);
  }

  public static getBalance(obj: SuiMoveObject): bigint {
    return BigInt(obj.fields.balance);
  }

  public static getID(obj: SuiMoveObject): string {
    return obj.fields.id;
  }

  public static getCoinTypeFromArg(coinTypeArg: string) {
    return `${COIN_TYPE}<${coinTypeArg}>`;
  }
}

export type CoinObject = {
  objectId: string;
  symbol: string;
  balance: bigint;
};

const COIN_TYPE = '0x2::coin::Coin';
const COIN_TYPE_ARG_REGEX = /^0x2::coin::Coin<(.+)>$/;
export const DEFAULT_GAS_BUDGET_FOR_SPLIT = 1000;
export const DEFAULT_GAS_BUDGET_FOR_MERGE = 500;
export const DEFAULT_GAS_BUDGET_FOR_TRANSFER = 100;
export const DEFAULT_GAS_BUDGET_FOR_TRANSFER_SUI = 100;
export const DEFAULT_GAS_BUDGET_FOR_STAKE = 1000;
export const GAS_TYPE_ARG = '0x2::sui::SUI';
export const GAS_SYMBOL = 'SUI';
export const DEFAULT_NFT_TRANSFER_GAS_FEE = 450;

export class CoinProvider {
  provider: JsonRpcProvider;
  serializer: RpcTxnDataSerializer;
  constructor(endpoint: string) {
    this.provider = new JsonRpcProvider(endpoint);
    this.serializer = new RpcTxnDataSerializer(endpoint);
  }

  async mergeCoinsForBalance(
    coins: CoinObject[],
    amount: bigint,
    vault: Vault
  ): Promise<CoinObject> {
    console.log('merge coin');
    coins.sort((a, b) => (a.balance - b.balance > 0 ? 1 : -1));
    const coinWithSufficientBalance = coins.find(
      (coin) => coin.balance >= amount
    );
    if (coinWithSufficientBalance) {
      return coinWithSufficientBalance;
    }
    // merge coins with sufficient balance.
    const primaryCoin = coins[coins.length - 1];
    let expectedBalance = primaryCoin.balance;
    const coinsToMerge = [];
    for (let i = coins.length - 2; i > 0; i--) {
      expectedBalance += coins[i].balance;
      coinsToMerge.push(coins[i].objectId);
      if (expectedBalance >= amount) {
        break;
      }
    }
    if (expectedBalance < amount) {
      throw new Error('Insufficient balance');
    }
    const address = vault.getAddress();
    await this.provider.syncAccountState(address);
    for (const coin of coinsToMerge) {
      const data = await this.serializer.newMergeCoin(address, {
        primaryCoin: primaryCoin.objectId,
        coinToMerge: coin,
        gasBudget: DEFAULT_GAS_BUDGET_FOR_MERGE,
      });
      const signedTx = await vault.signTransaction({ data });
      const resp = await this.executeTransaction(signedTx);
      const obj = getCoinAfterMerge(resp) as SuiObject;
      primaryCoin.objectId = obj.reference.objectId;
      primaryCoin.balance = Coin.getBalance(
        getMoveObject(obj) as SuiMoveObject
      );
    }
    if (primaryCoin.balance !== expectedBalance) {
      throw new Error('Merge coins failed caused by transactions conflicted');
    }
    return primaryCoin;
  }

  async splitCoinForBalance(coin: CoinObject, amount: bigint, vault: Vault) {
    console.log('split coin', coin, amount);
    const address = vault.getAddress();
    await this.provider.syncAccountState(address);
    const data = await this.serializer.newSplitCoin(address, {
      coinObjectId: coin.objectId,
      splitAmounts: [Number(coin.balance - amount)],
      gasBudget: DEFAULT_GAS_BUDGET_FOR_SPLIT,
    });
    const signedTx = await vault.signTransaction({ data });
    const resp = await this.executeTransaction(signedTx);
    const obj = getCoinAfterSplit(resp) as SuiObject;
    const balance = Coin.getBalance(getMoveObject(obj) as SuiMoveObject);
    if (balance !== amount) {
      throw new Error('Merge coins failed caused by transactions conflicted');
    }
    coin.balance = amount;
    return coin;
  }

  public async transferCoin(
    coins: CoinObject[],
    amount: bigint,
    recipient: string,
    vault: Vault
  ) {
    const address = vault.getAddress();
    await this.provider.syncAccountState(address);
    const mergedCoin = await this.mergeCoinsForBalance(coins, amount, vault);
    const coin = await this.splitCoinForBalance(mergedCoin, amount, vault);
    const data = await this.serializer.newTransferObject(address, {
      objectId: coin.objectId,
      gasBudget: DEFAULT_GAS_BUDGET_FOR_TRANSFER,
      recipient,
    });
    const signedTx = await vault.signTransaction({ data });
    // TODO: handle response
    await this.executeTransaction(signedTx);
  }

  public async transferSui(
    coins: CoinObject[],
    amount: bigint,
    recipient: string,
    vault: Vault
  ) {
    console.log('transfer sui');
    const address = vault.getAddress();
    await this.provider.syncAccountState(address);
    const mergedCoin = await this.mergeCoinsForBalance(coins, amount, vault);
    const coin = await this.splitCoinForBalance(mergedCoin, amount, vault);
    const data = await this.serializer.newTransferSui(address, {
      suiObjectId: coin.objectId,
      gasBudget: DEFAULT_GAS_BUDGET_FOR_TRANSFER_SUI,
      recipient,
    });
    const signedTx = await vault.signTransaction({ data });
    // TODO: handle response
    await this.executeTransaction(signedTx);
  }

  async executeTransaction(txn: SignedTx) {
    console.log('data', txn.signature.toString('base64'));
    console.log('signature', txn.signature.toString('base64'));
    console.log('pubkey', txn.pubKey.toString('base64'));
    return await this.provider.executeTransaction(
      txn.data.toString(),
      'ED25519',
      txn.signature.toString('base64'),
      txn.pubKey.toString('base64')
    );
  }
}
