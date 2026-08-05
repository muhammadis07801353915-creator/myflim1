import { Suspense } from 'react';
import ClientApp from '../src/ClientApp';

export default function Page() {
  return (
    <Suspense fallback={
      <div className="bg-[#0a0a0f] min-h-screen text-white flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-red-600/20 border-t-red-600 rounded-full animate-spin"></div>
        <p className="text-neutral-400 font-bold uppercase tracking-widest text-xs">Loading Taban Play...</p>
      </div>
    }>
      <ClientApp />
    </Suspense>
  );
}
