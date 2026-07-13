import React, { useState, useEffect } from 'react';
import { Calculator, Check, AlertCircle, Info, ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { TowOrder } from '../types';

interface CalculatorProps {
  onOrderCreated: (order: TowOrder) => void;
}

const VEHICLE_TYPES = [
  { id: 'motorcycle', name: 'Мотоцикл / Квадроцикл', base: 750, perKm: 25, icon: '🏍️' },
  { id: 'passenger', name: 'Легкове авто (седан/хетчбек)', base: 1100, perKm: 30, icon: '🚗' },
  { id: 'suv', name: 'Кросовер / Позашляховик', base: 1300, perKm: 35, icon: '🚙' },
  { id: 'minibus', name: 'Комерційний транспорт / Бус', base: 1700, perKm: 40, icon: '🚐' },
  { id: 'machinery', name: 'Спецтехніка (до 4 тонн)', base: 2000, perKm: 50, icon: '🚜' },
];

export default function PricingCalculator({ onOrderCreated }: CalculatorProps) {
  const [selectedType, setSelectedType] = useState('passenger');
  const [distance, setDistance] = useState(25);
  const [lockedWheels, setLockedWheels] = useState(0);
  const [steeringIssue, setSteeringIssue] = useState(false);
  const [ditchPull, setDitchPull] = useState(false);
  const [isNightTime, setIsNightTime] = useState(false);

  // Instant booking form fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [fromAddress, setFromAddress] = useState('');
  const [toAddress, setToAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showOrderSuccess, setShowOrderSuccess] = useState(false);

  // Price calculations
  const [prices, setPrices] = useState({
    base: 1100,
    distanceCost: 750,
    extras: 0,
    total: 1850,
  });

  const currentVehicle = VEHICLE_TYPES.find(v => v.id === selectedType) || VEHICLE_TYPES[1];

  useEffect(() => {
    const base = currentVehicle.base;
    const distanceCost = distance * currentVehicle.perKm;
    
    let extras = 0;
    extras += lockedWheels * 600;
    if (steeringIssue) extras += 600;
    if (ditchPull) extras += 1000;
    if (isNightTime) extras += 200;

    setPrices({
      base,
      distanceCost,
      extras,
      total: base + distanceCost + extras,
    });
  }, [selectedType, distance, lockedWheels, steeringIssue, ditchPull, isNightTime]);

  const handleOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) return;

    setIsSubmitting(true);

    setTimeout(() => {
      const newOrder: TowOrder = {
        id: Math.random().toString(36).substring(2, 9),
        name: name || 'Гість',
        phone,
        city: city || 'Київ',
        fromLocation: fromAddress || 'Вказано в калькуляторі',
        toLocation: toAddress || 'Вказано в калькуляторі',
        vehicleType: currentVehicle.name,
        hasLockedWheels: lockedWheels > 0,
        hasSteeringIssue: steeringIssue,
        needsDitchPull: ditchPull,
        distance,
        estimatedPrice: prices.total,
        status: 'pending',
        createdAt: new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' }),
        etaMinutes: 20 + Math.floor(Math.random() * 8),
      };

      onOrderCreated(newOrder);
      setIsSubmitting(false);
      setShowOrderSuccess(true);
      
      // Reset form
      setName('');
      setPhone('');
      setCity('');
      setFromAddress('');
      setToAddress('');

      setTimeout(() => {
        setShowOrderSuccess(false);
        const element = document.getElementById('active-orders');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 2000);
    }, 1500);
  };

  return (
    <section id="calculator" className="py-24 bg-slate-900 border-y border-slate-800 text-white scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center space-x-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
            <Calculator className="h-4 w-4" />
            <span>Інтерактивний розрахунок вартості</span>
          </div>
          <h2 className="font-display font-black text-3xl sm:text-4xl lg:text-5xl tracking-tight">
            Калькулятор <span className="text-amber-500">ціни онлайн</span>
          </h2>
          <p className="text-slate-400 mt-4 text-base sm:text-lg">
            Розрахуйте точну вартість евакуації за 10 секунд. Ми гарантуємо відповідність фінальної суми нашому калькулятору — жодних прихованих доплат!
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Calculator Inputs (8 cols on lg) */}
          <div className="lg:col-span-7 bg-slate-950 border border-slate-800/80 p-6 sm:p-8 rounded-3xl space-y-8 shadow-xl">
            
            {/* Step 1: Vehicle Type */}
            <div>
              <span className="inline-flex items-center justify-center bg-slate-900 text-slate-400 font-bold h-6 w-6 rounded-full text-xs mr-2 border border-slate-800">1</span>
              <label className="text-sm font-bold uppercase tracking-wider text-slate-300">Оберіть тип транспортного засобу</label>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                {VEHICLE_TYPES.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setSelectedType(type.id)}
                    className={`flex items-center justify-between p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                      selectedType === type.id
                        ? 'bg-amber-500/10 border-amber-500 text-white shadow-lg'
                        : 'bg-slate-900 border-slate-800/60 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                    }`}
                    id={`calc-type-${type.id}`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{type.icon}</span>
                      <div>
                        <p className="font-bold text-sm leading-snug">{type.name}</p>
                        <p className="text-xs text-slate-500 mt-0.5">Подача: {type.base}₴ • +{type.perKm}₴/км</p>
                      </div>
                    </div>
                    {selectedType === type.id && (
                      <span className="bg-amber-500 text-slate-950 p-1 rounded-full">
                        <Check className="h-3.5 w-3.5 stroke-[3]" />
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Distance Slider */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center">
                  <span className="inline-flex items-center justify-center bg-slate-900 text-slate-400 font-bold h-6 w-6 rounded-full text-xs mr-2 border border-slate-800">2</span>
                  <label className="text-sm font-bold uppercase tracking-wider text-slate-300">Відстань транспортування</label>
                </div>
                <span className="font-display font-black text-2xl text-amber-500 bg-amber-500/5 px-3.5 py-1 rounded-xl border border-amber-500/20 shadow-inner">
                  {distance} <span className="text-sm font-semibold">км</span>
                </span>
              </div>
              
              <div className="mt-4 space-y-2">
                <input
                  type="range"
                  min="1"
                  max="150"
                  value={distance}
                  onChange={(e) => setDistance(Number(e.target.value))}
                  className="w-full h-2 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  id="distance-slider"
                />
                <div className="flex justify-between text-[11px] text-slate-500 font-semibold px-1">
                  <span>1 км (в межах міста)</span>
                  <span>50 км</span>
                  <span>100 км</span>
                  <span>150 км</span>
                </div>
              </div>
            </div>

            {/* Step 3: Additional Issues */}
            <div>
              <span className="inline-flex items-center justify-center bg-slate-900 text-slate-400 font-bold h-6 w-6 rounded-full text-xs mr-2 border border-slate-800">3</span>
              <label className="text-sm font-bold uppercase tracking-wider text-slate-300">Додаткові фактори складності</label>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                
                {/* Locked wheels */}
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between space-y-3">
                  <div>
                    <p className="font-bold text-sm text-slate-300">Заблоковані колеса</p>
                    <p className="text-xs text-slate-500 mt-0.5">Вимагає використання підкатних візків</p>
                  </div>
                  <div className="flex items-center space-x-1 mt-2">
                    {[0, 1, 2, 3, 4].map((count) => (
                      <button
                        key={count}
                        onClick={() => setLockedWheels(count)}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                          lockedWheels === count
                            ? 'bg-amber-500 border-amber-500 text-slate-950'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                        id={`locked-wheels-${count}`}
                      >
                        {count === 0 ? 'Ні' : `${count}`}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-amber-500 font-semibold">+600₴ за кожне колесо</p>
                </div>

                {/* Steering issue */}
                <button
                  onClick={() => setSteeringIssue(!steeringIssue)}
                  className={`p-4 rounded-2xl border text-left flex flex-col justify-between h-full transition-all cursor-pointer ${
                    steeringIssue
                      ? 'bg-amber-500/10 border-amber-500 text-white'
                      : 'bg-slate-900 border-slate-800/60 text-slate-400 hover:border-slate-700'
                  }`}
                  id="steering-issue-checkbox"
                >
                  <div className="flex justify-between items-start w-full">
                    <div>
                      <p className="font-bold text-sm text-slate-300">Пошкоджене кермо</p>
                      <p className="text-xs text-slate-500 mt-0.5 leading-snug">Заблоковане рульове керування</p>
                    </div>
                    <div className={`h-5 w-5 rounded-md border flex items-center justify-center transition-all ${
                      steeringIssue ? 'bg-amber-500 border-amber-500 text-slate-950' : 'border-slate-700'
                    }`}>
                      {steeringIssue && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                    </div>
                  </div>
                  <p className="text-[10px] text-amber-500 font-semibold mt-4">+600₴ до вартості</p>
                </button>

                {/* Ditch Pull */}
                <button
                  onClick={() => setDitchPull(!ditchPull)}
                  className={`p-4 rounded-2xl border text-left flex flex-col justify-between h-full transition-all cursor-pointer ${
                    ditchPull
                      ? 'bg-amber-500/10 border-amber-500 text-white'
                      : 'bg-slate-900 border-slate-800/60 text-slate-400 hover:border-slate-700'
                  }`}
                  id="ditch-pull-checkbox"
                >
                  <div className="flex justify-between items-start w-full">
                    <div>
                      <p className="font-bold text-sm text-slate-300">Витягування з кювету</p>
                      <p className="text-xs text-slate-500 mt-0.5 leading-snug">Автомобіль за межами дороги</p>
                    </div>
                    <div className={`h-5 w-5 rounded-md border flex items-center justify-center transition-all ${
                      ditchPull ? 'bg-amber-500 border-amber-500 text-slate-950' : 'border-slate-700'
                    }`}>
                      {ditchPull && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                    </div>
                  </div>
                  <p className="text-[10px] text-amber-500 font-semibold mt-4">+1000₴ до вартості</p>
                </button>

                {/* Night Time */}
                <button
                  onClick={() => setIsNightTime(!isNightTime)}
                  className={`p-4 rounded-2xl border text-left flex flex-col justify-between h-full transition-all cursor-pointer ${
                    isNightTime
                      ? 'bg-amber-500/10 border-amber-500 text-white'
                      : 'bg-slate-900 border-slate-800/60 text-slate-400 hover:border-slate-700'
                  }`}
                  id="night-time-checkbox"
                >
                  <div className="flex justify-between items-start w-full">
                    <div>
                      <p className="font-bold text-sm text-slate-300">Нічний час (22:00 - 06:00)</p>
                      <p className="text-xs text-slate-500 mt-0.5 leading-snug">Підвищений тариф у темну пору</p>
                    </div>
                    <div className={`h-5 w-5 rounded-md border flex items-center justify-center transition-all ${
                      isNightTime ? 'bg-amber-500 border-amber-500 text-slate-950' : 'border-slate-700'
                    }`}>
                      {isNightTime && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                    </div>
                  </div>
                  <p className="text-[10px] text-amber-500 font-semibold mt-4">+200₴ до вартості</p>
                </button>

              </div>
            </div>

          </div>

          {/* Right Column: One-Click Order & Receipt Breakdown (5 cols on lg) */}
          <div className="lg:col-span-5 space-y-6">

            {/* Instant Booking Form */}
            <div className="bg-slate-950 border border-slate-800/80 p-6 sm:p-8 rounded-3xl shadow-xl">
              <p className="text-xs text-slate-400 mb-5">
                Введіть контакти, і ми миттєво почнемо пошук найближчого евакуатора.
              </p>

              {showOrderSuccess ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-5 rounded-2xl text-center space-y-2"
                >
                  <p className="font-bold text-sm">✓ Заявка успішно створена!</p>
                  <p className="text-xs text-slate-300">Ми вже шукаємо вільний евакуатор для вас. Дивіться статус замовлення нижче.</p>
                </motion.div>
              ) : (
                <form onSubmit={handleOrderSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Ваш телефон *</label>
                      <input
                        type="tel"
                        required
                        placeholder="+38 (0XX) XXX-XX-XX"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-xl py-2.5 px-3.5 text-white text-sm outline-none transition-all placeholder:text-slate-600 font-medium"
                        id="calc-phone"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Ваше ім'я</label>
                      <input
                        type="text"
                        placeholder="Олександр"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-xl py-2.5 px-3.5 text-white text-sm outline-none transition-all placeholder:text-slate-600 font-medium"
                        id="calc-name"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Місто *</label>
                    <input
                      type="text"
                      required
                      placeholder="Наприклад: Львів або Київ"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-xl py-2.5 px-3.5 text-white text-sm outline-none transition-all placeholder:text-slate-600 font-medium"
                      id="calc-city"
                    />
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {['Київ', 'Львів', 'Одеса', 'Дніпро', 'Харків', 'Івано-Франківськ'].map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => setCity(item)}
                          className={`text-[9px] px-2 py-0.5 rounded border font-semibold transition-all cursor-pointer ${
                            city === item
                              ? 'bg-amber-500/15 border-amber-500 text-amber-400'
                              : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Адреса звідки (Старт) *</label>
                      <input
                        type="text"
                        required
                        placeholder="Адреса, де стоїть авто"
                        value={fromAddress}
                        onChange={(e) => setFromAddress(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-xl py-2.5 px-3.5 text-white text-sm outline-none transition-all placeholder:text-slate-600 font-medium"
                        id="calc-from-address"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Адреса куди (Фініш) *</label>
                      <input
                        type="text"
                        required
                        placeholder="Адреса доставки / СТО"
                        value={toAddress}
                        onChange={(e) => setToAddress(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-xl py-2.5 px-3.5 text-white text-sm outline-none transition-all placeholder:text-slate-600 font-medium"
                        id="calc-to-address"
                      />
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-display font-bold uppercase tracking-wider py-3 rounded-xl shadow-lg shadow-emerald-900/10 transition-all text-xs flex items-center justify-center space-x-2 cursor-pointer"
                    id="calc-submit-order"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center space-x-2">
                        <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        <span>Надсилаємо заявку...</span>
                      </span>
                    ) : (
                      <>
                        <span>Замовити евакуацію за {prices.total}₴</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </motion.button>
                </form>
              )}
            </div>

            {/* The Bill / Receipt Card */}
            <div className="bg-amber-500 text-slate-950 p-6 sm:p-8 rounded-3xl shadow-xl space-y-6 relative overflow-hidden">
              {/* Decorative background circle */}
              <div className="absolute -right-10 -bottom-10 h-40 w-40 bg-amber-600/30 rounded-full pointer-events-none"></div>
              
              <div className="flex items-center justify-between border-b border-slate-950/15 pb-4">
                <div className="flex items-center space-x-2">
                  <Calculator className="h-5 w-5 stroke-[2.5]" />
                  <span className="font-display font-black text-lg tracking-wider uppercase">Детальний чек</span>
                </div>
                <span className="text-xs font-bold bg-slate-950/10 px-2.5 py-1 rounded-md uppercase tracking-wide">Попередній розрахунок</span>
              </div>

              <div className="space-y-3.5 text-sm font-medium">
                <div className="flex justify-between">
                  <span className="opacity-80">Подача ({currentVehicle.name}):</span>
                  <span className="font-bold">{prices.base} грн</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-80">Пробіг ({distance} км):</span>
                  <span className="font-bold">{prices.distanceCost} грн</span>
                </div>
                {prices.extras > 0 && (
                  <div className="flex justify-between text-slate-900 border-t border-dashed border-slate-950/15 pt-3">
                    <span className="opacity-80">Додаткові послуги:</span>
                    <span className="font-bold">+{prices.extras} грн</span>
                  </div>
                )}
                
                {/* Items breakdown list */}
                {lockedWheels > 0 && (
                  <div className="text-xs opacity-70 pl-3 flex justify-between">
                    <span>• Заблоковані колеса ({lockedWheels} шт)</span>
                    <span>+{lockedWheels * 600}₴</span>
                  </div>
                )}
                {steeringIssue && (
                  <div className="text-xs opacity-70 pl-3 flex justify-between">
                    <span>• Пошкоджене кермо</span>
                    <span>+600₴</span>
                  </div>
                )}
                {ditchPull && (
                  <div className="text-xs opacity-70 pl-3 flex justify-between">
                    <span>• Кювет / витягування</span>
                    <span>+1000₴</span>
                  </div>
                )}
                {isNightTime && (
                  <div className="text-xs opacity-70 pl-3 flex justify-between">
                    <span>• Нічний тариф</span>
                    <span>+200₴</span>
                  </div>
                )}
              </div>

              {/* Total Price Section */}
              <div className="bg-slate-950 text-white rounded-2xl p-5 flex items-center justify-between border border-slate-800 shadow-lg relative z-10">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Разом до сплати</p>
                  <p className="text-[11px] text-emerald-400 font-semibold mt-0.5 flex items-center">
                    <Sparkles className="h-3 w-3 mr-1" /> Фіксована сума
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-display font-black text-3xl text-amber-500 leading-none">
                    ~ {prices.total} <span className="text-lg">грн</span>
                  </p>
                  <p className="text-[9px] text-slate-400 mt-1">Остаточна ціна</p>
                </div>
              </div>

              <div className="flex items-center space-x-2 text-xs opacity-80 leading-snug">
                <Info className="h-4 w-4 shrink-0" />
                <p>Ціна розраховується автоматично та є максимально точною. Для підтвердження просто замовте дзвінок.</p>
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
