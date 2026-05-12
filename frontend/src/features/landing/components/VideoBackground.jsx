import React from 'react';

// Path to the video file placed in the public folder
export default function VideoBackground() {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden">
      <video
        className="w-full h-full object-cover opacity-30"
        src="/BGLOOPS_compressed.mp4"
        autoPlay={true}
        loop={true}
        muted={true}
        playsInline={true}
        preload="auto"
      />
      {/* Overlay to ensure readability - using a subtle white-to-transparent gradient or solid overlay if needed */}
      <div className="absolute inset-0 bg-white/20 pointer-events-none" />
    </div>
  );
}
