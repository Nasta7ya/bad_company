import {
  CHECKPOINTS,
  CITY_TRACK_LENGTH,
  createInitialGangBoard,
  INITIAL_HEIST_CARDS,
  INITIAL_LOOT_CARDS,
  INITIAL_UPGRADE_CARDS,
  RECRUIT_COSTS,
  RED_ZONE_START,
  shuffleArray,
} from '../data/initialDeck';
import {
  DicePairing,
  GameLogEntry,
  GameState,
  HeistCard,
  LootCard,
  MissionTrophy,
  PlayerState,
  ResourceSymbol,
  UpgradeCard,
} from '../types/game';

export function createNewGame(
  playerConfigs: { name: string; isBot: boolean; color: 'red' | 'blue' | 'yellow' | 'green' }[],
  gameMode: 'solo_bot' | 'solo_police' | 'local_multiplayer' | 'online_multiplayer',
  roomId = 'local'
): GameState {
  const shuffledHeists = shuffleArray(INITIAL_HEIST_CARDS);
  const shuffledUpgrades = shuffleArray(INITIAL_UPGRADE_CARDS);
  const shuffledLoot = shuffleArray(INITIAL_LOOT_CARDS);

  // Market gets 4 heists
  const heistMarket = shuffledHeists.slice(0, 4);
  let remainingHeists = shuffledHeists.slice(4);

  const players: PlayerState[] = playerConfigs.map((config, index) => {
    // Each player draws 2 initial heists from remaining deck
    const playerHeists = remainingHeists.slice(0, 2);
    remainingHeists = remainingHeists.slice(2);

    return {
      id: `p_${index + 1}`,
      name: config.name,
      color: config.color,
      isBot: config.isBot,
      botPersonality: config.isBot
        ? (['balanced', 'sprinter', 'tycoon', 'collector'][index % 4] as any)
        : undefined,
      carPosition: 0,
      score: 0,
      coins: 2, // Every player starts with $2
      recruiterStep: 0,
      activeHeists: playerHeists,
      completedHeists: [],
      lootCards: [],
      gangBoard: createInitialGangBoard(),
      tasks: {
        underTwo: { masksCount: 0, glovesCount: 0 },
        underTwelve: { locksCount: 0, flashlightsCount: 0 },
      },
      wildMarkers: 0,
      bonusVp: 0,
    };
  });

  // Police car starting position:
  // In solo challenge vs police: space 6!
  // In 2-4 players: space equals player count (e.g. 2 for 2p, 3 for 3p, 4 for 4p)
  let policeStart = players.length;
  if (gameMode === 'solo_police') {
    policeStart = 6;
  } else if (players.length === 1) {
    policeStart = 3;
  }

  const initialLog: GameLogEntry = {
    id: 'log_start',
    round: 1,
    timestamp: new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' }),
    text: `Гра «Погана компанія» розпочалася! Перший Бос: ${players[0].name}. Поліція стартує на клітинці ${policeStart}.`,
    type: 'info',
  };

  return {
    roomId,
    gameMode,
    phase: 'rolling',
    round: 1,
    bossPlayerIndex: 0,
    players,
    goldDice: [1, 2, 3, 4],
    policeDie: 1,
    hasRolled: false,
    rerollCount: 0,
    bossPairs: null,
    playerActions: {},
    heistMarket,
    marketHeists: heistMarket,
    heistDeck: remainingHeists,
    upgradeDeck: shuffledUpgrades,
    lootDeck: shuffledLoot,
    policeCarPosition: policeStart,
    necklaces: {
      diamond: { holderPlayerId: null, gangNumber: null },
      gold: { holderPlayerId: null, gangNumber: null },
      art: { holderPlayerId: null, gangNumber: null },
      moneybag: { holderPlayerId: null, gangNumber: null },
    },
    gameEndTriggered: false,
    endTriggerReason: null,
    finalRoundLastBossIndex: null,
    log: [initialLog],
  };
}

export function rollAllDice(state: GameState): GameState {
  const goldDice: [number, number, number, number] = [
    Math.floor(Math.random() * 6) + 1,
    Math.floor(Math.random() * 6) + 1,
    Math.floor(Math.random() * 6) + 1,
    Math.floor(Math.random() * 6) + 1,
  ];
  // Police die: 0, 1, 1, 2, 2, 3
  const policeRolls = [0, 1, 1, 2, 2, 3];
  const policeDie = policeRolls[Math.floor(Math.random() * policeRolls.length)];

  const boss = state.players[state.bossPlayerIndex];
  const logEntry: GameLogEntry = {
    id: `log_${Date.now()}`,
    round: state.round,
    timestamp: new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' }),
    text: `${boss.name} (Бос) кидає кубики: [${goldDice.join(', ')}] та поліцейський: [${policeDie}]`,
    type: 'roll',
    playerName: boss.name,
    playerColor: boss.color,
  };

  return {
    ...state,
    goldDice,
    policeDie,
    hasRolled: true,
    phase: 'pairing',
    log: [logEntry, ...state.log.slice(0, 49)],
  };
}

