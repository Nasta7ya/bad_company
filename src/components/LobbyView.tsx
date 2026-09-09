import React, { useState } from 'react';
import { GameMode, PlayerColor } from '../types/game';
import { sound } from '../utils/audio';
import { Users, Bot, ShieldAlert, Globe, Play, HelpCircle, Volume2, VolumeX, Sparkles, Plus, Award } from 'lucide-react';

interface LobbyViewProps {
  onStartVsAI: (playerName: string, botCount: number, playerColor: PlayerColor) => void;
  onStartSoloChallenge: (playerName: string, playerColor: PlayerColor) => void;
  onStartPassAndPlay: (playerNames: string[], colors: PlayerColor[]) => void;
  onCreateOnlineRoom: (playerName: string, playerColor: PlayerColor) => void;
  onJoinOnlineRoom: (roomCode: string, playerName: string, playerColor: PlayerColor) => void;
  onOpenRules: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  isConnecting?: boolean;
}

export const LobbyView: React.FC<LobbyViewProps> = ({
  onStartVsAI,
  onStartSoloChallenge,
  onStartPassAndPlay,
  onCreateOnlineRoom,
  onJoinOnlineRoom,
  onOpenRules,
  isMuted,
  onToggleMute,
  isConnecting = false,
}) => {
  const [activeTab, setActiveTab] = useState<'ai' | 'solo' | 'pass_play' | 'online'>('ai');
  const [playerName, setPlayerName] = useState<string>('Бос Алекса');
  const [selectedColor, setSelectedColor] = useState<PlayerColor>('red');
  const [botCount, setBotCount] = useState<number>(3);

  // Pass and play states
  const [passPlayPlayers, setPassPlayPlayers] = useState<string[]>(['Гравець 1', 'Гравець 2', 'Гравець 3']);

  // Online multiplayer states
  const [roomCodeInput, setRoomCodeInput] = useState<string>('');

  const colors: { color: PlayerColor; label: string; hex: string }[] = [
    { color: 'red', label: 'Червоний', hex: 'bg-red-500' },
    { color: 'blue', label: 'Синій', hex: 'bg-blue-500' },
    { color: 'yellow', label: 'Жовтий', hex: 'bg-yellow-400' },
    { color: 'green', label: 'Зелений', hex: 'bg-emerald-500' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 selection:bg-amber-500 selection:text-slate-950">
      {/* Background ambient lighting */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-2xl w-full z-10 space-y-6">
        {/* Main Title & Brand */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-700/80 text-amber-300 text-xs font-semibold shadow-inner mb-2">
            <span>🎲</span>
            <span>Офіційна адаптація хіта «Bad Company» від Rozum</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white uppercase drop-shadow-md">
            ПОГАНА <span className="text-amber-400">КОМПАНІЯ</span>
          </h1>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Зберіть найзухвалішу банду міста, плануйте пограбування, кидайте кубики та тікайте від невпинної поліцейської погоні!
          </p>

          <div className="flex items-center justify-center gap-2 pt-1">
            <button
              id="btn-rules-lobby"
              type="button"
              onClick={onOpenRules}
              className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>Правила гри</span>
            </button>

            <button
              id="btn-mute-lobby"
              type="button"
              onClick={onToggleMute}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 transition-colors cursor-pointer"
              title={isMuted ? 'Увімкнути звук' : 'Вимкнути звук'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>
          </div>
        </div>

        {/* Mode Selector Card */}
        <div className="bg-slate-900/90 border border-slate-700/80 rounded-3xl p-6 shadow-2xl backdrop-blur-md space-y-6">
          {/* Mode Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-1 rounded-2xl bg-slate-950/80 border border-slate-800">
            <button
              id="tab-mode-ai"
              type="button"
              onClick={() => {
                sound.playClick();
                setActiveTab('ai');
              }}
              className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1 cursor-pointer ${
                activeTab === 'ai' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Bot className="w-4 h-4" />
              <span>З Комп'ютером</span>
            </button>

            <button
              id="tab-mode-solo"
              type="button"
              onClick={() => {
                sound.playClick();
                setActiveTab('solo');
              }}
              className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1 cursor-pointer ${
                activeTab === 'solo' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Соло-виклик</span>
            </button>

            <button
              id="tab-mode-pass-play"
              type="button"
              onClick={() => {
                sound.playClick();
                setActiveTab('pass_play');
              }}
              className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1 cursor-pointer ${
                activeTab === 'pass_play' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Один екран</span>
            </button>

            <button
              id="tab-mode-online"
              type="button"
              onClick={() => {
                sound.playClick();
                setActiveTab('online');
              }}
              className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1 cursor-pointer ${
                activeTab === 'online' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>Онлайн</span>
            </button>
          </div>

          {/* Common Player Identity Setup */}
          <div className="space-y-4 pt-2">
            <div>
              <label htmlFor="player-name-input" className="block text-xs font-semibold text-slate-300 mb-1.5">
                Ваше ім'я або псевдонім ватажка:
              </label>
              <input
                id="player-name-input"
                type="text"
                value={playerName}
                onChange={e => setPlayerName(e.target.value)}
                maxLength={20}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors"
                placeholder="Введіть ім'я..."
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Колір авто та фішок банди:
              </label>
              <div className="grid grid-cols-4 gap-2">
                {colors.map(item => (
                  <button
                    key={item.color}
                    id={`color-choice-${item.color}`}
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      setSelectedColor(item.color);
                    }}
                    className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      selectedColor === item.color
                        ? 'bg-slate-800 border-amber-400 ring-2 ring-amber-400/80 shadow-md'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <span className={`w-3.5 h-3.5 rounded-full ${item.hex}`} />
                    <span className="text-xs font-bold text-slate-200">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Tab Specific Options */}
          {activeTab === 'ai' && (
            <div className="space-y-4 pt-2 border-t border-slate-800">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Кількість комп'ютерних суперників (ШІ):
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3].map(cnt => (
                    <button
                      key={`bot_cnt_${cnt}`}
                      id={`bot-count-${cnt}`}
                      type="button"
                      onClick={() => {
                        sound.playClick();
                        setBotCount(cnt);
                      }}
                      className={`p-2.5 rounded-xl border font-bold text-xs cursor-pointer transition-all ${
                        botCount === cnt
                          ? 'bg-amber-500/20 border-amber-400 text-amber-300 ring-1 ring-amber-400'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {cnt === 1 ? '1 бот (Дуель)' : cnt === 2 ? '2 боти (3 гравці)' : '3 боти (4 гравці)'}
                    </button>
                  ))}
                </div>
              </div>

              <button
                id="btn-start-ai-game"
                type="button"
                onClick={() => onStartVsAI(playerName.trim() || 'Бос', botCount, selectedColor)}
                className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-base shadow-xl transition-transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>Розпочати гру з комп'ютером</span>
              </button>
            </div>
          )}

          {activeTab === 'solo' && (
            <div className="space-y-4 pt-2 border-t border-slate-800">
              <div className="p-3.5 rounded-2xl bg-blue-950/30 border border-blue-500/30 text-xs text-slate-300 space-y-1.5">
                <div className="font-bold text-blue-300 flex items-center gap-1.5 text-sm">
                  <ShieldAlert className="w-4 h-4" />
                  <span>Офіційне соло-випробування проти Поліції</span>
                </div>
                <p>
                  Поліція стартує на клітинці 6 і рухається на <strong>(кубик + 1 крок)</strong> щораунду. Для здобуття кольє потрібно щонайменше 3 однакових трофеї.
                </p>
                <p className="text-amber-300 font-semibold">
                  Мета: завершити 6 пограбувань або дістатися порту до того, як поліція вас наздожене!
                </p>
              </div>

              <button
                id="btn-start-solo-game"
                type="button"
                onClick={() => onStartSoloChallenge(playerName.trim() || 'Одинак', selectedColor)}
                className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-base shadow-xl transition-transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>Розпочати соло-випробування</span>
              </button>
            </div>
          )}

          {activeTab === 'pass_play' && (
            <div className="space-y-4 pt-2 border-t border-slate-800">
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-300">
                  Імена гравців на цьому пристрої:
                </label>
                {passPlayPlayers.map((name, pIdx) => (
                  <div key={`pp_${pIdx}`} className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-slate-800 text-xs font-bold flex items-center justify-center text-slate-400">
                      {pIdx + 1}
                    </span>
                    <input
                      type="text"
                      value={name}
                      onChange={e => {
                        const updated = [...passPlayPlayers];
                        updated[pIdx] = e.target.value;
                        setPassPlayPlayers(updated);
                      }}
                      className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm focus:border-amber-400 focus:outline-none"
                    />
                    {passPlayPlayers.length > 2 && (
                      <button
                        type="button"
                        onClick={() => setPassPlayPlayers(passPlayPlayers.filter((_, i) => i !== pIdx))}
                        className="p-2 text-slate-500 hover:text-red-400"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}

                {passPlayPlayers.length < 4 && (
                  <button
                    type="button"
                    onClick={() => setPassPlayPlayers([...passPlayPlayers, `Гравець ${passPlayPlayers.length + 1}`])}
                    className="text-xs text-amber-400 hover:underline flex items-center gap-1 font-bold pt-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Додати гравця (макс 4)</span>
                  </button>
                )}
              </div>

              <button
                id="btn-start-pass-play-game"
                type="button"
                onClick={() => {
                  const palette: PlayerColor[] = ['red', 'blue', 'yellow', 'green'];
                  onStartPassAndPlay(passPlayPlayers, palette.slice(0, passPlayPlayers.length));
                }}
                className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-base shadow-xl transition-transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>Розпочати гру для {passPlayPlayers.length} гравців</span>
              </button>
            </div>
          )}

          {activeTab === 'online' && (
            <div className="space-y-4 pt-2 border-t border-slate-800">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Create Room */}
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="font-bold text-sm text-slate-200 mb-1">Створити нову кімнату</div>
                    <p className="text-xs text-slate-400">
                      Створіть онлайн-стіл, запросіть до 3 друзів за 4-значним кодом.
                    </p>
                  </div>
                  <button
                    id="btn-create-online-room"
                    type="button"
                    onClick={() => onCreateOnlineRoom(playerName.trim() || 'Бос', selectedColor)}
                    disabled={isConnecting}
                    className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs shadow transition-transform active:scale-95 cursor-pointer"
                  >
                    {isConnecting ? 'Підключення...' : 'Створити кімнату'}
                  </button>
                </div>

                {/* Join Room */}
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="font-bold text-sm text-slate-200 mb-1">Приєднатися за кодом</div>
                    <input
                      id="room-code-input"
                      type="text"
                      value={roomCodeInput}
                      onChange={e => setRoomCodeInput(e.target.value.toUpperCase())}
                      placeholder="Введіть 4 літери (напр. HEIS)"
                      maxLength={6}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm tracking-widest text-center font-mono font-bold focus:border-amber-400 focus:outline-none mt-1"
                    />
                  </div>
                  <button
                    id="btn-join-online-room"
                    type="button"
                    onClick={() => onJoinOnlineRoom(roomCodeInput.trim(), playerName.trim() || 'Гість', selectedColor)}
                    disabled={!roomCodeInput.trim() || isConnecting}
                    className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 font-bold text-xs border border-slate-700 shadow transition-transform active:scale-95 cursor-pointer"
                  >
                    {isConnecting ? 'Підключення...' : 'Увійти в гру'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
