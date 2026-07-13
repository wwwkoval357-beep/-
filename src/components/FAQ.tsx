import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const FAQS = [
  {
    question: 'Які документи потрібні для евакуації автомобіля?',
    answer: 'Для транспортування автомобіля водієві необхідно надати: свідоцтво про реєстрацію транспортного засобу (техпаспорт) або довіреність, а також документ, що посвідчує вашу особу (паспорт або водійські права). Ми здійснюємо евакуацію виключно на законних підставах.',
  },
  {
    question: 'Як швидко приїжджає евакуатор після замовлення?',
    answer: 'Середній час прибуття нашого евакуатора в межах міста становить 20–30 хвилин. Наші машини чергують у різних районах, тому диспетчер одразу відправляє найближчий евакуатор, що мінімізує час очікування.',
  },
  {
    question: 'Чи працюєте ви вночі або у святкові дні?',
    answer: 'Так, ми працюємо цілодобово (24/7), без вихідних, перерв та святкових днів. Наші екіпажі чергують по змінах, тому ви можете розраховувати на швидку та професійну допомогу навіть посеред новорічної ночі.',
  },
  {
    question: 'Чи зміниться ціна, яку мені назвав диспетчер або порахував калькулятор?',
    answer: 'Ні, ціна фіксується під час оформлення замовлення. Ми працюємо чесно: якщо ви вказали правильні параметри (марку авто, стан коліс, відстань), фінальна сума буде точно відповідати озвученій. Жодних прихованих націнок по прибуттю евакуатора.',
  },
  {
    question: 'Що робити, якщо у мого автомобіля заблоковані колеса або несправне кермо?',
    answer: 'Обов’язково попередьте диспетчера або оберіть відповідну опцію в нашому онлайн-калькуляторі. Для таких випадків ми відправимо евакуатор, укомплектований спеціальними підкатними візками чи висувною платформою, щоб завантажити авто максимально безпечно.',
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-24 bg-slate-900 border-b border-slate-800 text-white scroll-mt-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center space-x-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
            <HelpCircle className="h-4 w-4" />
            <span>Часті запитання від водіїв</span>
          </div>
          <h2 className="font-display font-black text-3xl sm:text-4xl tracking-tight">
            Популярні <span className="text-amber-500">питання та відповіді</span>
          </h2>
          <p className="text-slate-400 mt-4 text-sm sm:text-base">
            Тут ми зібрали відповіді на найпоширеніші запитання, щоб допомогти вам швидко розібратися з нюансами виклику евакуатора.
          </p>
        </div>

        {/* Accordions */}
        <div className="space-y-4">
          {FAQS.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden transition-all duration-200"
              >
                <button
                  onClick={() => toggleFAQ(idx)}
                  className="w-full flex items-center justify-between p-5 sm:p-6 text-left font-display font-bold text-sm sm:text-base text-slate-100 hover:text-amber-500 transition-colors focus:outline-none cursor-pointer"
                  id={`faq-btn-${idx}`}
                >
                  <span>{faq.question}</span>
                  <span className="ml-4 p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 shrink-0">
                    {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </span>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="px-5 pb-5 sm:px-6 sm:pb-6 text-xs sm:text-sm text-slate-400 leading-relaxed font-medium border-t border-slate-900 pt-4">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