export function rerollSelectedDice(
  state: GameState,
  diceIndices: number[], // 0..3 for gold dice
  rerollPolice: boolean
): GameState {
  const boss = state.players[state.bossPlayerIndex];
  if (boss.coins < 1) return state; // Must pay $1

  const newGoldDice = [...state.goldDice] as [number, number, number, number];
  for (const idx of diceIndices) {
    if (idx >= 0 && idx < 4) {
      newGoldDice[idx] = Math.floor(Math.random() * 6) + 1;
    }
  }

  let newPolice = state.policeDie;
  if (rerollPolice) {
    const policeRolls = [0, 1, 1, 2, 2, 3];
    newPolice = policeRolls[Math.floor(Math.random() * policeRolls.length)];
  }

  const updatedPlayers = state.players.map((p, i) =>
    i === state.bossPlayerIndex ? { ...p, coins: p.coins - 1 } : p
  );

  const logEntry: GameLogEntry = {
    id: `log_${Date.now()}`,
    round: state.round,
    timestamp: new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' }),
    text: `${boss.name} сплатив $1 та перекинув кубики! Нові: [${newGoldDice.join(', ')}] та поліція: [${newPolice}]`,
    type: 'roll',
    playerName: boss.name,
    playerColor: boss.color,
  };

  return {
    ...state,
    players: updatedPlayers,
    goldDice: newGoldDice,
    policeDie: newPolice,
    rerollCount: state.rerollCount + 1,
    log: [logEntry, ...state.log.slice(0, 49)],
  };
}

export function setBossPairing(
  state: GameState,
  pairing: { pairAIndices: [number, number]; pairBIndices: [number, number] }
): GameState {
  const sumA = state.goldDice[pairing.pairAIndices[0]] + state.goldDice[pairing.pairAIndices[1]];
  const sumB = state.goldDice[pairing.pairBIndices[0]] + state.goldDice[pairing.pairBIndices[1]];

  const bossPairs: DicePairing = {
    pairA: [state.goldDice[pairing.pairAIndices[0]], state.goldDice[pairing.pairAIndices[1]]],
    pairB: [state.goldDice[pairing.pairBIndices[0]], state.goldDice[pairing.pairBIndices[1]]],
    sumA,
    sumB,
  };

  const boss = state.players[state.bossPlayerIndex];
  const logEntry: GameLogEntry = {
    id: `log_${Date.now()}`,
    round: state.round,
    timestamp: new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' }),
    text: `${boss.name} об'єднав кубики у пари: [${sumA}] та [${sumB}]. Усі гравці активують своїх грабіжників!`,
    type: 'info',
    playerName: boss.name,
    playerColor: boss.color,
  };

  return {
    ...state,
    bossPairs,
    phase: 'activating',
    playerActions: {},
    log: [logEntry, ...state.log.slice(0, 49)],
  };
}

// Get all visible symbols on a gang member column (base + upgrades)
export function getGangMemberSymbols(slot: any): ResourceSymbol[] {
  const list: ResourceSymbol[] = [...(slot.baseSymbols || [])];
  if (slot.upgrades) {
    for (const u of slot.upgrades) {
      if (u.symbols) list.push(...u.symbols);
    }
  }
  return list;
}

// Calculate breakdown of what a slot activation produces
export function calculateSlotGains(
  player: PlayerState,
  sum: number,
  fixerChoice?: 'mask' | 'glove' | 'lock'
): {
  coins: number;
  carSteps: number;
  markers: ResourceSymbol[];
  hasNecklace: boolean;
} {
  const slot = player.gangBoard[sum];
  if (!slot) return { coins: 0, carSteps: 0, markers: [], hasNecklace: false };

  const hasNecklace = !!slot.assignedNecklace;
  const symbolsToDistribute: ResourceSymbol[] = [];

  if (sum === 2) {
    const choice = fixerChoice || 'mask';
    let count = 0;
    for (let num = 3; num <= 12; num++) {
      const otherSlot = player.gangBoard[num];
      const otherSymbols = getGangMemberSymbols(otherSlot);
      count += otherSymbols.filter(s => s === choice).length;
    }
    for (let i = 0; i < count; i++) {
      symbolsToDistribute.push(choice);
    }
    if (slot.upgrades) {
      for (const u of slot.upgrades) {
        if (u.symbols) symbolsToDistribute.push(...u.symbols);
      }
    }
  } else {
    symbolsToDistribute.push(...getGangMemberSymbols(slot));
  }

  let coins = 0;
  let carSteps = 0;
  const markers: ResourceSymbol[] = [];

  for (const s of symbolsToDistribute) {
    if (s === 'coin') coins += 1;
    else if (s === 'wheel') carSteps += 1;
    else markers.push(s);
  }

  return { coins, carSteps, markers, hasNecklace };
}

