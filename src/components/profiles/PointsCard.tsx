'use client';

import { motion } from 'framer-motion';
import { IoStarOutline, IoTrendingUpOutline } from 'react-icons/io5';
import { FiClock } from 'react-icons/fi';
import type { UserPoints } from '@/lib/validations';
import { getAvailableBalance } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { useClaimFreePoints } from '@/hooks/api';

interface PointsCardProps {
  userPoints: UserPoints;
}

export function PointsCard({ userPoints }: PointsCardProps) {
  const { mutate: claimPoints, isPending: isClaimingPointsPending, isError: isClaimingPointsError } = useClaimFreePoints();

  const [canClaim, setCanClaim] = useState(false);
  const [nextClaimTime, setNextClaimTime] = useState<string>('');

  useEffect(() => {
    if (isClaimingPointsError) {
      alert('Failed to claim free points');
    }
  }, [isClaimingPointsError]);

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
  
  
  const formatPoints = (points: number) => {
    return new Intl.NumberFormat('en-US').format(points);
  };

  const calculateLevel = (burntBalance: number) => {
    // Each level requires 100 points
    return Math.floor(burntBalance / 100) + 1;
  };

  const calculateProgress = (burntBalance: number) => {
    // Get the progress within the current level (0-100 points)
    return burntBalance % 100;
  };

  const totalAvailablePoints = getAvailableBalance(userPoints);

  const level = calculateLevel(userPoints.total_burnt_balance);
  const progress = calculateProgress(userPoints.total_burnt_balance);
  const pointsToNextLevel = 100 - progress;

  return (
    <motion.div 
      className="bg-white/20 backdrop-blur-md rounded-xl overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-white/30 flex items-center justify-center">
              <IoStarOutline className="w-6 h-6 text-gray-900" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Available Points</h3>
              <p className="text-sm text-gray-700">Level {level}</p>
            </div>
          </div>
          <div className="text-right">
            {isClaimingPointsPending ? (
              <div className="h-8 w-24 bg-gray-500/20 rounded animate-pulse" />
            ) : (
              <p className="text-2xl font-bold text-gray-900">
                {formatPoints(totalAvailablePoints)}
              </p>
            )}
            <div className="flex items-center gap-1 text-sm text-emerald-600">
              <IoTrendingUpOutline className="w-4 h-4" />
              <span>Active</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="w-full bg-white/20 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-emerald-400 to-sky-400 h-2 rounded-full transition-all duration-300"
              style={{ 
                width: `${Math.min((progress / 100) * 100, 100)}%`
              }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-700">
            <span>Level {level}</span>
            <span>{pointsToNextLevel} points to Level {level + 1}</span>
          </div>

          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between bg-white/10 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <FiClock className="text-emerald-500 text-lg" />
                <span className="text-sm text-gray-700">
                  {canClaim ? "Free points available!" : `Next claim in ${nextClaimTime}`}
                </span>
              </div>
              <button
                onClick={() => claimPoints()}
                disabled={!canClaim || isClaimingPointsPending}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  canClaim && !isClaimingPointsPending
                    ? 'bg-emerald-400/80 hover:bg-emerald-400 text-white' 
                    : 'bg-gray-500/30 text-gray-600 cursor-not-allowed'
                }`}
              >
                {isClaimingPointsPending ? (
                  <div className="w-12 h-4 flex items-center justify-center">
                    <div className="w-1 h-1 bg-gray-600 rounded-full animate-bounce mr-1" style={{ animationDelay: '0ms' }} />
                    <div className="w-1 h-1 bg-gray-600 rounded-full animate-bounce mr-1" style={{ animationDelay: '150ms' }} />
                    <div className="w-1 h-1 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                ) : canClaim ? 'Claim' : 'Wait'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
} 