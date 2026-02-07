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
        } else if (!loading && user && user.role === 'admin') {
            router.push('/admin');
        }
    }, [user, loading, router]);

    if (loading) {
        return <LoadingScreen message="Loading dashboard..." />;
    }

    if (!user) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            <div className="container mx-auto max-w-7xl py-6">
                {user.role === 'doctor' && <DoctorDashboard />}
                {user.role === 'patient' && <PatientDashboard />}
                {user.role === 'pharmacist' && <PharmacistDashboard />}

                {/* Fallback for unknown roles */}
                {!['doctor', 'patient', 'pharmacist', 'admin'].includes(user.role) && (
                    <div className="p-6 text-center">
                        <h2 className="text-2xl font-bold text-red-500">Unauthorized Access</h2>
                        <p className="text-gray-400">Your role ({user.role}) is not authorized to view this dashboard.</p>
                    </div>
                    <h2 className="text-2xl font-bold text-[#dc143c] mb-2">Unauthorized Access</h2>
                    <p className="muted">Your role ({user.role}) is not authorized to view this dashboard.</p>
                </div>
            )}
        </div>
    );
}
