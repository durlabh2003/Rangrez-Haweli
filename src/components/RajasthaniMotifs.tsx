import React, { useState } from 'react';

export function JaaliDivider({ className = '' }: { className?: string }) {
  return (
    <div className={`w-full flex items-center justify-center gap-4 my-6 ${className}`} aria-hidden="true">
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#C9A227]/40 to-[#B3123F]/40" />
      <svg width="84" height="18" viewBox="0 0 84 18" className="text-[#C9A227] shrink-0">
        <path
          d="M2 9 L12 2 L22 9 L12 16 Z M32 9 L42 2 L52 9 L42 16 Z M62 9 L72 2 L82 9 L72 16 Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.25"
        />
        <circle cx="42" cy="9" r="2.2" fill="#B3123F" />
      </svg>
      <div className="h-px flex-1 bg-gradient-to-l from-transparent via-[#C9A227]/40 to-[#B3123F]/40" />
    </div>
  );
}

export function BlockPrintBorder({ className = '' }: { className?: string }) {
  return (
    <div
      className={`h-3 w-full opacity-75 ${className}`}
      aria-hidden="true"
      style={{
        backgroundImage:
          'radial-gradient(circle at 8px 6px, #B3123F 2px, transparent 2.5px), radial-gradient(circle at 24px 6px, #0F7B6C 2px, transparent 2.5px)',
        backgroundSize: '32px 12px',
      }}
    />
  );
}

export function BandhaniSpinner({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className="animate-spin text-current"
      aria-hidden="true"
    >
      <circle cx="12" cy="3" r="2" fill="currentColor" />
      <circle cx="18.5" cy="5.5" r="1.8" fill="currentColor" opacity="0.8" />
      <circle cx="21" cy="12" r="2" fill="currentColor" opacity="0.6" />
      <circle cx="18.5" cy="18.5" r="1.8" fill="currentColor" opacity="0.45" />
      <circle cx="12" cy="21" r="2" fill="currentColor" opacity="0.3" />
      <circle cx="5.5" cy="18.5" r="1.8" fill="currentColor" opacity="0.2" />
    </svg>
  );
}

export function KathputliMascot({ size = 64, label }: { size?: number; label?: string }) {
  return (
    <div className="inline-flex flex-col items-center gap-2">
      <svg width={size} height={size * 1.25} viewBox="0 0 80 100" aria-hidden="true">
        <line x1="28" y1="0" x2="28" y2="28" stroke="#C9A227" strokeWidth="1" strokeDasharray="2 2" />
        <line x1="52" y1="0" x2="52" y2="28" stroke="#C9A227" strokeWidth="1" strokeDasharray="2 2" />
        <line x1="40" y1="0" x2="40" y2="18" stroke="#C9A227" strokeWidth="1" />
        <path d="M25 22 Q40 8 55 22 L52 28 L28 28 Z" fill="#B3123F" />
        <path d="M30 19 Q40 13 50 19" fill="none" stroke="#F4B400" strokeWidth="2.5" />
        <circle cx="50" cy="16" r="3" fill="#C9A227" />
        <circle cx="40" cy="34" r="10" fill="#F6D5B0" stroke="#2A1410" strokeWidth="1.2" />
        <circle cx="36.5" cy="33" r="1.3" fill="#2A1410" />
        <circle cx="43.5" cy="33" r="1.3" fill="#2A1410" />
        <path d="M35 38 Q40 41 45 38" fill="none" stroke="#2A1410" strokeWidth="1.5" />
        <path d="M28 45 L52 45 L62 84 L18 84 Z" fill="#F28C1B" stroke="#2A1410" strokeWidth="1.2" />
        <path d="M22 72 L58 72" stroke="#B3123F" strokeWidth="3" />
        <path d="M20 79 L60 79" stroke="#C9A227" strokeWidth="2" />
        <path d="M28 48 Q16 56 20 62" fill="none" stroke="#B3123F" strokeWidth="4" strokeLinecap="round" />
        <path d="M52 48 Q64 56 60 62" fill="none" stroke="#B3123F" strokeWidth="4" strokeLinecap="round" />
      </svg>
      {label && <span className="text-xs text-[var(--rh-ink-muted)] font-medium">{label}</span>}
    </div>
  );
}

export function ResilientImage({
  src,
  alt,
  className = '',
  fallbackTitle,
  width = 480,
  height = 600,
  sizes = '(max-width: 640px) 48vw, 320px',
  priority = false,
}: {
  src: string;
  alt: string;
  className?: string;
  fallbackTitle?: string;
  width?: number;
  height?: number;
  sizes?: string;
  priority?: boolean;
}) {
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-[var(--rh-surface-muted)] text-[var(--rh-ink-muted)] p-4 text-center ${className}`}
      >
        <svg width="36" height="36" viewBox="0 0 36 36" className="mb-2 text-[#C9A227]" aria-hidden="true">
          <path d="M6 30 L6 14 Q6 8 18 4 Q30 8 30 14 L30 30 Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="18" cy="18" r="4" fill="#B3123F" opacity="0.6" />
        </svg>
        <span className="text-xs font-medium">{fallbackTitle || alt}</span>
      </div>
    );
  }

  const isLocalRaster =
    (src.startsWith('/src/assets/images/') || src.startsWith('/assets/')) &&
    /\.(jpe?g|png|webp)$/i.test(src);

  if (isLocalRaster) {
    const encoded = encodeURIComponent(src);
    return (
      <picture className="block w-full h-full">
        <source
          type="image/avif"
          srcSet={`/api/img?src=${encoded}&w=360&fmt=avif 360w, /api/img?src=${encoded}&w=720&fmt=avif 720w`}
          sizes={sizes}
        />
        <source
          type="image/webp"
          srcSet={`/api/img?src=${encoded}&w=360&fmt=webp 360w, /api/img?src=${encoded}&w=720&fmt=webp 720w`}
          sizes={sizes}
        />
        <img
          src={`/api/img?src=${encoded}&w=720&fmt=webp`}
          alt={alt}
          width={width}
          height={height}
          sizes={sizes}
          loading={priority ? 'eager' : 'lazy'}
          decoding={priority ? 'sync' : 'async'}
          fetchPriority={priority ? 'high' : 'auto'}
          onError={() => setFailed(true)}
          className={className}
        />
      </picture>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
      loading={priority ? 'eager' : 'lazy'}
      decoding={priority ? 'sync' : 'async'}
    />
  );
}
