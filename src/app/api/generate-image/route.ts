import { NextRequest, NextResponse } from 'next/server';
import OpenAI, { toFile } from 'openai';
import fs from 'fs';
import path from 'path';
import os from 'os';
import sharp from 'sharp';
import crypto from 'crypto';
import redis from '@/lib/redis';

// Initialize the OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Simple cache to store previously generated images
const imageCache = new Map();
const CACHE_SIZE = 1000;

const DEFAULT_DAILY_LIMIT = 30;

function validateFile(file: File & { size?: number; type?: string }) {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!file.size || file.size > maxSize) {
    throw new Error('File too large');
  }
  if (!file.type || !allowedTypes.includes(file.type)) {
    throw new Error('Invalid file type');
  }
  return true;
}

export async function POST(req: NextRequest) {
  try {
    // --- AUTHENTICATION ---
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split('Bearer ')[1];
    let userId;
    try {
      const { getAuth } = await import('firebase-admin/auth');
      const decodedToken = await getAuth().verifyIdToken(token);
      userId = decodedToken.uid;
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const formData = await req.formData();
    const imageFile = formData.get('image') as File;
    const style = formData.get('style') as string;
    const quality = (formData.get('quality') as string) || 'medium';
    const useCache = formData.get('useCache') !== 'false';
    const userApiLimit = parseInt((formData.get('apiLimit') as string) || '50');
    const DAILY_LIMIT = Math.min(userApiLimit, parseInt(process.env.DAILY_API_LIMIT || String(DEFAULT_DAILY_LIMIT)));

    if (!imageFile) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
    }
    if (!style) {
      return NextResponse.json({ error: 'No style specified' }, { status: 400 });
    }
    // --- FILE VALIDATION ---
    try {
      validateFile(imageFile);
    } catch (err) {
      return NextResponse.json({ error: (err as Error).message }, { status: 400 });
    }

    // --- PER-USER RATE LIMITING ---
    // Use Redis to track per-user daily usage
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const redisKey = `rate_limit:${userId}:${today}`;
    const usage = await redis.incr(redisKey);
    if (usage === 1) {
      // Set expiry to midnight
      const now = new Date();
      const msUntilMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() - now.getTime();
      await redis.pexpire(redisKey, msUntilMidnight);
    }
    if (usage > DAILY_LIMIT) {
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
      return NextResponse.json(imageCache.get(hash));
    }
    // Create a temporary directory for our files
    const tempDir = os.tmpdir();
    const originalFilePath = path.join(tempDir, `upload-original-${Date.now()}.png`);
    // Determine image size based on quality setting
    let imageSize = 512;
    if (quality === 'medium') {
      imageSize = 768;
    } else if (quality === 'high') {
      imageSize = 1024;
    }
    await sharp(buffer)
      .resize(imageSize, imageSize, { fit: 'inside', withoutEnlargement: true })
      .png({ 
        quality: quality === 'high' ? 80 : 60,
        compressionLevel: 9,
        palette: quality === 'low'
      })
      .toFile(originalFilePath);
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
        const base64Data = response.data[0].b64_json;
        const dataUrl = `data:image/png;base64,${base64Data}`;
        result = { imageUrl: dataUrl };
      } else if (response.data[0].url) {
        result = { imageUrl: response.data[0].url };
      }
      if (useCache) {
        if (imageCache.size >= CACHE_SIZE) {
          const firstKey = imageCache.keys().next().value;
          imageCache.delete(firstKey);
        }
        imageCache.set(hash, result);
      }
      return NextResponse.json(result);
    }
    throw new Error('No image data in the response');
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to generate image', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 