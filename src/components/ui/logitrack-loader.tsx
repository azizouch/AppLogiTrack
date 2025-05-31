import React from 'react';

interface LogiTrackLoaderProps {
  message?: string;
  className?: string;
}

export function LogiTrackLoader({
  message = "Chargement de l'application...",
  className = ""
}: LogiTrackLoaderProps) {
  return (
    <div className={`fixed inset-0 bg-background flex flex-col items-center justify-center z-50 ${className}`}>
      <div className="flex flex-col items-center">
        <div className="relative w-24 h-24 mb-2 rounded-full border-2 border-primary/20 p-2 flex items-center justify-center">
          {/* Package icon instead of image */}
          <svg className="w-12 h-12 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-primary mb-6">LogiTrack</h1>
      </div>
      <div className="flex flex-col items-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary mb-4"></div>
        <p className="text-muted-foreground text-sm">{message}</p>
      </div>
    </div>
  );
}

// Alternative loader with dots animation
export function LogiTrackLoaderWithDots({
  message = "Chargement de l'application",
  className = ""
}: LogiTrackLoaderProps) {
  return (
    <div className={`min-h-screen flex flex-col items-center justify-center bg-white dark:bg-gray-900 ${className}`}>
      {/* LogiTrack Title */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-blue-600 dark:text-blue-400">
          LogiTrack
        </h1>
      </div>

      {/* Custom Spinner */}
      <div className="mb-8">
        <div className="relative">
          {/* Outer ring */}
          <div className="w-16 h-16 border-4 border-gray-200 dark:border-gray-700 rounded-full"></div>

          {/* Animated ring */}
          <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin"></div>
        </div>
      </div>

      {/* Loading Message with animated dots */}
      <div className="text-center logitrack-fade-in">
        <p className="text-gray-600 dark:text-gray-400 text-lg font-medium">
          {message}
          <span className="inline-flex ml-1">
            <span className="logitrack-pulse">.</span>
            <span className="logitrack-pulse-delay-150">.</span>
            <span className="logitrack-pulse-delay-300">.</span>
          </span>
        </p>
      </div>
    </div>
  );
}

// Compact loader for smaller spaces
export function LogiTrackLoaderCompact({
  message = "Chargement...",
  className = ""
}: LogiTrackLoaderProps) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
      {/* Smaller Spinner */}
      <div className="mb-4">
        <div className="relative">
          {/* Outer ring */}
          <div className="w-8 h-8 border-2 border-gray-200 dark:border-gray-700 rounded-full"></div>

          {/* Animated ring */}
          <div className="absolute top-0 left-0 w-8 h-8 border-2 border-transparent border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin"></div>
        </div>
      </div>

      {/* Loading Message */}
      <div className="text-center">
        <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
          {message}
        </p>
      </div>
    </div>
  );
}
