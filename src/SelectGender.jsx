import { useState, useEffect } from 'react';
import axios from 'axios';
import * as FingerprintJS from '@fingerprintjs/fingerprintjs';
import { 
  MessageCircle, 
  User, 
  Users, 
  Loader2, 
  Rocket,
  Shield,
  AlertTriangle,
} from 'lucide-react';

const API_BASE_URL = 'https://talkvoid.rf.gd/api';

function SelectGender({ onGenderSelected }) {
  const [selectedGender, setSelectedGender] = useState('male');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fingerprint, setFingerprint] = useState(null);

  // Inisialisasi FingerprintJS saat komponen dimuat
  useEffect(() => {
    const loadFingerprint = async () => {
      try {
        // Load FingerprintJS
        const fp = await FingerprintJS.load();
        // Dapatkan visitorId
        const result = await fp.get();
        setFingerprint(result.visitorId);
      } catch (err) {
        console.error('Gagal memuat fingerprint:', err);
        // Fallback ke metode lama jika FingerprintJS gagal
        const fallbackFingerprint = btoa(JSON.stringify({
          userAgent: navigator.userAgent,
          screenWidth: screen.width,
          screenHeight: screen.height,
        }));
        setFingerprint(fallbackFingerprint);
      }
    };

    loadFingerprint();
  }, []); // Kosong karena hanya dijalankan sekali saat mount

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!fingerprint) {
        setError('Memuat sidik jari perangkat, coba lagi...');
        setLoading(false);
        return;
    }

    try {
        const response = await axios.post(`${API_BASE_URL}/device/register`, {
        fingerprint: fingerprint,
        gender: selectedGender
        });

        if (response.data.success) {
        localStorage.setItem('userGender', response.data.gender);
        localStorage.setItem('deviceFingerprint', fingerprint);
        onGenderSelected(response.data.gender);
        }
    } catch (err) {
        // Tangkap error 400 (Bad Request) karena sudah terdaftar
        if (err.response?.status === 400) {
        setError('Tidak bisa memilih gender ulang! Device anda dibanned.');
        } else {
        setError(err.response?.data?.message || 'Gagal menyimpan pilihan. Coba lagi!');
        }
    } finally {
        setLoading(false);
    }
    };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-50 to-gray-100">
      
      <div className="max-w-md w-full rounded-3xl p-8 shadow-xl bg-white/90 backdrop-blur-md border border-gray-200">
        
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-4" style={{ backgroundColor: 'rgba(26, 31, 46, 0.1)' }}>
            <MessageCircle className="w-10 h-10" style={{ color: '#1A1F2E' }} />
          </div>
          <h1 className="text-3xl font-bold mb-2 text-gray-800">
            TalkVoid
          </h1>
          <p className="text-sm text-gray-500 mt-4 mb-4 px-1.5 mx-auto flex items-center justify-center gap-2 text-center leading-relaxed">
            <span>Platform chat anonim yang mempertemukan Anda dengan orang lain secara acak. Kirim pesan dan terima pesan dari orang-orang di sekitar Anda.</span>
          </p>
          <p className="text-gray-500">
            Pilih gender Anda
          </p>
          {/* Loading indicator fingerprint */}
          {!fingerprint && (
            <p className="text-xs text-gray-400 mt-2 flex items-center justify-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              Memuat sidik jari perangkat...
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-8">
            <label className="block text-sm font-medium mb-3 text-center text-gray-600">
              <Users className="inline w-4 h-4 mr-1" style={{ color: '#1A1F2E' }} />
              Saya adalah:
            </label>
            <div className="flex gap-4 p-1.5 rounded-xl bg-gray-100">
              <label className={`flex-1 flex flex-col items-center gap-2 py-4 rounded-xl cursor-pointer transition-all ${
                selectedGender === 'male' 
                  ? 'shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
              }`} style={selectedGender === 'male' ? { backgroundColor: '#E5E7EB', color: '#1A1F2E' } : {}}>
                <input
                  type="radio"
                  value="male"
                  checked={selectedGender === 'male'}
                  onChange={(e) => setSelectedGender(e.target.value)}
                  className="hidden"
                />
                <User className="w-8 h-8" style={{ color: selectedGender === 'male' ? '#1A1F2E' : '#9CA3AF' }} />
                <span className="text-sm font-medium" style={{ color: selectedGender === 'male' ? '#1A1F2E' : '#6B7280' }}>Laki-laki</span>
              </label>
              <label className={`flex-1 flex flex-col items-center gap-2 py-4 rounded-xl cursor-pointer transition-all ${
                selectedGender === 'female' 
                  ? 'shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
              }`} style={selectedGender === 'female' ? { backgroundColor: '#E5E7EB', color: '#1A1F2E' } : {}}>
                <input
                  type="radio"
                  value="female"
                  checked={selectedGender === 'female'}
                  onChange={(e) => setSelectedGender(e.target.value)}
                  className="hidden"
                />
                <Users className="w-8 h-8" style={{ color: selectedGender === 'female' ? '#1A1F2E' : '#9CA3AF' }} />
                <span className="text-sm font-medium" style={{ color: selectedGender === 'female' ? '#1A1F2E' : '#6B7280' }}>Perempuan</span>
              </label>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl text-center text-sm bg-red-50 border border-red-200 text-red-600">
              <Shield className="inline w-4 h-4 mr-1" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !fingerprint}
            className="w-full py-3 rounded-xl font-semibold transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-white hover:shadow-lg hover:scale-[0.98]"
            style={{ backgroundColor: '#1A1F2E' }}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Rocket className="w-5 h-5" />
                Mulai Chat
              </>
            )}
          </button>
        </form>

        <div className="text-center text-xs mt-6 text-gray-400">
          <div className="flex items-center justify-center gap-2 mb-1">
            <AlertTriangle className="w-5 h-5" style={{ color: '#EAB308' }} />
            <span className="text-xs text-red-400">Gender hanya dipilih sekali</span>
          </div>
          <p className="text-xs text-red-400">Memalsukan gender dapat menyebabkan anda dibanned</p>
        </div>

        {/* ========== FOOTER COPYRIGHT ========== */}
      <footer className="mt-2 py-4 text-center">
        <p className="text-xs text-dark-400">
          &copy; {new Date().getFullYear()} TalkVoid. All rights reserved.
        </p>
        <p className="text-xs text-dark-400 mt-1 opacity-70">
          Developed by h3h3y
        </p>
      </footer>
      </div>
    </div>
  );
}

export default SelectGender;
