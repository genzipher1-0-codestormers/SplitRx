'use client';

import { useAuth } from '@/context/AuthContext';
import DoctorDashboard from '@/components/doctor/DoctorDashboard';
import PatientDashboard from '@/components/patient/PatientDashboard';
import PharmacistDashboard from '@/components/pharmacist/PharmacistDashboard';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { LoadingScreen } from '@/components/common/LoadingSpinner';
import { ShieldAlert } from 'lucide-react';

export default function DashboardPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    if (loading) {
        return <LoadingScreen message="Loading dashboard..." />;
    }

    if (!user) {
        return null;
    }

    return (
        <div className="mx-auto max-w-7xl">
            {user.role === 'doctor' && <DoctorDashboard />}
            {user.role === 'patient' && <PatientDashboard />}
            {user.role === 'pharmacist' && <PharmacistDashboard />}

            {/* Fallback for unknown roles */}
            {!['doctor', 'patient', 'pharmacist'].includes(user.role) && (
                <div className="panel p-8 text-center rounded-2xl animate-fade-in">
                    <div className="flex justify-center mb-4">
                        <div className="p-4 rounded-2xl bg-[#2a0f1b] border border-[#5a1c2b]">
                            <ShieldAlert className="w-12 h-12 text-[#dc143c]" />
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold text-[#dc143c] mb-2">Unauthorized Access</h2>
                    <p className="muted">Your role ({user.role}) is not authorized to view this dashboard.</p>
                </div>
            )}
        </div>
    );
}
