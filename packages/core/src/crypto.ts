import * as bip39 from '@scure/bip39';
import { Sha256, Pbkdf2HmacSha256 } from 'asmcrypto.js';
import { ModeOfOperation } from 'aes-js';
import { Cipher } from './storage/types';
import { Buffer } from 'buffer';
import { wordlist as czWordlist } from '@scure/bip39/wordlists/czech';
import { wordlist as enWordlist } from '@scure/bip39/wordlists/english';
import { wordlist as frWordlist } from '@scure/bip39/wordlists/french';
import { wordlist as itWordlist } from '@scure/bip39/wordlists/italian';
import { wordlist as jpWordlist } from '@scure/bip39/wordlists/japanese';
import { wordlist as krWordlist } from '@scure/bip39/wordlists/korean';
import { wordlist as szhWordlist } from '@scure/bip39/wordlists/simplified-chinese';
import { wordlist as spWordlist } from '@scure/bip39/wordlists/spanish';
import { wordlist as tzhWordlist } from '@scure/bip39/wordlists/traditional-chinese';
import randomBytes from 'randombytes';

const WALLET_MASTER_SECRET = 'martian wallet';
const COIN_TYPE_SUI = '784';
const PBKDF2_NUM_OF_ITERATIONS = 5000;
const PBKDF2_KEY_LENGTH = 32;

type Token = {
  token: Buffer;
  cipher: Cipher;
};

export function generateMnemonic(): string {
  return bip39.generateMnemonic(enWordlist);
}

export function mnemonicToEntropy(mnemonic: string): Buffer {
  // TODO: support mnemonic in other languages
  return Buffer.from(bip39.mnemonicToEntropy(mnemonic, enWordlist));
}

export function entropyToMnemonic(entropy: Buffer): string {
  return bip39.entropyToMnemonic(entropy, enWordlist);
}

export function encryptMnemonic(token: Buffer, mnemonic: string): Buffer {
  const aesCtr = new ModeOfOperation.ctr(token);
  const mnemonicBytes = new TextEncoder().encode(mnemonic);
  return Buffer.from(aesCtr.encrypt(mnemonicBytes));
}

export function decryptMnemonic(
  token: Buffer,
  encryptedMnemonic: string
): string {
  const aesCtr = new ModeOfOperation.ctr(token);
  const encryptedBytes = Buffer.from(encryptedMnemonic, 'hex');
  const mnemonicBytes = aesCtr.decrypt(encryptedBytes);
  const mnemonic = new TextDecoder().decode(mnemonicBytes);
  if (!validateMnemonic(mnemonic)) {
    throw new Error('Invalid password');
  }
  return mnemonic;
}

export function newToken(password: string): Token {
  const salt = randomBytes(32);
  const token = password2Token(password, salt);
  const aesCtr = new ModeOfOperation.ctr(token);
  const secretBytes = new TextEncoder().encode(WALLET_MASTER_SECRET);
  return {
    token,
    cipher: {
      data: Buffer.from(aesCtr.encrypt(secretBytes)).toString('hex'),
      salt: salt.toString('hex'),
    },
  };
}

export function password2Token(password: string, salt: Buffer) {
  const hash = new Sha256().process(Buffer.from(password, 'utf8')).finish()
    .result as Uint8Array;
  return Buffer.from(
    Pbkdf2HmacSha256(hash, salt, PBKDF2_NUM_OF_ITERATIONS, PBKDF2_KEY_LENGTH)
  );
}

export function validateToken(token: Buffer, cipher: Cipher): boolean {
  const aesCtr = new ModeOfOperation.ctr(token);
  const data = Buffer.from(cipher.data, 'hex');
  const secretBytes = aesCtr.decrypt(data);
  const secret = new TextDecoder().decode(secretBytes);
  return secret === WALLET_MASTER_SECRET;
}

export function derivationHdPath(id: number) {
  return `m/44'/${COIN_TYPE_SUI}'/${id}'`;
}

const BIP32_ALL_WORDLISTS = [
  czWordlist,
  enWordlist,
  frWordlist,
  itWordlist,
  jpWordlist,
  krWordlist,
  szhWordlist,
  spWordlist,
  tzhWordlist,
];

export function validateMnemonic(mnemonic: string): boolean {
  for (const wl of BIP32_ALL_WORDLISTS) {
    if (bip39.validateMnemonic(mnemonic, wl)) {
      return true;
    }
  }

  return false;
}
