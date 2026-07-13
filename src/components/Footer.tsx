import React from 'react';
import { Navigation, Phone, MapPin, Mail, Heart } from 'lucide-react';

interface FooterProps {
  onScrollTo: (elementId: string) => void;
  onCallClick: () => void;
  onAdminClick?: () => void;
}

export default function Footer({ onScrollTo, onCallClick, onAdminClick }: FooterProps) {
  return (
    <footer className="bg-slate-950 text-white border-t border-slate-900 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 border-b border-slate-900 pb-12 mb-12">
          
          {/* Col 1: Brand & Desc */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="bg-amber-500 text-slate-950 p-2 rounded-lg shadow-md">
                <Navigation className="h-5 w-5 transform rotate-45" />
              </div>
              <span className="font-display font-black text-lg tracking-wider uppercase">
                Евакуатор <span className="text-amber-500">24/7</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed font-semibold">
              Цілодобова професійна автодопомога на дорогах України. Швидкий виїзд, дбайливе транспортування та прозорі фіксовані ціни без прихованих платежів.
            </p>

          </div>

          {/* Col 2: Navigation Links */}
          <div className="space-y-4">
            <h4 className="font-display font-bold text-sm tracking-wider uppercase text-slate-300">Навігація</h4>
            <ul className="space-y-2.5 text-xs text-slate-400 font-semibold">
              <li>
                <button onClick={() => onScrollTo('services')} className="hover:text-amber-500 transition-colors cursor-pointer">
                  Наші послуги
                </button>
              </li>
              <li>
                <button onClick={() => onScrollTo('calculator')} className="hover:text-amber-500 transition-colors cursor-pointer">
                  Онлайн калькулятор
                </button>
              </li>
              <li>
                <button onClick={() => onScrollTo('advantages')} className="hover:text-amber-500 transition-colors cursor-pointer">
                  Чому ми
                </button>
              </li>
              <li>
                <button onClick={() => onScrollTo('faq')} className="hover:text-amber-500 transition-colors cursor-pointer">
                  Часті запитання
                </button>
              </li>
              {onAdminClick && (
                <li className="pt-1.5 border-t border-slate-900">
                  <button onClick={onAdminClick} className="text-slate-500 hover:text-amber-500 font-bold transition-colors cursor-pointer flex items-center gap-1.5">
                    🔒 Панель адміна
                  </button>
                </li>
              )}
            </ul>
          </div>

          {/* Col 3: Contacts */}
          <div className="space-y-4">
            <h4 className="font-display font-bold text-sm tracking-wider uppercase text-slate-300">Контакти</h4>
            <ul className="space-y-3 text-xs text-slate-400 font-medium">
              <li className="flex items-center space-x-2.5">
                <Phone className="h-4 w-4 text-amber-500 shrink-0" />
                <a 
                  href="tel:+380990823225" 
                  onClick={(e) => {
                    e.preventDefault();
                    onCallClick();
                  }}
                  className="hover:text-amber-500 font-bold text-slate-200 transition-colors"
                >
                  +38 (099) 082-32-25
                </a>
              </li>
              <li className="flex items-center space-x-2.5">
                <Mail className="h-4 w-4 text-amber-500 shrink-0" />
                <a href="mailto:wwwkoval357@gmail.com" className="hover:text-amber-500 transition-colors">
                  wwwkoval357@gmail.com
                </a>
              </li>
              <li className="flex items-center space-x-2.5">
                <MapPin className="h-4 w-4 text-amber-500 shrink-0" />
                <span>Головний офіс: м. Шептицький, вул. Бандери, 11</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Footer bottom */}
        <div className="flex flex-col sm:flex-row justify-between items-center text-[11px] text-slate-500 gap-4 font-semibold uppercase tracking-wider">
          <p>© 2026 Евакуатор 24/7. Усі права захищено.</p>
          <p className="flex items-center">
            Зроблено з <Heart className="h-3.5 w-3.5 text-red-500 mx-1 fill-current" /> для безпеки на дорогах
          </p>
        </div>

      </div>
    </footer>
  );
}
