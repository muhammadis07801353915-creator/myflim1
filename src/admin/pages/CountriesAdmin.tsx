'use client';
import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Globe, Save, X, ToggleLeft, ToggleRight, ChevronUp, ChevronDown } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function CountriesAdmin() {
  const [countries, setCountries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'form'>('list');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');

  const [formData, setFormData] = useState({
    name_ku: '',
    name_ar: '',
    name_en: '',
    flag_url: '',
    is_active: false,
    order_index: 0,
  });

  useEffect(() => { fetchCountries(); }, []);

  const fetchCountries = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('channel_countries')
      .select('*')
      .order('order_index', { ascending: true });
    if (data) setCountries(data);
    setLoading(false);
  };

  // Toggle active state directly from list
  const toggleActive = async (id: number, current: boolean) => {
    const updated = countries.map(c => c.id === id ? { ...c, is_active: !current } : c);
    setCountries(updated);
    await supabase.from('channel_countries').update({ is_active: !current }).eq('id', id);
  };

  const handleAddNew = () => {
    setFormData({ name_ku: '', name_ar: '', name_en: '', flag_url: '', is_active: false, order_index: countries.length });
    setEditingId(null);
    setErrorMsg(null);
    setView('form');
  };

  const handleEdit = (item: any) => {
    setFormData({
      name_ku: item.name_ku || '',
      name_ar: item.name_ar || '',
      name_en: item.name_en || '',
      flag_url: item.flag_url || '',
      is_active: item.is_active ?? false,
      order_index: item.order_index ?? 0,
    });
    setEditingId(item.id);
    setErrorMsg(null);
    setView('form');
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this country?')) return;
    await supabase.from('channel_countries').delete().eq('id', id);
    setCountries(countries.filter(c => c.id !== id));
  };

  const handleSave = async () => {
    if (!formData.name_en.trim()) { setErrorMsg('English name is required'); return; }
    if (!formData.name_ku.trim()) formData.name_ku = formData.name_en;
    if (!formData.name_ar.trim()) formData.name_ar = formData.name_en;
    setSaving(true);
    setErrorMsg(null);
    try {
      const payload = {
        name_ku: formData.name_ku,
        name_ar: formData.name_ar,
        name_en: formData.name_en,
        flag_url: formData.flag_url,
        is_active: formData.is_active,
        order_index: formData.order_index,
      };
      if (editingId) {
        const { error } = await supabase.from('channel_countries').update(payload).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('channel_countries').insert([payload]);
        if (error) throw error;
      }
      await fetchCountries();
      setView('list');
    } catch (err: any) {
      setErrorMsg(err.message || 'Unknown error');
    } finally {
      setSaving(false);
    }
  };

  const moveOrder = async (index: number, dir: 'up' | 'down') => {
    const list = [...filteredForDisplay];
    const targetIndex = dir === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return;
    const newList = [...list];
    [newList[index], newList[targetIndex]] = [newList[targetIndex], newList[index]];
    setCountries(newList);
    await Promise.all(newList.map((c, i) => supabase.from('channel_countries').update({ order_index: i }).eq('id', c.id)));
    fetchCountries();
  };

  const filteredForDisplay = countries.filter(c => {
    if (filterActive === 'active') return c.is_active;
    if (filterActive === 'inactive') return !c.is_active;
    return true;
  });

  // ── FORM VIEW ───────────────────────────────────────────────────────────────
  if (view === 'form') {
    return (
      <div className="text-white space-y-6 pb-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{editingId ? 'Edit Country' : 'Add Country'}</h1>
            <p className="text-neutral-400 text-sm mt-1">Manage country names in 3 languages and flag image</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setView('list')} className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition flex items-center gap-2">
              <X size={16} /> Cancel
            </button>
            <button disabled={saving} onClick={handleSave} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition disabled:opacity-50 flex items-center gap-2">
              <Save size={16} /> {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        {errorMsg && <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg">{errorMsg}</div>}

        <div className="bg-[#1a1d24] border border-neutral-800 rounded-xl p-6 space-y-6">
          {/* Language Names */}
          <div>
            <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-4">Country Names — 3 Languages</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-300 flex items-center gap-2">
                  <span className="bg-neutral-800 px-2 py-0.5 rounded text-xs">KU</span> Kurdish (کوردی)
                </label>
                <input
                  type="text"
                  dir="rtl"
                  value={formData.name_ku}
                  onChange={e => setFormData({ ...formData, name_ku: e.target.value })}
                  placeholder="عێراق"
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2.5 text-white outline-none focus:border-red-500 transition text-right"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-300 flex items-center gap-2">
                  <span className="bg-neutral-800 px-2 py-0.5 rounded text-xs">AR</span> Arabic (عربي)
                </label>
                <input
                  type="text"
                  dir="rtl"
                  value={formData.name_ar}
                  onChange={e => setFormData({ ...formData, name_ar: e.target.value })}
                  placeholder="العراق"
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2.5 text-white outline-none focus:border-red-500 transition text-right"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-300 flex items-center gap-2">
                  <span className="bg-neutral-800 px-2 py-0.5 rounded text-xs">EN</span> English *
                </label>
                <input
                  type="text"
                  value={formData.name_en}
                  onChange={e => setFormData({ ...formData, name_en: e.target.value })}
                  placeholder="Iraq"
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2.5 text-white outline-none focus:border-red-500 transition"
                />
              </div>
            </div>
          </div>

          {/* Flag URL + Preview */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-neutral-300">Flag Image URL (External Link)</label>
            <div className="flex items-center gap-4">
              <div className="w-20 h-12 rounded-lg overflow-hidden bg-neutral-900 border border-neutral-800 flex items-center justify-center shrink-0">
                {formData.flag_url ? (
                  <img src={formData.flag_url} alt="Flag" className="w-full h-full object-cover" />
                ) : (
                  <Globe size={20} className="text-neutral-600" />
                )}
              </div>
              <input
                type="text"
                value={formData.flag_url}
                onChange={e => setFormData({ ...formData, flag_url: e.target.value })}
                placeholder="https://upload.wikimedia.org/wikipedia/commons/..."
                className="flex-1 bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2.5 text-white outline-none focus:border-red-500 transition text-sm"
              />
            </div>
            <p className="text-xs text-neutral-500">Tip: Use Wikipedia Commons SVG flags for best quality. Search: "Flag of Iraq Wikipedia Commons"</p>
          </div>

          {/* Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-300">Order Index</label>
              <input
                type="number"
                value={formData.order_index}
                onChange={e => setFormData({ ...formData, order_index: parseInt(e.target.value) || 0 })}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2.5 text-white outline-none focus:border-red-500 transition"
              />
            </div>
            <div className="space-y-2 flex flex-col justify-center">
              <label className="text-sm font-medium text-neutral-300 mb-2">Visibility</label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <div
                  onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                  className={`relative w-12 h-6 rounded-full transition-colors ${formData.is_active ? 'bg-red-600' : 'bg-neutral-700'}`}
                >
                  <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${formData.is_active ? 'left-6' : 'left-0.5'}`} />
                </div>
                <span className={`font-medium ${formData.is_active ? 'text-red-400' : 'text-neutral-500'}`}>
                  {formData.is_active ? '✅ Visible in App & Website' : '⛔ Hidden'}
                </span>
              </label>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── LIST VIEW ───────────────────────────────────────────────────────────────
  const activeCount = countries.filter(c => c.is_active).length;

  return (
    <div className="text-white space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Countries Management</h1>
          <p className="text-neutral-400 text-sm mt-1">
            {activeCount} active of {countries.length} countries — active ones appear in app & website filter
          </p>
        </div>
        <button onClick={handleAddNew} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition flex items-center gap-2">
          <Plus size={20} /> Add Country
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(['all', 'active', 'inactive'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilterActive(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition ${
              filterActive === f ? 'bg-red-600 text-white' : 'bg-neutral-800 text-neutral-400 hover:text-white'
            }`}
          >
            {f === 'all' ? `All (${countries.length})` : f === 'active' ? `✅ Active (${activeCount})` : `⛔ Hidden (${countries.length - activeCount})`}
          </button>
        ))}
      </div>

      {/* Countries Grid */}
      <div className="bg-[#1a1d24] border border-neutral-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-900/50 text-neutral-400">
              <tr>
                <th className="px-4 py-3 font-medium">Order</th>
                <th className="px-4 py-3 font-medium">Flag</th>
                <th className="px-4 py-3 font-medium">Kurdish</th>
                <th className="px-4 py-3 font-medium">Arabic</th>
                <th className="px-4 py-3 font-medium">English</th>
                <th className="px-4 py-3 font-medium text-center">Visible</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {loading ? (
                <tr><td colSpan={7} className="px-6 py-8 text-center text-neutral-500">Loading countries...</td></tr>
              ) : filteredForDisplay.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-8 text-center text-neutral-500">No countries found. Run the SQL migration first.</td></tr>
              ) : filteredForDisplay.map((country, index) => (
                <tr key={country.id} className={`hover:bg-neutral-800/30 transition ${country.is_active ? '' : 'opacity-60'}`}>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-0.5">
                      <button disabled={index === 0} onClick={() => moveOrder(index, 'up')} className="text-neutral-600 hover:text-white disabled:opacity-20 transition"><ChevronUp size={14} /></button>
                      <button disabled={index === filteredForDisplay.length - 1} onClick={() => moveOrder(index, 'down')} className="text-neutral-600 hover:text-white disabled:opacity-20 transition"><ChevronDown size={14} /></button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="w-14 h-9 rounded overflow-hidden bg-neutral-800 flex items-center justify-center border border-neutral-700">
                      {country.flag_url ? (
                        <img src={country.flag_url} alt={country.name_en} className="w-full h-full object-cover" />
                      ) : (
                        <Globe size={16} className="text-neutral-500" />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-semibold text-white text-right" dir="rtl">{country.name_ku}</td>
                  <td className="px-4 py-3 text-neutral-300 text-right" dir="rtl">{country.name_ar}</td>
                  <td className="px-4 py-3 text-neutral-300">{country.name_en}</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => toggleActive(country.id, country.is_active)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition ${
                        country.is_active
                          ? 'bg-emerald-500/15 text-emerald-400 hover:bg-red-500/15 hover:text-red-400'
                          : 'bg-neutral-800 text-neutral-500 hover:bg-emerald-500/15 hover:text-emerald-400'
                      }`}
                    >
                      {country.is_active ? '✅ Active' : '⛔ Hidden'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button onClick={() => handleEdit(country)} className="text-neutral-400 hover:text-white transition p-1 rounded hover:bg-neutral-700">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => handleDelete(country.id)} className="text-neutral-400 hover:text-red-500 transition p-1 rounded hover:bg-neutral-800">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-sm text-blue-300">
        <strong className="font-semibold">💡 چۆنیەتی کارکردن:</strong>
        <ul className="mt-2 space-y-1 text-blue-300/80 list-disc list-inside">
          <li>وڵاتی <strong>Active</strong> کراو دەکرێ لە ئەپ و وێب سایتەکە دەکرێتەوە بۆ فلتەرکردنی کەناڵ</li>
          <li>وڵاتی <strong>Hidden</strong> کراو نادیار دەبێت لە ئەپ و وێب سایتەکە</li>
          <li>لە <strong>Live TV Admin</strong> هەر کەناڵێک دەتوانی وڵاتی بۆ هەلبژێریت</li>
        </ul>
      </div>
    </div>
  );
}
