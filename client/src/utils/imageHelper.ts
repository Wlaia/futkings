import { getBaseUrl } from '../services/api';

export const getLogoUrl = (url?: string) => {
    if (!url) return undefined;

    const apiBaseUrl = getBaseUrl();
    const apiOrigin = apiBaseUrl.replace(/\/api\/?$/, '');

    // Handle relative paths (e.g., /uploads/...)
    if (url.startsWith('/')) {
        return `${apiOrigin}${url}`;
    }

    // Aggressive fix: If the URL contains localhost, 127.0.0.1, or an IP that doesn't match production
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const isProductionUrl = url.includes('render.com');

    // If we are in production but the URL points to a local or IP address, fix it
    if (!isLocalhost && !isProductionUrl && (url.includes('localhost') || url.match(/\d+\.\d+\.\d+\.\d+/))) {
        try {
            const urlObj = new URL(url);
            return `${apiOrigin}${urlObj.pathname}`;
        } catch (e) {
            // Fallback for malformed URLs that still contain keywords
            const pathMatch = url.match(/(\/uploads\/.*)/);
            if (pathMatch) return `${apiOrigin}${pathMatch[1]}`;
        }
    }

    return url;
};

