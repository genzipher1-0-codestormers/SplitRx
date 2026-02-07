
import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

const api: AxiosInstance = axios.create({
    baseURL: API_BASE,
    timeout: 10000,
    headers: { 'Content-Type': 'application/json' }
});

// Attach token to every request
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

// Handle 401 (token expired) and step-up auth
api.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error: any) => {
        if (typeof window !== 'undefined') {
            const originalRequest = error.config;

            // Allow 401 on auth endpoints to be handled by the component
            if (originalRequest.url?.includes('/auth/login') ||
                originalRequest.url?.includes('/auth/register')) {
                return Promise.reject(error);
            }

            if (error.response?.status === 401) {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('user');
                window.location.href = '/login';
            }

            // Handle step-up auth requirement (Scenario #5)
            if (error.response?.data?.code === 'STEP_UP_REQUIRED') {
                // Redirect to re-authentication
                // In a real app, this might show a modal or go to a specific verify page
                window.location.href = '/verify-identity';
            }
        }

        return Promise.reject(error);
    }

);

// Auth endpoints
export const authAPI = {
    register: (data: any) => api.post('/auth/register', data),
    login: (data: any) => api.post('/auth/login', data),
    logout: () => api.post('/auth/logout')
};

// Prescription endpoints
export const prescriptionAPI = {
    create: (data: any) => api.post('/prescriptions', data),
    getMyPrescriptions: () => api.get('/prescriptions/my'),
    getQRCode: (id: string) => api.get(`/prescriptions/${id}/qr`)
};

// Dispensing endpoints (pharmacist)
export const dispensingAPI = {
    verify: (id: string) => api.get(`/dispensing/verify/${id}`),
    dispense: (id: string) => api.post(`/dispensing/dispense/${id}`)
};

// Consent endpoints
export const consentAPI = {
    grant: (data: any) => api.post('/consent', data),
    getMyConsents: () => api.get('/consent/my'),
    revoke: (id: string) => api.delete(`/consent/${id}`),
    eraseAllData: () => api.delete('/consent/erasure/all')
};

// Audit endpoints
export const auditAPI = {
    getMyAuditTrail: () => api.get('/audit/my-logs'),
    getPrescriptionAudit: (id: string) => api.get(`/audit/resource/${id}`),
    verifyIntegrity: () => api.get('/audit/verify')
};

export default api;
