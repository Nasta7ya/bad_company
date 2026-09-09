import { GameState, PlayerState, ResourceSymbol, UpgradeCard } from '../types/game';
import {
  activatePlayerGang,
  applyRecruitUpgrade,
  drawUpgradeCards,
  getGangMemberSymbols,
  getRecruitCost,
  placeWildMarker,
  rerollSelectedDice,
  setBossPairing,
  useLootCard,
} from './gameLogic';

export function runBotTurn(state: GameState): GameState {
  let currentState = { ...state };
  const boss = currentState.players[currentState.bossPlayerIndex];

  // 1. If in pairing phase and boss is bot, pair the dice
  if (currentState.phase === 'pairing' && boss.isBot && !currentState.bossPairs) {
    const bestPairing = evaluateBestDicePairing(currentState, boss);
    currentState = setBossPairing(currentState, bestPairing);
  }

  // 2. If in activating phase, resolve activations for any bot players
  if (currentState.phase === 'activating' && currentState.bossPairs) {
    const { sumA, sumB } = currentState.bossPairs;

    for (let i = 0; i < currentState.players.length; i++) {
      const p = currentState.players[i];
      if (!p.isBot) continue;

      const actions = currentState.playerActions[p.id];
      const isBoss = i === currentState.bossPlayerIndex;

      if (isBoss) {
        // Boss activates BOTH sumA and sumB
        // When sumA === sumB (e.g., both pairs equal 8), boss activates that number twice!
        let activeCount = currentState.playerActions[p.id]?.activatedSums?.length || 0;

        if (sumA === sumB) {
          while (activeCount < 2) {
            const updatedPlayer = currentState.players.find(pl => pl.id === p.id) || p;
            const fixerChoice = pickBestFixerChoice(updatedPlayer);
            currentState = activatePlayerGang(currentState, p.id, sumA, fixerChoice);
            activeCount = currentState.playerActions[p.id]?.activatedSums?.length || 0;
          }
        } else {
          const currentList = currentState.playerActions[p.id]?.activatedSums || [];
          if (!currentList.includes(sumA)) {
            const updatedPlayer = currentState.players.find(pl => pl.id === p.id) || p;
            const fixerChoice = pickBestFixerChoice(updatedPlayer);
            currentState = activatePlayerGang(currentState, p.id, sumA, fixerChoice);
          }
          const nextList = currentState.playerActions[p.id]?.activatedSums || [];
          if (!nextList.includes(sumB)) {
            const updatedPlayer = currentState.players.find(pl => pl.id === p.id) || p;
            const fixerChoice = pickBestFixerChoice(updatedPlayer);
            currentState = activatePlayerGang(currentState, p.id, sumB, fixerChoice);
          }
        }
      } else {
        // Non-boss picks ONE of sumA or sumB
        if (!actions?.resolved) {
          const utilityA = evaluateSumUtility(p, sumA, currentState.policeCarPosition);
          const utilityB = evaluateSumUtility(p, sumB, currentState.policeCarPosition);
          const chosenSum = utilityA >= utilityB ? sumA : sumB;
          const fixerChoice = pickBestFixerChoice(p);
          currentState = activatePlayerGang(currentState, p.id, chosenSum, fixerChoice);
        }
      }
    }
  }

  // 3. In recruiting phase, bots use instant loot cards, place wilds, and recruit if possible
  if (currentState.phase === 'recruiting') {
    for (let i = 0; i < currentState.players.length; i++) {
      const p = currentState.players[i];
      if (!p.isBot) continue;

      // Play instant loot cards
      const instantCards = p.lootCards.filter(c => c.type === 'instant' && !c.isUsed);
      for (const card of instantCards) {
        currentState = useLootCard(currentState, p.id, card.id);
      }

      // Place wild markers on active heists
      let updatedP = currentState.players[i];
      while (updatedP.wildMarkers > 0) {
        const target = findBestWildPlacement(updatedP);
        if (!target) break;
        currentState = placeWildMarker(currentState, updatedP.id, target.heistId, target.symbol);
        updatedP = currentState.players[i];
      }

      // Recruit upgrade if bot can afford it
      const cost = getRecruitCost(updatedP.recruiterStep);
      const shouldRecruit = updatedP.coins >= cost && (updatedP.coins >= 3 || updatedP.recruiterStep <= 2);
      if (shouldRecruit && currentState.upgradeDeck.length >= 3) {
        const { cards, remainingDeck } = drawUpgradeCards(currentState, 3);
        const bestCard = pickBestUpgradeCard(cards, updatedP);
        const discarded = cards.filter(c => c.id !== bestCard.id);
        currentState = applyRecruitUpgrade(currentState, updatedP.id, bestCard, discarded);
      }
    }
  }

  return currentState;
}

// Find best dice pairing for boss bot
function evaluateBestDicePairing(
  state: GameState,
  boss: PlayerState
): { pairAIndices: [number, number]; pairBIndices: [number, number] } {
  const dice = state.goldDice;
  // 3 possible pairings:
  // Option 1: (0, 1) and (2, 3)
  // Option 2: (0, 2) and (1, 3)
  // Option 3: (0, 3) and (1, 2)
  const options: [ [number, number], [number, number] ][] = [
    [[0, 1], [2, 3]],
    [[0, 2], [1, 3]],
    [[0, 3], [1, 2]],
  ];

  let bestScore = -999;
  let bestOption = options[0];

  for (const opt of options) {
    const sumA = dice[opt[0][0]] + dice[opt[0][1]];
    const sumB = dice[opt[1][0]] + dice[opt[1][1]];

    const utilityBossA = evaluateSumUtility(boss, sumA, state.policeCarPosition);
    const utilityBossB = evaluateSumUtility(boss, sumB, state.policeCarPosition);
    let totalScore = utilityBossA + utilityBossB;

    // Small penalty if sum gives opponents a lot of value
    for (const other of state.players) {
      if (other.id !== boss.id) {
        const otherUtil = Math.max(
          evaluateSumUtility(other, sumA, state.policeCarPosition),
          evaluateSumUtility(other, sumB, state.policeCarPosition)
        );
        totalScore -= otherUtil * 0.2;
      }
    }

    if (totalScore > bestScore) {
      bestScore = totalScore;
      bestOption = opt;
    }
  }

  return {
    pairAIndices: bestOption[0],
    pairBIndices: bestOption[1],
  };
}

