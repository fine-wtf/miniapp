'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { 
  IoPersonCircle, 
  IoChatbubbleEllipsesOutline, 
  IoWalletOutline,
  IoStarOutline,
  IoTrendingUpOutline
} from 'react-icons/io5';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

import { BottomNav } from '@/components/Navigation/BottomNav';
import { LoadingScreen } from '@/components/LoadingScreen';
import { CharacterCard } from '@/components/profiles/CharacterCard';
import { WalletCard } from '@/components/profiles/WalletCard';
import { useTelegramUser, useGetAddress, useGetTokenInfo, useCharacterListBrief, useUserPoints, useClaimFreePoints } from '@/hooks/api';
import { isOnTelegram } from '@/lib/telegram';
import { PointsCard } from '@/components/profiles/PointsCard';

type TabType = 'conversations' | 'wallet' | 'points';

export default function ProfilePage() {
  const { data: user, isLoading: isLoadingUser } = useTelegramUser();
  const { data: addresses, isLoading: isLoadingAddresses } = useGetAddress();
  const { data: tokenInfo, isLoading: isLoadingTokenInfo } = useGetTokenInfo();
  const { data: characterListBrief, isLoading: isLoadingCharacterListBrief } = useCharacterListBrief();
  const { data: userPoints, isLoading: isLoadingUserPoints } = useUserPoints();

  const { mutate: claimPoints, isPending: isClaimingPointsPending } = useClaimFreePoints();

  const [nextClaimTime, setNextClaimTime] = useState<string>('');
  const [canClaim, setCanClaim] = useState(false);

  const [activeTab, setActiveTab] = useState<TabType>('conversations');
  const [imageError, setImageError] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState<'sol' | 'eth' | null>(null);
  const [expandedCard, setExpandedCard] = useState<'sol' | 'eth' | null>(null);
  const [expandedSection, setExpandedSection] = useState<'rewards' | 'usage' | 'coming-soon' | null>(null);

  const searchParams = useSearchParams();

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'points' || tab === 'wallet' || tab === 'conversations') {
      setActiveTab(tab as TabType);
    }
  }, [searchParams]);

  useEffect(() => {
    const checkClaimStatus = () => {
      if (!userPoints?.free_claimed_balance_updated_at) {
        setCanClaim(true);
        setNextClaimTime('');
        return;
      }

      const now = Math.floor(Date.now() / 1000); // Convert to seconds
      const lastClaim = userPoints.free_claimed_balance_updated_at;
      const timeUntilNextClaim = (lastClaim + 24 * 60 * 60) - now; // 24 hours in seconds

      if (timeUntilNextClaim <= 0) {
        setCanClaim(true);
        setNextClaimTime('');
      } else {
        setCanClaim(false);
        // Convert remaining seconds to hours and minutes
        const hours = Math.floor(timeUntilNextClaim / (60 * 60));
        const minutes = Math.floor((timeUntilNextClaim % (60 * 60)) / 60);
        setNextClaimTime(`${hours}h ${minutes}m`);
      }
    };

    checkClaimStatus();
    const interval = setInterval(checkClaimStatus, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [userPoints?.free_claimed_balance_updated_at]);

  if (isLoadingUser || isLoadingAddresses || isLoadingTokenInfo || isLoadingCharacterListBrief || isLoadingUserPoints) {
    return <LoadingScreen />;
  }

  const copyToClipboard = async (text: string, type: 'sol' | 'eth') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedAddress(type);
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-sky-400 via-rose-300 to-emerald-200 text-gray-900">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="relative min-h-screen pt-8"
      >
        {isOnTelegram() && <div className="h-24" />}

        {/* Profile Section */}
        <div className="px-4 mb-6">
          <div className="relative w-24 h-24 mb-4 mx-auto">
            {user?.profile_photo && !imageError ? (
              <Image
                src={user.profile_photo}
                alt="Profile"
                fill
                className="rounded-full object-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              user?.first_name ? (
                <div className="w-full h-full rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl font-semibold text-gray-900">
                  {getInitials(user.first_name)}
                </div>
              ) : (
                <div className="w-full h-full rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <IoPersonCircle className="w-12 h-12 text-gray-900" />
                </div>
              )
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
            {user?.first_name || 'Anonymous'}
          </h1>
          <p className="text-gray-700 text-sm text-center mb-6">
            @{user?.username || 'anonymous'}
          </p>
        </div>

        {/* Tabs */}
        <div className="px-4 mb-4">
          <div className="bg-white/20 backdrop-blur-md rounded-xl p-2 flex gap-2">
            <Link 
              href="/profile?tab=conversations"
              className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                activeTab === 'conversations' 
                  ? 'bg-white/30 text-gray-900' 
                  : 'text-gray-700 hover:text-gray-900 hover:bg-white/10'
              }`}
              onClick={() => setActiveTab('conversations')}
            >
              <IoChatbubbleEllipsesOutline className="w-4 h-4" />
              <span>Chats</span>
            </Link>
            <Link 
              href="/profile?tab=wallet"
              className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                activeTab === 'wallet' 
                  ? 'bg-white/30 text-gray-900' 
                  : 'text-gray-700 hover:text-gray-900 hover:bg-white/10'
              }`}
              onClick={() => setActiveTab('wallet')}
            >
              <IoWalletOutline className="w-4 h-4" />
              <span>Wallet</span>
            </Link>
            <Link 
              href="/profile?tab=points"
              className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                activeTab === 'points' 
                  ? 'bg-white/30 text-gray-900' 
                  : 'text-gray-700 hover:text-gray-900 hover:bg-white/10'
              }`}
              onClick={() => setActiveTab('points')}
            >
              <IoStarOutline className="w-4 h-4" />
              <span>Points</span>
            </Link>
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 px-4 pb-24">
          <div className="space-y-3">
            {activeTab === 'conversations' ? (
              <>
                {characterListBrief && characterListBrief.length > 0 ? (
                  <div className="space-y-3">
                    {characterListBrief.map((character) => (
                      <CharacterCard 
                        key={character.character_id} 
                        character={character} 
                      />
                    ))}
                  </div>
                ) : (
                  <div className="bg-white/20 backdrop-blur-md rounded-xl p-4 text-center text-gray-700">
                    No conversations yet
                  </div>
                )}
              </>
            ) : activeTab === 'wallet' ? (
              <div className="space-y-3">
                <WalletCard 
                  type="sol" 
                  address={addresses?.sol_address || ''} 
                  tokenInfo={tokenInfo}
                  expandedCard={expandedCard}
                  setExpandedCard={setExpandedCard}
                  copiedAddress={copiedAddress}
                  onCopy={copyToClipboard}
                />
                <WalletCard 
                  type="eth" 
                  address={addresses?.eth_address || ''} 
                  tokenInfo={tokenInfo}
                  expandedCard={expandedCard}
                  setExpandedCard={setExpandedCard}
                  copiedAddress={copiedAddress}
                  onCopy={copyToClipboard}
                />
              </div>
            ) : (
              <div className="space-y-3">
                {userPoints ? (
                  <PointsCard 
                    userPoints={userPoints}
                    nextClaimTime={nextClaimTime}
                    canClaim={canClaim}
                    onClaim={claimPoints}
                    isClaimingPointsPending={isClaimingPointsPending}
                  />
                ) : (
                  <div className="bg-white/20 backdrop-blur-md rounded-xl p-4 text-center text-gray-700">
                    Loading points...
                  </div>
                )}
                <div className="bg-white/20 backdrop-blur-md rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <IoStarOutline className="w-4 h-4" />
                    Points System Guide
                  </h3>
                  
                  <div className="grid gap-3">
                    {/* Daily Rewards Section */}
                    <div 
                      className="bg-white/10 rounded-xl p-3 cursor-pointer transition-colors hover:bg-white/20"
                      onClick={() => setExpandedSection(expandedSection === 'rewards' ? null : 'rewards')}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-emerald-400/20 flex items-center justify-center">
                          <IoTrendingUpOutline className="w-4 h-4 text-emerald-500" />
                        </div>
                        <h4 className="text-sm font-medium text-gray-800">Daily Rewards</h4>
                      </div>
                      
                      {expandedSection === 'rewards' && (
                        <div className="mt-3 bg-white/10 rounded-lg p-3">
                          <div className="flex flex-col">
                            <div className="text-sm font-semibold text-emerald-500">+100 points</div>
                            <div className="text-xs text-gray-700">Free points every 24 hours</div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Points Usage Section */}
                    <div 
                      className="bg-white/10 rounded-xl p-3 cursor-pointer transition-colors hover:bg-white/20"
                      onClick={() => setExpandedSection(expandedSection === 'usage' ? null : 'usage')}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-sky-400/20 flex items-center justify-center">
                          <IoChatbubbleEllipsesOutline className="w-4 h-4 text-sky-500" />
                        </div>
                        <h4 className="text-sm font-medium text-gray-800">Points Usage</h4>
                      </div>

                      {expandedSection === 'usage' && (
                        <div className="mt-3 space-y-2">
                          {[
                            { cost: '-1 point', action: 'Send a message to any character' },
                            { cost: '-1 point', action: 'Regenerate a character reply' }
                          ].map((item, index) => (
                            <div 
                              key={index}
                              className="bg-white/10 rounded-lg p-3"
                            >
                              <div className="flex flex-col">
                                <div className="text-sm font-semibold text-sky-500">{item.cost}</div>
                                <div className="text-xs text-gray-700">{item.action}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Coming Soon Section */}
                    <div 
                      className="bg-white/10 rounded-xl p-3 cursor-pointer transition-colors hover:bg-white/20"
                      onClick={() => setExpandedSection(expandedSection === 'coming-soon' ? null : 'coming-soon')}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-rose-400/20 flex items-center justify-center">
                          <IoStarOutline className="w-4 h-4 text-rose-500" />
                        </div>
                        <h4 className="text-sm font-medium text-gray-800">Coming Soon</h4>
                      </div>

                      {expandedSection === 'coming-soon' && (
                        <div className="mt-3 space-y-2">
                          {[
                            'Special campaign rewards for active users',
                            'Community events with bonus points opportunities',
                            'Referral program with point rewards'
                          ].map((feature, index) => (
                            <div 
                              key={index}
                              className="bg-white/10 rounded-lg p-3 flex items-center gap-2"
                            >
                              <div className="w-1 h-1 rounded-full bg-rose-400" />
                              <div className="text-xs text-gray-700">{feature}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      <BottomNav />
    </div>
  );
} 