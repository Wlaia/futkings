import { getBaseUrl } from '../services/api';

export const getLogoUrl = (url?: string) => {
    if (!url) return undefined;

    const apiBaseUrl = getBaseUrl();
    const apiOrigin = apiBaseUrl.replace(/\/api\/?$/, '');

    // Handle relative paths (e.g., /uploads/...)
    if (url.startsWith('/')) {
        return `${apiOrigin}${url}`;
    }

    // Check if running in production (not localhost)
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    // If we are in production, and the URL points to localhost, we need to fix it.
    if (!isLocalhost && url.includes('localhost')) {
        try {
            const urlObj = new URL(url);
            const path = urlObj.pathname;
            return `${apiOrigin}${path}`;
        } catch (e) {
            console.error("Error parsing logo URL:", e);
            return url;
        }
    }

    // Ensure cross-protocol compatibility if possible, or just return as is if it's already a full URL
    return url;
};

