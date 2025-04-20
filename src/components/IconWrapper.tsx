'use client';

import { LucideIcon } from 'lucide-react';
import ClientOnly from '@/components/ClientOnly';

interface IconWrapperProps {
  icon: LucideIcon;
  className?: string;
  size?: number;
  color?: string;
  strokeWidth?: number;
  onClick?: () => void;
}

export default function IconWrapper({ 
  icon: Icon, 
  className = '',
  size, 
  color,
  strokeWidth,
  onClick
}: IconWrapperProps) {
  return (
    <ClientOnly fallbackClassName={className || `w-${size || 5} h-${size || 5}`}>
      <Icon 
        className={className} 
        size={size} 
        color={color}
        strokeWidth={strokeWidth}
        onClick={onClick}
      />
    </ClientOnly>
  );
}