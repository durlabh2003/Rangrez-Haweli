import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import { GLOSSARY_TERMS } from '../config/heritageConstants';

export function TermGloss({
  term,
  children,
}: {
  term: keyof typeof GLOSSARY_TERMS;
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const info = GLOSSARY_TERMS[term];

  return (
    <span className="relative inline-flex items-center gap-1">
      <span>{children ?? term}</span>
      <button
        type="button"
        aria-label={`${info.title}: ${info.meaning}`}
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        onBlur={() => setOpen(false)}
        className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[var(--rh-ink-muted)] hover:text-[var(--rh-primary)] focus-visible:outline-2"
        title={info.meaning}
      >
        <HelpCircle className="w-3.5 h-3.5" aria-hidden="true" />
      </button>
      {open && (
        <span
          role="tooltip"
          className="absolute left-0 top-full mt-1.5 z-50 w-56 p-2.5 rounded-lg bg-[#2A1410] dark:bg-[#1E2549] text-[#FBF3E4] border border-[#C9A227]/40 shadow-xl text-[11px] leading-relaxed font-normal text-left"
        >
          <strong className="block font-semibold text-[#F4B400] mb-0.5">{info.title}</strong>
          {info.meaning}
        </span>
      )}
    </span>
  );
}
