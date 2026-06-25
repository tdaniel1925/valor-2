'use client';

import { useEffect, useState } from 'react';
import { getBookFilter, type BookFilter } from './BookSearch';

/**
 * Subscribe to the global header book filter (agency/rep selected in BookSearch).
 * Re-renders when the filter changes. Returns null when no filter is active
 * (pages should then show the user's full scoped view).
 */
export function useBookFilter(): BookFilter | null {
  const [filter, setFilter] = useState<BookFilter | null>(null);

  useEffect(() => {
    setFilter(getBookFilter());
    const onChange = () => setFilter(getBookFilter());
    window.addEventListener('bookFilterChanged', onChange);
    return () => window.removeEventListener('bookFilterChanged', onChange);
  }, []);

  return filter;
}
