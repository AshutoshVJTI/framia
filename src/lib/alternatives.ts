// Cost comparison for different AI image editing services
export const imageEditingServices = {
  openai: {
    name: 'OpenAI DALL-E',
    cost: 0.02, // $0.02 per image
    quality: 'High',
    speed: 'Medium',
    features: ['Style transfer', 'Object editing', 'Background removal']
  },
  stability: {
    name: 'Stability AI',
    cost: 0.004, // $0.004 per image (5x cheaper!)
    quality: 'High',
    speed: 'Fast',
    features: ['Style transfer', 'Inpainting', 'Outpainting']
  },
  huggingface: {
    name: 'Hugging Face',
    cost: 0.001, // $0.001 per image (20x cheaper!)
    quality: 'Medium',
    speed: 'Fast',
    features: ['Basic style transfer', 'Background removal']
  },
  replicate: {
    name: 'Replicate',
    cost: 0.0023, // $0.0023 per image
    quality: 'High',
    speed: 'Medium',
    features: ['Multiple models', 'Custom training']
  }
};

// Calculate potential savings
export function calculateSavings(currentService: string, newService: string, monthlyImages: number) {
  const current = imageEditingServices[currentService as keyof typeof imageEditingServices];
  const alternative = imageEditingServices[newService as keyof typeof imageEditingServices];
  
  if (!current || !alternative) return null;
  
  const currentCost = current.cost * monthlyImages;
  const newCost = alternative.cost * monthlyImages;
  const savings = currentCost - newCost;
  const percentageSavings = (savings / currentCost) * 100;
  
  return {
    currentCost,
    newCost,
    savings,
    percentageSavings: Math.round(percentageSavings)
  };
}

// Recommended migration strategy
export const migrationStrategy = {
  immediate: [
    'Switch to Stability AI for 80% cost reduction',
    'Use Hugging Face for basic transformations',
    'Keep OpenAI for premium users only'
  ],
  gradual: [
    'A/B test with 20% of traffic',
    'Compare quality metrics',
    'Migrate style by style'
  ],
  hybrid: [
    'Use cheaper services for low/medium quality',
    'Reserve OpenAI for high quality requests',
    'Implement fallback system'
  ]
}; 