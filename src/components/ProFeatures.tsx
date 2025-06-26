'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { usePaywall } from '@/context/PaywallContext';

const ProFeatures = () => {
  const { isSubscribed } = usePaywall();

  if (isSubscribed) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="border border-zinc-700 rounded-lg p-4 mb-6"
      >
        <div className="flex items-center mb-3">
          <span className="text-white mr-2">👑</span>
          <h3 className="text-sm font-light text-white">Pro Active</h3>
        </div>
        
        <div className="text-xs text-zinc-400">
          All premium features unlocked • Unlimited generations
        </div>
      </motion.div>
    );
  }

  return null; // Hide for free users to reduce clutter
};

export default ProFeatures; 