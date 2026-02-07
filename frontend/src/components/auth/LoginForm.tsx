'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { Shield, Mail, Lock, ArrowRight } from 'lucide-react';
import LoadingSpinner from '@/components/common/LoadingSpinner';

export default function LoginForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { riskScore, requiresStepUp } = await login(email, password);

            if (requiresStepUp) {
                toast('Unusual login detected. Additional verification may be required.', {
                    icon: '🔒',
                    duration: 5000
                });
            }

            if (riskScore > 30) {
                toast(`Risk Score: ${riskScore}/100 — Session under enhanced monitoring`, {
                    icon: '🛡️'
                });
            }

            toast.success('Login successful!');
            router.push('/dashboard');
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Login failed');
        }
        setLoading(false);
    };

    return (
        <div className="flex items-center justify-center min-h-[75vh] px-4 animate-fade-in-up">
            <div className="panel w-full max-w-md p-8 rounded-2xl">
                {/* Header */}
                <div className="flex flex-col items-center mb-8">
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-[#3a6ea5]/20 to-[#2e8b57]/20 border border-[#3a6ea5]/30 mb-4 animate-float">
                        <Shield className="w-10 h-10 text-[#3a6ea5]" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-1">Welcome Back</h1>
                    <p className="text-center muted">Sign in to SplitRx Prescription System</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm muted mb-2 font-medium">Email Address</label>
                            <div className="input-with-icon">
                                <Mail className="input-icon w-5 h-5" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    autoComplete="email"
                                    className="input"
                                    placeholder="you@example.com"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm muted mb-2 font-medium">Password</label>
                            <div className="input-with-icon">
                                <Lock className="input-icon w-5 h-5" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={8}
                                    autoComplete="current-password"
                                    className="input"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full btn btn-primary font-bold py-3 px-4 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <LoadingSpinner size="sm" />
                                Authenticating...
                            </span>
                        ) : (
                            <span className="flex items-center justify-center gap-2">
                                Sign In
                                <ArrowRight className="w-5 h-5" />
                            </span>
                        )}
                    </button>
                </form>

                {/* Divider */}
                <div className="divider" />

                {/* Footer */}
                <p className="text-center text-sm muted">
                    Don't have an account?{' '}
                    <Link href="/register" className="text-[#3a6ea5] hover:text-[#e0ffff] font-medium transition-colors">
                        Create Account
                    </Link>
                </p>
            </div>
        </div>
    );
}
