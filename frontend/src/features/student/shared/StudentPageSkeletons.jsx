import React from 'react';

function SkeletonBlock({ className = '' }) {
  return <div className={`animate-pulse bg-gray-200 rounded-2xl ${className}`} />;
}

export function StudentDashboardSkeleton() {
  return (
    <div className="p-8 space-y-8">
      <div className="flex items-start justify-between gap-6">
        <div className="space-y-3">
          <SkeletonBlock className="h-3 w-32 rounded-full" />
          <SkeletonBlock className="h-10 w-80 max-w-[70vw]" />
        </div>
        <div className="flex items-center gap-3 mt-2">
          <SkeletonBlock className="h-10 w-24" />
          <SkeletonBlock className="h-10 w-10 rounded-xl" />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4">
            <SkeletonBlock className="h-3 w-24 rounded-full" />
            <SkeletonBlock className="h-10 w-32" />
            <SkeletonBlock className="h-3 w-40 rounded-full" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
              <SkeletonBlock className="h-3 w-40 rounded-full" />
              <SkeletonBlock className="h-6 w-52" />
              <div className="flex items-center gap-8">
                <SkeletonBlock className="h-32 w-32 rounded-full" />
                <div className="flex-1 space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <SkeletonBlock key={i} className="h-4 w-full" />
                  ))}
                </div>
              </div>
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
              <SkeletonBlock className="h-3 w-28 rounded-full" />
              <SkeletonBlock className="h-6 w-36" />
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <SkeletonBlock className="h-8 w-8 rounded-full" />
                    <SkeletonBlock className="h-4 flex-1" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
                <SkeletonBlock className="h-3 w-32 rounded-full" />
                <SkeletonBlock className="h-6 w-48" />
                <div className="space-y-3">
                  {[...Array(4)].map((__, j) => (
                    <SkeletonBlock key={j} className="h-4 w-full" />
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
            <SkeletonBlock className="h-3 w-28 rounded-full" />
            <SkeletonBlock className="h-6 w-44" />
            <div className="grid md:grid-cols-2 gap-4">
              {[...Array(2)].map((_, i) => (
                <SkeletonBlock key={i} className="h-44 w-full" />
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4">
              <SkeletonBlock className="h-3 w-28 rounded-full" />
              <SkeletonBlock className="h-6 w-40" />
              <SkeletonBlock className="h-24 w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function StudentPerformanceSkeleton() {
  return (
    <div className="p-8 space-y-8">
      <div className="flex items-start justify-between gap-6">
        <div className="space-y-3">
          <SkeletonBlock className="h-3 w-32 rounded-full" />
          <SkeletonBlock className="h-10 w-72 max-w-[65vw]" />
        </div>
        <div className="flex items-center gap-3 mt-2">
          <SkeletonBlock className="h-10 w-32" />
          <SkeletonBlock className="h-10 w-10 rounded-xl" />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4">
            <SkeletonBlock className="h-3 w-24 rounded-full" />
            <SkeletonBlock className="h-10 w-28" />
            <SkeletonBlock className="h-3 w-36 rounded-full" />
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
          <SkeletonBlock className="h-3 w-32 rounded-full" />
          <SkeletonBlock className="h-6 w-52" />
          <SkeletonBlock className="h-80 w-full" />
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
          <SkeletonBlock className="h-3 w-28 rounded-full" />
          <SkeletonBlock className="h-6 w-40" />
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <SkeletonBlock key={i} className="h-4 w-full" />
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
        <SkeletonBlock className="h-3 w-28 rounded-full" />
        <SkeletonBlock className="h-6 w-48" />
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="grid grid-cols-12 gap-3 items-center">
              <SkeletonBlock className="h-4 col-span-4" />
              <SkeletonBlock className="h-4 col-span-3" />
              <SkeletonBlock className="h-4 col-span-2" />
              <SkeletonBlock className="h-4 col-span-3" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function StudentGitHubSkeleton() {
  return (
    <div className="min-h-screen bg-[#0d1117] text-[#c9d1d9] p-8 space-y-8">
      <div className="flex items-start justify-between gap-6">
        <div className="space-y-3">
          <SkeletonBlock className="h-3 w-28 rounded-full bg-white/10" />
          <SkeletonBlock className="h-10 w-80 max-w-[70vw] bg-white/10" />
        </div>
        <SkeletonBlock className="h-10 w-32 bg-white/10" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6 space-y-4">
            <SkeletonBlock className="h-3 w-28 rounded-full bg-white/10" />
            <SkeletonBlock className="h-6 w-48 bg-white/10" />
            <SkeletonBlock className="h-72 w-full bg-white/10" />
          </div>
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6 space-y-4">
            <SkeletonBlock className="h-3 w-32 rounded-full bg-white/10" />
            <SkeletonBlock className="h-6 w-56 bg-white/10" />
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <SkeletonBlock key={i} className="h-16 w-full bg-white/10" />
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-[#161b22] border border-[#30363d] rounded-2xl p-5 space-y-4">
              <SkeletonBlock className="h-3 w-24 rounded-full bg-white/10" />
              <SkeletonBlock className="h-6 w-40 bg-white/10" />
              <SkeletonBlock className="h-24 w-full bg-white/10" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
