import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

// 1. Luxury Minimalist Tooth Vector Icon
export const LuxuryToothIcon: React.FC<IconProps> = ({ className = "w-4 h-4", size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {/* Clean anatomical tooth crown and dual roots */}
    <path d="M12 2C7.5 2 4 4.5 4 8.5C4 11.5 5 14 6 18C6.8 21.2 9 21.5 9.5 18C10 14.5 10.5 12 12 12C13.5 12 14 14.5 14.5 18C15 21.5 17.2 21.2 18 18C19 14 20 11.5 20 8.5C20 4.5 16.5 2 12 2Z" />
    <path d="M9 5C10 6 11 6.5 12 6.5C13 6.5 14 6 15 5" strokeWidth="1.2" opacity="0.6" />
  </svg>
);

// 2. Luxury ENT / Ear Vector Icon
export const LuxuryEntIcon: React.FC<IconProps> = ({ className = "w-4 h-4", size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M7 10C7 6.68629 9.68629 4 13 4C16.3137 4 19 6.68629 19 10C19 13.5 17 15.5 15.5 17C14.5 18 14 18.5 14 20C14 20.8 13.2 21.5 12 21.5C10.5 21.5 10 20.5 10 19.5C10 17 12 15.5 13 14C14 12.5 14.5 11.5 14.5 10C14.5 8.5 13.8 7.5 13 7.5C12.2 7.5 11.5 8.2 11.5 9" />
    <path d="M5 8C3.5 10 3.5 13 5 15" strokeWidth="1.2" opacity="0.6" />
  </svg>
);

// 3. Luxury Mirror / Self-View Icon
export const LuxuryMirrorIcon: React.FC<IconProps> = ({ className = "w-4 h-4", size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="9" r="6" />
    <path d="M12 15V21" />
    <path d="M9 21H15" />
    <path d="M10 7C10.5 6.5 11.2 6.2 12 6.2" strokeWidth="1.2" opacity="0.7" />
  </svg>
);

// 4. Luxury Dental Arch Icon
export const LuxuryArchIcon: React.FC<IconProps> = ({ className = "w-4 h-4", size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M4 19C4 11 7.5 4 12 4C16.5 4 20 11 20 19" />
    <circle cx="7" cy="17" r="1.5" fill="currentColor" stroke="none" />
    <circle cx="9.5" cy="11.5" r="1.5" fill="currentColor" stroke="none" />
    <circle cx="12" cy="7.5" r="1.5" fill="currentColor" stroke="none" />
    <circle cx="14.5" cy="11.5" r="1.5" fill="currentColor" stroke="none" />
    <circle cx="17" cy="17" r="1.5" fill="currentColor" stroke="none" />
  </svg>
);

// 5. Luxury Clinician / Doctor Crest
export const LuxuryDoctorIcon: React.FC<IconProps> = ({ className = "w-4 h-4", size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M16 21V19C16 16.7909 14.2091 15 12 15H12C9.79086 15 8 16.7909 8 19V21" />
    <circle cx="12" cy="8" r="4" />
    <path d="M12 14V17" strokeWidth="1.5" />
    <path d="M10.5 15.5H13.5" strokeWidth="1.5" />
  </svg>
);

// 6. Luxury 3D Model / Scanner Box
export const LuxuryScanBoxIcon: React.FC<IconProps> = ({ className = "w-4 h-4", size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M21 8V5C21 3.89543 20.1046 3 19 3H16" />
    <path d="M8 3H5C3.89543 3 3 3.89543 3 5V8" />
    <path d="M3 16V19C3 20.1046 3.89543 21 5 21H8" />
    <path d="M16 21H19C20.1046 21 21 20.1046 21 19V16" />
    <path d="M7 12H17" strokeWidth="1.4" strokeDasharray="2 2" />
    <circle cx="12" cy="12" r="2.5" />
  </svg>
);

// 7. Minimalist Directional Quadrant Compass Arrow
export const QuadrantArrowIcon: React.FC<{
  dir?: 'ur' | 'ul' | 'lr' | 'll' | 'center';
  direction?: 'ur' | 'ul' | 'lr' | 'll' | 'center';
  className?: string;
}> = ({ dir, direction, className = "w-3.5 h-3.5" }) => {
  const actualDir = direction || dir || 'center';
  switch (actualDir) {
    case 'ur':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <line x1="7" y1="17" x2="17" y2="7" />
          <polyline points="7 7 17 7 17 17" />
        </svg>
      );
    case 'ul':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <line x1="17" y1="17" x2="7" y2="7" />
          <polyline points="17 7 7 7 7 17" />
        </svg>
      );
    case 'lr':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <line x1="7" y1="7" x2="17" y2="17" />
          <polyline points="7 17 17 17 17 7" />
        </svg>
      );
    case 'll':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <line x1="17" y1="7" x2="7" y2="17" />
          <polyline points="17 17 7 17 7 7" />
        </svg>
      );
    case 'center':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <circle cx="12" cy="12" r="8" />
          <line x1="12" y1="8" x2="12" y2="16" />
          <line x1="8" y1="12" x2="16" y2="12" />
        </svg>
      );
  }
};
