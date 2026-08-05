import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Home from './components/Home';
import Search from './components/Search';
import LiveTV from './components/LiveTV';
import Watchlist from './components/Watchlist';
import Profile from './components/Profile';
import Detail from './components/Detail';
import BottomNav from './components/BottomNav';
import Sidebar from './components/Sidebar';
import { useData } from './lib/DataContext';
import { supabase } from './lib/supabase';
import { motion, AnimatePresence } from 'motion/react';

export default function ClientApp() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentTab, setCurrentTab] = useState('home');
  const { movies, loading } = useData();

  // URL-based navigation
  const movieId = searchParams.get('movie');
  const selectedItem = movies.find(m => m.id.toString() === movieId);

  useEffect(() => {
    const recordVisit = async () => {
      try {
        const lastVisit = localStorage.getItem('last_visit_time');
        const now = new Date().getTime();
        if (!lastVisit || now - parseInt(lastVisit) > 1800000) {
          localStorage.setItem('last_visit_time', now.toString());
          await supabase.from('site_visits').insert([{ page: 'home' }]);
        }
      } catch (e) {
        console.error("Failed to record visit", e);
      }
    };
    recordVisit();

    // Helper: record a Google login to user_logins (at most once per 24h per user)
    const recordGoogleLogin = async (user: any) => {
      const loginKey = `login_recorded_${user.id}`;
      const lastLoginRecorded = localStorage.getItem(loginKey);
      const now = Date.now();
      // Record at most once every 24 hours per user to avoid duplicates on refresh
      if (!lastLoginRecorded || now - parseInt(lastLoginRecorded) > 86400000) {
        localStorage.setItem(loginKey, now.toString());
        try {
          await supabase.from('user_logins').insert([{
            source: 'web_google',
            email: user.email || null,
            display_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Unknown',
            user_id: user.id,
          }]);
        } catch (e) {
          console.warn('user_logins insert failed:', e);
        }
      }
    };

    // Check if user already has an active session (handles page refresh after login)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        recordGoogleLogin(session.user);
      }
    });

    // Also catch new sign-ins happening while on the page
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
        recordGoogleLogin(session.user);
      }
    });


    // Online Users Tracking (Presence)
    const channel = supabase.channel('online-users', {
      config: {
        presence: {
          key: 'user-' + Math.random().toString(36).substring(7),
        },
      },
    });

    channel
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      authListener.subscription.unsubscribe();
      channel.unsubscribe();
    };
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentTab]);

  const handleSelectItem = (item: any) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('movie', item.id.toString());
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <div className="bg-neutral-950 light-mode:bg-gray-50 text-white light-mode:text-black min-h-screen flex flex-col md:flex-row font-sans relative">
      <Sidebar currentTab={currentTab} onChange={setCurrentTab} />
      
      <main className="flex-1 min-h-screen relative md:overflow-y-auto">
        <div className="max-w-7xl mx-auto w-full transition-all duration-500">
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
                <Home onSelect={handleSelectItem} />
              </div>
              <div className={currentTab === 'search' ? 'block' : 'hidden'}>
                <Search onSelect={handleSelectItem} />
              </div>
              <div className={currentTab === 'livetv' ? 'block' : 'hidden'}>
                <LiveTV />
              </div>
              <div className={currentTab === 'watchlist' ? 'block' : 'hidden'}>
                <Watchlist onSelect={handleSelectItem} />
              </div>
              <div className={currentTab === 'profile' ? 'block' : 'hidden'}>
                <Profile />
              </div>
            </div>
          )}
        </div>

        {/* Floating Detail Overlay */}
        <AnimatePresence mode="wait">
          {selectedItem && (
            <motion.div 
              key="detail-modal"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-0 z-[100] bg-neutral-950 light-mode:bg-white overflow-y-auto"
            >
              <Detail item={selectedItem} onBack={handleBack} />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="md:hidden">
          <BottomNav currentTab={currentTab} onChange={setCurrentTab} />
        </div>
      </main>
    </div>
  );
}
