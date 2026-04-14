'use client';

import Sidebar from '@/src/components/Sidebar';
import BottomNav from '@/src/components/BottomNav';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-neutral-950 text-white min-h-screen flex flex-col md:flex-row font-sans relative">
      <Sidebar />
      
      <main className="flex-1 min-h-screen relative md:overflow-y-auto">
        <div className="max-w-7xl mx-auto w-full transition-all duration-500">
          {children}
        </div>
        
        <div className="md:hidden">
          <BottomNav />
        </div>
      </main>
    </div>
  );
}
