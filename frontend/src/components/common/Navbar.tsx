'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Shield, LogOut, User, Stethoscope, Building2, Pill, ShieldCheck } from 'lucide-react';

export default function Navbar() {
    const { user, logout } = useAuth();
    const router = useRouter();

    const handleLogout = async () => {
        await logout();
        router.push('/login');
    };

    const roleConfig: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
        doctor: {
            icon: <Stethoscope className="w-4 h-4" />,
            label: 'Doctor',
            color: 'text-emerald-400'
        },
        patient: {
            icon: <Building2 className="w-4 h-4" />,
            label: 'Patient',
            color: 'text-cyan-400'
        },
        pharmacist: {
            icon: <Pill className="w-4 h-4" />,
            label: 'Pharmacist',
            color: 'text-blue-400'
        },
        admin: {
            icon: <ShieldCheck className="w-4 h-4" />,
            label: 'Admin',
            color: 'text-amber-400'
        }
    };

    const currentRole = user?.role ? roleConfig[user.role] : null;

    return (
        <nav className="sticky top-0 z-40 border-b border-[#1c3c63] bg-[#071a33]/90 backdrop-blur-xl">
            <div className="mx-auto flex items-center justify-between px-6 py-4 max-w-7xl">
                {/* Logo */}
                <div
                    className="flex items-center gap-3 cursor-pointer group"
                    onClick={() => router.push('/')}
                >
                    <div className="p-2 rounded-xl bg-gradient-to-br from-[#3a6ea5]/20 to-[#2e8b57]/20 border border-[#3a6ea5]/30 group-hover:border-[#3a6ea5]/50 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-[#3a6ea5]/20">
                        <Shield className="w-5 h-5 text-[#3a6ea5]" />
                    </div>
                    <span className="text-xl font-bold text-white tracking-tight">
                        Split<span className="text-gradient">Rx</span>
                    </span>
                </div>

                {/* User Info */}
                {user && (
                    <div className="flex items-center gap-4">
                        {/* User Badge */}
                        <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-[#0b1d38]/80 border border-[#1c3c63]">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-lg bg-[#102f55]">
                                    <User className="w-4 h-4 text-[#e0ffff]" />
                                </div>
                                <span className="font-medium text-white text-sm">
                                    {user.fullName}
                                </span>
                            </div>

                            {currentRole && (
                                <span className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-[#102f55] border border-[#2b4f7a] ${currentRole.color}`}>
                                    {currentRole.icon}
                                    {currentRole.label}
                                </span>
                            )}
                        </div>

                        {/* Logout Button */}
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 btn-danger px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 hover:scale-105"
                        >
                            <LogOut className="w-4 h-4" />
                            <span className="hidden sm:inline">Logout</span>
                        </button>
                    </div>
                )}
            </div>
        </nav>
    );
}
