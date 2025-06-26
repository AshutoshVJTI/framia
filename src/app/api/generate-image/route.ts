import { NextRequest, NextResponse } from 'next/server';
import OpenAI, { toFile } from 'openai';
import fs from 'fs';
import path from 'path';
import os from 'os';
import sharp from 'sharp';
import crypto from 'crypto';

// Initialize the OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Simple cache to store previously generated images
// Increased cache size to reduce duplicate API calls
const imageCache = new Map();
const CACHE_SIZE = 1000; // Increased from 100

// Track API usage to implement rate limiting if needed
let apiCallCount = 0;
const DEFAULT_DAILY_LIMIT = 30; // Reduced from 50 to save costs
const resetTime = new Date();
resetTime.setHours(24, 0, 0, 0); // Reset at midnight

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const imageFile = formData.get('image') as File;
    const style = formData.get('style') as string;
    const quality = (formData.get('quality') as string) || 'medium';
    const useCache = formData.get('useCache') !== 'false'; // Default to true
    const userApiLimit = parseInt((formData.get('apiLimit') as string) || '50');
    
    // Set the daily limit based on user preference or environment variable
    const DAILY_LIMIT = Math.min(
      userApiLimit,
      parseInt(process.env.DAILY_API_LIMIT || String(DEFAULT_DAILY_LIMIT))
    );

    if (!imageFile) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
    }

    if (!style) {
      return NextResponse.json({ error: 'No style specified' }, { status: 400 });
    }

    // Check if we've exceeded the daily limit
    const now = new Date();
    if (now > resetTime) {
      // Reset counter if it's a new day
      apiCallCount = 0;
      resetTime.setDate(resetTime.getDate() + 1);
    }
    
    if (apiCallCount >= DAILY_LIMIT) {
      return NextResponse.json(
        { error: 'Daily API limit reached. Please try again tomorrow.' },
        { status: 429 }
      );
    }

    // Convert the file to a buffer
    const bytes = await imageFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Create a hash of the image, style, and quality to use as a cache key
    const hash = crypto
      .createHash('md5')
      .update(buffer)
      .update(style)
      .update(quality)
      .digest('hex');
    
    // Check if we have a cached result and caching is enabled
    if (useCache && imageCache.has(hash)) {
      console.log("Returning cached image result");
      return NextResponse.json(imageCache.get(hash));
    }
    
    // Create a temporary directory for our files
    const tempDir = os.tmpdir();
    const originalFilePath = path.join(tempDir, `upload-original-${Date.now()}.png`);
    
    // Determine image size based on quality setting (default to low to save costs)
    let imageSize = 512; // Default to low quality to reduce API costs
    if (quality === 'medium') {
      imageSize = 768;
    } else if (quality === 'high') {
      imageSize = 1024;
    }
    
    // Convert to PNG format with appropriate size and compression based on quality setting
    await sharp(buffer)
      .resize(imageSize, imageSize, { fit: 'inside', withoutEnlargement: true })
      .png({ 
        quality: quality === 'high' ? 80 : 60, // More aggressive compression
        compressionLevel: 9, // Maximum compression
        palette: quality === 'low' // Use palette for low quality to reduce file size
      })
      .toFile(originalFilePath);
    
    // Log the file size for debugging
    const stats = fs.statSync(originalFilePath);
    console.log(`Image size: ${Math.round(stats.size / 1024)}KB at ${imageSize}x${imageSize} resolution`);
    
    // Create the style prompt based on the selected style
    let prompt = '';
    
    switch (style) {
      case 'ecommerce':
        prompt = 'Transform into a professional e-commerce style photo with clean white background, perfect studio lighting, and clear focus on all product details.';
        break;
      case 'lifestyle':
        prompt = 'Transform into a lifestyle context showing the product in use in a natural environment. Add soft, ambient lighting and organic elements.';
        break;
      case 'minimalist':
        prompt = 'Transform into a minimalist photo with a simple, gradient background, elegant composition, and subtle shadows.';
        break;
      case 'artistic':
        prompt = 'Transform into an artistic, editorial-style photo with dramatic lighting, creative composition, and bold visual elements.';
        break;
      case 'social':
        prompt = 'Transform into a social media ready product photo with vibrant colors, interesting perspectives, and eye-catching presentation.';
        break;
      case 'luxury':
        prompt = 'Transform into a luxury, high-end product photo with premium materials, sophisticated lighting, marble or velvet textures, and an exclusive, upscale aesthetic.';
        break;
      case 'vintage':
        prompt = 'Transform into a vintage-style photo with retro color grading, nostalgic film grain, classic composition, and timeless aesthetic reminiscent of 1970s-1980s photography.';
        break;
      case 'neon':
        prompt = 'Transform into a futuristic neon-style photo with vibrant electric colors, glowing neon lighting effects, cyberpunk aesthetic, and dramatic contrast against dark backgrounds.';
        break;
      default:
        prompt = 'Transform into a professional, high-quality commercial image with perfect lighting and composition.';
    }
    
    console.log(`Using gpt-image-1 to edit the image with style: ${style}, quality: ${quality}`);
    
    // Increment the API call counter
    apiCallCount++;
    
    // Use OpenAI's image edit endpoint with gpt-image-1 model
    const imageToEdit = await toFile(fs.createReadStream(originalFilePath), null, {
      type: 'image/png',
    });
    
    const response = await openai.images.edit({
      model: "gpt-image-1",
      image: imageToEdit,
      prompt: prompt,
    });
    
    // Clean up temporary files
    fs.unlinkSync(originalFilePath);
    
    // Check if response has data and base64 JSON
    if (response.data && response.data.length > 0) {
      let result = {};
      
      if (response.data[0].b64_json) {
        // If we get base64 data, convert it to a data URL
        const base64Data = response.data[0].b64_json;
        const dataUrl = `data:image/png;base64,${base64Data}`;
        result = { imageUrl: dataUrl };
      } else if (response.data[0].url) {
        // If we get a URL, return it
        result = { imageUrl: response.data[0].url };
      }
      
      // Save to cache if caching is enabled
      if (useCache) {
        // Limit cache size to prevent memory issues
        if (imageCache.size >= CACHE_SIZE) {
          // Remove oldest entry (first key)
          const firstKey = imageCache.keys().next().value;
          imageCache.delete(firstKey);
        }
        imageCache.set(hash, result);
      }
      
      return NextResponse.json(result);
    }
    
    throw new Error('No image data in the response');
  } catch (error) {
    console.error('Error generating image:', error);
    return NextResponse.json(
      { error: 'Failed to generate image', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 