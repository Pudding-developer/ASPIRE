import React from 'react';

export default function CareerSectionHeading({ title }) {
  return (
    <div className="flex items-center gap-2.5 mb-5 mt-1">
      <div className="w-[3px] h-3.5 bg-[#70170f] rounded-sm flex-shrink-0" />
      <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-500">{title}</span>
    </div>
  );
}
