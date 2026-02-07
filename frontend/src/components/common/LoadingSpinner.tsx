'use client';

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export default function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
    const sizeClasses = {
        sm: 'w-5 h-5 border-2',
        md: 'w-8 h-8 border-3',
        lg: 'w-12 h-12 border-4'
    };

    return (
        <div
            className={`rounded-full animate-spin ${sizeClasses[size]} ${className}`}
            style={{
                borderColor: 'rgba(58, 110, 165, 0.2)',
                borderTopColor: '#3a6ea5',
                borderRightColor: '#2e8b57'
            }}
        />
    );
}

export function LoadingScreen({ message = 'Loading...' }: { message?: string }) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 animate-fade-in">
            <div className="relative">
                <div
                    className="w-16 h-16 rounded-full animate-spin border-4"
                    style={{
                        borderColor: 'rgba(58, 110, 165, 0.15)',
                        borderTopColor: '#3a6ea5',
                        borderRightColor: '#2e8b57'
                    }}
                />
                <div
                    className="absolute inset-2 rounded-full animate-spin border-4"
                    style={{
                        borderColor: 'rgba(46, 139, 87, 0.1)',
                        borderBottomColor: '#2e8b57',
                        animationDirection: 'reverse',
                        animationDuration: '0.8s'
                    }}
                />
            </div>
            <p className="text-white/80 font-medium">{message}</p>
        </div>
    );
}
