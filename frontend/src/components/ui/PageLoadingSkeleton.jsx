import React from 'react';
import aspireLogo from '../../assets/aspire-logo.png';

export default function PageLoadingSkeleton() {
  return (
    <div className="fixed inset-0 z-[100] bg-[#0a0101] flex flex-col items-center justify-center p-6">
      {/* Central Pulsing Logo */}
      <div className="flex flex-col items-center justify-center animate-pulse duration-1000">
        <img src={aspireLogo} alt="Loading ASPIRE..." className="h-[80px] w-auto opacity-30 mb-12 grayscale brightness-200" />
        
        {/* Text Skeleton */}
        <div className="space-y-3 w-64 max-w-full">
          <div className="h-2 bg-white/10 rounded-full w-full"></div>
          <div className="h-2 bg-[#70170f]/30 rounded-full w-2/3 mx-auto"></div>
        </div>
      </div>

      {/* Decorative Grid Skeleton Blocks */}
      <div className="absolute inset-0 opacity-10 pointer-events-none flex flex-col justify-end pb-24">
        <div className="max-w-7xl mx-auto w-full px-10 grid grid-cols-2 md:grid-cols-4 gap-6 animate-pulse duration-1500">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-white/5 rounded-2xl border border-white/5"></div>
          ))}
        </div>
      </div>
    </div>
  );
}
