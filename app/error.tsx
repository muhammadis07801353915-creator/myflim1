'use client';

import { useEffect, useState } from 'react';
import { RotateCcw, AlertTriangle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    console.error('Unhandled runtime error caught by app/error.tsx:', error);
  }, [error]);

  const handleRetry = () => {
    try {
      reset();
    } catch (e) {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] light-mode:bg-white text-white light-mode:text-slate-900 flex flex-col items-center justify-center p-6 text-center font-sans">
      <div className="w-16 h-16 rounded-full bg-red-600/20 text-red-500 flex items-center justify-center mb-4 border border-red-500/30 shadow-lg">
        <RotateCcw size={32} />
      </div>
      <h2 className="text-2xl font-black uppercase tracking-tight text-white light-mode:text-slate-900 mb-2">
        TABAN PLAY
      </h2>
      <p className="text-neutral-400 light-mode:text-slate-600 text-sm max-w-md mb-6">
        داواکارییەکە تووشی هەڵەی کاتی بووەوە. تکایە دووبارە تاقی بکەرەوە.
      </p>

      <div className="flex flex-col items-center gap-3">
        <button
          onClick={handleRetry}
          className="px-6 py-3 rounded-full bg-[#CC222F] hover:bg-red-700 text-white !text-white font-bold text-sm tracking-wider uppercase shadow-lg shadow-red-600/40 transition active:scale-95 flex items-center space-x-2"
          style={{ color: '#ffffff' }}
        >
          <RotateCcw size={16} />
          <span style={{ color: '#ffffff' }}>دووبارە هەوڵبدەرەوە</span>
        </button>

        {error?.message && (
          <button 
            onClick={() => setShowDetails(!showDetails)}
            className="text-xs text-neutral-500 hover:text-neutral-300 underline mt-2 flex items-center gap-1"
          >
            <AlertTriangle size={12} />
            <span>{showDetails ? 'شاردنەوەی کێشەکە' : 'پیشاندانی دەقی کێشەکە (Error Details)'}</span>
          </button>
        )}

        {showDetails && error?.message && (
          <div className="mt-4 p-4 bg-red-950/80 border border-red-500/40 rounded-xl text-red-200 text-xs font-mono max-w-lg text-left overflow-x-auto">
            <p className="font-bold text-red-400 mb-1">{error.name}: {error.message}</p>
            {error.digest && <p className="text-[10px] text-red-300/60 mb-2">Digest: {error.digest}</p>}
            {error.stack && <pre className="text-[10px] whitespace-pre-wrap opacity-75">{error.stack.slice(0, 300)}</pre>}
          </div>
        )}
      </div>
    </div>
  );
}
