'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/services/api';

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

// --- Main Admin Dashboard ---
export default function AdminDashboard() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'audit' | 'db'>('audit');

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
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        🛡️ Administrator Dashboard
                    </h1>
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
                ) : (
                    <DatabaseViewer />
                )}
            </div>
        </div>
    );
}

