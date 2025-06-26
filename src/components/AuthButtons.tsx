import React from 'react';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';
import Link from 'next/link';

const AuthButtons = () => {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return (
      <div className="h-8 w-8 animate-pulse rounded-full bg-gray-200"></div>
    );
  }

  if (user) {
    return (
      <div className="flex items-center gap-3">
        {user.photoURL && (
          <div className="relative h-8 w-8 overflow-hidden rounded-full border border-white/20">
            <Image
              src={user.photoURL}
              alt={user.displayName || 'User'}
              width={32}
              height={32}
              className="h-full w-full object-cover"
            />
          </div>
        )}
        <div className="hidden md:block">
          <p className="text-sm font-medium text-white truncate max-w-[120px]">
            {user.displayName || user.email?.split('@')[0] || 'User'}
          </p>
        </div>
        <button
          onClick={() => logout()}
          className="ml-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white hover:bg-white/20 transition duration-200"
        >
          Logout
        </button>
      </div>
    );
  }

  return (
    <Link 
      href="/auth"
      className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-gray-800 shadow hover:bg-gray-100 transition duration-200"
    >
      <svg viewBox="0 0 24 24" width="16" height="16" className="fill-current">
        <path d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.174-6.806 5.174-4.095 0-7.439-3.389-7.439-7.574s3.345-7.574 7.439-7.574c2.33 0 3.891.989 4.785 1.849l3.254-3.138C18.189 1.186 15.479 0 12.24 0c-6.635 0-12 5.365-12 12s5.365 12 12 12c6.926 0 11.52-4.869 11.52-11.726 0-.788-.085-1.39-.189-1.989H12.24z" />
      </svg>
      Sign in
    </Link>
  );
};

export default AuthButtons; 