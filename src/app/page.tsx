'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import ImageUploader from '@/components/ImageUploader';
import StyleSelector from '@/components/StyleSelector';
import ResultDisplay from '@/components/ResultDisplay';
import Header from '@/components/Header';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { usePaywall } from '@/context/PaywallContext';
import PaywallModal from '@/components/PaywallModal';
import SubscriptionBadge from '@/components/SubscriptionBadge';
import ProFeatures from '@/components/ProFeatures';

// Extend the Window interface
declare global {
  interface Window {
    simulateSubscription: () => void;
  }
}

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  enter: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.6, ease: [0.43, 0.13, 0.23, 0.96] }
  }
};

const sectionVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5, ease: [0.43, 0.13, 0.23, 0.96] }
  }
};

// Landing page comparison slider component
const LandingComparisonSlider: React.FC<{ 
  originalSrc: string; 
  enhancedSrc: string; 
  style: string;
}> = ({ originalSrc, enhancedSrc, style }) => {
  const [comparisonPosition, setComparisonPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const updatePosition = React.useCallback((clientX: number) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.min(Math.max((x / rect.width) * 100, 0), 100);
    
    setComparisonPosition(percentage);
  }, []);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    updatePosition(e.clientX);
  };

  const handleMouseMove = React.useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    updatePosition(e.clientX);
  }, [isDragging, updatePosition]);

  const handleMouseUp = React.useCallback(() => {
    setIsDragging(false);
  }, []);

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
    <div 
      className="relative w-full h-48 sm:h-64 border border-zinc-800 rounded-lg overflow-hidden bg-zinc-900 shadow-sm select-none cursor-col-resize"
      onMouseDown={handleMouseDown}
      ref={containerRef}
    >
      {/* Background image (enhanced) */}
      <div className="absolute inset-0">
        <Image
          src={enhancedSrc}
          alt={`Enhanced ${style} product`}
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
          src={originalSrc}
          alt={`Original ${style} product`}
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
        className="absolute top-1/2 transform -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-full shadow-lg flex items-center justify-center z-30 cursor-col-resize border-2 border-gray-200 hover:border-blue-400 transition-colors"
        style={{ left: `calc(${comparisonPosition}% - 16px)` }}
      >
        <svg className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
        </svg>
      </div>
      
      {/* Labels */}
      <div className="absolute top-2 sm:top-4 left-2 sm:left-4 py-1 px-2 sm:px-3 bg-black/60 text-white text-xs font-medium rounded-full backdrop-blur-sm">
        Before
      </div>
      
      <div className="absolute top-2 sm:top-4 right-2 sm:right-4 py-1 px-2 sm:px-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-medium rounded-full backdrop-blur-sm">
        After • {style}
      </div>
    </div>
  );
};

