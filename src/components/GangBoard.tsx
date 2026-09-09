import React, { useState } from 'react';
import { GangMemberSlot, HeistCard, PlayerState, ResourceSymbol } from '../types/game';
import { sound } from '../utils/audio';
import { getGangMemberSymbols } from '../utils/gameLogic';
import { VPIcon } from './VPIcon';
import { Crown, Sparkles, Plus, Award, ShieldAlert, Zap, X, Check, Target, CheckCircle2, ChevronRight, Eye } from 'lucide-react';

interface GangBoardProps {
  player: PlayerState;
  isCurrentTurn: boolean;
  highlightedSums?: number[];
  onSlotClick?: (sum: number) => void;
  onActivateFixer?: (choice: 'mask' | 'glove' | 'lock') => void;
  showFixerModal?: boolean;
  onCloseFixerModal?: () => void;
  canRerollGang?: boolean;
  onRerollGang?: () => void;
}

// Authentic Bad Company Gangster lineup details (Avatars & Roles)
const GANGSTER_PROFILES: Record<number, { avatar: string; roleDesc: string; quote: string }> = {
  2: { avatar: '🕵️‍♂️', roleDesc: 'Координатор банди', quote: '«Знаю все про всіх»' },
  3: { avatar: '🧤', roleDesc: 'Спритні пальці', quote: '«Що в кишені — те моє»' },
  4: { avatar: '💻', roleDesc: 'Кібер-зломник', quote: '«Камери вимкнено»' },
  5: { avatar: '🔦', roleDesc: 'Ведмежатник', quote: '«Сейфи самі відкриваються»' },
  6: { avatar: '🎭', roleDesc: 'Майстер маскування', quote: '«Мене тут ніколи не було»' },
  7: { avatar: '🥊', roleDesc: 'Силач-вибивала', quote: '«Двері з петель»' },
  8: { avatar: '🥽', roleDesc: 'Нічний розвідник', quote: '«Бачу крізь темряву»' },
  9: { avatar: '🔑', roleDesc: 'Механік замків', quote: '«Будь-який шифр за хвилину»' },
  10: { avatar: '🚤', roleDesc: 'Контрабандист', quote: '«Чистий фарватер»' },
  11: { avatar: '🕶️', roleDesc: 'Агент у тіні', quote: '«Зв’язки на найвищому рівні»' },
  12: { avatar: '🏎️', roleDesc: 'Водій на втечу', quote: '«Тисни на газ!»' },
};

