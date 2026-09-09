export type ResourceSymbol = 'mask' | 'glove' | 'lock' | 'flashlight' | 'wheel' | 'coin';

export type MissionTrophy = 'diamond' | 'gold' | 'art' | 'moneybag';

export interface UpgradeCard {
  id: string;
  gangNumber: number; // 2..12
  name: string;
  symbols: ResourceSymbol[];
  vpBonus: number;
  flavor: string;
  avatarIcon: string;
}

export interface HeistCard {
  id: string;
  title: string;
  location: string;
  requirements: ResourceSymbol[]; // Symbols needed
  placedMarkers: ResourceSymbol[]; // Markers placed by the player so far
  vp: number;
  trophy: MissionTrophy;
  bonus?: {
    coins?: number;
    carSteps?: number;
    lootCard?: boolean;
    wildMarker?: number;
    description: string;
  };
}

export interface LootCard {
  id: string;
  title: string;
  description: string;
  type: 'instant' | 'endgame_vp' | 'reaction';
  vp?: number;
  coins?: number;
  carSteps?: number;
  wilds?: number;
  isUsed?: boolean;
}

export interface GangMemberSlot {
  number: number; // 2..12
  title: string;
  role: string;
  avatar?: string;
  quote?: string;
  baseSymbols: ResourceSymbol[];
  upgrades: UpgradeCard[];
  assignedNecklace: MissionTrophy | null;
}

export interface PlayerTasks {
  underTwo: {
    masksCount: number; // Max 2 -> awards 1 wild
    glovesCount: number; // Max 2 -> awards $2
  };
  underTwelve: {
    locksCount: number; // Max 2 -> awards 1 car step
    flashlightsCount: number; // Max 2 -> awards 1 loot card
  };
}

export type PlayerColor = 'red' | 'blue' | 'yellow' | 'green' | 'purple';

export type GameMode =
  | 'solo_bot'
  | 'solo_police'
  | 'local_multiplayer'
  | 'online_multiplayer'
  | 'standard'
  | 'solo_challenge';

export interface PlayerState {
  id: string;
  name: string;
  color: PlayerColor;
  isBot: boolean;
  botPersonality?: 'balanced' | 'sprinter' | 'tycoon' | 'collector';
  carPosition: number; // 0..25 (26 spaces)
  score: number;
  coins: number;
  recruiterStep: number; // 0..8
  activeHeists: HeistCard[]; // max 2
  completedHeists: HeistCard[];
  lootCards: LootCard[];
  gangBoard: Record<number, GangMemberSlot>;
  tasks: PlayerTasks;
  wildMarkers: number;
  bonusVp: number;
}

export interface DicePairing {
  pairA: [number, number]; // index into goldDice (or values)
  pairB: [number, number];
  sumA: number; // 2..12
  sumB: number; // 2..12
}

export interface GameLogEntry {
  id: string;
  round: number;
  timestamp: string;
  text: string;
  type: 'roll' | 'heist' | 'police' | 'recruit' | 'necklace' | 'checkpoint' | 'info';
  playerName?: string;
  playerColor?: string;
}

export type GamePhase =
  | 'lobby'
  | 'rolling'
  | 'pairing'
  | 'activating'
  | 'recruiting'
  | 'round_end'
  | 'game_over';

export interface GameState {
  roomId: string;
  gameMode: GameMode;
  phase: GamePhase;
  round: number;
  bossPlayerIndex: number;
  players: PlayerState[];
  goldDice: [number, number, number, number];
  policeDie: number; // 0..3
  hasRolled: boolean;
  rerollCount: number;
  bossPairs: DicePairing | null;
  // Track what each player chose and if they resolved their activation
  playerActions: Record<string, {
    chosenSum: number | null; // For boss, both sums apply, but they can track progress
    activatedSums: number[];
    resolved: boolean;
  }>;
  heistMarket: HeistCard[];
  marketHeists?: HeistCard[];
  heistDeck: HeistCard[];
  upgradeDeck: UpgradeCard[];
  lootDeck: LootCard[];
  policeCarPosition: number;
  necklaces: Record<MissionTrophy, {
    holderPlayerId: string | null;
    gangNumber: number | null;
  }>;
  gameEndTriggered: boolean;
  endTriggerReason: string | null;
  finalRoundLastBossIndex: number | null;
  finalRankings?: { playerId: string; name: string; score: number; rank: number }[];
  log: GameLogEntry[];
}
