import { supabase } from './supabase';

export const getDeviceId = () => {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem('device_id');
  if (!id) {
    id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('device_id', id);
  }
  return id;
};

export const getProStatusLocal = () => {
  if (typeof window === 'undefined') return false;
  const proData = localStorage.getItem('pro_data');
  if (!proData) return false;
  try {
    const { expires_at } = JSON.parse(proData);
    if (new Date(expires_at) > new Date()) {
      return true;
    } else {
      localStorage.removeItem('pro_data');
      return false;
    }
  } catch (e) {
    return false;
  }
};

export const setProStatus = (code: string, expires_at: string) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('pro_data', JSON.stringify({ code, expires_at }));
};

export const verifyProStatus = async () => {
  if (typeof window === 'undefined') return false;
  const proData = localStorage.getItem('pro_data');
  if (!proData) return false;
  
  try {
    const { code, expires_at } = JSON.parse(proData);
    
    // Check local expiry first
    if (new Date(expires_at) < new Date()) {
      localStorage.removeItem('pro_data');
      return false;
    }

    // Verify with server to ensure this device still owns the code
    const deviceId = getDeviceId();
    const { data, error } = await supabase
      .from('promo_codes')
      .select('device_id, expires_at')
      .eq('code', code)
      .single();

    if (error || !data) {
      localStorage.removeItem('pro_data');
      return false;
    }

    if (new Date(data.expires_at) < new Date()) {
      localStorage.removeItem('pro_data');
      return false;
    }

    if (data.device_id !== deviceId) {
      // Another device has claimed this code
      localStorage.removeItem('pro_data');
      return false;
    }

    return true;
  } catch (e) {
    return false;
  }
};