export const GangBoard: React.FC<GangBoardProps> = ({
  player,
  isCurrentTurn,
  highlightedSums = [],
  onSlotClick,
  onActivateFixer,
  showFixerModal = false,
  onCloseFixerModal,
  canRerollGang = false,
  onRerollGang,
}) => {
  const [fixerChoice, setFixerChoice] = useState<'mask' | 'glove' | 'lock'>('mask');

  const getSymbolIcon = (sym: ResourceSymbol) => {
    switch (sym) {
      case 'mask': return '🎭';
      case 'glove': return '🧤';
      case 'lock': return '🔒';
      case 'flashlight': return '🔦';
      case 'wheel': return '🏎️';
      case 'coin': return '💰';
    }
  };

  const getSymbolLabel = (sym: ResourceSymbol) => {
    switch (sym) {
      case 'mask': return 'Маска';
      case 'glove': return 'Рукавичка';
      case 'lock': return 'Відмичка';
      case 'flashlight': return 'Ліхтарик';
      case 'wheel': return 'Кермо (+1 авто)';
      case 'coin': return '+$1 Монета';
    }
  };

  // Fixer calculations for slots 3..12 (exact symbols count on other gang members)
  const gangSymbolsCount: Record<'mask' | 'glove' | 'lock', { count: number; slots: number[] }> = {
    mask: { count: 0, slots: [] },
    glove: { count: 0, slots: [] },
    lock: { count: 0, slots: [] },
  };

  for (let num = 3; num <= 12; num++) {
    const slot = player.gangBoard[num];
    if (slot) {
      const syms = getGangMemberSymbols(slot);
      for (const s of ['mask', 'glove', 'lock'] as const) {
        const matchCount = syms.filter(x => x === s).length;
        if (matchCount > 0) {
          gangSymbolsCount[s].count += matchCount;
          gangSymbolsCount[s].slots.push(num);
        }
      }
    }
  }

  // Active heists needs breakdown
  const heistsAnalysis = (player.activeHeists || []).map(heist => {
    const reqCounts: Record<ResourceSymbol, number> = {
      mask: 0, glove: 0, lock: 0, flashlight: 0, wheel: 0, coin: 0,
    };
    const placedCounts: Record<ResourceSymbol, number> = {
      mask: 0, glove: 0, lock: 0, flashlight: 0, wheel: 0, coin: 0,
    };
    const remainingNeeded: Record<ResourceSymbol, number> = {
      mask: 0, glove: 0, lock: 0, flashlight: 0, wheel: 0, coin: 0,
    };

    for (const r of heist.requirements) {
      reqCounts[r] = (reqCounts[r] || 0) + 1;
    }
    for (const p of (heist.placedMarkers || [])) {
      placedCounts[p] = (placedCounts[p] || 0) + 1;
    }

    let totalNeeded = 0;
    for (const sym of ['mask', 'glove', 'lock', 'flashlight'] as const) {
      const rem = Math.max(0, reqCounts[sym] - placedCounts[sym]);
      remainingNeeded[sym] = rem;
      totalNeeded += rem;
    }

    return {
      heist,
      reqCounts,
      placedCounts,
      remainingNeeded,
      totalNeeded,
      isComplete: totalNeeded === 0,
    };
  });

  const totalNeededForActiveHeists: Record<'mask' | 'glove' | 'lock', number> = {
    mask: 0,
    glove: 0,
    lock: 0,
  };

  for (const ha of heistsAnalysis) {
    totalNeededForActiveHeists.mask += ha.remainingNeeded.mask;
    totalNeededForActiveHeists.glove += ha.remainingNeeded.glove;
    totalNeededForActiveHeists.lock += ha.remainingNeeded.lock;
  }

  const getNecklaceJewel = (n: string) => {
    switch (n) {
      case 'diamond': return '💎';
      case 'gold': return '🟡';
      case 'art': return '🖼️';
      case 'moneybag': return '💰';
      default: return '👑';
    }
  };

  return (
    <div id="gang-board-container" className="bg-slate-900/95 border-2 border-slate-750 rounded-3xl p-4 sm:p-5 shadow-2xl text-white">
      {/* Board Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-xl shadow-lg border border-amber-300">
            📋
          </div>
          <div>
            <h3 className="font-black text-lg tracking-wide text-slate-100 flex items-center gap-2">
              <span>Планшет банди: {player.name}</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-amber-300 font-bold">
                11 грабіжників (номери 2–12)
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              При випаданні суми пари активується відповідний грабіжник. Нові карти рекрутів накладаються на номери!
            </p>
          </div>
        </div>

        {/* Resources Badges & Reroll Option */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {canRerollGang && onRerollGang && (
            <button
              type="button"
              id="btn-reroll-gang"
              onClick={onRerollGang}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 text-amber-300 border border-amber-500/40 font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95"
              title="Згенерувати новий випадковий стартовий набір грабіжників для цього планшета (доступно до першого кидка)"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" style={{ animationDuration: '3s' }} />
              <span>🎲 Перетасувати банду</span>
            </button>
          )}
          <div className="px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 font-black flex items-center gap-1.5 shadow-sm">
            <span>💰</span> Готівка: ${player.coins}
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-purple-500/15 border border-purple-500/40 text-purple-300 font-black flex items-center gap-1.5 shadow-sm">
            <span>⭐</span> Джокери: {player.wildMarkers}
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-blue-500/15 border border-blue-500/40 text-blue-300 font-bold flex items-center gap-1.5 shadow-sm">
            <span>🏎️</span> Позиція авто: {player.carPosition}/25
          </div>
        </div>
      </div>

      {/* Authentic Gang Lineup Cards: 11 Columns (2 to 12) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-11 gap-2.5 overflow-x-auto pb-2">
        {Array.from({ length: 11 }, (_, i) => i + 2).map(num => {
          const slot = player.gangBoard[num];
          const profile = GANGSTER_PROFILES[num];
          const avatar = slot.avatar || profile?.avatar || '🕵️';
          const roleDesc = slot.role || profile?.roleDesc || '';
          const quote = slot.quote || profile?.quote || '';
          const isHighlighted = highlightedSums.includes(num);

          return (
            <div
              key={`gang_col_${num}`}
              id={`gang-slot-${num}`}
              onClick={() => onSlotClick && onSlotClick(num)}
              className={`flex flex-col justify-between rounded-2xl border-2 transition-all relative ${
                isHighlighted
                  ? 'bg-gradient-to-b from-amber-950/60 to-slate-900 border-amber-400 ring-2 ring-amber-400/80 shadow-2xl cursor-pointer scale-102 z-10 animate-pulse'
                  : 'bg-slate-850/90 border-slate-750 hover:border-slate-600'
              }`}
            >
              {/* Royal Necklace pinned to this column header */}
              {slot.assignedNecklace && (
                <div
                  className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 px-2 py-0.5 rounded-full bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-500 text-slate-950 border-2 border-white text-[10px] font-black flex items-center gap-1 shadow-lg animate-bounce"
                  title={`Кольє ${slot.assignedNecklace}: +1 ПО щоразу при випаданні суми #${num}!`}
                >
                  <span>{getNecklaceJewel(slot.assignedNecklace)}</span>
                  <span>КОЛЬЄ +1ПО</span>
                </div>
              )}

              {/* Column Top: Number Tab Header */}
              <div className="p-2 pb-1.5 flex items-center justify-between border-b border-slate-800">
                <span
                  className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm shadow-md transition-all ${
                    isHighlighted
                      ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-300'
                      : 'bg-slate-950 border border-slate-700 text-amber-300'
                  }`}
                >
                  {num}
                </span>

                {isHighlighted && (
                  <span className="text-[10px] font-black text-amber-400 uppercase tracking-tighter animate-pulse">
                    АКТИВНИЙ!
                  </span>
                )}
              </div>

              {/* Gangster Mugshot & Identity */}
              <div
                className="p-2 flex flex-col items-center text-center bg-slate-900/60 border-b border-slate-800"
                title={quote ? `${slot.title} (${roleDesc}) — ${quote}` : `${slot.title} (${roleDesc})`}
              >
                <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-750 flex items-center justify-center text-xl shadow-inner mb-1 transition-transform hover:scale-110">
                  {avatar}
                </div>
                <div className="text-[11px] font-black text-slate-100 leading-tight truncate w-full" title={slot.title}>
                  {slot.title}
                </div>
                <div className="text-[9px] text-slate-400 truncate w-full mt-0.5">
                  {roleDesc}
                </div>
              </div>

              {/* Base Symbols & Tucked Upgrade Cards */}
              <div className="p-2 flex-1 space-y-1.5">
                {/* Special #2 Fixer Ability */}
                {num === 2 ? (
                  <div className="text-[10px] text-amber-300/90 bg-amber-950/40 p-1.5 rounded-xl border border-amber-500/30 leading-tight text-center">
                    <strong className="block text-amber-200">Фіксер:</strong>
                    Оберіть 🎭, 🧤 або 🔒 — отримайте за всіма грабіжниками (3–12)!
                  </div>
                ) : (
                  <div className="flex flex-wrap justify-center gap-1">
                    {slot.baseSymbols.map((sym, sIdx) => (
                      <span
                        key={`base_sym_${num}_${sIdx}`}
                        className="w-7 h-7 rounded-lg bg-slate-950 border border-slate-700/80 shadow-inner flex items-center justify-center text-sm"
                        title={getSymbolLabel(sym)}
                      >
                        {getSymbolIcon(sym)}
                      </span>
                    ))}
                  </div>
                )}

                {/* Tucked Upgrades Stack */}
                {slot.upgrades.length > 0 && (
                  <div className="space-y-1 pt-1 border-t border-slate-800">
                    <div className="text-[9px] font-bold text-amber-400 uppercase tracking-wider text-center">
                      Прокачка (+{slot.upgrades.length}):
                    </div>
                    {slot.upgrades.map((upg, uIdx) => (
                      <div
                        key={`upg_${upg.id}_${uIdx}`}
                        className="p-1 rounded-xl bg-slate-950/90 border border-amber-500/50 text-[10px] shadow-sm"
                      >
                        <div className="font-bold text-slate-200 truncate text-[9px] flex items-center justify-between">
                          <span className="truncate">{upg.name}</span>
                          {upg.vpBonus > 0 && <VPIcon points={upg.vpBonus} size="sm" />}
                        </div>
                        <div className="flex flex-wrap justify-center gap-1 mt-0.5">
                          {upg.symbols.map((sym, sIdx) => (
                            <span key={`upg_sym_${sIdx}`} title={getSymbolLabel(sym)} className="text-xs">
                              {getSymbolIcon(sym)}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Task area under slot 2 */}
              {num === 2 && (
                <div className="p-2 pt-1 border-t-2 border-purple-500/30 bg-purple-950/20 text-[10px] space-y-1.5">
                  <div className="bg-slate-950/80 p-1.5 rounded-xl border border-purple-500/30">
                    <div className="text-[9px] text-purple-300 font-bold mb-1 flex items-center justify-between">
                      <span>2× 🎭</span>
                      <span>⭐ 1 Джокер</span>
                    </div>
                    <div className="flex justify-center gap-1.5">
                      <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center text-[9px] font-bold transition-all ${
                        player.tasks.underTwo.masksCount >= 1 ? 'bg-purple-600 border-purple-300 text-white shadow' : 'border-slate-700 bg-slate-900'
                      }`}>
                        {player.tasks.underTwo.masksCount >= 1 ? '✓' : ''}
                      </span>
                      <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center text-[9px] font-bold transition-all ${
                        player.tasks.underTwo.masksCount >= 2 ? 'bg-purple-600 border-purple-300 text-white shadow' : 'border-slate-700 bg-slate-900'
                      }`}>
                        {player.tasks.underTwo.masksCount >= 2 ? '✓' : ''}
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-950/80 p-1.5 rounded-xl border border-amber-500/30">
                    <div className="text-[9px] text-amber-300 font-bold mb-1 flex items-center justify-between">
                      <span>2× 🧤</span>
                      <span>💰 +$2</span>
                    </div>
                    <div className="flex justify-center gap-1.5">
                      <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center text-[9px] font-bold transition-all ${
                        player.tasks.underTwo.glovesCount >= 1 ? 'bg-amber-600 border-amber-300 text-white shadow' : 'border-slate-700 bg-slate-900'
                      }`}>
                        {player.tasks.underTwo.glovesCount >= 1 ? '✓' : ''}
                      </span>
                      <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center text-[9px] font-bold transition-all ${
                        player.tasks.underTwo.glovesCount >= 2 ? 'bg-amber-600 border-amber-300 text-white shadow' : 'border-slate-700 bg-slate-900'
                      }`}>
                        {player.tasks.underTwo.glovesCount >= 2 ? '✓' : ''}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Task area under slot 12 */}
              {num === 12 && (
                <div className="p-2 pt-1 border-t-2 border-blue-500/30 bg-blue-950/20 text-[10px] space-y-1.5">
                  <div className="bg-slate-950/80 p-1.5 rounded-xl border border-blue-500/30">
                    <div className="text-[9px] text-blue-300 font-bold mb-1 flex items-center justify-between">
                      <span>2× 🔒</span>
                      <span>🏎️ +1 Авто</span>
                    </div>
                    <div className="flex justify-center gap-1.5">
                      <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center text-[9px] font-bold transition-all ${
                        player.tasks.underTwelve.locksCount >= 1 ? 'bg-blue-600 border-blue-300 text-white shadow' : 'border-slate-700 bg-slate-900'
                      }`}>
                        {player.tasks.underTwelve.locksCount >= 1 ? '✓' : ''}
                      </span>
                      <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center text-[9px] font-bold transition-all ${
                        player.tasks.underTwelve.locksCount >= 2 ? 'bg-blue-600 border-blue-300 text-white shadow' : 'border-slate-700 bg-slate-900'
                      }`}>
                        {player.tasks.underTwelve.locksCount >= 2 ? '✓' : ''}
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-950/80 p-1.5 rounded-xl border border-emerald-500/30">
                    <div className="text-[9px] text-emerald-300 font-bold mb-1 flex items-center justify-between">
                      <span>2× 🔦</span>
                      <span>🎁 Здобич</span>
                    </div>
                    <div className="flex justify-center gap-1.5">
                      <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center text-[9px] font-bold transition-all ${
                        player.tasks.underTwelve.flashlightsCount >= 1 ? 'bg-emerald-600 border-emerald-300 text-white shadow' : 'border-slate-700 bg-slate-900'
                      }`}>
                        {player.tasks.underTwelve.flashlightsCount >= 1 ? '✓' : ''}
                      </span>
                      <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center text-[9px] font-bold transition-all ${
                        player.tasks.underTwelve.flashlightsCount >= 2 ? 'bg-emerald-600 border-emerald-300 text-white shadow' : 'border-slate-700 bg-slate-900'
                      }`}>
                        {player.tasks.underTwelve.flashlightsCount >= 2 ? '✓' : ''}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Fixer Choice Modal with Full Heist Requirements & Gang Symbols Verification */}
      {showFixerModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-slate-900 border-2 border-amber-500 rounded-3xl p-5 sm:p-6 max-w-3xl w-full shadow-2xl space-y-4 my-auto relative animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-3xl shadow-lg shrink-0">
                  {player.gangBoard[2]?.avatar || '🕵️‍♂️'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-black text-lg sm:text-xl text-slate-100">
                      Активація {player.gangBoard[2]?.title || 'Навідника'} (#2)
                    </h4>
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-bold">
                      Копіює грабіжників #3–12
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Оберіть один символ: ви отримаєте стільки маркерів цього типу, скільки їх сумарно є на номерах 3–12.
                  </p>
                </div>
              </div>

              {onCloseFixerModal && (
                <button
                  type="button"
                  onClick={onCloseFixerModal}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                  title="Тимчасово закрити модалку та оглянути стіл"
                >
                  <Eye className="w-4 h-4 text-amber-400" />
                  <span className="hidden sm:inline">Оглянути стіл</span>
                  <X className="w-4 h-4 ml-0.5" />
                </button>
              )}
            </div>

            {/* 3 Main Choice Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(['mask', 'glove', 'lock'] as const).map(sym => {
                const isSelected = fixerChoice === sym;
                const inGang = gangSymbolsCount[sym].count;
                const inSlots = gangSymbolsCount[sym].slots;
                const neededInHeists = totalNeededForActiveHeists[sym];

                return (
                  <button
                    key={`fixer_btn_${sym}`}
                    id={`fixer-choice-${sym}`}
                    type="button"
                    onClick={() => setFixerChoice(sym)}
                    className={`p-3.5 rounded-2xl border-2 flex flex-col justify-between text-left cursor-pointer transition-all relative ${
                      isSelected
                        ? 'bg-gradient-to-b from-amber-500/20 via-slate-850 to-slate-900 border-amber-400 ring-2 ring-amber-400/80 shadow-xl scale-[1.02]'
                        : 'bg-slate-850/80 border-slate-750 hover:border-slate-600 hover:bg-slate-800'
                    }`}
                  >
                    {/* Selected Checkmark */}
                    {isSelected && (
                      <div className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-xs font-black shadow">
                        ✓
                      </div>
                    )}

                    <div className="flex items-center gap-2.5 mb-2">
                      <span className="text-3xl filter drop-shadow">{getSymbolIcon(sym)}</span>
                      <div>
                        <div className="text-sm font-black text-slate-100">{getSymbolLabel(sym)}</div>
                        <div className="text-[11px] text-slate-400">
                          {inSlots.length > 0
                            ? `Слоти: ${inSlots.map(s => `#${s}`).join(', ')}`
                            : 'Немає на слотах 3–12'}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                      {/* Yield from Gang */}
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">В банді (#3–12):</span>
                        <span className="font-black text-amber-300 text-sm">
                          +{inGang} шт.
                        </span>
                      </div>

                      {/* Need in Active Heists */}
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Потрібно у справах:</span>
                        <span className={`font-bold ${neededInHeists > 0 ? 'text-rose-300' : 'text-emerald-400'}`}>
                          {neededInHeists > 0 ? `${neededInHeists} шт.` : '0 (закрито)'}
                        </span>
                      </div>

                      {/* Status Advice Tag */}
                      <div className="pt-1">
                        {inGang === 0 ? (
                          <div className="px-2 py-0.5 rounded-lg bg-rose-950/50 border border-rose-800/60 text-rose-300 text-[10px] font-bold text-center">
                            ⚠️ 0 в банді (не дасть маркерів)
                          </div>
                        ) : neededInHeists > 0 && inGang >= neededInHeists ? (
                          <div className="px-2 py-0.5 rounded-lg bg-emerald-950/60 border border-emerald-700/60 text-emerald-300 text-[10px] font-bold text-center flex items-center justify-center gap-1">
                            <span>🎯 Покриє 100% потреб справ!</span>
                          </div>
                        ) : neededInHeists > 0 && inGang < neededInHeists ? (
                          <div className="px-2 py-0.5 rounded-lg bg-amber-950/60 border border-amber-700/60 text-amber-300 text-[10px] font-bold text-center">
                            ⚡ Покриє +{inGang} з {neededInHeists} потрібних
                          </div>
                        ) : (
                          <div className="px-2 py-0.5 rounded-lg bg-blue-950/60 border border-blue-700/60 text-blue-300 text-[10px] font-bold text-center">
                            📋 Справи закриті → піде в завдання
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Split Comparison Section: Heists Verification & Gang Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {/* Left Column: Active Heists & Missing Requirements */}
              <div className="bg-slate-850/90 border border-slate-750 rounded-2xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-750">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-slate-200">
                    <span>🗺️</span>
                    <span>Активні пограбування (потреби)</span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {heistsAnalysis.length}/2 справ
                  </span>
                </div>

                {heistsAnalysis.length === 0 ? (
                  <div className="text-xs text-slate-500 italic p-4 text-center">
                    Немає активних пограбувань. Отримані маркери можна розмістити у додаткових завданнях планшета (під номерами 2 і 12).
                  </div>
                ) : (
                  <div className="space-y-2">
                    {heistsAnalysis.map(({ heist, remainingNeeded, totalNeeded }) => {
                      const willBeHelpedByChoice = remainingNeeded[fixerChoice] > 0;

                      return (
                        <div
                          key={`fixer_heist_${heist.id}`}
                          className={`p-2.5 rounded-xl border transition-all ${
                            willBeHelpedByChoice
                              ? 'bg-amber-950/20 border-amber-500/60 ring-1 ring-amber-500/30'
                              : 'bg-slate-800/80 border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="font-bold text-xs text-slate-200 truncate">
                                {heist.title}
                              </span>
                              <span className="text-[10px] text-slate-400 truncate">
                                ({heist.location})
                              </span>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <span className="text-xs font-black text-amber-300">
                                +{heist.vp} ПО
                              </span>
                              <span className="text-xs">
                                {getNecklaceJewel(heist.trophy)}
                              </span>
                            </div>
                          </div>

                          {/* Requirements with status */}
                          <div className="flex flex-wrap gap-1.5 items-center">
                            {heist.requirements.map((req, idx) => {
                              const alreadyPlacedCount = (heist.placedMarkers || []).filter(s => s === req).length;
                              // Count how many of this req were placed before this index
                              const priorSameReqCount = heist.requirements.slice(0, idx).filter(s => s === req).length;
                              const isPlaced = priorSameReqCount < alreadyPlacedCount;
                              const isMissingThisType = !isPlaced;
                              const matchesCurrentChoice = isMissingThisType && req === fixerChoice;

                              return (
                                <span
                                  key={`req_${heist.id}_${idx}`}
                                  className={`px-2 py-0.5 rounded-lg text-[11px] font-bold flex items-center gap-1 border transition-all ${
                                    isPlaced
                                      ? 'bg-emerald-950/60 border-emerald-600 text-emerald-300'
                                      : matchesCurrentChoice
                                      ? 'bg-amber-500 text-slate-950 border-white ring-2 ring-amber-400 font-black animate-pulse'
                                      : 'bg-slate-900 border-slate-700 text-slate-400 border-dashed'
                                  }`}
                                  title={
                                    isPlaced
                                      ? 'Вже викладено'
                                      : matchesCurrentChoice
                                      ? 'Буде закрито цим вибором!'
                                      : 'Ще потрібно викласти'
                                  }
                                >
                                  <span>{getSymbolIcon(req)}</span>
                                  <span>
                                    {isPlaced
                                      ? '✓'
                                      : matchesCurrentChoice
                                      ? '✨ Буде закрито'
                                      : 'треба'}
                                  </span>
                                </span>
                              );
                            })}
                          </div>

                          {/* Summary sub-note for this heist */}
                          <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5 pt-1 border-t border-slate-700/60">
                            <span>
                              {totalNeeded === 0
                                ? '🎉 Справа повністю готова до завершення!'
                                : `Залишилось закрити: ${totalNeeded} маркер(ів)`}
                            </span>
                            {willBeHelpedByChoice && (
                              <span className="text-amber-400 font-bold">
                                +{Math.min(gangSymbolsCount[fixerChoice].count, remainingNeeded[fixerChoice])} {getSymbolIcon(fixerChoice)}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Right Column: Gang Total Summary & Board Tasks Balance */}
              <div className="bg-slate-850/90 border border-slate-750 rounded-2xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-750">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-slate-200">
                    <span>⚖️</span>
                    <span>Свірка наявності та завдань планшета</span>
                  </div>
                  <span className="text-[11px] text-amber-400 font-semibold">
                    Разом у банді
                  </span>
                </div>

                {/* Detailed comparison rows for all 3 symbols */}
                <div className="space-y-1.5 text-xs">
                  <div
                    onClick={() => setFixerChoice('mask')}
                    className={`p-2 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      fixerChoice === 'mask'
                        ? 'bg-purple-950/40 border-purple-400 ring-1 ring-purple-400/60'
                        : 'bg-slate-800/60 border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🎭</span>
                      <div>
                        <div className="font-bold text-slate-200">Маска</div>
                        <div className="text-[10px] text-slate-400">
                          {gangSymbolsCount.mask.slots.length > 0
                            ? `Слоти: ${gangSymbolsCount.mask.slots.map(s => `#${s}`).join(', ')}`
                            : 'Немає на слотах 3–12'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right text-[11px]">
                      <div className="font-black text-amber-300">В банді: +{gangSymbolsCount.mask.count}</div>
                      <div className="text-slate-400">Треба в справах: {totalNeededForActiveHeists.mask}</div>
                    </div>
                  </div>

                  <div
                    onClick={() => setFixerChoice('glove')}
                    className={`p-2 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      fixerChoice === 'glove'
                        ? 'bg-amber-950/40 border-amber-400 ring-1 ring-amber-400/60'
                        : 'bg-slate-800/60 border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🧤</span>
                      <div>
                        <div className="font-bold text-slate-200">Рукавичка</div>
                        <div className="text-[10px] text-slate-400">
                          {gangSymbolsCount.glove.slots.length > 0
                            ? `Слоти: ${gangSymbolsCount.glove.slots.map(s => `#${s}`).join(', ')}`
                            : 'Немає на слотах 3–12'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right text-[11px]">
                      <div className="font-black text-amber-300">В банді: +{gangSymbolsCount.glove.count}</div>
                      <div className="text-slate-400">Треба в справах: {totalNeededForActiveHeists.glove}</div>
                    </div>
                  </div>

                  <div
                    onClick={() => setFixerChoice('lock')}
                    className={`p-2 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      fixerChoice === 'lock'
                        ? 'bg-blue-950/40 border-blue-400 ring-1 ring-blue-400/60'
                        : 'bg-slate-800/60 border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🔒</span>
                      <div>
                        <div className="font-bold text-slate-200">Відмичка</div>
                        <div className="text-[10px] text-slate-400">
                          {gangSymbolsCount.lock.slots.length > 0
                            ? `Слоти: ${gangSymbolsCount.lock.slots.map(s => `#${s}`).join(', ')}`
                            : 'Немає на слотах 3–12'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right text-[11px]">
                      <div className="font-black text-amber-300">В банді: +{gangSymbolsCount.lock.count}</div>
                      <div className="text-slate-400">Треба в справах: {totalNeededForActiveHeists.lock}</div>
                    </div>
                  </div>
                </div>

                {/* Board Under-Slot Tasks (Overflow targets) */}
                <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-750 text-[11px] space-y-1">
                  <div className="text-slate-400 font-semibold flex items-center justify-between">
                    <span>📌 Додаткові завдання планшета:</span>
                    <span className="text-slate-500">(для надлишку маркерів)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 text-[10px] text-slate-300 pt-0.5">
                    <div className="p-1 rounded bg-slate-800/80 border border-slate-700 flex items-center justify-between">
                      <span>🎭 Маски (під #2):</span>
                      <span className="font-bold text-amber-300">{player.tasks?.underTwo?.masksCount || 0}/2 → ⭐</span>
                    </div>
                    <div className="p-1 rounded bg-slate-800/80 border border-slate-700 flex items-center justify-between">
                      <span>🧤 Рукавички (під #2):</span>
                      <span className="font-bold text-amber-300">{player.tasks?.underTwo?.glovesCount || 0}/2 → $2</span>
                    </div>
                    <div className="p-1 rounded bg-slate-800/80 border border-slate-700 flex items-center justify-between col-span-2">
                      <span>🔒 Відмички (під #12):</span>
                      <span className="font-bold text-amber-300">{player.tasks?.underTwelve?.locksCount || 0}/2 → 🏎️ +1 авто</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Action Footer */}
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <div className="text-xs text-slate-300 bg-slate-850 p-2.5 rounded-xl border border-slate-750 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getSymbolIcon(fixerChoice)}</span>
                  <span>
                    Вибір: <strong className="text-amber-300">{getSymbolLabel(fixerChoice)}</strong>.
                    Ви отримаєте <strong className="text-white">+{gangSymbolsCount[fixerChoice].count} маркерів</strong>.
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">
                  {totalNeededForActiveHeists[fixerChoice] > 0
                    ? `Покриє ${Math.min(gangSymbolsCount[fixerChoice].count, totalNeededForActiveHeists[fixerChoice])} із ${totalNeededForActiveHeists[fixerChoice]} потрібних для справ`
                    : 'Маркери можна буде покласти у завдання планшета'}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-2.5">
                {onCloseFixerModal && (
                  <button
                    type="button"
                    onClick={onCloseFixerModal}
                    className="w-full sm:w-1/3 py-3 rounded-2xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white font-bold text-xs border border-slate-700 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Eye className="w-4 h-4 text-amber-400" />
                    <span>Оглянути стіл</span>
                  </button>
                )}

                <button
                  id="btn-confirm-fixer"
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    if (onActivateFixer) onActivateFixer(fixerChoice);
                  }}
                  className={`py-3 rounded-2xl font-black text-sm shadow-xl transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2 ${
                    onCloseFixerModal ? 'w-full sm:w-2/3' : 'w-full'
                  } ${
                    gangSymbolsCount[fixerChoice].count > 0
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950'
                      : 'bg-slate-800 hover:bg-slate-750 text-slate-400 border border-slate-700'
                  }`}
                >
                  <span>Підтвердити вибір:</span>
                  <span>{getSymbolIcon(fixerChoice)}</span>
                  <span>{getSymbolLabel(fixerChoice)}</span>
                  <span className="px-2 py-0.5 rounded-lg bg-black/30 text-amber-200 text-xs font-black">
                    +{gangSymbolsCount[fixerChoice].count} шт.
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

