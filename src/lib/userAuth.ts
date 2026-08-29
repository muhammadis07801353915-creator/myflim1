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
  platform?: 'App' | 'Web';
  createdAt: string;
}

export async function recordDailyVisit(platform: 'App' | 'Web', userId?: string) {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const uid = userId || `user_${Math.random().toString(36).substring(2, 8)}`;

    const { data } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'taban_daily_active_users_history')
      .maybeSingle();

    let history: Record<string, { appUsers: string[]; webUsers: string[] }> = {};
    if (data?.value) {
      try {
        history = JSON.parse(data.value);
      } catch (e) {}
    }

    if (!history[todayStr]) {
      history[todayStr] = { appUsers: [], webUsers: [] };
    }

    if (platform === 'App') {
      const arr = Array.isArray(history[todayStr].appUsers) ? history[todayStr].appUsers : [];
      if (!arr.includes(uid)) arr.push(uid);
      history[todayStr].appUsers = arr;
    } else {
      const arr = Array.isArray(history[todayStr].webUsers) ? history[todayStr].webUsers : [];
      if (!arr.includes(uid)) arr.push(uid);
      history[todayStr].webUsers = arr;
    }

    const { data: existing } = await supabase
      .from('settings')
      .select('key')
      .eq('key', 'taban_daily_active_users_history')
      .maybeSingle();

    if (existing) {
      await supabase.from('settings').update({ value: JSON.stringify(history) }).eq('key', 'taban_daily_active_users_history');
    } else {
      await supabase.from('settings').insert({ key: 'taban_daily_active_users_history', value: JSON.stringify(history) });
    }
  } catch (e) {
    console.warn('recordDailyVisit error:', e);
  }
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

async function fetchRemoteAccountsDB(): Promise<StoredUserAccount[]> {
  const localAccs = getAccountsDB();
  try {
    const { data } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'taban_registered_user_accounts')
      .maybeSingle();

    if (data && data.value) {
      const remoteAccs: StoredUserAccount[] = JSON.parse(data.value);
      const mergedMap = new Map<string, StoredUserAccount>();
      [...remoteAccs, ...localAccs].forEach(acc => {
        if (acc && acc.username) {
          mergedMap.set(acc.username.toLowerCase(), acc);
        }
      });
      const mergedList = Array.from(mergedMap.values());
      saveAccountsDB(mergedList);
      return mergedList;
    }
  } catch (e) {
    console.warn('Error fetching remote accounts DB:', e);
  }
  return localAccs;
}

async function syncSaveAccountsDB(accounts: StoredUserAccount[]) {
  saveAccountsDB(accounts);
  try {
    const { data } = await supabase
      .from('settings')
      .select('id')
      .eq('key', 'taban_registered_user_accounts')
      .maybeSingle();

    if (data && data.id) {
      await supabase
        .from('settings')
        .update({ value: JSON.stringify(accounts) })
        .eq('key', 'taban_registered_user_accounts');
    } else {
      await supabase
        .from('settings')
        .insert([{ key: 'taban_registered_user_accounts', value: JSON.stringify(accounts) }]);
    }
  } catch (e) {
    console.warn('Error saving remote accounts DB:', e);
  }
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
  if (normalizedCode !== 'taban play1' && normalizedCode !== 'tabanplay1' && normalizedCode !== 'myflim1' && normalizedCode !== 'taban2026') {
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

  const accounts = await fetchRemoteAccountsDB();
  const existing = accounts.find(a => a.username.toLowerCase() === trimmedUser.toLowerCase());
  if (existing) {
    return {
      success: false,
      message: 'ئەم ناوی بەکارهێنەرە پێشتر بەکارهاتووە، تکایە ناوێکی تر هەڵبژێرە یان چوونە ژوورەوە بکە.'
    };
  }

  const newId = 'usr_' + trimmedUser.toLowerCase();
  const finalAvatar = avatar || DEFAULT_AVATARS[0];

  const newAccount: StoredUserAccount = {
    id: newId,
    username: trimmedUser,
    password: trimmedPass,
    avatar: finalAvatar,
    platform: 'Web',
    createdAt: new Date().toISOString()
  };

  accounts.push(newAccount);
  await syncSaveAccountsDB(accounts);

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

  const accounts = await fetchRemoteAccountsDB();
  const account = accounts.find(a => a.username.toLowerCase() === trimmedUser.toLowerCase());

  if (!account) {
    return {
      success: false,
      message: 'هیچ ئەکاونتێک دروست نەکراوە بەم ناوی بەکارهێنەرە. تکایە سەرەتا ئەکاونت دروست بکه.'
    };
  }

  // Verify password strictly!
  if (account.password && account.password.trim() !== trimmedPass) {
    return {
      success: false,
      message: 'وشەی نهێنی (پاسۆرد) هەڵەیە! تکایە پاسۆردی ڕاستەقینە بنووسە.'
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
