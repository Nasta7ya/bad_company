import React, { useState } from 'react';
import { X, BookOpen, Dices, ShieldAlert, Trophy, Users, Award, Crown, CheckCircle2 } from 'lucide-react';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'dice' | 'gang' | 'heists' | 'police' | 'solo' | 'scoring'>('overview');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl text-white overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400 flex items-center justify-center text-amber-300">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-lg text-slate-100">
                Погана компанія (Bad Company) — Офіційні правила Rozum
              </h3>
              <p className="text-xs text-slate-400">
                Повний посібник із механік, карт, завдань та погоні для 1–4 гравців
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-5 gap-2 overflow-x-auto text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-2 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'overview' ? 'border-amber-400 text-amber-300' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Огляд гри
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('dice')}
            className={`py-3 px-2 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'dice' ? 'border-amber-400 text-amber-300' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Кубики та пари
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('gang')}
            className={`py-3 px-2 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'gang' ? 'border-amber-400 text-amber-300' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Банда (2–12) та Завдання
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('heists')}
            className={`py-3 px-2 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'heists' ? 'border-amber-400 text-amber-300' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Пограбування та Кольє
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('police')}
            className={`py-3 px-2 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'police' ? 'border-amber-400 text-amber-300' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Трек погоні та Поліція
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('solo')}
            className={`py-3 px-2 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'solo' ? 'border-amber-400 text-amber-300' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Соло-режим
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('scoring')}
            className={`py-3 px-2 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'scoring' ? 'border-amber-400 text-amber-300' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Фінал і Підрахунок
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-sm leading-relaxed text-slate-300">
          {activeTab === 'overview' && (
            <div className="space-y-3">
              <h4 className="font-bold text-base text-amber-300">Мета та суть гри</h4>
              <p>
                У грі <strong>«Погана компанія» (Bad Company)</strong> кожен гравець очолює банду з 11 колоритних злочинців (номери 2–12). Ви плануєте пограбування, прокачуєте своїх грабіжників, накопичуєте здобич і тікаєте від невпинної поліцейської погоні міськими вулицями до поромного порту.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
                  <div className="font-bold text-slate-100 mb-1 flex items-center gap-1.5">
                    <span className="text-amber-400">1.</span> Активний гравець — Бос
                  </div>
                  <p className="text-xs text-slate-400">
                    Бос кидає 4 золоті кубики і 1 поліцейський кубик. Бос об'єднує 4 кубики у дві пари і активує ОБОХ своїх грабіжників!
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
                  <div className="font-bold text-slate-100 mb-1 flex items-center gap-1.5">
                    <span className="text-amber-400">2.</span> Решта гравців
                  </div>
                  <p className="text-xs text-slate-400">
                    Усі інші гравці обирають ОДНУ із двох сформованих Босом пар і активують відповідного грабіжника у своїй банді. Ніхто не сумує в очікуванні ходу!
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'dice' && (
            <div className="space-y-3">
              <h4 className="font-bold text-base text-amber-300">Кубики, перекидання та пари</h4>
              <ul className="list-disc pl-5 space-y-1.5 text-xs">
                <li>
                  <strong>4 Золоті кубики банди (1–6):</strong> дають суми від 2 до 12.
                </li>
                <li>
                  <strong>1 Чорний поліцейський кубик (0, 1, 1, 2, 2, 3):</strong> визначає, на скільки кроків просунеться патрульне авто наприкінці ходу Боса.
                </li>
                <li>
                  <strong>Перекидання ($1):</strong> Бос може сплатити $1 зі свого запасу, щоб перекинути будь-яку кількість кубиків (включаючи поліцейський). Робити це можна скільки завгодно разів, поки вистачає монет!
                </li>
                <li>
                  <strong>Складання у пари:</strong> 4 кубики діляться на 2 пари. Наприклад, випало [2, 3, 5, 5]. Варіанти: (2+3=5 та 5+5=10), або (2+5=7 та 3+5=8). Бос обирає найкращу комбінацію для себе.
                </li>
              </ul>
            </div>
          )}

          {activeTab === 'gang' && (
            <div className="space-y-3">
              <h4 className="font-bold text-base text-amber-300">Планшет банди та особливі ролі</h4>
              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700">
                  <strong className="text-amber-400">Грабіжник #2 — «Навідник» (The Fixer):</strong>
                  <p className="mt-0.5 text-slate-300">
                    Особлива здатність: коли випадає 2, ви обираєте один із трьох символів: 🎭 Маска, 🧤 Рукавичка або 🔒 Відмичка. Ви отримуєте стільки маркерів цього символу, скільки їх зараз є на ваших інших грабіжниках (номери 3–12)!
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700">
                  <strong className="text-amber-400">Грабіжник #12 — «Водій на втечу» (The Chauffeur):</strong>
                  <p className="mt-0.5 text-slate-300">
                    Стартово дає одразу 2 керма (🏎️🏎️), просуваючи ваше авто на 2 клітинки вперед по міському треку!
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700">
                  <strong className="text-amber-400">Завдання під планшетом (Tasks):</strong>
                  <ul className="list-disc pl-5 mt-1 space-y-1 text-slate-300">
                    <li><strong>Під #2:</strong> 2× 🎭 Маски → ⭐ 1 Джокер-маркер (універсальний)</li>
                    <li><strong>Під #2:</strong> 2× 🧤 Рукавички → 💰 $2 готівки</li>
                    <li><strong>Під #12:</strong> 2× 🔒 Відмички → 🏎️ +1 крок авто вперед</li>
                    <li><strong>Під #12:</strong> 2× 🔦 Ліхтарики → 🎁 1 Карта здобичі (Loot Card)</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'heists' && (
            <div className="space-y-3">
              <h4 className="font-bold text-base text-amber-300">Пограбування та 4 Королівські Кольє</h4>
              <p className="text-xs">
                Кожен гравець тримає перед собою до 2 активних пограбувань. Отримані символи викладаються маркерами на відповідні комірки карт.
              </p>
              <ul className="list-disc pl-5 space-y-1 text-xs">
                <li>Коли всі символи карти закрито, пограбування завершено!</li>
                <li>Ви отримуєте зазначені Переможні Очки (ПО) та миттєвий бонус (гроші, авто, здобич або джокери).</li>
                <li>Карта підкладається під планшет, відкриваючи один із 4 трофеїв: 💎 Діамант, 🟡 Золото, 🖼️ Картина, 💰 Мішок грошей.</li>
                <li>Береться нова карта з вітрини ринку (де завжди лежить 4 карти).</li>
              </ul>

              <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/40 text-xs">
                <strong className="text-amber-300">👑 Правило Кольє:</strong>
                <p className="mt-1 text-slate-300">
                  Наприкінці кожного ходу перевіряється, хто має сувору більшість кожного типу трофеїв. Лідер отримує відповідне кольє і кладе його на одного зі своїх грабіжників. Отримує +1 ПО одразу, +1 ПО щоразу при активації цього грабіжника, та +2 ПО у фіналі гри!
                </p>
              </div>
            </div>
          )}

          {activeTab === 'police' && (
            <div className="space-y-3">
              <h4 className="font-bold text-base text-amber-300">Міський трек погоні та Поліція</h4>
              <p className="text-xs">
                Міський трек складається з 26 клітинок (0–25). Наприкінці ходу Боса поліцейське авто рухається на кількість клітинок із чорного кубика.
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs">
                <li>
                  <strong>Чекпоінти (клітинки 5, 10, 15, 20):</strong> перший гравець, який проїжджає або стає на чекпоінт, отримує бонус ($2, здобич або +3 кроки авто), ТІЛЬКИ якщо його авто рухається ПОПЕРЕДУ поліції!
                </li>
                <li>
                  <strong>Червона зона (клітинки 22–25):</strong> зона порту та порома для втечі. Як тільки будь-яке авто (гравця чи поліції) заїжджає сюди, оголошується фінальне коло гри!
                </li>
                <li>
                  <strong>Штраф поліції:</strong> якщо наприкінці гри ваше авто знаходиться позаду поліцейського авто — ви втрачаєте 3 Переможні Очки (-3 ПО)!
                </li>
              </ul>
            </div>
          )}

          {activeTab === 'solo' && (
            <div className="space-y-3">
              <h4 className="font-bold text-base text-amber-300">Соло-режим</h4>
              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700">
                  <strong className="text-amber-400">1. Соло проти комп'ютерних ботів (1–3 ШІ-суперники):</strong>
                  <p className="mt-0.5 text-slate-300">
                    Повноцінна гра за стандартними правилами мультиплеєра! Комп'ютерні гравці мають різні тактичні характери («Спрінтер», «Магнат», «Колекціонер», «Збалансований»), вміють обирати пари, прокачуватись та претендувати на кольє.
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700">
                  <strong className="text-amber-400">2. Соло-випробування проти Поліції (Офіційний варіант книги правил):</strong>
                  <p className="mt-0.5 text-slate-300">
                    Ви граєте самі проти безжальної поліції. Поліція стартує на клітинці 6 і рухається на <strong>результат кубика + 1 крок</strong> кожен раунд! Щоб завоювати кольє, потрібно зібрати щонайменше 3 однакові трофеї. Якщо поліція наздоганяє або обганяє ваше авто — ви негайно програєте (схоплені)!
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'scoring' && (
            <div className="space-y-3">
              <h4 className="font-bold text-base text-amber-300">Кінець гри та фінальний підрахунок очок</h4>
              <p className="text-xs">
                Гра завершується, коли будь-який гравець завершує своє <strong>6-те пограбування</strong> АБО будь-яке авто в'їжджає у <strong>червону зону порту (клітинка 22+)</strong>. Дограється поточне коло, щоб кожен побував Босом однакову кількість разів.
              </p>

              <div className="p-3 rounded-xl bg-slate-800/90 border border-slate-700 space-y-1 text-xs">
                <div className="font-bold text-slate-200 mb-1">Формула переможних очок:</div>
                <div>✓ Очки за всі виконані пограбування</div>
                <div>✓ Очки з карт вербування (бонуси на планшеті)</div>
                <div>✓ Очки з карт здобичі (фінальні карти)</div>
                <div>✓ +2 ПО за кожне кольє, яке ви утримуєте наприкінці гри</div>
                <div>✓ +1 ПО за кожні 2 залишені маркери на незавершених справах і завданнях</div>
                <div className="text-red-400 font-bold">✗ -3 ПО штрафу, якщо ваше авто позаду поліції!</div>
              </div>

              <p className="text-xs text-slate-400 italic">
                Перемагає гравець із найбільшою сумою очок! За рівності очок перемагає той, у кого залишилося більше монет.
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow cursor-pointer transition-transform active:scale-95"
          >
            Зрозуміло, до гри!
          </button>
        </div>
      </div>
    </div>
  );
};
