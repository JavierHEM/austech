'use client';

import { ReactNode } from 'react';
import ClientOnly from '@/components/ClientOnly';

interface SVGWrapperProps {
  children: ReactNode;
  className?: string;
  viewBox?: string;
  width?: string | number;
  height?: string | number;
  fill?: string;
}

export default function SVGWrapper({
  children,
  className = '',
  viewBox = '0 0 24 24',
  width,
  height,
  fill = 'currentColor'
}: SVGWrapperProps) {
  // Determinar las dimensiones para el fallback
  const widthValue = width || (className?.includes('w-') ? '' : '24');
  const heightValue = height || (className?.includes('h-') ? '' : '24');
  
  const fallbackClass = `${className}`;
  
  return (
    <ClientOnly fallbackClassName={fallbackClass}>
      <svg 
        className={className}
        viewBox={viewBox}
        width={width}
        height={height}
        fill={fill}
      >
        {children}
      </svg>
    </ClientOnly>
  );
}