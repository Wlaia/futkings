export const getLogoUrl = (url?: string) => {
    if (!url) return undefined;

    // Check if running in production (not localhost)
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    // If we are in production, and the URL points to localhost, we need to fix it.
    if (!isLocalhost && url.includes('localhost')) {
        try {
            // Parse existing URL to get the path
            const urlObj = new URL(url);
            const path = urlObj.pathname; // e.g. /uploads/logo.png

            // Construct new URL using current API base
            // Ideally use VITE_API_URL, or current origin if API is on same domain
            const apiUrl = import.meta.env.VITE_API_URL;
            const apiHost = import.meta.env.VITE_API_HOST;

            if (apiUrl) {
                // Remove '/api' from the end of apiUrl if present, since uploads are usually at root
                const apiOrigin = apiUrl.replace(/\/api\/?$/, '');
                return `${apiOrigin}${path}`;
            } else if (apiHost) {
                return `https://${apiHost}${path}`;
            } else {
                // Fallback: Assume API is at the same origin
                return `${window.location.protocol}//${window.location.host}${path}`;
            }
        } catch (e) {
            console.error("Error parsing logo URL:", e);
            return url;
        }
    }

    return url;
};
