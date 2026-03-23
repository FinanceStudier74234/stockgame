import React from 'react';
import { Zap, Lock } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import Card from '../ui/Card';
import Badge from '../ui/Badge';

export default function OptionsScreen() {
  const { player } = useGameStore();
  if (!player) return null;

  const hasOptions = player.unlockedMechanics.includes('options_trading');

  if (!hasOptions) {
    return (
      <div className="screen-content h-full flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <Lock size={48} className="text-gray-600 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-gray-400 mb-2">Options Trading Locked</h2>
          <p className="text-sm text-gray-500 mb-4">Study the Options skill to at least level 15 to unlock options trading.</p>
          <Badge variant="yellow" size="sm">Study Options skill ≥ 15</Badge>
        </div>
      </div>
    );
  }

  return (
    <div className="screen-content h-full overflow-y-auto p-4 space-y-4">
      <div className="flex items-center gap-3">
        <Zap size={20} className="text-accent-yellow" />
        <h1 className="text-lg font-bold text-white">Options Trading</h1>
        <Badge variant="yellow" size="xs">Advanced</Badge>
      </div>

      <Card padding="md">
        <div className="text-center py-8">
          <div className="text-5xl mb-4">🎯</div>
          <h2 className="text-lg font-bold text-white mb-2">Options System</h2>
          <p className="text-sm text-gray-400 mb-4">Full options chain with calls, puts, expirations, and Greeks — coming in Phase 2.</p>
          <div className="grid grid-cols-3 gap-3 max-w-lg mx-auto">
            {['Call Options', 'Put Options', 'Spreads', 'Straddles', 'Iron Condors', 'Theta Decay'].map(f => (
              <div key={f} className="bg-dark-600 rounded-lg p-2 text-xs text-gray-500">{f}</div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
