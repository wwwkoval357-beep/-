import React, { useState, useEffect } from 'react';
import { 
  Shield, LogOut, RefreshCw, CheckCircle2, Clock, Trash2, 
  Phone, MapPin, Car, AlertTriangle, ChevronRight, ExternalLink,
  Copy, Check, Navigation, ListFilter, TrendingUp, HelpCircle,
  Plus, User, UserCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TowOrder, Driver } from '../types';

interface AdminPanelProps {
  onClose: () => void;
  allOrders: TowOrder[];
  onRefreshOrders: () => Promise<void>;
}

type FilterType = 'all' | 'pending' | 'active' | 'completed';

export default function AdminPanel({ onClose, allOrders, onRefreshOrders }: AdminPanelProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('is_admin_logged') === 'true';
  });
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [editingEtaId, setEditingEtaId] = useState<string | null>(null);
  const [customEta, setCustomEta] = useState<number>(15);
  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null);
  const [copiedPhoneId, setCopiedPhoneId] = useState<string | null>(null);
  const [currentFilter, setCurrentFilter] = useState<FilterType>('all');

  const [activeTab, setActiveTab] = useState<'orders' | 'drivers'>('orders');
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isDriverFormOpen, setIsDriverFormOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  
  // Driver form states
  const [driverFormName, setDriverFormName] = useState('');
  const [driverFormPhone, setDriverFormPhone] = useState('');
  const [driverFormPlate, setDriverFormPlate] = useState('');
  const [driverFormCity, setDriverFormCity] = useState('');
  const [driverFormStatus, setDriverFormStatus] = useState<'active' | 'busy' | 'offline'>('active');

  const [assigningOrderId, setAssigningOrderId] = useState<string | null>(null);

  const fetchDrivers = async () => {
    try {
      const response = await fetch('/api/admin/drivers');
      if (response.ok) {
        const data = await response.json();
        setDrivers(data);
      }
    } catch (err) {
      console.error('Failed to fetch drivers:', err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchDrivers();
    }
  }, [isAuthenticated]);

  // Auto-refresh orders every 7 seconds for live updates
  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(async () => {
      await onRefreshOrders();
    }, 7000);
    return () => clearInterval(interval);
  }, [isAuthenticated, onRefreshOrders]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const response = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setIsAuthenticated(true);
        localStorage.setItem('is_admin_logged', 'true');
        setPassword('');
      } else {
        setError(data.error || 'Неправильний пароль');
      }
    } catch (err) {
      setError('Помилка сервера. Спробуйте ще раз.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('is_admin_logged');
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await onRefreshOrders();
    setTimeout(() => setIsRefreshing(false), 800);
  };

  const handleUpdateStatus = async (id: string, status: 'searching' | 'dispatched' | 'completed', etaMinutes?: number) => {
    try {
      const body: any = { id, status };
      if (typeof etaMinutes === 'number') {
        body.etaMinutes = etaMinutes;
      }
      const response = await fetch('/api/admin/update-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (response.ok) {
        await onRefreshOrders();
        setEditingEtaId(null);
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleDeleteOrder = async (id: string) => {
    if (!window.confirm('Ви впевнені, що хочете остаточно видалити це замовлення?')) return;
    try {
      const response = await fetch('/api/admin/delete-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (response.ok) {
        await onRefreshOrders();
      }
    } catch (err) {
      console.error('Failed to delete order:', err);
    }
  };

  const handleSaveDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: Partial<Driver> = {
        name: driverFormName,
        phone: driverFormPhone,
        vehiclePlate: driverFormPlate,
        city: driverFormCity,
        status: driverFormStatus,
      };
      if (editingDriver) {
        payload.id = editingDriver.id;
      }

      const response = await fetch('/api/admin/drivers/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        setDrivers(data.drivers);
        setIsDriverFormOpen(false);
        setEditingDriver(null);
        // Reset form
        setDriverFormName('');
        setDriverFormPhone('');
        setDriverFormPlate('');
        setDriverFormCity('');
        setDriverFormStatus('active');
      } else {
        const errData = await response.json();
        alert(errData.error || 'Помилка при збереженні');
      }
    } catch (err) {
      console.error('Failed to save driver:', err);
    }
  };

  const handleDeleteDriver = async (id: string) => {
    if (!window.confirm('Ви впевнені, що хочете видалити цього водія з бази?')) return;
    try {
      const response = await fetch('/api/admin/drivers/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (response.ok) {
        const data = await response.json();
        setDrivers(data.drivers);
      }
    } catch (err) {
      console.error('Failed to delete driver:', err);
    }
  };

  const handleAssignDriver = async (orderId: string, driverId: string | null) => {
    try {
      const response = await fetch('/api/admin/assign-driver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, driverId }),
      });
      if (response.ok) {
        await onRefreshOrders();
        setAssigningOrderId(null);
      }
    } catch (err) {
      console.error('Failed to assign driver:', err);
    }
  };

  const copyToClipboard = (text: string, type: 'id' | 'phone', targetId: string) => {
    navigator.clipboard.writeText(text);
    if (type === 'id') {
      setCopiedOrderId(targetId);
      setTimeout(() => setCopiedOrderId(null), 2000);
    } else {
      setCopiedPhoneId(targetId);
      setTimeout(() => setCopiedPhoneId(null), 2000);
    }
  };

  // Stats calculation
  const stats = {
    total: allOrders.length,
    pending: allOrders.filter(o => o.status === 'pending').length,
    active: allOrders.filter(o => o.status === 'searching' || o.status === 'dispatched').length,
    completed: allOrders.filter(o => o.status === 'completed').length,
  };

  // Filtered orders
  const filteredOrders = allOrders.filter(o => {
    if (currentFilter === 'pending') return o.status === 'pending';
    if (currentFilter === 'active') return o.status === 'searching' || o.status === 'dispatched';
    if (currentFilter === 'completed') return o.status === 'completed';
    return true; // 'all'
  });

  const getStatusBadge = (status: TowOrder['status']) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-500/15 text-rose-400 border border-rose-500/30 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Новий запит
          </span>
        );
      case 'searching':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
            Пошук авто
          </span>
        );
      case 'dispatched':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-sky-500/15 text-sky-400 border border-sky-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
            В дорозі
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
            Виконано
          </span>
        );
      default:
        return null;
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-lg">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 relative shadow-2xl overflow-hidden"
          id="admin-auth-panel"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col items-center text-center mb-8">
            <div className="bg-amber-500/10 text-amber-400 p-4 rounded-2xl mb-4 border border-amber-500/20 shadow-inner">
              <Shield className="h-8 w-8" />
            </div>
            <h2 className="font-display font-black text-2xl tracking-wider uppercase text-white">
              Вхід для <span className="text-amber-500">Адміністратора</span>
            </h2>
            <p className="text-xs text-slate-400 mt-2 font-medium max-w-xs">
              Авторизуйтесь за допомогою PIN-коду для доступу до панелі замовлень евакуатора.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Пароль доступу
                </label>
                <span className="text-[10px] text-slate-500 font-bold">СПЕЦ-КЛЮЧ</span>
              </div>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••"
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl px-4 py-4 text-center font-mono font-black tracking-widest text-2xl focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/50 transition-all placeholder:text-slate-800 placeholder:tracking-normal"
                  autoFocus
                />
              </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -5 }} 
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2.5 p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs font-bold text-rose-400"
              >
                <AlertTriangle className="h-4.5 w-4.5 shrink-0 text-rose-400" />
                <span>{error}</span>
              </motion.div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-slate-950 border border-slate-850 hover:border-slate-700 text-slate-400 hover:text-white font-bold py-3.5 rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                Скасувати
              </button>
              <button
                type="submit"
                className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-3.5 rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg hover:shadow-amber-500/20 cursor-pointer"
              >
                Увійти
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col overflow-hidden">
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="w-full h-full bg-slate-950 flex flex-col relative"
        id="admin-dashboard-panel"
      >
        {/* Subtle decorative glow effects */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto w-full h-full flex flex-col overflow-hidden border-x border-slate-900/60 shadow-2xl">

        {/* Dashboard Header */}
        <div className="px-6 py-4.5 border-b border-slate-850/80 flex items-center justify-between bg-slate-900/90 backdrop-blur-md sticky top-0 z-20 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="bg-amber-500 text-slate-950 p-2.5 rounded-xl shadow-md shadow-amber-500/10">
              <Shield className="h-5.5 w-5.5" />
            </div>
            <div className="hidden sm:block">
              <div className="flex items-center gap-2">
                <h3 className="font-display font-black text-lg tracking-wider uppercase text-white leading-none">
                  Диспетчер <span className="text-amber-500">Евакуатора</span>
                </h3>
                <span className="bg-amber-500/10 text-amber-400 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider border border-amber-500/20">
                  Live
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1 font-bold uppercase tracking-widest">
                Режим керування замовленнями
              </p>
            </div>
          </div>

          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-850/60 mx-2">
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-2.5 py-1.5 text-[10px] sm:text-[11px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                activeTab === 'orders'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              📋 Замовлення
            </button>
            <button
              onClick={() => setActiveTab('drivers')}
              className={`px-2.5 py-1.5 text-[10px] sm:text-[11px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                activeTab === 'drivers'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              👨‍✈️ Водії
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-850 rounded-xl text-slate-300 hover:text-white transition-all cursor-pointer disabled:opacity-50"
              title="Оновити дані"
            >
              <RefreshCw className={`h-4.5 w-4.5 ${isRefreshing ? 'animate-spin text-amber-500' : ''}`} />
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-1.5 px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-xl text-rose-400 text-xs font-bold transition-all cursor-pointer"
              title="Вийти з кабінету"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Вийти</span>
            </button>
            <button
              onClick={onClose}
              className="p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-850 rounded-xl text-slate-400 hover:text-white transition-all cursor-pointer font-bold"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Dashboard Quick Stats Row */}
        {activeTab === 'orders' && (
          <div className="px-6 py-4 bg-slate-950/40 border-b border-slate-850/60 grid grid-cols-4 gap-3 shrink-0">
            <button 
              onClick={() => setCurrentFilter('all')}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                currentFilter === 'all' 
                  ? 'bg-slate-800 border-slate-700 shadow-md' 
                  : 'bg-slate-900/30 border-slate-850 hover:border-slate-800'
              }`}
            >
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Всього</p>
              <p className="text-xl font-black text-white mt-1">{stats.total}</p>
            </button>

            <button 
              onClick={() => setCurrentFilter('pending')}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                currentFilter === 'pending' 
                  ? 'bg-rose-950/20 border-rose-500/40 shadow-md' 
                  : 'bg-slate-900/30 border-slate-850 hover:border-slate-850'
              }`}
            >
              <div className="flex justify-between items-center">
                <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Нові</p>
                {stats.pending > 0 && (
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                  </span>
                )}
              </div>
              <p className="text-xl font-black text-rose-400 mt-1">{stats.pending}</p>
            </button>

            <button 
              onClick={() => setCurrentFilter('active')}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                currentFilter === 'active' 
                  ? 'bg-sky-950/20 border-sky-500/40 shadow-md' 
                  : 'bg-slate-900/30 border-slate-850 hover:border-slate-850'
              }`}
            >
              <p className="text-[10px] font-black text-sky-400 uppercase tracking-widest">В роботі</p>
              <p className="text-xl font-black text-sky-400 mt-1">{stats.active}</p>
            </button>

            <button 
              onClick={() => setCurrentFilter('completed')}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                currentFilter === 'completed' 
                  ? 'bg-emerald-950/20 border-emerald-500/40 shadow-md' 
                  : 'bg-slate-900/30 border-slate-850 hover:border-slate-850'
              }`}
            >
              <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Виконані</p>
              <p className="text-xl font-black text-emerald-400 mt-1">{stats.completed}</p>
            </button>
          </div>
        )}

        {/* Filters and Search Bar */}
        {activeTab === 'orders' && (
          <div className="px-6 py-3 bg-slate-950/20 border-b border-slate-850/40 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
              <ListFilter className="h-4 w-4 text-amber-500" />
              <span>Фільтр списку:</span>
            </div>
            <div className="flex gap-1">
              {(['all', 'pending', 'active', 'completed'] as FilterType[]).map((filter) => {
                const label = {
                  all: 'Всі',
                  pending: 'Нові',
                  active: 'Активні',
                  completed: 'Виконані'
                }[filter];
                return (
                  <button
                    key={filter}
                    onClick={() => setCurrentFilter(filter)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      currentFilter === filter 
                        ? 'bg-amber-500 text-slate-950 shadow-sm' 
                        : 'text-slate-400 hover:text-white bg-slate-900/40 border border-slate-850/40'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Scrollable Order List Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'orders' ? (
            filteredOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-slate-850 rounded-3xl bg-slate-950/10">
              <div className="bg-slate-900/60 p-4 rounded-2xl mb-4 text-slate-500 border border-slate-850">
                <Car className="h-10 w-10 text-slate-400" />
              </div>
              <p className="text-slate-300 font-bold">Немає замовлень у цій категорії</p>
              <p className="text-xs text-slate-500 mt-1.5 max-w-xs">
                {currentFilter === 'all' 
                  ? "Замовлень взагалі немає. Як тільки хтось порахує вартість або замовить - воно з'явиться!"
                  : "Спробуйте змінити фільтр вкладок, щоб побачити інші замовлення."}
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {filteredOrders.map((order) => {
                const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(order.fromLocation)}&destination=${encodeURIComponent(order.toLocation)}`;
                
                return (
                  <div 
                    key={order.id}
                    className={`bg-slate-950/40 border rounded-2xl overflow-hidden transition-all duration-300 hover:border-slate-700 shadow-xl relative group ${
                      order.status === 'pending' ? 'border-rose-500/25 bg-rose-950/5' : 'border-slate-850'
                    }`}
                  >
                    {/* Background glow highlights for new requests */}
                    {order.status === 'pending' && (
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-rose-500" />
                    )}

                    {/* Order header card */}
                    <div className="px-5 py-4 border-b border-slate-900 bg-slate-950/60 flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center space-x-2.5">
                        <span className="bg-amber-500 text-slate-950 font-mono font-black px-3 py-1 rounded-xl text-xs flex items-center gap-1 shadow-inner select-none">
                          {order.orderNumber || `#${order.id.toUpperCase()}`}
                        </span>
                        
                        <button 
                          onClick={() => copyToClipboard(order.orderNumber || order.id, 'id', order.id)}
                          className="p-1 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-all border border-slate-850"
                          title="Скопіювати номер замовлення"
                        >
                          {copiedOrderId === order.id ? (
                            <Check className="h-3 w-3 text-emerald-400" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>

                        <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">
                          {order.createdAt}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2">
                        {getStatusBadge(order.status)}
                      </div>
                    </div>

                    {/* Order Details Body */}
                    <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-900/10">
                      {/* Left: Customer Profile & Tow Spec */}
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                            <span>ПРОФІЛЬ КЛІЄНТА</span>
                          </h4>
                          <div className="bg-slate-950/60 border border-slate-850 rounded-xl p-3.5 space-y-3 shadow-inner">
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-slate-400 font-bold">Ім'я:</span>
                              <span className="text-sm font-black text-white">{order.name || 'Гість'}</span>
                            </div>
                            <div className="flex justify-between items-center pt-2.5 border-t border-slate-900/60">
                              <span className="text-xs text-slate-400 font-bold">Телефон:</span>
                              <div className="flex items-center gap-2">
                                <a 
                                  href={`tel:${order.phone}`} 
                                  className="text-sm font-black text-amber-400 hover:underline flex items-center gap-1"
                                >
                                  <Phone className="h-3.5 w-3.5" />
                                  {order.phone}
                                </a>
                                <button
                                  onClick={() => copyToClipboard(order.phone, 'phone', order.id)}
                                  className="p-1 bg-slate-900 hover:bg-slate-800 text-slate-500 hover:text-white rounded-lg transition-colors border border-slate-850"
                                  title="Скопіювати телефон"
                                >
                                  {copiedPhoneId === order.id ? (
                                    <Check className="h-3 w-3 text-emerald-400" />
                                  ) : (
                                    <Copy className="h-3 w-3" />
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">ТРАНСПОРТНИЙ ЗАСІБ</h4>
                          <div className="bg-slate-950/60 border border-slate-850 rounded-xl p-3.5 flex items-start gap-3 shadow-inner">
                            <div className="bg-amber-500/10 text-amber-500 p-2 rounded-lg border border-amber-500/15">
                              <Car className="h-5 w-5" />
                            </div>
                            <div className="flex-1">
                              <p className="font-black text-slate-200 text-xs leading-none mt-1">{order.vehicleType}</p>
                              {order.city ? (
                                <p className="text-[10px] text-slate-400 mt-2 flex items-center gap-1 font-bold">
                                  <span className="text-slate-500 font-medium">Область/Місто:</span> {order.city}
                                </p>
                              ) : (
                                <p className="text-[10px] text-slate-500 mt-2">Місто не визначено</p>
                              )}
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                            <span>ВОДІЙ ЕВАКУАТОРА</span>
                          </h4>
                          <div className="bg-slate-950/60 border border-slate-850 rounded-xl p-3.5 shadow-inner">
                            {order.driverId ? (
                              <div className="space-y-2.5">
                                <div className="flex justify-between items-center">
                                  <span className="text-xs text-slate-400 font-bold">Водій:</span>
                                  <span className="text-xs font-black text-white">{order.driverName}</span>
                                </div>
                                <div className="flex justify-between items-center pt-2 border-t border-slate-900/40">
                                  <span className="text-xs text-slate-400 font-bold">Телефон водія:</span>
                                  <a href={`tel:${order.driverPhone}`} className="text-xs font-black text-amber-400 hover:underline">
                                    {order.driverPhone}
                                  </a>
                                </div>
                                <div className="flex justify-between items-center pt-2 border-t border-slate-900/40">
                                  <span className="text-xs text-slate-400 font-bold">Держномер авто:</span>
                                  <span className="text-xs font-mono font-black text-white uppercase bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">
                                    {order.driverPlate}
                                  </span>
                                </div>
                                <div className="pt-2">
                                  <button
                                    onClick={() => setAssigningOrderId(assigningOrderId === order.id ? null : order.id)}
                                    className="w-full bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-white py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer text-center border border-slate-850"
                                  >
                                    🔄 Перепризначити водія
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="text-center py-2">
                                <p className="text-[11px] text-slate-500 italic font-medium">Водія не призначено</p>
                                <button
                                  onClick={() => setAssigningOrderId(assigningOrderId === order.id ? null : order.id)}
                                  className="mt-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer inline-flex items-center gap-1"
                                >
                                  <UserCheck className="h-3 w-3" />
                                  Призначити водія
                                </button>
                              </div>
                            )}

                            {assigningOrderId === order.id && (
                              <div className="mt-3.5 pt-3.5 border-t border-slate-900 animate-slideUp">
                                <p className="text-[9px] font-black text-amber-400 uppercase tracking-wider mb-2">Оберіть водія зі списку:</p>
                                {drivers.length === 0 ? (
                                  <p className="text-[10px] text-slate-500 italic">База водіїв порожня. Спочатку додайте водія у вкладці "Водії".</p>
                                ) : (
                                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                                    {drivers.map(drv => (
                                      <button
                                        key={drv.id}
                                        onClick={() => handleAssignDriver(order.id, drv.id)}
                                        className="w-full text-left bg-slate-950 hover:bg-slate-900 border border-slate-900 hover:border-slate-800 p-2 rounded-xl text-xs flex justify-between items-center transition-all cursor-pointer group"
                                      >
                                        <div>
                                          <p className="font-bold text-slate-300 group-hover:text-white leading-normal">{drv.name}</p>
                                          <p className="text-[9px] text-slate-500 font-mono mt-0.5">{drv.vehiclePlate} • {drv.city || 'Вся область'}</p>
                                        </div>
                                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                                          drv.status === 'active' 
                                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25'
                                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/25'
                                        }`}>
                                          {drv.status === 'active' ? 'вільний' : 'зайнятий'}
                                        </span>
                                      </button>
                                    ))}
                                    {order.driverId && (
                                      <button
                                        onClick={() => handleAssignDriver(order.id, null)}
                                        className="w-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/25 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider text-center transition-all cursor-pointer mt-1"
                                      >
                                        ✕ Зняти водія з виклику
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Route Details, Pricing & Surcharges */}
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between items-center mb-1.5">
                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">ЛОГІСТИКА</h4>
                            {/* Interactive Route Link */}
                            <a 
                              href={mapsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[10px] text-sky-400 hover:text-sky-300 font-black uppercase tracking-wider bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded transition-all"
                            >
                              <Navigation className="h-3 w-3" />
                              Маршрут у Google Maps
                              <ExternalLink className="h-2.5 w-2.5" />
                            </a>
                          </div>
                          
                          <div className="bg-slate-950/60 border border-slate-850 rounded-xl p-3.5 space-y-3.5 shadow-inner text-xs">
                            <div className="flex items-start gap-2.5">
                              <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                              <div className="flex-1">
                                <p className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest">ЗВІДКИ ЗАБРАТИ</p>
                                <p className="font-medium text-slate-300 mt-1 leading-snug">{order.fromLocation}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-start gap-2.5 pt-2.5 border-t border-slate-900">
                              <div className="w-2 h-2 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                              <div className="flex-1">
                                <p className="text-[9px] font-bold text-rose-400 uppercase tracking-widest">КУДИ ПРИВЕЗТИ</p>
                                <p className="font-medium text-slate-300 mt-1 leading-snug">{order.toLocation}</p>
                              </div>
                            </div>
                            
                            <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 pt-2 border-t border-slate-900">
                              <span>ДИСТАНЦІЯ ШЛЯХУ:</span>
                              <span className="text-white font-mono">~{order.distance} км</span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">ВАРТІСТЬ ТА СКЛАДНОСТІ</h4>
                          <div className="bg-slate-950/60 border border-slate-850 rounded-xl p-3.5 text-xs space-y-3 shadow-inner">
                            {/* Hardship flags pills */}
                            <div className="flex flex-wrap gap-1.5">
                              {order.hasLockedWheels && (
                                <span className="bg-amber-500/10 text-amber-400 text-[9px] font-bold px-2 py-0.5 rounded border border-amber-500/20">
                                  🔒 Блоковані колеса (+200)
                                </span>
                              )}
                              {order.hasSteeringIssue && (
                                <span className="bg-amber-500/10 text-amber-400 text-[9px] font-bold px-2 py-0.5 rounded border border-amber-500/20">
                                  🕹️ Пошкоджене кермо (+150)
                                </span>
                              )}
                              {order.needsDitchPull && (
                                <span className="bg-amber-500/10 text-amber-400 text-[9px] font-bold px-2 py-0.5 rounded border border-amber-500/20">
                                  🚜 Діставання з кювету
                                </span>
                              )}
                              {!order.hasLockedWheels && !order.hasSteeringIssue && !order.needsDitchPull && (
                                <span className="text-[10px] text-slate-500 font-bold italic">
                                  Стандартне завантаження (без додаткових ускладнень)
                                </span>
                              )}
                            </div>
                            
                            <div className="flex justify-between items-center pt-2.5 border-t border-slate-900">
                              <span className="font-bold text-slate-400">Розрахована ціна:</span>
                              <span className="text-base font-black text-amber-400">{order.estimatedPrice} грн</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Dispatch Actions Bar */}
                    <div className="px-5 py-4.5 bg-slate-950/80 border-t border-slate-900 flex flex-wrap items-center justify-between gap-4">
                      {/* Status controls */}
                      <div className="flex flex-wrap items-center gap-2">
                        {order.status === 'pending' && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleUpdateStatus(order.id, 'searching')}
                              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl transition-all uppercase tracking-wider cursor-pointer shadow-md shadow-amber-500/5 active:scale-95"
                            >
                              ⚡ Почати пошук
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(order.id, 'dispatched', 15)}
                              className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-sky-400 font-bold text-xs px-4 py-2.5 rounded-xl transition-all uppercase tracking-wider cursor-pointer active:scale-95"
                            >
                              🚀 Відправити зараз
                            </button>
                          </div>
                        )}

                        {order.status === 'searching' && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'dispatched', 15)}
                            className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl transition-all uppercase tracking-wider cursor-pointer shadow-md active:scale-95"
                          >
                            🚚 Евакуатор виїхав
                          </button>
                        )}

                        {order.status === 'dispatched' && (
                          <div className="flex items-center gap-2.5">
                            <button
                              onClick={() => handleUpdateStatus(order.id, 'completed')}
                              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl transition-all uppercase tracking-wider cursor-pointer active:scale-95 shadow-lg shadow-emerald-500/10"
                            >
                              ✓ Евакуатор на місці
                            </button>
                            
                            {editingEtaId === order.id ? (
                              <div className="flex items-center gap-1.5 bg-slate-900 p-1.5 rounded-xl border border-slate-800 animate-slideUp">
                                <input 
                                  type="number" 
                                  min="1" 
                                  max="120"
                                  value={customEta}
                                  onChange={(e) => setCustomEta(parseInt(e.target.value) || 15)}
                                  className="w-12 text-center bg-slate-950 border-0 text-white font-mono text-xs p-1 focus:ring-0 rounded-lg"
                                />
                                <span className="text-[10px] text-slate-400 font-black uppercase pr-1">хв</span>
                                <button
                                  onClick={() => handleUpdateStatus(order.id, 'dispatched', customEta)}
                                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[10px] px-2.5 py-1.5 rounded-lg transition-all"
                                >
                                  Зберегти
                                </button>
                                <button
                                  onClick={() => setEditingEtaId(null)}
                                  className="text-slate-400 hover:text-white px-1.5 text-xs font-black"
                                >
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  setEditingEtaId(order.id);
                                  setCustomEta(order.etaMinutes || 15);
                                }}
                                className="bg-slate-900 hover:bg-slate-800 border border-slate-850 text-slate-300 font-bold text-xs px-3 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                              >
                                <Clock className="h-3.5 w-3.5 text-amber-500" />
                                <span>Час приїзду ({order.etaMinutes || 15} хв)</span>
                              </button>
                            )}
                          </div>
                        )}

                        {order.status === 'completed' && (
                          <div className="flex items-center gap-2 text-emerald-400 font-black text-xs uppercase tracking-wider bg-emerald-500/5 px-3 py-2 rounded-xl border border-emerald-500/10">
                            <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" />
                            <span>Успішно завершено</span>
                          </div>
                        )}
                      </div>

                      {/* Right side delete button */}
                      <button
                        onClick={() => handleDeleteOrder(order.id)}
                        className="p-2.5 bg-slate-900/60 hover:bg-rose-950/40 hover:text-rose-400 border border-slate-850 hover:border-rose-900/40 text-slate-500 rounded-xl transition-all cursor-pointer shadow-sm active:scale-95"
                        title="Вилучити це замовлення з бази"
                      >
                        <Trash2 className="h-4.5 w-4.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )) : (
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-slate-900/40 p-4 border border-slate-850 rounded-2xl">
                <div>
                  <h4 className="text-white font-bold text-sm">Керування водіями</h4>
                  <p className="text-slate-400 text-xs mt-1 font-medium">Додавайте та змінюйте статус водіїв евакуатора.</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditingDriver(null);
                    setDriverFormName('');
                    setDriverFormPhone('');
                    setDriverFormPlate('');
                    setDriverFormCity('');
                    setDriverFormStatus('active');
                    setIsDriverFormOpen(true);
                  }}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl transition-all uppercase tracking-wider cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="h-4 w-4" />
                  <span>Додати водія</span>
                </button>
              </div>

              {drivers.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-slate-850 rounded-3xl bg-slate-950/10">
                  <User className="h-10 w-10 text-slate-500 mx-auto mb-2" />
                  <p className="text-slate-300 font-bold">База водіїв порожня</p>
                  <p className="text-xs text-slate-500 mt-1">Додайте першого водія, щоб призначати його на виклики.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {drivers.map((driver) => (
                    <div key={driver.id} className="bg-slate-900 border border-slate-850 p-5 rounded-2xl flex flex-col justify-between hover:border-slate-700 transition-all">
                      <div>
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="text-sm font-black text-white">{driver.name}</h4>
                            <p className="text-[10px] text-slate-400 mt-0.5 uppercase font-mono tracking-wider">{driver.vehiclePlate}</p>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                            driver.status === 'active' 
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                              : driver.status === 'busy'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}>
                            {driver.status === 'active' ? '● Вільний' : driver.status === 'busy' ? '● На виклику' : '● Офлайн'}
                          </span>
                        </div>

                        <div className="space-y-1.5 text-xs text-slate-300 bg-slate-950/40 p-3 rounded-xl border border-slate-900/60 mb-4">
                          <div className="flex justify-between">
                            <span className="text-slate-500 font-medium">Телефон:</span>
                            <a href={`tel:${driver.phone}`} className="font-bold text-amber-400 hover:underline">{driver.phone}</a>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500 font-medium">Область/Місто:</span>
                            <span className="font-bold text-slate-200">{driver.city || 'Вся Україна'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2.5 pt-2 border-t border-slate-950">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingDriver(driver);
                            setDriverFormName(driver.name);
                            setDriverFormPhone(driver.phone);
                            setDriverFormPlate(driver.vehiclePlate);
                            setDriverFormCity(driver.city || '');
                            setDriverFormStatus(driver.status);
                            setIsDriverFormOpen(true);
                          }}
                          className="flex-1 bg-slate-950 border border-slate-850 hover:border-slate-700 text-slate-400 hover:text-white py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                        >
                          Редагувати
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteDriver(driver.id)}
                          className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 p-2 rounded-xl transition-colors cursor-pointer"
                          title="Видалити водія"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Driver Form Modal */}
        {isDriverFormOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
            <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 relative shadow-2xl">
              <h3 className="font-display font-black text-lg text-white mb-4 uppercase tracking-wider">
                {editingDriver ? '📝 Редагувати водія' : '➕ Додати нового водія'}
              </h3>
              
              <form onSubmit={handleSaveDriver} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">ПІБ Водія *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="напр. Іван Ковальчук"
                    value={driverFormName}
                    onChange={(e) => setDriverFormName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 text-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-amber-500/60"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Номер телефону *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="+380671112233"
                    value={driverFormPhone}
                    onChange={(e) => setDriverFormPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 text-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-amber-500/60"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Номерний знак авто *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="напр. BC 1234 HP"
                    value={driverFormPlate}
                    onChange={(e) => setDriverFormPlate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 text-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-amber-500/60"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Область/Місто роботи</label>
                  <input 
                    type="text" 
                    placeholder="напр. Львів"
                    value={driverFormCity}
                    onChange={(e) => setDriverFormCity(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 text-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-amber-500/60"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Статус роботи</label>
                  <select 
                    value={driverFormStatus}
                    onChange={(e) => setDriverFormStatus(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-850 text-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-amber-500/60 appearance-none"
                  >
                    <option value="active">🟢 Активний / Вільний</option>
                    <option value="busy">🟡 Зайнятий (на виклику)</option>
                    <option value="offline">⚫ Офлайн</option>
                  </select>
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsDriverFormOpen(false)}
                    className="flex-1 bg-slate-950 border border-slate-850 text-slate-400 hover:text-white py-2.5 rounded-xl text-xs uppercase font-bold tracking-wider cursor-pointer"
                  >
                    Скасувати
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 py-2.5 rounded-xl text-xs uppercase font-black tracking-wider cursor-pointer shadow-lg"
                  >
                    Зберегти
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Dashboard Footer */}
        <div className="px-6 py-4.5 border-t border-slate-850 bg-slate-950/40 shrink-0 text-center text-[10px] text-slate-500 uppercase tracking-widest font-bold">
          Панель моніторингу замовлень евакуатора • UTC {new Date().toISOString().substring(11, 16)}
        </div>
        </div>
      </motion.div>
    </div>
  );
}
