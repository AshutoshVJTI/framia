'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import AuthButtons from './AuthButtons';

const Header = () => {
  return (
    <motion.header
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="border-b border-zinc-800"
    >
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-6 sm:mb-8">
            <Link href="/" className="inline-block">
              <div className="relative">
                <Image 
                  src="/framia-logo.png" 
                  alt="Framia" 
                  width={120}
                  height={40}
                  className="mx-auto filter brightness-0 invert sm:w-[150px] sm:h-[50px]"
                  priority
                  onError={(e) => {
                    console.error('Logo failed to load:', e);
                    // Hide image and show fallback text
                    e.currentTarget.style.display = 'none';
                    const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = 'block';
                  }}
                  onLoad={() => {
                    console.log('Logo loaded successfully');
                  }}
                />
                <h1 className="text-xl sm:text-2xl font-medium text-white hidden">
                  Framia
                </h1>
              </div>
            </Link>
            <p className="text-xs sm:text-sm text-gray-500 mt-2">
              Professional product photography powered by AI
            </p>
          </div>
        </div>
      </div>
      
      <nav className="border-t border-zinc-900 bg-zinc-950/50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center py-3 sm:py-4 max-w-4xl mx-auto">
            <Link 
              href="/" 
              className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors duration-200"
            >
              Home
            </Link>
            
            <div className="flex items-center space-x-4 sm:space-x-6">
              <a
                href="https://github.com/ashutoshvjti/framia"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors duration-200"
              >
                GitHub
              </a>
              
              <AuthButtons />
            </div>
          </div>
        </div>
      </nav>
    </motion.header>
  );
};

export default Header; 