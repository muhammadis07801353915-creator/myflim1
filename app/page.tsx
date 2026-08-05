'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';

const ClientApp = dynamic(() => import('@/src/ClientApp'), { ssr: false });

export default function Page() {
  return (
    <Suspense fallback={<div className="bg-[#0a0a0f] min-h-screen text-white flex items-center justify-center">Loading...</div>}>
      <ClientApp />
    </Suspense>
  );
}
