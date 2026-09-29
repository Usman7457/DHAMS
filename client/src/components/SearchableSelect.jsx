import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ChevronDown, Search } from 'lucide-react';

export function SearchableSelect({
  label,
  value,
  onChange,
  options = [],
  placeholder = '-- Select --',
  required = false,
  className = '',
  accentColor = 'emerald',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef(null);

  const selectedOption = options.find((opt) => String(opt.value) === String(value));
  const displayLabel = selectedOption ? selectedOption.label : value;

  const filteredOptions = useMemo(() => {
    return options.filter((opt) =>
      (opt.label || '').toLowerCase().includes(search.toLowerCase())
    );
  }, [options, search]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const borderFocusClass =
    accentColor === 'amber' ? 'focus-within:border-amber-600' : 'focus-within:border-emerald-600';
  const selectedBgClass =
    accentColor === 'amber' ? 'bg-amber-100/80 text-amber-950 font-bold' : 'bg-emerald-100/80 text-emerald-950 font-bold';

  return (
    <div className={`relative ${className}`} ref={wrapperRef}>
      {label && (
        <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
          {label} {required && <span className="text-rose-600">*</span>}
        </label>
      )}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2 text-xs cursor-pointer flex items-center justify-between font-bold transition-all hover:bg-stone-100 ${borderFocusClass}`}
      >
        <span className={displayLabel ? 'text-stone-900 truncate' : 'text-stone-400 font-normal truncate'}>
          {displayLabel || placeholder}
        </span>
        <ChevronDown className="w-4 h-4 text-stone-400 shrink-0 ml-1" />
      </div>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-stone-200 rounded-xl shadow-2xl z-50 overflow-hidden text-stone-800 animate-in fade-in duration-150">
          <div className="p-2 border-b border-stone-100 bg-stone-50 flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5 text-stone-400 shrink-0" />
            <input
              type="text"
              autoFocus
              placeholder="Type to search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-stone-300 rounded-lg px-2.5 py-1 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-stone-500"
            />
          </div>

          <div className="max-h-52 overflow-y-auto divide-y divide-stone-50">
            {filteredOptions.length === 0 ? (
              <div className="p-3.5 text-center text-xs text-stone-400 font-medium">No matching option found</div>
            ) : (
              filteredOptions.map((opt) => (
                <div
                  key={opt.value}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                    setSearch('');
                  }}
                  className={`p-2.5 text-xs cursor-pointer hover:bg-stone-100 transition-colors ${
                    String(opt.value) === String(value) ? selectedBgClass : 'text-stone-800'
                  }`}
                >
                  {opt.label}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