// Manually select a replacement heist card after completing a previous one
export function chooseReplacementHeist(
  state: GameState,
  playerId: string,
  chosenHeist: HeistCard | 'mystery_deck' | null
): GameState {
  const pIdx = state.players.findIndex(p => p.id === playerId);
  if (pIdx === -1) return state;

  if (!chosenHeist) return state;

  const player = state.players[pIdx];
  if (player.completedHeists.length >= 6) return state;

  let cardToAdd: HeistCard | null = null;
  let newMarket = [...(state.heistMarket || state.marketHeists || [])];
  let newDeck = [...(state.heistDeck || [])];

  if (chosenHeist === 'mystery_deck') {
    if (newDeck.length > 0) {
      cardToAdd = newDeck[0];
      newDeck = newDeck.slice(1);
    }
  } else {
    cardToAdd = chosenHeist;
    newMarket = newMarket.filter(h => h.id !== chosenHeist.id);
    if (newDeck.length > 0) {
      newMarket.push(newDeck[0]);
      newDeck = newDeck.slice(1);
    }
  }

  if (!cardToAdd) return state;

  // Filter out any duplicate ID just in case, and append to active heists (max 2)
  const currentActive = player.activeHeists.filter(h => h.id !== cardToAdd!.id);
  const updatedActive = [...currentActive, { ...cardToAdd, placedMarkers: [] }].slice(0, 2);

  const updatedPlayer: PlayerState = {
    ...player,
    activeHeists: updatedActive,
  };

  const updatedPlayers = state.players.map((p, i) => (i === pIdx ? updatedPlayer : p));
  const newLog: GameLogEntry[] = [
    {
      id: `log_${Date.now()}_heist_pick`,
      round: state.round,
      timestamp: new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' }),
      text: `${player.name} обрав нову справу: «${cardToAdd.title}» (${cardToAdd.vp} ПО, трофей: ${cardToAdd.trophy})`,
      type: 'heist' as const,
      playerName: player.name,
      playerColor: player.color,
    },
    ...state.log,
  ].slice(0, 50);

  return {
    ...state,
    players: updatedPlayers,
    heistMarket: newMarket,
    marketHeists: newMarket,
    heistDeck: newDeck,
    log: newLog,
  };
}

