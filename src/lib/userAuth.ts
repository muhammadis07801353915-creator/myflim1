import { supabase } from './supabase';

export interface UserAccount {
  id: string;
  name: string;
  avatar: string;
  isUnlocked: boolean;
}

export const DEFAULT_AVATARS = [
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?q=80&w=200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop',
];

export function getUserAccount(): UserAccount | null {
  if (typeof window === 'undefined') return null;
  const name = localStorage.getItem('myfilm_user_name');
  if (!name) return null;

  let id = localStorage.getItem('myfilm_user_id');
  if (!id) {
    id = 'user_' + Math.random().toString(36).substring(2, 10);
    localStorage.setItem('myfilm_user_id', id);
  }

  const avatar = localStorage.getItem('myfilm_user_avatar') || DEFAULT_AVATARS[0];
  const proData = localStorage.getItem('pro_data');
  const isUnlocked = !!proData || !!name;

  return { id, name, avatar, isUnlocked };
}

export async function registerUserAccount(name: string, avatar?: string): Promise<UserAccount> {
  const trimmedName = name.trim();
  let id = localStorage.getItem('myfilm_user_id');
  if (!id) {
    id = 'user_' + Math.random().toString(36).substring(2, 10);
    localStorage.setItem('myfilm_user_id', id);
  }

  const finalAvatar = avatar || localStorage.getItem('myfilm_user_avatar') || DEFAULT_AVATARS[0];

  localStorage.setItem('myfilm_user_name', trimmedName);
  localStorage.setItem('myfilm_user_avatar', finalAvatar);
  localStorage.setItem('pro_data', JSON.stringify({
    code: 'Taban Play1',
    expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
  }));

  // Sync to Supabase profiles
  try {
    await supabase.from('profiles').upsert({
      id,
      display_name: trimmedName,
      avatar_url: finalAvatar,
      updated_at: new Date().toISOString()
    });
  } catch (e) {
    console.warn('Supabase profile sync warning:', e);
  }

  // Notify components
  window.dispatchEvent(new Event('userAccountUpdated'));

  return { id, name: trimmedName, avatar: finalAvatar, isUnlocked: true };
}

export async function loginUserAccount(name: string): Promise<UserAccount> {
  return registerUserAccount(name);
}

export function logoutUserAccount() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('myfilm_user_name');
  localStorage.removeItem('myfilm_user_avatar');
  localStorage.removeItem('pro_data');
  window.dispatchEvent(new Event('userAccountUpdated'));
}
