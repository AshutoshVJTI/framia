'use client';

import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import Image from 'next/image';

interface ImageUploaderProps {
  onImageUpload: (file: File) => void;
  previewUrl: string | null;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload, previewUrl }) => {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        onImageUpload(file);
      }
    },
    [onImageUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxFiles: 1,
    multiple: false,
  });

  return (
    <div className="w-full">
      <div {...getRootProps()}>
        <motion.div
          whileHover={{ scale: 1.01 }}
          className={`relative border-2 border-dashed rounded-xl p-8 cursor-pointer transition-colors duration-300 ${
            isDragActive 
              ? 'border-white bg-zinc-800/30' 
              : 'border-zinc-700 hover:border-zinc-600'
          }`}
        >
          <input {...getInputProps()} />

          {previewUrl ? (
            <div className="flex flex-col items-center">
              <div className="relative w-full h-64 mb-4 rounded-lg overflow-hidden">
                <Image
                  src={previewUrl}
                  alt="Product preview"
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-contain"
                />
              </div>
              <p className="text-sm text-gray-400 text-center">
                Click or drag to replace
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48">
              <div className="w-12 h-12 mb-4 text-gray-500">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <p className="text-white font-medium mb-2">
                {isDragActive ? 'Drop here' : 'Drop your image here'}
              </p>
              <p className="text-sm text-gray-500 text-center">
                or click to browse
              </p>
              <div className="flex items-center space-x-2 mt-4 text-xs text-gray-600">
                <span>JPG, PNG, WEBP</span>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default ImageUploader; 