export default function Home() {
  const { user, loading } = useAuth();
  const { consumeGeneration, remainingGenerations, isSubscribed } = usePaywall();
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string>('ecommerce');
  const [selectedQuality, setSelectedQuality] = useState<string>('low'); // Default to low for free users
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [shouldConsumeGeneration, setShouldConsumeGeneration] = useState<boolean>(false);
  
  // Settings (keeping for backward compatibility)
  const [imageQuality, setImageQuality] = useState<string>('medium');
  const [useCache, setUseCache] = useState<boolean>(true);
  const [apiLimit, setApiLimit] = useState<string>('50');

  // Handle generation consumption at component level
  useEffect(() => {
    if (shouldConsumeGeneration) {
      consumeGeneration();
      setShouldConsumeGeneration(false);
    }
  }, [shouldConsumeGeneration, consumeGeneration]);

  // Load settings when component mounts and adjust for Pro status
  useEffect(() => {
    const savedQuality = localStorage.getItem('imageQuality') || (isSubscribed ? 'medium' : 'low');
    const savedCache = localStorage.getItem('cacheEnabled') !== 'false';
    const savedLimit = localStorage.getItem('apiLimit') || '50';
    
    setImageQuality(savedQuality);
    setSelectedQuality(savedQuality);
    setUseCache(savedCache);
    setApiLimit(savedLimit);
  }, [user, isSubscribed]);

  const handleImageUpload = (file: File) => {
    setUploadedImage(file);
    setPreviewUrl(URL.createObjectURL(file));
    setGeneratedImageUrl(null);
    setError(null);
  };

  const handleStyleChange = (style: string) => {
    setSelectedStyle(style);
    setGeneratedImageUrl(null);
    setError(null);
  };

  const handleQualityChange = (quality: string) => {
    setSelectedQuality(quality);
    setImageQuality(quality); // Keep imageQuality in sync for API call
    setGeneratedImageUrl(null);
    setError(null);
  };

  const generateImage = async () => {
    if (!uploadedImage) {
      setError('Please upload an image first.');
      return;
    }

    if (!user) {
      setError('Please sign in to generate images.');
      return;
    }
    
    if (remainingGenerations <= 0) {
      setError('You have reached your generation limit. Please upgrade to continue.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', uploadedImage);
      formData.append('style', selectedStyle);
      formData.append('quality', imageQuality);
      formData.append('useCache', useCache.toString());
      formData.append('apiLimit', apiLimit);
      formData.append('userId', user.uid);

      const response = await fetch('/api/generate-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate image');
      }

      const data = await response.json();
      setGeneratedImageUrl(data.imageUrl);
    } catch (error) {
      console.error('Error generating image:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center space-x-3"
        >
          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
          <div className="w-2 h-2 bg-white/70 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
          <div className="w-2 h-2 bg-white/50 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
        </motion.div>
      </div>
    );
  }

  // Show landing page for unauthenticated users
  if (!user && !loading) {
    return (
      <motion.div 
        className="min-h-screen bg-black text-white"
        variants={pageVariants}
        initial="initial"
        animate="enter"
      >
        <Header />
        
        <div className="container mx-auto px-4 sm:px-6 py-12 sm:py-20">
          <div className="max-w-4xl mx-auto">
            
            {/* Hero Section */}
            <motion.div
              variants={sectionVariants}
              initial="hidden"
              animate="visible"
              className="mb-12 sm:mb-16"
            >
              <div className="max-w-3xl">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-normal tracking-tight mb-4 sm:mb-6 leading-tight">
                  Professional product photography.
                  <br />
                  <span className="text-zinc-500">No studio required.</span>
                </h1>
                <p className="text-base sm:text-lg text-zinc-400 mb-6 sm:mb-8 max-w-xl font-normal leading-relaxed">
                  Transform your product images into professional e-commerce photos. Perfect lighting, clean backgrounds, multiple styles.
                </p>
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-8 sm:mb-12">
                  <Link
                    href="/auth"
                    className="w-full sm:w-auto px-6 py-2.5 bg-white text-black text-sm font-medium hover:bg-zinc-100 transition-colors text-center"
                  >
                    Start Free Trial
                  </Link>
                  <button 
                    onClick={() => {
                      document.getElementById('examples-section')?.scrollIntoView({ 
                        behavior: 'smooth' 
                      });
                    }}
                    className="text-sm text-zinc-400 hover:text-white transition-colors underline underline-offset-4"
                  >
                    See examples
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6 text-sm text-zinc-500">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    <span>3 free generations</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                    <span>No credit card</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                    <span>Ready in 30s</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* How it works */}
            <motion.div
              variants={sectionVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.2 }}
              className="mb-16 sm:mb-24"
            >
              <h2 className="text-xl sm:text-2xl font-medium mb-8 sm:mb-12">How it works</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 sm:gap-12">
                <div className="space-y-3 sm:space-y-4">
                  <div className="w-8 h-8 bg-white text-black rounded-full flex items-center justify-center text-sm font-medium">
                    1
                  </div>
                  <h3 className="text-base sm:text-lg font-medium">Upload your product</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">
                    Upload any product image. Our AI analyzes the product and removes distracting backgrounds automatically.
                  </p>
                </div>
                
                <div className="space-y-3 sm:space-y-4">
                  <div className="w-8 h-8 bg-white text-black rounded-full flex items-center justify-center text-sm font-medium">
                    2
                  </div>
                  <h3 className="text-base sm:text-lg font-medium">Choose your style</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">
                    Select from professional photography styles: clean e-commerce, lifestyle contexts, or premium luxury presentations.
                  </p>
                </div>
                
                <div className="space-y-3 sm:space-y-4 sm:col-span-2 md:col-span-1">
                  <div className="w-8 h-8 bg-white text-black rounded-full flex items-center justify-center text-sm font-medium">
                    3
                  </div>
                  <h3 className="text-base sm:text-lg font-medium">Download & use</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">
                    Get high-resolution photos ready for your website, social media, or marketing materials in under 30 seconds.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Examples Section */}
            <motion.div
              id="examples-section"
              variants={sectionVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.3 }}
              className="mb-16 sm:mb-20"
            >
              <h2 className="text-xl sm:text-2xl font-medium mb-2">Results</h2>
              <p className="text-zinc-400 mb-4 text-sm">Real transformations from our customers</p>
              <p className="text-zinc-500 mb-8 sm:mb-12 text-xs">💡 Drag the slider on any image to see the before/after comparison</p>
              
              <div className="space-y-12 sm:space-y-16">
                {/* Example 1 - E-commerce */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12 items-start md:items-center">
                  <div>
                    <LandingComparisonSlider 
                      originalSrc="/ecommerce.jpg"
                      enhancedSrc="/ecommerce-enhanced.jpg"
                      style="E-commerce"
                    />
                  </div>
                  
                  <div className="space-y-4 sm:space-y-6">
                    <div>
                      <h3 className="text-lg sm:text-xl font-medium mb-2">E-commerce Photography</h3>
                      <p className="text-zinc-400 text-sm leading-relaxed mb-4">
                        Perfect for online stores. Clean white backgrounds, optimal lighting, and product-focused composition that converts browsers into buyers.
                      </p>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                        <span className="px-2 py-1 bg-zinc-800 rounded">Clean backgrounds</span>
                        <span className="px-2 py-1 bg-zinc-800 rounded">Consistent lighting</span>
                        <span className="px-2 py-1 bg-zinc-800 rounded">High conversion</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Example 2 - Lifestyle */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12 items-start md:items-center">
                  <div className="md:order-2">
                    <LandingComparisonSlider 
                      originalSrc="/lifestyle.avif"
                      enhancedSrc="/lifestyle-enhanced.jpg"
                      style="Lifestyle"
                    />
                  </div>
                  
                  <div className="md:order-1 space-y-4 sm:space-y-6">
                    <div>
                      <h3 className="text-lg sm:text-xl font-medium mb-2">Lifestyle Photography</h3>
                      <p className="text-zinc-400 text-sm leading-relaxed mb-4">
                        Show products in real-world settings. Natural environments and authentic usage scenarios that help customers envision ownership.
                      </p>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                        <span className="px-2 py-1 bg-zinc-800 rounded">Real contexts</span>
                        <span className="px-2 py-1 bg-zinc-800 rounded">Emotional connection</span>
                        <span className="px-2 py-1 bg-zinc-800 rounded">Social media ready</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Example 3 - Luxury */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12 items-start md:items-center">
                  <div>
                    <LandingComparisonSlider 
                      originalSrc="/luxury.jpg"
                      enhancedSrc="/luxury-enhanced.jpg"
                      style="Luxury"
                    />
                  </div>
                  
                  <div className="space-y-4 sm:space-y-6">
                    <div>
                      <h3 className="text-lg sm:text-xl font-medium mb-2 flex items-center gap-2">
                        Luxury Photography
                        <span className="text-xs bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded">PRO</span>
                      </h3>
                      <p className="text-zinc-400 text-sm leading-relaxed mb-4">
                        Premium styling with sophisticated lighting and premium materials. Perfect for high-end brands and luxury product lines.
                      </p>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                        <span className="px-2 py-1 bg-zinc-800 rounded">Premium materials</span>
                        <span className="px-2 py-1 bg-zinc-800 rounded">Sophisticated lighting</span>
                        <span className="px-2 py-1 bg-zinc-800 rounded">Luxury appeal</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Pricing */}
            <motion.div
              variants={sectionVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.4 }}
              className="border-t border-zinc-800 pt-12 sm:pt-16"
            >
              <h2 className="text-xl sm:text-2xl font-medium mb-6 sm:mb-8">Pricing</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                
                <div className="border border-zinc-800 p-4 sm:p-6 space-y-3 sm:space-y-4">
                  <div>
                    <h3 className="text-base sm:text-lg font-medium text-white">Free</h3>
                    <div className="text-xl sm:text-2xl font-medium text-white mt-2">$0</div>
                  </div>
                  <div className="text-sm text-zinc-400 space-y-1">
                    <div>3 generations per day</div>
                    <div>Standard quality (512px)</div>
                    <div>Basic styles</div>
                  </div>
                  <Link
                    href="/auth"
                    className="block w-full py-2.5 text-center text-sm border border-zinc-700 text-white hover:border-zinc-600 transition-colors"
                  >
                    Start free
                  </Link>
                </div>

                <div className="border border-zinc-700 p-4 sm:p-6 space-y-3 sm:space-y-4">
                  <div>
                    <h3 className="text-base sm:text-lg font-medium text-white">Pro Weekly</h3>
                    <div className="text-xl sm:text-2xl font-medium text-white mt-2">$7</div>
                    <div className="text-xs text-zinc-500">7 days</div>
                  </div>
                  <div className="text-sm text-zinc-400 space-y-1">
                    <div>Unlimited generations</div>
                    <div>All quality options</div>
                    <div>All styles including luxury</div>
                  </div>
                  <Link
                    href="/auth"
                    className="block w-full py-2.5 text-center text-sm bg-zinc-800 text-white hover:bg-zinc-700 transition-colors"
                  >
                    Try weekly
                  </Link>
                </div>
                
                <div className="border border-white p-4 sm:p-6 space-y-3 sm:space-y-4 sm:col-span-2 lg:col-span-1">
                  <div>
                    <h3 className="text-base sm:text-lg font-medium text-white">Pro Monthly</h3>
                    <div className="text-xl sm:text-2xl font-medium text-white mt-2">$20</div>
                    <div className="text-xs text-zinc-500">30 days • Most popular</div>
                  </div>
                  <div className="text-sm text-zinc-400 space-y-1">
                    <div>Unlimited generations</div>
                    <div>All quality options</div>
                    <div>All styles including luxury</div>
                  </div>
                  <Link
                    href="/auth"
                    className="block w-full py-2.5 text-center text-sm bg-white text-black hover:bg-zinc-100 transition-colors"
                  >
                    Start pro
                  </Link>
                </div>
                
              </div>
            </motion.div>

          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="min-h-screen bg-black text-white"
      variants={pageVariants}
      initial="initial"
      animate="enter"
    >
      <Header />
      <PaywallModal />
      
      <div className="container mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="max-w-4xl mx-auto">
          
          {/* Hero Section */}
          <motion.div
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            className="text-center mb-8 sm:mb-12"
          >
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-light tracking-tight mb-3 sm:mb-4">
              Transform
            </h1>
            <p className="text-base sm:text-lg text-zinc-400 mb-4 sm:mb-6 max-w-xl mx-auto font-light">
              Professional product photography powered by AI
            </p>
            <div className="flex items-center justify-center space-x-6">
              <SubscriptionBadge />
            </div>
          </motion.div>

          {/* Pro Status - Only show for Pro users */}
          <motion.div
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.05 }}
          >
            <ProFeatures />
          </motion.div>

          {/* Main Content */}
          <motion.div
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.1 }}
            className="border border-zinc-800 rounded-lg p-4 sm:p-6 mb-6 sm:mb-8"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
              
              {/* Upload Section */}
              <div className="space-y-3 sm:space-y-4">
                <h3 className="text-base sm:text-lg font-light text-white mb-3 sm:mb-4">Upload Image</h3>
                <ImageUploader onImageUpload={handleImageUpload} previewUrl={previewUrl} />
              </div>
              
              {/* Style Section */}
              <div className="space-y-3 sm:space-y-4">
                <StyleSelector 
                  selectedStyle={selectedStyle} 
                  onStyleChange={handleStyleChange}
                  selectedQuality={selectedQuality}
                  onQualityChange={handleQualityChange}
                />
              </div>
            </div>

            {/* Generate Button */}
            <div className="flex justify-center mt-6 sm:mt-8">
              <motion.button
                onClick={() => {
                  setShouldConsumeGeneration(true);
                  generateImage();
                }}
                disabled={!uploadedImage || isLoading}
                whileHover={{ scale: !uploadedImage || isLoading ? 1 : 1.01 }}
                whileTap={{ scale: !uploadedImage || isLoading ? 1 : 0.99 }}
                className={`w-full sm:w-auto px-6 py-2.5 sm:py-2 rounded font-light transition-all duration-200 ${
                  !uploadedImage || isLoading
                    ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
                    : 'bg-white text-black hover:bg-zinc-100 border border-white'
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 border border-zinc-500 border-t-transparent rounded-full animate-spin" />
                    <span>Generating...</span>
                  </div>
                ) : (
                  'Generate'
                )}
              </motion.button>
            </div>
          </motion.div>

          {/* Error Display */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="border border-red-900/50 rounded-lg p-3 mb-6"
              >
                <div className="text-red-400 text-sm font-light">
                  {error}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Result Display */}
          <AnimatePresence>
            {generatedImageUrl && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.5 }}
              >
                <ResultDisplay 
                  originalImage={previewUrl!} 
                  generatedImage={generatedImageUrl} 
                  styleName={selectedStyle} 
                />
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </motion.div>
  );
}
