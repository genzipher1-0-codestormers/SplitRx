
'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function RegisterForm() {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        full_name: '',
        role: 'patient',
        licenseNumber: '' // Only for doctors/pharmacists
    });
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const router = useRouter();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await register(formData);
            toast.success('Registration successful! Please login.');
            router.push('/login');
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Registration failed');
        }
        setLoading(false);
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-900 px-4">
            <div className="bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-md border border-gray-700">
                <h1 className="text-3xl font-bold text-center text-white mb-2">📝 Register</h1>
                <p className="text-center text-gray-400 mb-6">Create your SplitRx account</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-gray-300 mb-1">Full Name</label>
                        <input
                            name="full_name"
                            type="text"
                            value={formData.full_name}
                            onChange={handleChange}
                            required
                            className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white focus:outline-none focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-300 mb-1">Email</label>
                        <input
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white focus:outline-none focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-300 mb-1">Password</label>
                        <input
                            name="password"
                            type="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            minLength={8}
                            className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white focus:outline-none focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-300 mb-1">Role</label>
                        <select
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                            className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white focus:outline-none focus:border-blue-500"
                        >
                            <option value="patient">Patient</option>
                            <option value="doctor">Doctor</option>
                            <option value="pharmacist">Pharmacist</option>
                        </select>
                    </div>
                    {['doctor', 'pharmacist'].includes(formData.role) && (
                        <div>
                            <label className="block text-gray-300 mb-1">License Number</label>
                            <input
                                name="licenseNumber"
                                type="text"
                                value={formData.licenseNumber}
                                onChange={handleChange}
                                required
                                className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white focus:outline-none focus:border-blue-500"
                            />
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition disabled:opacity-50"
                    >
                        {loading ? 'Creating Account...' : 'Register'}
                    </button>
                </form>

                <p className="mt-4 text-center text-gray-400 text-sm">
                    Already have an account? <Link href="/login" className="text-blue-400 hover:underline">Login here</Link>
                </p>
            </div>
        </div>
    );
}