// Execute activation for a player
export function activatePlayerGang(
  state: GameState,
  playerId: string,
  chosenSum: number,
  fixerChoice?: 'mask' | 'glove' | 'lock' // if sum is 2
): GameState {
  const playerIndex = state.players.findIndex(p => p.id === playerId);
  if (playerIndex === -1) return state;

  const player = state.players[playerIndex];
  const isBoss = playerIndex === state.bossPlayerIndex;

  let newPlayer = { ...player };
  let newLog = [...state.log];
  let newLootDeck = [...state.lootDeck];

  const slot = newPlayer.gangBoard[chosenSum];
  if (!slot) return state;

  // Necklace trigger: if necklace is assigned to this member, score +1 VP!
  if (slot.assignedNecklace) {
    newPlayer.score += 1;
    newLog.unshift({
      id: `log_${Date.now()}_neck`,
      round: state.round,
      timestamp: new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' }),
      text: `${newPlayer.name} активував грабіжника #${chosenSum} з кольє і отримує +1 ПО!`,
      type: 'necklace',
      playerName: newPlayer.name,
      playerColor: newPlayer.color,
    });
  }

  // Gather symbols produced
  const symbolsToDistribute: ResourceSymbol[] = [];

  if (chosenSum === 2) {
    // The Fixer special rule:
    // Choose mask, glove, or lock; gain that many markers as visible on all OTHER gang members (3..12)!
    const choice = fixerChoice || 'mask';
    let count = 0;
    for (let num = 3; num <= 12; num++) {
      const otherSlot = newPlayer.gangBoard[num];
      const otherSymbols = getGangMemberSymbols(otherSlot);
      count += otherSymbols.filter(s => s === choice).length;
    }
    for (let i = 0; i < count; i++) {
      symbolsToDistribute.push(choice);
    }

    // Also include any upgrade symbols on column 2 itself
    if (slot.upgrades) {
      for (const u of slot.upgrades) {
        if (u.symbols) symbolsToDistribute.push(...u.symbols);
      }
    }

    newLog.unshift({
      id: `log_${Date.now()}_fix`,
      round: state.round,
      timestamp: new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' }),
      text: `${newPlayer.name} активував Навідника (#2): обрано символ [${choice}], отримано ${count} маркерів!`,
      type: 'info',
      playerName: newPlayer.name,
      playerColor: newPlayer.color,
    });
  } else {
    // Standard slot: collect all symbols
    const symbols = getGangMemberSymbols(slot);
    symbolsToDistribute.push(...symbols);
  }

  // Now process symbols for player:
  let carStepsToAdd = 0;
  let coinsToAdd = 0;

  for (const sym of symbolsToDistribute) {
    if (sym === 'wheel') {
      carStepsToAdd += 1;
    } else if (sym === 'coin') {
      coinsToAdd += 1;
    } else {
      // It's a marker: try to place on active heists or tasks
      newPlayer = allocateMarker(newPlayer, sym, (lootDrawn) => {
        // Callback if task rewarded a loot card
        if (newLootDeck.length > 0) {
          const drawn = newLootDeck[0];
          newLootDeck = newLootDeck.slice(1);
          newPlayer.lootCards = [...newPlayer.lootCards, drawn];
          newLog.unshift({
            id: `log_${Date.now()}_loot`,
            round: state.round,
            timestamp: new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' }),
            text: `${newPlayer.name} виконав завдання під #12 і отримав карту здобичі: «${drawn.title}»!`,
            type: 'info',
            playerName: newPlayer.name,
            playerColor: newPlayer.color,
          });
        }
      });
    }
  }

  newPlayer.coins += coinsToAdd;

  // Move car if any steps
  if (carStepsToAdd > 0) {
    const prevPos = newPlayer.carPosition;
    const newPos = Math.min(CITY_TRACK_LENGTH - 1, prevPos + carStepsToAdd);
    newPlayer.carPosition = newPos;

    // Check if passed checkpoints (5, 10, 15, 20) while ahead of police
    for (const cpStr of Object.keys(CHECKPOINTS)) {
      const cp = Number(cpStr);
      if (prevPos < cp && newPos >= cp) {
        // Must be ahead of police to get bonus
        if (newPos > state.policeCarPosition) {
          const checkInfo = CHECKPOINTS[cp];
          if (checkInfo.coins) newPlayer.coins += checkInfo.coins;
          if (checkInfo.carSteps) newPlayer.carPosition = Math.min(CITY_TRACK_LENGTH - 1, newPlayer.carPosition + checkInfo.carSteps);
          if (checkInfo.lootCard && newLootDeck.length > 0) {
            const drawn = newLootDeck[0];
            newLootDeck = newLootDeck.slice(1);
            newPlayer.lootCards = [...newPlayer.lootCards, drawn];
          }
          newLog.unshift({
            id: `log_${Date.now()}_cp`,
            round: state.round,
            timestamp: new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' }),
            text: `${newPlayer.name} проїхав чекпоінт «${checkInfo.name}» попереду поліції! Бонус: ${checkInfo.bonusDesc}`,
            type: 'checkpoint',
            playerName: newPlayer.name,
            playerColor: newPlayer.color,
          });
        }
      }
    }
  }

  // Check and complete any finished heists for this player
  const checkedHeistState = checkHeistCompletions(newPlayer, state.heistMarket, state.heistDeck, newLootDeck);
  newPlayer = checkedHeistState.player;
  const newHeistMarket = checkedHeistState.market;
  const newHeistDeck = checkedHeistState.deck;
  newLootDeck = checkedHeistState.lootDeck;
  newLog = [...checkedHeistState.logs, ...newLog];

  // Track player action
  const currentActions = state.playerActions[playerId] || {
    chosenSum: null,
    activatedSums: [],
    resolved: false,
  };

  const activatedSums = [...currentActions.activatedSums, chosenSum];
  // Boss activates both sums; others activate 1
  const isFullyResolved = isBoss ? activatedSums.length >= 2 : true;

  const updatedPlayerActions = {
    ...state.playerActions,
    [playerId]: {
      chosenSum,
      activatedSums,
      resolved: isFullyResolved,
    },
  };

  const updatedPlayers = state.players.map((p, i) => (i === playerIndex ? newPlayer : p));

  // Check if all players resolved activation
  const allResolved = updatedPlayers.every(p => updatedPlayerActions[p.id]?.resolved);

  let nextPhase = state.phase;
  if (allResolved) {
    nextPhase = 'recruiting';
  }

  return {
    ...state,
    players: updatedPlayers,
    heistMarket: newHeistMarket,
    heistDeck: newHeistDeck,
    lootDeck: newLootDeck,
    playerActions: updatedPlayerActions,
    phase: nextPhase,
    log: newLog.slice(0, 50),
  };
}

