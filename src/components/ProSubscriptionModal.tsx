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
                 <div className="bg-red-600 inline-block px-6 py-2 mb-4 font-black tracking-widest text-white text-xl">
                    MYFILM
                 </div>
                 <h2 className="text-xl font-bold text-white mb-2">Subscribe to <span className="text-red-500">PRO</span></h2>
                 <p className="text-neutral-400 text-sm px-4">
                    Subscribe to PRO version and enjoy exclusive benefits listed below
                 </p>
              </div>

              <div className="space-y-3 px-2">
                 <h3 className="text-lg font-bold text-white mb-3">Why go with <span className="text-red-500">PRO?</span></h3>
                 {[
                   'Fully Ad free experience',
                   'Access to all the premium tracks',
                   'Technical support',
                   'Cancel anytime'
                 ].map((benefit, i) => (
                   <div key={i} className="flex items-center space-x-3">
                     <div className="w-5 h-5 rounded overflow-hidden bg-white flex items-center justify-center shrink-0">
                        <CheckCircle size={14} className="text-neutral-900" />
                     </div>
                     <span className="text-sm font-medium text-white">{benefit}</span>
                   </div>
                 ))}
              </div>

              <div className="space-y-3 mt-6">
                 <div className="bg-[#111317] border border-neutral-800 rounded-2xl p-4 flex justify-between items-center relative overflow-hidden group hover:border-neutral-700 transition">
                    <div className="relative z-10 w-2/3">
                       <h4 className="font-bold text-white text-lg">Monthly</h4>
                       <p className="text-[10px] text-neutral-400 mt-1 leading-tight">Access to premium content & ad-free experience for month</p>
                    </div>
                    <div className="relative z-10 text-right">
                       <span className="text-red-500 font-black text-xl">3,000 <span className="text-sm">IQD</span></span>
                    </div>
                 </div>

                 <div className="bg-[#111317] border border-red-500/50 rounded-2xl p-4 flex justify-between items-center relative overflow-hidden group">
                    <div className="absolute inset-0 bg-red-500/5 group-hover:bg-red-500/10 transition-colors" />
                    <div className="relative z-10 w-2/3">
                       <h4 className="font-bold text-white text-lg">Yearly</h4>
                       <p className="text-[10px] text-neutral-400 mt-1 leading-tight">Enjoy all premium features for a full year and best price</p>
                    </div>
                    <div className="relative z-10 text-right">
                       <span className="text-red-500 font-black text-xl">30,000 <span className="text-sm">IQD</span></span>
                    </div>
                 </div>
              </div>

              <p className="text-[9px] text-neutral-500 text-center px-4 leading-relaxed mt-4">
                 After 3 day free trial, this subscription automatically renews as per the plan. Subscription will automatically renew unless cancelled within 24 hours before the end of the current period.
              </p>

              <button 
                onClick={() => setStep('activate')}
                className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition mt-4 flex items-center justify-center space-x-2"
              >
                <span>Subscribe (Enter Code)</span>
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
