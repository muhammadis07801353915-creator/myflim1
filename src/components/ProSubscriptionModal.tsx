import { useState } from 'react';
import { X, CheckCircle, ShieldCheck, Server, Download, Key } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getDeviceId, setProStatus } from '../lib/pro';

interface ProSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProSubscriptionModal({ isOpen, onClose }: ProSubscriptionModalProps) {
  const [step, setStep] = useState<'benefits' | 'activate' | 'success'>('benefits');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expiryDate, setExpiryDate] = useState('');

  if (!isOpen) return null;

  const handleActivate = async () => {
    if (!code.trim()) {
      setError('Please enter a code');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const { data, error: fetchError } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('code', code.trim())
        .single();

      if (fetchError || !data) {
        setError('Invalid code. Please check and try again.');
        setLoading(false);
        return;
      }

      const now = new Date();
      let expiresAt = data.expires_at ? new Date(data.expires_at) : null;

      if (expiresAt && expiresAt < now) {
        setError('This code has expired.');
        setLoading(false);
        return;
      }

      const deviceId = getDeviceId();

      if (!data.activated_at) {
        // First time activation
        expiresAt = new Date(now.getTime() + data.duration_days * 24 * 60 * 60 * 1000);
        const { error: updateError } = await supabase
          .from('promo_codes')
          .update({
            activated_at: now.toISOString(),
            expires_at: expiresAt.toISOString(),
            device_id: deviceId
          })
          .eq('id', data.id);

        if (updateError) throw updateError;
      } else {
        // Already activated, just transfer device
        const { error: updateError } = await supabase
          .from('promo_codes')
          .update({ device_id: deviceId })
          .eq('id', data.id);

        if (updateError) throw updateError;
      }

      setProStatus(data.code, expiresAt!.toISOString());
      setExpiryDate(expiresAt!.toLocaleDateString());
      setStep('success');
    } catch (err: any) {
      setError(err.message || 'An error occurred while activating the code.');
    }
    
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#1a1d24] w-full max-w-md rounded-3xl overflow-hidden border border-neutral-800 animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="p-5 border-b border-neutral-800 flex justify-between items-center bg-[#22252D]">
          <h3 className="text-xl font-bold text-white flex items-center">
            <ShieldCheck className="text-red-500 mr-2" /> 
            {step === 'benefits' ? 'Become a PRO' : step === 'activate' ? 'Activate Code' : 'Success'}
          </h3>
          <button 
            onClick={onClose}
            className="w-8 h-8 bg-neutral-800 hover:bg-neutral-700 rounded-full flex items-center justify-center text-neutral-400 hover:text-white transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          
          {step === 'benefits' && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <div className="text-4xl font-bold text-white mb-2">PRO <span className="text-lg text-neutral-400 font-normal">Access</span></div>
                <p className="text-neutral-400 text-sm">Unlock the ultimate streaming experience.</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="mt-1 w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center text-red-500 shrink-0">
                    <CheckCircle size={14} />
                  </div>
                  <div>
                    <p className="font-medium text-white">Unlock all PRO sections</p>
                    <p className="text-xs text-neutral-400">Get access to premium movies, series, and live TV channels.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="mt-1 w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center text-red-500 shrink-0">
                    <Server size={14} />
                  </div>
                  <div>
                    <p className="font-medium text-white">Fast & Uninterrupted Servers</p>
                    <p className="text-xs text-neutral-400">Watch in 4K without buffering on our dedicated VIP servers.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="mt-1 w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center text-red-500 shrink-0">
                    <Download size={14} />
                  </div>
                  <div>
                    <p className="font-medium text-white">Offline Downloads</p>
                    <p className="text-xs text-neutral-400">Download any movie or series and watch it later without internet.</p>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setStep('activate')}
                className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition mt-4 shadow-lg shadow-red-600/20 flex items-center justify-center space-x-2"
              >
                <Key size={18} />
                <span>Enter Activation Code</span>
              </button>
            </div>
          )}

          {step === 'activate' && (
            <div className="space-y-5">
              <p className="text-neutral-300 text-sm mb-4 text-center">Enter your PRO activation code below. The code will be linked to this device.</p>
              
              {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded-lg text-sm text-center">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-400">Activation Code</label>
                <input 
                  type="text" 
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. PRO-XXXX-YYYY" 
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 text-white outline-none focus:border-red-500 transition text-center tracking-widest font-mono text-lg" 
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <button 
                  onClick={() => setStep('benefits')}
                  className="flex-1 py-3.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl font-medium transition"
                  disabled={loading}
                >
                  Back
                </button>
                <button 
                  onClick={handleActivate}
                  disabled={loading}
                  className="flex-[2] py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition shadow-lg shadow-red-600/20 disabled:opacity-50"
                >
                  {loading ? 'Activating...' : 'Activate PRO'}
                </button>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center py-6 space-y-4">
              <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={40} className="text-emerald-500" />
              </div>
              <h3 className="text-2xl font-bold text-white">PRO Activated!</h3>
              <p className="text-neutral-400 text-sm">
                Your device has been upgraded to PRO. Enjoy the premium features!
              </p>
              <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-3 inline-block mt-2">
                <p className="text-xs text-neutral-500">Valid until</p>
                <p className="text-emerald-500 font-medium">{expiryDate}</p>
              </div>
              <button 
                onClick={() => {
                  onClose();
                  window.location.reload(); // Reload to apply PRO features globally
                }}
                className="w-full py-3.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl font-bold transition mt-6"
              >
                Start Watching
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
