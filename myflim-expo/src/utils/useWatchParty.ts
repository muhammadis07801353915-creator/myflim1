import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../api/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppStore } from '../store/useAppStore';

export interface WatchPartyInvite {
  id: string;
  host_username: string;
  guest_username: string;
  movie_id: string | number;
  movie_title: string;
  movie_image?: string;
  status: 'pending' | 'accepted' | 'declined' | 'ended';
  created_at: string;
}

export function useWatchParty() {
  const { user } = useAppStore();
  const [activeInvite, setActiveInvite] = useState<WatchPartyInvite | null>(null);
  const [incomingInvite, setIncomingInvite] = useState<WatchPartyInvite | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [isInParty, setIsInParty] = useState(false);
  const [isMicOn, setIsMicOn] = useState(false);
  const [partnerUsername, setPartnerUsername] = useState<string>('');

  const channelRef = useRef<any>(null);
  const currentUser = user?.name || 'User';

  // 1. Listen for incoming Watch Together invites
  useEffect(() => {
    if (!currentUser || currentUser === 'User Name') return;

    const checkInvites = async () => {
      try {
        const { data } = await supabase.from('settings').select('value').eq('key', 'watch_party_invites').maybeSingle();
        if (data?.value) {
          const list: WatchPartyInvite[] = JSON.parse(data.value);
          const pending = list.find(inv => inv.guest_username.toLowerCase() === currentUser.toLowerCase() && inv.status === 'pending');
          if (pending && (!incomingInvite || incomingInvite.id !== pending.id)) {
            setIncomingInvite(pending);
          }
        }
      } catch (e) {
        console.warn('Check invites error:', e);
      }
    };

    checkInvites();
    const interval = setInterval(checkInvites, 4000);
    return () => clearInterval(interval);
  }, [currentUser, incomingInvite]);

  // 2. Send Invite
  const sendInvite = async (friendUsername: string, movie: any) => {
    if (!currentUser || currentUser === 'User Name') {
      return { success: false, message: 'تکایە سەرەتا ئەکاونت دروست بکە یان چوونە ژوورەوە بکە.' };
    }

    const inviteId = `wp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const newInvite: WatchPartyInvite = {
      id: inviteId,
      host_username: currentUser,
      guest_username: friendUsername.trim(),
      movie_id: movie.id,
      movie_title: movie.title || movie.name || 'Movie',
      movie_image: movie.image,
      status: 'pending',
      created_at: new Date().toISOString()
    };

    try {
      const { data } = await supabase.from('settings').select('value').eq('key', 'watch_party_invites').maybeSingle();
      let list: WatchPartyInvite[] = data?.value ? JSON.parse(data.value) : [];
      list = [newInvite, ...list.filter(i => Date.now() - new Date(i.created_at).getTime() < 86400000)].slice(0, 50);

      await supabase.from('settings').upsert({ key: 'watch_party_invites', value: JSON.stringify(list) });

      setActiveInvite(newInvite);
      setIsHost(true);
      setPartnerUsername(friendUsername);
      setIsInParty(true);
      setupPartyChannel(newInvite);

      return { success: true, invite: newInvite };
    } catch (e: any) {
      return { success: false, message: e.message || 'ناردنی داوەتنامە سەرکەوتوو نەبوو.' };
    }
  };

  // 3. Accept Invite
  const acceptInvite = async (invite: WatchPartyInvite) => {
    try {
      const { data } = await supabase.from('settings').select('value').eq('key', 'watch_party_invites').maybeSingle();
      if (data?.value) {
        let list: WatchPartyInvite[] = JSON.parse(data.value);
        list = list.map(inv => inv.id === invite.id ? { ...inv, status: 'accepted' } : inv);
        await supabase.from('settings').upsert({ key: 'watch_party_invites', value: JSON.stringify(list) });
      }

      const updatedInvite = { ...invite, status: 'accepted' as const };
      setActiveInvite(updatedInvite);
      setIncomingInvite(null);
      setIsHost(false);
      setPartnerUsername(invite.host_username);
      setIsInParty(true);
      setupPartyChannel(updatedInvite);
    } catch (e) {
      console.warn('Accept invite error:', e);
    }
  };

  // 4. Decline Invite
  const declineInvite = async (inviteId: string) => {
    setIncomingInvite(null);
    try {
      const { data } = await supabase.from('settings').select('value').eq('key', 'watch_party_invites').maybeSingle();
      if (data?.value) {
        let list: WatchPartyInvite[] = JSON.parse(data.value);
        list = list.map(inv => inv.id === inviteId ? { ...inv, status: 'declined' } : inv);
        await supabase.from('settings').upsert({ key: 'watch_party_invites', value: JSON.stringify(list) });
      }
    } catch (e) {}
  };

  // 5. Setup Realtime Broadcast Channel
  const setupPartyChannel = (invite: WatchPartyInvite) => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channelName = `watch_party_${invite.id}`;
    const channel = supabase.channel(channelName, {
      config: { broadcast: { self: false } }
    });

    channel
      .on('broadcast', { event: 'party_ended' }, () => {
        leaveParty();
      })
      .subscribe();

    channelRef.current = channel;
  };

  // 6. Broadcast Master Video Commands
  const broadcastVideoSync = useCallback((type: 'PLAY' | 'PAUSE' | 'SEEK', currentTime: number) => {
    if (!channelRef.current || !isHost) return;
    channelRef.current.send({
      type: 'broadcast',
      event: 'video_sync',
      payload: { type, currentTime, timestamp: Date.now() }
    });
  }, [isHost]);

  // 7. Toggle Mic state
  const toggleMic = () => {
    setIsMicOn(prev => !prev);
  };

  // 8. Leave Party
  const leaveParty = () => {
    if (channelRef.current) {
      if (isHost) {
        channelRef.current.send({ type: 'broadcast', event: 'party_ended', payload: {} });
      }
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    setIsInParty(false);
    setActiveInvite(null);
    setIsHost(false);
    setIsMicOn(false);
  };

  return {
    activeInvite,
    incomingInvite,
    isHost,
    isInParty,
    isMicOn,
    partnerUsername,
    sendInvite,
    acceptInvite,
    declineInvite,
    broadcastVideoSync,
    toggleMic,
    leaveParty,
    channelRef
  };
}
