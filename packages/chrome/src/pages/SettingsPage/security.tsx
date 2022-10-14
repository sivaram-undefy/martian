import classnames from 'classnames';
import './common.scss';
import styles from './security.module.scss';
import Button from '../../components/Button';
import { Route, Routes, useNavigate } from 'react-router-dom';
import Modal from '../../components/Modal';
import {
  Account,
  CreateWalletParams,
  RevealMnemonicParams,
  UpdatePasswordParams,
  Wallet,
} from '@martian/core';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { useState } from 'react';
import SetPassword from '../OnBoarding/SetPassword';
import copy from 'copy-to-clipboard';
import message from '../../components/message';
import {
  updateAccountId,
  updateInitialized,
  updateToken,
  updateWalletId,
} from '../../store/app-context';
import { useWallet } from '../../hooks/useWallet';
import Nav from './nav';
import { useApiClient } from '../../hooks/useApiClient';

function MainPage() {
  const navigate = useNavigate();
  const { context } = useSelector((state: RootState) => ({
    context: state.appContext,
  }));
  const [phrase, setPhrase] = useState<string[]>([]);
  const [privateKey, setPrivate] = useState('');
  const apiClient = useApiClient();

  return (
    <div className={styles['security-setting-container']}>
      <Nav />
      <div className={styles['setting-title']}>Security</div>
      <div className={styles['setting-desc']}>
        The security settings of your wallet
      </div>
      <div>
        <div className={styles['secutity-card']}>
          <div className={styles['security-title']}>Password</div>
          <div className={styles['security-desc']}>
            change your wallet login password
          </div>
          <Button
            onClick={() =>
              navigate('password', {
                state: {
                  hideApplayout: true,
                  hasOldPassword: true,
                },
              })
            }
            className="mb-8"
          >
            Update Password
          </Button>
        </div>
        <div className={styles['security-line']} />
        <div className={styles['secutity-card']}>
          <div className={styles['security-title']}>Recovery Phrases</div>
          <div
            className={classnames(styles['security-desc'], styles['warning'])}
          >
            A recovery phrase grants full access to all wallets generated by it.
            You can manage and export your recovery phrases.
          </div>
          <Modal
            title="Recovery Phrases"
            trigger={
              <Button className="mb-8" state={'danger'}>
                I understand, show my phrases
              </Button>
            }
            contentProps={{
              style: {
                margin: 'auto 2rem',
              },
            }}
            onOpenChange={async () => {
              const rawPhrases = await apiClient.callFunc<
                RevealMnemonicParams,
                string
              >('wallet.revealMnemonic', {
                walletId: context.walletId,
                token: context.token,
              });
              setPhrase(rawPhrases.split(' '));
            }}
          >
            <div
              className={classnames(
                styles['security-modal-content'],
                'cursor-pointer'
              )}
              onClick={() => {
                copy(phrase.join(' '));
                message.success('Copied');
              }}
            >
              <div className="flex flex-wrap">
                {phrase.slice(0, phrase.length).map((p, index) => (
                  <div
                    key={p}
                    className={classnames(
                      'flex items-center',
                      styles['phrase-container']
                    )}
                  >
                    <span className="inline-block text-gray-300 text-right select-none">{`${
                      index + 1 + 0
                    }`}</span>
                    <span className="ml-2">{`${p}`}</span>
                  </div>
                ))}
              </div>
              <div className={styles['security-modal-copy']}>
                <div>Click to Copy</div>
              </div>
            </div>
          </Modal>
        </div>
        <div className={styles['security-line']} />
        <div className={styles['secutity-card']}>
          <div className={styles['security-title']}>Private Key</div>
          <div
            className={classnames(styles['security-desc'], styles['warning'])}
          >
            The private key grants full access to the current wallet. You can
            export the wallet by exporting its private key.
          </div>
          <Modal
            title="Private Key"
            trigger={
              <Button className="mb-8" state={'danger'}>
                I understand, show my private key
              </Button>
            }
            contentProps={{
              style: {
                width: 274,
              },
            }}
            onOpenChange={async () => {
              const privateKey = await apiClient.callFunc<
                RevealMnemonicParams,
                string
              >('wallet.revealPrivate', {
                walletId: context.walletId,
                token: context.token,
              });
              setPrivate(privateKey);
            }}
          >
            <div
              className={classnames(
                styles['security-modal-content'],
                'cursor-pointer'
              )}
              onClick={() => {
                copy(privateKey);
                message.success('Copied');
              }}
            >
              {privateKey}
              <div className={styles['security-modal-copy']}>
                <div>Click to Copy</div>
              </div>
            </div>
          </Modal>
        </div>
      </div>
    </div>
  );
}

function PasswordSetting() {
  const apiClient = useApiClient();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const context = useSelector((state: RootState) => state.appContext);
  const { updateWallet } = useWallet(context.walletId);

  async function createWalletAndAccount(token: string) {
    const wallet = await apiClient.callFunc<CreateWalletParams, Wallet>(
      'wallet.createWallet',
      {
        token,
      }
    );

    const accounts = await apiClient.callFunc<string, Account[]>(
      'account.getAccounts',
      wallet.id
    );
    const defaultAccount = accounts[0];
    await updateWallet(wallet.id, {
      avatar: wallet.avatar ?? '1',
      name: wallet.name,
    });

    await dispatch(updateToken(token));
    await dispatch(updateWalletId(wallet.id));
    await dispatch(updateAccountId(defaultAccount.id));
    await dispatch(updateInitialized(true));
  }
  async function handleSetPassword(password: string, oldPassword?: string) {
    await apiClient.callFunc<UpdatePasswordParams, undefined>(
      'auth.updatePassword',
      {
        oldPassword: oldPassword ?? '',
        newPassword: password,
      }
    );
    const token = await apiClient.callFunc<string, string>(
      'auth.loadTokenWithPassword',
      password
    );

    await createWalletAndAccount(token);
    navigate('..');
  }
  return <SetPassword onNext={handleSetPassword} />;
}

export default function Security() {
  return (
    <Routes>
      <Route path="/" element={<MainPage />} />
      <Route path="password" element={<PasswordSetting />} />
    </Routes>
  );
}
