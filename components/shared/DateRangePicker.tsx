'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

const ranges = [
  { label: '7d', days: 7 },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
];

interface DateRangePickerProps {
  value: number;
  onChange: (days: number) => void;
}

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  return (
    <div className="flex items-center gap-0.5 bg-[#14141C] border border-[#1E1E2A] rounded-md p-0.5">
      {ranges.map(({ label, days }) => (
        <button
          key={days}
          onClick={() => onChange(days)}
          className={cn(
            'px-2.5 py-1 rounded text-xs font-medium transition-colors',
            value === days
              ? 'bg-[#1E1E2A] text-[#F1F1F5]'
              : 'text-[#8B8B9A] hover:text-[#F1F1F5]'
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
