import React from 'react';

/**
 * Loading fallback component for React Suspense boundaries
 * Shows a themed loading spinner with skeleton effect
 */
const LoadingFallback = ({ type = 'page' }) => {
  if (type === 'page') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          {/* Spinner */}
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute top-0 left-0 w-full h-full border-4 border-primary/20 rounded-full"></div>
            <div className="absolute top-0 left-0 w-full h-full border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
          
          {/* Loading text */}
          <p className="text-sm text-muted-foreground animate-pulse">
            লোড হচ্ছে...
          </p>
        </div>
      </div>
    );
  }

  if (type === 'component') {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="relative w-8 h-8">
          <div className="absolute top-0 left-0 w-full h-full border-2 border-primary/20 rounded-full"></div>
          <div className="absolute top-0 left-0 w-full h-full border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  // Skeleton loader - matches dashboard layout
  if (type === 'skeleton') {
    return (
      <div className="p-6 space-y-6 animate-pulse">
        {/* Page title skeleton */}
        <div className="h-10 bg-muted rounded-lg w-1/3"></div>
        
        {/* Stats cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-32 bg-muted rounded-xl"></div>
          <div className="h-32 bg-muted rounded-xl"></div>
          <div className="h-32 bg-muted rounded-xl"></div>
        </div>
        
        {/* Large content area skeleton */}
        <div className="space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-64 bg-muted rounded-xl"></div>
            <div className="h-64 bg-muted rounded-xl"></div>
            <div className="h-64 bg-muted rounded-xl"></div>
          </div>
        </div>
        
        {/* Table skeleton */}
        <div className="space-y-3">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="space-y-2">
            <div className="h-16 bg-muted rounded"></div>
            <div className="h-16 bg-muted rounded"></div>
            <div className="h-16 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default LoadingFallback;
