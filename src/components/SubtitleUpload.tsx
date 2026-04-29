import { useState, useRef } from 'react';
import { Upload, X, FileText, Check, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface SubtitleUploadProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
}

export default function SubtitleUpload({ value, onChange, label = "Subtitle File" }: SubtitleUploadProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = `subtitles/${fileName}`;

      // Try to upload to 'subtitles' bucket. If it doesn't exist, this might fail.
      const { data, error } = await supabase.storage
        .from('movies') // Using 'movies' bucket as it likely exists and has RLS for uploads
        .upload(filePath, file);

      if (error) {
        // Fallback to 'images' or just show error
        throw error;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('movies')
        .getPublicUrl(filePath);

      onChange(publicUrl);
    } catch (err: any) {
      console.error('Upload error:', err);
      alert('Error uploading file: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4 w-full">
      <div className="space-y-1">
        <label className="text-sm font-medium text-neutral-300">{label}</label>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 group">
            <input 
              type="text" 
              value={value}
              placeholder="https://.../subtitle.vtt" 
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
          
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center justify-center space-x-2 bg-neutral-800 hover:bg-neutral-700 text-white px-6 py-3 rounded-lg transition disabled:opacity-50 min-w-[140px]"
          >
            {uploading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : value ? (
              <Check size={18} className="text-emerald-500" />
            ) : (
              <Upload size={18} />
            )}
            <span>{uploading ? 'Uploading...' : value ? 'Changed' : 'Upload'}</span>
          </button>
          
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleUpload}
            accept=".vtt,.srt"
            className="hidden" 
          />
        </div>
        <p className="text-[10px] text-neutral-500">Upload a .vtt or .srt file or paste a direct link.</p>
      </div>
    </div>
  );
}