// Allocate a marker to an active heist or task
function allocateMarker(
  player: PlayerState,
  symbol: ResourceSymbol,
  onLootDrawn: (type: string) => void
): PlayerState {
  const newPlayer = { ...player };

  // 1. Try to place on an active heist that needs this symbol
  for (let i = 0; i < newPlayer.activeHeists.length; i++) {
    const heist = newPlayer.activeHeists[i];
    const placedCount = heist.placedMarkers.filter(s => s === symbol).length;
    const requiredCount = heist.requirements.filter(s => s === symbol).length;

    if (placedCount < requiredCount) {
      // Place here!
      const updatedHeist: HeistCard = {
        ...heist,
        placedMarkers: [...heist.placedMarkers, symbol],
      };
      newPlayer.activeHeists = [
        ...newPlayer.activeHeists.slice(0, i),
        updatedHeist,
        ...newPlayer.activeHeists.slice(i + 1),
      ];
      return newPlayer;
    }
  }

  // 2. If no heist needs it, place on task tracks under 2 or 12
  const tasks = {
    underTwo: { ...newPlayer.tasks.underTwo },
    underTwelve: { ...newPlayer.tasks.underTwelve },
  };

  if (symbol === 'mask') {
    tasks.underTwo.masksCount += 1;
    if (tasks.underTwo.masksCount >= 2) {
      tasks.underTwo.masksCount = 0;
      newPlayer.wildMarkers += 1; // 2 Masks -> 1 Wild marker!
    }
    newPlayer.tasks = tasks;
    return newPlayer;
  }

  if (symbol === 'glove') {
    tasks.underTwo.glovesCount += 1;
    if (tasks.underTwo.glovesCount >= 2) {
      tasks.underTwo.glovesCount = 0;
      newPlayer.coins += 2; // 2 Gloves -> $2!
    }
    newPlayer.tasks = tasks;
    return newPlayer;
  }

  if (symbol === 'lock') {
    tasks.underTwelve.locksCount += 1;
    if (tasks.underTwelve.locksCount >= 2) {
      tasks.underTwelve.locksCount = 0;
      newPlayer.carPosition = Math.min(CITY_TRACK_LENGTH - 1, newPlayer.carPosition + 1); // 2 Locks -> 1 car step!
    }
    newPlayer.tasks = tasks;
    return newPlayer;
  }

  if (symbol === 'flashlight') {
    tasks.underTwelve.flashlightsCount += 1;
    if (tasks.underTwelve.flashlightsCount >= 2) {
      tasks.underTwelve.flashlightsCount = 0;
      onLootDrawn('flashlight_task'); // 2 Flashlights -> 1 Loot card!
    }
    newPlayer.tasks = tasks;
    return newPlayer;
  }

  return newPlayer;
}

// Place a wild marker on an active heist
export function placeWildMarker(
  state: GameState,
  playerId: string,
  heistId: string,
  targetSymbol: ResourceSymbol
): GameState {
  const pIdx = state.players.findIndex(p => p.id === playerId);
  if (pIdx === -1) return state;

  const player = state.players[pIdx];
  if (player.wildMarkers <= 0) return state;

  const heistIdx = player.activeHeists.findIndex(h => h.id === heistId);
  if (heistIdx === -1) return state;

  const heist = player.activeHeists[heistIdx];
  const placedCount = heist.placedMarkers.filter(s => s === targetSymbol).length;
  const reqCount = heist.requirements.filter(s => s === targetSymbol).length;
  if (placedCount >= reqCount) return state;

  const updatedHeist: HeistCard = {
    ...heist,
    placedMarkers: [...heist.placedMarkers, targetSymbol],
  };

  const updatedPlayer: PlayerState = {
    ...player,
    wildMarkers: player.wildMarkers - 1,
    activeHeists: [
      ...player.activeHeists.slice(0, heistIdx),
      updatedHeist,
      ...player.activeHeists.slice(heistIdx + 1),
    ],
  };

  const checked = checkHeistCompletions(
    updatedPlayer,
    state.heistMarket,
    state.heistDeck,
    state.lootDeck
  );

  const updatedPlayers = state.players.map((p, i) => (i === pIdx ? checked.player : p));

  return {
    ...state,
    players: updatedPlayers,
    heistMarket: checked.market,
    heistDeck: checked.deck,
    lootDeck: checked.lootDeck,
    log: [...checked.logs, ...state.log].slice(0, 50),
  };
}

// Check if any heists are completed
export function checkHeistCompletions(
  player: PlayerState,
  market: HeistCard[],
  deck: HeistCard[],
  lootDeck: LootCard[]
): {
  player: PlayerState;
  market: HeistCard[];
  deck: HeistCard[];
  lootDeck: LootCard[];
  logs: GameLogEntry[];
  humanCompletedHeist: boolean;
} {
  let newPlayer = { ...player };
  let newMarket = [...market];
  let newDeck = [...deck];
  let newLootDeck = [...lootDeck];
  const logs: GameLogEntry[] = [];
  let humanCompletedHeist = false;

  const remainingActive: HeistCard[] = [];

  for (const heist of newPlayer.activeHeists) {
    const isCompleted = heist.requirements.every(req => {
      const placed = heist.placedMarkers.filter(s => s === req).length;
      const required = heist.requirements.filter(s => s === req).length;
      return placed >= required;
    });

    if (isCompleted) {
      // Completed heist!
      newPlayer.score += heist.vp;
      newPlayer.completedHeists = [...newPlayer.completedHeists, heist];

      // Apply bonus
      if (heist.bonus) {
        if (heist.bonus.coins) newPlayer.coins += heist.bonus.coins;
        if (heist.bonus.carSteps) {
          newPlayer.carPosition = Math.min(CITY_TRACK_LENGTH - 1, newPlayer.carPosition + heist.bonus.carSteps);
        }
        if (heist.bonus.wildMarker) newPlayer.wildMarkers += heist.bonus.wildMarker;
        if (heist.bonus.lootCard && newLootDeck.length > 0) {
          newPlayer.lootCards = [...newPlayer.lootCards, newLootDeck[0]];
          newLootDeck = newLootDeck.slice(1);
        }
      }

      logs.push({
        id: `log_${Date.now()}_heist_${heist.id}`,
        round: 0,
        timestamp: new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' }),
        text: `💥 ${newPlayer.name} успішно здійснив пограбування: «${heist.title}»! (+${heist.vp} ПО, трофей: ${heist.trophy})`,
        type: 'heist',
        playerName: newPlayer.name,
        playerColor: newPlayer.color,
      });

      if (newPlayer.isBot) {
        // Draw replacement for bot only if fewer than 6 heists completed
        if (newPlayer.completedHeists.length < 6 && newMarket.length > 0) {
          const replacement = newMarket[0];
          newMarket = newMarket.slice(1);
          remainingActive.push(replacement);

          // Refill market from deck
          if (newDeck.length > 0) {
            newMarket.push(newDeck[0]);
            newDeck = newDeck.slice(1);
          }
        }
      } else {
        // Human player will choose her next heist manually if fewer than 6 completed
        if (newPlayer.completedHeists.length < 6) {
          humanCompletedHeist = true;
        }
      }
    } else {
      remainingActive.push(heist);
    }
  }

  newPlayer.activeHeists = remainingActive;

  return {
    player: newPlayer,
    market: newMarket,
    deck: newDeck,
    lootDeck: newLootDeck,
    logs,
    humanCompletedHeist,
  };
}

