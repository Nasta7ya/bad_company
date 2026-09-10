import React, { useState, useMemo } from 'react';
import { GameLogEntry } from '../types/game';
import { ScrollText, Filter, ChevronDown, ChevronUp, Search, Sparkles, AlertCircle, ShieldAlert, Award, Dices, Building2, UserPlus } from 'lucide-react';

interface EventLogProps {
  log: GameLogEntry[];
}

type LogTypeFilter = 'all' | 'roll' | 'heist' | 'recruit' | 'police' | 'award';

export const EventLog: React.FC<EventLogProps> = ({ log }) => {
  const [filter, setFilter] = useState<LogTypeFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const filteredLogs = useMemo(() => {
    return log.filter(entry => {
      // Type filtering
      if (filter === 'roll' && entry.type !== 'roll') return false;
      if (filter === 'heist' && entry.type !== 'heist') return false;
      if (filter === 'recruit' && entry.type !== 'recruit') return false;
      if (filter === 'police' && entry.type !== 'police') return false;
      if (filter === 'award' && entry.type !== 'checkpoint' && entry.type !== 'necklace') return false;

      // Text search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const textMatch = entry.text.toLowerCase().includes(q);
        const playerMatch = entry.playerName ? entry.playerName.toLowerCase().includes(q) : false;
        return textMatch || playerMatch;
      }

      return true;
    });
  }, [log, filter, searchQuery]);

  const getTypeBadge = (type: GameLogEntry['type']) => {
    switch (type) {
      case 'roll':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-indigo-950/80 border border-indigo-700/60 text-indigo-300 text-[10px] font-bold">
            <Dices className="w-3 h-3 text-indigo-400" />
            <span>Кидок</span>
          </span>
        );
      case 'heist':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 text-[10px] font-bold">
            <Building2 className="w-3 h-3 text-emerald-400" />
            <span>Справа</span>
          </span>
        );
      case 'recruit':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-purple-950/80 border border-purple-700/60 text-purple-300 text-[10px] font-bold">
            <UserPlus className="w-3 h-3 text-purple-400" />
            <span>Банда</span>
          </span>
        );
      case 'police':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-rose-950/80 border border-rose-700/60 text-rose-300 text-[10px] font-bold animate-pulse">
            <ShieldAlert className="w-3 h-3 text-rose-400" />
            <span>Поліція</span>
          </span>
        );
      case 'checkpoint':
      case 'necklace':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-950/80 border border-amber-500/60 text-amber-300 text-[10px] font-bold">
            <Award className="w-3 h-3 text-amber-400" />
            <span>Нагорода</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-400 text-[10px]">
            <Sparkles className="w-3 h-3" />
            <span>Подія</span>
          </span>
        );
    }
  };

  const getPlayerColorDot = (color?: string) => {
    switch (color) {
      case 'red': return 'bg-red-500 border-red-300';
      case 'blue': return 'bg-blue-500 border-blue-300';
      case 'green': return 'bg-emerald-500 border-emerald-300';
      case 'yellow': return 'bg-amber-400 border-amber-200';
      case 'purple': return 'bg-purple-500 border-purple-300';
      default: return 'bg-slate-400 border-slate-200';
    }
  };

  // Helper to highlight brackets [dice], money $, quotes «...»
  const renderFormattedText = (text: string) => {
    // We can highlight key tokens visually using regex splits
    const parts = text.split(/(«[^»]+»|\[[^\]]+\]|\$\d+|\+\d+\s*ПО|\+\d+\s*авто)/g);

    return (
      <span>
        {parts.map((part, idx) => {
          if (part.startsWith('«') && part.endsWith('»')) {
            return (
              <span key={idx} className="font-bold text-amber-300">
                {part}
              </span>
            );
          }
          if (part.startsWith('[') && part.endsWith(']')) {
            return (
              <span key={idx} className="font-bold text-indigo-300 bg-indigo-950/50 px-1 py-0.5 rounded border border-indigo-800/60 font-mono text-[10px]">
                {part}
              </span>
            );
          }
          if (part.startsWith('$')) {
            return (
              <span key={idx} className="font-extrabold text-emerald-400">
                {part}
              </span>
            );
          }
          if (part.includes('ПО')) {
            return (
              <span key={idx} className="font-extrabold text-amber-400">
                {part}
              </span>
            );
          }
          return part;
        })}
      </span>
    );
  };

  return (
    <div id="chronicle-panel" className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 shadow-xl backdrop-blur-sm transition-all duration-300">
      {/* Top Bar Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <ScrollText className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-black text-xs text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <span>Хроніка Пограбувань</span>
              <span className="px-1.5 py-0.2 rounded-full bg-slate-800 border border-slate-700 text-[10px] text-slate-400 font-mono">
                {log.length}
              </span>
            </h3>
            <p className="text-[10px] text-slate-400 hidden sm:block">
              Детальна історія кидків, активностей, дій поліції та здобичі
            </p>
          </div>
        </div>

        {/* Action Controls & Filters */}
        <div className="flex items-center gap-1.5">
          {/* Quick Search */}
          <div className="relative">
            <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Пошук..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-6 pr-2 py-1 bg-slate-950 border border-slate-800 rounded-lg text-[11px] text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/60 w-24 sm:w-32"
            />
          </div>

          {/* Toggle Expand */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-750 transition-colors flex items-center gap-1 text-[11px] px-2 font-medium"
            title={isExpanded ? 'Згорнути хроніку' : 'Розгорнути хроніку'}
          >
            {isExpanded ? (
              <>
                <span>Згорнути</span>
                <ChevronUp className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                <span>Розгорнути</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Filter Category Chips */}
      <div className="flex items-center gap-1 py-2 overflow-x-auto no-scrollbar border-b border-slate-800/60 text-[11px]">
        <span className="text-slate-500 text-[10px] font-semibold flex items-center gap-0.5 pr-1">
          <Filter className="w-3 h-3" /> Фільтр:
        </span>
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`px-2 py-0.5 rounded-full font-medium transition-all ${
            filter === 'all'
              ? 'bg-amber-400 text-slate-950 font-bold shadow'
              : 'bg-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          Всі
        </button>
        <button
          type="button"
          onClick={() => setFilter('roll')}
          className={`px-2 py-0.5 rounded-full font-medium transition-all ${
            filter === 'roll'
              ? 'bg-indigo-500 text-white font-bold shadow'
              : 'bg-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          🎲 Кидки
        </button>
        <button
          type="button"
          onClick={() => setFilter('heist')}
          className={`px-2 py-0.5 rounded-full font-medium transition-all ${
            filter === 'heist'
              ? 'bg-emerald-500 text-white font-bold shadow'
              : 'bg-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          💎 Справи
        </button>
        <button
          type="button"
          onClick={() => setFilter('recruit')}
          className={`px-2 py-0.5 rounded-full font-medium transition-all ${
            filter === 'recruit'
              ? 'bg-purple-500 text-white font-bold shadow'
              : 'bg-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          🎴 Банда
        </button>
        <button
          type="button"
          onClick={() => setFilter('police')}
          className={`px-2 py-0.5 rounded-full font-medium transition-all ${
            filter === 'police'
              ? 'bg-rose-500 text-white font-bold shadow'
              : 'bg-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          🚓 Поліція
        </button>
        <button
          type="button"
          onClick={() => setFilter('award')}
          className={`px-2 py-0.5 rounded-full font-medium transition-all ${
            filter === 'award'
              ? 'bg-amber-500 text-white font-bold shadow'
              : 'bg-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          🏆 Нагороди
        </button>
      </div>

      {/* Log Entries Container */}
      <div
        className={`mt-2 overflow-y-auto space-y-1.5 pr-1 transition-all duration-300 ${
          isExpanded ? 'max-h-80 sm:max-h-96' : 'max-h-32 sm:max-h-36'
        }`}
      >
        {filteredLogs.length === 0 ? (
          <div className="py-6 text-center text-slate-500 text-xs flex flex-col items-center justify-center gap-1">
            <AlertCircle className="w-5 h-5 text-slate-600" />
            <span>Немає записів за даним фільтром</span>
          </div>
        ) : (
          filteredLogs.map(entry => (
            <div
              key={entry.id}
              className="flex items-start gap-2 p-1.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-colors text-xs leading-relaxed"
            >
              {/* Round & Timestamp */}
              <div className="flex flex-col items-center shrink-0 min-w-[44px] gap-0.5 pt-0.5">
                <span className="px-1 py-0.2 rounded bg-slate-800 text-[9px] font-mono font-bold text-slate-400">
                  Р{entry.round}
                </span>
                <span className="text-[9px] font-mono text-slate-500">
                  {entry.timestamp}
                </span>
              </div>

              {/* Type Badge */}
              <div className="shrink-0 pt-0.5">
                {getTypeBadge(entry.type)}
              </div>

              {/* Player Tag if present */}
              {entry.playerName && (
                <div className="flex items-center gap-1 shrink-0 pt-0.5">
                  <span className={`w-2 h-2 rounded-full border ${getPlayerColorDot(entry.playerColor)}`} />
                  <span className="font-bold text-[11px] text-slate-300 truncate max-w-[90px]">
                    {entry.playerName}:
                  </span>
                </div>
              )}

              {/* Log Message Text */}
              <div className="text-slate-200 text-[11px] flex-1 break-words pt-0.5">
                {renderFormattedText(entry.text)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
