import React, { useState } from 'react';
import { getLogoUrl } from '../utils/imageHelper';

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    fallbackIcon?: React.ReactNode;
}

const SafeImage: React.FC<SafeImageProps> = ({ src, alt, className, fallbackIcon, ...props }) => {
    const [error, setError] = useState(false);

    // Process the source URL through our helper
    const finalSrc = !error && src ? getLogoUrl(src) : null;

    if (error || !finalSrc) {
        return (
            <div className={`${className} flex items-center justify-center bg-gray-800 text-gray-600 border border-gray-700`}>
                {fallbackIcon}
            </div>
        );
    }

    return (
        <img
            src={finalSrc}
            alt={alt}
            className={className}
            onError={() => setError(true)}
            {...props}
        />
    );
};

export default SafeImage;
