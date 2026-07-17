import React from 'react';
import { Phone, Navigation, Shield, Truck } from 'lucide-react';
import { motion } from 'motion/react';

interface HeaderProps {
  onScrollTo: (elementId: string) => void;
  onCallClick: () => void;
  onAdminClick?: () => void;
  onDriverClick: () => void;
  loggedDriver?: any;
}

export default function Header({ onScrollTo, onCallClick, onAdminClick, onDriverClick, loggedDriver }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Logo */}
        <div 
          className="flex items-center space-x-3 cursor-pointer group"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          id="logo-button"
        >
          <div className="bg-amber-500 text-slate-950 p-2 rounded-lg shadow-md group-hover:bg-amber-400 transition-colors">
            <Navigation className="h-6 w-6 transform rotate-45" />
          </div>
          <div>
            <span className="font-display font-black text-xl tracking-wider uppercase block leading-none">
              Евакуатор <span className="text-amber-500">24/7</span>
            </span>
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold block mt-0.5">
              Швидка автодопомога
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-300">
          <button 
            onClick={() => onScrollTo('services')}
            className="hover:text-amber-500 transition-colors cursor-pointer"
            id="nav-services"
          >
            Послуги
          </button>
          <button 
            onClick={() => onScrollTo('calculator')}
            className="hover:text-amber-500 transition-colors cursor-pointer"
            id="nav-calculator"
          >
            Калькулятор
          </button>
          <button 
            onClick={() => onScrollTo('advantages')}
            className="hover:text-amber-500 transition-colors cursor-pointer"
            id="nav-advantages"
          >
            Переваги
          </button>
          <button 
            onClick={() => onScrollTo('faq')}
            className="hover:text-amber-500 transition-colors cursor-pointer"
            id="nav-faq"
          >
            FAQ
          </button>
        </nav>

        {/* Action Button & Dispatch Status */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onDriverClick}
            className={`flex items-center gap-2 px-3 py-2.5 sm:px-4 sm:py-3 rounded-xl transition-all cursor-pointer text-xs font-black uppercase tracking-wider ${
              loggedDriver 
                ? 'bg-slate-800/90 hover:bg-slate-800 text-amber-400 border border-emerald-500/50 hover:border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]' 
                : 'bg-slate-800 hover:bg-slate-700 hover:text-amber-400 border border-slate-700 hover:border-amber-500/30 text-slate-300'
            }`}
            title={loggedDriver ? `Кабінет водія (Активний: ${loggedDriver.name})` : "Кабінет водія евакуатора"}
            id="driver-btn-header"
          >
            {loggedDriver ? (
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            ) : (
              <Truck className="h-4 w-4 text-amber-500 shrink-0" />
            )}
            <span className="hidden sm:inline">
              {loggedDriver ? `Кабінет водія (${loggedDriver.name.split(' ')[0]})` : "Кабінет водія"}
            </span>
          </button>

          {onAdminClick && (
            <button
              onClick={onAdminClick}
              className="p-2.5 sm:p-3 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-amber-500 border border-slate-700 hover:border-amber-500/30 rounded-xl transition-all cursor-pointer"
              title="Панель адміністратора"
              id="admin-btn-header"
            >
              <Shield className="h-4 w-4" />
            </button>
          )}
          <motion.a
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            href="tel:+380990823225"
            onClick={(e) => {
              e.preventDefault();
              onCallClick();
            }}
            className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2.5 sm:px-5 sm:py-3 rounded-xl shadow-lg shadow-emerald-900/30 transition-all text-sm uppercase tracking-wider border border-emerald-500/20"
            id="call-btn-header"
          >
            <Phone className="h-4 w-4 animate-pulse" />
            <span>Виклик</span>
          </motion.a>
        </div>
      </div>
    </header>
  );
}
