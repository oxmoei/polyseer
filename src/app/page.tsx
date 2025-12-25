"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import HeroSection from "@/components/hero-section";
import HighestROI from "@/components/highest-roi";
import ResultPanel from "@/components/result-panel";
import ShareModal from "@/components/share-modal";
import TelegramBotModal from "@/components/telegram-bot-modal";
import HowItWorksModal from "@/components/how-it-works-modal";
import LoadingScreen from "@/components/loading-screen";
import { useAuthStore } from "@/lib/stores/use-auth-store";
import { AuthModal } from "@/components/auth-modal";
import { useRouter } from "next/navigation";
import { useWallet } from "@/lib/payment/use-wallet";
import { PaymentModal } from "@/components/payment-modal";
import { canUse, consumeOnce } from "@/lib/payment/usage-store";

export default function Home() {
  const [isLoading, setIsLoading] = useState(false); // 默认不显示加载屏幕
  const [contentVisible, setContentVisible] = useState(true); // 默认显示内容
  const [marketUrl, setMarketUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [resultData, setResultData] = useState<any>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [telegramModalOpen, setTelegramModalOpen] = useState(false);
  const [howItWorksModalOpen, setHowItWorksModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);

  const { user, initialized } = useAuthStore();
  const router = useRouter();
  const { address: walletAddress, connect: connectWallet } = useWallet();

  // Track home page visit
  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('@vercel/analytics').then(({ track }) => {
        track('Home Page Visited', {
          userType: user ? 'authenticated' : 'anonymous',
        });
      });
    }
  }, [user]);

  const handleAnalyze = async (url: string) => {
    // 检查是否连接钱包
    if (!walletAddress) {
      setPendingUrl(url);
      setPaymentModalOpen(true);
      return;
    }

    // 检查是否有剩余使用次数
    if (!canUse(walletAddress)) {
      setPendingUrl(url);
      setPaymentModalOpen(true);
      return;
    }

    // 扣除一次使用次数
    consumeOnce(walletAddress);

    // 导航到分析页面
    router.push(`/analysis?url=${encodeURIComponent(url)}`);
  };

  // 充值成功后继续分析
  const handlePaymentSuccess = () => {
    if (pendingUrl && walletAddress && canUse(walletAddress)) {
      consumeOnce(walletAddress);
      router.push(`/analysis?url=${encodeURIComponent(pendingUrl)}`);
      setPendingUrl(null);
      setPaymentModalOpen(false);
    }
  };

  const handleLoadingComplete = () => {
    setIsLoading(false);
    // Delay content appearance for smooth transition
    setTimeout(() => {
      setContentVisible(true);
    }, 100);
  };

  // 不再需要加载屏幕逻辑 - 直接显示内容

  return (
    <>
      <AnimatePresence mode="wait">
        {isLoading && (
          <LoadingScreen onComplete={handleLoadingComplete} />
        )}
      </AnimatePresence>

      <motion.div
        className="relative h-screen overflow-hidden flex flex-col"
        initial={{ opacity: 0 }}
        animate={{ opacity: contentVisible ? 1 : 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <HeroSection
          onAnalyze={handleAnalyze}
          isAnalyzing={isAnalyzing}
          onShowHowItWorks={() => setHowItWorksModalOpen(true)}
          polymarketUrl={marketUrl}
          setPolymarketUrl={setMarketUrl}
        />

        {showResult && (
          <ResultPanel
            data={resultData}
            isLoading={isAnalyzing}
            onShare={() => setShareModalOpen(true)}
          />
        )}

        <HighestROI onAnalyze={(url) => {
          setMarketUrl(url);
          // Small delay to let URL populate, then submit
          setTimeout(() => {
            handleAnalyze(url);
          }, 100);
        }} />
      </motion.div>

      <ShareModal
        open={shareModalOpen}
        onOpenChange={setShareModalOpen}
        marketTitle={resultData?.marketTitle}
        verdict={resultData?.verdict}
        confidence={resultData?.confidence}
      />

      <TelegramBotModal
        open={telegramModalOpen}
        onOpenChange={setTelegramModalOpen}
      />

      <HowItWorksModal
        open={howItWorksModalOpen}
        onOpenChange={setHowItWorksModalOpen}
      />

      <AuthModal
        open={authModalOpen}
        onOpenChange={setAuthModalOpen}
      />

      <PaymentModal
        open={paymentModalOpen}
        onOpenChange={setPaymentModalOpen}
        walletAddress={walletAddress}
        onConnectWallet={connectWallet}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </>
  );
}