// Score the utility of activating a specific gang member sum for a player
function evaluateSumUtility(player: PlayerState, sum: number, policeCarPos: number): number {
  let score = 0;
  const slot = player.gangBoard[sum];
  if (!slot) return 0;

  // Extra utility if necklace is on this member (+1 VP!)
  if (slot.assignedNecklace) {
    score += 5;
  }

  // Need for car progress (especially if behind police)
  const isBehindPolice = player.carPosition <= policeCarPos;
  const carMultiplier = isBehindPolice ? 4 : 2;

  // Calculate symbols needed across active heists
  const neededSymbols: Record<string, number> = {};
  for (const heist of player.activeHeists) {
    for (const req of heist.requirements) {
      const placed = heist.placedMarkers.filter(s => s === req).length;
      const totalReq = heist.requirements.filter(s => s === req).length;
      if (placed < totalReq) {
        neededSymbols[req] = (neededSymbols[req] || 0) + 1;
      }
    }
  }

  if (sum === 2) {
    // The Fixer
    let maxFixerGain = 0;
    const choices: ResourceSymbol[] = ['mask', 'glove', 'lock'];
    for (const ch of choices) {
      let count = 0;
      for (let n = 3; n <= 12; n++) {
        const otherSlot = player.gangBoard[n];
        count += getGangMemberSymbols(otherSlot).filter(s => s === ch).length;
      }
      const needed = neededSymbols[ch] || 0;
      const utility = count * (needed > 0 ? 3 : 1);
      if (utility > maxFixerGain) {
        maxFixerGain = utility;
      }
    }
    score += maxFixerGain;
  } else if (sum === 12) {
    // Chauffeur: 2 wheels!
    score += 2 * carMultiplier;
    // Plus tasks under 12
  } else {
    const symbols = getGangMemberSymbols(slot);
    for (const sym of symbols) {
      if (sym === 'wheel') {
        score += carMultiplier;
      } else if (sym === 'coin') {
        score += 2;
      } else if (neededSymbols[sym]) {
        score += 4; // High value for completing heists!
      } else {
        score += 1; // Fills task tracks
      }
    }
  }

  // Strategy preference adjustments
  if (player.botPersonality === 'sprinter' && (sum === 12 || sum === 4 || sum === 10)) {
    score += 3;
  }
  if (player.botPersonality === 'tycoon' && (sum === 3 || sum === 11)) {
    score += 3;
  }

  return score;
}

function pickBestFixerChoice(player: PlayerState): 'mask' | 'glove' | 'lock' {
  const neededSymbols: Record<string, number> = {};
  for (const heist of player.activeHeists) {
    for (const req of heist.requirements) {
      const placed = heist.placedMarkers.filter(s => s === req).length;
      const totalReq = heist.requirements.filter(s => s === req).length;
      if (placed < totalReq) {
        neededSymbols[req] = (neededSymbols[req] || 0) + 1;
      }
    }
  }

  let bestChoice: 'mask' | 'glove' | 'lock' = 'mask';
  let bestScore = -1;

  const choices: ('mask' | 'glove' | 'lock')[] = ['mask', 'glove', 'lock'];
  for (const ch of choices) {
    let count = 0;
    for (let n = 3; n <= 12; n++) {
      count += getGangMemberSymbols(player.gangBoard[n]).filter(s => s === ch).length;
    }
    const weight = neededSymbols[ch] ? 3 : 1;
    const score = count * weight;
    if (score > bestScore) {
      bestScore = score;
      bestChoice = ch;
    }
  }

  return bestChoice;
}

function findBestWildPlacement(player: PlayerState): { heistId: string; symbol: ResourceSymbol } | null {
  for (const heist of player.activeHeists) {
    for (const req of heist.requirements) {
      const placed = heist.placedMarkers.filter(s => s === req).length;
      const totalReq = heist.requirements.filter(s => s === req).length;
      if (placed < totalReq) {
        return { heistId: heist.id, symbol: req };
      }
    }
  }
  return null;
}

function pickBestUpgradeCard(cards: UpgradeCard[], player: PlayerState): UpgradeCard {
  let bestCard = cards[0];
  let bestScore = -99;

  // Dice probabilities (approx): 7 is most common, then 6/8, 5/9, etc.
  const frequencyWeight: Record<number, number> = {
    7: 6,
    6: 5, 8: 5,
    5: 4, 9: 4,
    4: 3, 10: 3,
    3: 2, 11: 2,
    2: 1, 12: 1,
  };

  for (const card of cards) {
    let score = (card.vpBonus || 0) * 3;
    const freq = frequencyWeight[card.gangNumber] || 2;
    score += freq;

    // Favor cards that give symbols player needs
    for (const sym of card.symbols) {
      if (sym === 'wheel') score += 2.5;
      if (sym === 'coin') score += 2;
      if (sym === 'mask' || sym === 'glove' || sym === 'lock' || sym === 'flashlight') score += 2;
    }

    if (score > bestScore) {
      bestScore = score;
      bestCard = card;
    }
  }

  return bestCard;
}
