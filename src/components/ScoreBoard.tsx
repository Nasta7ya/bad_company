import React from 'react';
import { GameState, PlayerState } from '../types/game';
import { sound } from '../utils/audio';
import { Trophy, Coins, UserPlus, FastForward, HelpCircle, Volume2, VolumeX, ShieldAlert } from 'lucide-react';
import { getRecruitCost } from '../utils/gameLogic';

interface ScoreBoardProps {
  gameState: GameState;
  currentPlayerId: string;
  onOpenRecruit: () => void;
  onEndTurn: () => void;
  onOpenRules: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const ScoreBoard: React.FC<ScoreBoardProps> = ({
  gameState,
  currentPlayerId,
  onOpenRecruit,
  onEndTurn,
  onOpenRules,
  isMuted,
  onToggleMute,
}) => {
  const { players, round, bossPlayerIndex, phase } = gameState;
  const boss = players[bossPlayerIndex];
  const currentPlayer = players.find(p => p.id === currentPlayerId) || players[0];
  const isBoss = boss.id === currentPlayerId;

  const recruitCost = getRecruitCost(currentPlayer.recruiterStep);
  const canAffordRecruit = currentPlayer.coins >= recruitCost;

  const getPlayerBorder = (color: string) => {
    switch (color) {
      case 'red': return 'border-red-500/60 bg-red-950/20';
      case 'blue': return 'border-blue-500/60 bg-blue-950/20';
      case 'yellow': return 'border-yellow-500/60 bg-yellow-950/20';
      case 'green': return 'border-emerald-500/60 bg-emerald-950/20';
      default: return 'border-purple-500/60 bg-purple-950/20';
    }
  };

  return (
    <div id="scoreboard-container" className="bg-slate-900 border border-slate-700/80 rounded-2xl p-4 shadow-xl text-white">
      {/* Top action bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400 flex items-center justify-center font-black text-amber-300">
            R{round}
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
              <span>Раунд {round}</span>
              <span className="text-xs font-normal text-slate-400">
                (Бос: <strong className="text-amber-300">{boss.name}</strong>)
              </span>
            </h2>
            <div className="text-[11px] text-slate-400 capitalize">
              Фаза: <span className="font-semibold text-amber-400">
                {phase === 'rolling' && 'Кидок кубиків'}
                {phase === 'pairing' && 'Вибір пар кубиків'}
                {phase === 'activating' && 'Активація банди'}
                {phase === 'recruiting' && 'Вербування / Завершення ходу'}
                {phase === 'game_over' && 'Гру завершено'}
              </span>
            </div>
          </div>
        </div>

        {/* Global buttons */}
        <div className="flex items-center gap-1.5">
          {/* Recruit button */}
          <button
            id="btn-open-recruit"
            type="button"
            onClick={() => {
              sound.playClick();
              onOpenRecruit();
            }}
            disabled={!canAffordRecruit}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 shadow flex items-center gap-1.5 transition-transform active:scale-95 cursor-pointer"
            title={canAffordRecruit ? `Завербувати оновлення за $${recruitCost}` : `Не вистачає монет ($${recruitCost})`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Вербувати (${recruitCost})</span>
          </button>

          {/* End Boss Turn button */}
          {phase === 'recruiting' && isBoss && (
            <button
              id="btn-end-turn"
              type="button"
              onClick={() => {
                sound.playClick();
                onEndTurn();
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow flex items-center gap-1.5 transition-transform active:scale-95 cursor-pointer animate-pulse"
            >
              <FastForward className="w-3.5 h-3.5" />
              <span>Завершити хід Боса</span>
            </button>
          )}

          {/* Rules modal */}
          <button
            id="btn-open-rules"
            type="button"
            onClick={() => {
              sound.playClick();
              onOpenRules();
            }}
            className="p-1.5 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
            title="Правила гри"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {/* Sound toggle */}
          <button
            id="btn-toggle-sound"
            type="button"
            onClick={onToggleMute}
            className="p-1.5 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
            title={isMuted ? 'Увімкнути звук' : 'Вимкнути звук'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>
      </div>

      {/* Players status cards - responsive grid with horizontal scrolling support */}
      <div className="overflow-x-auto pb-1.5 -mx-1 px-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 min-w-[280px]">
        {players.map((p, idx) => {
          const isPlayerBoss = idx === bossPlayerIndex;
          const isSelf = p.id === currentPlayerId;

          return (
            <div
              key={`p_card_${p.id}`}
              id={`player-card-${p.id}`}
              className={`rounded-xl border p-2.5 flex flex-col justify-between transition-all ${
                isPlayerBoss
                  ? 'border-amber-400 bg-amber-950/30 ring-2 ring-amber-400/90 shadow-[0_0_15px_rgba(251,191,36,0.3)]'
                  : 'border-slate-800 bg-slate-900/60 opacity-85'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs text-slate-100 flex items-center gap-1">
                    {p.name}
                    {p.isBot && <span className="text-[10px] text-slate-400">(Бот)</span>}
                    {isSelf && <span className="text-[9px] px-1 rounded bg-amber-500 text-slate-950 font-bold">Ви</span>}
                  </span>
                </div>

                {isPlayerBoss && (
                  <span className="px-1.5 py-0.5 rounded bg-amber-500/30 border border-amber-400 text-[10px] text-amber-300 font-bold flex items-center gap-1">
                    👑 Бос
                  </span>
                )}
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-1 my-1 text-center">
                <div className="bg-slate-950/60 p-1 rounded border border-slate-800">
                  <div className="text-[9px] text-slate-400 font-medium">Очки (ПО)</div>
                  <div className="text-xs font-black text-amber-300">{p.score}</div>
                </div>

                <div className="bg-slate-950/60 p-1 rounded border border-slate-800">
                  <div className="text-[9px] text-slate-400 font-medium">Монети</div>
                  <div className="text-xs font-black text-emerald-300">${p.coins}</div>
                </div>

                <div className="bg-slate-950/60 p-1 rounded border border-slate-800">
                  <div className="text-[9px] text-slate-400 font-medium">Справи</div>
                  <div className="text-xs font-black text-purple-300">{p.completedHeists.length}/6</div>
                </div>
              </div>

              {/* Position and recruiter step */}
              <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1 pt-1 border-t border-slate-800/80">
                <span>Авто: {p.carPosition}</span>
                <span>Вербування: {p.recruiterStep}/8</span>
                <span>Здобич: {p.lootCards.filter(c => !c.isUsed).length}</span>
              </div>
            </div>
          );
        })}
        </div>
      </div>
    </div>
  );
};
