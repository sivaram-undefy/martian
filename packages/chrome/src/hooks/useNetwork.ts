import useSWR from 'swr';
import { useApiClient } from './useApiClient';
import { Network } from '@martian/core';

export function useNetwork(networkId: string) {
  const apiClient = useApiClient();
  const { data, error } = useSWR(['fetchNetwork', networkId], fetchNetwork);

  async function fetchNetwork(_: string, networkId: string) {
    if (!networkId) return;
    return await apiClient.callFunc<string, Network>(
      'network.getNetwork',
      networkId
    );
  }

  return {
    data,
    error,
    loading: !error && !data,
  };
}
