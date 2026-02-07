'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Shield } from 'lucide-react';
import LoadingSpinner from '@/components/common/LoadingSpinner';

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
    <div className="flex items-center justify-center min-h-[70vh] text-white animate-fade-in">
      <div className="panel px-12 py-10 text-center rounded-2xl">
        <div className="flex justify-center mb-6">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-[#3a6ea5]/20 to-[#2e8b57]/20 border border-[#3a6ea5]/30 animate-glow">
            <Shield className="w-12 h-12 text-[#3a6ea5]" />
          </div>
        </div>
        <h1 className="text-4xl font-bold mb-3">
          Split<span className="text-gradient">Rx</span>
        </h1>
        <p className="text-lg muted mb-6">Tamper-Proof Prescription System</p>
        <div className="flex justify-center">
          <LoadingSpinner size="md" />
        </div>
        <p className="text-sm muted mt-4">Redirecting...</p>
      </div>
    </div>
  );
}
