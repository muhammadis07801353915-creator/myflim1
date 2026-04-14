'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Tv, Bookmark, User, LogOut } from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';

export default function Sidebar({ currentTab, onChange }: { currentTab?: string, onChange?: (tab: string) => void }) {
  const { t } = useLanguage();
  const pathname = usePathname();

  const navItems = [
    { id: 'home', icon: Home, label: t.home, path: '/' },
    { id: 'search', icon: Search, label: t.search, path: '/search' },
    { id: 'livetv', icon: Tv, label: t.liveTv, path: '/livetv' },
    { id: 'watchlist', icon: Bookmark, label: t.watchlist, path: '/watchlist' },
    { id: 'profile', icon: User, label: t.profile, path: '/profile' },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-[#1a1d24] border-r border-neutral-800 h-screen sticky top-0 overflow-y-auto shrink-0 transition-all duration-300">
      <div className="p-8">
        {/* Logo removed as requested */}
      </div>

      <nav className="flex-1 px-4 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.id}
              href={item.path}
              className={`w-full flex items-center space-x-4 px-4 py-3.5 rounded-xl transition-all duration-300 ${
                isActive
                  ? 'bg-red-600 text-white shadow-lg shadow-red-600/20'
                  : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
              }`}
            >
              <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              <span className={`font-semibold ${isActive ? 'text-white' : ''}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="p-6 border-t border-neutral-800">
        <div className="bg-neutral-900/50 rounded-2xl p-4 border border-neutral-800">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white font-bold">
              A
            </div>
            <div>
              <p className="text-sm font-bold text-white">Guest User</p>
              <p className="text-[10px] text-neutral-500 uppercase tracking-wider font-bold">Free Plan</p>
            </div>
          </div>
          <button className="w-full flex items-center justify-center space-x-2 py-2 text-xs font-bold text-neutral-400 hover:text-white transition-colors">
            <LogOut size={14} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
