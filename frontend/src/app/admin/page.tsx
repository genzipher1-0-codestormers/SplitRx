"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import api from "@/services/api";

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) {
      router.push("/");
    }
  }, [user, loading, router]);

  const verifyAuditLog = async () => {
    setVerifying(true);
    setError("");
    setVerificationResult(null);
    try {
      const response = await api.get("/audit/verify");
      setVerificationResult(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || "Verification failed");
    } finally {
      setVerifying(false);
    }
  };

  if (loading || !user || user.role !== "admin") {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🛡️ Administrator Dashboard
          </h1>
          <p className="text-gray-600">
            Welcome, {user.full_name}. This area is restricted to system
            administrators.
          </p>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Audit Log Integrity
          </h2>
          <p className="text-gray-600 mb-6">
            Verify the cryptographic hash chain of the audit logs to ensure no
            records have been tampered with.
          </p>

          <button
            onClick={verifyAuditLog}
            disabled={verifying}
            className={`w-full sm:w-auto px-6 py-3 border border-transparent text-base font-medium rounded-md text-white 
                        ${verifying ? "bg-indigo-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700"} 
                        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors`}
          >
            {verifying ? "Verifying Chain..." : "Verify Audit Chain Integrity"}
          </button>

          {error && (
            <div className="mt-6 p-4 bg-red-50 border-l-4 border-red-500 rounded text-red-700">
              <strong>Error:</strong> {error}
            </div>
          )}

          {verificationResult && (
            <div
              className={`mt-6 p-6 rounded-lg border-l-4 ${verificationResult.valid ? "bg-green-50 border-green-500" : "bg-red-50 border-red-500"}`}
            >
              <div className="flex items-center mb-2">
                <span className="text-2xl mr-2">
                  {verificationResult.valid ? "✅" : "❌"}
                </span>
                <h3
                  className={`text-lg font-bold ${verificationResult.valid ? "text-green-800" : "text-red-800"}`}
                >
                  {verificationResult.valid
                    ? "Integrity Verified"
                    : "Integrity Check Failed"}
                </h3>
              </div>

              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Total Entries Scanned
                  </dt>
                  <dd className="text-lg font-semibold text-gray-900">
                    {verificationResult.totalEntries}
                  </dd>
                </div>
                {!verificationResult.valid && (
                  <div>
                    <dt className="text-sm font-medium text-red-500">
                      Broken At ID
                    </dt>
                    <dd className="text-lg font-mono text-red-700 break-all">
                      {verificationResult.brokenAt}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
