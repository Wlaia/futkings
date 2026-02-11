export const getLogoUrl = (url?: string) => {
    if (!url) return undefined;

    const apiUrl = import.meta.env.VITE_API_URL;
    const apiHost = import.meta.env.VITE_API_HOST;
    const apiOrigin = apiUrl ? apiUrl.replace(/\/api\/?$/, '') : (apiHost ? `https://${apiHost}` : '');

    // Handle relative paths (e.g., /uploads/...)
    if (url.startsWith('/')) {
        if (apiOrigin) return `${apiOrigin}${url}`;
        // Fallback to current host if no API info
        return `${window.location.protocol}//${window.location.hostname}:3000${url}`;
    }

    // Check if running in production (not localhost)
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    // If we are in production, and the URL points to localhost, we need to fix it.
    if (!isLocalhost && url.includes('localhost')) {
        try {
            const urlObj = new URL(url);
            const path = urlObj.pathname;
            if (apiOrigin) return `${apiOrigin}${path}`;
            return `${window.location.protocol}//${window.location.host}${path}`;
        } catch (e) {
            console.error("Error parsing logo URL:", e);
            return url;
        }
    }

    return url;
};
