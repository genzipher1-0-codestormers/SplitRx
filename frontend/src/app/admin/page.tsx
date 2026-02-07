'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/services/api';
import toast from 'react-hot-toast';

// --- Database Viewer Component ---
function DatabaseViewer() {
    const [tables, setTables] = useState<string[]>([]);
    const [selectedTable, setSelectedTable] = useState<string | null>(null);
    const [tableData, setTableData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchTables();
    }, []);

    const fetchTables = async () => {
        try {
            const response = await api.get('/admin/tables');
            setTables(response.data.tables);
        } catch (err) {
            setError('Failed to load tables');
        }
    };

    const fetchTableData = async (tableName: string) => {
        setLoading(true);
        setError('');
        setTableData(null);
        setSelectedTable(tableName);
        try {
            const response = await api.get(`/admin/tables/${tableName}`);
            setTableData(response.data);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to load table data');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Sidebar: Table List */}
                <div className="md:col-span-1 bg-white shadow rounded-lg p-4 h-fit">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Tables</h3>
                    <div className="space-y-2">
                        {tables.map(table => (
                            <button
                                key={table}
                                onClick={() => fetchTableData(table)}
                                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${selectedTable === table
                                    ? 'bg-indigo-100 text-indigo-700 font-medium'
                                    : 'hover:bg-gray-100 text-gray-600'
                                    }`}
                            >
                                {table}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Content: Data View */}
                <div className="md:col-span-3 bg-white shadow rounded-lg p-6 overflow-hidden">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                        </div>
                    ) : error ? (
                        <div className="text-red-500 bg-red-50 p-4 rounded-md border border-red-200">
                            {error}
                        </div>
                    ) : tableData ? (
                        <div className="overflow-x-auto">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-bold text-gray-800">
                                    Table: <span className="font-mono text-indigo-600">{tableData.tableName}</span>
                                </h3>
                                <span className="text-sm text-gray-500">
                                    {tableData.rowCount} rows (limited to 100)
                                </span>
                            </div>

                            {tableData.rows.length === 0 ? (
                                <div className="text-center py-8 text-gray-400 italic">No data found in this table.</div>
                            ) : (
                                <table className="min-w-full divide-y divide-gray-200 border">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            {tableData.columns.map((col: string) => (
                                                <th key={col} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                                    {col}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {tableData.rows.map((row: any, i: number) => (
                                            <tr key={i} className="hover:bg-gray-50">
                                                {tableData.columns.map((col: string) => (
                                                    <td key={col} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {row[col] === null ? (
                                                            <span className="text-gray-300 italic">NULL</span>
                                                        ) : typeof row[col] === 'boolean' ? (
                                                            row[col] ? '✅' : '❌'
                                                        ) : typeof row[col] === 'object' ? (
                                                            <pre className="text-xs">{JSON.stringify(row[col], null, 2)}</pre>
                                                        ) : (
                                                            String(row[col])
                                                        )}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-gray-400">
                            Select a table from the list to view its data.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// --- User Management Component ---

function UserManagement() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [resettingId, setResettingId] = useState<string | null>(null);
    const [newPassword, setNewPassword] = useState('');
    const [showResetModal, setShowResetModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await api.get('/admin/users');
            setUsers(response.data.users);
        } catch (err) {
            setError('Failed to load users');
            toast.error('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const handleResetClick = (user: any) => {
        setSelectedUser(user);
        setNewPassword('');
        setShowPassword(false);
        setShowResetModal(true);
    };

    const handleResetSubmit = async () => {
        if (!selectedUser || !newPassword) return;

        if (newPassword.length < 8) {
            toast.error('Password must be at least 8 characters long');
            return;
        }

        setResettingId(selectedUser.id);
        try {
            await api.post(`/admin/users/${selectedUser.id}/reset-password`, {
                newPassword
            });
            toast.success(`Password for ${selectedUser.full_name} has been reset successfully.`);
            setShowResetModal(false);
            setNewPassword('');
            setSelectedUser(null);
        } catch (err: any) {
            console.error('Reset password error:', err);
            toast.error(err.response?.data?.error || 'Failed to reset password');
        } finally {
            setResettingId(null);
        }
    };

    return (
        <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">User Management</h2>

            {loading ? (
                <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
            ) : error ? (
                <div className="text-red-500 bg-red-50 p-4 rounded-md">{error}</div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {users.map(user => (
                                <tr key={user.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{user.full_name}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-500">{user.email}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                            ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                                                user.role === 'doctor' ? 'bg-blue-100 text-blue-800' :
                                                    user.role === 'pharmacist' ? 'bg-green-100 text-green-800' :
                                                        'bg-gray-100 text-gray-800'}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                            ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {user.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => handleResetClick(user)}
                                            className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 px-3 py-1 rounded-md"
                                        >
                                            Reset Password
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Premium Reset Password Modal */}
            {showResetModal && selectedUser && (
                <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                    <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                        {/* Backdrop with heavy blur */}
                        <div
                            className="fixed inset-0 bg-gray-900/60 backdrop-blur-md transition-opacity duration-300 ease-out"
                            onClick={() => setShowResetModal(false)}
                            aria-hidden="true"
                        ></div>

                        {/* Centering hack */}
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                        {/* Modal Panel */}
                        <div className="inline-block align-middle bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:max-w-md sm:w-full ring-1 ring-black/5 relative">

                            {/* Decorative top pattern/gradient */}
                            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>

                            {/* Close button */}
                            <button
                                onClick={() => setShowResetModal(false)}
                                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>

                            <div className="px-8 pt-10 pb-8">
                                <div className="text-center">
                                    {/* Icon Container with soft shadow and gradient bg */}
                                    <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-2xl bg-indigo-50 text-indigo-600 mb-6 shadow-sm ring-4 ring-indigo-50/50">
                                        <svg className="h-8 w-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                        </svg>
                                    </div>

                                    <h3 className="text-2xl font-bold text-gray-900 tracking-tight mb-2" id="modal-title">
                                        Reset Password
                                    </h3>
                                    <p className="text-sm text-gray-500">
                                        Update the password for <span className="font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{selectedUser.full_name}</span>.
                                    </p>
                                </div>

                                <div className="mt-8 space-y-6">
                                    <div>
                                        <label htmlFor="new-password" className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">New Secure Password</label>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <svg className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                                </svg>
                                            </div>
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                name="new-password"
                                                id="new-password"
                                                className="block w-full pl-10 pr-12 py-3 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm text-sm sm:text-base bg-gray-50 focus:bg-white"
                                                placeholder="Enter at least 8 characters"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                autoComplete="off"
                                            />
                                            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                                <button
                                                    type="button"
                                                    className="text-gray-400 hover:text-gray-600 focus:outline-none transition-colors p-1"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                >
                                                    {showPassword ? (
                                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                                                    ) : (
                                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                        <p className="mt-2 text-xs text-gray-400 flex items-center">
                                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                            User will need to change this on next login.
                                        </p>
                                    </div>

                                    <div className="flex flex-col-reverse sm:flex-row sm:space-x-3 space-y-3 space-y-reverse sm:space-y-0 mt-8">
                                        <button
                                            type="button"
                                            className="w-full inline-flex justify-center items-center px-4 py-3 border border-gray-300 shadow-sm text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
                                            onClick={() => setShowResetModal(false)}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="button"
                                            className={`w-full inline-flex justify-center items-center px-4 py-3 border border-transparent text-sm font-semibold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-lg shadow-indigo-500/30 transition-all duration-200 ${(!newPassword || resettingId) ? 'opacity-60 cursor-not-allowed' : 'hover:-translate-y-0.5'}`}
                                            onClick={handleResetSubmit}
                                            disabled={!newPassword || !!resettingId}
                                        >
                                            {resettingId ? (
                                                <>
                                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    Updating...
                                                </>
                                            ) : 'Reset Password'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

>>>>>>> af2692a3ac99a705210ef337b83ae15aedbe767b
// --- Main Admin Dashboard ---
export default function AdminDashboard() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'audit' | 'db' | 'users'>('audit');

    // Audit State
    const [verificationResult, setVerificationResult] = useState<any>(null);
    const [verifying, setVerifying] = useState(false);
    const [auditError, setAuditError] = useState('');

    useEffect(() => {
        if (!loading && (!user || user.role !== 'admin')) {
            router.push('/');
        }
    }, [user, loading, router]);

    const verifyAuditLog = async () => {
        setVerifying(true);
        setAuditError('');
        setVerificationResult(null);
        try {
            const response = await api.get('/audit/verify');
            setVerificationResult(response.data);
        } catch (err: any) {
            setAuditError(err.response?.data?.error || 'Verification failed');
        } finally {
            setVerifying(false);
        }
    };

    if (loading || !user || user.role !== 'admin') {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="bg-white shadow rounded-lg p-6 mb-8">
                    <div className="flex justify-between items-center mb-2">
                        <h1 className="text-3xl font-bold text-gray-900">
                            🛡️ Administrator Dashboard
                        </h1>
                        <div className="text-sm text-gray-500">
                            {user.email} (Admin)
                        </div>
                    </div>
                    <p className="text-gray-600">
                        Welcome, {user.full_name}. This area is restricted to system administrators.
                    </p>

                    {/* Tabs */}
                    <div className="mt-6 border-b border-gray-200">
                        <nav className="-mb-px flex space-x-8">
                            <button
                                onClick={() => setActiveTab('audit')}
                                className={`${activeTab === 'audit'
                                    ? 'border-indigo-500 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                            >
                                Audit Log Integrity
                            </button>
                            <button
                                onClick={() => setActiveTab('db')}
                                className={`${activeTab === 'db'
                                    ? 'border-indigo-500 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                            >
                                Database Viewer
                            </button>
                            <button
                                onClick={() => setActiveTab('users')}
                                className={`${activeTab === 'users'
                                    ? 'border-indigo-500 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                            >
                                User Management
                            </button>
                        </nav>
                    </div>
                </div>

                {/* Tab Content */}
                {activeTab === 'audit' ? (
                    <div className="bg-white shadow rounded-lg p-6">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">
                            Audit Log Integrity
                        </h2>
                        <p className="text-gray-600 mb-6">
                            Verify the cryptographic hash chain of the audit logs to ensure no records have been tampered with.
                        </p>

                        <button
                            onClick={verifyAuditLog}
                            disabled={verifying}
                            className={`w-full sm:w-auto px-6 py-3 border border-transparent text-base font-medium rounded-md text-white 
                            ${verifying ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'} 
                            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors`}
                        >
                            {verifying ? 'Verifying Chain...' : 'Verify Audit Chain Integrity'}
                        </button>

                        {auditError && (
                            <div className="mt-6 p-4 bg-red-50 border-l-4 border-red-500 rounded text-red-700">
                                <strong>Error:</strong> {auditError}
                            </div>
                        )}

                        {verificationResult && (
                            <div className={`mt-6 p-6 rounded-lg border-l-4 ${verificationResult.valid ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'}`}>
                                <div className="flex items-center mb-2">
                                    <span className="text-2xl mr-2">{verificationResult.valid ? '✅' : '❌'}</span>
                                    <h3 className={`text-lg font-bold ${verificationResult.valid ? 'text-green-800' : 'text-red-800'}`}>
                                        {verificationResult.valid ? 'Integrity Verified' : 'Integrity Check Failed'}
                                    </h3>
                                </div>

                                <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Total Entries Scanned</dt>
                                        <dd className="text-lg font-semibold text-gray-900">{verificationResult.totalEntries}</dd>
                                    </div>
                                    {!verificationResult.valid && (
                                        <div>
                                            <dt className="text-sm font-medium text-red-500">Broken At ID</dt>
                                            <dd className="text-lg font-mono text-red-700 break-all">{verificationResult.brokenAt}</dd>
                                        </div>
                                    )}
                                </dl>
                            </div>
                        )}
                    </div>
                ) : activeTab === 'db' ? (
                    <DatabaseViewer />
                ) : (
                    <UserManagement />
                )}
            </div>
        </div>
    );
}
