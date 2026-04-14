import { Star, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { useLanguage } from '../lib/LanguageContext';
import { useWatchlist } from '../lib/useWatchlist';

export default function Watchlist({ onSelect }: { onSelect: (item: any) => void }) {
  const { t } = useLanguage();
  const { watchlist, removeFromWatchlist } = useWatchlist();

  return (
    <div className="p-4 pt-8 pb-24 text-white light-mode:text-black">
      <h1 className="text-3xl font-bold mb-6">{t.watchlist}</h1>
      
      {watchlist.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[50vh] text-neutral-500">
          <p>Your watchlist is empty.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {watchlist.map(movie => (
            <div key={movie.id} className="flex space-x-4 rtl:space-x-reverse bg-neutral-900/50 hover:bg-neutral-900 border border-transparent hover:border-neutral-800 rounded-xl p-3 relative transition group">
              <div className="w-24 h-32 relative shrink-0 cursor-pointer rounded-lg overflow-hidden" onClick={() => onSelect(movie)}>
                <Image src={movie.image} alt={movie.title} fill sizes="96px" className="object-cover" />
              </div>
              <div className="flex-1 py-1 cursor-pointer min-w-0" onClick={() => onSelect(movie)}>
                <h3 className="font-bold text-base md:text-lg pr-8 rtl:pr-0 rtl:pl-8 truncate">{movie.title}</h3>
                <div className="flex items-center text-sm text-neutral-400 mt-1 mb-2">
                  <span className="flex items-center text-yellow-500 mr-3 rtl:mr-0 rtl:ml-3 min-w-fit"><Star size={14} className="mr-1 rtl:mr-0 rtl:ml-1 fill-current" /> {movie.rating}</span>
                  <span className="truncate">{movie.year}</span>
                </div>
                <p className="text-xs md:text-sm text-neutral-500 line-clamp-2 leading-relaxed">{movie.genre}</p>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); removeFromWatchlist(movie.id); }}
                className="absolute top-4 right-4 rtl:right-auto rtl:left-4 text-neutral-600 hover:text-red-500 hover:bg-red-500/10 p-2 rounded-full transition"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
