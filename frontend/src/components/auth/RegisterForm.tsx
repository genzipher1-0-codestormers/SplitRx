'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { UserPlus, User, Mail, Lock, Badge, FileText, ArrowRight, Stethoscope, Building2, Pill } from 'lucide-react';
import LoadingSpinner from '@/components/common/LoadingSpinner';

export default function RegisterForm() {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        full_name: '',
        role: 'patient',
        licenseNumber: ''
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

    const roleOptions = [
        { value: 'patient', label: 'Patient', icon: <Building2 className="w-5 h-5" />, description: 'Access your prescriptions' },
        { value: 'doctor', label: 'Doctor', icon: <Stethoscope className="w-5 h-5" />, description: 'Write prescriptions' },
        { value: 'pharmacist', label: 'Pharmacist', icon: <Pill className="w-5 h-5" />, description: 'Verify & dispense' }
    ];

    return (
        <div className="flex items-center justify-center min-h-[85vh] px-4 py-8 animate-fade-in-up">
            <div className="panel w-full max-w-lg p-8 rounded-2xl">
                {/* Header */}
                <div className="flex flex-col items-center mb-8">
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-[#3a6ea5]/20 to-[#2e8b57]/20 border border-[#3a6ea5]/30 mb-4 animate-float">
                        <UserPlus className="w-10 h-10 text-[#2e8b57]" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-1">Create Account</h1>
                    <p className="text-center muted">Join SplitRx Prescription System</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Name & Email */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm muted mb-2 font-medium">Full Name</label>
                            <div className="input-with-icon">
                                <User className="input-icon w-5 h-5" />
                                <input
                                    name="full_name"
                                    type="text"
                                    value={formData.full_name}
                                    onChange={handleChange}
                                    required
                                    className="input"
                                    placeholder="John Doe"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm muted mb-2 font-medium">Email Address</label>
                            <div className="input-with-icon">
                                <Mail className="input-icon w-5 h-5" />
                                <input
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    className="input"
                                    placeholder="you@example.com"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-sm muted mb-2 font-medium">Password</label>
                        <div className="input-with-icon">
                            <Lock className="input-icon w-5 h-5" />
                            <input
                                name="password"
                                type="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                minLength={8}
                                className="input"
                                placeholder="Min. 8 characters"
                            />
                        </div>
                    </div>

                    {/* Role Selection */}
                    <div>
                        <label className="block text-sm muted mb-3 font-medium">Select Your Role</label>
                        <div className="grid grid-cols-3 gap-3">
                            {roleOptions.map((role) => (
                                <button
                                    key={role.value}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, role: role.value })}
                                    className={`p-4 rounded-xl border transition-all duration-300 text-center ${formData.role === role.value
                                            ? 'bg-gradient-to-br from-[#3a6ea5]/30 to-[#2e8b57]/30 border-[#3a6ea5] shadow-lg shadow-[#3a6ea5]/20'
                                            : 'bg-[#0b1d38]/60 border-[#1c3c63] hover:border-[#3a6ea5]/50'
                                        }`}
                                >
                                    <div className={`flex justify-center mb-2 ${formData.role === role.value ? 'text-[#3a6ea5]' : 'text-[#708090]'}`}>
                                        {role.icon}
                                    </div>
                                    <p className={`text-sm font-semibold ${formData.role === role.value ? 'text-white' : 'text-[#e0ffff]/80'}`}>
                                        {role.label}
                                    </p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* License Number (conditional) */}
                    {['doctor', 'pharmacist'].includes(formData.role) && (
                        <div className="animate-fade-in">
                            <label className="block text-sm muted mb-2 font-medium">
                                <span className="flex items-center gap-2">
                                    <Badge className="w-4 h-4" />
                                    License Number
                                </span>
                            </label>
                            <div className="input-with-icon">
                                <FileText className="input-icon w-5 h-5" />
                                <input
                                    name="licenseNumber"
                                    type="text"
                                    value={formData.licenseNumber}
                                    onChange={handleChange}
                                    required
                                    className="input"
                                    placeholder="Enter your professional license"
                                />
                            </div>
                            <p className="text-xs muted mt-2">
                                Required for verification of healthcare professionals
                            </p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full btn btn-primary font-bold py-3 px-4 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <LoadingSpinner size="sm" />
                                Creating Account...
                            </span>
                        ) : (
                            <span className="flex items-center justify-center gap-2">
                                Create Account
                                <ArrowRight className="w-5 h-5" />
                            </span>
                        )}
                    </button>
                </form>

                {/* Divider */}
                <div className="divider" />

                {/* Footer */}
                <p className="text-center text-sm muted">
                    Already have an account?{' '}
                    <Link href="/login" className="text-[#3a6ea5] hover:text-[#e0ffff] font-medium transition-colors">
                        Sign In
                    </Link>
                </p>
            </div>
        </div>
    );
}
