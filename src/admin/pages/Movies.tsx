'use client';
import { useState, useEffect } from 'react';
import { 
  Plus, Search, Edit, Trash2, Film, Tv, DownloadCloud, 
  Image as ImageIcon, Link as LinkIcon, Users, Settings, Type, Star, AlertCircle, Wrench, WifiOff
} from 'lucide-react';
import Image from 'next/image';
import { supabase } from '../../lib/supabase';
import ImageUpload from '../../components/ImageUpload';
import SubtitleUpload from '../../components/SubtitleUpload';

export default function Movies() {
  const [contentList, setContentList] = useState<any[]>([]);
  const [movieLists, setMovieLists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'form'>('list');
  const [activeTab, setActiveTab] = useState('basic');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    title: '', title_ar: '', title_en: '', type: 'Movie', genre: '', year: '', description: '', description_ar: '', description_en: '', rating: '', image: '', backdrop: '', duration: '',
    list_name: '',
    is_featured: false,
    is_pro: false,
    top_rank: '',
    status: 'Published',
    is_broken: false,
    download_url: '',
    servers: [{ name: 'Server 1', url: '', quality: 'Auto' }],
    subtitles: [{ label: 'Kurdish', url: '', lang: 'ku' }],
    episodes: [{ number: 1, title: '', servers: [{ name: 'Server 1', url: '', quality: 'Auto' }], subtitles: [] }]
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterList, setFilterList] = useState('All');
  const [filterIssue, setFilterIssue] = useState('All');

  const [showTmdbModal, setShowTmdbModal] = useState(false);
  const [tmdbSearch, setTmdbSearch] = useState('');
  const [tmdbResults, setTmdbResults] = useState<any[]>([]);
  const [tmdbLoading, setTmdbLoading] = useState(false);

  const TMDB_API_KEY = 'c2607383b5fe48c445465d4e8b1ded29';

  const searchTmdb = async () => {
    if (!tmdbSearch) return;
    setTmdbLoading(true);
    try {
      const resp = await fetch(`https://api.themoviedb.org/3/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(tmdbSearch)}`, {
        next: { revalidate: 86400 }, // Cache TMDB search results
        cache: 'force-cache'
      });
      const data = await resp.json();
      setTmdbResults(data.results || []);
    } catch (e) {
      console.error(e);
      alert('Error searching TMDB');
    } finally {
      setTmdbLoading(false);
    }
  };

  const selectTmdbItem = async (item: any) => {
    const type = (item.media_type === 'tv' || item.first_air_date) ? 'tv' : 'movie';
    try {
      const resp = await fetch(`https://api.themoviedb.org/3/${type}/${item.id}?api_key=${TMDB_API_KEY}`, {
        next: { revalidate: 86400 }, // Cache individual TMDB details
        cache: 'force-cache'
      });
      const details = await resp.json();
      
      setFormData({
        ...formData,
        title: details.title || details.name || '',
        type: type === 'tv' ? 'Series' : 'Movie',
        description: details.overview || '',
        year: (details.release_date || details.first_air_date || '').split('-')[0],
        rating: details.vote_average?.toFixed(1) || '',
        genre: (details.genres || []).map((g: any) => g.name).join(', '),
        image: details.poster_path ? `https://image.tmdb.org/t/p/w500${details.poster_path}` : '',
        backdrop: details.backdrop_path ? `https://image.tmdb.org/t/p/original${details.backdrop_path}` : ''
      });
      setShowTmdbModal(false);
      setTmdbResults([]);
      setTmdbSearch('');
    } catch (e) {
      console.error(e);
      alert('Error fetching details from TMDB');
    }
  };

  const tabs = [
    { id: 'basic', name: 'Basic Info', icon: <Film size={18} /> },
    { id: 'sources', name: 'Video Sources', icon: <LinkIcon size={18} /> },
    { id: 'episodes', name: 'Episodes', icon: <Tv size={18} />, hidden: formData.type !== 'Series' },
    { id: 'subtitles', name: 'Subtitles', icon: <Type size={18} /> },
    { id: 'cast', name: 'Cast & Crew', icon: <Users size={18} /> },
    { id: 'advanced', name: 'Advanced Settings', icon: <Settings size={18} /> },
  ];

  useEffect(() => {
    fetchMovies();
    fetchMovieLists();
  }, []);

  const fetchMovieLists = async () => {
    const { data } = await supabase.from('movie_lists').select('*').order('order_index', { ascending: true });
    if (data) setMovieLists(data);
  };

  const fetchMovies = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('movies')
      .select('*')
      .order('id', { ascending: false });
    
    if (error) {
      console.error("Error fetching movies:", error);
      setErrorMsg(`Error loading movies: ${error.message}`);
    }
    if (data) {
      setContentList(data);
    }
    setLoading(false);
  };

  const toggleBroken = async (item: any) => {
    const newBrokenState = !item.is_broken;
    // Optimistically update local state immediately
    setContentList(prev => prev.map(m => m.id === item.id ? { ...m, is_broken: newBrokenState } : m));
    // Persist to Supabase
    const { error } = await supabase
      .from('movies')
      .update({ is_broken: newBrokenState })
      .eq('id', item.id);
    if (error) {
      console.error('Error toggling broken state:', error);
      // Revert on error
      setContentList(prev => prev.map(m => m.id === item.id ? { ...m, is_broken: item.is_broken } : m));
    }
  };

  const handleAddNew = () => {
    setFormData({ 
      title: '', title_ar: '', title_en: '', type: 'Movie', genre: '', year: '', description: '', description_ar: '', description_en: '', rating: '', image: '', backdrop: '', duration: '',
      list_name: '',
      is_featured: false,
      is_pro: false,
      top_rank: '',
      status: 'Published',
      is_broken: false,
      download_url: '',
      servers: [{ name: 'Server 1', url: '', quality: 'Auto' }],
      subtitles: [],
      episodes: [{ number: 1, title: '', servers: [{ name: 'Server 1', url: '', quality: 'Auto' }], subtitles: [] }]
    });
    setEditingId(null);
    setErrorMsg(null);
    setActiveTab('basic');
    setView('form');
  };

  const handleEdit = (item: any) => {
    let parsedServers = [{ name: 'Server 1', url: item.video_url || '', quality: 'Auto' }];
    let parsedSubtitles: any[] = [];
    let parsedEpisodes = [{ number: 1, title: '', servers: [{ name: 'Server 1', url: '', quality: 'Auto' }], subtitles: [] }];

    try {
      if (item.video_url && item.video_url.startsWith('{')) {
        const parsed = JSON.parse(item.video_url);
        parsedServers = parsed.servers || parsedServers;
        parsedSubtitles = parsed.subtitles || [];
      } else if (item.video_url && item.video_url.startsWith('[')) {
        const parsed = JSON.parse(item.video_url);
        // Check if it's new episode format or old server format
        if (parsed.length > 0 && parsed[0].number !== undefined) {
          parsedEpisodes = parsed;
        } else {
          parsedServers = parsed;
        }
      }
    } catch (e) {
      console.error("Error parsing video_url", e);
    }

    setFormData({
      ...formData,
      title: item.title || '',
      title_ar: item.title_ar || '',
      title_en: item.title_en || '',
      type: item.type || 'Movie',
      genre: item.genre || '',
      year: item.year?.toString() || '',
      description: item.description || '',
      description_ar: item.description_ar || '',
      description_en: item.description_en || '',
      rating: item.rating?.toString() || '',
      image: item.image || '',
      backdrop: item.backdrop || '',
      duration: item.duration || '',
      list_name: item.list_name || '',
      is_featured: item.is_featured || false,
      is_pro: item.is_pro || false,
      top_rank: item.top_rank?.toString() || '',
      status: item.status || 'Published',
      is_broken: item.is_broken || false,
      download_url: item.download_url || '',
      servers: parsedServers,
      subtitles: parsedSubtitles,
      episodes: parsedEpisodes
    });
    setEditingId(item.id);
    setErrorMsg(null);
    setActiveTab('basic');
    setView('form');
  };

  const handleDelete = async (id: number) => {
    if(window.confirm('Are you sure you want to delete this item?')) {
      const { error } = await supabase.from('movies').delete().eq('id', id);
      if (!error) {
        setContentList(contentList.filter(item => item.id !== id));
      } else {
        alert('Error deleting movie: ' + error.message);
      }
    }
  };

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setErrorMsg(null);
    if (!formData.title) {
      setErrorMsg('Title is required!');
      return;
    }

    setSaving(true);
    const payload = {
      title: formData.title,
      title_ar: formData.title_ar,
      title_en: formData.title_en,
      type: formData.type,
      genre: formData.genre,
      year: formData.year && !isNaN(parseInt(formData.year)) ? parseInt(formData.year) : null,
      description: formData.description,
      description_ar: formData.description_ar,
      description_en: formData.description_en,
      rating: formData.rating && !isNaN(parseFloat(formData.rating)) ? parseFloat(formData.rating) : null,
      image: formData.image,
      backdrop: formData.backdrop,
      list_name: formData.list_name,
      is_featured: formData.is_featured,
      is_pro: formData.is_pro,
      status: formData.status,
      is_broken: formData.is_broken,
      download_url: formData.download_url,
      top_rank: formData.top_rank && !isNaN(parseInt(formData.top_rank)) ? parseInt(formData.top_rank) : null,
      video_url: formData.type === 'Series' 
        ? JSON.stringify(formData.episodes) 
        : JSON.stringify({ servers: formData.servers, subtitles: formData.subtitles })
    };

    try {
      if (editingId) {
        const { error } = await supabase.from('movies').update(payload).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('movies').insert([payload]);
        if (error) throw error;
      }
      
      fetchMovies();
      setView('list');
    } catch (err: any) {
      console.error('Supabase save error:', err);
      const msg = `کێشەیەک هەیە: ${err.message || 'هەڵەیەکی نەزانراو'}`;
      setErrorMsg(msg);
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  if (view === 'form') {
    return (
      <>
        <div className="text-white space-y-6 pb-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{editingId ? 'Edit Content' : 'Add New Content'}</h1>
            <p className="text-neutral-400 text-sm mt-1">Fill in the details or import from TMDB</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button 
              onClick={() => setView('list')}
              className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition"
            >
              Cancel
            </button>
            <button 
              onClick={() => setShowTmdbModal(true)}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition flex items-center space-x-2"
            >
              <DownloadCloud size={18} />
              <span>Import from TMDB</span>
            </button>
            <button disabled={saving} onClick={handleSave} className="px-4 py-2 bg-white text-black font-medium hover:bg-neutral-200 rounded-lg transition disabled:opacity-50">
              {saving ? 'Saving...' : 'Save Content'}
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded-lg">
            {errorMsg}
          </div>
        )}

        {/* Content Type Selector */}
        <div className="flex p-1 bg-[#1a1d24] rounded-lg w-fit border border-neutral-800">
          <button 
            onClick={() => setFormData({...formData, type: 'Movie'})}
            className={`flex items-center space-x-2 px-6 py-2 rounded-md transition ${formData.type === 'Movie' ? 'bg-neutral-800 text-white shadow' : 'text-neutral-400 hover:text-white'}`}
          >
            <Film size={18} />
            <span>Movie</span>
          </button>
          <button 
            onClick={() => setFormData({...formData, type: 'Series'})}
            className={`flex items-center space-x-2 px-6 py-2 rounded-md transition ${formData.type === 'Series' ? 'bg-neutral-800 text-white shadow' : 'text-neutral-400 hover:text-white'}`}
          >
            <Tv size={18} />
            <span>TV Series</span>
          </button>
        </div>

        {/* Main Form Area */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Tabs */}
          <div className="w-full lg:w-64 shrink-0 space-y-1">
            {tabs.filter(t => !t.hidden).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
                  activeTab === tab.id 
                    ? 'bg-red-500/10 text-red-500 border border-red-500/20' 
                    : 'text-neutral-400 hover:bg-[#1a1d24] hover:text-white border border-transparent'
                }`}
              >
                {tab.icon}
                <span className="font-medium">{tab.name}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex-1 bg-[#1a1d24] border border-neutral-800 rounded-xl p-6">
            {activeTab === 'basic' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-neutral-300">Title (Kurdish)</label>
                    <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="ناوی کوردی..." className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2.5 text-white outline-none focus:border-red-500 transition" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-neutral-300">Title (Arabic)</label>
                    <input type="text" value={formData.title_ar} onChange={e => setFormData({...formData, title_ar: e.target.value})} placeholder="الاسم بالعربي..." className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2.5 text-white outline-none focus:border-red-500 transition" dir="rtl" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-neutral-300">Title (English)</label>
                    <input type="text" value={formData.title_en} onChange={e => setFormData({...formData, title_en: e.target.value})} placeholder="English Title..." className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2.5 text-white outline-none focus:border-red-500 transition" />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-neutral-300">Description (Kurdish)</label>
                    <textarea rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="کورتەی کوردی..." className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2.5 text-white outline-none focus:border-red-500 transition resize-none"></textarea>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-neutral-300">Description (Arabic)</label>
                    <textarea rows={3} value={formData.description_ar} onChange={e => setFormData({...formData, description_ar: e.target.value})} placeholder="القصة بالعربي..." className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2.5 text-white outline-none focus:border-red-500 transition resize-none" dir="rtl"></textarea>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-neutral-300">Description (English)</label>
                    <textarea rows={3} value={formData.description_en} onChange={e => setFormData({...formData, description_en: e.target.value})} placeholder="English Synopsis..." className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2.5 text-white outline-none focus:border-red-500 transition resize-none"></textarea>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-neutral-300">Release Year</label>
                    <input type="text" value={formData.year} onChange={e => setFormData({...formData, year: e.target.value})} placeholder="e.g. 2010" className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2.5 text-white outline-none focus:border-red-500 transition" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-neutral-300">Genre</label>
                    <input type="text" value={formData.genre} onChange={e => setFormData({...formData, genre: e.target.value})} placeholder="Action, Sci-Fi" className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2.5 text-white outline-none focus:border-red-500 transition" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-neutral-300">Rating (IMDb)</label>
                    <input type="text" value={formData.rating} onChange={e => setFormData({...formData, rating: e.target.value})} placeholder="8.8" className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2.5 text-white outline-none focus:border-red-500 transition" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-neutral-300">Home List / Category</label>
                    <select 
                      value={formData.list_name} 
                      onChange={e => setFormData({...formData, list_name: e.target.value})}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2.5 text-white outline-none focus:border-red-500 transition"
                    >
                      <option value="">None (Default)</option>
                      {movieLists.map(list => (
                        <option key={list.id} value={list.name}>{list.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-neutral-300">Publish Status</label>
                    <select 
                      value={formData.status} 
                      onChange={e => setFormData({...formData, status: e.target.value})}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2.5 text-white outline-none focus:border-red-500 transition"
                    >
                      <option value="Published">Published</option>
                      <option value="Draft">Draft</option>
                      <option value="Coming Soon">Coming Soon</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-neutral-300">Posters & Covers</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <ImageUpload 
                      label="Vertical Poster" 
                      value={formData.image} 
                      onChange={(val) => setFormData({...formData, image: val})} 
                    />
                    <ImageUpload 
                      label="Backdrop Image (Horizontal)" 
                      value={formData.backdrop} 
                      onChange={(val) => setFormData({...formData, backdrop: val})} 
                    />
                  </div>
                </div>

                <div className="space-y-4 pt-6 border-t border-neutral-800/50">
                  <div className="flex items-center space-x-2">
                    <DownloadCloud size={18} className="text-red-500" />
                    <h3 className="text-sm font-medium text-neutral-300 uppercase tracking-wider">Download Settings</h3>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-neutral-400">Main Download Link (Supports Direct, Drive, Embeds, etc.)</label>
                    <input 
                      type="text" 
                      value={formData.download_url} 
                      onChange={e => setFormData({...formData, download_url: e.target.value})} 
                      placeholder="https://..." 
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2.5 text-white outline-none focus:border-red-500 transition" 
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'sources' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium">Video Servers</h3>
                  <button 
                    onClick={() => setFormData({
                      ...formData, 
                      servers: [...formData.servers, { name: `Server ${formData.servers.length + 1}`, url: '', quality: 'Auto' }]
                    })}
                    className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white text-sm rounded-lg transition flex items-center space-x-1"
                  >
                    <Plus size={16} />
                    <span>Add Server</span>
                  </button>
                </div>
                
                <div className="space-y-4">
                  {formData.servers.map((server, index) => (
                    <div key={index} className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 relative">
                      {formData.servers.length > 1 && (
                        <button 
                          onClick={() => {
                            const newServers = [...formData.servers];
                            newServers.splice(index, 1);
                            setFormData({...formData, servers: newServers});
                          }}
                          className="absolute top-4 right-4 text-neutral-500 hover:text-red-500 transition"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 pr-8">
                        <div className="space-y-1">
                          <label className="text-xs text-neutral-400">Server Type</label>
                          <select 
                            value={server.name}
                            onChange={(e) => {
                              const newServers = [...formData.servers];
                              newServers[index].name = e.target.value;
                              setFormData({...formData, servers: newServers});
                            }}
                            className="w-full bg-[#1a1d24] border border-neutral-800 rounded-md px-3 py-2 text-sm text-white outline-none focus:border-red-500 transition" 
                          >
                            <option value="ok">OK.ru</option>
                            <option value="VK">VK.com</option>
                            <option value="google">Google Drive</option>
                            <option value="embed">Embed (Iframe)</option>
                            <option value="telegram">Telegram</option>
                            <option value="m3u8">M3U8 (HLS)</option>
                            <option value="mp4">MP4 (Direct)</option>
                            <option value="youtube">YouTube</option>
                            <option value="Server 1">Default Server</option>
                          </select>
                        </div>
                        <div className="space-y-1 md:col-span-2">
                          <label className="text-xs text-neutral-400">URL</label>
                          <input 
                            type="text" 
                            value={server.url} 
                            onChange={(e) => {
                              const newServers = [...formData.servers];
                              newServers[index].url = e.target.value;
                              setFormData({...formData, servers: newServers});
                            }}
                            placeholder="https://t.me/channel/123 or https://..." 
                            className="w-full bg-[#1a1d24] border border-neutral-800 rounded-md px-3 py-2 text-sm text-white outline-none focus:border-red-500 transition" 
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs text-neutral-400">Quality Label</label>
                          <input 
                            type="text" 
                            value={server.quality}
                            onChange={(e) => {
                              const newServers = [...formData.servers];
                              newServers[index].quality = e.target.value;
                              setFormData({...formData, servers: newServers});
                            }}
                            placeholder="1080p, 4K, Auto" 
                            className="w-full bg-[#1a1d24] border border-neutral-800 rounded-md px-3 py-2 text-sm text-white outline-none focus:border-red-500 transition" 
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'episodes' && formData.type === 'Series' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium">Episodes Management</h3>
                  <button 
                    onClick={() => setFormData({
                      ...formData, 
                      episodes: [...formData.episodes, { number: formData.episodes.length + 1, title: '', servers: [{ name: 'Server 1', url: '', quality: 'Auto' }] }]
                    })}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition flex items-center space-x-1"
                  >
                    <Plus size={16} />
                    <span>Add Episode</span>
                  </button>
                </div>
                
                <div className="space-y-8">
                  {formData.episodes.map((episode, epIdx) => (
                    <div key={epIdx} className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 relative">
                      <button 
                        onClick={() => {
                          const newEpisodes = [...formData.episodes];
                          newEpisodes.splice(epIdx, 1);
                          setFormData({...formData, episodes: newEpisodes});
                        }}
                        className="absolute top-4 right-4 text-neutral-500 hover:text-red-500 transition"
                      >
                        <Trash2 size={18} />
                      </button>

                      <div className="flex items-center space-x-4 mb-6">
                        <div className="w-12 h-12 bg-red-600/10 text-red-500 rounded-lg flex items-center justify-center font-bold text-xl">
                          {episode.number}
                        </div>
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-xs text-neutral-400 uppercase font-bold">Episode Number</label>
                            <input 
                              type="number" 
                              value={episode.number} 
                              onChange={(e) => {
                                const newEpisodes = [...formData.episodes];
                                newEpisodes[epIdx].number = parseInt(e.target.value);
                                setFormData({...formData, episodes: newEpisodes});
                              }}
                              className="w-full bg-[#1a1d24] border border-neutral-800 rounded-md px-3 py-2 text-sm text-white outline-none focus:border-red-500 transition" 
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs text-neutral-400 uppercase font-bold">Episode Title (Optional)</label>
                            <input 
                              type="text" 
                              value={episode.title} 
                              onChange={(e) => {
                                const newEpisodes = [...formData.episodes];
                                newEpisodes[epIdx].title = e.target.value;
                                setFormData({...formData, episodes: newEpisodes});
                              }}
                              placeholder="e.g. Pilot"
                              className="w-full bg-[#1a1d24] border border-neutral-800 rounded-md px-3 py-2 text-sm text-white outline-none focus:border-red-500 transition" 
                            />
                          </div>
                        </div>
                      </div>

                      {/* Episode Servers */}
                      <div className="ml-0 md:ml-12 space-y-4 mb-8">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-bold text-neutral-400 uppercase">Servers for Episode {episode.number}</h4>
                          <button 
                            onClick={() => {
                              const newEpisodes = [...formData.episodes];
                              newEpisodes[epIdx].servers.push({ name: `Server ${newEpisodes[epIdx].servers.length + 1}`, url: '', quality: 'Auto' });
                              setFormData({...formData, episodes: newEpisodes});
                            }}
                            className="text-xs bg-neutral-800 hover:bg-neutral-700 px-2 py-1 rounded transition flex items-center space-x-1"
                          >
                            <Plus size={12} />
                            <span>Add Server</span>
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-3">
                          {episode.servers.map((server, srvIdx) => (
                            <div key={srvIdx} className="bg-[#1a1d24] border border-neutral-800 rounded-lg p-3 flex flex-wrap gap-3 items-end">
                              <div className="flex-1 min-w-[150px] space-y-1">
                                <label className="text-[10px] text-neutral-500 font-bold uppercase">Type</label>
                                <select 
                                  value={server.name}
                                  onChange={(e) => {
                                    const newEpisodes = [...formData.episodes];
                                    newEpisodes[epIdx].servers[srvIdx].name = e.target.value;
                                    setFormData({...formData, episodes: newEpisodes});
                                  }}
                                  className="w-full bg-neutral-900 border border-neutral-800 rounded px-2 py-1.5 text-xs text-white"
                                >
                                  <option value="ok">OK.ru</option>
                                  <option value="VK">VK.com</option>
                                  <option value="google">Google Drive</option>
                                  <option value="embed">Embed</option>
                                  <option value="telegram">Telegram</option>
                                  <option value="m3u8">M3U8</option>
                                  <option value="mp4">MP4</option>
                                  <option value="youtube">YouTube</option>
                                  <option value="Server 1">Default</option>
                                </select>
                              </div>
                              <div className="flex-[3] min-w-[200px] space-y-1">
                                <label className="text-[10px] text-neutral-500 font-bold uppercase">Source URL</label>
                                <input 
                                  type="text" 
                                  value={server.url}
                                  onChange={(e) => {
                                    const newEpisodes = [...formData.episodes];
                                    newEpisodes[epIdx].servers[srvIdx].url = e.target.value;
                                    setFormData({...formData, episodes: newEpisodes});
                                  }}
                                  className="w-full bg-neutral-900 border border-neutral-800 rounded px-2 py-1.5 text-xs text-white"
                                  placeholder="URL..."
                                />
                              </div>
                              <div className="flex-1 min-w-[80px] space-y-1">
                                <label className="text-[10px] text-neutral-500 font-bold uppercase">Quality</label>
                                <input 
                                  type="text" 
                                  value={server.quality}
                                  onChange={(e) => {
                                    const newEpisodes = [...formData.episodes];
                                    newEpisodes[epIdx].servers[srvIdx].quality = e.target.value;
                                    setFormData({...formData, episodes: newEpisodes});
                                  }}
                                  className="w-full bg-neutral-900 border border-neutral-800 rounded px-2 py-1.5 text-xs text-white"
                                  placeholder="1080p"
                                />
                              </div>
                              <button 
                                onClick={() => {
                                  const newEpisodes = [...formData.episodes];
                                  newEpisodes[epIdx].servers.splice(srvIdx, 1);
                                  setFormData({...formData, episodes: newEpisodes});
                                }}
                                className="mb-1 text-neutral-600 hover:text-red-500 p-1"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Episode Subtitles */}
                      <div className="ml-0 md:ml-12 space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-bold text-neutral-400 uppercase">Subtitles for Episode {episode.number}</h4>
                          <button 
                            onClick={() => {
                              const newEpisodes = [...formData.episodes];
                              if (!newEpisodes[epIdx].subtitles) newEpisodes[epIdx].subtitles = [];
                              newEpisodes[epIdx].subtitles.push({ label: '', url: '', lang: '' });
                              setFormData({...formData, episodes: newEpisodes});
                            }}
                            className="text-xs bg-neutral-800 hover:bg-neutral-700 px-2 py-1 rounded transition flex items-center space-x-1"
                          >
                            <Plus size={12} />
                            <span>Add Subtitle</span>
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-3">
                          {(episode.subtitles || []).map((sub, srvIdx) => (
                            <div key={srvIdx} className="bg-[#1a1d24] border border-neutral-800 rounded-lg p-3 flex flex-wrap gap-3 items-end border-l-4 border-l-red-500">
                              <div className="flex-1 min-w-[120px] space-y-1">
                                <label className="text-[10px] text-neutral-500 font-bold uppercase">Language</label>
                                <input 
                                  type="text" 
                                  value={sub.label}
                                  onChange={(e) => {
                                    const newEpisodes = [...formData.episodes];
                                    newEpisodes[epIdx].subtitles[srvIdx].label = e.target.value;
                                    setFormData({...formData, episodes: newEpisodes});
                                  }}
                                  className="w-full bg-neutral-900 border border-neutral-800 rounded px-2 py-1.5 text-xs text-white"
                                  placeholder="Kurdish"
                                />
                              </div>
                              <div className="flex-[3] min-w-[200px]">
                                <SubtitleUpload 
                                  value={sub.url}
                                  onChange={(url) => {
                                    const newEpisodes = [...formData.episodes];
                                    newEpisodes[epIdx].subtitles[srvIdx].url = url;
                                    setFormData({...formData, episodes: newEpisodes});
                                  }}
                                  label="Subtitle File / URL"
                                />
                              </div>
                              <div className="flex-1 min-w-[60px] space-y-1">
                                <label className="text-[10px] text-neutral-500 font-bold uppercase">Lang Code</label>
                                <input 
                                  type="text" 
                                  value={sub.lang}
                                  onChange={(e) => {
                                    const newEpisodes = [...formData.episodes];
                                    newEpisodes[epIdx].subtitles[srvIdx].lang = e.target.value;
                                    setFormData({...formData, episodes: newEpisodes});
                                  }}
                                  className="w-full bg-neutral-900 border border-neutral-800 rounded px-2 py-1.5 text-xs text-white"
                                  placeholder="ku"
                                />
                              </div>
                              <button 
                                onClick={() => {
                                  const newEpisodes = [...formData.episodes];
                                  newEpisodes[epIdx].subtitles.splice(srvIdx, 1);
                                  setFormData({...formData, episodes: newEpisodes});
                                }}
                                className="mb-1 text-neutral-600 hover:text-red-500 p-1"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ))}
                          {(episode.subtitles || []).length === 0 && (
                            <div className="text-[10px] text-neutral-600 italic">No subtitles for this episode.</div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'subtitles' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-medium">Manage Subtitles</h3>
                    <p className="text-sm text-neutral-400">Add subtitle files (.vtt, .srt) for this movie</p>
                  </div>
                  <button 
                    onClick={() => setFormData({
                      ...formData, 
                      subtitles: [...formData.subtitles, { label: '', url: '', lang: '' }]
                    })}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition flex items-center space-x-1"
                  >
                    <Plus size={16} />
                    <span>Add Subtitle</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {formData.subtitles.length === 0 && (
                    <div className="text-center py-10 border-2 border-dashed border-neutral-800 rounded-xl text-neutral-500">
                      No subtitles added yet.
                    </div>
                  )}
                  {formData.subtitles.map((sub, idx) => (
                    <div key={idx} className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex flex-col md:flex-row gap-4 items-end">
                      <div className="flex-1 w-full space-y-1">
                        <label className="text-xs text-neutral-500 font-bold uppercase">Language / Label</label>
                        <input 
                          type="text" 
                          value={sub.label}
                          onChange={(e) => {
                            const newSubs = [...formData.subtitles];
                            newSubs[idx].label = e.target.value;
                            setFormData({...formData, subtitles: newSubs});
                          }}
                          placeholder="e.g. Kurdish, English"
                          className="w-full bg-[#1a1d24] border border-neutral-800 rounded-md px-3 py-2 text-sm text-white outline-none focus:border-red-500 transition" 
                        />
                      </div>
                      <div className="flex-[3] w-full">
                        <SubtitleUpload 
                          value={sub.url}
                          onChange={(url) => {
                            const newSubs = [...formData.subtitles];
                            newSubs[idx].url = url;
                            setFormData({...formData, subtitles: newSubs});
                          }}
                          label="Subtitle File / URL"
                        />
                      </div>
                      <div className="flex-1 w-full space-y-1">
                        <label className="text-xs text-neutral-500 font-bold uppercase">Lang Code</label>
                        <input 
                          type="text" 
                          value={sub.lang}
                          onChange={(e) => {
                            const newSubs = [...formData.subtitles];
                            newSubs[idx].lang = e.target.value;
                            setFormData({...formData, subtitles: newSubs});
                          }}
                          placeholder="ku, en, ar"
                          className="w-full bg-[#1a1d24] border border-neutral-800 rounded-md px-3 py-2 text-sm text-white outline-none focus:border-red-500 transition" 
                        />
                      </div>
                      <button 
                        onClick={() => {
                          const newSubs = [...formData.subtitles];
                          newSubs.splice(idx, 1);
                          setFormData({...formData, subtitles: newSubs});
                        }}
                        className="mb-1 text-neutral-500 hover:text-red-500 p-2 bg-[#1a1d24] border border-neutral-800 rounded-md"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'advanced' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium mb-4">Access & Visibility</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-neutral-900 border border-neutral-800 rounded-lg">
                    <div>
                      <p className="font-medium">Access Type</p>
                      <p className="text-sm text-neutral-400">Who can watch this content?</p>
                    </div>
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <span className="text-sm font-medium text-neutral-400">PRO Only</span>
                      <div className="relative inline-flex items-center">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={formData.is_pro}
                          onChange={(e) => setFormData({...formData, is_pro: e.target.checked})}
                        />
                        <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
                      </div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-neutral-900 border border-neutral-800 rounded-lg">
                    <div>
                      <p className="font-medium">Featured Content</p>
                      <p className="text-sm text-neutral-400">Show in the top slider on home page</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={formData.is_featured}
                        onChange={(e) => setFormData({...formData, is_featured: e.target.checked})}
                      />
                      <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-neutral-900 border border-neutral-800 rounded-lg">
                    <div>
                      <p className="font-medium">Top Content Rank</p>
                      <p className="text-sm text-neutral-400">Set rank (1-10) to show in Top Contents list. Leave empty to hide.</p>
                    </div>
                    <input 
                      type="number" 
                      value={formData.top_rank}
                      onChange={(e) => setFormData({...formData, top_rank: e.target.value})}
                      placeholder="e.g. 1"
                      className="w-24 bg-[#1a1d24] border border-neutral-800 rounded-md px-3 py-2 text-sm text-white outline-none focus:border-red-500 transition"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-neutral-900 border border-neutral-800 rounded-lg">
                    <div>
                      <p className="font-medium text-red-500">Broken Link / Server Down</p>
                      <p className="text-sm text-neutral-400">Mark if the video player is not working or links are dead</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={formData.is_broken}
                        onChange={(e) => setFormData({...formData, is_broken: e.target.checked})}
                      />
                      <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'cast' && (
              <div className="flex flex-col items-center justify-center h-64 text-neutral-500">
                <p>This section will allow managing {activeTab}.</p>
                <p className="text-sm mt-2">UI coming in next iterations.</p>
              </div>
            )}
          </div>
        </div>
      {/* TMDB Search Modal */}
      {showTmdbModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#1a1d24] w-full max-w-2xl rounded-2xl border border-neutral-800 flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-neutral-800 flex justify-between items-center">
              <h3 className="text-xl font-bold">Search TMDB</h3>
              <button onClick={() => setShowTmdbModal(false)} className="text-neutral-500 hover:text-white transition">
                <Trash2 size={20} />
              </button>
            </div>
            
            <div className="p-5 space-y-4">
              <div className="flex space-x-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
                  <input 
                    type="text" 
                    value={tmdbSearch}
                    onChange={(e) => setTmdbSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && searchTmdb()}
                    placeholder="Enter movie or show title..."
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-10 pr-4 py-2.5 outline-none focus:border-red-500 transition"
                  />
                </div>
                <button 
                  onClick={searchTmdb}
                  disabled={tmdbLoading}
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition disabled:opacity-50"
                >
                  {tmdbLoading ? 'Searching...' : 'Search'}
                </button>
              </div>

              <div className="overflow-y-auto flex-1 space-y-3 pr-2 min-h-[300px] max-h-[50vh]">
                {tmdbResults.length === 0 && !tmdbLoading && (
                  <div className="h-full flex flex-col items-center justify-center text-neutral-500 pt-10">
                    <Film size={48} className="mb-4 opacity-10" />
                    <p>Enter a title to search for content</p>
                  </div>
                )}
                
                {tmdbResults.map((result) => (
                  <button
                    key={result.id}
                    onClick={() => selectTmdbItem(result)}
                    className="w-full flex items-center space-x-4 p-3 rounded-xl bg-neutral-900/50 hover:bg-neutral-800 border border-neutral-800 hover:border-red-500/50 transition group text-left"
                  >
                    <div className="w-16 h-24 bg-neutral-800 rounded-lg overflow-hidden shrink-0">
                      {result.poster_path ? (
                        <div className="relative w-full h-full">
                          <Image src={`https://image.tmdb.org/t/p/w200${result.poster_path}`} alt="" fill sizes="64px" className="object-cover" />
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><Film size={20} className="text-neutral-700" /></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-white truncate group-hover:text-red-500 transition">{result.title || result.name}</h4>
                      <p className="text-sm text-neutral-500 mt-1 line-clamp-2">{result.overview}</p>
                      <div className="flex items-center space-x-3 mt-2 text-xs text-neutral-400">
                        <span className="flex items-center"><Star size={12} className="mr-1 text-yellow-500 fill-current" /> {result.vote_average?.toFixed(1)}</span>
                        <span>{(result.release_date || result.first_air_date || '').split('-')[0]}</span>
                        <span className="bg-neutral-800 px-2 py-0.5 rounded uppercase tracking-wider text-[10px]">{result.media_type || (result.first_air_date ? 'tv' : 'movie')}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            
            <div className="p-5 border-t border-neutral-800 bg-neutral-900/50 rounded-b-2xl">
              <button onClick={() => setShowTmdbModal(false)} className="w-full py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg font-medium transition">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
    );
  }

  // List View
  return (
    <>
      <div className="text-white space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold">Movies & Series</h1>
          {contentList.filter(m => m.is_broken).length > 0 && (
            <div className="flex items-center bg-red-500/10 text-red-500 px-3 py-1 rounded-full border border-red-500/20 animate-pulse">
              <AlertCircle size={14} className="mr-2" />
              <span className="text-xs font-black uppercase tracking-wider">
                {contentList.filter(m => m.is_broken).length} Issues Detected
              </span>
            </div>
          )}
        </div>
        <button 
          onClick={handleAddNew}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition flex items-center justify-center space-x-2 shadow-lg shadow-red-600/20"
        >
          <Plus size={20} />
          <span>Add New Content</span>
        </button>
      </div>

      <div className="bg-[#1a1d24] border border-neutral-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-neutral-800 flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 w-full sm:w-80">
            <Search size={18} className="text-neutral-500" />
            <input 
              type="text" 
              placeholder="Search movies or series..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent border-none outline-none text-sm ml-2 w-full text-white"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <select 
              value={filterList}
              onChange={(e) => setFilterList(e.target.value)}
              className="bg-neutral-900 border border-neutral-800 text-white text-sm rounded-lg px-3 py-2 outline-none"
            >
              <option value="All">All Lists</option>
              {movieLists.map(list => (
                <option key={list.id} value={list.name}>{list.name}</option>
              ))}
            </select>
            <select 
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-neutral-900 border border-neutral-800 text-white text-sm rounded-lg px-3 py-2 outline-none"
            >
              <option value="All">All Types</option>
              <option value="Movie">Movies</option>
              <option value="Series">Series</option>
            </select>
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-neutral-900 border border-neutral-800 text-white text-sm rounded-lg px-3 py-2 outline-none"
            >
              <option value="All">All Status</option>
              <option value="Published">Published</option>
              <option value="Draft">Draft</option>
            </select>
            <div className="relative">
              <select 
                value={filterIssue}
                onChange={(e) => setFilterIssue(e.target.value)}
                className={`bg-neutral-900 border ${filterIssue !== 'All' ? 'border-red-500 ring-2 ring-red-500/20' : 'border-neutral-800'} text-white text-sm rounded-lg px-3 py-2 outline-none appearance-none pr-8 transition-all`}
              >
                <option value="All">Health: All</option>
                <option value="NoLink">⚠️ Missing Links</option>
                <option value="Broken">❌ Broken Links</option>
              </select>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-500">
                <Settings size={14} />
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-900/50 text-neutral-400">
              <tr>
                <th className="px-6 py-4 font-medium">Title</th>
                <th className="px-6 py-4 font-medium">Type</th>
                <th className="px-6 py-4 font-medium">Genre</th>
                <th className="px-6 py-4 font-medium">Featured</th>
                <th className="px-6 py-4 font-medium">Rank</th>
                <th className="px-6 py-4 font-medium">Views</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {contentList.filter(item => {
                const matchesSearch = item.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                     item.genre?.toLowerCase().includes(searchTerm.toLowerCase());
                const matchesType = filterType === 'All' || item.type === filterType;
                const matchesStatus = filterStatus === 'All' || item.status === filterStatus;
                const matchesList = filterList === 'All' || item.list_name === filterList;
                
                let matchesIssue = true;
                if (filterIssue === 'NoLink') {
                  const hasLink = item.video_url && item.video_url !== '[]' && item.video_url !== '[{"name":"Server 1","url":"","quality":"Auto"}]';
                  matchesIssue = !hasLink;
                } else if (filterIssue === 'Broken') {
                  matchesIssue = !!item.is_broken;
                }

                return matchesSearch && matchesType && matchesStatus && matchesList && matchesIssue;
              }).map((item) => (
                <tr key={item.id} className={`hover:bg-neutral-800/50 transition ${item.is_broken ? 'bg-red-500/5' : ''}`}>
                  <td className="px-6 py-4 font-medium">
                    <div className="flex items-center">
                      <span className={item.is_broken ? 'text-red-500 font-bold' : 'text-white'}>{item.title}</span>
                      {item.is_broken && (
                        <div className="ml-2 px-2 py-0.5 bg-red-600 text-[10px] text-white font-black rounded uppercase flex items-center shadow-lg">
                          <AlertCircle size={10} className="mr-1" />
                          Broken
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      item.type === 'Movie' ? 'bg-blue-500/10 text-blue-500' : 'bg-purple-500/10 text-purple-500'
                    }`}>
                      {item.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-neutral-400">{item.genre}</td>
                  <td className="px-6 py-4">
                    {item.is_featured ? (
                      <span className="text-yellow-500 flex items-center">
                        <Star size={14} className="mr-1 fill-current" /> Yes
                      </span>
                    ) : (
                      <span className="text-neutral-600">No</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-neutral-400">
                    {item.top_rank ? `#${item.top_rank}` : '-'}
                  </td>
                  <td className="px-6 py-4 text-neutral-400">{item.views}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      item.status === 'Published' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-neutral-500/10 text-neutral-400'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button 
                        onClick={() => toggleBroken(item)} 
                        title={item.is_broken ? 'Mark as Fixed' : 'Mark as Broken'}
                        className={`p-1.5 rounded-lg transition text-xs font-medium flex items-center gap-1 ${
                          item.is_broken 
                            ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20' 
                            : 'bg-neutral-800 text-neutral-500 hover:bg-red-500/10 hover:text-red-500'
                        }`}
                      >
                        {item.is_broken ? <Wrench size={14} /> : <WifiOff size={14} />}
                      </button>
                      <button onClick={() => handleEdit(item)} className="text-neutral-400 hover:text-white transition p-1.5">
                        <Edit size={18} />
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="text-neutral-400 hover:text-red-500 transition p-1.5">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="p-4 border-t border-neutral-800 flex items-center justify-between text-sm text-neutral-400">
          <span>Showing 1 to {contentList.length} of {contentList.length} entries</span>
          <div className="flex space-x-1">
            <button className="px-3 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-white disabled:opacity-50">Prev</button>
            <button className="px-3 py-1 rounded bg-red-600 text-white">1</button>
            <button className="px-3 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-white disabled:opacity-50">Next</button>
          </div>
        </div>
      </div>
      {/* TMDB Search Modal */}
      {showTmdbModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#1a1d24] w-full max-w-2xl rounded-2xl border border-neutral-800 flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-neutral-800 flex justify-between items-center">
              <h3 className="text-xl font-bold">Search TMDB</h3>
              <button onClick={() => setShowTmdbModal(false)} className="text-neutral-500 hover:text-white transition">
                <Trash2 size={20} />
              </button>
            </div>
            
            <div className="p-5 space-y-4">
              <div className="flex space-x-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
                  <input 
                    type="text" 
                    value={tmdbSearch}
                    onChange={(e) => setTmdbSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && searchTmdb()}
                    placeholder="Enter movie or show title..."
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-10 pr-4 py-2.5 outline-none focus:border-red-500 transition"
                  />
                </div>
                <button 
                  onClick={searchTmdb}
                  disabled={tmdbLoading}
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition disabled:opacity-50"
                >
                  {tmdbLoading ? 'Searching...' : 'Search'}
                </button>
              </div>

              <div className="overflow-y-auto flex-1 space-y-3 pr-2 min-h-[300px] max-h-[50vh]">
                {tmdbResults.length === 0 && !tmdbLoading && (
                  <div className="h-full flex flex-col items-center justify-center text-neutral-500 pt-10">
                    <Film size={48} className="mb-4 opacity-10" />
                    <p>Enter a title to search for content</p>
                  </div>
                )}
                
                {tmdbResults.map((result) => (
                  <button
                    key={result.id}
                    onClick={() => selectTmdbItem(result)}
                    className="w-full flex items-center space-x-4 p-3 rounded-xl bg-neutral-900/50 hover:bg-neutral-800 border border-neutral-800 hover:border-red-500/50 transition group text-left"
                  >
                    <div className="w-16 h-24 bg-neutral-800 rounded-lg overflow-hidden shrink-0">
                      {result.poster_path ? (
                        <div className="relative w-full h-full">
                          <Image src={`https://image.tmdb.org/t/p/w200${result.poster_path}`} alt="" fill sizes="64px" className="object-cover" />
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><Film size={20} className="text-neutral-700" /></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-white truncate group-hover:text-red-500 transition">{result.title || result.name}</h4>
                      <p className="text-sm text-neutral-500 mt-1 line-clamp-2">{result.overview}</p>
                      <div className="flex items-center space-x-3 mt-2 text-xs text-neutral-400">
                        <span className="flex items-center"><Star size={12} className="mr-1 text-yellow-500 fill-current" /> {result.vote_average?.toFixed(1)}</span>
                        <span>{(result.release_date || result.first_air_date || '').split('-')[0]}</span>
                        <span className="bg-neutral-800 px-2 py-0.5 rounded uppercase tracking-wider text-[10px]">{result.media_type || (result.first_air_date ? 'tv' : 'movie')}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            
            <div className="p-5 border-t border-neutral-800 bg-neutral-900/50 rounded-b-2xl">
              <button onClick={() => setShowTmdbModal(false)} className="w-full py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg font-medium transition">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
    );
}
