'use client';

import { useState, useEffect, useCallback } from 'react';
import { BSC_CHAIN_ID } from './config';

// 获取 ethereum provider
function getEthereum(): any {
  if (typeof window !== 'undefined') {
    return (window as any).ethereum;
  }
  return null;
}

interface UseWalletReturn {
  address: string | null;
  isConnecting: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  switchToBsc: () => Promise<void>;
}

export function useWallet(): UseWalletReturn {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 检查是否已连接
  useEffect(() => {
    const checkConnection = async () => {
      const ethereum = getEthereum();
      if (ethereum) {
        try {
          const accounts = await ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            setAddress(accounts[0]);
          }
        } catch (err) {
          console.error('检查钱包连接失败:', err);
        }
      }
    };

    checkConnection();
  }, []);

  // 监听账户变化
  useEffect(() => {
    const ethereum = getEthereum();
    if (!ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length > 0) {
        setAddress(accounts[0]);
      } else {
        setAddress(null);
      }
    };

    ethereum.on('accountsChanged', handleAccountsChanged);

    return () => {
      const eth = getEthereum();
      eth?.removeListener('accountsChanged', handleAccountsChanged);
    };
  }, []);

  // 连接钱包
  const connect = useCallback(async () => {
    const ethereum = getEthereum();
    if (!ethereum) {
      setError('请安装 MetaMask 钱包');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const accounts = await ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length > 0) {
        setAddress(accounts[0]);
      }
    } catch (err: any) {
      console.error('连接钱包失败:', err);
      setError(err.message || '连接钱包失败');
    } finally {
      setIsConnecting(false);
    }
  }, []);

  // 断开连接
  const disconnect = useCallback(() => {
    setAddress(null);
  }, []);

  // 切换到 BSC 网络
  const switchToBsc = useCallback(async () => {
    const ethereum = getEthereum();
    if (!ethereum) {
      setError('请安装 MetaMask 钱包');
      return;
    }

    try {
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${BSC_CHAIN_ID.toString(16)}` }],
      });
    } catch (switchError: any) {
      // 如果网络不存在，添加网络
      if (switchError.code === 4902) {
        try {
          await ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: `0x${BSC_CHAIN_ID.toString(16)}`,
                chainName: 'BNB Smart Chain',
                nativeCurrency: {
                  name: 'BNB',
                  symbol: 'BNB',
                  decimals: 18,
                },
                rpcUrls: ['https://bsc-dataseed.binance.org/'],
                blockExplorerUrls: ['https://bscscan.com/'],
              },
            ],
          });
        } catch (addError) {
          console.error('添加 BSC 网络失败:', addError);
        }
      }
    }
  }, []);

  return {
    address,
    isConnecting,
    error,
    connect,
    disconnect,
    switchToBsc,
  };
}
