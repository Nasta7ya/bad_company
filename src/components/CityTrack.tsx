import React from 'react';
import { CHECKPOINTS, CITY_TRACK_LENGTH, RED_ZONE_START } from '../data/initialDeck';
import { PlayerState } from '../types/game';
import { ShieldAlert, Flag, Award, AlertTriangle, Flame } from 'lucide-react';

interface CityTrackProps {
  players: PlayerState[];
  policePosition: number;
  currentPlayerId: string;
}

export const CityTrack: React.FC<CityTrackProps> = ({
  players,
  policePosition,
  currentPlayerId,
}) => {
  const getPlayerColorClass = (color: string) => {
    switch (color) {
      case 'red': return 'bg-red-500 border-red-300 text-white';
      case 'blue': return 'bg-blue-500 border-blue-300 text-white';
      case 'yellow': return 'bg-yellow-400 border-yellow-200 text-slate-950';
      case 'green': return 'bg-emerald-500 border-emerald-300 text-white';
      default: return 'bg-purple-500 border-purple-300 text-white';
    }
  };

  const currentPlayer = players.find(p => p.id === currentPlayerId) || players[0];
  const isBehindPolice = currentPlayer.carPosition < policePosition;

  return (
    <div id="city-track-container" className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-4 shadow-xl text-white">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-xl">🏎️</span>
          <div>
            <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
              <span>Міський трек погоні</span>
              <span className="text-xs font-normal text-slate-400">(26 клітинок до порту)</span>
            </h3>
            <p className="text-xs text-slate-400">
              Тримайтеся попереду поліцейського авто! Відставання на фініші коштуватиме -3 ПО.
            </p>
          </div>
        </div>

        {/* Police status pill */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-950/80 border border-blue-500/40 text-blue-300 text-xs font-semibold">
            <ShieldAlert className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
            <span>Поліція: клітинка {policePosition}</span>
          </div>

          {isBehindPolice ? (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-950/80 border border-red-500/40 text-red-300 text-xs font-semibold animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Ви позаду (-3 ПО)</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-semibold">
              <span>Попереду погоні ✓</span>
            </div>
          )}
        </div>
      </div>

      {/* Road track ribbon */}
      <div className="relative overflow-x-auto pb-4 pt-2">
        <div className="flex items-center gap-1 min-w-[760px]">
          {Array.from({ length: CITY_TRACK_LENGTH }, (_, space) => {
            const isCheckpoint = !!CHECKPOINTS[space];
            const checkpointInfo = CHECKPOINTS[space];
            const isRedZone = space >= RED_ZONE_START;
            const isPoliceHere = policePosition === space;
            const playersHere = players.filter(p => p.carPosition === space);

            return (
              <div
                key={`track_space_${space}`}
                id={`track-space-${space}`}
                className={`relative flex-1 min-w-[28px] h-20 rounded-xl border flex flex-col justify-between p-1 transition-all ${
                  isRedZone
                    ? 'bg-red-950/40 border-red-500/60 text-red-200'
                    : isCheckpoint
                    ? 'bg-amber-950/40 border-amber-400 text-amber-200 shadow-md'
                    : space === 0
                    ? 'bg-blue-950/40 border-blue-400 text-blue-200'
                    : 'bg-slate-800/60 border-slate-700/80 text-slate-400'
                }`}
              >
                {/* Space number */}
                <div className="flex items-center justify-between text-[10px] font-bold">
                  <span>{space}</span>
                  {space === 0 && <span className="text-[9px] text-blue-400">СТАРТ</span>}
                  {isCheckpoint && <span className="text-[9px] text-amber-400 font-black">★</span>}
                  {space === CITY_TRACK_LENGTH - 1 && <Flag className="w-3 h-3 text-red-400" />}
                </div>

                {/* Checkpoint label popup preview */}
                {isCheckpoint && (
                  <div className="text-[8px] text-amber-300 font-semibold truncate leading-none text-center" title={checkpointInfo.bonusDesc}>
                    {checkpointInfo.coins ? `+$${checkpointInfo.coins}` : checkpointInfo.carSteps ? `+${checkpointInfo.carSteps}авто` : '🎁Здобич'}
                  </div>
                )}

                {/* Cars on this space */}
                <div className="flex flex-col items-center gap-1 my-auto">
                  {/* Police Car */}
                  {isPoliceHere && (
                    <div
                      className="w-6 h-6 rounded-full bg-black border-2 border-blue-400 flex items-center justify-center text-[10px] shadow-lg shadow-blue-500/50 animate-bounce"
                      title="Поліцейське авто"
                    >
                      🚓
                    </div>
                  )}

                  {/* Player Cars */}
                  <div className="flex flex-wrap items-center justify-center gap-0.5">
                    {playersHere.map(p => (
                      <div
                        key={`car_${p.id}`}
                        id={`player-car-${p.id}`}
                        className={`w-5 h-5 rounded-full border flex items-center justify-center text-[9px] font-black shadow-md ${getPlayerColorClass(p.color)}`}
                        title={`${p.name} (Позиція: ${space})`}
                      >
                        {p.name.charAt(0).toUpperCase()}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom zone indicator */}
                {isRedZone && space === RED_ZONE_START && (
                  <span className="text-[7px] text-red-400 font-black text-center truncate">ПОРТ</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend & Summary */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 pt-2 border-t border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
            <span>Чекпоінти (бонус лідеру: $2, здобич, авто)</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
            <span>Червона зона 22–25 (запуск фіналу)</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {players.map(p => (
            <div key={`legend_p_${p.id}`} className="flex items-center gap-1">
              <span className={`w-3 h-3 rounded-full border text-[8px] flex items-center justify-center font-bold ${getPlayerColorClass(p.color)}`}>
                {p.name.charAt(0)}
              </span>
              <span className="text-slate-300 font-medium">{p.name} ({p.carPosition})</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
