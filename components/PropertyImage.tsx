'use client';

import { useState } from 'react';
import { Home } from 'lucide-react';

interface PropertyImageProps {
  src: string;
  alt: string;
  className?: string;
}

export default function PropertyImage({ src, alt, className = '' }: PropertyImageProps) {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-card/50 ${className}`}>
        <Home className="w-16 h-16 text-muted/30" />
      </div>
    );
  }

  return (
    <>
      {loading && (
        <div className={`flex items-center justify-center bg-card/50 ${className} absolute inset-0`}>
          <Home className="w-16 h-16 text-muted/30 animate-pulse" />
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className={className}
        onError={() => setError(true)}
        onLoad={() => setLoading(false)}
        style={{ display: loading ? 'none' : 'block' }}
      />
    </>
  );
}
