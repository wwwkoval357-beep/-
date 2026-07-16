import React from 'react';
import { Shield, Clock } from 'lucide-react';
import { TowOrder } from '../types';

interface HeroProps {
  onOrderCreated: (order: TowOrder) => void;
  onScrollTo: (elementId: string) => void;
}

export default function Hero({ onScrollTo }: HeroProps) {
  return (
    <section className="relative bg-slate-900 text-white pt-24 pb-28 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Abstract Background Accents */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-25"></div>
      
      {/* Amber/Green glow */}
      <div className="absolute -top-40 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute top-40 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-4xl mx-auto text-center flex flex-col items-center space-y-8 relative z-10 animate-fade-in">
        
        <div className="space-y-6 flex flex-col items-center">
          <div className="inline-flex items-center space-x-2 bg-slate-800 border border-slate-700 px-3.5 py-1.5 rounded-full text-xs text-amber-500 font-semibold tracking-wider uppercase shadow-md">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            <span>Цілодобовий виїзд • 24/7 • Україна</span>
          </div>
          
          <h1 className="font-display font-black text-4xl sm:text-5xl lg:text-6xl tracking-tight leading-tight">
            Потрібен евакуатор?<br />
            <span className="text-amber-500">Подача від 20 хв</span><br />
            без прихованих націнок!
          </h1>
          

        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 gap-4 border-y border-slate-800/80 py-6 w-full max-w-lg">
          <div className="space-y-1 text-center">
            <div className="font-display font-bold text-xl sm:text-2xl text-amber-500">30-40 хв</div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Час прибуття</div>
          </div>
          <div className="space-y-1 text-center border-l border-slate-800/80">
            <div className="font-display font-bold text-xl sm:text-2xl text-white">від 750₴</div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Подача авто</div>
          </div>
        </div>

        {/* Call to Actions */}
        <div className="flex flex-col items-center justify-center w-full">
          <button
            onClick={() => onScrollTo('calculator')}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-display font-black uppercase tracking-wider px-8 py-4 rounded-xl shadow-lg shadow-amber-500/10 transition-all text-xs text-center cursor-pointer w-full sm:w-auto"
          >
            📊 Розрахувати ціну та викликати
          </button>
        </div>

        {/* Quick benefits bullets */}
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8 text-xs sm:text-sm text-slate-300 pt-2">
          <div className="flex items-center space-x-2">
            <Clock className="h-4.5 w-4.5 text-amber-500 shrink-0" />
            <span>Швидка подача в усіх районах міста</span>
          </div>
          <div className="flex items-center space-x-2">
            <Shield className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
            <span>Дбайливе транспортування та безпека авто</span>
          </div>
        </div>

      </div>
    </section>
  );
}
