/**
 * 使用次数存储 (localStorage + 链上验证)
 */

import { FREE_USES, USES_PER_USDT, PAYMENT_ADDRESS, BSC_USDT_CONTRACT, BSCSCAN_API } from './config';

const STORAGE_KEY_PREFIX = 'polyseer_usage_';

interface UsageData {
  used: number;
  paid: number; // 已充值的 USDT 数量
  lastCheckedTx: string; // 最后检查的交易 hash
  updatedAt: number;
}

// 获取存储 key
function getStorageKey(walletAddress: string): string {
  return STORAGE_KEY_PREFIX + walletAddress.toLowerCase();
}

// 获取使用数据
export function getUsageData(walletAddress: string): UsageData {
  if (typeof window === 'undefined') {
    return { used: 0, paid: 0, lastCheckedTx: '', updatedAt: 0 };
  }

  const key = getStorageKey(walletAddress);
  const data = localStorage.getItem(key);

  if (data) {
    try {
      return JSON.parse(data);
    } catch {
      // 数据损坏，重置
    }
  }

  return { used: 0, paid: 0, lastCheckedTx: '', updatedAt: 0 };
}

// 保存使用数据
export function saveUsageData(walletAddress: string, data: UsageData): void {
  if (typeof window === 'undefined') return;

  const key = getStorageKey(walletAddress);
  localStorage.setItem(key, JSON.stringify({ ...data, updatedAt: Date.now() }));
}

// 获取剩余次数
export function getRemainingUses(walletAddress: string): number {
  const data = getUsageData(walletAddress);
  const totalUses = FREE_USES + (data.paid * USES_PER_USDT);
  return Math.max(0, totalUses - data.used);
}

// 检查是否可以使用
export function canUse(walletAddress: string): boolean {
  return getRemainingUses(walletAddress) > 0;
}

// 使用一次
export function consumeOnce(walletAddress: string): boolean {
  if (!canUse(walletAddress)) return false;

  const data = getUsageData(walletAddress);
  data.used += 1;
  saveUsageData(walletAddress, data);
  return true;
}

// 添加充值次数
export function addPaidUses(walletAddress: string, usdtAmount: number, txHash: string): void {
  const data = getUsageData(walletAddress);
  data.paid += usdtAmount;
  data.lastCheckedTx = txHash;
  saveUsageData(walletAddress, data);
}

// 从 BSCScan 查询 USDT 转账记录
export async function checkBscUsdtTransfers(fromAddress: string): Promise<{
  totalUsdt: number;
  transactions: Array<{ hash: string; value: number; timestamp: number }>;
}> {
  try {
    // 查询 ERC20 转账记录
    const url = `${BSCSCAN_API}?module=account&action=tokentx&contractaddress=${BSC_USDT_CONTRACT}&address=${PAYMENT_ADDRESS}&startblock=0&endblock=999999999&sort=desc`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== '1' || !data.result) {
      return { totalUsdt: 0, transactions: [] };
    }

    // 过滤出从用户地址转入的交易
    const userTxs = data.result.filter((tx: any) =>
      tx.from.toLowerCase() === fromAddress.toLowerCase() &&
      tx.to.toLowerCase() === PAYMENT_ADDRESS.toLowerCase()
    );

    const transactions = userTxs.map((tx: any) => ({
      hash: tx.hash,
      value: parseFloat(tx.value) / 1e18, // USDT 是 18 位小数
      timestamp: parseInt(tx.timeStamp) * 1000,
    }));

    const totalUsdt = transactions.reduce((sum: number, tx: any) => sum + tx.value, 0);

    return { totalUsdt, transactions };
  } catch (error) {
    console.error('查询 BSCScan 失败:', error);
    return { totalUsdt: 0, transactions: [] };
  }
}

// 同步链上充值记录
export async function syncPayments(walletAddress: string): Promise<{
  synced: boolean;
  newAmount: number;
}> {
  const data = getUsageData(walletAddress);
  const { totalUsdt, transactions } = await checkBscUsdtTransfers(walletAddress);

  // 计算新充值金额
  const newAmount = totalUsdt - data.paid;

  if (newAmount > 0 && transactions.length > 0) {
    const latestTx = transactions[0];
    addPaidUses(walletAddress, newAmount, latestTx.hash);
    return { synced: true, newAmount };
  }

  return { synced: false, newAmount: 0 };
}
