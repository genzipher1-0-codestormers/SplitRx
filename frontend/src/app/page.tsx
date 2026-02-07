
'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    }
  }, [user, loading, router]);

  return (
    <div className="flex items-center justify-center min-h-[70vh] text-white">
      <div className="panel px-10 py-8 text-center">
        <h1 className="text-4xl font-bold mb-3">🔐 SplitRx</h1>
        <p className="text-lg muted">Redirecting...</p>
      </div>
    </div>
  );
}
