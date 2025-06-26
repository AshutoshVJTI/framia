'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { usePaywall } from '@/context/PaywallContext';

interface StyleOption {
  id: string;
  name: string;
  description: string;
  icon: string;
  isPro?: boolean;
}

interface QualityOption {
  id: string;
  name: string;
  description: string;
  resolution: string;
  cost: string;
}

interface StyleSelectorProps {
  selectedStyle: string;
  onStyleChange: (style: string) => void;
  selectedQuality: string;
  onQualityChange: (quality: string) => void;
}

const styles: StyleOption[] = [
  {
    id: 'ecommerce',
    name: 'E-commerce',
    description: 'Clean background with perfect lighting',
    icon: '🛍️',
  },
  {
    id: 'lifestyle',
    name: 'Lifestyle',
    description: 'Natural, real-life context',
    icon: '🏡',
  },
  {
    id: 'minimalist',
    name: 'Minimalist',
    description: 'Simple, elegant composition',
    icon: '✨',
  },
  {
    id: 'artistic',
    name: 'Artistic',
    description: 'Creative, editorial-style',
    icon: '🎨',
  },
  {
    id: 'social',
    name: 'Social Media',
    description: 'Eye-catching for social platforms',
    icon: '📱',
  },
  {
    id: 'luxury',
    name: 'Luxury',
    description: 'Premium, high-end presentation',
    icon: '💎',
    isPro: true,
  },
  {
    id: 'vintage',
    name: 'Vintage',
    description: 'Retro, nostalgic aesthetic',
    icon: '📸',
    isPro: true,
  },
  {
    id: 'neon',
    name: 'Neon',
    description: 'Vibrant, electric glow effects',
    icon: '⚡',
    isPro: true,
  },
];

const qualityOptions: QualityOption[] = [
  {
    id: 'low',
    name: 'Standard',
    description: 'Fast generation',
    resolution: '512×512',
    cost: 'Free',
  },
  {
    id: 'medium',
    name: 'High Quality',
    description: 'Better detail',
    resolution: '768×768',
    cost: 'Pro',
  },
  {
    id: 'high',
    name: 'Ultra HD',
    description: 'Maximum quality',
    resolution: '1024×1024',
    cost: 'Pro',
  },
];

const StyleSelector: React.FC<StyleSelectorProps> = ({ 
  selectedStyle, 
  onStyleChange, 
  selectedQuality, 
  onQualityChange 
}) => {
  const { isSubscribed, openCheckout } = usePaywall();

  const handleStyleClick = (styleId: string, isPro: boolean) => {
    if (isPro && !isSubscribed) {
      openCheckout();
      return;
    }
    onStyleChange(styleId);
  };

  const handleQualityClick = (qualityId: string) => {
    const quality = qualityOptions.find(q => q.id === qualityId);
    if (quality?.cost === 'Pro' && !isSubscribed) {
      openCheckout();
      return;
    }
    onQualityChange(qualityId);
  };

  return (
    <div className="space-y-6">
      {/* Quality Selection - Only for Pro users */}
      {isSubscribed && (
        <div>
          <h3 className="text-sm font-light text-white mb-3">Quality</h3>
          <div className="grid grid-cols-3 gap-3">
            {qualityOptions.map((quality) => (
              <motion.div
                key={quality.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`
                  relative border rounded-lg p-3 cursor-pointer transition-all duration-200
                  ${selectedQuality === quality.id
                    ? 'border-white bg-zinc-800/50' 
                    : 'border-zinc-700 hover:border-zinc-600'
                  }
                `}
                onClick={() => handleQualityClick(quality.id)}
              >
                <div className="text-center">
                  <h4 className={`font-medium text-sm ${selectedQuality === quality.id ? 'text-white' : 'text-gray-300'}`}>
                    {quality.name}
                  </h4>
                  <p className={`text-xs mt-1 ${selectedQuality === quality.id ? 'text-gray-300' : 'text-gray-500'}`}>
                    {quality.resolution}
                  </p>
                  <p className={`text-xs ${selectedQuality === quality.id ? 'text-gray-400' : 'text-gray-600'}`}>
                    {quality.description}
                  </p>
                </div>
                
                {selectedQuality === quality.id && (
                  <div className="absolute top-2 right-2 text-white">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Style Selection */}
      <div>
        <h3 className="text-sm font-light text-white mb-3">Style</h3>
        <div className="space-y-2">
          {styles.map((style) => {
            const isLocked = style.isPro && !isSubscribed;
            
            return (
              <motion.div
                key={style.id}
                whileHover={{ scale: isLocked ? 1 : 1.01 }}
                whileTap={{ scale: isLocked ? 1 : 0.99 }}
                className={`
                  relative border rounded-lg p-4 cursor-pointer transition-all duration-200
                  ${selectedStyle === style.id
                    ? 'border-white bg-zinc-800/50' 
                    : isLocked
                    ? 'border-zinc-700 opacity-60'
                    : 'border-zinc-700 hover:border-zinc-600'
                  }
                `}
                onClick={() => handleStyleClick(style.id, style.isPro || false)}
              >
                <div className="flex items-center">
                  <div className={`
                    flex items-center justify-center w-10 h-10 rounded-lg text-lg mr-3 relative
                    ${selectedStyle === style.id 
                      ? 'bg-white text-black' 
                      : 'bg-zinc-800 text-gray-400'
                    }
                  `}>
                    {style.icon}
                    {isLocked && (
                      <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center">
                      <h4 className={`font-medium ${selectedStyle === style.id ? 'text-white' : 'text-gray-300'}`}>
                        {style.name}
                      </h4>
                      {style.isPro && (
                        <span className="ml-2 text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full font-medium">
                          PRO
                        </span>
                      )}
                    </div>
                    <p className={`text-sm ${selectedStyle === style.id ? 'text-gray-300' : 'text-gray-500'}`}>
                      {style.description}
                    </p>
                    {isLocked && (
                      <p className="text-xs text-yellow-400 mt-1">
                        Upgrade to Pro to unlock this style
                      </p>
                    )}
                  </div>
                  
                  {selectedStyle === style.id && !isLocked && (
                    <div className="ml-4 text-white">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default StyleSelector; 