import { supabase } from './supabase';

export interface UserAccount {
  id: string;
  name: string;
  avatar: string;
  isUnlocked: boolean;
}

export interface StoredUserAccount {
  id: string;
  username: string;
  password: string;
  avatar: string;
  createdAt: string;
}

export const DEFAULT_AVATARS = [
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?q=80&w=200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop',
];

function getAccountsDB(): StoredUserAccount[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('myfilm_registered_users');
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveAccountsDB(accounts: StoredUserAccount[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('myfilm_registered_users', JSON.stringify(accounts));
}

export function getUserAccount(): UserAccount | null {
  if (typeof window === 'undefined') return null;
  const name = localStorage.getItem('myfilm_user_name');
  if (!name) return null;

  let id = localStorage.getItem('myfilm_user_id');
  if (!id || id.startsWith('user_')) {
    id = 'usr_' + name.trim().toLowerCase();
    localStorage.setItem('myfilm_user_id', id);
  }

  const avatar = localStorage.getItem('myfilm_user_avatar') || DEFAULT_AVATARS[0];
  const proData = localStorage.getItem('pro_data');
  const isUnlocked = !!proData || !!name;

  return { id, name, avatar, isUnlocked };
}

export async function registerUserAccount(data: {
  code: string;
  username: string;
  password: string;
  avatar?: string;
}): Promise<{ success: boolean; message?: string; user?: UserAccount }> {
  const { code, username, password, avatar } = data;

  const normalizedCode = code.trim().toLowerCase();
  if (normalizedCode !== 'taban play1' && normalizedCode !== 'tabanplay1') {
    return {
      success: false,
      message: 'کۆدەکە هەڵەیە! تکایە کۆدی Taban Play1 بنووسە.'
    };
  }

  const trimmedUser = username.trim();
  if (!trimmedUser) {
    return {
      success: false,
      message: 'تکایە ناوی بەکارهێنەر بنووسە.'
    };
  }

  const trimmedPass = password.trim();
  if (!trimmedPass) {
    return {
      success: false,
      message: 'تکایە وشەی نهێنی (پاسۆرد) بنووسە.'
    };
  }

  const accounts = getAccountsDB();
  const existing = accounts.find(a => a.username.toLowerCase() === trimmedUser.toLowerCase());
  if (existing) {
    return {
      success: false,
      message: 'ئەم ناوی بەکارهێنەرە پێشتر بەکارهاتووە، تکایە ناوێکی تر هەڵبژێرە یان چوونە ژوورەوە بکە.'
    };
  }

  const newId = 'user_' + Math.random().toString(36).substring(2, 10);
  const finalAvatar = avatar || DEFAULT_AVATARS[0];

  const newAccount: StoredUserAccount = {
    id: newId,
    username: trimmedUser,
    password: trimmedPass,
    avatar: finalAvatar,
    createdAt: new Date().toISOString()
  };

  accounts.push(newAccount);
  saveAccountsDB(accounts);

  // Set active session
  localStorage.setItem('myfilm_user_id', newId);
  localStorage.setItem('myfilm_user_name', trimmedUser);
  localStorage.setItem('myfilm_user_avatar', finalAvatar);
  localStorage.setItem('pro_data', JSON.stringify({
    code: 'Taban Play1',
    expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
  }));

  // Sync profile to Supabase
  try {
    await supabase.from('profiles').upsert({
      id: newId,
      display_name: trimmedUser,
      avatar_url: finalAvatar,
      updated_at: new Date().toISOString()
    });
  } catch (e) {
    console.warn('Supabase sync warning:', e);
  }

  window.dispatchEvent(new Event('userAccountUpdated'));

  return {
    success: true,
    user: { id: newId, name: trimmedUser, avatar: finalAvatar, isUnlocked: true }
  };
}

export async function loginUserAccount(data: {
  username: string;
  password: string;
}): Promise<{ success: boolean; message?: string; user?: UserAccount }> {
  const trimmedUser = data.username.trim();
  const trimmedPass = data.password.trim();

  if (!trimmedUser) {
    return {
      success: false,
      message: 'تکایە ناوی بەکارهێنەر بنووسە.'
    };
  }

  if (!trimmedPass) {
    return {
      success: false,
      message: 'تکایە وشەی نهێنی (پاسۆرد) بنووسە.'
    };
  }

  const accounts = getAccountsDB();
  const account = accounts.find(a => a.username.toLowerCase() === trimmedUser.toLowerCase());

  if (!account) {
    return {
      success: false,
      message: 'هیچ ئەکاونتێک دروست نەکراوە بەم ناوی بەکارهێنەرە. تکایە سەرەتا ئەکاونت دروست بکه.'
    };
  }

  if (account.password !== trimmedPass) {
    return {
      success: false,
      message: 'ببوورە! وشەی نهێنی (پاسۆرد) هەڵەیە.'
    };
  }

  // Password matched! Set active session
  localStorage.setItem('myfilm_user_id', account.id);
  localStorage.setItem('myfilm_user_name', account.username);
  localStorage.setItem('myfilm_user_avatar', account.avatar || DEFAULT_AVATARS[0]);
  localStorage.setItem('pro_data', JSON.stringify({
    code: 'Taban Play1',
    expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
  }));

  window.dispatchEvent(new Event('userAccountUpdated'));

  return {
    success: true,
    user: { id: account.id, name: account.username, avatar: account.avatar || DEFAULT_AVATARS[0], isUnlocked: true }
  };
}

export function logoutUserAccount() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('myfilm_user_name');
  localStorage.removeItem('myfilm_user_avatar');
  localStorage.removeItem('pro_data');
  window.dispatchEvent(new Event('userAccountUpdated'));
}
