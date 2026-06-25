'use client';

import { useEffect, useRef, useState } from 'react';
import { Search, X, Building2, User } from 'lucide-react';

export interface BookFilter {
  type: 'agency' | 'rep';
  name: string;
  /** advisor name to filter policies by (agencies filter their whole branch via name match). */
}

interface SearchResult {
  type: 'agency' | 'rep';
  name: string;
  email: string | null;
  contactId: string | null;
}

const STORAGE_KEY = 'bookFilter';

/** Read the current global book filter (set by this search). */
export function getBookFilter(): BookFilter | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as BookFilter) : null;
  } catch {
    return null;
  }
}

function setBookFilter(filter: BookFilter | null) {
  if (filter) localStorage.setItem(STORAGE_KEY, JSON.stringify(filter));
  else localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event('bookFilterChanged'));
}

/**
 * Header search: type to find an agency or rep within YOUR book, pick one to
 * scope the Dashboard / My Organization / Cases pages to it. Clear to reset.
 */
export default function BookSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ agencies: SearchResult[]; reps: SearchResult[] }>({ agencies: [], reps: [] });
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<BookFilter | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  // Reflect the persisted filter (e.g. after navigation).
  useEffect(() => {
    setActive(getBookFilter());
  }, []);

  // Debounced search.
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults({ agencies: [], reps: [] });
      return;
    }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/book-search?q=${encodeURIComponent(query.trim())}`);
        if (res.ok) {
          setResults(await res.json());
          setOpen(true);
        }
      } catch {
        /* ignore */
      }
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  // Close on outside click.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const select = (r: SearchResult) => {
    const f: BookFilter = { type: r.type, name: r.name };
    setBookFilter(f);
    setActive(f);
    setQuery('');
    setResults({ agencies: [], reps: [] });
    setOpen(false);
  };

  const clear = () => {
    setBookFilter(null);
    setActive(null);
    setQuery('');
  };

  const hasResults = results.agencies.length > 0 || results.reps.length > 0;

  return (
    <div ref={boxRef} className="relative hidden md:block w-64 lg:w-80">
      {active ? (
        // Active filter chip
        <div className="flex items-center gap-2 h-9 px-3 rounded-lg border border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/30 text-sm">
          {active.type === 'agency' ? (
            <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
          ) : (
            <User className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
          )}
          <span className="truncate text-blue-800 dark:text-blue-200" title={active.name}>{active.name}</span>
          <button onClick={clear} className="ml-auto p-0.5 rounded hover:bg-blue-100 dark:hover:bg-blue-800" aria-label="Clear filter">
            <X className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </button>
        </div>
      ) : (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => hasResults && setOpen(true)}
            placeholder="Search agency, rep, or email…"
            className="w-full h-9 pl-9 pr-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      {open && hasResults && !active && (
        <div className="absolute mt-1 w-full max-h-80 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg z-50">
          {results.agencies.length > 0 && (
            <div>
              <p className="px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-gray-400">Agencies</p>
              {results.agencies.map((r) => (
                <button key={'a' + r.name} onClick={() => select(r)} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-800">
                  <Building2 className="h-4 w-4 text-gray-400 shrink-0" />
                  <span className="flex-1 min-w-0">
                    <span className="block truncate text-gray-900 dark:text-gray-100">{r.name}</span>
                    {r.email && <span className="block truncate text-xs text-gray-400">{r.email}</span>}
                  </span>
                </button>
              ))}
            </div>
          )}
          {results.reps.length > 0 && (
            <div>
              <p className="px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-gray-400">Reps</p>
              {results.reps.map((r) => (
                <button key={'r' + r.name} onClick={() => select(r)} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-800">
                  <User className="h-4 w-4 text-gray-400 shrink-0" />
                  <span className="flex-1 min-w-0">
                    <span className="block truncate text-gray-900 dark:text-gray-100">{r.name}</span>
                    {r.email && <span className="block truncate text-xs text-gray-400">{r.email}</span>}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
