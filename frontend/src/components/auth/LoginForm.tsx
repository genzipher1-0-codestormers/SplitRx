
'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Link from 'next/link';

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
                toast('⚠️ Unusual login detected. Additional verification may be required.', {
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
        <div className="flex items-center justify-center min-h-[70vh] px-4">
            <div className="panel w-full max-w-md p-8 rounded-2xl">
                <h1 className="text-3xl font-bold text-center text-white mb-2">🔐 SplitRx Login</h1>
                <p className="text-center muted mb-6">Tamper-Proof Prescription System</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm muted mb-1">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoComplete="email"
                            className="input"
                        />
                    </div>
                    <div>
                        <label className="block text-sm muted mb-1">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={8}
                            autoComplete="current-password"
                            className="input"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full btn-primary font-bold py-2 px-4 rounded-xl transition disabled:opacity-50"
                    >
                        {loading ? 'Authenticating...' : 'Login'}
                    </button>
                </form>

                <p className="mt-4 text-center text-sm muted">
                    No account? <Link href="/register" className="text-[#e0ffff] hover:underline">Register here</Link>
                </p>
            </div>
        </div>
    );
}
