import React, { useState, useEffect } from 'react';
import { GameMode, GameState, HeistCard, PlayerColor, PlayerState, ResourceSymbol, UpgradeCard } from './types/game';
import { createInitialGangBoard } from './data/initialDeck';
import {
  activatePlayerGang,
  applyRecruitUpgrade,
  calculateSlotGains,
  checkEndGameCondition,
  checkHeistCompletions,
  chooseReplacementHeist,
  createInitialGameState,
  drawUpgradeCards,
  endRoundAndAdvance,
  getRecruitCost,
  placeWildMarker,
  rerollSelectedDice,
  rollDice,
  setBossPairing,
  useLootCard,
  makeLogId,
} from './utils/gameLogic';
import { runBotTurn } from './utils/aiBot';
import { sound } from './utils/audio';

// Components
import { LobbyView } from './components/LobbyView';
import { ScoreBoard } from './components/ScoreBoard';
import { DiceRollArea } from './components/DiceRollArea';
import { CityTrack } from './components/CityTrack';
import { GangBoard } from './components/GangBoard';
import { HeistMarket } from './components/HeistMarket';
import { NecklacesBar } from './components/NecklacesBar';
import { LootCardsArea } from './components/LootCardsArea';
import { RecruitmentModal } from './components/RecruitmentModal';
import { RulesModal } from './components/RulesModal';
import { GameOverModal } from './components/GameOverModal';
import { SymbolAllocationModal } from './components/SymbolAllocationModal';
import { NextHeistPickerModal } from './components/NextHeistPickerModal';
import { TurnGuidanceBar } from './components/TurnGuidanceBar';
import { EventLog } from './components/EventLog';

// Icons
import {
  Users,
  Eye,
  ScrollText,
  RotateCcw,
  Sparkles,
  ArrowLeft,
  Volume2,
  VolumeX,
  HelpCircle,
} from 'lucide-react';

