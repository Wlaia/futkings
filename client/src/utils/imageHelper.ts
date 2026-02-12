import { getBaseUrl } from '../services/api';

export const getLogoUrl = (url?: string) => {
    if (!url) return undefined;

    const apiBaseUrl = getBaseUrl();
    const apiOrigin = apiBaseUrl.replace(/\/api\/?$/, '');

    // Auto-fix localhost URLs stored in DB when on production
    const isProduction = !window.location.hostname.includes('localhost') &&
        !window.location.hostname.includes('127.0.0.1');

    let processedUrl = url;
    if (isProduction && url.includes('localhost:3000')) {
        // Strip the http://localhost:3000 part and treat as relative
        processedUrl = url.replace(/^https?:\/\/localhost:3000\/?/, '');
        if (!processedUrl.startsWith('/')) processedUrl = '/' + processedUrl;
    }

    // If it's already a full absolute URL (http/https) and NOT a localhost one we just fixed
    if (processedUrl.startsWith('http')) return processedUrl;

    // Normalize path: ensure it starts with / and remove double slashes
    const path = processedUrl.startsWith('/') ? processedUrl : `/${processedUrl}`;

    // Return combined URL
    return `${apiOrigin}${path}`;
};

