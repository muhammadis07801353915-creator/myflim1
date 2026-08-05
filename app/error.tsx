'use client';

import { useEffect } from 'react';
import { RotateCcw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled runtime error caught by app/error.tsx:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-full bg-red-600/20 text-red-500 flex items-center justify-center mb-4 border border-red-500/30">
        <RotateCcw size={32} />
      </div>
      <h2 className="text-2xl font-black uppercase tracking-tight text-white mb-2">
        TABAN PLAY
      </h2>
      <p className="text-neutral-400 text-sm max-w-md mb-4">
        داواکارییەکە تووشی هەڵەی کاتی بووەوە. تکایە دووبارە تاقی بکەرەوە.
      </p>

      {/* Debug Error Message & Stack trace for exact diagnosis */}
      <div className="my-4 p-4 rounded-xl bg-red-950/80 border border-red-800/50 text-left max-w-2xl w-full overflow-x-auto text-xs font-mono text-red-300">
        <p className="font-bold text-red-200 mb-1">Error Message:</p>
        <p className="mb-3 whitespace-pre-wrap">{error?.message || String(error)}</p>
        {error?.digest && <p className="text-neutral-400 mb-2">Digest: {error.digest}</p>}
        {error?.stack && (
          <details className="cursor-pointer">
            <summary className="font-bold text-red-400 hover:underline">View Stack Trace</summary>
            <pre className="mt-2 text-[10px] text-neutral-400 whitespace-pre-wrap leading-relaxed">{error.stack}</pre>
          </details>
        )}
      </div>

      <button
        onClick={() => reset()}
        className="px-6 py-3 rounded-full bg-[#CC222F] hover:bg-red-700 text-white font-bold text-sm tracking-wider uppercase shadow-lg shadow-red-600/40 transition active:scale-95 flex items-center space-x-2"
      >
        <RotateCcw size={16} />
        <span>دووبارە هەوڵبدەرەوە</span>
      </button>
    </div>
  );
}
