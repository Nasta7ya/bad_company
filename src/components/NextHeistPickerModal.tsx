import React from 'react';
import { HeistCard, MissionTrophy, ResourceSymbol } from '../types/game';
import { sound } from '../utils/audio';
import { VPIcon } from './VPIcon';
import { Check, HelpCircle, Sparkles, MapPin, X } from 'lucide-react';

interface NextHeistPickerModalProps {
  isOpen: boolean;
  completedHeist: HeistCard | null;
  marketHeists: HeistCard[];
  deckCount: number;
  onSelectHeist: (chosenHeist: HeistCard | null) => void;
  onSelectMysteryFromDeck: () => void;
  onClose?: () => void;
}

export const NextHeistPickerModal: React.FC<NextHeistPickerModalProps> = ({
  isOpen,
  completedHeist,
  marketHeists,
  deckCount,
  onSelectHeist,
  onSelectMysteryFromDeck,
  onClose,
}) => {
  if (!isOpen) return null;

  const handleDismiss = () => {
    sound.playClick();
    if (onClose) onClose();
    else onSelectHeist(null);
  };

  const getSymbolIcon = (sym: ResourceSymbol) => {
    switch (sym) {
      case 'mask': return '🎭';
      case 'glove': return '🧤';
      case 'lock': return '🔒';
      case 'flashlight': return '🔦';
      default: return '❓';
    }
  };

  const getSymbolLabel = (sym: ResourceSymbol) => {
    switch (sym) {
      case 'mask': return 'Маска';
      case 'glove': return 'Рукавичка';
      case 'lock': return 'Відмичка';
      case 'flashlight': return 'Ліхтарик';
      default: return '';
    }
  };

  const getTrophyIcon = (t: MissionTrophy) => {
    switch (t) {
      case 'diamond': return '💎';
      case 'gold': return '🟡';
      case 'art': return '🖼️';
      case 'moneybag': return '💰';
    }
  };

  const getTrophyName = (t: MissionTrophy) => {
    switch (t) {
      case 'diamond': return 'Діамант';
      case 'gold': return 'Золото';
      case 'art': return 'Картина';
      case 'moneybag': return 'Мішок грошей';
    }
  };

  return (
    <div
      id="next-heist-modal-backdrop"
      onClick={handleDismiss}
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto cursor-pointer"
    >
      <div
        onClick={e => e.stopPropagation()}
        className="bg-slate-900 border-2 border-emerald-500/80 rounded-3xl p-4 sm:p-6 max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl text-white space-y-4 cursor-default my-auto animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header with celebration of completed heist */}
        <div className="pb-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-2xl shadow-inner animate-bounce">
              💥
            </div>
            <div>
              <h3 className="font-black text-xl text-slate-100 flex items-center gap-2">
                <span>Справа виконана!</span>
                {completedHeist && (
                  <span className="text-emerald-400 text-sm font-semibold">
                    «{completedHeist.title}»
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-300">
                Ви отримали очка, трофей та бонус. Тепер <strong>самостійно оберіть</strong> наступне пограбування для вашої банди:
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {completedHeist && (
              <div className="flex items-center gap-2">
                <VPIcon points={completedHeist.vp} size="md" />
                <span className="px-2.5 py-1 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold flex items-center gap-1 text-slate-200">
                  <span>{getTrophyIcon(completedHeist.trophy)}</span>
                  <span>{getTrophyName(completedHeist.trophy)}</span>
                </span>
              </div>
            )}
            <button
              type="button"
              onClick={handleDismiss}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer border border-slate-700"
              title="Закрити або пропустити"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 4 Market Cards Options + Deck Option */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300 uppercase tracking-wider">
            <span>Доступні нові справи ({marketHeists.length} карт):</span>
            <span className="text-slate-400 font-normal">Оберіть 1 нову справу</span>
          </div>

          {marketHeists.length === 0 ? (
            <div className="p-6 rounded-2xl bg-slate-800/80 border border-slate-700 text-center space-y-3">
              <p className="text-amber-300 font-bold text-sm">Усі справи з колоди вичерпано!</p>
              <p className="text-slate-300 text-xs">
                У місті наразі немає доступних нових справ. Ви можете продовжити раунд без взяття нової справи.
              </p>
              <button
                type="button"
                onClick={handleDismiss}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs cursor-pointer shadow transition-transform active:scale-95"
              >
                Продовжити гру
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {marketHeists.map(heist => (
              <div
                key={`market_choice_${heist.id}`}
                id={`choose-heist-${heist.id}`}
                onClick={() => {
                  sound.playClick();
                  onSelectHeist(heist);
                }}
                className="rounded-2xl border border-slate-700 hover:border-amber-400 bg-slate-800/80 hover:bg-slate-800 p-3.5 shadow-lg cursor-pointer transition-all hover:scale-105 flex flex-col justify-between group relative"
              >
                {/* Top Trophy & VP */}
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-xs font-bold flex items-center gap-1 text-slate-200">
                    <span>{getTrophyIcon(heist.trophy)}</span>
                    <span className="text-[10px]">{getTrophyName(heist.trophy)}</span>
                  </span>

                  <VPIcon points={heist.vp} size="sm" />
                </div>

                {/* Title & Location */}
                <div className="mb-2">
                  <div className="font-black text-sm text-slate-100 group-hover:text-amber-300 transition-colors leading-tight">
                    {heist.title}
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-slate-500" />
                    <span>{heist.location}</span>
                  </div>
                </div>

                {/* Required tools */}
                <div className="space-y-1 mb-2">
                  <div className="text-[10px] text-slate-400 font-semibold">Потрібні символи:</div>
                  <div className="flex flex-wrap gap-1">
                    {heist.requirements.map((req, rIdx) => (
                      <span
                        key={`m_req_${rIdx}`}
                        className="px-1.5 py-0.5 rounded-lg bg-slate-950 border border-slate-700 text-xs flex items-center gap-1"
                        title={getSymbolLabel(req)}
                      >
                        <span>{getSymbolIcon(req)}</span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Bonus */}
                {heist.bonus && (
                  <div className="text-[10px] text-amber-300 font-medium mb-3 bg-amber-950/40 p-1.5 rounded-lg border border-amber-500/20">
                    🎁 {heist.bonus.description}
                  </div>
                )}

                {/* Select button */}
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    onSelectHeist(heist);
                  }}
                  className="w-full py-2 rounded-xl bg-amber-500 group-hover:bg-amber-400 text-slate-950 font-black text-xs shadow transition-transform active:scale-95 cursor-pointer flex items-center justify-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Взяти цю справу</span>
                </button>
              </div>
            ))}
            </div>
          )}
        </div>

        {/* Mystery deck choice */}
        {deckCount > 0 && (
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <div className="text-xs text-slate-400">
              Не підходить жодна справа з вітрини?
            </div>
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                onSelectMysteryFromDeck();
              }}
              className="px-4 py-2 rounded-xl bg-purple-900/60 hover:bg-purple-800 border border-purple-500 text-purple-200 text-xs font-bold transition-transform active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              <HelpCircle className="w-4 h-4 text-purple-400" />
              <span>Взяти таємну справу наосліп з колоди ({deckCount} карт)</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
