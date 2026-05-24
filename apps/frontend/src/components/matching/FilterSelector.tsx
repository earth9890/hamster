'use client';

import { useState } from 'react';
import { cn } from '../../lib/utils';
import type { MatchFilters } from '@hamster/shared';

interface FilterSelectorProps {
  filters: MatchFilters;
  onChange: (filters: MatchFilters) => void;
  disabled?: boolean;
}

const COUNTRIES = [
  { code: 'US', name: 'United States' },
  { code: 'UK', name: 'United Kingdom' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'IN', name: 'India' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'BR', name: 'Brazil' },
  { code: 'JP', name: 'Japan' },
  { code: 'KR', name: 'South Korea' },
];

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'zh', name: 'Chinese' },
  { code: 'hi', name: 'Hindi' },
  { code: 'ar', name: 'Arabic' },
];

export function FilterSelector({ filters, onChange, disabled }: FilterSelectorProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const updateFilter = (key: keyof MatchFilters, value: any) => {
    onChange({ ...filters, [key]: value });
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        disabled={disabled}
        className={cn(
          'w-full flex items-center justify-between px-4 py-3 rounded-xl',
          'glass transition-all duration-200',
          'hover:bg-white/10',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <div className="flex items-center gap-3">
          <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
          <span className="font-medium">Match Preferences</span>
        </div>
        <svg
          className={cn(
            'w-5 h-5 transition-transform duration-200',
            isExpanded && 'rotate-180'
          )}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Match with
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['male', 'female', 'everyone'] as const).map((option) => (
                <button
                  key={option}
                  onClick={() => updateFilter('gender', option)}
                  disabled={disabled}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all',
                    'border border-transparent',
                    filters.gender === option
                      ? 'bg-accent text-white border-accent'
                      : 'glass text-gray-300 hover:bg-white/10',
                    disabled && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Country {filters.country && <span className="text-accent ml-1">({filters.country})</span>}
            </label>
            <select
              value={filters.country || ''}
              onChange={(e) => updateFilter('country', e.target.value || undefined)}
              disabled={disabled}
              className={cn(
                'w-full px-4 py-2 rounded-lg',
                'bg-graphite-800/50 border border-graphite-700',
                'text-white text-sm',
                'focus:outline-none focus:border-accent',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              <option value="">Any country</option>
              {COUNTRIES.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Language {filters.language && <span className="text-accent ml-1">({filters.language})</span>}
            </label>
            <select
              value={filters.language || ''}
              onChange={(e) => updateFilter('language', e.target.value || undefined)}
              disabled={disabled}
              className={cn(
                'w-full px-4 py-2 rounded-lg',
                'bg-graphite-800/50 border border-graphite-700',
                'text-white text-sm',
                'focus:outline-none focus:border-accent',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              <option value="">Any language</option>
              {LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>

          {(filters.country || filters.language || filters.gender !== 'everyone') && (
            <button
              onClick={() => onChange({ gender: 'everyone' })}
              disabled={disabled}
              className={cn(
                'w-full px-4 py-2 rounded-lg text-sm text-gray-400',
                'hover:text-white transition-colors',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              Clear all filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