// Recruiting: advance recruiter meeple by spending coins
export function getRecruitCost(currentStep: number): number {
  if (currentStep < RECRUIT_COSTS.length) {
    return RECRUIT_COSTS[currentStep];
  }
  return 5; // End of track cost: $5 for 3 VP
}

export function drawUpgradeCards(state: GameState, count = 3): { cards: UpgradeCard[]; remainingDeck: UpgradeCard[] } {
  const cards = state.upgradeDeck.slice(0, count);
  const remainingDeck = state.upgradeDeck.slice(count);
  return { cards, remainingDeck };
}

export function applyRecruitUpgrade(
  state: GameState,
  playerId: string,
  chosenCard: UpgradeCard,
  discardedCards: UpgradeCard[]
): GameState {
  const pIdx = state.players.findIndex(p => p.id === playerId);
  if (pIdx === -1) return state;

  const player = state.players[pIdx];
  const cost = getRecruitCost(player.recruiterStep);
  if (player.coins < cost) return state;

  const newCoins = player.coins - cost;
  let newScore = player.score;
  let newStep = player.recruiterStep;

  if (player.recruiterStep >= RECRUIT_COSTS.length) {
    // End of track: $5 for 3 VP
    newScore += 3;
  } else {
    newStep += 1;
  }

  // Place upgrade on gang member slot
  const gangNum = chosenCard.gangNumber;
  const existingSlot = player.gangBoard[gangNum];
  const updatedSlot = {
    ...existingSlot,
    upgrades: [...existingSlot.upgrades, chosenCard],
  };

  const updatedBoard = {
    ...player.gangBoard,
    [gangNum]: updatedSlot,
  };

  // Add card VP bonus if any
  if (chosenCard.vpBonus) {
    newScore += chosenCard.vpBonus;
  }

  const updatedPlayer: PlayerState = {
    ...player,
    coins: newCoins,
    score: newScore,
    recruiterStep: newStep,
    gangBoard: updatedBoard,
  };

  const updatedPlayers = state.players.map((p, i) => (i === pIdx ? updatedPlayer : p));

  const logEntry: GameLogEntry = {
    id: `log_${Date.now()}_recruit`,
    round: state.round,
    timestamp: new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' }),
    text: `${player.name} завербував оновлення «${chosenCard.name}» для грабіжника #${gangNum}! (Витрачено $${cost})`,
    type: 'recruit',
    playerName: player.name,
    playerColor: player.color,
  };

  return {
    ...state,
    players: updatedPlayers,
    upgradeDeck: state.upgradeDeck.filter(c => c.id !== chosenCard.id && !discardedCards.some(d => d.id === c.id)),
    log: [logEntry, ...state.log].slice(0, 50),
  };
}

