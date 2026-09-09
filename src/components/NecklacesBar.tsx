import React from 'react';
import { GameState, MissionTrophy } from '../types/game';
import { Crown, Sparkles, Award } from 'lucide-react';

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
    { key: 'diamond', name: 'Кольє «Діамант»', icon: '💎', borderColor: 'border-cyan-500/40', bgColor: 'bg-cyan-950/30' },
    { key: 'gold', name: 'Кольє «Золото»', icon: '🟡', borderColor: 'border-yellow-500/40', bgColor: 'bg-yellow-950/30' },
    { key: 'art', name: 'Кольє «Картина»', icon: '🖼️', borderColor: 'border-purple-500/40', bgColor: 'bg-purple-950/30' },
    { key: 'moneybag', name: 'Кольє «Мішок грошей»', icon: '💰', borderColor: 'border-emerald-500/40', bgColor: 'bg-emerald-950/30' },
  ];

  return (
    <div id="necklaces-bar" className="bg-slate-900/80 border border-slate-700/80 rounded-2xl p-3 shadow-md text-white">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2 pb-1.5 border-b border-slate-800">
        <div className="flex items-center gap-1.5">
          <Crown className="w-4 h-4 text-amber-400" />
          <span className="font-bold text-xs tracking-wide text-slate-200">
            4 Королівські Кольє (Більшість трофеїв):
          </span>
        </div>
        <span className="text-[11px] text-slate-400">
          +1 ПО одразу при отриманні, +1 ПО при активації грабіжника, +2 ПО у фіналі!
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {trophyConfigs.map(item => {
          const info = necklaces[item.key];
          const holder = info.holderPlayerId ? players.find(p => p.id === info.holderPlayerId) : null;

          return (
            <div
              key={`necklace_${item.key}`}
              id={`necklace-item-${item.key}`}
              className={`p-2 rounded-xl border flex items-center justify-between gap-2 ${item.bgColor} ${item.borderColor}`}
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">{item.icon}</span>
                <div>
                  <div className="text-[11px] font-bold text-slate-200 leading-tight">
                    {item.name}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {holder ? (
                      <span className="text-amber-350 font-semibold">
                        {holder.name} (на #{info.gangNumber})
                      </span>
                    ) : (
                      <span className="italic text-slate-500">Вільне (0)</span>
                    )}
                  </div>
                </div>
              </div>

              {holder && (
                <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-black text-[10px] shadow" title="Власник">
                  👑
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
