import React, { useState } from 'react';
import { GameState, PlayerState } from '../types/game';
import {
  Sparkles,
  Dices,
  Layers,
  Zap,
  UserPlus,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle2,
  Clock,
} from 'lucide-react';

interface TurnGuidanceBarProps {
  gameState: GameState;
  currentPlayerId: string;
  isModalOpen?: boolean;
  onQuickAction?: () => void;
}

export const TurnGuidanceBar: React.FC<TurnGuidanceBarProps> = ({
  gameState,
  currentPlayerId,
  isModalOpen = false,
}) => {
  const [showTips, setShowTips] = useState<boolean>(false);

  const currentPlayer = gameState.players.find(p => p.id === currentPlayerId);
  const bossPlayer = gameState.players[gameState.bossPlayerIndex];
  const isCurrentPlayerBoss = bossPlayer?.id === currentPlayerId;

  const playerAction = gameState.playerActions[currentPlayerId];
  const hasPlayerActivated = playerAction?.resolved;

  // Derive guidance message and urgency
  let title = '';
  let description = '';
  let badgeText = '';
  let badgeColor = 'bg-slate-800 text-slate-200 border-slate-700';
  let isWaitingForMe = false;
  let tipDetails: string[] = [];

  switch (gameState.phase) {
    case 'rolling':
      if (isCurrentPlayerBoss) {
        if (!gameState.hasRolled) {
          badgeText = 'Ваш хід: Кидок';
          badgeColor = 'bg-amber-500 text-slate-950 border-amber-400 animate-pulse';
          title = 'Ви — Бос цього раунду! Киньте кубики';
          description = 'Натисніть велику золоту кнопку «Кинути кубики» праворуч від грального столу.';
          isWaitingForMe = true;
          tipDetails = [
            'Ви кидаєте 4 золоті кубики банди та 1 чорний кубик поліції.',
            'Після першого кидка ви зможете сплатити $1 за перекидання будь-яких кубиків, якщо результат вам не підходить.',
          ];
        } else {
          badgeText = 'Ваш хід: Перекидання';
          badgeColor = 'bg-amber-500 text-slate-950 border-amber-400';
          title = 'Оцініть кидок або підтвердіть';
          description = 'Виберіть кубики, які хочете перекинути (коштує $1), або натисніть «Підтвердити кидок».';
          isWaitingForMe = true;
          tipDetails = [
            'Якщо вас влаштовують значення — натисніть «Підтвердити кидок».',
            'Сплата $1 за перекидання береться з вашого балансу монет.',
          ];
        }
      } else {
        badgeText = 'Очікування Боса';
        badgeColor = 'bg-slate-800 text-slate-300 border-slate-700';
        title = `Бос ${bossPlayer?.name || 'гравець'} кидає кубики...`;
        description = 'Зачекайте, поки Бос завершить кидки та визначить пари кубиків для всіх гравців.';
        isWaitingForMe = false;
        tipDetails = [
          'Усі гравці користаються кубиками, які кине Бос.',
          'Коли Бос визначить пари, ви зможете активувати свого бандита!',
        ];
      }
      break;

    case 'pairing':
      if (isCurrentPlayerBoss) {
        badgeText = 'Ваш хід: Пари';
        badgeColor = 'bg-amber-500 text-slate-950 border-amber-400 animate-pulse';
        title = 'Сформуйте 2 пари золотих кубиків';
        description = 'Оберіть 2 кубики для пари А, інші 2 автоматично складуть пару B.';
        isWaitingForMe = true;
        tipDetails = [
          'Як Бос, ви зможете активувати ОБИДВА отримані числа (наприклад, і 7, і 8).',
          'Інші гравці (спільники) зможуть обрати лише ОДНЕ з цих двох чисел.',
        ];
      } else {
        badgeText = 'Бос формує пари';
        badgeColor = 'bg-slate-800 text-slate-300 border-slate-700';
        title = `Бос ${bossPlayer?.name || 'гравець'} обирає пари чисел...`;
        description = 'Бос вирішує, які дві суми будуть активовані в цьому раунді.';
        isWaitingForMe = false;
        tipDetails = [
          'Щойно пари будуть готові, на вашому планшеті підсвітяться відповідні номери бандитів.',
        ];
      }
      break;

    case 'activating':
      if (isModalOpen) {
        badgeText = 'Розподіл символів';
        badgeColor = 'bg-emerald-500 text-slate-950 border-emerald-400';
        title = 'Розподіліть отримані інструменти у модальному вікні';
        description = 'Оберіть справу або завдання на планшеті, куди покласти маски, рукавички, відмички чи ліхтарики.';
        isWaitingForMe = true;
        tipDetails = [
          'Викладайте інструменти на активні справи, щоб закрити їх та отримати ПО.',
          'Або кладіть їх на треки під бандитами #2 чи #12 для джокерів, авто чи монет.',
        ];
      } else if (!hasPlayerActivated) {
        badgeText = 'Ваша черга діяти';
        badgeColor = 'bg-emerald-500 text-slate-950 border-emerald-400 animate-pulse';
        isWaitingForMe = true;
        const sumA = gameState.bossPairs?.sumA;
        const sumB = gameState.bossPairs?.sumB;
        const isSameSums = sumA !== undefined && sumA === sumB;

        if (isCurrentPlayerBoss) {
          const activatedCount = playerAction?.activatedSums?.length || 0;
          if (isSameSums) {
            title = `Босе, активуйте бандита #${sumA} ДВІЧІ (активовано: ${activatedCount}/2)`;
            description =
              activatedCount === 0
                ? `Обидві пари кубиків склали #${sumA}. Активуйте перший раз.`
                : `Першу активацію виконано! Активуйте #${sumA} вдруге.`;
          } else {
            title = `Босе, активуйте бандита #${sumA} та #${sumB} (активовано: ${activatedCount}/2)`;
            description = 'Натисніть на підсвіченого бандита на вашому планшеті нижче, щоб отримати ресурси.';
          }
        } else {
          if (isSameSums) {
            title = `Обидві пари дали однакове число: #${sumA}`;
            description = `Натисніть «Активувати #${sumA}» або на слот на своєму планшеті.`;
          } else {
            title = `Оберіть одного бандита: #${sumA} або #${sumB}`;
            description = 'Натисніть на номер відповідного бандита на вашому планшеті нижче.';
          }
        }
        tipDetails = [
          'Стовпчики підсвічені золотим сяйвом на планшеті.',
          'Якщо активується номер 2 (Навідник) — ви зможете обрати, який саме інструмент скопіювати з інших бандитів.',
        ];
      } else {
        badgeText = 'Вибір зроблено';
        badgeColor = 'bg-slate-800 text-slate-300 border-slate-700';
        title = 'Ви вже активували свого бандита!';
        description = 'Очікуємо, поки інші гравці завершать активацію своїх спільників.';
        isWaitingForMe = false;
        tipDetails = [
          'Коли всі гравці завершать свій вибір, гра автоматично перейде до фази вербування.',
        ];
      }
      break;

    case 'recruiting':
      if (isCurrentPlayerBoss) {
        badgeText = 'Вербування Боса';
        badgeColor = 'bg-purple-500 text-white border-purple-400 animate-pulse';
        title = 'Фаза вербування (хвилина слави Боса)';
        description = 'Ви можете найняти нового члена банди за монети (кнопка «Вербувати») або натиснути «Завершити хід Боса».';
        isWaitingForMe = true;
        tipDetails = [
          'Вартість вербування вказана на треку вербувальника під вашим планшетом.',
          'Ви дивитесь 3 карти оновлень і обираєте 1, яка посилює відповідного бандита новими символами назавжди.',
          'Якщо монет недостатньо або не хочете наймати — просто натисніть «Завершити хід Боса».',
        ];
      } else {
        badgeText = 'Хід Боса';
        badgeColor = 'bg-slate-800 text-slate-300 border-slate-700';
        title = `Бос ${bossPlayer?.name || 'гравець'} проводить вербування або завершує раунд...`;
        description = 'Лише поточний Бос раунду може здійснювати вербування оновлень за монети.';
        isWaitingForMe = false;
        tipDetails = [
          'У наступному раунді жетон Боса перейде за годинниковою стрілкою до наступного гравця.',
        ];
      }
      break;

    case 'game_over':
      badgeText = 'Фінал гри';
      badgeColor = 'bg-amber-500 text-slate-950 border-amber-400';
      title = 'Гру завершено!';
      description = 'Перегляньте фінальні підсумки та переможця у вікні нагородження.';
      isWaitingForMe = false;
      tipDetails = ['Перемагає той, хто набрав найбільше переможних очок (ПО).'];
      break;

    default:
      title = 'Гра триває';
      description = 'Слідкуйте за подіями на ігровому столі.';
  }

  return (
    <div
      id="turn-guidance-bar"
      className={`relative overflow-hidden rounded-2xl border-2 transition-all duration-300 shadow-xl ${
        isWaitingForMe
          ? 'bg-slate-900/95 border-amber-400/90 ring-4 ring-amber-500/20'
          : 'bg-slate-900/85 border-slate-800'
      } p-3.5 sm:p-4 text-white`}
    >
      {/* Background glow accent for active turn */}
      {isWaitingForMe && (
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 relative z-10">
        {/* Left Side: Status Dot + Phase Badge + Main Title */}
        <div className="flex items-start sm:items-center gap-3">
          {/* Live pulsing status icon */}
          <div className="mt-0.5 sm:mt-0 flex-shrink-0">
            {isWaitingForMe ? (
              <div className="relative flex items-center justify-center w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400 text-amber-300 shadow-inner">
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                </span>
                <Sparkles className="w-5 h-5 animate-spin-slow text-amber-300" />
              </div>
            ) : (
              <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-slate-800 border border-slate-700 text-slate-400">
                <Clock className="w-5 h-5 animate-pulse" />
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider border shadow-sm ${badgeColor}`}
              >
                {badgeText}
              </span>

              <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
                <span>Раунд {gameState.round}</span>
                <span>•</span>
                <span>Бос:</span>
                <span className="text-amber-300 font-bold">{bossPlayer?.name}</span>
              </span>
            </div>

            <h2 className="text-sm sm:text-base font-black text-slate-100 flex items-center gap-1.5 leading-tight">
              <span>{title}</span>
            </h2>

            <p className="text-xs text-slate-300 mt-0.5 leading-normal max-w-2xl">
              {description}
            </p>
          </div>
        </div>

        {/* Right Side: Quick Action or Tips Button */}
        <div className="flex items-center gap-2 self-end md:self-center flex-shrink-0">
          <button
            type="button"
            id="toggle-guidance-tips-btn"
            onClick={() => setShowTips(prev => !prev)}
            className="px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-750 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>{showTips ? 'Сховати підказки' : 'Що робити?'}</span>
            {showTips ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Expandable Tips Dropdown */}
      {showTips && tipDetails.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-800 text-xs text-slate-300 space-y-1.5 animate-in fade-in duration-150">
          <div className="font-bold text-amber-300 flex items-center gap-1.5 mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Корисна інформація для цієї фази:</span>
          </div>
          <ul className="space-y-1 list-disc list-inside text-slate-300 text-[12px] leading-relaxed">
            {tipDetails.map((tip, idx) => (
              <li key={`tip_${idx}`} className="text-slate-300">
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
