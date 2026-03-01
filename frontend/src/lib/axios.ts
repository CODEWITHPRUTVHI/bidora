import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://bidora-api-production.up.railway.app/api/v1';

const api = axios.create({
    baseURL: API_URL,
    withCredentials: true,  // Send httpOnly cookies (refresh token)
    headers: { 'Content-Type': 'application/json' }
});

// ── Request Interceptor: Attach access token
api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        if (token) config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// ── Response Interceptor: Auto-refresh on 401
let isRefreshing = false;
let failedQueue: Array<{ resolve: (v: any) => void; reject: (e: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach(prom => {
        if (error) prom.reject(error);
        else prom.resolve(token);
    });
    failedQueue = [];
};

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const original = error.config;

        // Do not intercept 401s if the user is actively trying to log in or register
        const isAuthRequest = original.url?.includes('/auth/login') || original.url?.includes('/auth/register');

        if (error.response?.status === 401 && !original._retry && !isAuthRequest) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then(token => {
                    original.headers['Authorization'] = `Bearer ${token}`;
                    return api(original);
                });
            }
            original._retry = true;
            isRefreshing = true;

            try {
                const { data } = await axios.post(
                    `${API_URL}/auth/refresh`,
                    {},
                    { withCredentials: true }
                );
                const newToken = data.accessToken;
                localStorage.setItem('token', newToken);
                processQueue(null, newToken);
                original.headers['Authorization'] = `Bearer ${newToken}`;
                return api(original);
            } catch (refreshError: any) {
                processQueue(refreshError, null);
                const status = refreshError?.response?.status;
                if (status === 401 || status === 403) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('bidora_user');
                }
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }
        return Promise.reject(error);
    }
);

export default api;
