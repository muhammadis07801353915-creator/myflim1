'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Home, Search, Tv, LayoutGrid, User, Bookmark, Film, Tv2 } from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';
import { getUserAccount } from '../lib/userAuth';

export default function Sidebar({ currentTab, onChange }: { currentTab?: string, onChange?: (tab: string) => void }) {
  const { t, language } = useLanguage();
  const pathname = usePathname();
  const user = typeof window !== 'undefined' ? getUserAccount() : null;

  const navItems = [
    { id: 'home', icon: Home, label: t.home, path: '/' },
    { id: 'search', icon: Search, label: t.search, path: '/search' },
    { id: 'livetv', icon: Tv, label: t.liveTv, path: '/livetv' },
    { id: 'posts', icon: LayoutGrid, label: language === 'ku' ? 'پۆستەکان' : language === 'ar' ? 'المنشورات' : 'Posts', path: '/posts' },
    { id: 'watchlist', icon: Bookmark, label: language === 'ku' ? 'لیستی من' : language === 'ar' ? 'قائمتي' : 'Watchlist', path: '/watchlist' },
    { id: 'profile', icon: User, label: t.profile, path: '/profile' },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-[#12131a]/95 backdrop-blur-2xl border-r border-white/10 h-screen sticky top-0 overflow-y-auto shrink-0 transition-all duration-300 z-50">
      {/* Brand Header */}
      <div className="p-6 border-b border-white/5 flex items-center space-x-3 cursor-pointer" onClick={() => onChange ? onChange('home') : null}>
        <Image 
          src="/app-logo-new.png" 
          alt="Taban Play" 
          width={40} 
          height={40} 
          className="object-contain hover:scale-105 transition" 
          unoptimized 
        />
        <div className="flex items-baseline space-x-1">
          <span className="text-xl font-black text-white tracking-tight">Taban</span>
          <span className="text-xl font-black text-[#CC222F] tracking-tight">Play</span>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-3 py-6 space-y-1.5">
        <p className="px-4 text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-2">
          {language === 'ku' ? 'مێنیوی سەرەکی' : 'Main Menu'}
        </p>

        {navItems.map((item) => {
          const isActive = onChange ? currentTab === item.id : pathname === item.path;
          return (
            <Link
              key={item.id}
              href={onChange ? '#' : item.path}
              onClick={(e) => {
                if (onChange) {
                  e.preventDefault();
                  onChange(item.id);
                }
              }}
              className={`w-full flex items-center space-x-3.5 px-4 py-3 rounded-2xl transition-all duration-300 group font-bold text-sm ${
                isActive
                  ? 'bg-gradient-to-r from-[#CC222F]/20 to-transparent text-white border-l-4 border-[#CC222F] shadow-lg shadow-red-600/10'
                  : 'text-neutral-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <item.icon size={20} className={`transition-transform duration-300 ${isActive ? 'text-[#CC222F] scale-110' : 'group-hover:scale-110'}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Account Card at Bottom */}
      <div className="p-4 border-t border-white/5">
        <div 
          onClick={() => onChange ? onChange('profile') : null}
          className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-3.5 flex items-center space-x-3 cursor-pointer transition"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#CC222F] to-red-700 flex items-center justify-center text-white font-bold text-sm shadow-md">
            {user?.name ? user.name.slice(0, 2).toUpperCase() : 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white truncate">{user?.name || (language === 'ku' ? 'میوان' : 'Guest User')}</p>
            <p className="text-[10px] text-emerald-400 font-bold">{language === 'ku' ? 'VIP دەستگەیشتن' : 'Full Access'}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
