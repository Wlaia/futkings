import axios from 'axios';

export const getBaseUrl = () => {
    // Priority 1: Explicit environment variable
    if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;

    // Priority 2: Use host from environment (legacy support)
    if (import.meta.env.VITE_API_HOST) return `https://${import.meta.env.VITE_API_HOST}/api`;

    // Priority 3: Auto-detect Render production environment
    const hostname = window.location.hostname;
    const isLocal = hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.') || hostname.startsWith('10.');

    if (!isLocal) {
        // Fallback to the production API URL
        return 'https://futkings-api.onrender.com/api';
    }

    // Default for local development
    return `http://${hostname}:3000/api`;
};

const api = axios.create({
    baseURL: getBaseUrl(),
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
});

export default api;
