import React from 'react';
import { Clock, ShieldCheck, HeartHandshake, Award, Scale, HelpCircle } from 'lucide-react';
import { motion } from 'motion/react';

const ADVANTAGES = [
  {
    icon: <Clock className="h-6 w-6 text-amber-500" />,
    title: 'Рекордно швидка подача',
    description: 'Ми розосередили наші евакуатори по різних точках міста та ключових розв’язках, щоб прибути до вас за 20-30 хвилин.',
  },
  {
    icon: <Scale className="h-6 w-6 text-amber-500" />,
    title: '100% чесна та фіксована ціна',
    description: 'Жодних прихованих доплат за вагу автомобіля чи "складність" на місці. Ціна озвучується диспетчером перед виїздом.',
  },
  {
    icon: <HeartHandshake className="h-6 w-6 text-emerald-400" />,
    title: 'Дбайливе завантаження',
    description: 'Використовуємо спеціальні текстильні ремені та захисні накладки на диски. Надійно фіксуємо автомобіль на платформі.',
  },
  {
    icon: <Award className="h-6 w-6 text-amber-500" />,
    title: 'Професійні водії зі стажем',
    description: 'Наші водії — досвідчені фахівці, які пройшли спеціальну підготовку та знають, як діяти в найскладніших ситуаціях на дорозі.',
  },
  {
    icon: <HelpCircle className="h-6 w-6 text-emerald-400" />,
    title: 'Працюємо у будь-яку погоду',
    description: 'Дощ, сильний снігопад, ожеледиця, глибока ніч або святковий день — ми завжди на зв’язку та готові виїхати на допомогу.',
  },
];

export default function Advantages() {
  return (
    <section id="advantages" className="py-24 bg-slate-800 border-b border-slate-700 text-white scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center space-x-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
            <ShieldCheck className="h-4 w-4" />
            <span>Чому обирають саме нас</span>
          </div>
          <h2 className="font-display font-black text-3xl sm:text-4xl lg:text-5xl tracking-tight">
            Наші ключові <span className="text-amber-500">переваги</span>
          </h2>
          <p className="text-slate-400 mt-4 text-base sm:text-lg">
            Ми завоювали довіру тисяч водіїв завдяки швидкості, акуратності та чесному ціноутворенню. Працюємо так, щоб ви могли спокійно довірити нам свій автомобіль.
          </p>
        </div>

        {/* Grid of Advantages */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {ADVANTAGES.map((adv, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.05 }}
              className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-3xl space-y-4 hover:border-slate-700 hover:shadow-xl transition-all"
              id={`adv-card-${idx}`}
            >
              <div className="bg-slate-800 h-12 w-12 rounded-2xl flex items-center justify-center border border-slate-700/80 shadow-inner">
                {adv.icon}
              </div>
              <h3 className="font-display font-bold text-lg text-slate-100">
                {adv.title}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                {adv.description}
              </p>
            </motion.div>
          ))}
        </div>


      </div>
    </section>
  );
}
