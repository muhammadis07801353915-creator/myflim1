'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from './supabase';
import { getUserAccount } from './userAuth';

export interface WatchPartyInvite {
  id: string;
  host_username: string;
  host_avatar?: string;
  guest_username: string;
  movie_id: string | number;
  movie_title: string;
  movie_image?: string;
  status: 'pending' | 'accepted' | 'declined' | 'ended';
  created_at: string;
}

export function useWatchParty() {
  const [activeInvite, setActiveInvite] = useState<WatchPartyInvite | null>(null);
  const [incomingInvite, setIncomingInvite] = useState<WatchPartyInvite | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [isInParty, setIsInParty] = useState(false);
  const [isMicOn, setIsMicOn] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [partnerUsername, setPartnerUsername] = useState<string>('');

  const channelRef = useRef<any>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

  const currentUser = getUserAccount()?.name || 'User';

  // 1. Listen for incoming invitations
  useEffect(() => {
    if (!currentUser || currentUser === 'User') return;

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

  // 2. Send Invitation to a friend
  const sendInvite = async (friendUsername: string, movie: any) => {
    if (!currentUser) return { success: false, message: 'تکایە سەرەتا ئەکاونت دروست بکە یان چوونە ژوورەوە بکە.' };

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
      // Keep recent 50 invites
      list = [newInvite, ...list.filter(i => Date.now() - new Date(i.created_at).getTime() < 86400000)].slice(0, 50);

      await supabase.from('settings').upsert({ key: 'watch_party_invites', value: JSON.stringify(list) });

      setActiveInvite(newInvite);
      setIsHost(true);
      setPartnerUsername(friendUsername);
      setIsInParty(true);
      setupPartyChannel(newInvite, true);

      return { success: true, invite: newInvite };
    } catch (e: any) {
      return { success: false, message: e.message || 'ناردنی داوەتنامە سەرکەوتوو نەبوو.' };
    }
  };

  // 3. Accept Invitation
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
      setupPartyChannel(updatedInvite, false);
    } catch (e) {
      console.warn('Accept invite error:', e);
    }
  };

  // 4. Decline Invitation
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

  // 5. Setup Supabase Realtime Broadcast Channel & WebRTC P2P Voice
  const setupPartyChannel = (invite: WatchPartyInvite, hostRole: boolean) => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channelName = `watch_party_${invite.id}`;
    const channel = supabase.channel(channelName, {
      config: { broadcast: { self: false } }
    });

    channel
      .on('broadcast', { event: 'webrtc_signal' }, ({ payload }) => {
        handleWebRTCSignal(payload);
      })
      .on('broadcast', { event: 'party_ended' }, () => {
        leaveParty();
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setConnectionStatus('connected');
        }
      });

    channelRef.current = channel;
  };

  // 6. Broadcast Video Control Commands (Play, Pause, Seek) from Host
  const broadcastVideoSync = useCallback((type: 'PLAY' | 'PAUSE' | 'SEEK', currentTime: number) => {
    if (!channelRef.current || !isHost) return;
    channelRef.current.send({
      type: 'broadcast',
      event: 'video_sync',
      payload: { type, currentTime, timestamp: Date.now() }
    });
  }, [isHost]);

  // 7. WebRTC P2P Voice Setup (Zero Server / DB Audio Overhead)
  const toggleMic = async () => {
    if (isMicOn) {
      // Mute
      if (localStreamRef.current) {
        localStreamRef.current.getAudioTracks().forEach(t => { t.enabled = false; });
      }
      setIsMicOn(false);
    } else {
      // Enable Mic
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        localStreamRef.current = stream;
        setIsMicOn(true);

        if (peerRef.current) {
          stream.getTracks().forEach(track => peerRef.current?.addTrack(track, stream));
        } else {
          initWebRTCConnection(stream);
        }
      } catch (e) {
        console.warn('Microphone access error:', e);
        alert('مۆڵەتی میکڕۆفۆن بەردەست نییە.');
      }
    }
  };

  const initWebRTCConnection = (stream: MediaStream) => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });

    stream.getTracks().forEach(track => pc.addTrack(track, stream));

    pc.onicecandidate = (event) => {
      if (event.candidate && channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'webrtc_signal',
          payload: { candidate: event.candidate, sender: currentUser }
        });
      }
    };

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        if (!remoteAudioRef.current) {
          const audio = new Audio();
          audio.autoplay = true;
          remoteAudioRef.current = audio;
        }
        remoteAudioRef.current.srcObject = event.streams[0];
      }
    };

    peerRef.current = pc;

    if (isHost) {
      pc.createOffer().then(offer => {
        pc.setLocalDescription(offer);
        channelRef.current?.send({
          type: 'broadcast',
          event: 'webrtc_signal',
          payload: { offer, sender: currentUser }
        });
      });
    }
  };

  const handleWebRTCSignal = async (payload: any) => {
    if (payload.sender === currentUser) return;
    const pc = peerRef.current;

    if (payload.offer && pc) {
      await pc.setRemoteDescription(new RTCSessionDescription(payload.offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      channelRef.current?.send({
        type: 'broadcast',
        event: 'webrtc_signal',
        payload: { answer, sender: currentUser }
      });
    } else if (payload.answer && pc) {
      await pc.setRemoteDescription(new RTCSessionDescription(payload.answer));
    } else if (payload.candidate && pc) {
      await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
    }
  };

  // 8. Leave / End Watch Party
  const leaveParty = () => {
    if (channelRef.current) {
      if (isHost) {
        channelRef.current.send({ type: 'broadcast', event: 'party_ended', payload: {} });
      }
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
    }

    if (peerRef.current) {
      peerRef.current.close();
      peerRef.current = null;
    }

    setIsInParty(false);
    setActiveInvite(null);
    setIsHost(false);
    setIsMicOn(false);
    setConnectionStatus('idle');
  };

  return {
    activeInvite,
    incomingInvite,
    isHost,
    isInParty,
    isMicOn,
    connectionStatus,
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
