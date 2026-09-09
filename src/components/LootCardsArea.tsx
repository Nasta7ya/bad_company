import React from 'react';
import { LootCard, PlayerState } from '../types/game';
import { sound } from '../utils/audio';
import { Gift, Sparkles, Zap, Award } from 'lucide-react';

interface LootCardsAreaProps {
  player: PlayerState;
  onUseLootCard: (cardId: string) => void;
}

export const LootCardsArea: React.FC<LootCardsAreaProps> = ({ player, onUseLootCard }) => {
  const unusedLoot = player.lootCards.filter(c => !c.isUsed);

  if (unusedLoot.length === 0) return null;

  return (
    <div id="loot-cards-container" className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-3 shadow-md text-white">
      <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-800">
        <div className="flex items-center gap-1.5">
          <Gift className="w-4 h-4 text-emerald-400" />
          <h4 className="font-bold text-xs text-slate-200">
            Ваша здобич (Loot Cards):
          </h4>
        </div>
        <span className="text-[11px] text-slate-400">
          Карти зі штампом «Фінал» додають очки автоматично наприкінці гри.
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
        {unusedLoot.map(card => {
          const isInstant = card.type === 'instant';

          return (
            <div
              key={card.id}
              id={`loot-card-${card.id}`}
              className="p-2.5 rounded-xl border border-slate-700 bg-slate-800/80 shadow-sm flex flex-col justify-between text-xs"
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-100 truncate">{card.title}</span>
                  {card.vp ? (
                    <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-black text-[10px]">
                      +{card.vp} ПО
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[10px]">
                      Миттєва
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-300 leading-snug">{card.description}</p>
              </div>

              {isInstant && (
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    onUseLootCard(card.id);
                  }}
                  className="mt-2 w-full py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shadow transition-transform active:scale-95 flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Zap className="w-3 h-3" />
                  <span>Використати зараз</span>
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
