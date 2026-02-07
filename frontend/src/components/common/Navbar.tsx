
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
        <nav className="flex items-center justify-between p-4 bg-gray-800 text-white shadow-md">
            <div className="text-xl font-bold cursor-pointer flex items-center gap-2" onClick={() => router.push('/')}>
                🔐 SplitRx
            </div>
            {user && (
                <div className="flex items-center gap-4">
                    <span className="flex items-center gap-2">
                        {roleIcons[user.role] || '👤'} <span className="font-medium">{user.fullName}</span>
                        <span className="text-xs bg-gray-700 px-2 py-1 rounded-full uppercase">{user.role}</span>
                    </span>
                    <button
                        onClick={handleLogout}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded transition-colors"
                    >
                        Logout
                    </button>
                </div>
            )}
        </nav>
    );
}
