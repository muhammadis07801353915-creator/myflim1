import { useState, useEffect } from 'react';
import Home from './components/Home';
import Search from './components/Search';
import LiveTV from './components/LiveTV';
import Watchlist from './components/Watchlist';
import Profile from './components/Profile';
import Detail from './components/Detail';
import BottomNav from './components/BottomNav';
import Sidebar from './components/Sidebar';
import { useHardwareBack } from './lib/useHardwareBack';
import { useData } from './lib/DataContext';
import { supabase } from './lib/supabase';

export default function ClientApp() {
  const [currentTab, setCurrentTab] = useState('home');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const { loading } = useData();

  useEffect(() => {
    const recordVisit = async () => {
      try {
        const lastVisit = localStorage.getItem('last_visit_time');
        const now = new Date().getTime();
        
        // ئەگەر 30 خولەک (1,800,000 ملی چرکە) بەسەر کۆتا سەرداندا تێپەڕیبوو، ئەوا بە بینەرێکی نوێ هەژماری دەکەین
        if (!lastVisit || now - parseInt(lastVisit) > 1800000) {
          localStorage.setItem('last_visit_time', now.toString());
          await supabase.from('site_visits').insert([{ page: 'home' }]);
        }
      } catch (e) {
        console.error("Failed to record visit", e);
      }
    };
    recordVisit();
  }, []);

  // Scroll to top when tab or selected item changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentTab, selectedItem]);

  useHardwareBack(!!selectedItem, () => setSelectedItem(null));


  return (
    <div className="bg-neutral-950 light-mode:bg-gray-50 text-white light-mode:text-black min-h-screen flex flex-col md:flex-row font-sans relative">
      {!selectedItem && <Sidebar currentTab={currentTab} onChange={setCurrentTab} />}
      
      <main className="flex-1 min-h-screen relative md:overflow-y-auto">
        <div className={`${!selectedItem ? 'max-w-7xl mx-auto w-full' : 'w-full'} transition-all duration-500`}>
          <div className={`${selectedItem ? 'hidden' : 'block'} transition-all duration-500`}>
            {loading ? (
              <div className="flex flex-col items-center justify-center min-h-[80vh] space-y-4">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-red-600/20 rounded-full animate-spin border-t-red-600"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
                  </div>
                </div>
                <p className="text-neutral-500 font-bold uppercase tracking-widest text-xs animate-pulse">Loading Content...</p>
              </div>
            ) : (
              <div className="relative">
                <div className={currentTab === 'home' ? 'block' : 'hidden'}>
                  <Home onSelect={setSelectedItem} />
                </div>
                <div className={currentTab === 'search' ? 'block' : 'hidden'}>
                  <Search onSelect={setSelectedItem} />
                </div>
                <div className={currentTab === 'livetv' ? 'block' : 'hidden'}>
                  <LiveTV />
                </div>
                <div className={currentTab === 'watchlist' ? 'block' : 'hidden'}>
                  <Watchlist onSelect={setSelectedItem} />
                </div>
                <div className={currentTab === 'profile' ? 'block' : 'hidden'}>
                  <Profile />
                </div>
              </div>
            )}
          </div>

          {selectedItem && (
            <Detail item={selectedItem} onBack={() => setSelectedItem(null)} />
          )}
        </div>
        {!selectedItem && (
          <div className="md:hidden">
            <BottomNav currentTab={currentTab} onChange={setCurrentTab} />
          </div>
        )}
      </main>
    </div>
  );
}
