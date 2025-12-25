'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { X, Wallet, Copy, Check, RefreshCw, Loader2 } from 'lucide-react';
import { PAYMENT_ADDRESS, MIN_RECHARGE, FREE_USES, USES_PER_USDT, BSC_CHAIN_ID } from '@/lib/payment/config';
import { getRemainingUses, syncPayments, getUsageData } from '@/lib/payment/usage-store';

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  walletAddress: string | null;
  onConnectWallet: () => void;
  onPaymentSuccess?: () => void;
}

export function PaymentModal({
  open,
  onOpenChange,
  walletAddress,
  onConnectWallet,
  onPaymentSuccess,
}: PaymentModalProps) {
  const [copied, setCopied] = useState(false);
  const [checking, setChecking] = useState(false);
  const [remainingUses, setRemainingUses] = useState(0);
  const [usageData, setUsageData] = useState({ used: 0, paid: 0 });

  useEffect(() => {
    if (walletAddress) {
      setRemainingUses(getRemainingUses(walletAddress));
      const data = getUsageData(walletAddress);
      setUsageData({ used: data.used, paid: data.paid });
    }
  }, [walletAddress, open]);

  const copyAddress = () => {
    navigator.clipboard.writeText(PAYMENT_ADDRESS);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const checkPayment = async () => {
    if (!walletAddress) return;

    setChecking(true);
    try {
      const { synced, newAmount } = await syncPayments(walletAddress);
      if (synced && newAmount > 0) {
        setRemainingUses(getRemainingUses(walletAddress));
        const data = getUsageData(walletAddress);
        setUsageData({ used: data.used, paid: data.paid });
        onPaymentSuccess?.();
      } else {
        alert('未检测到新的充值记录，请确认交易已完成');
      }
    } catch (error) {
      console.error('检查充值失败:', error);
      alert('检查充值失败，请稍后重试');
    } finally {
      setChecking(false);
    }
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={() => onOpenChange(false)}
        />

        {/* Modal */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative bg-neutral-900 border border-white/20 rounded-2xl p-6 max-w-md w-full shadow-2xl"
        >
          {/* Close button */}
          <button
            onClick={() => onOpenChange(false)}
            className="absolute top-4 right-4 text-white/60 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">充值使用次数</h2>
            <p className="text-white/70 text-sm">
              每位用户可免费使用 {FREE_USES} 次深度分析
            </p>
          </div>

          {/* Wallet Status */}
          {!walletAddress ? (
            <div className="mb-6">
              <Button
                onClick={onConnectWallet}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-6"
              >
                <Wallet className="w-5 h-5 mr-2" />
                连接钱包
              </Button>
              <p className="text-white/50 text-xs text-center mt-2">
                连接钱包后可查看使用次数和充值
              </p>
            </div>
          ) : (
            <>
              {/* Usage Stats */}
              <div className="bg-white/5 rounded-xl p-4 mb-6">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-white/70">钱包地址</span>
                  <span className="text-white font-mono text-sm">
                    {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                  </span>
                </div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-white/70">已使用次数</span>
                  <span className="text-white font-semibold">{usageData.used}</span>
                </div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-white/70">已充值</span>
                  <span className="text-green-400 font-semibold">{usageData.paid} USDT</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-white/10">
                  <span className="text-white/70">剩余次数</span>
                  <span className={`font-bold text-xl ${remainingUses > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {remainingUses}
                  </span>
                </div>
              </div>

              {/* Payment Info */}
              <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl p-4 mb-6">
                <h3 className="text-white font-semibold mb-3">充值方式</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-purple-400">•</span>
                    <span className="text-white/80">链: BSC (BNB Smart Chain)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-purple-400">•</span>
                    <span className="text-white/80">代币: USDT</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-purple-400">•</span>
                    <span className="text-white/80">比例: {USES_PER_USDT}U = 1次分析</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-purple-400">•</span>
                    <span className="text-white/80">最低充值: {MIN_RECHARGE} USDT</span>
                  </div>
                </div>
              </div>

              {/* Payment Address */}
              <div className="mb-6">
                <label className="text-white/70 text-sm mb-2 block">收款地址 (BSC)</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-black/50 border border-white/10 rounded-lg px-4 py-3 font-mono text-sm text-white/90 break-all">
                    {PAYMENT_ADDRESS}
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={copyAddress}
                    className="border-white/20 hover:bg-white/10"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4 text-white/70" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Check Payment Button */}
              <Button
                onClick={checkPayment}
                disabled={checking}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-5"
              >
                {checking ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    检查中...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-5 h-5 mr-2" />
                    我已充值，检查到账
                  </>
                )}
              </Button>

              <p className="text-white/50 text-xs text-center mt-3">
                转账后请等待 1-2 分钟再点击检查
              </p>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
