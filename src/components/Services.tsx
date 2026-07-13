import React from 'react';
import { Truck, Shield, HelpCircle, Navigation, Anchor, Sparkles, Flame, Check } from 'lucide-react';
import { motion } from 'motion/react';

interface ServicesProps {
  onSelectService: (vehicleType: string) => void;
}

const SERVICES = [
  {
    id: 'passenger',
    title: 'Легкові автомобілі',
    description: 'Дбайливе транспортування седанів, хетчбеків, купе та універсалів будь-якої марки з повною фіксацією коліс.',
    price: 'від 1100 грн',
    kmPrice: '30 грн/км',
    features: ['Блокування коліс не заважає', 'Транспортування низьких спорткарів', 'Акуратне затягування лебідкою'],
    icon: '🚗',
  },
  {
    id: 'suv',
    title: 'Позашляховики та Кросовери',
    description: 'Евакуація важких позашляховиків, кросоверів, джипів, мінівенів та рамних пікапів за допомогою посиленої платформи.',
    price: 'від 1300 грн',
    kmPrice: '35 грн/км',
    features: ['Посилена гідравлічна лебідка', 'Евакуація авто з 4х4 приводом', 'Підкатні візки при блокуванні'],
    icon: '🚙',
  },
  {
    id: 'minibus',
    title: 'Комерційний транспорт та Буси',
    description: 'Транспортування комерційного транспорту, бусів, фургонів та довгих вантажних пасажирських мікроавтобусів.',
    price: 'від 1700 грн',
    kmPrice: '40 грн/км',
    features: ['Довжина платформи до 7.5 метрів', 'Вантажопідйомність до 5 тонн', 'Перевезення спецобладнання'],
    icon: '🚐',
  },
  {
    id: 'motorcycle',
    title: 'Мотоцикли та Квадроцикли',
    description: 'Транспортування мотоциклів, байків, скутерів, квадроциклів, снігоходів та баггі на спеціалізованому мотоевакуаторі.',
    price: 'від 750 грн',
    kmPrice: '25 грн/км',
    features: ['Спеціальні стопори для мотоциклів', 'Кріплення ременями в 4 точках', 'Закритий або відкритий причіп'],
    icon: '🏍️',
  },
  {
    id: 'machinery',
    title: 'Спецтехніка та Трактори',
    description: 'Евакуація будівельної техніки, міні-екскаваторів, вилкових навантажувачів, тракторів, ковзанок та сільгосптехніки.',
    price: 'від 2000 грн',
    kmPrice: '50 грн/км',
    features: ['Висувні апарелі для заїзду', 'Надійне ланцюгове кріплення', 'Вантажопідйомність до 6 тонн'],
    icon: '🚜',
  },
];

export default function Services({ onSelectService }: ServicesProps) {
  return (
    <section id="services" className="py-24 bg-slate-950 text-white scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-4 shadow-sm">
              <Truck className="h-4 w-4" />
              <span>Широкий спектр автодопомоги</span>
            </div>
            <h2 className="font-display font-black text-3xl sm:text-4xl lg:text-5xl tracking-tight">
              Наші послуги <span className="text-amber-500">евакуації</span>
            </h2>
            <p className="text-slate-400 mt-4 text-sm sm:text-base">
              Оберіть відповідну категорію транспорту. Наш автопарк укомплектований сучасними евакуаторами з висувними платформами, лебідками та маніпуляторами.
            </p>
          </div>
          <div className="flex shrink-0">
            <span className="text-xs bg-slate-900 border border-slate-800 text-slate-300 font-semibold px-4 py-2.5 rounded-2xl flex items-center shadow-inner">
              <Sparkles className="h-4 w-4 text-amber-500 mr-2" />
              Усі ціни фіксуються в договорі
            </span>
          </div>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {SERVICES.map((service, index) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="bg-slate-900 border border-slate-800/80 rounded-3xl p-6 sm:p-8 flex flex-col justify-between hover:border-slate-700 hover:shadow-2xl hover:shadow-slate-950/50 transition-all group"
            >
              <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="text-4xl bg-slate-950 h-14 w-14 rounded-2xl flex items-center justify-center border border-slate-800/80 shadow-inner group-hover:scale-110 group-hover:border-amber-500/30 transition-all">
                    {service.icon}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Тариф</p>
                    <p className="font-display font-black text-lg text-amber-500 leading-none mt-1">{service.price}</p>
                    <p className="text-[10px] text-slate-400 mt-1">{service.kmPrice}</p>
                  </div>
                </div>

                {/* Info */}
                <div className="space-y-2">
                  <h3 className="font-display font-black text-xl text-slate-100 group-hover:text-amber-400 transition-colors">
                    {service.title}
                  </h3>
                </div>

                {/* Features list */}
                <ul className="space-y-2.5 pt-4 border-t border-slate-800/60">
                  {service.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start text-xs text-slate-300 font-medium">
                      <Check className="h-4 w-4 text-emerald-400 mr-2 shrink-0 stroke-[2.5]" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Button */}
              <div className="pt-8">
                <button
                  onClick={() => onSelectService(service.id)}
                  className="w-full bg-slate-950 hover:bg-amber-500 text-slate-300 hover:text-slate-950 border border-slate-800 hover:border-amber-500 font-bold uppercase tracking-wider py-3.5 rounded-xl transition-all text-xs flex items-center justify-center space-x-1.5 cursor-pointer group-hover:shadow-lg"
                  id={`service-order-btn-${service.id}`}
                >
                  <span>Розрахувати або Замовити</span>
                </button>
              </div>

            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
