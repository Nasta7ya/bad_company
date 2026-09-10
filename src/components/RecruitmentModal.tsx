import React, { useState } from 'react';
import { PlayerState, ResourceSymbol, UpgradeCard } from '../types/game';
import { INITIAL_UPGRADE_CARDS } from '../data/initialDeck';
import { sound } from '../utils/audio';
import { getRecruitCost } from '../utils/gameLogic';
import { VPIcon } from './VPIcon';
import { UserPlus, X, Check, Users, Sparkles, Filter, Search } from 'lucide-react';

interface RecruitmentModalProps {
  player: PlayerState;
  drawnCards: UpgradeCard[];
  isOpen: boolean;
  onClose: () => void;
  onRecruitCard: (chosenCard: UpgradeCard, discardedCards: UpgradeCard[]) => void;
}

export const RecruitmentModal: React.FC<RecruitmentModalProps> = ({
  player,
  drawnCards,
  isOpen,
  onClose,
  onRecruitCard,
}) => {
  const [activeTab, setActiveTab] = useState<'draft' | 'all_thieves'>('draft');
  const [selectedCardId, setSelectedCardId] = useState<string | null>(
    drawnCards.length > 0 ? drawnCards[0].id : null
  );

  // Filters for the full thieves roster
  const [filterNumber, setFilterNumber] = useState<number | 'all'>('all');
  const [filterSymbol, setFilterSymbol] = useState<ResourceSymbol | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  if (!isOpen) return null;

  const cost = getRecruitCost(player.recruiterStep);

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
      case 'wheel': return 'Кермо (+1 авто)';
      case 'coin': return '+$1 Монета';
    }
  };

  const handleConfirm = () => {
    const chosen = drawnCards.find(c => c.id === selectedCardId);
    if (!chosen) return;
    sound.playCoin();
    const discarded = drawnCards.filter(c => c.id !== chosen.id);
    onRecruitCard(chosen, discarded);
    onClose();
  };

  // Check if player already recruited a specific card
  const isCardAlreadyRecruited = (cardId: string) => {
    for (let num = 2; num <= 12; num++) {
      const slot = player.gangBoard[num];
      if (slot && slot.upgrades.some(u => u.id === cardId)) return true;
    }
    return false;
  };

  // Filter full thieves roster
  const filteredAllThieves = INITIAL_UPGRADE_CARDS.filter(card => {
    if (filterNumber !== 'all' && card.gangNumber !== filterNumber) return false;
    if (filterSymbol !== 'all' && !card.symbols.includes(filterSymbol)) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = card.name.toLowerCase().includes(q);
      const matchFlavor = card.flavor.toLowerCase().includes(q);
      if (!matchName && !matchFlavor) return false;
    }
    return true;
  });

  return (
    <div
      id="recruitment-modal-backdrop"
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto cursor-pointer"
    >
      <div
        onClick={e => e.stopPropagation()}
        className="bg-slate-900 border-2 border-slate-700 rounded-3xl p-4 sm:p-6 max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl text-white space-y-4 cursor-default my-auto animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400 flex items-center justify-center text-amber-300 shadow">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-lg text-slate-100 flex items-center gap-2">
                <span>Вербування та база грабіжників</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-amber-300 font-bold">
                  Крок: {player.recruiterStep}/8 • Вартість: ${cost}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Прокачуйте номери вашої банди 3–11 новими символами та бонусними очками.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('draft')}
            className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 cursor-pointer transition-all ${
              activeTab === 'draft'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>3 відкритих кандидати на драфті</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('all_thieves')}
            className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 cursor-pointer transition-all ${
              activeTab === 'all_thieves'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>База всіх злодіїв міста ({INITIAL_UPGRADE_CARDS.length} карт)</span>
          </button>
        </div>

        {/* TAB 1: 3 DRAWN CANDIDATES FOR RECRUITMENT */}
        {activeTab === 'draft' && (
          <div className="space-y-4 overflow-y-auto pr-1">
            <p className="text-xs text-slate-300">
              Оберіть <strong>одного</strong> злодія з трьох відкритих. Його карта накладається на грабіжника відповідного номера:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {drawnCards.map(card => {
                const isSelected = selectedCardId === card.id;

                return (
                  <div
                    key={card.id}
                    id={`recruit-card-${card.id}`}
                    onClick={() => {
                      sound.playClick();
                      setSelectedCardId(card.id);
                    }}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between relative group ${
                      isSelected
                        ? 'bg-amber-950/50 border-amber-400 ring-2 ring-amber-400 shadow-xl scale-102'
                        : 'bg-slate-800/80 border-slate-750 hover:bg-slate-800 hover:border-slate-600'
                    }`}
                  >
                    {/* Top tab with Number & VP Badge */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="w-9 h-9 rounded-xl bg-slate-950 border-2 border-amber-400 flex items-center justify-center text-base font-black text-amber-300 shadow">
                        #{card.gangNumber}
                      </span>

                      {card.vpBonus > 0 && <VPIcon points={card.vpBonus} size="sm" />}
                    </div>

                    {/* Mugshot character header */}
                    <div className="space-y-1 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{card.avatarIcon}</span>
                        <div className="font-black text-sm text-slate-100 leading-tight">
                          {card.name}
                        </div>
                      </div>
                      <div className="text-[11px] text-slate-400 italic">
                        «{card.flavor}»
                      </div>
                    </div>

                    {/* Symbols provided */}
                    <div className="pt-2.5 border-t border-slate-700/80">
                      <div className="text-[10px] text-slate-400 font-semibold mb-1">
                        Додає символи на #{card.gangNumber}:
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {card.symbols.map((sym, sIdx) => (
                          <span
                            key={`sym_${sIdx}`}
                            className="px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs flex items-center gap-1 text-slate-200"
                            title={getSymbolLabel(sym)}
                          >
                            <span>{getSymbolIcon(sym)}</span>
                            <span className="text-[10px] font-bold">{getSymbolLabel(sym)}</span>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Checkmark */}
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-black text-xs shadow-md">
                        ✓
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: FULL ROSTER OF ALL THIEVES IN THE GAME */}
        {activeTab === 'all_thieves' && (
          <div className="space-y-3 overflow-y-auto pr-1 flex-1 min-h-[350px]">
            {/* Filter controls */}
            <div className="bg-slate-850 p-3 rounded-2xl border border-slate-750 space-y-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5 text-amber-400" />
                  <span>Номер банди:</span>
                </span>
                <button
                  type="button"
                  onClick={() => setFilterNumber('all')}
                  className={`px-2 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                    filterNumber === 'all' ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  Всі
                </button>
                {[3, 4, 5, 6, 7, 8, 9, 10, 11].map(num => (
                  <button
                    key={`filt_num_${num}`}
                    type="button"
                    onClick={() => setFilterNumber(num)}
                    className={`w-7 h-7 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                      filterNumber === num ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    #{num}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-300">Символ:</span>
                  <button
                    type="button"
                    onClick={() => setFilterSymbol('all')}
                    className={`px-2 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                      filterSymbol === 'all' ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    Всі
                  </button>
                  {(['glove', 'mask', 'lock', 'flashlight', 'wheel', 'coin'] as ResourceSymbol[]).map(sym => (
                    <button
                      key={`filt_sym_${sym}`}
                      type="button"
                      onClick={() => setFilterSymbol(sym)}
                      className={`px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                        filterSymbol === sym ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      <span>{getSymbolIcon(sym)}</span>
                      <span className="text-[10px]">{getSymbolLabel(sym)}</span>
                    </button>
                  ))}
                </div>

                <div className="relative w-48">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Пошук злодія..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-2 py-1 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>
            </div>

            {/* Roster Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {filteredAllThieves.map(card => {
                const isOnDraft = drawnCards.some(d => d.id === card.id);
                const isRecruited = isCardAlreadyRecruited(card.id);

                return (
                  <div
                    key={`all_thief_${card.id}`}
                    className={`p-3 rounded-2xl border flex flex-col justify-between relative transition-all ${
                      isOnDraft
                        ? 'bg-amber-950/30 border-amber-400/80 shadow'
                        : isRecruited
                        ? 'bg-emerald-950/20 border-emerald-500/40 opacity-80'
                        : 'bg-slate-800/60 border-slate-750 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="w-7 h-7 rounded-lg bg-slate-950 border border-amber-400/70 flex items-center justify-center text-xs font-black text-amber-300">
                        #{card.gangNumber}
                      </span>

                      <div className="flex items-center gap-1">
                        {isOnDraft && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[9px] font-black uppercase">
                            На драфті
                          </span>
                        )}
                        {isRecruited && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 text-[9px] font-black uppercase">
                            Вже у банді
                          </span>
                        )}
                        {card.vpBonus > 0 && <VPIcon points={card.vpBonus} size="sm" />}
                      </div>
                    </div>

                    <div className="mb-2">
                      <div className="flex items-center gap-1.5 font-bold text-xs text-slate-100">
                        <span className="text-lg">{card.avatarIcon}</span>
                        <span className="truncate">{card.name}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 italic truncate mt-0.5">
                        «{card.flavor}»
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-750 flex flex-wrap gap-1">
                      {card.symbols.map((sym, sIdx) => (
                        <span
                          key={`thief_sym_${sIdx}`}
                          className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-[10px] flex items-center gap-0.5 text-slate-200"
                        >
                          <span>{getSymbolIcon(sym)}</span>
                          <span className="text-[9px]">{getSymbolLabel(sym)}</span>
                        </span>
                      ))}
                    </div>

                    {/* If on draft, click to select */}
                    {isOnDraft && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCardId(card.id);
                          setActiveTab('draft');
                        }}
                        className="mt-2 w-full py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-black cursor-pointer shadow"
                      >
                        Обрати на драфті
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Action Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800 shrink-0">
          <div className="text-xs text-slate-400">
            Залишок готівки: <strong className="text-emerald-300">${player.coins - cost}</strong> (після оплати ${cost})
          </div>

          <button
            id="btn-confirm-recruit"
            type="button"
            onClick={handleConfirm}
            disabled={!selectedCardId || player.coins < cost}
            className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-black text-sm shadow-md transition-transform active:scale-95 flex items-center gap-2 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Завербувати за ${cost}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

