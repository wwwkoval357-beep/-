/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import Services from './components/Services';
import PricingCalculator from './components/Calculator';
import Advantages from './components/Advantages';
import ActiveOrders from './components/ActiveOrders';
import FAQ from './components/FAQ';
import Footer from './components/Footer';
import AdminPanel from './components/AdminPanel';
import DriverPortal from './components/DriverPortal';
import { TowOrder, Driver } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertTriangle, X, Send, Phone, Clock, Truck, Copy } from 'lucide-react';

export default function App() {
  const [orders, setOrders] = useState<TowOrder[]>([]);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isDriverPortalOpen, setIsDriverPortalOpen] = useState(false);
  const [loggedDriver, setLoggedDriver] = useState<Driver | null>(() => {
    try {
      const stored = localStorage.getItem('logged_driver');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [showAdminButton, setShowAdminButton] = useState<boolean>(() => {
    try {
      return localStorage.getItem('show_admin_button') === 'true' || localStorage.getItem('is_admin_logged') === 'true';
    } catch {
      return false;
    }
  });
  // Store a trigger to update preselected vehicle type in calculator
  const [preselectedType, setPreselectedType] = useState<string>('passenger');
  // State for Telegram notification status
  const [telegramStatus, setTelegramStatus] = useState<{
    success: boolean;
    message: string;
    warning?: boolean;
  } | null>(null);
  
  // State for confirmation modal
  const [lastCreatedOrder, setLastCreatedOrder] = useState<TowOrder | null>(null);

  // State for phone call modal
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const [myOrderIds, setMyOrderIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('my_tow_orders');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const sendTelegramNotification = async (order: TowOrder) => {
    try {
      const response = await fetch('/api/notify-telegram', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(order),
      });

      const data = await response.json();
      if (response.ok) {
        if (data.order) {
          setOrders((prev) => prev.map((o) => (o.id === order.id ? data.order : o)));
        }
        if (data.warning) {
          setTelegramStatus({
            success: true,
            message: data.warning,
            warning: true,
          });
        } else {
          setTelegramStatus({
            success: true,
            message: 'Замовлення надіслано в Telegram робочу групу!',
          });
        }
      } else {
        setTelegramStatus({
          success: false,
          message: data.error || 'Не вдалося надіслати сповіщення до Telegram.',
        });
      }
    } catch (err: any) {
      setTelegramStatus({
        success: false,
        message: err.message || 'Помилка мережі при надсиланні в Telegram.',
      });
    }

    // Auto dismiss after 10 seconds
    setTimeout(() => {
      setTelegramStatus((prev) => null);
    }, 10000);
  };

  React.useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.has('admin') || params.get('panel') === '3985') {
        setShowAdminButton(true);
        localStorage.setItem('show_admin_button', 'true');
        setIsAdminOpen(true);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  React.useEffect(() => {
    let active = true;

    const performSync = async () => {
      try {
        // 1. Fetch current sync status from the server
        const statusRes = await fetch('/api/sync/status');
        if (!statusRes.ok || !active) return;
        const status = await statusRes.json();

        // 2. Sync Orders if the server is freshly started / wiped
        if (status.isFreshOrders) {
          const backupOrdersStr = localStorage.getItem('backup_all_orders');
          if (backupOrdersStr) {
            const backups = JSON.parse(backupOrdersStr);
            if (backups.length > 0) {
              console.log('[SYNC] Server database has no orders. Restoring from client backup...', backups.length);
              await fetch('/api/sync/all-orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orders: backups })
              });
            }
          }
        }

        // 3. Sync Drivers if the server is freshly started / wiped
        if (status.isFreshDrivers) {
          const backupDriversStr = localStorage.getItem('registered_drivers_backup');
          if (backupDriversStr) {
            const backups = JSON.parse(backupDriversStr);
            if (backups.length > 0) {
              console.log('[SYNC] Server database has no drivers. Restoring from client backup...', backups.length);
              await fetch('/api/sync/all-drivers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ drivers: backups })
              });
            }
          }
        }

        // 4. Fetch actual Orders and update UI & Local Backup
        const ordersRes = await fetch('/api/orders');
        if (ordersRes.ok && active) {
          const serverOrders = await ordersRes.json();
          if (Array.isArray(serverOrders)) {
            setOrders(serverOrders);
            if (serverOrders.length > 0) {
              localStorage.setItem('backup_all_orders', JSON.stringify(serverOrders));
            }
          }
        }

        // 5. Fetch actual Drivers and update local backup of drivers (with credentials)
        const driversRes = await fetch('/api/admin/drivers');
        if (driversRes.ok && active) {
          const serverDrivers = await driversRes.json();
          if (Array.isArray(serverDrivers) && serverDrivers.length > 0) {
            try {
              const backupDriversStr = localStorage.getItem('registered_drivers_backup');
              let backups = backupDriversStr ? JSON.parse(backupDriversStr) : [];
              
              serverDrivers.forEach((sd: any) => {
                const idx = backups.findIndex((b: any) => b.id === sd.id);
                if (idx !== -1) {
                  backups[idx] = {
                    ...backups[idx],
                    ...sd,
                    password: sd.password || backups[idx].password || '123'
                  };
                } else {
                  backups.push({
                    ...sd,
                    password: sd.password || '123'
                  });
                }
              });
              localStorage.setItem('registered_drivers_backup', JSON.stringify(backups));
            } catch (mergeErr) {
              localStorage.setItem('registered_drivers_backup', JSON.stringify(serverDrivers));
            }
          }
        }
      } catch (err) {
        console.error('[SYNC] Synchronization failed:', err);
      }
    };

    // Run synchronization every 3.5 seconds
    const interval = setInterval(performSync, 3500);
    performSync();

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const triggerRefreshOrders = async () => {
    try {
      const response = await fetch('/api/orders');
      if (response.ok) {
        const serverOrders = await response.json();
        if (Array.isArray(serverOrders)) {
          setOrders(serverOrders);
        }
      }
    } catch (err) {
      console.error('Error refreshing orders:', err);
    }
  };

  const handleOrderCreated = (newOrder: TowOrder) => {
    try {
      const myIds = JSON.parse(localStorage.getItem('my_tow_orders') || '[]');
      if (!myIds.includes(newOrder.id)) {
        const updated = [...myIds, newOrder.id];
        localStorage.setItem('my_tow_orders', JSON.stringify(updated));
        setMyOrderIds(updated);
      }
    } catch (e) {
      console.error(e);
    }
    setOrders((prev) => [newOrder, ...prev]);
    sendTelegramNotification(newOrder);
    setLastCreatedOrder(newOrder);
  };

  const handleCancelOrder = React.useCallback(async (id: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== id));
    try {
      const myIds = JSON.parse(localStorage.getItem('my_tow_orders') || '[]');
      const updated = myIds.filter((myId: string) => myId !== id);
      localStorage.setItem('my_tow_orders', JSON.stringify(updated));
      setMyOrderIds(updated);
    } catch (e) {
      console.error(e);
    }
    try {
      await fetch('/api/cancel-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });
    } catch (err) {
      console.error('Error canceling order on server:', err);
    }
  }, []);

  const handleUpdateOrderStatus = React.useCallback((id: string, status: TowOrder['status'], etaMinutes?: number) => {
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id === id) {
          return {
            ...order,
            status,
            etaMinutes: etaMinutes !== undefined ? etaMinutes : order.etaMinutes,
          };
        }
        return order;
      })
    );
  }, []);

  const handleScrollTo = (elementId: string) => {
    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSelectService = (vehicleType: string) => {
    // Set the preselection state
    setPreselectedType(vehicleType);
    
    // Find calculator and scroll to it
    handleScrollTo('calculator');

    // Trigger synthetic click or update calculator if mounted
    const targetButton = document.getElementById(`calc-type-${vehicleType}`);
    if (targetButton) {
      targetButton.click();
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans antialiased selection:bg-amber-500 selection:text-slate-950">
      {/* Toast Notification for Telegram Status */}
      <AnimatePresence>
        {telegramStatus && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 right-6 z-50 max-w-sm w-full bg-slate-800/95 backdrop-blur-xl border border-slate-700 rounded-2xl shadow-2xl p-4 overflow-hidden"
          >
            <div className="flex items-start gap-3">
              {telegramStatus.warning ? (
                <div className="bg-amber-500/10 p-2 rounded-xl text-amber-500 shrink-0">
                  <AlertTriangle className="h-5 w-5" />
                </div>
              ) : telegramStatus.success ? (
                <div className="bg-emerald-500/10 p-2 rounded-xl text-emerald-400 shrink-0">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
              ) : (
                <div className="bg-rose-500/10 p-2 rounded-xl text-rose-400 shrink-0">
                  <AlertTriangle className="h-5 w-5" />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <p className="font-display font-bold text-[10px] uppercase tracking-wider text-slate-400">
                  {telegramStatus.warning ? "Режим розробки" : telegramStatus.success ? "Успішно" : "Помилка"}
                </p>
                <p className="text-slate-200 text-xs mt-1 leading-relaxed font-medium">
                  {telegramStatus.message}
                </p>
                {telegramStatus.warning && (
                  <div className="mt-2.5 bg-slate-900/60 rounded-lg p-2 text-[10px] text-slate-400 leading-normal border border-slate-800">
                    💡 <span className="font-bold text-slate-300">Налаштування:</span> Додайте змінні середовища <code className="text-amber-500 font-mono">TELEGRAM_BOT_TOKEN</code> та <code className="text-amber-500 font-mono">TELEGRAM_CHAT_ID</code> у налаштуваннях проєкту, щоб отримувати реальні сповіщення.
                  </div>
                )}
              </div>

              <button
                onClick={() => setTelegramStatus(null)}
                className="text-slate-500 hover:text-slate-300 transition-colors p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Booking Success Confirmation Modal */}
      <AnimatePresence>
        {lastCreatedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setLastCreatedOrder(null)}
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-md cursor-pointer"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="relative w-full max-w-md bg-slate-800 border border-slate-700/80 rounded-3xl p-6 sm:p-8 text-center shadow-2xl overflow-hidden"
              id="success-confirmation-modal"
            >
              {/* Outer Amber glow inside modal */}
              <div className="absolute -top-12 -left-12 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

              {/* Status Icon */}
              <div className="mx-auto w-20 h-20 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center justify-center mb-6 relative">
                <span className="absolute inset-0 rounded-full bg-amber-500/5 animate-ping" />
                <div className="w-14 h-14 bg-amber-500/20 rounded-full flex items-center justify-center">
                  <Phone className="h-6 w-6 text-amber-500 animate-bounce" />
                </div>
              </div>

              {/* Title & Key message requested by user */}
              <h3 className="font-display font-black text-2xl text-white mb-2 leading-tight">
                Замовлення успішно створено!
              </h3>
              
              <div className="bg-slate-900/60 border border-slate-800/50 rounded-2xl p-4 my-5">
                <p className="text-amber-400 font-bold text-base sm:text-lg leading-relaxed animate-pulse">
                  🔔 Очікуйте, з вами зв'яжеться водій!
                </p>
                <p className="text-slate-400 text-xs mt-1">
                  Найближчий вільний евакуатор у місті <span className="font-bold text-white">{lastCreatedOrder.city}</span> вже отримав ваш запит та готується до виїзду.
                </p>
              </div>

              {/* Summary details */}
              <div className="text-left space-y-2 text-xs text-slate-400 border-b border-slate-800/60 pb-5 mb-5">
                <div className="flex justify-between">
                  <span>Клієнт:</span>
                  <span className="font-bold text-slate-200">{lastCreatedOrder.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Телефон:</span>
                  <span className="font-bold text-slate-200">{lastCreatedOrder.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span>Звідки:</span>
                  <span className="font-bold text-slate-200 truncate max-w-[240px]">{lastCreatedOrder.fromLocation}</span>
                </div>
                <div className="flex justify-between">
                  <span>Куди:</span>
                  <span className="font-bold text-slate-200 truncate max-w-[240px]">{lastCreatedOrder.toLocation}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-800/40">
                  <span className="text-amber-500/90 font-bold">Орієнтовна вартість:</span>
                  <span className="font-extrabold text-amber-400 text-sm">~{lastCreatedOrder.estimatedPrice} грн</span>
                </div>
              </div>

              {/* Quick Action buttons */}
              <div className="space-y-3">
                <button
                  onClick={() => setLastCreatedOrder(null)}
                  className="w-full bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-black py-3 px-6 rounded-xl transition-all shadow-lg shadow-amber-500/10 text-sm tracking-wide cursor-pointer"
                >
                  Зрозуміло
                </button>
                
                <p className="text-[10px] text-slate-500">
                  Виникли питання? Телефонуйте цілодобово: <a href="tel:+380990823225" onClick={(e) => { e.preventDefault(); setIsPhoneModalOpen(true); }} className="text-amber-500 hover:underline font-bold">+38 (099) 082-32-25</a>
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Phone Call Modal */}
      <AnimatePresence>
        {isPhoneModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPhoneModalOpen(false)}
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-md cursor-pointer"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="relative w-full max-w-sm bg-slate-800 border border-slate-700/80 rounded-3xl p-6 text-center shadow-2xl overflow-hidden"
              id="phone-call-modal"
            >
              {/* Decorative top blur */}
              <div className="absolute -top-12 -left-12 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

              {/* Close Button */}
              <button
                onClick={() => setIsPhoneModalOpen(false)}
                className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 transition-colors p-1.5 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Icon Container */}
              <div className="mx-auto w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mb-5 relative">
                <span className="absolute inset-0 rounded-full bg-emerald-500/5 animate-ping" />
                <div className="w-11 h-11 bg-emerald-500/20 rounded-full flex items-center justify-center">
                  <Phone className="h-5 w-5 text-emerald-400 animate-pulse" />
                </div>
              </div>

              {/* Title & Info */}
              <h3 className="font-display font-black text-xl text-white mb-6">
                Виклик оператора
              </h3>

              {/* Phone number display */}
              <div className="bg-slate-900 border border-slate-700/60 rounded-2xl py-3.5 px-4 mb-5 flex items-center justify-between">
                <span className="font-display font-bold text-lg text-amber-500 tracking-wide select-all">
                  +38 (099) 082-32-25
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText('+380990823225');
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="text-slate-400 hover:text-amber-500 transition-colors p-1.5 hover:bg-slate-900 rounded-lg flex items-center justify-center cursor-pointer"
                  title="Скопіювати номер"
                >
                  {copied ? (
                    <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                      Копій.✓
                    </span>
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>

              {/* Quick Actions */}
              <div className="space-y-2.5">
                <a
                  href="tel:+380990823225"
                  className="w-full bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-lg shadow-emerald-900/20 text-xs uppercase tracking-wider flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <Phone className="h-4 w-4" />
                  <span>Зателефонувати</span>
                </a>
                <button
                  onClick={() => setIsPhoneModalOpen(false)}
                  className="w-full border border-slate-800 hover:border-slate-700 hover:bg-slate-900 text-slate-400 hover:text-slate-200 font-semibold py-3 px-6 rounded-xl transition-all text-xs cursor-pointer"
                >
                  Скасувати
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isAdminOpen && (
          <AdminPanel
            onClose={() => setIsAdminOpen(false)}
            allOrders={orders}
            onRefreshOrders={triggerRefreshOrders}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isDriverPortalOpen && (
          <DriverPortal
            onClose={() => setIsDriverPortalOpen(false)}
            onRefreshAllOrders={triggerRefreshOrders}
            driver={loggedDriver}
            setDriver={setLoggedDriver}
          />
        )}
      </AnimatePresence>



      {/* Header */}
      <Header 
        onScrollTo={handleScrollTo} 
        onCallClick={() => setIsPhoneModalOpen(true)} 
        onAdminClick={showAdminButton ? () => setIsAdminOpen(true) : undefined} 
        onDriverClick={() => setIsDriverPortalOpen(true)}
        loggedDriver={loggedDriver}
      />

      {/* Main content flow */}
      <main>
        {/* Hero Section */}
        <Hero onOrderCreated={handleOrderCreated} onScrollTo={handleScrollTo} />

        {/* Live Orders Tracker (Only visible if orders exist) */}
        <ActiveOrders
          orders={orders.filter(order => myOrderIds.includes(order.id))}
          onCancelOrder={handleCancelOrder}
          onUpdateOrderStatus={handleUpdateOrderStatus}
        />

        {/* Services Section */}
        <Services onSelectService={handleSelectService} />

        {/* Pricing Calculator Section */}
        <PricingCalculator onOrderCreated={handleOrderCreated} />

        {/* Advantages Section */}
        <Advantages />

        {/* FAQ Section */}
        <FAQ />
      </main>

      {/* Footer */}
      <Footer 
        onScrollTo={handleScrollTo} 
        onCallClick={() => setIsPhoneModalOpen(true)} 
        onAdminClick={showAdminButton ? () => setIsAdminOpen(true) : undefined} 
        onDriverClick={() => setIsDriverPortalOpen(true)}
      />
    </div>
  );
}

