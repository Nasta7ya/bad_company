import React, { useState } from 'react';
import { DicePairing, GameState } from '../types/game';
import { sound } from '../utils/audio';
import { Dices, RefreshCw, CheckCircle2, ShieldAlert } from 'lucide-react';

interface DiceRollAreaProps {
  gameState: GameState;
  isBoss: boolean;
  currentPlayerId: string;
  onRoll: () => void;
  onReroll: (diceIndices: number[], rerollPolice: boolean) => void;
  onSetPairing: (pairing: { pairAIndices: [number, number]; pairBIndices: [number, number] }) => void;
  onChooseSum: (sum: number) => void;
}

export const DiceRollArea: React.FC<DiceRollAreaProps> = ({
  gameState,
  isBoss,
  currentPlayerId,
  onRoll,
  onReroll,
  onSetPairing,
  onChooseSum,
}) => {
  const { goldDice, policeDie, phase, hasRolled, bossPairs, players, bossPlayerIndex, playerActions } = gameState;
  const boss = players[bossPlayerIndex];
  const currentPlayer = players.find(p => p.id === currentPlayerId) || players[0];

  // For pairing selection (Boss only)
  // Options: 0= (0,1)&(2,3); 1= (0,2)&(1,3); 2= (0,3)&(1,2)
  const [selectedPairingIndex, setSelectedPairingIndex] = useState<number>(0);

  // For reroll toggles
  const [selectedRerollDice, setSelectedRerollDice] = useState<number[]>([]);
  const [rerollPolice, setRerollPolice] = useState<boolean>(false);

  const pairingOptions: [ [number, number], [number, number] ][] = [
    [[0, 1], [2, 3]],
    [[0, 2], [1, 3]],
    [[0, 3], [1, 2]],
  ];

  const currentPairing = pairingOptions[selectedPairingIndex];
  const sumA = goldDice[currentPairing[0][0]] + goldDice[currentPairing[0][1]];
  const sumB = goldDice[currentPairing[1][0]] + goldDice[currentPairing[1][1]];

  const handlePairingConfirm = () => {
    sound.playClick();
    onSetPairing({
      pairAIndices: currentPairing[0],
      pairBIndices: currentPairing[1],
    });
  };

  const handleToggleRerollDie = (index: number) => {
    sound.playClick();
    if (selectedRerollDice.includes(index)) {
      setSelectedRerollDice(selectedRerollDice.filter(i => i !== index));
    } else {
      setSelectedRerollDice([...selectedRerollDice, index]);
    }
  };

  const handleExecuteReroll = () => {
    if (selectedRerollDice.length === 0 && !rerollPolice) return;
    sound.playCoin();
    onReroll(selectedRerollDice, rerollPolice);
    setSelectedRerollDice([]);
    setRerollPolice(false);
  };

  const playerAction = playerActions[currentPlayerId];
  const isPlayerResolved = playerAction?.resolved;

  return (
    <div id="dice-roll-area" className="bg-slate-900 border border-slate-700/80 rounded-2xl p-4 shadow-xl text-white">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Dices className="w-5 h-5 text-amber-400" />
          <h3 className="font-bold text-base tracking-wide text-slate-100">
            {phase === 'rolling' && !hasRolled && 'Кидок кубиків'}
            {phase === 'pairing' && 'Розподіл на пари (Хід Боса)'}
            {phase === 'activating' && 'Активація грабіжників'}
            {phase === 'recruiting' && 'Вербування та оновлення'}
          </h3>
        </div>
        <div className="text-xs text-slate-400 flex items-center gap-1.5">
          <span>Бос раунду:</span>
          <span className="font-semibold text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/40">
            {boss.name}
          </span>
        </div>
      </div>

      {/* Dice visual row */}
      <div className="flex flex-wrap items-center justify-center gap-3 my-2">
        {/* 4 Golden Gang Dice */}
        <div className="flex items-center gap-2">
          {goldDice.map((val, idx) => {
            const isSelectedForReroll = selectedRerollDice.includes(idx);
            return (
              <button
                key={`die_${idx}`}
                id={`die-gold-${idx}`}
                type="button"
                onClick={() => isBoss && phase === 'pairing' && handleToggleRerollDie(idx)}
                disabled={!isBoss || phase !== 'pairing' || boss.coins < 1}
                className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center text-xl font-black shadow-lg transition-transform relative ${
                  isSelectedForReroll
                    ? 'ring-2 ring-red-500 bg-amber-400 text-slate-950 scale-105'
                    : 'bg-gradient-to-br from-amber-300 via-amber-400 to-yellow-500 text-slate-950 hover:scale-105 active:scale-95'
                }`}
                title={isBoss && phase === 'pairing' ? 'Клацніть, щоб позначити для перекидання ($1)' : ''}
              >
                <span>{val}</span>
                {isSelectedForReroll && (
                  <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white text-[9px] px-1 rounded-full font-bold">
                    🔄
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Separator */}
        <div className="h-8 w-px bg-slate-700 mx-1" />

        {/* Black Police Die */}
        <div className="flex items-center gap-1.5">
          <button
            id="die-police"
            type="button"
            onClick={() => isBoss && phase === 'pairing' && setRerollPolice(!rerollPolice)}
            disabled={!isBoss || phase !== 'pairing' || boss.coins < 1}
            className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center text-xl font-black shadow-lg border relative transition-transform ${
              rerollPolice
                ? 'ring-2 ring-red-500 bg-slate-800 text-blue-400 border-blue-500 scale-105'
                : 'bg-gradient-to-br from-slate-900 via-slate-950 to-black text-blue-400 border-slate-700 hover:scale-105'
            }`}
            title={isBoss && phase === 'pairing' ? 'Поліцейський кубик: клацніть, щоб перекинути' : 'Поліцейський кубик'}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-blue-400 absolute top-1" />
            <span className="mt-2 text-white">{policeDie}</span>
            {rerollPolice && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white text-[9px] px-1 rounded-full font-bold">
                🔄
              </span>
            )}
          </button>
          <span className="text-[11px] text-slate-400 max-w-[65px] leading-tight">
            Поліція (+{policeDie})
          </span>
        </div>
      </div>

      {/* Controls based on Phase */}
      <div className="mt-3 pt-2 border-t border-slate-800">
        {/* Rolling Phase */}
        {phase === 'rolling' && (
          <div className="flex items-center justify-center">
            {isBoss ? (
              <button
                id="btn-roll-dice"
                type="button"
                onClick={() => {
                  sound.playDiceRoll();
                  onRoll();
                }}
                className="w-full sm:w-auto px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm rounded-xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Dices className="w-5 h-5" />
                <span>Кинути кубики як Бос</span>
              </button>
            ) : (
              <div className="text-sm text-slate-400 italic text-center py-1">
                Очікування кидка від Боса ({boss.name})...
              </div>
            )}
          </div>
        )}

        {/* Pairing Phase (Boss chooses pairs; may reroll) */}
        {phase === 'pairing' && isBoss && (
          <div className="space-y-3">
            <div className="text-xs font-semibold text-slate-300 text-center">
              Оберіть, як розбити 4 золоті кубики на дві пари сум:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {pairingOptions.map((opt, idx) => {
                const sA = goldDice[opt[0][0]] + goldDice[opt[0][1]];
                const sB = goldDice[opt[1][0]] + goldDice[opt[1][1]];
                const isSelected = selectedPairingIndex === idx;
                return (
                  <button
                    key={`opt_${idx}`}
                    id={`btn-pair-option-${idx}`}
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      setSelectedPairingIndex(idx);
                    }}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500/20 border-amber-400 text-amber-200 shadow-md ring-1 ring-amber-400'
                        : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
                    }`}
                  >
                    <div className="text-xs font-bold text-slate-400 mb-0.5">Варіант {idx + 1}</div>
                    <div className="flex items-center justify-center gap-2 text-base font-black">
                      <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-amber-300">
                        {sA}
                      </span>
                      <span className="text-slate-500 font-normal">&</span>
                      <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-amber-300">
                        {sB}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              {/* Reroll button */}
              <button
                id="btn-reroll-dice"
                type="button"
                onClick={handleExecuteReroll}
                disabled={boss.coins < 1 || (selectedRerollDice.length === 0 && !rerollPolice)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 border border-slate-700 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                <span>Перекинути обрані ($1)</span>
              </button>

              {/* Confirm pairing */}
              <button
                id="btn-confirm-pairing"
                type="button"
                onClick={handlePairingConfirm}
                className="px-5 py-2 rounded-xl text-sm font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md transition-transform active:scale-95 flex items-center gap-2 cursor-pointer ml-auto"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Затвердити пари: [{sumA}] та [{sumB}]</span>
              </button>
            </div>
          </div>
        )}

        {/* Pairing Phase for Non-Boss players */}
        {phase === 'pairing' && !isBoss && (
          <div className="text-sm text-slate-400 italic text-center py-1">
            Бос ({boss.name}) обирає комбінацію кубиків...
          </div>
        )}

        {/* Activating Phase: Players pick their sum */}
        {phase === 'activating' && bossPairs && (() => {
          const isSameSums = bossPairs.sumA === bossPairs.sumB;
          const activatedCount = playerAction?.activatedSums?.length || 0;

          return (
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="text-slate-300 font-medium">
                  {isBoss ? (
                    isSameSums ? (
                      <span>
                        Обидві пари дали <strong>#{bossPairs.sumA}</strong>! Як Бос, ви активуєте цього грабіжника <strong>ДВІЧІ</strong>:
                      </span>
                    ) : (
                      <span>
                        Як Бос, ви активуєте <strong>ОБИДВА</strong> номери: [{bossPairs.sumA}] та [{bossPairs.sumB}]!
                      </span>
                    )
                  ) : (
                    isSameSums ? (
                      <span>
                        Обидві пари кубиків дали однакове число <strong>#{bossPairs.sumA}</strong>! Активуйте свого грабіжника:
                      </span>
                    ) : (
                      <span>Оберіть <strong>ОДИН</strong> номер для активації свого грабіжника:</span>
                    )
                  )}
                </span>
                {isPlayerResolved && (
                  <span className="text-emerald-400 font-semibold flex items-center gap-1 bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Ви готові
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3">
                {/* Case 1: Non-boss and both sums are identical -> ONLY ONE single clear button */}
                {!isBoss && isSameSums ? (
                  <button
                    id={`btn-choose-sum-${bossPairs.sumA}`}
                    type="button"
                    disabled={isPlayerResolved}
                    onClick={() => {
                      if (!isPlayerResolved) {
                        sound.playClick();
                        onChooseSum(bossPairs.sumA);
                      }
                    }}
                    className={`px-6 py-3 rounded-xl border text-base font-black transition-all flex items-center gap-2.5 ${
                      isPlayerResolved
                        ? 'bg-emerald-600/20 border-emerald-500/80 text-emerald-300 ring-1 ring-emerald-500/50 cursor-default'
                        : 'bg-slate-800 border-amber-500/50 text-amber-300 hover:bg-slate-700 hover:border-amber-400 cursor-pointer shadow-lg shadow-amber-500/10 active:scale-95'
                    }`}
                  >
                    {isPlayerResolved ? (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        <span>Грабіжника #{bossPairs.sumA} активовано</span>
                      </>
                    ) : (
                      <>
                        <span>Активувати #{bossPairs.sumA}</span>
                        {currentPlayer.gangBoard[bossPairs.sumA]?.title && (
                          <span className="text-xs font-normal text-slate-400">
                            ({currentPlayer.gangBoard[bossPairs.sumA].title})
                          </span>
                        )}
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 ml-1">
                          Обидві пари кубиків: #{bossPairs.sumA}
                        </span>
                      </>
                    )}
                  </button>
                ) : isBoss && isSameSums ? (
                  /* Case 2: Boss and both sums are identical -> 2 sequential action buttons for the same number */
                  <>
                    <button
                      id={`btn-boss-sum-${bossPairs.sumA}-1`}
                      type="button"
                      disabled={activatedCount >= 1}
                      onClick={() => {
                        if (activatedCount < 1) {
                          sound.playClick();
                          onChooseSum(bossPairs.sumA);
                        }
                      }}
                      className={`px-5 py-2.5 rounded-xl border text-base font-black transition-all flex items-center gap-2 ${
                        activatedCount >= 1
                          ? 'bg-emerald-600/20 border-emerald-500/80 text-emerald-300 ring-1 ring-emerald-500/50 cursor-default'
                          : 'bg-slate-800 border-amber-500/50 text-amber-300 hover:bg-slate-700 hover:border-amber-400 cursor-pointer shadow-md'
                      }`}
                    >
                      {activatedCount >= 1 ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>1-ша дія: #{bossPairs.sumA} (Виконано)</span>
                        </>
                      ) : (
                        <>
                          <span>1-ша дія: Активувати #{bossPairs.sumA}</span>
                        </>
                      )}
                    </button>

                    <button
                      id={`btn-boss-sum-${bossPairs.sumA}-2`}
                      type="button"
                      disabled={activatedCount < 1 || activatedCount >= 2}
                      onClick={() => {
                        if (activatedCount === 1) {
                          sound.playClick();
                          onChooseSum(bossPairs.sumA);
                        }
                      }}
                      className={`px-5 py-2.5 rounded-xl border text-base font-black transition-all flex items-center gap-2 ${
                        activatedCount >= 2
                          ? 'bg-emerald-600/20 border-emerald-500/80 text-emerald-300 ring-1 ring-emerald-500/50 cursor-default'
                          : activatedCount === 1
                          ? 'bg-amber-500/20 border-amber-400 text-amber-300 hover:bg-amber-500/30 ring-2 ring-amber-400/50 animate-pulse cursor-pointer shadow-lg'
                          : 'bg-slate-900/60 border-slate-800 text-slate-500 cursor-not-allowed opacity-60'
                      }`}
                    >
                      {activatedCount >= 2 ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>2-га дія: #{bossPairs.sumA} (Виконано)</span>
                        </>
                      ) : activatedCount === 1 ? (
                        <>
                          <span>2-га дія: Активувати #{bossPairs.sumA}</span>
                        </>
                      ) : (
                        <>
                          <span>2-га дія: #{bossPairs.sumA} (очікує 1-шу)</span>
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  /* Case 3: sums are different (standard case) */
                  <>
                    <button
                      id={`btn-choose-sum-${bossPairs.sumA}`}
                      type="button"
                      disabled={
                        isBoss
                          ? playerAction?.activatedSums?.includes(bossPairs.sumA)
                          : isPlayerResolved
                      }
                      onClick={() => {
                        sound.playClick();
                        onChooseSum(bossPairs.sumA);
                      }}
                      className={`px-5 py-2.5 rounded-xl border text-base font-black transition-all flex items-center gap-2 ${
                        isBoss
                          ? playerAction?.activatedSums?.includes(bossPairs.sumA)
                            ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500 cursor-default'
                            : 'bg-slate-800 border-slate-700 text-amber-300 hover:bg-slate-700 hover:border-amber-400 cursor-pointer'
                          : isPlayerResolved
                          ? playerAction?.chosenSum === bossPairs.sumA
                            ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500 cursor-default'
                            : 'bg-slate-900/40 border-slate-800 text-slate-500 cursor-not-allowed opacity-50'
                          : 'bg-slate-800 border-slate-700 text-amber-300 hover:bg-slate-700 hover:border-amber-400 cursor-pointer'
                      }`}
                    >
                      {(!isBoss && isPlayerResolved && playerAction?.chosenSum === bossPairs.sumA) ||
                      (isBoss && playerAction?.activatedSums?.includes(bossPairs.sumA)) ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : null}
                      <span>Активувати #{bossPairs.sumA}</span>
                      {currentPlayer.gangBoard[bossPairs.sumA]?.title && (
                        <span className="text-xs font-normal text-slate-400">
                          ({currentPlayer.gangBoard[bossPairs.sumA].title})
                        </span>
                      )}
                    </button>

                    <button
                      id={`btn-choose-sum-${bossPairs.sumB}`}
                      type="button"
                      disabled={
                        isBoss
                          ? playerAction?.activatedSums?.includes(bossPairs.sumB)
                          : isPlayerResolved
                      }
                      onClick={() => {
                        sound.playClick();
                        onChooseSum(bossPairs.sumB);
                      }}
                      className={`px-5 py-2.5 rounded-xl border text-base font-black transition-all flex items-center gap-2 ${
                        isBoss
                          ? playerAction?.activatedSums?.includes(bossPairs.sumB)
                            ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500 cursor-default'
                            : 'bg-slate-800 border-slate-700 text-amber-300 hover:bg-slate-700 hover:border-amber-400 cursor-pointer'
                          : isPlayerResolved
                          ? playerAction?.chosenSum === bossPairs.sumB
                            ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500 cursor-default'
                            : 'bg-slate-900/40 border-slate-800 text-slate-500 cursor-not-allowed opacity-50'
                          : 'bg-slate-800 border-slate-700 text-amber-300 hover:bg-slate-700 hover:border-amber-400 cursor-pointer'
                      }`}
                    >
                      {(!isBoss && isPlayerResolved && playerAction?.chosenSum === bossPairs.sumB) ||
                      (isBoss && playerAction?.activatedSums?.includes(bossPairs.sumB)) ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : null}
                      <span>Активувати #{bossPairs.sumB}</span>
                      {currentPlayer.gangBoard[bossPairs.sumB]?.title && (
                        <span className="text-xs font-normal text-slate-400">
                          ({currentPlayer.gangBoard[bossPairs.sumB].title})
                        </span>
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};