export default function App() {
  const [inGame, setInGame] = useState<boolean>(false);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [currentPlayerId, setCurrentPlayerId] = useState<string>('player_1');
  const [viewingPlayerId, setViewingPlayerId] = useState<string>('player_1');

  // UI Modals
  const [showRulesModal, setShowRulesModal] = useState<boolean>(false);
  const [showRecruitModal, setShowRecruitModal] = useState<boolean>(false);
  const [showFixerModal, setShowFixerModal] = useState<boolean>(false);
  const [pendingFixerSum, setPendingFixerSum] = useState<number | null>(null);
  const [drawnRecruitCards, setDrawnRecruitCards] = useState<UpgradeCard[]>([]);

  // Manual Resource Symbol Allocation Modal (gloves, masks, locks, flashlights)
  const [pendingAllocation, setPendingAllocation] = useState<{
    sum: number;
    symbols: ResourceSymbol[];
    fixerChoice?: 'mask' | 'glove' | 'lock';
  } | null>(null);

  // Manual Next Heist Selection Modal (player chooses replacement heist card)
  const [pendingNextHeistChoice, setPendingNextHeistChoice] = useState<{
    completedHeist: HeistCard | null;
  } | null>(null);

  // Sound settings
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Log of in-game events
  const [eventLogs, setEventLogs] = useState<{ id: string; text: string; time: string }[]>([]);

  const addLog = (text: string) => {
    setEventLogs(prev => [
      {
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        text,
        time: new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      },
      ...prev.slice(0, 30),
    ]);
  };

  const handleToggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    sound.setMuted(next);
  };

  const broadcastState = (newState: GameState, actionText?: string) => {
    if (actionText) {
      const updatedLog = [
        {
          id: makeLogId('action'),
          round: newState.round,
          timestamp: new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' }),
          text: actionText,
          type: 'info' as const,
        },
        ...newState.log,
      ];
      setGameState({ ...newState, log: updatedLog });
    } else {
      setGameState(newState);
    }
  };

  // -------------------------------------------------------------
  // Game Setup Actions from Lobby
  // -------------------------------------------------------------
  const startVsAI = (playerName: string, botCount: number, playerColor: PlayerColor) => {
    const botsConfig: { name: string; color: PlayerColor; personality: any }[] = [
      { name: 'Шустрий (Бот)', color: 'blue', personality: 'sprinter' },
      { name: 'Магнат (Бот)', color: 'yellow', personality: 'tycoon' },
      { name: 'Мисливець (Бот)', color: 'green', personality: 'collector' },
    ];

    const players: { name: string; color: PlayerColor; isBot: boolean; botPersonality?: any }[] = [
      { name: playerName, color: playerColor, isBot: false },
    ];

    for (let i = 0; i < botCount; i++) {
      const b = botsConfig[i];
      // pick distinct color
      const color = b.color === playerColor ? 'purple' : b.color;
      players.push({
        name: b.name,
        color: color as PlayerColor,
        isBot: true,
        botPersonality: b.personality,
      });
    }

    const initial = createInitialGameState('standard', players);
    setGameState(initial);
    setCurrentPlayerId(initial.players[0].id);
    setViewingPlayerId(initial.players[0].id);
    setInGame(true);
    addLog(`Гру розпочато! Бос раунду 1: ${initial.players[0].name}`);
  };

  const startSoloChallenge = (playerName: string, playerColor: PlayerColor) => {
    const players = [{ name: playerName, color: playerColor, isBot: false }];
    const initial = createInitialGameState('solo_challenge', players);
    setGameState(initial);
    setCurrentPlayerId(initial.players[0].id);
    setViewingPlayerId(initial.players[0].id);
    setInGame(true);
    addLog(`Розпочато офіційне соло-випробування! Поліція стартує на 3 клітинці.`);
  };

  const startPassAndPlay = (names: string[], colors: PlayerColor[]) => {
    const players = names.map((name, idx) => ({
      name: name.trim() || `Гравець ${idx + 1}`,
      color: colors[idx] || 'red',
      isBot: false,
    }));
    const initial = createInitialGameState('standard', players);
    setGameState(initial);
    setCurrentPlayerId(initial.players[0].id);
    setViewingPlayerId(initial.players[0].id);
    setInGame(true);
    addLog(`Розпочато гру на одному екрані для ${players.length} гравців.`);
  };

  // -------------------------------------------------------------
  // Interactive Turn Handlers
  // -------------------------------------------------------------
  const handleRollDice = () => {
    if (!gameState) return;
    const updated = rollDice(gameState);
    broadcastState(
      updated,
      `Бос кинув кубики: [${updated.goldDice.join(', ')}], Поліція: +${updated.policeDie}`
    );
  };

  const handleRerollDice = (diceIndices: number[], rerollPolice: boolean) => {
    if (!gameState) return;
    const updated = rerollSelectedDice(gameState, diceIndices, rerollPolice);
    broadcastState(
      updated,
      `Бос перекинув кубики за $1! Нові значення: [${updated.goldDice.join(', ')}]`
    );
  };

  const handleSetPairing = (pairing: { pairAIndices: [number, number]; pairBIndices: [number, number] }) => {
    if (!gameState) return;
    const updated = setBossPairing(gameState, pairing);
    broadcastState(
      updated,
      `Бос визначив пари: [${updated.bossPairs?.sumA}] та [${updated.bossPairs?.sumB}]!`
    );
  };

  const handleChooseSum = (sum: number) => {
    if (!gameState) return;
    const action = gameState.playerActions[currentPlayerId];
    if (action?.resolved) return;

    if (sum === 2) {
      setPendingFixerSum(sum);
      setShowFixerModal(true);
    } else {
      initiateActivation(sum);
    }
  };

  const handleActivateFixer = (choice: 'mask' | 'glove' | 'lock') => {
    setShowFixerModal(false);
    if (pendingFixerSum !== null) {
      initiateActivation(pendingFixerSum, choice);
      setPendingFixerSum(null);
    }
  };

  const initiateActivation = (sum: number, fixerChoice?: 'mask' | 'glove' | 'lock') => {
    if (!gameState) return;
    const player = gameState.players.find(p => p.id === currentPlayerId);
    if (!player) return;

    // Calculate gains for this slot
    const gains = calculateSlotGains(player, sum, fixerChoice);

    // If human player and there are markers to place (glove, mask, lock, flashlight):
    if (!player.isBot && gains.markers.length > 0) {
      // Apply immediate gains (coins, car steps, necklace VP)
      let preUpdatedPlayer: PlayerState = { ...player };
      if (gains.coins > 0) preUpdatedPlayer.coins += gains.coins;
      if (gains.hasNecklace) preUpdatedPlayer.score += 1;
      if (gains.carSteps > 0) {
        preUpdatedPlayer.carPosition = Math.min(25, preUpdatedPlayer.carPosition + gains.carSteps);
      }

      setGameState(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          players: prev.players.map(p => (p.id === currentPlayerId ? preUpdatedPlayer : p)),
        };
      });

      // Open manual symbol allocation modal
      setPendingAllocation({
        sum,
        symbols: gains.markers,
        fixerChoice,
      });
      return;
    }

    // Direct execution for bots or slots without markers
    executeActivation(sum, fixerChoice);
  };

  const handleFinishAllocation = (
    updatedPlayer: PlayerState,
    completedHeists: HeistCard[],
    bonusLogs: string[]
  ) => {
    if (!gameState || !pendingAllocation) return;
    const { sum } = pendingAllocation;
    setPendingAllocation(null);

    const isBoss = gameState.players[gameState.bossPlayerIndex]?.id === currentPlayerId;
    const currentActions = gameState.playerActions[currentPlayerId] || {
      chosenSum: null,
      activatedSums: [],
      resolved: false,
    };
    const activatedSums = [...currentActions.activatedSums, sum];

    // Check if player reached or exceeded 6 completed heists (max limit in Bad Company!)
    const hasReachedSixHeists = updatedPlayer.completedHeists.length >= 6;
    let gameEndTriggered = gameState.gameEndTriggered;
    let endTriggerReason = gameState.endTriggerReason;
    let finalRoundLastBossIndex = gameState.finalRoundLastBossIndex;

    if (hasReachedSixHeists && !gameEndTriggered) {
      gameEndTriggered = true;
      endTriggerReason = `🎉 ${updatedPlayer.name} першим завершив усі 6 пограбувань! Розпочинається фінальне коло гри!`;
      finalRoundLastBossIndex = (gameState.bossPlayerIndex + gameState.players.length - 1) % gameState.players.length;
      sound.playVictory();
    }

    // Only wait for next heist selection if player completed a heist AND has fewer than 6 heists
    // AND there are actual heists available in market or deck
    const hasAvailableHeists =
      (gameState.heistMarket?.length || gameState.marketHeists?.length || 0) > 0 ||
      (gameState.heistDeck?.length || 0) > 0;
    const isWaitingNextHeist = completedHeists.length > 0 && !hasReachedSixHeists && hasAvailableHeists;
    const isFullyResolved = isWaitingNextHeist ? false : (isBoss ? activatedSums.length >= 2 : true);

    const updatedPlayerActions = {
      ...gameState.playerActions,
      [currentPlayerId]: {
        chosenSum: sum,
        activatedSums,
        resolved: isFullyResolved,
      },
    };

    const updatedPlayers = gameState.players.map(p =>
      p.id === currentPlayerId ? updatedPlayer : p
    );

    let nextPhase = gameState.phase;
    const allResolved = updatedPlayers.every(p => updatedPlayerActions[p.id]?.resolved);
    if (allResolved && !isWaitingNextHeist) {
      nextPhase = 'recruiting';
    }

    const newLogEntries = bonusLogs.map(text => ({
      id: makeLogId('heist_bonus'),
      round: gameState.round,
      timestamp: new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' }),
      text,
      type: 'heist' as const,
      playerName: updatedPlayer.name,
      playerColor: updatedPlayer.color,
    }));

    if (hasReachedSixHeists) {
      newLogEntries.unshift({
        id: makeLogId('six_heists'),
        round: gameState.round,
        timestamp: new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' }),
        text: `🏆 ${updatedPlayer.name} виконав 6 із 6 пограбувань! План банди повністю виконано! Запущено фінальний раунд!`,
        type: 'heist' as const,
        playerName: updatedPlayer.name,
        playerColor: updatedPlayer.color,
      });
    }

    const nextState: GameState = {
      ...gameState,
      players: updatedPlayers,
      playerActions: updatedPlayerActions,
      phase: nextPhase,
      gameEndTriggered,
      endTriggerReason,
      finalRoundLastBossIndex,
      log: [...newLogEntries, ...gameState.log].slice(0, 50),
    };

    broadcastState(
      nextState,
      `${updatedPlayer.name} розмістив маркери інструментів на справи та завдання!`
    );

    // If any heist completed AND player still needs more heists (<6) AND heists exist:
    if (completedHeists.length > 0 && !hasReachedSixHeists && hasAvailableHeists) {
      setPendingNextHeistChoice({
        completedHeist: completedHeists[0],
      });
    }
  };

  const handleSelectNextHeist = (chosenHeist: HeistCard | 'mystery_deck' | null) => {
    setPendingNextHeistChoice(null);

    setGameState(prevState => {
      if (!prevState) return prevState;
      const nextState = chosenHeist
        ? chooseReplacementHeist(prevState, currentPlayerId, chosenHeist)
        : prevState;

      const isBoss = nextState.players[nextState.bossPlayerIndex]?.id === currentPlayerId;
      const currentAction = nextState.playerActions[currentPlayerId] || {
        chosenSum: null,
        activatedSums: [],
        resolved: false,
      };
      const isFullyResolved = isBoss
        ? (currentAction.activatedSums?.length || 0) >= 2
        : true;

      const updatedPlayerActions = {
        ...nextState.playerActions,
        [currentPlayerId]: {
          ...currentAction,
          resolved: isFullyResolved,
        },
      };

      let nextPhase = nextState.phase;
      const allResolved = nextState.players.every(p => updatedPlayerActions[p.id]?.resolved);
      if (allResolved && nextState.phase === 'activating') {
        nextPhase = 'recruiting';
      }

      const finalState: GameState = {
        ...nextState,
        playerActions: updatedPlayerActions,
        phase: nextPhase,
      };

      return finalState;
    });

    sound.playSuccess();
  };

  const executeActivation = (sum: number, fixerChoice?: 'mask' | 'glove' | 'lock') => {
    if (!gameState) return;
    const updated = activatePlayerGang(gameState, currentPlayerId, sum, fixerChoice);
    sound.playSuccess();
    broadcastState(
      updated,
      `${updated.players.find(p => p.id === currentPlayerId)?.name} активував грабіжника #${sum}`
    );
  };

  const handleUseWildMarker = (heistId: string, targetSymbol: ResourceSymbol) => {
    if (!gameState) return;
    const updated = placeWildMarker(gameState, currentPlayerId, heistId, targetSymbol);
    sound.playSuccess();
    broadcastState(updated, `Використано джокер для закриття пограбування!`);
  };

  const handleUseLootCard = (cardId: string) => {
    if (!gameState) return;
    const updated = useLootCard(gameState, currentPlayerId, cardId);
    sound.playSuccess();
    broadcastState(updated, `Використано карту здобичі!`);
  };

  const handleOpenRecruitModal = () => {
    if (!gameState) return;
    const player = gameState.players.find(p => p.id === currentPlayerId);
    if (!player) return;
    const cost = getRecruitCost(player.recruiterStep);
    if (player.coins < cost) return;

    const { cards } = drawUpgradeCards(gameState, 3);
    setDrawnRecruitCards(cards);
    setShowRecruitModal(true);
  };

  const handleRecruitUpgrade = (chosenCard: UpgradeCard, discardedCards: UpgradeCard[]) => {
    if (!gameState) return;
    const updated = applyRecruitUpgrade(gameState, currentPlayerId, chosenCard, discardedCards);
    setShowRecruitModal(false);
    broadcastState(
      updated,
      `${updated.players.find(p => p.id === currentPlayerId)?.name} завербував оновлення #${chosenCard.gangNumber} (${chosenCard.name})!`
    );
  };

  const handleEndBossTurn = () => {
    if (!gameState) return;
    const updated = endRoundAndAdvance(gameState);
    broadcastState(
      updated,
      `Раунд ${gameState.round} завершено. Новий Бос: ${updated.players[updated.bossPlayerIndex].name}`
    );
  };

  const handleRerollGang = (playerId: string) => {
    if (!gameState || gameState.round !== 1 || gameState.hasRolled) return;
    const updatedPlayers = gameState.players.map(p =>
      p.id === playerId ? { ...p, gangBoard: createInitialGangBoard(true) } : p
    );
    const updatedState: GameState = {
      ...gameState,
      players: updatedPlayers,
    };
    sound.playClick();
    broadcastState(
      updatedState,
      `${gameState.players.find(p => p.id === playerId)?.name} перетасував стартовий склад банди!`
    );
  };

  const handleRestart = () => {
    setInGame(false);
    setGameState(null);
  };

  // -------------------------------------------------------------
  // Automated Bot AI Cycle & Phase Transitions
  // -------------------------------------------------------------
  useEffect(() => {
    if (!inGame || !gameState || gameState.phase === 'game_over') return;
    // Do not run background automation or advance phases while user is making choices in modals
    if (pendingAllocation || pendingNextHeistChoice) return;

    const boss = gameState.players[gameState.bossPlayerIndex];

    // Check if activating phase is completely resolved by all players
    if (gameState.phase === 'activating') {
      const allResolved = gameState.players.every(p => {
        const action = gameState.playerActions[p.id];
        return action && action.resolved;
      });

      if (allResolved) {
        // Auto-advance to recruiting phase
        const timer = setTimeout(() => {
          setGameState(prev => {
            if (!prev || prev.phase !== 'activating') return prev;
            return { ...prev, phase: 'recruiting' };
          });
        }, 500);
        return () => clearTimeout(timer);
      }
    }

    // Bot Boss Auto-Rolling
    if (gameState.phase === 'rolling' && boss.isBot && !gameState.hasRolled) {
      const timer = setTimeout(() => {
        setGameState(prev => (prev ? rollDice(prev) : prev));
        sound.playDiceRoll();
      }, 700);
      return () => clearTimeout(timer);
    }

    // Bot AI for pairing, activating, and recruiting
    const hasPendingBotAction =
      (gameState.phase === 'pairing' && boss.isBot) ||
      (gameState.phase === 'activating' && gameState.players.some(p => p.isBot && !gameState.playerActions[p.id]?.resolved)) ||
      (gameState.phase === 'recruiting' && boss.isBot);

    if (hasPendingBotAction) {
      const timer = setTimeout(() => {
        setGameState(prev => {
          if (!prev) return prev;
          const next = runBotTurn(prev);
          // If boss is a bot and in recruiting, auto-end turn after actions
          if (next.phase === 'recruiting' && next.players[next.bossPlayerIndex].isBot) {
            return endRoundAndAdvance(next);
          }
          return next;
        });
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [inGame, gameState]);

  // Keep viewing player valid
  const viewingPlayer = gameState?.players.find(p => p.id === viewingPlayerId) || gameState?.players[0];

  // If in Lobby, render LobbyView
  if (!inGame || !gameState) {
    return (
      <>
        <LobbyView
          onStartVsAI={startVsAI}
          onStartSoloChallenge={startSoloChallenge}
          onStartPassAndPlay={startPassAndPlay}
          onOpenRules={() => setShowRulesModal(true)}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />
        <RulesModal isOpen={showRulesModal} onClose={() => setShowRulesModal(false)} />
      </>
    );
  }

  const isCurrentPlayerBoss = gameState.bossPlayerIndex === gameState.players.findIndex(p => p.id === currentPlayerId);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500 selection:text-slate-950">
      {/* Top App Bar */}
      <header className="bg-slate-900/90 border-b border-slate-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-30 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleRestart}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Повернутися в меню лобі"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div>
            <h1 className="font-black text-sm uppercase tracking-wider text-slate-100 flex items-center gap-1.5">
              <span>ПОГАНА КОМПАНІЯ</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500 text-slate-950 font-bold">
                {gameState.gameMode === 'solo_challenge' ? 'СОЛО' : 'ROZUM'}
              </span>
            </h1>
            <div className="text-[11px] text-slate-400">
              Раунд {gameState.round} • Бос: {gameState.players[gameState.bossPlayerIndex].name}
            </div>
          </div>
        </div>

        {/* Player Gang Board Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 hidden sm:inline flex items-center gap-1">
            <Eye className="w-3.5 h-3.5" />
            <span>Перегляд планшета:</span>
          </span>
          <div className="flex items-center gap-1">
            {gameState.players.map(p => {
              const isViewing = p.id === viewingPlayerId;
              const isSelf = p.id === currentPlayerId;

              return (
                <button
                  key={`tab_p_${p.id}`}
                  type="button"
                  onClick={() => setViewingPlayerId(p.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    isViewing
                      ? 'bg-amber-500 text-slate-950 shadow'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
                  }`}
                >
                  <span>{p.name}</span>
                  {isSelf && <span className="text-[9px] opacity-75">(Ви)</span>}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Game Board Dashboard */}
      <main className="flex-1 p-3 sm:p-5 max-w-7xl w-full mx-auto space-y-4">
        {/* Dynamic Turn Guidance Bar with real-time hints & status */}
        <TurnGuidanceBar
          gameState={gameState}
          currentPlayerId={currentPlayerId}
          isModalOpen={!!pendingAllocation || !!pendingNextHeistChoice}
        />

        {/* Top: ScoreBoard and Global Status */}
        <ScoreBoard
          gameState={gameState}
          currentPlayerId={currentPlayerId}
          onOpenRecruit={handleOpenRecruitModal}
          onEndTurn={handleEndBossTurn}
          onOpenRules={() => setShowRulesModal(true)}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />

        {/* Middle: Dice & Roll Pairing Area + Necklaces */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <DiceRollArea
              gameState={gameState}
              isBoss={isCurrentPlayerBoss}
              currentPlayerId={currentPlayerId}
              onRoll={handleRollDice}
              onReroll={handleRerollDice}
              onSetPairing={handleSetPairing}
              onChooseSum={handleChooseSum}
            />
          </div>

          <div className="lg:col-span-1 flex flex-col justify-between">
            <NecklacesBar necklaces={gameState.necklaces} players={gameState.players} />
          </div>
        </div>

        {/* City Chase Track */}
        <CityTrack
          players={gameState.players}
          policePosition={gameState.policeCarPosition}
          currentPlayerId={currentPlayerId}
          gameMode={gameState.gameMode}
        />

        {/* Gang Board (Shows currently selected player's gang) */}
        {viewingPlayer && (
          <GangBoard
            player={viewingPlayer}
            isCurrentTurn={isCurrentPlayerBoss}
            highlightedSums={
              gameState.bossPairs
                ? isCurrentPlayerBoss
                  ? [gameState.bossPairs.sumA, gameState.bossPairs.sumB]
                  : [gameState.bossPairs.sumA, gameState.bossPairs.sumB]
                : []
            }
            onSlotClick={sum => {
              if (gameState.phase === 'activating' && viewingPlayer.id === currentPlayerId) {
                const action = gameState.playerActions[currentPlayerId];
                if (action?.resolved) return;

                if (isCurrentPlayerBoss) {
                  const activated = action?.activatedSums || [];
                  const timesActivatedThisSum = activated.filter(s => s === sum).length;
                  const timesAllowedThisSum =
                    (gameState.bossPairs?.sumA === sum ? 1 : 0) +
                    (gameState.bossPairs?.sumB === sum ? 1 : 0);

                  if (timesActivatedThisSum < timesAllowedThisSum) {
                    handleChooseSum(sum);
                  }
                } else {
                  if (gameState.bossPairs?.sumA === sum || gameState.bossPairs?.sumB === sum) {
                    handleChooseSum(sum);
                  }
                }
              }
            }}
            showFixerModal={showFixerModal}
            onCloseFixerModal={() => {
              setShowFixerModal(false);
              setPendingFixerSum(null);
            }}
            onActivateFixer={handleActivateFixer}
            canRerollGang={gameState.round === 1 && !gameState.hasRolled && viewingPlayer.id === currentPlayerId}
            onRerollGang={() => handleRerollGang(viewingPlayer.id)}
          />
        )}

        {/* Loot Cards Drawer if player has cards */}
        {viewingPlayer && (
          <LootCardsArea player={viewingPlayer} onUseLootCard={handleUseLootCard} />
        )}

        {/* Heist Cards Market & Active Player Heists */}
        {viewingPlayer && (
          <HeistMarket
            player={viewingPlayer}
            marketHeists={gameState.heistMarket || gameState.marketHeists || []}
            onUseWildMarker={viewingPlayer.id === currentPlayerId ? handleUseWildMarker : undefined}
            onOpenHeistPicker={() => setPendingNextHeistChoice({ completedHeist: null })}
          />
        )}

        {/* Chronicle / Activity Logs */}
        <EventLog log={gameState?.log || []} />
      </main>

      {/* Manual Symbol Allocation Modal (gloves, masks, locks, flashlights) */}
      {viewingPlayer && pendingAllocation && (
        <SymbolAllocationModal
          isOpen={true}
          player={viewingPlayer}
          pendingSymbols={pendingAllocation.symbols}
          onFinishAllocation={handleFinishAllocation}
        />
      )}

      {/* Manual Next Heist Selection Modal (player chooses replacement heist) */}
      {viewingPlayer && pendingNextHeistChoice && (
        <NextHeistPickerModal
          isOpen={true}
          completedHeist={pendingNextHeistChoice.completedHeist}
          marketHeists={gameState.heistMarket || gameState.marketHeists || []}
          deckCount={gameState.heistDeck.length}
          onSelectHeist={handleSelectNextHeist}
          onSelectMysteryFromDeck={() => handleSelectNextHeist('mystery_deck')}
          onClose={() => handleSelectNextHeist(null)}
        />
      )}

      {/* Recruitment Modal */}
      {viewingPlayer && (
        <RecruitmentModal
          player={viewingPlayer}
          drawnCards={drawnRecruitCards}
          isOpen={showRecruitModal}
          onClose={() => setShowRecruitModal(false)}
          onRecruitCard={handleRecruitUpgrade}
        />
      )}

      {/* Rules Modal */}
      <RulesModal isOpen={showRulesModal} onClose={() => setShowRulesModal(false)} />

      {/* Game Over Modal */}
      {gameState.phase === 'game_over' && (
        <GameOverModal gameState={gameState} onRestart={handleRestart} />
      )}
    </div>
  );
}
