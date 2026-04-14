import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Star, Search, Trophy, ArrowUp, ArrowDown, X } from 'lucide-react';

export default function TopContents() {
  const [movies, setMovies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchMovies();
  }, []);

  const fetchMovies = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('movies')
      .select('*')
      .order('top_rank', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false });
    
    if (data) setMovies(data);
    setLoading(false);
  };

  const updateRank = async (id: number, rank: number | null) => {
    const { error } = await supabase
      .from('movies')
      .update({ top_rank: rank })
      .eq('id', id);
    
    if (!error) {
      setMovies(movies.map(m => m.id === id ? { ...m, top_rank: rank } : m));
    }
  };

  const filteredMovies = movies.filter(m => 
    m.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const topRanked = movies.filter(m => m.top_rank).sort((a, b) => a.top_rank - b.top_rank);

  return (
    <div className="text-white space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center">
            <Trophy className="mr-2 text-yellow-500" />
            Top Contents Management
          </h1>
          <p className="text-neutral-400 text-sm mt-1">Manage the top 10 or more featured contents with numbers.</p>
        </div>
      </div>

      {/* Current Top List */}
      <div className="bg-[#1a1d24] border border-neutral-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          <Star size={18} className="mr-2 text-yellow-500 fill-current" />
          Current Top Ranked
        </h2>
        
        {topRanked.length === 0 ? (
          <div className="text-center py-10 border-2 border-dashed border-neutral-800 rounded-xl text-neutral-500">
            No movies ranked yet. Search below to add.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {topRanked.map((movie) => (
              <div key={movie.id} className="bg-neutral-900 border border-neutral-800 rounded-lg p-3 flex items-center space-x-4">
                <div className="text-2xl font-black text-neutral-700 w-8">#{movie.top_rank}</div>
                <img src={movie.image} className="w-12 h-16 object-cover rounded" alt="" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{movie.title}</p>
                  <p className="text-xs text-neutral-500">{movie.type}</p>
                </div>
                <div className="flex items-center space-x-1">
                  <button 
                    onClick={() => updateRank(movie.id, null)}
                    className="p-2 hover:bg-red-500/10 text-neutral-500 hover:text-red-500 rounded-lg transition"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Search and Add */}
      <div className="bg-[#1a1d24] border border-neutral-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-neutral-800">
          <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 w-full sm:w-80">
            <Search size={18} className="text-neutral-500" />
            <input 
              type="text" 
              placeholder="Search movies to rank..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-sm ml-2 w-full text-white"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-900/50 text-neutral-400">
              <tr>
                <th className="px-6 py-4 font-medium">Movie</th>
                <th className="px-6 py-4 font-medium">Current Rank</th>
                <th className="px-6 py-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {filteredMovies.map((movie) => (
                <tr key={movie.id} className="hover:bg-neutral-800/50 transition">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <img src={movie.image} className="w-8 h-10 object-cover rounded" alt="" />
                      <span className="font-medium">{movie.title}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {movie.top_rank ? (
                      <span className="bg-yellow-500/10 text-yellow-500 px-2 py-1 rounded text-xs font-bold">
                        Rank #{movie.top_rank}
                      </span>
                    ) : (
                      <span className="text-neutral-600">Not Ranked</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <input 
                        type="number" 
                        placeholder="Rank"
                        className="w-16 bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-xs outline-none focus:border-red-500"
                        onBlur={(e) => {
                          const val = e.target.value ? parseInt(e.target.value) : null;
                          if (val !== movie.top_rank) updateRank(movie.id, val);
                        }}
                        defaultValue={movie.top_rank || ''}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
