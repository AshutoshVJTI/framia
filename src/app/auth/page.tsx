'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Header from '@/components/Header';

export default function AuthPage() {
  const { user, loading, signInWithGoogle } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && user) {
      router.push('/');
    }
  }, [user, loading, router]);

  const handleGoogleSignIn = async () => {
    try {
      setError(null);
      const result = await signInWithGoogle();
      if (result) {
        router.push('/');
      } else {
        // Only show an error if it wasn't a user-cancelled popup
        // The signInWithGoogle function already handles logging
      }
    } catch (err) {
      console.error('Error signing in:', err);
      setError('Failed to sign in. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
          <div className="w-2 h-2 bg-white/70 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
          <div className="w-2 h-2 bg-white/50 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <Header />
      
      <div className="container mx-auto px-6 py-20">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-light mb-4">
              Welcome Back
            </h2>
            <p className="text-zinc-400 font-light">
              Sign in to start transforming your products
            </p>
          </div>
          
          {error && (
            <div className="mb-6 p-3 border border-red-900/50 rounded-lg text-center">
              <div className="text-red-400 text-sm font-light">
                {error}
              </div>
            </div>
          )}
          
          <div className="space-y-4">
            <button
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white text-black rounded font-light hover:bg-zinc-100 transition-colors"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" className="fill-current">
                <path d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.174-6.806 5.174-4.095 0-7.439-3.389-7.439-7.574s3.345-7.574 7.439-7.574c2.33 0 3.891.989 4.785 1.849l3.254-3.138C18.189 1.186 15.479 0 12.24 0c-6.635 0-12 5.365-12 12s5.365 12 12 12c6.926 0 11.52-4.869 11.52-11.726 0-.788-.085-1.39-.189-1.989H12.24z" />
              </svg>
              <span>Continue with Google</span>
            </button>
          </div>
          
          <div className="mt-8 text-center">
            <p className="text-xs text-zinc-500 font-light">
              By signing in, you agree to our{' '}
              <a href="#" className="text-zinc-400 hover:text-white">Terms</a>
              {' '}and{' '}
              <a href="#" className="text-zinc-400 hover:text-white">Privacy Policy</a>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
} 