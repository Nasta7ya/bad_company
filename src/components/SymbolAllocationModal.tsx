import React, { useState } from 'react';
import { HeistCard, PlayerState, ResourceSymbol } from '../types/game';
import { sound } from '../utils/audio';
import { VPIcon } from './VPIcon';
import { Check, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';

interface SymbolAllocationModalProps {
  isOpen: boolean;
  player: PlayerState;
  pendingSymbols: ResourceSymbol[];
  onFinishAllocation: (
    updatedPlayer: PlayerState,
    completedHeists: HeistCard[],
    bonusLogs: string[]
  ) => void;
}

export const SymbolAllocationModal: React.FC<SymbolAllocationModalProps> = ({
  isOpen,
  player,
  pendingSymbols,
  onFinishAllocation,
}) => {
  if (!isOpen || pendingSymbols.length === 0) return null;

  // Local draft state of player during distribution
  const [workingPlayer, setWorkingPlayer] = useState<PlayerState>(() => JSON.parse(JSON.stringify(player)));
  const [remainingSymbols, setRemainingSymbols] = useState<ResourceSymbol[]>([...pendingSymbols]);
  const [historyLogs, setHistoryLogs] = useState<string[]>([]);

  // Current symbol being placed
  const currentSymbol = remainingSymbols[0];

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
      case 'wheel': return 'Кермо';
      case 'coin': return 'Монета';
    }
  };

  const getTrophyIcon = (t: string) => {
    switch (t) {
      case 'diamond': return '💎';
      case 'gold': return '🟡';
      case 'art': return '🖼️';
      case 'moneybag': return '💰';
      default: return '🏆';
    }
  };

  // Place current symbol onto a specific active heist
  const placeOnHeist = (heistId: string) => {
    sound.playClick();
    const updatedHeists = workingPlayer.activeHeists.map(h => {
      if (h.id === heistId) {
        return {
          ...h,
          placedMarkers: [...h.placedMarkers, currentSymbol],
        };
      }
      return h;
    });

    const nextSymbols = remainingSymbols.slice(1);
    const targetHeist = workingPlayer.activeHeists.find(h => h.id === heistId);
    const log = `Покладено ${getSymbolIcon(currentSymbol)} (${getSymbolLabel(currentSymbol)}) на справу «${targetHeist?.title}»`;

    const nextPlayer = {
      ...workingPlayer,
      activeHeists: updatedHeists,
    };

    setWorkingPlayer(nextPlayer);
    setRemainingSymbols(nextSymbols);
    setHistoryLogs(prev => [...prev, log]);

    if (nextSymbols.length === 0) {
      finalize(nextPlayer, [...historyLogs, log]);
    }
  };

  // Place current symbol onto gang board task under 2 or 12
  const placeOnTask = () => {
    sound.playClick();
    const nextPlayer = JSON.parse(JSON.stringify(workingPlayer)) as PlayerState;
    let log = '';

    if (currentSymbol === 'mask') {
      nextPlayer.tasks.underTwo.masksCount += 1;
      log = `Покладено 🎭 на трек під #2 (${nextPlayer.tasks.underTwo.masksCount}/2)`;
      if (nextPlayer.tasks.underTwo.masksCount >= 2) {
        nextPlayer.tasks.underTwo.masksCount = 0;
        nextPlayer.wildMarkers += 1;
        log += ' → Виконано! Отримано ⭐ 1 Джокер!';
        sound.playSuccess();
      }
    } else if (currentSymbol === 'glove') {
      nextPlayer.tasks.underTwo.glovesCount += 1;
      log = `Покладено 🧤 на трек під #2 (${nextPlayer.tasks.underTwo.glovesCount}/2)`;
      if (nextPlayer.tasks.underTwo.glovesCount >= 2) {
        nextPlayer.tasks.underTwo.glovesCount = 0;
        nextPlayer.coins += 2;
        log += ' → Виконано! Отримано 💰 +$2 готівки!';
        sound.playCoin();
      }
    } else if (currentSymbol === 'lock') {
      nextPlayer.tasks.underTwelve.locksCount += 1;
      log = `Покладено 🔒 на трек під #12 (${nextPlayer.tasks.underTwelve.locksCount}/2)`;
      if (nextPlayer.tasks.underTwelve.locksCount >= 2) {
        nextPlayer.tasks.underTwelve.locksCount = 0;
        nextPlayer.carPosition = Math.min(25, nextPlayer.carPosition + 1);
        log += ' → Виконано! Авто рухається +1 крок вперед!';
        sound.playCar();
      }
    } else if (currentSymbol === 'flashlight') {
      nextPlayer.tasks.underTwelve.flashlightsCount += 1;
      log = `Покладено 🔦 на трек під #12 (${nextPlayer.tasks.underTwelve.flashlightsCount}/2)`;
      if (nextPlayer.tasks.underTwelve.flashlightsCount >= 2) {
        nextPlayer.tasks.underTwelve.flashlightsCount = 0;
        log += ' → Виконано! Нагорода: 1 Карта Здобичі!';
        sound.playSuccess();
      }
    }

    const nextSymbols = remainingSymbols.slice(1);
    setWorkingPlayer(nextPlayer);
    setRemainingSymbols(nextSymbols);
    setHistoryLogs(prev => [...prev, log]);

    if (nextSymbols.length === 0) {
      finalize(nextPlayer, [...historyLogs, log]);
    }
  };

  // Auto allocate remaining symbols
  const handleAutoAllocate = () => {
    sound.playClick();
    let draft = JSON.parse(JSON.stringify(workingPlayer)) as PlayerState;
    const logs: string[] = [...historyLogs];

    for (const sym of remainingSymbols) {
      let placed = false;
      // Try heists first
      for (let i = 0; i < draft.activeHeists.length; i++) {
        const h = draft.activeHeists[i];
        const reqCount = h.requirements.filter(r => r === sym).length;
        const placedCount = h.placedMarkers.filter(r => r === sym).length;
        if (placedCount < reqCount) {
          draft.activeHeists[i].placedMarkers.push(sym);
          logs.push(`Авто: ${getSymbolIcon(sym)} → «${h.title}»`);
          placed = true;
          break;
        }
      }
      // If not, onto task
      if (!placed) {
        if (sym === 'mask') {
          draft.tasks.underTwo.masksCount += 1;
          if (draft.tasks.underTwo.masksCount >= 2) {
            draft.tasks.underTwo.masksCount = 0;
            draft.wildMarkers += 1;
          }
        } else if (sym === 'glove') {
          draft.tasks.underTwo.glovesCount += 1;
          if (draft.tasks.underTwo.glovesCount >= 2) {
            draft.tasks.underTwo.glovesCount = 0;
            draft.coins += 2;
          }
        } else if (sym === 'lock') {
          draft.tasks.underTwelve.locksCount += 1;
          if (draft.tasks.underTwelve.locksCount >= 2) {
            draft.tasks.underTwelve.locksCount = 0;
            draft.carPosition = Math.min(25, draft.carPosition + 1);
          }
        } else if (sym === 'flashlight') {
          draft.tasks.underTwelve.flashlightsCount += 1;
          if (draft.tasks.underTwelve.flashlightsCount >= 2) {
            draft.tasks.underTwelve.flashlightsCount = 0;
          }
        }
        logs.push(`Авто: ${getSymbolIcon(sym)} → завдання планшета`);
      }
    }

    finalize(draft, logs);
  };

  const finalize = (finalPlayer: PlayerState, logs: string[]) => {
    // Check if any heists completed
    const completedList: HeistCard[] = [];
    const remainingActive: HeistCard[] = [];
    let updatedScore = finalPlayer.score;
    let updatedCompletedHeists = [...finalPlayer.completedHeists];
    let updatedCoins = finalPlayer.coins;
    let updatedCarPos = finalPlayer.carPosition;
    let updatedWilds = finalPlayer.wildMarkers;

    for (const h of finalPlayer.activeHeists) {
      const isComplete = h.requirements.every(req => {
        const placed = h.placedMarkers.filter(s => s === req).length;
        const required = h.requirements.filter(s => s === req).length;
        return placed >= required;
      });

      if (isComplete) {
        completedList.push(h);
        updatedScore += h.vp;
        updatedCompletedHeists.push(h);
        if (h.bonus) {
          if (h.bonus.coins) updatedCoins += h.bonus.coins;
          if (h.bonus.carSteps) updatedCarPos = Math.min(25, updatedCarPos + h.bonus.carSteps);
          if (h.bonus.wildMarker) updatedWilds += h.bonus.wildMarker;
        }
        logs.push(`💥 Успішно здійснено «${h.title}»! (+${h.vp} ПО, трофей: ${h.trophy})`);
        sound.playVictory();
      } else {
        remainingActive.push(h);
      }
    }

    const updatedPlayerWithRemainingHeists: PlayerState = {
      ...finalPlayer,
      score: updatedScore,
      completedHeists: updatedCompletedHeists,
      coins: updatedCoins,
      carPosition: updatedCarPos,
      wildMarkers: updatedWilds,
      activeHeists: remainingActive,
    };

    onFinishAllocation(updatedPlayerWithRemainingHeists, completedList, logs);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border-2 border-amber-500/80 rounded-3xl p-6 max-w-2xl w-full shadow-2xl text-white space-y-4 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-2xl shadow-inner">
              {getSymbolIcon(currentSymbol)}
            </div>
            <div>
              <h3 className="font-black text-lg text-slate-100 flex items-center gap-2">
                <span>Розподіліть отриманий символ:</span>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 text-xs font-black uppercase">
                  {getSymbolLabel(currentSymbol)}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Залишилось розподілити: {remainingSymbols.length} символів ({remainingSymbols.map(s => getSymbolIcon(s)).join(' ')})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleAutoAllocate}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-300 font-semibold cursor-pointer transition-colors"
          >
            ⚡ Авто-розподіл
          </button>
        </div>

        {/* Options to place currentSymbol */}
        <div className="space-y-3">
          <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Куди ви хочете покласти {getSymbolIcon(currentSymbol)} {getSymbolLabel(currentSymbol)}?
          </div>

          {/* Active Heists Candidates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {workingPlayer.activeHeists.map((heist, idx) => {
              const reqCount = heist.requirements.filter(r => r === currentSymbol).length;
              const placedCount = heist.placedMarkers.filter(r => r === currentSymbol).length;
              const needed = Math.max(0, reqCount - placedCount);
              const isRelevant = reqCount > 0;
              const isFullyPlacedForSymbol = needed === 0;

              return (
                <div
                  key={`alloc_heist_${heist.id}`}
                  className={`rounded-2xl border p-3 flex flex-col justify-between relative transition-all ${
                    needed > 0
                      ? 'bg-slate-800/90 border-amber-400/80 shadow-lg ring-1 ring-amber-400/40'
                      : 'bg-slate-900/60 border-slate-800 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-1">
                      <span>{getTrophyIcon(heist.trophy)}</span>
                      <span>Справа #{idx + 1}</span>
                    </span>
                    <VPIcon points={heist.vp} size="sm" />
                  </div>

                  <div className="font-black text-sm text-slate-100 leading-tight mb-1">
                    {heist.title}
                  </div>
                  <div className="text-[11px] text-slate-400 mb-2">
                    {heist.location}
                  </div>

                  {/* Requirements progress */}
                  <div className="space-y-1 mb-3">
                    <div className="text-[10px] text-slate-400 font-semibold">Необхідні інструменти:</div>
                    <div className="flex flex-wrap gap-1">
                      {heist.requirements.map((req, rIdx) => {
                        // Check if placed
                        const totalReqSoFar = heist.requirements.slice(0, rIdx + 1).filter(r => r === req).length;
                        const totalPlaced = heist.placedMarkers.filter(r => r === req).length;
                        const isPlaced = totalPlaced >= totalReqSoFar;

                        return (
                          <span
                            key={`req_preview_${rIdx}`}
                            className={`px-2 py-0.5 rounded-lg border text-xs flex items-center gap-1 ${
                              isPlaced
                                ? 'bg-emerald-950/70 border-emerald-500 text-emerald-300 font-bold'
                                : req === currentSymbol
                                ? 'bg-amber-950/80 border-amber-400 text-amber-300 font-bold animate-pulse'
                                : 'bg-slate-950 border-slate-800 text-slate-400'
                            }`}
                          >
                            <span>{getSymbolIcon(req)}</span>
                            {isPlaced && <Check className="w-3 h-3 text-emerald-400" />}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* Place button */}
                  <button
                    type="button"
                    disabled={needed === 0}
                    onClick={() => placeOnHeist(heist.id)}
                    className={`w-full py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      needed > 0
                        ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md active:scale-95'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <span>Покласти сюди</span>
                    {needed > 0 ? (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-950/30">
                        (потрібно ще {needed})
                      </span>
                    ) : (
                      <span className="text-[10px]">(вже заповнено)</span>
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Special Task Board Option under 2 or 12 */}
          <div className="bg-slate-850 border border-slate-700/80 rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-purple-400" />
                <span>Спеціальне завдання планшета:</span>
              </span>
            </div>

            {currentSymbol === 'mask' && (
              <div className="flex items-center justify-between bg-slate-900/80 p-2.5 rounded-xl border border-purple-500/40">
                <div>
                  <div className="text-xs font-bold text-purple-300">
                    Трек під #2: 2× 🎭 Маски → ⭐ 1 Універсальний Джокер
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Зараз заповнено: {workingPlayer.tasks.underTwo.masksCount}/2
                  </div>
                </div>
                <button
                  type="button"
                  onClick={placeOnTask}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md cursor-pointer transition-transform active:scale-95"
                >
                  Покласти 🎭 на завдання
                </button>
              </div>
            )}

            {currentSymbol === 'glove' && (
              <div className="flex items-center justify-between bg-slate-900/80 p-2.5 rounded-xl border border-amber-500/40">
                <div>
                  <div className="text-xs font-bold text-amber-300">
                    Трек під #2: 2× 🧤 Рукавички → 💰 +$2 Готівки
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Зараз заповнено: {workingPlayer.tasks.underTwo.glovesCount}/2
                  </div>
                </div>
                <button
                  type="button"
                  onClick={placeOnTask}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow-md cursor-pointer transition-transform active:scale-95"
                >
                  Покласти 🧤 на завдання
                </button>
              </div>
            )}

            {currentSymbol === 'lock' && (
              <div className="flex items-center justify-between bg-slate-900/80 p-2.5 rounded-xl border border-blue-500/40">
                <div>
                  <div className="text-xs font-bold text-blue-300">
                    Трек під #12: 2× 🔒 Відмички → 🏎️ +1 крок Авто від поліції
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Зараз заповнено: {workingPlayer.tasks.underTwelve.locksCount}/2
                  </div>
                </div>
                <button
                  type="button"
                  onClick={placeOnTask}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md cursor-pointer transition-transform active:scale-95"
                >
                  Покласти 🔒 на завдання
                </button>
              </div>
            )}

            {currentSymbol === 'flashlight' && (
              <div className="flex items-center justify-between bg-slate-900/80 p-2.5 rounded-xl border border-emerald-500/40">
                <div>
                  <div className="text-xs font-bold text-emerald-300">
                    Трек під #12: 2× 🔦 Ліхтарики → 🎁 1 Карта Здобичі
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Зараз заповнено: {workingPlayer.tasks.underTwelve.flashlightsCount}/2
                  </div>
                </div>
                <button
                  type="button"
                  onClick={placeOnTask}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md cursor-pointer transition-transform active:scale-95"
                >
                  Покласти 🔦 на завдання
                </button>
              </div>
            )}
          </div>
        </div>

        {/* History of allocations this step */}
        {historyLogs.length > 0 && (
          <div className="text-[11px] text-slate-400 bg-slate-950 p-2 rounded-xl border border-slate-800 space-y-0.5">
            <span className="text-slate-500 font-semibold">Розподілено:</span>
            {historyLogs.map((log, lIdx) => (
              <div key={`h_log_${lIdx}`} className="text-slate-300">
                • {log}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
