import React, { useState } from 'react';
import { TrendingUp, ChevronRight, Star, Zap } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { ARCHETYPES } from '../data/archetypes';
import Button from '../components/ui/Button';
import { formatCurrency } from '../utils/formatting';

const DIFFICULTY_OPTIONS = [
  { id: 'casual', label: 'Casual', description: 'Relaxed market conditions, generous starting funds, slower pace', icon: '🌱', color: 'text-accent-green' },
  { id: 'standard', label: 'Standard', description: 'Balanced challenge, realistic market cycles', icon: '⚖️', color: 'text-accent-blue' },
  { id: 'hard', label: 'Hard', description: 'Tougher market, stricter requirements, less margin for error', icon: '🔥', color: 'text-accent-yellow' },
  { id: 'brutal', label: 'Wall Street Brutal', description: 'Maximum difficulty. One mistake can end everything.', icon: '💀', color: 'text-accent-red' },
  { id: 'rags_to_titan', label: 'Rags to Titan', description: 'Start with almost nothing. Every dollar matters.', icon: '🚀', color: 'text-gold' },
];

export default function StartPage() {
  const { startNewGame, isNewGame, player, setScreen } = useGameStore();
  const [step, setStep] = useState<'intro' | 'name' | 'archetype' | 'difficulty'>('intro');
  const [playerName, setPlayerName] = useState('');
  const [selectedArchetype, setSelectedArchetype] = useState('broke_retail');
  const [selectedDifficulty, setSelectedDifficulty] = useState('standard');

  const archetype = ARCHETYPES.find(a => a.id === selectedArchetype)!;

  const handleStart = () => {
    const name = playerName.trim() || 'The Player';
    startNewGame(selectedArchetype, name, selectedDifficulty);
  };

  // If already in game, show continue option
  if (!isNewGame && player) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="text-5xl mb-4">💹</div>
          <h1 className="text-3xl font-bold text-white">Stock Empire</h1>
          <div className="card p-6 space-y-2">
            <div className="text-sm text-gray-400">Continue as</div>
            <div className="text-xl font-bold text-white">{player.name}</div>
            <div className="text-sm text-accent-green">{formatCurrency(player.finances.totalNetWorth, true)} net worth</div>
            <div className="text-xs text-gray-500">Level {player.level} · {player.city}</div>
          </div>
          <div className="flex gap-3">
            <Button variant="primary" size="lg" fullWidth onClick={() => setScreen('dashboard')}>
              Continue Game
            </Button>
            <Button variant="ghost" size="lg" onClick={() => { setStep('intro'); }}>
              New Game
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4 overflow-y-auto">
      <div className="max-w-3xl w-full">

        {step === 'intro' && (
          <div className="text-center space-y-8">
            <div>
              <div className="text-7xl mb-4 animate-pulse-slow">💹</div>
              <h1 className="text-5xl font-bold text-white mb-3">
                <span className="text-gradient-green">Stock Empire</span>
              </h1>
              <p className="text-lg text-gray-400 max-w-lg mx-auto leading-relaxed">
                From broke to billionaire. Start with nothing, build everything.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
              {[
                { icon: '📈', label: 'Real Market Simulation', desc: 'Dynamic stocks, sectors, and economic cycles' },
                { icon: '🏛️', label: 'Build a Hedge Fund', desc: 'Raise capital, manage LPs, earn fees' },
                { icon: '🧠', label: 'Deep Progression', desc: 'Skills, jobs, businesses, and empire building' },
              ].map(item => (
                <div key={item.label} className="card p-4 text-center">
                  <div className="text-3xl mb-2">{item.icon}</div>
                  <div className="text-xs font-semibold text-white mb-1">{item.label}</div>
                  <div className="text-[10px] text-gray-500">{item.desc}</div>
                </div>
              ))}
            </div>

            <Button variant="primary" size="lg" onClick={() => setStep('name')} className="px-12">
              Begin Your Journey <ChevronRight size={16} className="ml-1" />
            </Button>
          </div>
        )}

        {step === 'name' && (
          <div className="max-w-md mx-auto space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-2">What's your name?</h2>
              <p className="text-sm text-gray-400">This is the name that will be remembered in financial history.</p>
            </div>
            <input
              type="text"
              placeholder="Enter your name..."
              value={playerName}
              onChange={e => setPlayerName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && setStep('archetype')}
              autoFocus
              className="w-full bg-dark-600 border border-dark-400 focus:border-accent-blue rounded-xl px-4 py-3 text-lg text-white placeholder-gray-600 focus:outline-none text-center"
            />
            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => setStep('intro')} fullWidth>Back</Button>
              <Button variant="primary" onClick={() => setStep('archetype')} fullWidth>
                Continue →
              </Button>
            </div>
          </div>
        )}

        {step === 'archetype' && (
          <div className="space-y-4">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-2">Choose Your Background</h2>
              <p className="text-sm text-gray-400">Your starting point shapes your early game challenges and advantages.</p>
            </div>

            <div className="grid grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-1">
              {ARCHETYPES.map(arch => (
                <button
                  key={arch.id}
                  onClick={() => setSelectedArchetype(arch.id)}
                  className={`
                    text-left p-4 rounded-xl border transition-all
                    ${selectedArchetype === arch.id
                      ? 'border-accent-blue bg-accent-blue/10 shadow-[0_0_20px_rgba(59,130,246,0.15)]'
                      : 'border-dark-400 bg-dark-600 hover:border-dark-300'}
                  `}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-3xl">{arch.emoji}</span>
                    <div>
                      <div className="font-bold text-sm text-white mb-0.5">{arch.name}</div>
                      <div className="text-[11px] text-gray-400 leading-relaxed mb-2">{arch.description}</div>
                      <div className="flex flex-wrap gap-1">
                        <span className="text-[10px] bg-dark-500 text-gray-400 px-2 py-0.5 rounded">
                          💰 ${(arch.startingFinances.cash || 0).toLocaleString()}
                        </span>
                        {(arch.startingFinances.totalDebt || 0) > 0 && (
                          <span className="text-[10px] bg-accent-red/10 text-accent-red px-2 py-0.5 rounded">
                            💳 ${(arch.startingFinances.totalDebt || 0).toLocaleString()} debt
                          </span>
                        )}
                        <span className="text-[10px] bg-dark-500 text-gray-500 px-2 py-0.5 rounded">
                          📍 {arch.startingCity}
                        </span>
                        <span className="text-[10px]">
                          {'⭐'.repeat(arch.difficulty)}{'☆'.repeat(5 - arch.difficulty)}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="ghost" onClick={() => setStep('name')} fullWidth>Back</Button>
              <Button variant="primary" onClick={() => setStep('difficulty')} fullWidth>
                Next: Difficulty →
              </Button>
            </div>
          </div>
        )}

        {step === 'difficulty' && (
          <div className="space-y-4">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-2">Choose Difficulty</h2>
              <p className="text-sm text-gray-400">How hard do you want the road to billions to be?</p>
            </div>

            <div className="space-y-2">
              {DIFFICULTY_OPTIONS.map(diff => (
                <button
                  key={diff.id}
                  onClick={() => setSelectedDifficulty(diff.id)}
                  className={`
                    w-full text-left p-4 rounded-xl border transition-all flex items-center gap-4
                    ${selectedDifficulty === diff.id
                      ? 'border-accent-blue bg-accent-blue/10'
                      : 'border-dark-400 bg-dark-600 hover:border-dark-300'}
                  `}
                >
                  <span className="text-3xl">{diff.icon}</span>
                  <div>
                    <div className={`font-bold text-sm ${diff.color}`}>{diff.label}</div>
                    <div className="text-[11px] text-gray-400">{diff.description}</div>
                  </div>
                  {selectedDifficulty === diff.id && (
                    <div className="ml-auto text-accent-blue">✓</div>
                  )}
                </button>
              ))}
            </div>

            {/* Summary */}
            <div className="card p-4 border-accent-blue/20">
              <div className="text-xs font-semibold text-white mb-2">Your Story Begins:</div>
              <div className="text-sm text-gray-300">
                <span className="text-accent-blue font-medium">{playerName || 'Player'}</span> starts as a{' '}
                <span className="text-accent-green">{archetype.name}</span>{' '}
                in <span className="text-gray-200">{archetype.startingCity}</span>{' '}
                with <span className="text-accent-yellow">${(archetype.startingFinances.cash || 0).toLocaleString()}</span> cash.
              </div>
              <div className="text-xs text-gray-500 mt-1 italic">"{archetype.flavor}"</div>
            </div>

            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => setStep('archetype')} fullWidth>Back</Button>
              <Button variant="gold" size="lg" onClick={handleStart} fullWidth>
                🚀 Start Game
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
