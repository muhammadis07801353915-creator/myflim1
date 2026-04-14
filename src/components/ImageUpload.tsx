import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface ImageUploadProps {
  value: string;
  onChange: (base64: string) => void;
  label?: string;
}

export default function ImageUpload({ value, onChange, label = "Image URL" }: ImageUploadProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <label className="text-sm font-medium text-neutral-300">{label}</label>
        <div className="relative group">
          <input 
            type="text" 
            value={value}
            placeholder="https://image.tmdb.org/t/p/w500/..." 
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 text-sm text-white outline-none focus:border-red-500 transition-all placeholder:text-neutral-600" 
          />
          {value && (
            <button 
              onClick={() => onChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white transition p-1"
            >
              <X size={16} />
            </button>
          )}
        </div>
        <p className="text-[10px] text-neutral-500">Paste an external image URL (e.g. from TMDB). Direct file uploads are disabled to improve performance.</p>
      </div>
      
      {value && (
        <div className="relative rounded-xl overflow-hidden border border-neutral-800 bg-neutral-900 aspect-video flex items-center justify-center group shadow-2xl">
          <img 
            src={value} 
            alt="Preview" 
            className="max-w-full max-h-full object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://placehold.co/600x400/1a1d24/white?text=Invalid+Image+URL';
            }}
          />
          <div className="absolute inset-x-0 bottom-0 bg-black/60 backdrop-blur-md py-2 px-3 translate-y-full group-hover:translate-y-0 transition-transform">
            <p className="text-[10px] text-neutral-400 truncate text-center">{value}</p>
          </div>
        </div>
      )}
    </div>
  );
}
