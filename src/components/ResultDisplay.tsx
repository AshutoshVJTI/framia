'use client';

import React, { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';

interface ResultDisplayProps {
  originalImage: string;
  generatedImage: string;
  styleName: string;
}

const styleNames: Record<string, string> = {
  modern: 'Modern',
  luxury: 'Luxury',
  vintage: 'Vintage',
  minimalist: 'Minimalist',
  neon: 'Neon',
};

const styleGradients: Record<string, string> = {
  ecommerce: 'from-blue-500 to-indigo-600',
  lifestyle: 'from-green-500 to-teal-600',
  minimalist: 'from-gray-500 to-gray-700',
  artistic: 'from-purple-500 to-pink-600',
  social: 'from-red-500 to-orange-600',
  luxury: 'from-yellow-500 to-amber-600',
  vintage: 'from-amber-500 to-orange-600',
  neon: 'from-pink-500 to-purple-600',
};

const ResultDisplay: React.FC<ResultDisplayProps> = ({
  originalImage,
  generatedImage,
  styleName,
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [viewMode, setViewMode] = useState<'side-by-side' | 'comparison'>('side-by-side');
  const [comparisonPosition, setComparisonPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const downloadImage = (url: string, name: string) => {
    setIsDownloading(true);
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Show downloading state for a short time
    setTimeout(() => {
      setIsDownloading(false);
    }, 1500);
  };

  const updatePosition = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.min(Math.max((x / rect.width) * 100, 0), 100);
    
    setComparisonPosition(percentage);
  }, []);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (viewMode !== 'comparison') return;
    
    setIsDragging(true);
    updatePosition(e.clientX);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    updatePosition(e.clientX);
  }, [isDragging, updatePosition]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Add global mouse event listeners when dragging
  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <motion.div 
      className="bg-white rounded-xl shadow-md overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Your Results</h2>
          
          <div className="flex items-center space-x-2 mt-3 sm:mt-0">
            <button 
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                viewMode === 'side-by-side' 
                  ? 'bg-gray-800 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              onClick={() => setViewMode('side-by-side')}
            >
              Side by Side
            </button>
            <button 
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                viewMode === 'comparison' 
                  ? 'bg-gray-800 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              onClick={() => setViewMode('comparison')}
            >
              Comparison Slider
            </button>
          </div>
        </div>
        
        {viewMode === 'side-by-side' ? (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex flex-col">
              <div className="mb-3 flex items-center justify-center">
                <span className="inline-block py-1 px-3 bg-gray-100 text-gray-800 text-sm font-medium rounded-full">
                  Original Image
                </span>
              </div>
              <div className="relative w-full h-80 border border-gray-100 rounded-lg overflow-hidden bg-gray-50 shadow-sm">
                <Image
                  src={originalImage}
                  alt="Original product"
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-contain"
                />
              </div>
            </div>
            
            <div className="flex flex-col">
              <div className="mb-3 flex items-center justify-center">
                <span className={`
                  inline-block py-1 px-3 text-sm font-medium rounded-full
                  bg-gradient-to-r ${styleGradients[styleName] || 'from-blue-500 to-blue-600'} text-white
                `}>
                  Generated {styleNames[styleName] || styleName} Image
                </span>
              </div>
              <div className="relative w-full h-80 border border-gray-100 rounded-lg overflow-hidden bg-gray-50 shadow-sm">
                <Image
                  src={generatedImage}
                  alt="Generated product"
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-contain"
                />
              </div>
            </div>
          </div>
        ) : (
          <div 
            className="relative w-full h-96 border border-gray-100 rounded-lg overflow-hidden bg-gray-50 shadow-sm select-none"
            onMouseDown={handleMouseDown}
            ref={containerRef}
          >
            {/* Background image (generated) */}
            <div className="absolute inset-0">
              <Image
                src={generatedImage}
                alt="Generated product"
                fill
                sizes="100vw"
                className="object-contain"
                style={{ objectPosition: 'center' }}
              />
            </div>
            
            {/* Foreground image (original) with clipping */}
            <div 
              className="absolute inset-0 overflow-hidden"
              style={{ 
                clipPath: `inset(0 ${100 - comparisonPosition}% 0 0)`,
              }}
            >
              <Image
                src={originalImage}
                alt="Original product"
                fill
                sizes="100vw"
                className="object-contain"
                style={{ objectPosition: 'center' }}
              />
            </div>
            
            {/* Divider line */}
            <div 
              className="absolute inset-y-0 w-0.5 bg-white shadow-lg z-20 pointer-events-none"
              style={{ left: `${comparisonPosition}%` }}
            />
            
            {/* Slider handle */}
            <div 
              className="absolute top-1/2 transform -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center z-30 cursor-col-resize border-2 border-gray-200 hover:border-blue-400 transition-colors"
              style={{ left: `calc(${comparisonPosition}% - 20px)` }}
            >
              <svg className="w-4 h-4 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
              </svg>
            </div>
            
            {/* Labels */}
            <div className="absolute top-4 left-4 py-1 px-3 bg-black/60 text-white text-xs font-medium rounded-full backdrop-blur-sm">
              Original
            </div>
            
            <div className="absolute top-4 right-4 py-1 px-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-medium rounded-full backdrop-blur-sm">
              Generated
            </div>
          </div>
        )}
        
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center sm:justify-between">
          <button
            onClick={() => downloadImage(generatedImage, `product-${styleName}-${Date.now()}.jpg`)}
            disabled={isDownloading}
            className={`
              relative overflow-hidden group py-3 px-6 rounded-full font-semibold transition-all duration-300 flex items-center
              ${isDownloading ? 
                'bg-green-100 text-green-700 cursor-default' : 
                'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md hover:shadow-lg transform hover:-translate-y-1'
              }
            `}
          >
            {isDownloading ? (
              <>
                <svg className="w-5 h-5 mr-2 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Downloading...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download Generated Image
              </>
            )}
            {!isDownloading && (
              <span className="absolute top-0 left-0 w-full h-full bg-white/20 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-700"></span>
            )}
          </button>
          
          <p className="text-sm text-gray-500 mt-4 sm:mt-0 text-center sm:text-right">
            Generated using {styleNames[styleName] || styleName} style • AI-enhanced image
          </p>
        </div>
      </div>
      
      <div className="bg-gray-50 px-6 py-4 border-t border-gray-100">
        <p className="text-center text-gray-500 text-sm">
          Images are generated using AI and may vary in quality.
          <br className="hidden sm:inline" />
          You can use these images for your website, social media, or marketing materials.
        </p>
      </div>
    </motion.div>
  );
};

export default ResultDisplay;