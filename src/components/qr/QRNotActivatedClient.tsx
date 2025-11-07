"use client";
import { useState } from 'react';

export default function QRNotActivatedClient({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      // fallback: create an input and select
      const el = document.createElement('input');
      el.value = code;
      document.body.appendChild(el);
      el.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } finally {
        document.body.removeChild(el);
      }
    }
  };

  return (
    <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
      <a
        href="tel:+919512899907"
        className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-indigo-600 text-white font-medium shadow-sm hover:bg-indigo-700"
      >
        Call Admin
      </a>

      <button
        onClick={copy}
        className="inline-flex items-center justify-center px-4 py-2 rounded-md border border-slate-200 bg-white text-slate-900 hover:bg-slate-50"
        aria-pressed={copied}
      >
        {copied ? 'Copied!' : 'Copy Code'}
      </button>
    </div>
  );
}
