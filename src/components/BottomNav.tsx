'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Tv, Bookmark, User } from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';

export default function BottomNav({ currentTab, onChange }: { currentTab?: string, onChange?: (tab: string) => void }) {
  const { t } = useLanguage();
  const pathname = usePathname();
  
  const tabs = [
    { id: 'home', icon: Home, label: t.home, path: '/' },
    { id: 'search', icon: Search, label: t.search, path: '/search' },
    { id: 'livetv', icon: Tv, label: t.liveTv, path: '/livetv' },
    { id: 'watchlist', icon: Bookmark, label: t.watchlist, path: '/watchlist' },
    { id: 'profile', icon: User, label: t.profile, path: '/profile' },
  ];

  return (
    <div className="fixed bottom-0 w-full bg-neutral-900 light-mode:bg-white border-t border-neutral-800 light-mode:border-neutral-200 flex justify-around items-center p-3 z-50 pb-safe">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = pathname === tab.path;
        return (
          <Link
            key={tab.id}
            href={onChange ? '#' : tab.path}
            onClick={(e) => {
              if (onChange) {
                e.preventDefault();
                onChange(tab.id);
              }
            }}
            className={`flex flex-col items-center space-y-1 ${(onChange ? currentTab === tab.id : isActive) ? 'text-red-500' : 'text-neutral-400 hover:text-neutral-200'}`}
          >
            <Icon size={24} className={isActive ? 'fill-current' : ''} />
            <span className="text-[10px] font-medium">{tab.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
