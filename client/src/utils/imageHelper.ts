import { getBaseUrl } from '../services/api';

export const getLogoUrl = (url?: string) => {
    if (!url) return undefined;

    // If it's already a full absolute URL (http/https), return as is
    if (url.startsWith('http')) return url;

    const apiBaseUrl = getBaseUrl();
    const apiOrigin = apiBaseUrl.replace(/\/api\/?$/, '');

    // Normalize path: ensure it starts with / and remove double slashes
    const path = url.startsWith('/') ? url : `/${url}`;

    // Return combined URL
    return `${apiOrigin}${path}`;
};

