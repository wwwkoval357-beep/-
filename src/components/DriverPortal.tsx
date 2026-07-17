import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, Lock, Phone, Car, MapPin, LogOut, CheckCircle2, 
  RefreshCw, Eye, EyeOff, Save, Edit2, Shield, Circle, 
  FileText, Settings, Key, X, Truck, AlertTriangle
} from 'lucide-react';
import { Driver, TowOrder } from '../types';

interface DriverPortalProps {
  onClose: () => void;
  onRefreshAllOrders?: () => void;
}

export default function DriverPortal({ onClose, onRefreshAllOrders }: DriverPortalProps) {
  // Auth state
  const [driver, setDriver] = useState<Driver | null>(() => {
    try {
      const stored = localStorage.getItem('logged_driver');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Form states
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regCity, setRegCity] = useState('');
  const [regPlate, setRegPlate] = useState('');
  const [regVehicleType, setRegVehicleType] = useState('Легковий евакуатор');

  // Edit states
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editPlate, setEditPlate] = useState('');
  const [editVehicleType, setEditVehicleType] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [changePasswordChecked, setChangePasswordChecked] = useState(false);

  // Assigned orders state
  const [assignedOrders, setAssignedOrders] = useState<TowOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Sync state with localStorage
  useEffect(() => {
    if (driver) {
      localStorage.setItem('logged_driver', JSON.stringify(driver));
      // Initialize edit fields
      setEditName(driver.name);
      setEditPhone(driver.phone);
      setEditCity(driver.city || '');
      setEditPlate(driver.vehiclePlate);
      setEditVehicleType(driver.vehicleType || 'Легковий евакуатор');
      setEditPassword('');
      fetchAssignedOrders(driver.id);
    } else {
      localStorage.removeItem('logged_driver');
      setAssignedOrders([]);
    }
  }, [driver]);

  // Fetch orders assigned to driver
  const fetchAssignedOrders = async (driverId: string) => {
    setLoadingOrders(true);
    try {
      const response = await fetch(`/api/driver/orders?driverId=${driverId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAssignedOrders(data.orders);
        }
      }
    } catch (err) {
      console.error('Failed to fetch driver orders:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  // Fetch latest driver profile details
  const fetchDriverProfile = async (driverId: string) => {
    try {
      const response = await fetch(`/api/driver/profile?id=${driverId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.driver) {
          setDriver(data.driver);
        }
      }
    } catch (err) {
      console.error('Failed to fetch driver profile:', err);
    }
  };

  // Poll assigned orders and profile status when portal is open
  useEffect(() => {
    if (!driver) return;
    
    // Initial fetch of profile on mount/login
    fetchDriverProfile(driver.id);
    
    const interval = setInterval(() => {
      fetchAssignedOrders(driver.id);
      fetchDriverProfile(driver.id);
    }, 2500);

    return () => clearInterval(interval);
  }, [driver]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!loginPhone || !loginPassword) {
      setError('Будь ласка, введіть номер телефону та пароль');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/driver/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: loginPhone, password: loginPassword }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setDriver(data.driver);
        setSuccess('Ви успішно увійшли в кабінет!');
        setError(null);
      } else {
        setError(data.error || 'Неправильний номер телефону або пароль');
      }
    } catch (err) {
      setError('Помилка мережі при вході. Спробуйте пізніше.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!regName || !regPhone || !regPassword || !regPlate) {
      setError('Будь ласка, заповніть всі обов\'язкові поля');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/driver/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName,
          phone: regPhone,
          password: regPassword,
          city: regCity,
          vehiclePlate: regPlate,
          vehicleType: regVehicleType
        }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setDriver(data.driver);
        setSuccess('Ваш аккаунт успішно зареєстровано!');
        setError(null);
      } else {
        setError(data.error || 'Помилка реєстрації');
      }
    } catch (err) {
      setError('Помилка мережі при реєстрації. Спробуйте пізніше.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (status: Driver['status']) => {
    if (!driver) return;
    setError(null);

    try {
      const response = await fetch('/api/driver/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: driver.id, status }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setDriver(data.driver);
        if (onRefreshAllOrders) onRefreshAllOrders();
      } else {
        setError(data.error || 'Не вдалося оновити статус');
      }
    } catch (err) {
      setError('Помилка оновлення статусу');
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!driver) return;
    setError(null);
    setLoading(true);

    try {
      const payload: any = {
        id: driver.id,
        name: editName,
        phone: editPhone,
        city: editCity,
        vehiclePlate: editPlate,
        vehicleType: editVehicleType,
      };

      if (changePasswordChecked && editPassword) {
        payload.password = editPassword;
      }

      const response = await fetch('/api/driver/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setDriver(data.driver);
        setIsEditing(false);
        setEditPassword('');
        setChangePasswordChecked(false);
        setSuccess('Профіль успішно оновлено!');
        if (onRefreshAllOrders) onRefreshAllOrders();
      } else {
        setError(data.error || 'Помилка збереження профілю');
      }
    } catch (err) {
      setError('Помилка мережі при збереженні профілю');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: TowOrder['status']) => {
    setError(null);
    try {
      const response = await fetch('/api/admin/update-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId, status }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        if (driver) {
          fetchAssignedOrders(driver.id);
        }
        if (onRefreshAllOrders) onRefreshAllOrders();
      } else {
        setError(data.error || 'Не вдалося оновити статус замовлення');
      }
    } catch (err) {
      setError('Помилка мережі при оновленні статусу замовлення');
    }
  };

  const handleLogout = () => {
    setDriver(null);
    localStorage.removeItem('logged_driver');
    setIsEditing(false);
    setSuccess('Ви вийшли з кабінету');
  };

  // Status helper
  const getStatusBadge = (status: Driver['status']) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Вільний / Працюю
          </span>
        );
      case 'busy':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            На виклику
          </span>
        );
      case 'offline':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-slate-800 text-slate-400 border border-slate-700">
            <span className="w-2 h-2 rounded-full bg-slate-500" />
            Офлайн
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/85 backdrop-blur-md cursor-pointer"
      />

      {/* Main Container */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-800/80 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
      >
        {/* Header decoration blur */}
        <div className="absolute top-0 left-1/4 w-40 h-40 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 right-0 w-40 h-40 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between z-10 bg-slate-900/50 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-2.5 rounded-xl">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display font-black text-lg uppercase tracking-wide text-white">
                {driver ? "Кабінет Водія" : "Портал Евакуаторів"}
              </h2>
              <p className="text-xs text-slate-400">
                {driver ? `Вітаємо, ${driver.name}!` : "Реєстрація та вхід для партнерів-водіїв"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto flex-1 z-10 space-y-6">
          {/* Messages */}
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-4 py-3 rounded-xl flex items-center gap-2.5 text-xs font-semibold"
            >
              <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          {success && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-3 rounded-xl flex items-center gap-2.5 text-xs font-semibold"
            >
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>{success}</span>
            </motion.div>
          )}

          {/* AUTHENTICATION SCREEN */}
          {!driver ? (
            <div className="space-y-6">
              {/* Tab Selector */}
              <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-slate-850">
                <button
                  onClick={() => { setActiveTab('login'); setError(null); }}
                  className={`flex-1 py-3 text-xs uppercase font-black tracking-wider rounded-xl transition-all cursor-pointer ${
                    activeTab === 'login'
                      ? 'bg-slate-800 text-amber-400 shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  🚪 ВХІД
                </button>
                <button
                  onClick={() => { setActiveTab('register'); setError(null); }}
                  className={`flex-1 py-3 text-xs uppercase font-black tracking-wider rounded-xl transition-all cursor-pointer ${
                    activeTab === 'register'
                      ? 'bg-slate-800 text-amber-400 shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  📝 РЕЄСТРАЦІЯ
                </button>
              </div>

              {/* Login Form */}
              {activeTab === 'login' && (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-400 font-bold uppercase tracking-wider block">
                      Номер телефону (Логін)
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500">
                        <Phone className="h-4 w-4" />
                      </span>
                      <input
                        type="text"
                        placeholder="+380XXXXXXXXX"
                        value={loginPhone}
                        onChange={(e) => setLoginPhone(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors placeholder:text-slate-600"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-400 font-bold uppercase tracking-wider block">
                      Пароль
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500">
                        <Lock className="h-4 w-4" />
                      </span>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-11 pr-12 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors placeholder:text-slate-600"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-white cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-amber-500 hover:bg-amber-400 active:bg-amber-600 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-black py-4 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-amber-500/5 mt-4"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Виконується вхід...
                      </span>
                    ) : (
                      "🚪 Увійти як водій"
                    )}
                  </button>

                  <div className="text-center pt-2">
                    <p className="text-[10px] text-slate-500 leading-normal">
                      💡 Маєте підключений евакуатор та хочете отримувати замовлення по всій Україні? Зареєструйтесь безкоштовно прямо зараз та налаштуйте свій робочий статус.
                    </p>
                  </div>
                </form>
              )}

              {/* Registration Form */}
              {activeTab === 'register' && (
                <form onSubmit={handleRegister} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs text-slate-400 font-bold uppercase tracking-wider block">
                      Ваше Ім'я (ПІБ) *
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500">
                        <User className="h-4 w-4" />
                      </span>
                      <input
                        type="text"
                        placeholder="Олександр Петренко"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors placeholder:text-slate-600"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-400 font-bold uppercase tracking-wider block">
                      Номер телефону (Логін) *
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500">
                        <Phone className="h-4 w-4" />
                      </span>
                      <input
                        type="text"
                        placeholder="+380XXXXXXXXX"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors placeholder:text-slate-600"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-400 font-bold uppercase tracking-wider block">
                      Пароль *
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500">
                        <Lock className="h-4 w-4" />
                      </span>
                      <input
                        type="password"
                        placeholder="••••••"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors placeholder:text-slate-600"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-400 font-bold uppercase tracking-wider block">
                      Державний номер авто (Евакуатора) *
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500">
                        <Car className="h-4 w-4" />
                      </span>
                      <input
                        type="text"
                        placeholder="BC 1234 HP"
                        value={regPlate}
                        onChange={(e) => setRegPlate(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors placeholder:text-slate-600 uppercase"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-400 font-bold uppercase tracking-wider block">
                      Базове місто *
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500">
                        <MapPin className="h-4 w-4" />
                      </span>
                      <input
                        type="text"
                        placeholder="Львів, Київ, тощо"
                        value={regCity}
                        onChange={(e) => setRegCity(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors placeholder:text-slate-600"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs text-slate-400 font-bold uppercase tracking-wider block">
                      Тип / Характеристики Евакуатора *
                    </label>
                    <select
                      value={regVehicleType}
                      onChange={(e) => setRegVehicleType(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors appearance-none cursor-pointer"
                    >
                      <option value="Легковий евакуатор">Легковий евакуатор (до 3 тонн)</option>
                      <option value="Евакуатор з маніпулятором">Евакуатор з краном-маніпулятором</option>
                      <option value="Вантажний евакуатор">Вантажний евакуатор (важка техніка)</option>
                      <option value="Зі зсувною платформою">Евакуатор зі зсувною гідравлічною платформою</option>
                      <option value="Двох'ярусний евакуатор">Двох'ярусний евакуатор</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2 pt-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:bg-slate-800 disabled:text-slate-600 text-white font-black py-4 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-emerald-500/5"
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          Створення аккаунту...
                        </span>
                      ) : (
                        "📝 Зареєструватись в системі"
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            /* DRIVER PORTAL - LOGGED IN */
            <div className="space-y-6">
              {/* Profile Card & Status Control */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-5 space-y-4 relative overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center font-bold text-lg">
                      {driver.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-base text-white">{driver.name}</h3>
                      <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                        <Car className="h-3.5 w-3.5 text-slate-500" />
                        <span>{driver.vehiclePlate}</span>
                        <span className="text-slate-600">•</span>
                        <span>{driver.vehicleType || "Евакуатор"}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {getStatusBadge(driver.status)}
                    <button
                      onClick={() => setIsEditing(!isEditing)}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-slate-800 border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white rounded-lg text-xs font-bold transition-all cursor-pointer active:scale-95"
                    >
                      <Edit2 className="h-3 w-3" />
                      {isEditing ? "Закрити редактор" : "Редагувати"}
                    </button>
                  </div>
                </div>

                {/* Status Segmented Control */}
                <div className="pt-3 border-t border-slate-900 grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleUpdateStatus('active')}
                    className={`py-2 px-3 rounded-xl text-center text-xs font-black tracking-wider transition-all cursor-pointer ${
                      driver.status === 'active'
                        ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-extrabold'
                        : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    🟢 ВІЛЬНИЙ
                  </button>
                  <button
                    onClick={() => handleUpdateStatus('busy')}
                    className={`py-2 px-3 rounded-xl text-center text-xs font-black tracking-wider transition-all cursor-pointer ${
                      driver.status === 'busy'
                        ? 'bg-amber-500/15 border border-amber-500/30 text-amber-400 font-extrabold'
                        : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    🟡 ЗАЙНЯТИЙ
                  </button>
                  <button
                    onClick={() => handleUpdateStatus('offline')}
                    className={`py-2 px-3 rounded-xl text-center text-xs font-black tracking-wider transition-all cursor-pointer ${
                      driver.status === 'offline'
                        ? 'bg-slate-800 border border-slate-700 text-slate-300 font-extrabold'
                        : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    🔴 ОФЛАЙН
                  </button>
                </div>
              </div>

              {/* EDITING PROFILE MODE */}
              <AnimatePresence>
                {isEditing && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <form onSubmit={handleSaveProfile} className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-5 space-y-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <h4 className="font-display font-black text-xs uppercase tracking-wider text-amber-400 sm:col-span-2 flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        Редагування профілю та авто
                      </h4>

                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">ПІБ</label>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3.5 text-xs text-white focus:outline-none focus:border-amber-500 transition-colors"
                          required
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Телефон</label>
                        <input
                          type="text"
                          value={editPhone}
                          onChange={(e) => setEditPhone(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3.5 text-xs text-white focus:outline-none focus:border-amber-500 transition-colors"
                          required
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Місто</label>
                        <input
                          type="text"
                          value={editCity}
                          onChange={(e) => setEditCity(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3.5 text-xs text-white focus:outline-none focus:border-amber-500 transition-colors"
                          required
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Номер машини</label>
                        <input
                          type="text"
                          value={editPlate}
                          onChange={(e) => setEditPlate(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3.5 text-xs text-white focus:outline-none focus:border-amber-500 transition-colors uppercase"
                          required
                        />
                      </div>

                      <div className="space-y-1 sm:col-span-2">
                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Тип евакуатора</label>
                        <select
                          value={editVehicleType}
                          onChange={(e) => setEditVehicleType(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-amber-500 transition-colors cursor-pointer"
                        >
                          <option value="Легковий евакуатор">Легковий евакуатор (до 3 тонн)</option>
                          <option value="Евакуатор з маніпулятором">Евакуатор з краном-маніпулятором</option>
                          <option value="Вантажний евакуатор">Вантажний евакуатор (важка техніка)</option>
                          <option value="Зі зсувною платформою">Евакуатор зі зсувною гідравлічною платформою</option>
                          <option value="Двох'ярусний евакуатор">Двох'ярусний евакуатор</option>
                        </select>
                      </div>

                      <div className="space-y-3 sm:col-span-2">
                        <label className="flex items-center gap-2 text-slate-300 font-bold text-xs cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={changePasswordChecked}
                            onChange={(e) => setChangePasswordChecked(e.target.checked)}
                            className="w-4 h-4 rounded border-slate-850 bg-slate-950 text-amber-500 focus:ring-amber-500 cursor-pointer"
                          />
                          <span>Змінити пароль входу в кабінет</span>
                        </label>

                        {changePasswordChecked && (
                          <div className="space-y-1 animate-fadeIn">
                            <label className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">Новий пароль *</label>
                            <input
                              type="password"
                              autoComplete="new-password"
                              required
                              placeholder="Введіть новий пароль"
                              value={editPassword}
                              onChange={(e) => setEditPassword(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3.5 text-xs text-white focus:outline-none focus:border-amber-500 transition-colors placeholder:text-slate-700"
                            />
                          </div>
                        )}
                      </div>

                      <div className="sm:col-span-2 pt-2 flex items-center gap-3">
                        <button
                          type="submit"
                          disabled={loading}
                          className="flex-1 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 disabled:bg-slate-850 text-slate-950 font-black py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md"
                        >
                          {loading ? "Збереження..." : "💾 Зберегти зміни"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsEditing(false)}
                          className="bg-slate-900 border border-slate-800 text-slate-400 hover:text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-slate-800 transition-all cursor-pointer"
                        >
                          Скасувати
                        </button>
                      </div>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* MY ORDERS SECTION */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-black text-xs uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <FileText className="h-4 w-4" />
                    Мої поточні виклики ({assignedOrders.length})
                  </h3>
                  <button
                    onClick={() => fetchAssignedOrders(driver.id)}
                    className="p-1.5 bg-slate-800 border border-slate-700 hover:bg-slate-700 hover:text-white rounded-lg text-slate-400 hover:border-slate-650 transition-colors cursor-pointer active:scale-95"
                    title="Оновити список"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${loadingOrders ? 'animate-spin text-amber-500' : ''}`} />
                  </button>
                </div>

                {/* Orders flow */}
                <div className="space-y-3.5">
                  {assignedOrders.length === 0 ? (
                    <div className="bg-slate-950/30 border border-dashed border-slate-800/80 rounded-2xl py-8 text-center px-4">
                      <Truck className="h-8 w-8 text-slate-600 mx-auto mb-2 opacity-50" />
                      <p className="text-xs text-slate-400 font-medium">Зараз у вас немає призначених замовлень.</p>
                      <p className="text-[10px] text-slate-500 max-w-xs mx-auto mt-1 leading-normal">
                        Коли диспетчер призначить вас на замовлення, воно з'явиться тут зі всіма даними клієнта. Змініть статус на "🟢 Вільний", щоб отримувати виклики!
                      </p>
                    </div>
                  ) : (
                    assignedOrders.map((order) => (
                      <div key={order.id} className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4.5 space-y-3.5 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-2.5">
                          {order.status === 'dispatched' && (
                            <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
                              В дорозі
                            </span>
                          )}
                          {order.status === 'completed' && (
                            <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
                              Виконано
                            </span>
                          )}
                        </div>

                        <div>
                          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest font-mono">
                            Замовлення {order.orderNumber || `#${order.id.slice(0, 5).toUpperCase()}`}
                          </span>
                          <h4 className="font-display font-black text-sm text-white mt-0.5">
                            {order.fromLocation.split(',')[0]} ➔ {order.toLocation.split(',')[0]}
                          </h4>
                        </div>

                        {/* Order info details */}
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 bg-slate-900/60 p-3 rounded-xl border border-slate-850 text-[11px] text-slate-300">
                          <div>
                            <span className="text-slate-500 font-semibold block mb-0.5">Клієнт</span>
                            <span className="font-bold text-white">{order.name}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 font-semibold block mb-0.5">Телефон</span>
                            <a href={`tel:${order.phone}`} className="font-bold text-amber-400 hover:underline">
                              {order.phone}
                            </a>
                          </div>
                          <div className="col-span-2 pt-1.5 border-t border-slate-850 mt-1">
                            <span className="text-slate-500 font-semibold block mb-0.5">Звідки (Повна адреса)</span>
                            <span className="font-medium text-slate-200">{order.fromLocation}</span>
                          </div>
                          <div className="col-span-2 pt-1.5 border-t border-slate-850">
                            <span className="text-slate-500 font-semibold block mb-0.5">Куди (Повна адреса)</span>
                            <span className="font-medium text-slate-200">{order.toLocation}</span>
                          </div>
                          <div className="pt-2 border-t border-slate-850 mt-1">
                            <span className="text-slate-500 font-semibold block mb-0.5">Ціна замовлення</span>
                            <span className="font-extrabold text-emerald-400">{order.estimatedPrice} грн</span>
                          </div>
                          <div className="pt-2 border-t border-slate-850 mt-1">
                            <span className="text-slate-500 font-semibold block mb-0.5">Тип авто</span>
                            <span className="font-medium text-slate-300">{order.vehicleType}</span>
                          </div>
                        </div>

                        {/* Driver controls for the order status */}
                        {order.status === 'dispatched' && (
                          <div className="flex gap-2.5">
                            <button
                              onClick={() => handleUpdateOrderStatus(order.id, 'completed')}
                              className="flex-1 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-black py-3 rounded-xl uppercase tracking-wider transition-all cursor-pointer shadow-md"
                            >
                              🏁 Водій прибув на місце події
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* LOGOUT BUTTON CONTAINER */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                <span className="text-[10px] text-slate-500 font-medium">
                  ID партнера: {driver.id}
                </span>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/25 text-rose-400 hover:text-rose-300 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer active:scale-95"
                >
                  <LogOut className="h-4 w-4" />
                  Вийти з кабінету
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
