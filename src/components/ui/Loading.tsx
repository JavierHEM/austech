'use client';

import React from 'react';

interface LoadingProps {
  fullScreen?: boolean;
}

export default function Loading({ fullScreen = false }: LoadingProps) {
  const containerClass = fullScreen
    ? "flex items-center justify-center min-h-screen"
    : "flex items-center justify-center p-4";

  return (
    <div className={containerClass}>
      <div className="flex flex-col items-center">
        <div className="w-8 h-8 border-t-2 border-b-2 border-primary rounded-full animate-spin"></div>
        <p className="mt-2 text-sm text-muted-foreground">Cargando...</p>
      </div>
    </div>
  );
}