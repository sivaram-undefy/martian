import { useApiClient } from './useApiClient';
import useSWR from 'swr';
import { swrLoading } from '../utils/others';
import { Wallet } from '@martian/core';

export function useWallets() {
  const apiClient = useApiClient();
  const { data, error, mutate } = useSWR(['wallet.getWallets'], fetchWallets);

  async function fetchWallets(_: string) {
    return await apiClient.callFunc<null, Wallet[]>('wallet.getWallets', null);
  }

  return {
    data,
    error,
    loading: swrLoading(data, error),
    fetchWallets: mutate,
  };
}
