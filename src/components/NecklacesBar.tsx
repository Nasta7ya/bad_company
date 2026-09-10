import React from 'react';
import { GameState, MissionTrophy } from '../types/game';
import { Crown } from 'lucide-react';

interface NecklacesBarProps {
  necklaces: GameState['necklaces'];
  players: GameState['players'];
}

export const NecklacesBar: React.FC<NecklacesBarProps> = ({ necklaces, players }) => {
  const trophyConfigs: {
    key: MissionTrophy;
    name: string;
    icon: string;
    borderColor: string;
    bgColor: string;
  }[] = [
    { key: 'diamond', name: '«Діамант»', icon: '💎', borderColor: 'border-cyan-500/40', bgColor: 'bg-cyan-950/30' },
    { key: 'gold', name: '«Золото»', icon: '🟡', borderColor: 'border-yellow-500/40', bgColor: 'bg-yellow-950/30' },
    { key: 'art', name: '«Картина»', icon: '🖼️', borderColor: 'border-purple-500/40', bgColor: 'bg-purple-950/30' },
    { key: 'moneybag', name: '«Мішок»', icon: '💰', borderColor: 'border-emerald-500/40', bgColor: 'bg-emerald-950/30' },
  ];

  return (
    <div id="necklaces-bar" className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-3.5 shadow-md text-white h-full flex flex-col justify-between">
      <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-start justify-between gap-1 mb-2 pb-2 border-b border-slate-800">
        <div className="flex items-center gap-1.5">
          <Crown className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="font-bold text-xs tracking-wide text-slate-200">
            Королівські Кольє
          </span>
        </div>
        <span className="text-[10px] text-slate-400 leading-tight">
          +1 ПО одразу, +1 ПО на кубиках, +2 ПО у фіналі
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-1 gap-2 flex-1">
        {trophyConfigs.map(item => {
          const info = necklaces[item.key];
          const holder = info.holderPlayerId ? players.find(p => p.id === info.holderPlayerId) : null;

          return (
            <div
              key={`necklace_${item.key}`}
              id={`necklace-item-${item.key}`}
              className={`p-2 rounded-xl border flex items-center justify-between gap-2 min-w-0 transition-all ${item.bgColor} ${item.borderColor}`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-lg shrink-0">{item.icon}</span>
                <div className="min-w-0">
                  <div className="text-[11px] font-bold text-slate-200 truncate">
                    {item.name}
                  </div>
                  <div className="text-[10px] truncate">
                    {holder ? (
                      <span className="text-amber-300 font-semibold truncate block">
                        {holder.name} <span className="text-slate-400 font-normal">(#{info.gangNumber})</span>
                      </span>
                    ) : (
                      <span className="italic text-slate-500">Вільне (0)</span>
                    )}
                  </div>
                </div>
              </div>

              {holder ? (
                <span
                  className="w-5 h-5 shrink-0 rounded-full bg-amber-400/20 border border-amber-400/60 text-amber-300 flex items-center justify-center text-[10px] shadow"
                  title={`Власник: ${holder.name}`}
                >
                  👑
                </span>
              ) : (
                <span className="text-[9px] text-slate-600 font-bold px-1 py-0.5 rounded border border-slate-800 shrink-0">
                  —
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
