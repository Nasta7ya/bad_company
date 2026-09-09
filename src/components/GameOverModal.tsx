import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { GameState } from '../types/game';
import { sound } from '../utils/audio';
import { Trophy, Award, RefreshCw, Crown, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface GameOverModalProps {
  gameState: GameState;
  onRestart: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({ gameState, onRestart }) => {
  const { players, finalRankings, policeCarPosition } = gameState;

  useEffect(() => {
    sound.playVictory();
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {
      // Ignore if canvas-confetti fails
    }
  }, []);

  // Sort players by score descending
  const sortedPlayers = [...players].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return b.coins - a.coins;
  });

  const winner = sortedPlayers[0];

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-amber-500/80 rounded-3xl p-6 max-w-xl w-full shadow-2xl text-white space-y-5 text-center">
        {/* Winner Banner */}
        <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-3xl mx-auto shadow-lg shadow-amber-500/20">
          🏆
        </div>

        <div>
          <h2 className="text-2xl font-black text-amber-300">
            Переможець: {winner.name}!
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Пограбування століття завершено! Найбільший авторитет злочинного світу визначено.
          </p>
        </div>

        {/* Players Standings */}
        <div className="space-y-2.5 text-left">
          {sortedPlayers.map((p, rank) => {
            const isBehind = p.carPosition < policeCarPosition;

            return (
              <div
                key={p.id}
                className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
                  rank === 0
                    ? 'bg-amber-950/40 border-amber-400 ring-2 ring-amber-400/50 shadow-md'
                    : 'bg-slate-800/80 border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm ${
                    rank === 0 ? 'bg-amber-400 text-slate-950' : 'bg-slate-700 text-slate-300'
                  }`}>
                    {rank + 1}
                  </div>

                  <div>
                    <div className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
                      <span>{p.name}</span>
                      {rank === 0 && <Crown className="w-4 h-4 text-amber-400" />}
                      {p.isBot && <span className="text-[10px] text-slate-400">(Бот)</span>}
                    </div>

                    <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                      <span>Справ: {p.completedHeists.length}</span>
                      <span>•</span>
                      <span>Монети: ${p.coins}</span>
                      <span>•</span>
                      {isBehind ? (
                        <span className="text-red-400 flex items-center gap-0.5">
                          <AlertTriangle className="w-3 h-3" /> Штраф поліції (-3)
                        </span>
                      ) : (
                        <span className="text-emerald-400">Уникнув поліції ✓</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-lg font-black text-amber-300">
                    {p.score} ПО
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Авто на {p.carPosition}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Button */}
        <button
          id="btn-play-again"
          type="button"
          onClick={() => {
            sound.playClick();
            onRestart();
          }}
          className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-base shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
        >
          <RefreshCw className="w-5 h-5" />
          <span>Грати знову</span>
        </button>
      </div>
    </div>
  );
};