// Use a Loot Card
export function useLootCard(state: GameState, playerId: string, cardId: string): GameState {
  const pIdx = state.players.findIndex(p => p.id === playerId);
  if (pIdx === -1) return state;

  const player = state.players[pIdx];
  const cardIdx = player.lootCards.findIndex(c => c.id === cardId);
  if (cardIdx === -1) return state;

  const card = player.lootCards[cardIdx];
  if (card.isUsed || card.type === 'endgame_vp') return state; // End game cards score automatically

  let newPlayer = { ...player };
  if (card.coins) newPlayer.coins += card.coins;
  if (card.carSteps) newPlayer.carPosition = Math.min(CITY_TRACK_LENGTH - 1, newPlayer.carPosition + card.carSteps);
  if (card.wilds) newPlayer.wildMarkers += card.wilds;

  const updatedLootCards = [
    ...player.lootCards.slice(0, cardIdx),
    { ...card, isUsed: true },
    ...player.lootCards.slice(cardIdx + 1),
  ];
  newPlayer.lootCards = updatedLootCards;

  const logEntry: GameLogEntry = {
    id: `log_${Date.now()}_loot_use`,
    round: state.round,
    timestamp: new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' }),
    text: `${player.name} використав карту здобичі: «${card.title}» (${card.description})`,
    type: 'info',
    playerName: player.name,
    playerColor: player.color,
  };

  const updatedPlayers = state.players.map((p, i) => (i === pIdx ? newPlayer : p));
  return {
    ...state,
    players: updatedPlayers,
    log: [logEntry, ...state.log].slice(0, 50),
  };
}

// End Boss turn: Move police, check necklaces, check end game condition, advance boss
export function endBossTurn(state: GameState): GameState {
  let newLog = [...state.log];

  // 1. Move police car:
  // In solo challenge vs police: moves policeDie + 1
  const policeMove = state.gameMode === 'solo_police' ? state.policeDie + 1 : state.policeDie;
  const newPolicePos = Math.min(CITY_TRACK_LENGTH - 1, state.policeCarPosition + policeMove);

  newLog.unshift({
    id: `log_${Date.now()}_police`,
    round: state.round,
    timestamp: new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' }),
    text: `🚓 Поліцейське авто рухається на ${policeMove} кроків вперед! (Поточна позиція: ${newPolicePos})`,
    type: 'police',
  });

  // 2. Check Necklaces Majority
  const trophyTypes: MissionTrophy[] = ['diamond', 'gold', 'art', 'moneybag'];
  const newNecklaces = { ...state.necklaces };
  let updatedPlayers = [...state.players];

  for (const trophy of trophyTypes) {
    // Count trophies for each player
    const counts = updatedPlayers.map(p => {
      const count = p.completedHeists.filter(h => h.trophy === trophy).length;
      return { playerId: p.id, count };
    });

    // Find max
    counts.sort((a, b) => b.count - a.count);
    const topCount = counts[0].count;

    // Must have at least 1 trophy to hold a necklace (or in solo police mode, at least 3)
    const threshold = state.gameMode === 'solo_police' ? 3 : 1;

    if (topCount >= threshold) {
      // Check if unique leader
      const leaders = counts.filter(c => c.count === topCount);
      if (leaders.length === 1) {
        const leaderId = leaders[0].playerId;
        const currentHolder = newNecklaces[trophy].holderPlayerId;

        if (leaderId !== currentHolder) {
          // New leader claimed this necklace!
          const pIdx = updatedPlayers.findIndex(p => p.id === leaderId);
          const leaderPlayer = updatedPlayers[pIdx];

          // Place necklace on member with highest upgrades, or default 7
          let bestGangNum = 7;
          let maxUpgrades = -1;
          for (let n = 2; n <= 12; n++) {
            const count = leaderPlayer.gangBoard[n].upgrades.length;
            if (count > maxUpgrades && !leaderPlayer.gangBoard[n].assignedNecklace) {
              maxUpgrades = count;
              bestGangNum = n;
            }
          }

          // Remove necklace from old holder's board
          if (currentHolder) {
            const oldIdx = updatedPlayers.findIndex(p => p.id === currentHolder);
            if (oldIdx !== -1) {
              const oldPlayer = updatedPlayers[oldIdx];
              const updatedBoard = { ...oldPlayer.gangBoard };
              for (let n = 2; n <= 12; n++) {
                if (updatedBoard[n].assignedNecklace === trophy) {
                  updatedBoard[n] = { ...updatedBoard[n], assignedNecklace: null };
                }
              }
              updatedPlayers[oldIdx] = { ...oldPlayer, gangBoard: updatedBoard };
            }
          }

          // Place on new leader's board and award +1 VP immediately
          const updatedBoard = { ...leaderPlayer.gangBoard };
          updatedBoard[bestGangNum] = {
            ...updatedBoard[bestGangNum],
            assignedNecklace: trophy,
          };
          updatedPlayers[pIdx] = {
            ...leaderPlayer,
            score: leaderPlayer.score + 1,
            gangBoard: updatedBoard,
          };

          newNecklaces[trophy] = {
            holderPlayerId: leaderId,
            gangNumber: bestGangNum,
          };

          newLog.unshift({
            id: `log_${Date.now()}_neck_${trophy}`,
            round: state.round,
            timestamp: new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' }),
            text: `👑 ${leaderPlayer.name} здобув кольє «${trophyNameUk(trophy)}» і поклав його на грабіжника #${bestGangNum}! (+1 ПО)`,
            type: 'necklace',
            playerName: leaderPlayer.name,
            playerColor: leaderPlayer.color,
          });
        }
      }
    }
  }

  // 3. Check End Game Trigger
  let gameEndTriggered = state.gameEndTriggered;
  let endTriggerReason = state.endTriggerReason;
  let finalRoundLastBossIndex = state.finalRoundLastBossIndex;

  if (!gameEndTriggered) {
    // Condition A: Any player completed 6 heists
    const heistWinner = updatedPlayers.find(p => p.completedHeists.length >= 6);
    if (heistWinner) {
      gameEndTriggered = true;
      endTriggerReason = `${heistWinner.name} завершив 6 пограбувань! Розпочинається фінальне коло!`;
      finalRoundLastBossIndex = (state.bossPlayerIndex + updatedPlayers.length - 1) % updatedPlayers.length;
    }

    // Condition B: Any car (player or police) entered the Red Zone (22+)
    const redZoneCar = updatedPlayers.find(p => p.carPosition >= RED_ZONE_START) || (newPolicePos >= RED_ZONE_START ? { name: 'Поліція' } : null);
    if (redZoneCar && !gameEndTriggered) {
      gameEndTriggered = true;
      endTriggerReason = `${redZoneCar.name} в'їхав у червону зону порту (втеча)! Розпочинається фінальне коло!`;
      finalRoundLastBossIndex = (state.bossPlayerIndex + updatedPlayers.length - 1) % updatedPlayers.length;
    }
  }

  // In Solo Police Challenge: immediate loss if police catches or passes player car
  if (state.gameMode === 'solo_police') {
    const player = updatedPlayers[0];
    if (newPolicePos >= player.carPosition) {
      // Captured by police!
      return calculateFinalScores({
        ...state,
        players: updatedPlayers,
        policeCarPosition: newPolicePos,
        necklaces: newNecklaces,
        phase: 'game_over',
        endTriggerReason: 'Поліцейське авто наздогнало ваше авто! Вас схоплено!',
        log: newLog.slice(0, 50),
      });
    }
  }

  // Check if final round reached its conclusion
  if (gameEndTriggered && state.bossPlayerIndex === finalRoundLastBossIndex) {
    // Game is officially over!
    return calculateFinalScores({
      ...state,
      players: updatedPlayers,
      policeCarPosition: newPolicePos,
      necklaces: newNecklaces,
      phase: 'game_over',
      log: newLog.slice(0, 50),
    });
  }

  // Next Boss
  const nextBossIndex = (state.bossPlayerIndex + 1) % updatedPlayers.length;
  const nextRound = nextBossIndex === 0 ? state.round + 1 : state.round;

  return {
    ...state,
    players: updatedPlayers,
    policeCarPosition: newPolicePos,
    necklaces: newNecklaces,
    bossPlayerIndex: nextBossIndex,
    round: nextRound,
    phase: 'rolling',
    hasRolled: false,
    bossPairs: null,
    playerActions: {},
    gameEndTriggered,
    endTriggerReason,
    finalRoundLastBossIndex,
    log: newLog.slice(0, 50),
  };
}

