import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../api/supabase';
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
  const globalChannelRef = useRef<any>(null);
  const currentUser = user?.name || '';

  // Check pending invites
  const checkPendingInvites = useCallback(async (activeUsername: string) => {
    if (!activeUsername || activeUsername === 'User Name') return;
    try {
      const { data } = await supabase.from('settings').select('value').eq('key', 'watch_party_invites').maybeSingle();
      if (data?.value) {
        const list: WatchPartyInvite[] = JSON.parse(data.value);
        const pending = list.find(inv => 
          inv.guest_username.trim().toLowerCase() === activeUsername.trim().toLowerCase() && 
          inv.status === 'pending'
        );
        if (pending && (!incomingInvite || incomingInvite.id !== pending.id)) {
          setIncomingInvite(pending);
        }
      }
    } catch (e) {
      console.warn('Check invites error:', e);
    }
  }, [incomingInvite]);

  // Global Realtime Broadcast listener for invites
  useEffect(() => {
    if (!currentUser || currentUser === 'User Name') return;

    checkPendingInvites(currentUser);

    const globalChannel = supabase.channel('global_watch_parties', {
      config: { broadcast: { self: false } }
    });

    globalChannel
      .on('broadcast', { event: 'new_invite' }, ({ payload }) => {
        if (payload?.guest_username && payload.guest_username.trim().toLowerCase() === currentUser.trim().toLowerCase()) {
          setIncomingInvite(payload);
        }
      })
      .subscribe();

    globalChannelRef.current = globalChannel;

    const interval = setInterval(() => checkPendingInvites(currentUser), 3000);

    return () => {
      clearInterval(interval);
      if (globalChannelRef.current) {
        supabase.removeChannel(globalChannelRef.current);
      }
    };
  }, [currentUser, checkPendingInvites]);

  // Send Invite
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

      // Broadcast global invite signal
      if (globalChannelRef.current) {
        globalChannelRef.current.send({
          type: 'broadcast',
          event: 'new_invite',
          payload: newInvite
        });
      }

      setActiveInvite(newInvite);
      setIsHost(true);
      setPartnerUsername(friendUsername);
      setIsInParty(true);
      setupPartyChannel(newInvite);

      const shareUrl = `https://myflim.com/?movie=${movie.id}&party=${inviteId}`;
      return { success: true, invite: newInvite, shareUrl };
    } catch (e: any) {
      return { success: false, message: e.message || 'ناردنی داوەتنامە سەرکەوتوو نەبوو.' };
    }
  };

  // Accept Invite
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

  // Decline Invite
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

  // Setup Realtime Broadcast Channel
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

  // Broadcast Master Video Commands
  const broadcastVideoSync = useCallback((type: 'PLAY' | 'PAUSE' | 'SEEK', currentTime: number) => {
    if (!channelRef.current || !isHost) return;
    channelRef.current.send({
      type: 'broadcast',
      event: 'video_sync',
      payload: { type, currentTime, timestamp: Date.now() }
    });
  }, [isHost]);

  // Toggle Mic state
  const toggleMic = () => {
    setIsMicOn(prev => !prev);
  };

  // Leave Party
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
