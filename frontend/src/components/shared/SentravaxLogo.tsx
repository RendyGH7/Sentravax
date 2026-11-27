import React, { useId } from 'react';

interface SentravaxLogoProps {
  size?: number;
  className?: string;
}

/**
 * Custom geometric SENTRAVAX brand mark:
 * Combines a Crimson-to-Maroon resilience shield, a crisp geometric 'S' sentinel,
 * and a soft rose-ivory early-warning beacon node.
 */
export const SentravaxLogo: React.FC<SentravaxLogoProps> = ({ size = 36, className = '' }) => {
  const uid = useId().replace(/:/g, '');
  const bgId = `svx-bg-${uid}`;
  const shineId = `svx-shine-${uid}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={bgId} x1="8" y1="6" x2="56" y2="58" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#E11D48" />
          <stop offset="55%" stopColor="#BE123C" />
          <stop offset="100%" stopColor="#881337" />
        </linearGradient>
        <linearGradient id={shineId} x1="16" y1="10" x2="48" y2="54" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
      </defs>

      <rect x="2" y="2" width="60" height="60" rx="16" fill={`url(#${bgId})`} />
      <rect x="3" y="3" width="58" height="58" rx="15" stroke={`url(#${shineId})`} strokeWidth="1.5" />

      <path
        d="M32 13.5L47.5 19.2V31.5C47.5 41.2 40.9 48.6 32 51.5C23.1 48.6 16.5 41.2 16.5 31.5V19.2L32 13.5Z"
        fill="#4C0519"
        fillOpacity="0.28"
        stroke="#FFE4E6"
        strokeOpacity="0.5"
        strokeWidth="2"
        strokeLinejoin="round"
      />

      <path
        d="M38.5 24.5C38.5 22.3 36.2 21 32.2 21C28.2 21 25.8 22.6 25.8 25.2C25.8 27.8 28.2 29.1 32 30.1C35.8 31.1 38.5 32.5 38.5 35.6C38.5 38.6 35.9 40.5 31.8 40.5C27.8 40.5 25.3 38.9 25.3 36.5"
        stroke="#FFFFFF"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <circle cx="40.5" cy="21.5" r="2.75" fill="#FECDD3" />
    </svg>
  );
};

export default SentravaxLogo;