function trophyNameUk(t: MissionTrophy): string {
  switch (t) {
    case 'diamond': return 'Діамант';
    case 'gold': return 'Золото';
    case 'art': return 'Картина';
    case 'moneybag': return 'Мішок грошей';
  }
}

// Calculate final scores and rankings
export function calculateFinalScores(state: GameState): GameState {
  const scoredPlayers = state.players.map(player => {
    let finalScore = player.score;

    // 1. Endgame VP from Loot Cards
    for (const loot of player.lootCards) {
      if (loot.type === 'endgame_vp' && loot.vp) {
        finalScore += loot.vp;
      }
    }

    // 2. End of game Necklaces: +2 VP per necklace held
    for (const [trophy, info] of Object.entries(state.necklaces)) {
      if (info.holderPlayerId === player.id) {
        finalScore += 2;
      }
    }

    // 3. Uncompleted markers on active heists and tasks: 1 VP per 2 markers
    let leftoverMarkers = player.wildMarkers;
    for (const heist of player.activeHeists) {
      leftoverMarkers += heist.placedMarkers.length;
    }
    leftoverMarkers += player.tasks.underTwo.masksCount;
    leftoverMarkers += player.tasks.underTwo.glovesCount;
    leftoverMarkers += player.tasks.underTwelve.locksCount;
    leftoverMarkers += player.tasks.underTwelve.flashlightsCount;

    finalScore += Math.floor(leftoverMarkers / 2);

    // 4. Police penalty: -3 VP if car is behind police car!
    if (player.carPosition < state.policeCarPosition) {
      finalScore -= 3;
    }

    return {
      ...player,
      score: Math.max(0, finalScore),
    };
  });

  return {
    ...state,
    players: scoredPlayers,
    phase: 'game_over',
  };
}

export const rollDice = rollAllDice;
export const createInitialGameState = (
  mode: any,
  players: { name: string; color: any; isBot: boolean; botPersonality?: any }[],
  roomId = 'local'
): GameState => createNewGame(players, mode, roomId);
export const endRoundAndAdvance = endBossTurn;
export const checkEndGameCondition = (state: GameState): GameState => state;

