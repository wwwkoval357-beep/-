import React, { useEffect, useState } from 'react';
import { Truck, Navigation, Clock, User, Phone, CheckCircle, AlertCircle, X, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TowOrder } from '../types';

interface ActiveOrdersProps {
  orders: TowOrder[];
  onCancelOrder: (id: string) => void;
  onUpdateOrderStatus: (id: string, status: TowOrder['status'], etaMinutes?: number) => void;
}

export default function ActiveOrders({ orders, onCancelOrder, onUpdateOrderStatus }: ActiveOrdersProps) {
  if (orders.length === 0) return null;

  return (
    <section id="active-orders" className="py-16 bg-slate-900 text-white border-b border-slate-800 scroll-mt-20 relative overflow-hidden">
      {/* Decorative pulse glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none animate-pulse"></div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10">
          <div className="inline-flex items-center space-x-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full mb-3 shadow-md">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Панель живого відстеження</span>
          </div>
          <h3 className="font-display font-black text-2xl sm:text-3xl">
            Ваш активний виклик евакуатора
          </h3>
          <p className="text-xs text-slate-400 mt-2">
            Тут ви можете спостерігати за статусом обробки вашої заявки в реальному часі.
          </p>
        </div>

        <div className="space-y-6">
          <AnimatePresence>
            {orders.map((order) => (
              <ActiveOrderCard
                key={order.id}
                order={order}
                onCancelOrder={onCancelOrder}
                onUpdateOrderStatus={onUpdateOrderStatus}
              />
            ))}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

interface ActiveOrderCardProps {
  order: TowOrder;
  onCancelOrder: (id: string) => void;
  onUpdateOrderStatus: (id: string, status: TowOrder['status'], etaMinutes?: number) => void;
  key?: string;
}

function ActiveOrderCard({ order, onCancelOrder, onUpdateOrderStatus }: ActiveOrderCardProps) {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  // Sync / set timer when order status is completed
  useEffect(() => {
    if (order.status === 'completed') {
      setTimeLeft(120); // 2 minutes in seconds

      const interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(interval);
            onCancelOrder(order.id);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    } else {
      setTimeLeft(null);
    }
  }, [order.status, order.id, onCancelOrder]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="bg-slate-800 border-2 border-slate-700 rounded-3xl overflow-hidden shadow-2xl relative animate-fade-in"
    >
      {/* Order Top Banner */}
      <div className="bg-slate-700/50 px-6 py-4 flex flex-wrap justify-between items-center gap-4 border-b border-slate-700/80">
        <div className="flex items-center space-x-2">
          <div className="bg-amber-500 text-slate-900 p-1.5 rounded-lg font-mono font-black text-xs">
            {order.orderNumber || `#${order.id.toUpperCase()}`}
          </div>
          <span className="text-xs text-slate-400 font-medium">Створено о {order.createdAt}</span>
        </div>

        <div className="flex items-center space-x-3">
          <div className="text-right">
            <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">Розрахункова вартість</span>
            <span className="text-amber-500 font-display font-extrabold text-base">~ {order.estimatedPrice} грн</span>
          </div>

          <button
            onClick={() => onCancelOrder(order.id)}
            className="text-slate-500 hover:text-red-400 hover:bg-red-500/10 p-1.5 rounded-xl transition-all cursor-pointer"
            title={order.status === 'completed' ? "Прибрати сповіщення" : "Скасувати виклик"}
            id={`cancel-order-${order.id}`}
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>

      {/* Details & Status Timeline split */}
      <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* Left part: Order specifications */}
        <div className="md:col-span-5 space-y-4 text-sm border-b md:border-b-0 md:border-r border-slate-700 pb-6 md:pb-0 md:pr-6">
          <p className="font-bold text-slate-300 uppercase tracking-wider text-xs flex items-center">
            <ShieldCheck className="h-4 w-4 mr-1.5 text-emerald-400" /> Деталі замовлення
          </p>
          
          <div className="space-y-3">
            {order.city && (
              <div>
                <span className="text-xs text-slate-500 block">Місто</span>
                <span className="font-semibold text-amber-500">{order.city}</span>
              </div>
            )}
            <div>
              <span className="text-xs text-slate-500 block">Транспортний засіб</span>
              <span className="font-semibold text-slate-200 capitalize">{order.vehicleType}</span>
            </div>
            <div>
              <span className="text-xs text-slate-500 block">Маршрут транспортування</span>
              <span className="font-semibold text-slate-200 block text-xs truncate" title={order.fromLocation}>
                Звідки: {order.fromLocation}
              </span>
              <span className="font-semibold text-slate-200 block text-xs truncate mt-1" title={order.toLocation}>
                Куди: {order.toLocation}
              </span>
            </div>
          </div>

          {order.driverId && (
            <div className="pt-4 border-t border-slate-700/60 mt-4 animate-slideUp">
              <p className="font-bold text-slate-300 uppercase tracking-wider text-xs flex items-center mb-3">
                <Truck className="h-4 w-4 mr-1.5 text-amber-500" /> Призначений водій
              </p>
              <div className="bg-slate-900/40 border border-slate-750 rounded-2xl p-3.5 space-y-2.5 shadow-inner">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400">Водій:</span>
                  <span className="text-xs font-black text-white">{order.driverName}</span>
                </div>
                {order.driverPhone && (
                  <div className="flex justify-between items-center pt-2 border-t border-slate-800/40">
                    <span className="text-xs text-slate-400">Телефон:</span>
                    <a href={`tel:${order.driverPhone}`} className="text-xs font-black text-amber-400 hover:underline flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {order.driverPhone}
                    </a>
                  </div>
                )}
                {order.driverPlate && (
                  <div className="flex justify-between items-center pt-2 border-t border-slate-800/40">
                    <span className="text-xs text-slate-400">Номер авто:</span>
                    <span className="text-xs font-mono font-black text-white uppercase bg-slate-950 border border-slate-800 px-2 py-0.5 rounded shadow-sm">
                      {order.driverPlate}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right part: Status Timeline */}
        <div className="md:col-span-7 flex flex-col justify-between space-y-6">
          <div className="relative">
            {/* Timeline connector lines */}
            <div className="absolute left-[11px] top-4 bottom-4 w-0.5 bg-slate-700"></div>

            {/* Step 1: Request received */}
            <div className="relative flex items-start space-x-3.5 mb-6">
              <div className={`z-10 p-1 rounded-full shadow-lg transition-all ${
                order.status === 'pending'
                  ? 'bg-amber-500 text-slate-950 animate-pulse shadow-amber-500/30'
                  : 'bg-emerald-500 text-slate-950 shadow-emerald-500/20'
              }`}>
                <CheckCircle className="h-4.5 w-4.5 stroke-[2.5]" />
              </div>
              <div>
                <p className={`font-bold text-xs uppercase tracking-wider ${
                  order.status === 'pending' ? 'text-amber-400' : 'text-white'
                }`}>
                  Заявку прийнято оператором
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {order.status === 'pending'
                    ? 'Ми прийняли замовлення. Очікуємо підтвердження оператором з Telegram...'
                    : 'Заявку успішно прийнято та підтверджено.'}
                </p>
              </div>
            </div>

            {/* Step 2: Dispatched */}
            <div className="relative flex items-start space-x-3.5 mb-6">
              <div className={`z-10 p-1.5 rounded-full shadow-lg transition-all ${
                order.status === 'pending'
                  ? 'bg-slate-700 text-slate-500 border border-slate-600'
                  : order.status === 'dispatched'
                  ? 'bg-amber-500 text-slate-900 animate-pulse shadow-amber-500/30'
                  : 'bg-emerald-500 text-slate-900 shadow-emerald-500/20'
              }`}>
                <Truck className="h-3.5 w-3.5" />
              </div>
              <div>
                <p className={`font-bold text-xs uppercase tracking-wider ${
                  order.status === 'dispatched' ? 'text-amber-400' : order.status === 'pending' ? 'text-slate-500' : 'text-white'
                }`}>
                  {order.status === 'pending' ? 'Евакуатор готується до виїзду' : 'Евакуатор виїхав на допомогу!'}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {order.status === 'pending'
                    ? 'Очікуємо підтвердження та відправлення спецтехніки...'
                    : order.status === 'dispatched'
                    ? order.driverName
                      ? `Евакуатор під керуванням водія ${order.driverName} вже виїхав за вказаною адресою! Очікуйте на прибуття.`
                      : 'Спецтехніка вже виїхала за вказаною адресою! Очікуйте на прибуття найближчим часом.'
                    : 'Евакуатор прибув до місця призначення.'}
                </p>
              </div>
            </div>

            {/* Step 3: Arrival */}
            <div className="relative flex items-start space-x-3.5">
              <div className={`z-10 p-1.5 rounded-full shadow-lg transition-all ${
                order.status === 'completed'
                  ? 'bg-emerald-500 text-slate-900 shadow-emerald-500/20'
                  : 'bg-slate-700 text-slate-500 border border-slate-600'
              }`}>
                <Navigation className="h-3.5 w-3.5 transform rotate-45" />
              </div>
              <div>
                <p className={`font-bold text-xs uppercase tracking-wider ${
                  order.status === 'completed' ? 'text-emerald-400' : 'text-slate-500'
                }`}>
                  {order.status === 'completed' ? 'Евакуатор прибув на місце!' : 'Прибуття на місце події'}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {order.status === 'completed'
                    ? 'Фахівець на місці і розпочав завантаження вашого автомобіля.'
                    : 'Очікуємо прибуття евакуатора за вказаною адресою.'}
                </p>
              </div>
            </div>
          </div>

          {/* Pending Simulation Link */}
          {order.status === 'pending' && (
            <div className="bg-amber-500/5 border border-amber-500/10 p-4 rounded-2xl flex flex-col space-y-3">
              <div className="flex items-center space-x-3">
                <Clock className="h-5 w-5 text-amber-500 animate-spin shrink-0" />
                <span className="text-xs text-amber-400/95 leading-normal">
                  Заявку прийнято! Очікуємо підтвердження оператором для відправлення найближчого евакуатора.
                </span>
              </div>
            </div>
          )}

          {/* Dispatched Simulation Link */}
          {order.status === 'dispatched' && (
            <div className="bg-amber-500/5 border border-amber-500/10 p-4 rounded-2xl flex flex-col space-y-3 animate-pulse-subtle">
              <div className="flex items-center space-x-3">
                <Clock className="h-5 w-5 text-amber-500 animate-pulse shrink-0" />
                <span className="text-xs text-amber-400/95 leading-normal">
                  {order.driverName 
                    ? `Евакуатор (водій ${order.driverName}) виїхав і знаходиться в дорозі.` 
                    : 'Евакуатор виїхав і знаходиться в дорозі.'}
                  {order.driverPhone ? ` Ви можете зв'язатися з водієм за номером ${order.driverPhone}.` : " Водій зв'яжеться з вами найближчим часом."}
                </span>
              </div>
            </div>
          )}

          {/* Completed Auto-Dismiss Countdown Card */}
          {order.status === 'completed' && timeLeft !== null && (
            <div className="bg-emerald-500/5 border border-emerald-500/10 p-4 rounded-2xl flex flex-col space-y-2 animate-pulse-subtle">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />
                <span className="text-xs text-emerald-400 font-semibold uppercase tracking-wider">
                  Евакуатор прибув на місце!
                </span>
              </div>
              <p className="text-xs text-slate-400 pl-8 leading-relaxed">
                Спецтехніка вже за вказаною адресою. Починається процес завантаження вашого автомобіля. Будь ласка, залишайтеся на зв'язку. Це вікно автоматично закриється через:{' '}
                <span className="font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md inline-block shadow-inner">
                  {formatTime(timeLeft)}
                </span>
              </p>
            </div>
          )}

        </div>

      </div>
    </motion.div>
  );
}
