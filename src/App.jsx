import { useState, useEffect } from 'react';
import axios from 'axios';
import * as FingerprintJS from '@fingerprintjs/fingerprintjs';
import SelectGender from './SelectGender';
import Toast from './components/Toast';
import { containsBadWord } from './utils/badWords';
import { 
  MessageCircle, 
  Send, 
  RefreshCw, 
  User, 
  Users, 
  Moon, 
  Sun, 
  SkipForward, 
  RotateCcw,
  Flag,
  Megaphone,
  AlertTriangle,
  EyeOff,
  MapPinOff,
  HelpCircle,
  Loader2,
  Clock,
  FileText
} from 'lucide-react';

// const API_BASE_URL = 'http://localhost:8000/api';
const API_BASE_URL = 'https://talkvoid.rf.gd/api';

function App() {
  const [isDark, setIsDark] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme ? savedTheme === 'dark' : true;
  });

  // Device registration state
  const [isDeviceRegistered, setIsDeviceRegistered] = useState(false);
  const [userGender, setUserGender] = useState(null);
  const [checkingDevice, setCheckingDevice] = useState(true);
  const [fingerprint, setFingerprint] = useState(null);
  const [fingerprintLoaded, setFingerprintLoaded] = useState(false);

  // Chat states
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [randomMessage, setRandomMessage] = useState(null);
  const [loadingRandom, setLoadingRandom] = useState(false);
  const [randomError, setRandomError] = useState(null);
  const [activeTab, setActiveTab] = useState('send');
  const [viewedRandomMessages, setViewedRandomMessages] = useState([]);
  const [cooldown, setCooldown] = useState(false);
  const [cooldownTime, setCooldownTime] = useState(0);
  const [reportingMessageId, setReportingMessageId] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReportReason, setSelectedReportReason] = useState('');
  const [reportingLoading, setReportingLoading] = useState(false);
  
  // Reply states
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [replyToMessage, setReplyToMessage] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replySending, setReplySending] = useState(false);
  
  // Toast state
  const [toast, setToast] = useState(null);
  
  // Ban states
  const [isBanned, setIsBanned] = useState(false);
  const [banRemainingDays, setBanRemainingDays] = useState(0);
  const [checkingBan, setCheckingBan] = useState(true);

  // Fungsi untuk menampilkan toast
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Toggle theme
  const toggleTheme = () => {
    setIsDark(!isDark);
    localStorage.setItem('theme', !isDark ? 'dark' : 'light');
  };

  // Apply theme to document
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // Fungsi untuk memulai cooldown
  const startCooldown = () => {
    const cooldownUntil = Date.now() + (20 * 1000);
    setCooldown(true);
    setCooldownTime(20);
    localStorage.setItem('cooldownUntil', cooldownUntil.toString());
    
    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = Math.ceil((cooldownUntil - now) / 1000);
      
      if (remaining <= 0) {
        clearInterval(interval);
        setCooldown(false);
        setCooldownTime(0);
        localStorage.removeItem('cooldownUntil');
      } else {
        setCooldownTime(remaining);
      }
    }, 1000);
  };

  // Cek cooldown dari localStorage
  useEffect(() => {
    const savedCooldown = localStorage.getItem('cooldownUntil');
    if (savedCooldown) {
      const cooldownUntil = parseInt(savedCooldown);
      const now = Date.now();
      
      if (now < cooldownUntil) {
        const remainingSeconds = Math.ceil((cooldownUntil - now) / 1000);
        setCooldown(true);
        setCooldownTime(remainingSeconds);
        
        const interval = setInterval(() => {
          const currentNow = Date.now();
          const currentRemaining = Math.ceil((cooldownUntil - currentNow) / 1000);
          
          if (currentRemaining <= 0) {
            clearInterval(interval);
            setCooldown(false);
            setCooldownTime(0);
            localStorage.removeItem('cooldownUntil');
          } else {
            setCooldownTime(currentRemaining);
          }
        }, 1000);
        
        return () => clearInterval(interval);
      } else {
        localStorage.removeItem('cooldownUntil');
      }
    }
  }, []);

  // Load fingerprint
  useEffect(() => {
    const loadFingerprint = async () => {
      try {
        const fp = await FingerprintJS.load();
        const result = await fp.get();
        const deviceId = result.visitorId;
        setFingerprint(deviceId);
        localStorage.setItem('deviceFingerprint', deviceId);
      } catch (err) {
        console.error('Fingerprint error:', err);
        const fallback = btoa(JSON.stringify({
          userAgent: navigator.userAgent,
          screenWidth: screen.width,
          screenHeight: screen.height,
        }));
        setFingerprint(fallback);
        localStorage.setItem('deviceFingerprint', fallback);
      } finally {
        setFingerprintLoaded(true);
      }
    };

    loadFingerprint();
  }, []);

  // Check device registration
  useEffect(() => {
    if (!fingerprintLoaded || !fingerprint) return;

    const checkDevice = async () => {
      try {
        const response = await axios.post(`${API_BASE_URL}/device/check`, {
          fingerprint: fingerprint
        });

        if (response.data.registered) {
          setIsDeviceRegistered(true);
          setUserGender(response.data.gender);
          localStorage.setItem('userGender', response.data.gender);
        } else {
          localStorage.removeItem('userGender');
          localStorage.removeItem('deviceFingerprint');
          setIsDeviceRegistered(false);
          setUserGender(null);
        }
      } catch (error) {
        console.error('Error checking device:', error);
        setIsDeviceRegistered(false);
        setUserGender(null);
      } finally {
        setCheckingDevice(false);
      }
    };

    checkDevice();
  }, [fingerprint, fingerprintLoaded]);

  // Check ban status - HANYA jika device sudah terdaftar
  useEffect(() => {
    if (!isDeviceRegistered) {
      setCheckingBan(false);
      return;
    }
    
    if (!fingerprintLoaded || !fingerprint) {
      setCheckingBan(false);
      return;
    }

    const checkBanStatus = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/user/ban-status`, {
          params: { fingerprint: fingerprint }
        });
        
        setIsBanned(response.data.is_banned === true || response.data.is_banned === 1);
        setBanRemainingDays(response.data.remaining_days || 0);
      } catch (error) {
        console.error('Error checking ban status:', error);
        setIsBanned(false);
        setBanRemainingDays(0);
      } finally {
        setCheckingBan(false);
      }
    };

    checkBanStatus();
  }, [fingerprint, fingerprintLoaded, isDeviceRegistered]);

  // Handle gender selection
  const handleGenderSelected = (gender) => {
    setUserGender(gender);
    setIsDeviceRegistered(true);
  };

  // Kirim pesan
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    const savedCooldown = localStorage.getItem('cooldownUntil');
    if (savedCooldown) {
      const cooldownUntil = parseInt(savedCooldown);
      if (Date.now() < cooldownUntil) {
        showToast(`Tunggu ${Math.ceil((cooldownUntil - Date.now()) / 1000)} detik lagi!`, 'warning');
        return;
      } else {
        localStorage.removeItem('cooldownUntil');
        setCooldown(false);
      }
    }
    
    if (cooldown) {
      showToast(`Tunggu ${cooldownTime} detik lagi!`, 'warning');
      return;
    }
    
    if (!newMessage.trim()) return;
    const checkResult = containsBadWord(newMessage);
      if (checkResult.hasBadWord) {
        showToast(`Pesan mengandung kata terlarang: "${checkResult.matchedWord}"!`, 'error');
        return;
      }
    setSending(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/messages/send`, {
        sender: localStorage.getItem('userGender') === 'male' ? 'Anonymous Male' : 'Anonymous Female',
        gender: userGender,
        content: newMessage,
        fingerprint: fingerprint
      });

      if (response.data.success) {
        setMessages([...messages, {
          id: Date.now(),
          content: newMessage,
          sender: 'Anda',
          created_at: new Date().toISOString()
        }]);
        setNewMessage('');
        startCooldown();
        showToast('Pesan berhasil dikirim!', 'success');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      showToast('Gagal mengirim pesan', 'error');
    } finally {
      setSending(false);
    }
  };

  // Ambil pesan random
  const handleGetRandomMessage = async (resetViewed = false) => {
    setLoadingRandom(true);
    setRandomError(null);
    setRandomMessage(null);

    if (resetViewed) {
      setViewedRandomMessages([]);
    }

    try {
      const response = await axios.get(`${API_BASE_URL}/messages/random`, {
        params: {
          my_gender: userGender,
          fingerprint: fingerprint,
          exclude_ids: viewedRandomMessages
        },
        paramsSerializer: (params) => {
          const searchParams = new URLSearchParams();
          searchParams.append('my_gender', params.my_gender);
          searchParams.append('fingerprint', params.fingerprint);
          if (params.exclude_ids && params.exclude_ids.length > 0) {
            params.exclude_ids.forEach(id => {
              searchParams.append('exclude_ids[]', id);
            });
          }
          return searchParams.toString();
        }
      });
      
      const pesanYangDidapat = response.data.data;
      
      setViewedRandomMessages([...viewedRandomMessages, pesanYangDidapat.id]);
      
      setRandomMessage({
        id: pesanYangDidapat.id,
        sender: pesanYangDidapat.sender,
        gender: pesanYangDidapat.gender,
        content: pesanYangDidapat.content,
        created_at: pesanYangDidapat.created_at
      });
    } catch (error) {
      console.error('Error:', error);
      setRandomError(error.response?.data?.message || 'Belum ada pesan dari lawan jenis!');
    } finally {
      setLoadingRandom(false);
    }
  };

  // Kirim balasan
  const handleSendReply = async () => {
    if (!replyText.trim()) {
      showToast('Balasan tidak boleh kosong!', 'warning');
      return;
    }
    const checkResult = containsBadWord(replyText);
    if (checkResult.hasBadWord) {
      showToast(`Balasan mengandung kata terlarang: "${checkResult.matchedWord}"!`, 'error');
      return;
    }

    setReplySending(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/messages/send`, {
        sender: localStorage.getItem('userGender') === 'male' ? 'Anonymous Male' : 'Anonymous Female',
        gender: userGender,
        content: `[Balasan untuk: ${replyToMessage?.sender}] ${replyText}`,
        fingerprint: fingerprint
      });

      if (response.data.success) {
        showToast('Balasan berhasil dikirim!', 'success');
        setShowReplyModal(false);
        setReplyText('');
        setReplyToMessage(null);
      }
    } catch (error) {
      console.error('Error sending reply:', error);
      showToast('Gagal mengirim balasan', 'error');
    } finally {
      setReplySending(false);
    }
  };

  // Report pesan
  const handleReportMessage = async (messageId) => {
    if (!selectedReportReason) {
      showToast('Pilih alasan melaporkan pesan!', 'warning');
      return;
    }

    setReportingLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/report`, {
        message_id: messageId,
        fingerprint: fingerprint,
        reason: selectedReportReason
      });

      if (response.data.success) {
        showToast(`Pesan berhasil dilaporkan! (${response.data.report_count}/10 laporan)`, 'success');
        setShowReportModal(false);
        setSelectedReportReason('');
        
        if (response.data.is_hidden && randomMessage && randomMessage.id === messageId) {
          handleGetRandomMessage(false);
        }
      }
    } catch (error) {
      console.error('Error reporting message:', error);
      showToast('Gagal melaporkan pesan', 'error');
    } finally {
      setReportingLoading(false);
    }
  };

  const getGenderLabel = (genderValue) => {
    return genderValue === 'male' ? 'Laki-laki' : 'Perempuan';
  };

  // ========== LOADING SCREEN ==========
  const isLoading = checkingDevice || !fingerprintLoaded || (isDeviceRegistered && checkingBan);

  if (isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-[#1A1F2E]' : 'bg-gray-50'}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 mx-auto mb-4"></div>
          <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>
            {!fingerprintLoaded ? 'Memuat sidik jari perangkat...' : 
             checkingDevice ? 'Memeriksa perangkat...' : 
             'Memeriksa status akun...'}
          </p>
        </div>
      </div>
    );
  }

  // ========== GENDER SELECTION ==========
  if (!isDeviceRegistered) {
    return <SelectGender onGenderSelected={handleGenderSelected} isDark={isDark} onToggleTheme={toggleTheme} />;
  }

  // ========== HALAMAN BAN KHUSUS ==========
  if (isBanned === true || banRemainingDays > 0) {
    
    const formatRemainingTime = () => {
      if (banRemainingDays <= 0) return null;
      
      if (banRemainingDays >= 1) {
        const days = Math.floor(banRemainingDays);
        return `${days} hari`;
      }
      
      const hours = Math.floor(banRemainingDays * 24);
      if (hours >= 1) {
        return `${hours} jam`;
      }
      
      const minutes = Math.floor(banRemainingDays * 24 * 60);
      return `${minutes} menit`;
    };

    const remainingTimeText = formatRemainingTime();

    return (
      <div className={`min-h-screen flex items-center justify-center p-4 ${isDark ? 'bg-[#1A1F2E]' : 'bg-gray-50'}`}>
        <div className={`max-w-md w-full rounded-2xl p-8 text-center ${isDark ? 'bg-[#2A2F3E]' : 'bg-white'} shadow-2xl`}>
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
            <AlertTriangle className="w-10 h-10 text-red-500" />
          </div>
          <h2 className={`text-2xl font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-800'}`}>
            Anda Telah Diblokir
          </h2>
          <p className={`mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Anda telah diblokir karena melanggar aturan.
          </p>
          
          {remainingTimeText && (
            <div className={`p-3 rounded-xl mb-6 ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
              <p className={`text-sm ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`}>
                <Clock className="w-4 h-4 inline mr-2" />
                Sisa waktu blokir: <strong>{remainingTimeText}</strong>
              </p>
            </div>
          )}
          
          <div className={`p-3 rounded-xl text-left text-sm mb-6 ${isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>
            <p className="font-semibold mb-2">
              <FileText className="w-4 h-4 inline mr-2" />
              Alasan umum pemblokiran:
            </p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Mengirim spam atau promosi</li>
              <li>Pelecehan atau bullying terhadap pengguna lain</li>
              <li>Chat yang tidak pantas</li>
              <li>Memalsukan lokasi</li>
            </ul>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-all flex items-center justify-center gap-2 mx-auto"
          >
            <RefreshCw className="w-4 h-4" />
            Muat Ulang Halaman
          </button>
        </div>
      </div>
    );
  }

  // ========== HALAMAN UTAMA ==========
  return (
      <div className={`min-h-screen transition-all duration-300 ${isDark ? 'bg-[#1A1F2E]' : 'bg-gray-50'}`}>
        
        {/* Header */}
        <header className={`border-b ${isDark ? 'border-gray-700 bg-[#2A2F3E]/80' : 'border-gray-200 bg-white/80'} backdrop-blur-md sticky top-0 z-50`}>
    <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <MessageCircle className={`w-6 h-6 ${isDark ? 'text-soft-beige' : 'text-gray-700'}`} />
        <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>TalkVoid</h1>
        <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'}`}>
          {userGender === 'male' ? (
            <span className="text-sm">♂</span>
          ) : (
            <span className="text-sm">♀</span>
          )}
          {getGenderLabel(userGender)}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={toggleTheme}
          className={`p-2 rounded-lg transition-all ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
        >
          {isDark ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-gray-600" />}
        </button>
      </div>
    </div>
  </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Tab Navigation */}
        <div className={`flex gap-2 mb-6 p-1 rounded-xl ${isDark ? 'bg-[#2A2F3E]' : 'bg-gray-200'}`}>
          <button
            onClick={() => setActiveTab('send')}
            className={`flex-1 py-2 rounded-lg font-medium transition-all ${activeTab === 'send' ? (isDark ? 'bg-soft-beige text-[#1A1F2E]' : 'bg-white text-gray-800 shadow-sm') : (isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700')}`}
          >
            <Send className="w-4 h-4 inline mr-1" />
            Kirim Pesan
          </button>
          <button
            onClick={() => setActiveTab('receive')}
            className={`flex-1 py-2 rounded-lg font-medium transition-all ${activeTab === 'receive' ? (isDark ? 'bg-soft-beige text-[#1A1F2E]' : 'bg-white text-gray-800 shadow-sm') : (isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700')}`}
          >
            <RefreshCw className="w-4 h-4 inline mr-1" />
            Pesan Random
          </button>
        </div>

        {/* Kirim Pesan Tab */}
        {activeTab === 'send' && (
          <div className={`rounded-2xl p-6 ${isDark ? 'bg-[#2A2F3E]/80' : 'bg-white'} shadow-xl`}>
            <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
              Kirim Pesan Anonim
            </h2>
            
            <div className={`mb-4 p-3 rounded-xl text-sm flex items-center gap-2 ${
              isDark 
                ? 'bg-gray-700/50 border border-gray-600 text-gray-300' 
                : 'bg-gray-100 border border-gray-200 text-gray-600'
            }`}>
              <AlertTriangle className={`w-5 h-5 flex-shrink-0 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
              <p className="text-xs">
                Dilarang mengirim spam, pelecehan, konten tidak pantas, atau memalsukan lokasi. 
                Pelanggaran akan mengakibatkan Anda diblokir.
              </p>
            </div>
            
            <form onSubmit={handleSendMessage}>
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Tulis pesan Anda di sini..."
                rows="4"
                disabled={cooldown}
                className={`w-full p-3 rounded-xl border focus:outline-none focus:ring-1 transition-all ${isDark ? 'bg-[#1E2332] border-gray-700 text-white focus:ring-soft-beige disabled:opacity-50' : 'bg-gray-50 border-gray-300 text-gray-800 focus:ring-gray-400 disabled:opacity-50'}`}
              />
              <button
                type="submit"
                disabled={sending || !newMessage.trim() || cooldown}
                className={`mt-4 px-6 py-2 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${isDark ? 'bg-soft-beige text-[#1A1F2E] hover:bg-soft-brown' : 'bg-gray-800 text-white hover:bg-gray-700'}`}
              >
                <Send className="w-4 h-4 inline mr-1" />
                {sending ? 'Mengirim...' : cooldown ? `Tunggu ${cooldownTime}s` : 'Kirim Pesan'}
              </button>
            </form>

            {messages.length > 0 && (
              <div className="mt-6">
                <h3 className={`text-sm font-medium mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Pesan Terkirim:</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {messages.map((msg) => (
                    <div key={msg.id} className={`p-3 rounded-xl ${isDark ? 'bg-[#1E2332]' : 'bg-gray-100'}`}>
                      <p className={isDark ? 'text-gray-300' : 'text-gray-700'}>{msg.content}</p>
                      <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        {new Date(msg.created_at).toLocaleTimeString('id-ID')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Pesan Random Tab */}
        {activeTab === 'receive' && (
          <div className={`rounded-2xl p-6 ${isDark ? 'bg-[#2A2F3E]/80' : 'bg-white'} shadow-xl`}>
            <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
              Pesan dari Lawan Jenis
            </h2>
            <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Anda terdaftar sebagai: <strong>{getGenderLabel(userGender)}</strong>
              <br />
              Mencari pesan dari: <strong>{userGender === 'male' ? 'Perempuan' : 'Laki-laki'}</strong>
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-2 mb-4">
              <button
                onClick={() => handleGetRandomMessage(false)}
                disabled={loadingRandom}
                className={`flex-1 px-4 py-2 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${isDark ? 'bg-soft-beige text-[#1A1F2E] hover:bg-soft-brown' : 'bg-gray-800 text-white hover:bg-gray-700'}`}
              >
                {loadingRandom ? (
                  <><RefreshCw className="w-4 h-4 inline mr-1 animate-spin" /> Mencari...</>
                ) : (
                  <><RefreshCw className="w-4 h-4 inline mr-1" /> Ambil Pesan</>
                )}
              </button>

              {randomMessage && !loadingRandom && (
                <button
                  onClick={() => handleGetRandomMessage(false)}
                  className="flex-1 px-4 py-2 rounded-xl font-semibold transition-all bg-gray-500 text-white hover:bg-gray-600"
                >
                  <SkipForward className="w-4 h-4 inline mr-1" />
                  Skip / Lainnya
                </button>
              )}
            </div>

            {viewedRandomMessages.length >= 3 && !loadingRandom && (
              <div className="mt-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                  <p className={`text-xs ${isDark ? 'text-yellow-400' : 'text-yellow-700'}`}>
                    Anda sudah melihat {viewedRandomMessages.length} pesan
                  </p>
                  <button
                    onClick={() => handleGetRandomMessage(true)}
                    className="text-xs px-4 py-1.5 rounded-lg bg-yellow-500 text-white hover:bg-yellow-600 transition-all"
                  >
                    <RotateCcw className="w-3 h-3 inline mr-1" />
                    Reset & Lihat Lagi
                  </button>
                </div>
              </div>
            )}

            {randomError && (
              <div className={`mt-4 p-3 rounded-xl text-center ${isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-600'}`}>
                {randomError}
                <button
                  onClick={() => handleGetRandomMessage(false)}
                  className="ml-2 text-xs underline"
                >
                  Coba lagi
                </button>
              </div>
            )}

            {randomMessage && (
              <div className={`mt-4 p-4 rounded-xl ${isDark ? 'bg-[#1E2332]' : 'bg-gray-100'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm font-medium ${isDark ? 'text-soft-beige' : 'text-gray-600'}`}>
                    <User className="w-4 h-4 inline mr-1" />
                    {randomMessage.sender}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-600'}`}>
                      {getGenderLabel(randomMessage.gender)}
                    </span>
                    
                    <button
                      onClick={() => {
                        setReplyToMessage(randomMessage);
                        setShowReplyModal(true);
                      }}
                      className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-500 hover:bg-blue-500 hover:text-white transition-all flex items-center gap-1"
                    >
                      <Send className="w-3 h-3" />
                      Balas
                    </button>
                    
                    <button
                      onClick={() => {
                        setReportingMessageId(randomMessage.id);
                        setShowReportModal(true);
                      }}
                      className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center gap-1"
                    >
                      <Flag className="w-3 h-3" />
                      Laporkan
                    </button>
                  </div>
                </div>
                <p className={isDark ? 'text-white' : 'text-gray-800'}>"{randomMessage.content}"</p>
                <p className={`text-xs mt-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  {new Date(randomMessage.created_at).toLocaleString('id-ID')}
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modal Report */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`max-w-md w-full rounded-2xl p-6 ${isDark ? 'bg-[#2A2F3E]' : 'bg-white'} shadow-2xl`}>
            <div className="flex items-center gap-2 mb-4">
              <Flag className={`w-5 h-5 ${isDark ? 'text-red-400' : 'text-red-500'}`} />
              <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                Laporkan Pesan
              </h3>
            </div>
            <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Mengapa Anda melaporkan pesan ini?
            </p>
            
            <div className="space-y-2 mb-6">
              {[
                { value: 'spam', label: 'Spam / Promosi', icon: <Megaphone className="w-4 h-4" /> },
                { value: 'harassment', label: 'Pelecehan / Bullying', icon: <AlertTriangle className="w-4 h-4" /> },
                { value: 'inappropriate', label: 'Konten Tidak Pantas', icon: <EyeOff className="w-4 h-4" /> },
                { value: 'fake_location', label: 'Lokasi Palsu', icon: <MapPinOff className="w-4 h-4" /> },
                { value: 'other', label: 'Lainnya', icon: <HelpCircle className="w-4 h-4" /> }
              ].map(reason => (
                <label key={reason.value} className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
                  <input
                    type="radio"
                    name="reportReason"
                    value={reason.value}
                    checked={selectedReportReason === reason.value}
                    onChange={(e) => setSelectedReportReason(e.target.value)}
                    className="w-4 h-4 accent-red-500"
                  />
                  <span className={isDark ? 'text-red-400' : 'text-red-500'}>
                    {reason.icon}
                  </span>
                  <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{reason.label}</span>
                </label>
              ))}
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowReportModal(false);
                  setSelectedReportReason('');
                }}
                className="flex-1 py-2 rounded-xl font-semibold bg-gray-500 text-white hover:bg-gray-600 transition-all"
              >
                Batal
              </button>
              <button
                onClick={() => handleReportMessage(reportingMessageId)}
                disabled={!selectedReportReason || reportingLoading}
                className="flex-1 py-2 rounded-xl font-semibold bg-red-500 text-white hover:bg-red-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {reportingLoading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Memproses...</>
                ) : (
                  <><Flag className="w-4 h-4" /> Laporkan</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Reply */}
      {showReplyModal && replyToMessage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`max-w-md w-full rounded-2xl p-6 ${isDark ? 'bg-[#2A2F3E]' : 'bg-white'} shadow-2xl`}>
            <div className="flex items-center gap-2 mb-4">
              <Send className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-500'}`} />
              <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                Balas Pesan
              </h3>
            </div>
            
            <div className={`mb-4 p-3 rounded-xl text-sm ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                <strong>Pesan asli:</strong>
              </p>
              <p className={`text-sm mt-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                "{replyToMessage.content}"
              </p>
              <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                Dari: {replyToMessage.sender} ({getGenderLabel(replyToMessage.gender)})
              </p>
            </div>
            
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Tulis balasan Anda di sini..."
              rows="4"
              className={`w-full p-3 rounded-xl border focus:outline-none focus:ring-1 transition-all ${isDark ? 'bg-[#1E2332] border-gray-700 text-white focus:ring-blue-500' : 'bg-gray-50 border-gray-300 text-gray-800 focus:ring-blue-500'}`}
            />
            
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => {
                  setShowReplyModal(false);
                  setReplyText('');
                  setReplyToMessage(null);
                }}
                className="flex-1 py-2 rounded-xl font-semibold bg-gray-500 text-white hover:bg-gray-600 transition-all"
              >
                Batal
              </button>
              <button
                onClick={handleSendReply}
                disabled={!replyText.trim() || replySending}
                className="flex-1 py-2 rounded-xl font-semibold bg-blue-500 text-white hover:bg-blue-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {replySending ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Mengirim...</>
                ) : (
                  <><Send className="w-4 h-4" /> Kirim Balasan</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Footer Copyright */}
      <footer className={`py-5 text-center border-t ${isDark ? 'border-gray-800 text-gray-500' : 'border-gray-200 text-gray-400'} ${activeTab === 'receive' && !randomMessage ? 'mt-32' : 'mt-10'}`}>
        <p className="text-xs">
          &copy; {new Date().getFullYear()} TalkVoid. All rights reserved.
        </p>
        <p className="text-xs mt-1 opacity-70">
          Developed by h3h3y
        </p>
      </footer>
    </div>
  );
}

export default App;
