'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/src/lib/supabase';
import { 
  AlertTriangle, CheckCircle2, Trash2, ExternalLink, 
  Search, Calendar, Film, Loader2, AlertCircle, Clock
} from 'lucide-react';

interface Report {
  id: string;
  movie_id: string;
  movie_title: string;
  status: string;
  created_at: string;
  movies: {
    image: string;
    video_url: string;
  };
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    // Note: We'll try to fetch reports. If table doesn't exist, this might fail gracefully.
    const { data, error } = await supabase
      .from('reports')
      .select(`
        *,
        movies (
          image,
          video_url
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching reports:', error);
      // If table doesn't exist, we'll alert the user later
    } else {
      setReports(data as any);
    }
    setLoading(false);
  };

  const deleteReport = async (id: string) => {
    if (!confirm('Are you sure you want to delete this report?')) return;
    const { error } = await supabase.from('reports').delete().eq('id', id);
    if (!error) setReports(reports.filter(r => r.id !== id));
  };

  const resolveReport = async (report: Report) => {
    // Resolve: Mark movie as not broken and delete report
    await supabase.from('movies').update({ is_broken: false }).eq('id', report.movie_id);
    await supabase.from('reports').delete().eq('id', report.id);
    setReports(reports.filter(r => r.id !== report.id));
    alert('Movie marked as fixed and report resolved!');
  };

  const filteredReports = reports.filter(r => 
    r.movie_title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <AlertTriangle size={24} className="text-orange-500" />
            User Reports
          </h1>
          <p className="text-neutral-400 text-sm mt-1">
            Manage issues reported by users for broken movie links
          </p>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
          <input 
            type="text"
            placeholder="Search movie titles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-sm text-white focus:border-orange-500 outline-none w-full sm:w-80 transition"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="animate-spin text-orange-500" size={32} />
        </div>
      ) : reports.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 bg-neutral-800/30 rounded-2xl border border-neutral-800">
          <CheckCircle2 size={48} className="text-emerald-500 mb-3" />
          <p className="text-white font-bold text-lg">No reports found</p>
          <p className="text-neutral-500 text-sm mt-1">Everything seems to be working perfectly!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredReports.map((report) => (
            <div key={report.id} className="bg-[#1a1d24] border border-orange-500/20 rounded-xl p-4 hover:border-orange-500/40 transition group">
              <div className="flex flex-col md:flex-row gap-6">
                
                {/* Movie Preview */}
                <div className="flex items-center gap-4 flex-1">
                   <div className="w-16 h-24 rounded-lg bg-neutral-800 relative overflow-hidden shrink-0 border border-neutral-700">
                      {report.movies?.image && (
                        <img src={report.movies.image} alt="" className="w-full h-full object-cover" />
                      )}
                      {!report.movies?.image && (
                        <div className="w-full h-full flex items-center justify-center text-neutral-600">
                          <Film size={24} />
                        </div>
                      )}
                   </div>
                   <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="bg-orange-500/20 text-orange-500 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">Broken Link Repoart</span>
                        <span className="text-neutral-500 text-[10px] flex items-center gap-1 font-medium">
                          <Clock size={10} /> {formatDate(report.created_at)}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-white truncate">{report.movie_title}</h3>
                      <div className="mt-2 flex items-center gap-3">
                         <a 
                           href={`/movie/${report.movie_id}`}
                           target="_blank"
                           className="text-xs font-bold text-blue-500 flex items-center gap-1 hover:underline"
                         >
                           <ExternalLink size={12} /> View Page
                         </a>
                         <span className="text-neutral-700">|</span>
                         <span className="text-xs text-neutral-500 truncate max-w-[200px] font-mono">
                           {report.movies?.video_url || 'No URL'}
                         </span>
                      </div>
                   </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                   <button 
                     onClick={() => resolveReport(report)}
                     className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold transition"
                   >
                     <CheckCircle2 size={16} /> Mark Fixed
                   </button>
                   <button 
                     onClick={() => deleteReport(report.id)}
                     className="p-2 text-neutral-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition"
                   >
                     <Trash2 size={20} />
                   </button>
                </div>

              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
