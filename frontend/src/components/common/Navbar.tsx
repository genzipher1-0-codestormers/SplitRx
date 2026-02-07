
'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function Navbar() {
    const { user, logout } = useAuth();
    const router = useRouter();

    const handleLogout = async () => {
        await logout();
        router.push('/login');
    };

    const roleIcons: Record<string, string> = {
        doctor: '👨‍⚕️',
        patient: '🏥',
        pharmacist: '💊',
        admin: '🛡️'
    };

    return (
        <nav className="sticky top-0 z-40 border-b border-[#1c3c63] bg-[#071a33]/85 backdrop-blur">
            <div className="mx-auto flex items-center justify-between px-6 py-4 max-w-7xl">
                <div className="text-xl font-bold cursor-pointer flex items-center gap-2" onClick={() => router.push('/')}>
                    🔐 SplitRx
                </div>
                {user && (
                    <div className="flex items-center gap-3">
                        <span className="flex items-center gap-2 text-sm">
                            {roleIcons[user.role] || '👤'} <span className="font-medium">{user.fullName}</span>
                            <span className="text-[11px] border border-[#2b4f7a] bg-[#102f55] px-2 py-1 rounded-full uppercase">
                                {user.role}
                            </span>
                        </span>
                        <button
                            onClick={handleLogout}
                            className="btn-danger px-3 py-1 rounded transition-colors"
                        >
                            Logout
                        </button>
                    </div>
                )}
            </div>
        </nav>
    );
}
