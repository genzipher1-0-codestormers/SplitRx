
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
        <div className="flex items-center justify-center min-h-screen bg-gray-900 px-4">
            <div className="bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-md border border-gray-700">
                <h1 className="text-3xl font-bold text-center text-white mb-2">🔐 SplitRx Login</h1>
                <p className="text-center text-gray-400 mb-6">Tamper-Proof Prescription System</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-gray-300 mb-1">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoComplete="email"
                            className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white focus:outline-none focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-300 mb-1">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={8}
                            autoComplete="current-password"
                            className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white focus:outline-none focus:border-blue-500"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition disabled:opacity-50"
                    >
                        {loading ? 'Authenticating...' : 'Login'}
                    </button>
                </form>

                <p className="mt-4 text-center text-gray-400 text-sm">
                    No account? <Link href="/register" className="text-blue-400 hover:underline">Register here</Link>
                </p>
            </div>
        </div>
    );
}
