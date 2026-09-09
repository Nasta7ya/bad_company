import React from 'react';
import { HeistCard, MissionTrophy, PlayerState, ResourceSymbol } from '../types/game';
import { sound } from '../utils/audio';
import { VPIcon } from './VPIcon';
import { Sparkles, Trophy, Check, Plus, HelpCircle, MapPin, Gift } from 'lucide-react';

interface HeistMarketProps {
  player: PlayerState;
  marketHeists: HeistCard[];
  onUseWildMarker?: (heistId: string, targetSymbol: ResourceSymbol) => void;
  onOpenHeistPicker?: () => void;
}

export const HeistMarket: React.FC<HeistMarketProps> = ({
  player,
  marketHeists,
  onUseWildMarker,
  onOpenHeistPicker,
}) => {
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
    <div id="heist-area-container" className="bg-slate-900/95 border-2 border-slate-750 rounded-3xl p-4 sm:p-5 shadow-2xl text-white">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-xl shadow-lg border border-emerald-300">
            🎯
          </div>
          <div>
            <h3 className="font-black text-lg text-slate-100 flex items-center gap-2">
              <span>Справи та пограбування (Heists)</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-amber-300 font-bold">
                Виконано: {player.completedHeists.length}/6
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Викладайте рукавички, маски, відмички й ліхтарики на активні справи. Після виконання ви самі обираєте наступну!
            </p>
          </div>
        </div>

        {player.wildMarkers > 0 && (
          <div className="px-3.5 py-1.5 rounded-xl bg-purple-950/90 border border-purple-400 text-purple-200 text-xs font-black flex items-center gap-2 shadow-lg animate-pulse">
            <Sparkles className="w-4 h-4 text-purple-300" />
            <span>У вас {player.wildMarkers} джокерів (натисніть + на слоті інструмента)</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Active Heists of the Player (up to 2) */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block shadow-sm" />
              <span>Ваші активні справи (максимум 2):</span>
            </h4>
            <span className="text-[11px] text-slate-400">
              {player.activeHeists.length}/2 в роботі
            </span>
          </div>

          {player.activeHeists.length === 0 ? (
            <div className="text-xs text-slate-400 p-6 rounded-2xl bg-slate-850/60 border-2 border-dashed border-amber-500/40 text-center flex flex-col items-center gap-3">
              <span className="font-semibold text-slate-300">Зараз немає активних справ.</span>
              {onOpenHeistPicker && (
                <button
                  type="button"
                  onClick={onOpenHeistPicker}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg cursor-pointer transition-all hover:scale-105"
                >
                  <Plus className="w-4 h-4" />
                  <span>Обрати нове пограбування з вітрини</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {player.activeHeists.map(heist => {
                const totalReq = heist.requirements.length;
                const placedCount = heist.placedMarkers.length;
                const progressPct = Math.round((placedCount / totalReq) * 100);

                // Group requirements into placed vs needed
                const placedCounter: Record<string, number> = {};
                for (const m of heist.placedMarkers) {
                  placedCounter[m] = (placedCounter[m] || 0) + 1;
                }

                return (
                  <div
                    key={`active_heist_${heist.id}`}
                    id={`active-heist-${heist.id}`}
                    className="rounded-2xl border-2 border-slate-700 bg-slate-850 p-3.5 shadow-xl flex flex-col justify-between relative overflow-hidden group hover:border-amber-400/70 transition-all"
                  >
                    {/* Top Trophy Badge & VP Icon */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2.5 py-1 rounded-full bg-slate-950 border border-slate-700 text-xs font-black flex items-center gap-1.5 text-slate-200 shadow-sm" title={`Трофей: ${getTrophyName(heist.trophy)}`}>
                        <span className="text-sm">{getTrophyIcon(heist.trophy)}</span>
                        <span>{getTrophyName(heist.trophy)}</span>
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

                    {/* Requirement slots */}
                    <div className="space-y-1.5 my-2">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Інструменти ({placedCount}/{totalReq}):
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {heist.requirements.map((req, rIdx) => {
                          const isFilled = (placedCounter[req] || 0) > 0;
                          if (isFilled) placedCounter[req] -= 1;

                          return (
                            <div
                              key={`req_${rIdx}`}
                              className={`px-2 py-1 rounded-xl border text-xs flex items-center gap-1.5 transition-all ${
                                isFilled
                                  ? 'bg-emerald-950/70 border-emerald-400 text-emerald-300 font-bold shadow-sm'
                                  : 'bg-slate-950 border-slate-750 text-slate-300'
                              }`}
                            >
                              <span className="text-sm">{getSymbolIcon(req)}</span>
                              {isFilled ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
                              ) : player.wildMarkers > 0 && onUseWildMarker ? (
                                <button
                                  type="button"
                                  title="Використати джокер сюди"
                                  onClick={() => {
                                    sound.playClick();
                                    onUseWildMarker(heist.id, req);
                                  }}
                                  className="w-4 h-4 rounded-full bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center text-[10px] font-bold cursor-pointer transition-transform hover:scale-110 shadow"
                                >
                                  +
                                </button>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden my-2 border border-slate-800">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-300"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>

                    {/* Bonus reward */}
                    {heist.bonus && (
                      <div className="text-[11px] text-amber-300/95 font-medium bg-amber-950/30 p-2 rounded-xl border border-amber-500/20 flex items-center gap-1.5">
                        <Gift className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>Нагорода: {heist.bonus.description}</span>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* If player has fewer than 2 active heists, show clickable empty slot card */}
              {player.activeHeists.length < 2 && (
                <div
                  onClick={() => onOpenHeistPicker && onOpenHeistPicker()}
                  className={`rounded-2xl border-2 border-dashed border-amber-500/60 bg-amber-500/5 hover:bg-amber-500/10 p-4 flex flex-col items-center justify-center text-center transition-all ${
                    onOpenHeistPicker ? 'cursor-pointer hover:scale-[1.02]' : ''
                  } group min-h-[140px]`}
                >
                  <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-xl mb-2 group-hover:rotate-90 transition-transform">
                    <Plus className="w-5 h-5" />
                  </div>
                  <div className="text-xs font-black text-amber-300">
                    Вільний слот для пограбування ({player.activeHeists.length}/2)
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 max-w-[180px]">
                    Натисніть, щоб обрати нову справу з вітрини міста
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* City Market Heists (4 available face up) */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block shadow-sm" />
              <span>Справи на вітрині міста (4 карти):</span>
            </h4>
            <span className="text-[11px] text-slate-400">
              Обираються після завершення справи
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 gap-3">
            {marketHeists.slice(0, 4).map(heist => (
              <div
                key={`market_${heist.id}`}
                id={`market-heist-${heist.id}`}
                className="rounded-2xl border border-slate-750 bg-slate-850/80 p-3 shadow-md flex flex-col justify-between hover:border-slate-600 transition-colors"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="px-2 py-0.5 rounded-full bg-slate-950 border border-slate-800 text-[11px] font-bold flex items-center gap-1 text-slate-200">
                    <span>{getTrophyIcon(heist.trophy)}</span>
                    <span>{getTrophyName(heist.trophy)}</span>
                  </span>

                  <VPIcon points={heist.vp} size="sm" />
                </div>

                <div className="font-bold text-xs text-slate-200 leading-tight mb-1 truncate" title={heist.title}>
                  {heist.title}
                </div>
                <div className="text-[10px] text-slate-400 truncate mb-2">
                  {heist.location}
                </div>

                <div className="pt-2 border-t border-slate-800 flex flex-wrap gap-1">
                  {heist.requirements.map((req, rIdx) => (
                    <span
                      key={`m_req_${rIdx}`}
                      className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-[10px] flex items-center gap-0.5 text-slate-300"
                      title={getSymbolLabel(req)}
                    >
                      {getSymbolIcon(req)}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
