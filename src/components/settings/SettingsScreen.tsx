import React, { useState } from 'react';
import { Save, RotateCcw, Download, Upload } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import { formatDate, formatCurrency } from '../../utils/formatting';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Modal from '../ui/Modal';

export default function SettingsScreen() {
  const { player, time, saveGame, resetGame, saveDate } = useGameStore();
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleExport = () => {
    const saveData = localStorage.getItem('stockgame-save');
    if (!saveData) return;
    const blob = new Blob([saveData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stockgame-save-day${time.totalDays}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const text = await file.text();
      try {
        JSON.parse(text);
        localStorage.setItem('stockgame-save', text);
        window.location.reload();
      } catch {
        alert('Invalid save file');
      }
    };
    input.click();
  };

  return (
    <div className="screen-content h-full overflow-y-auto p-4 space-y-4">
      <h1 className="text-lg font-bold text-white">Settings & Save Management</h1>

      {/* Game Info */}
      <Card title="Current Game" padding="md">
        {player ? (
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-[10px] text-gray-500 uppercase mb-0.5">Player</div>
              <div className="text-sm font-semibold text-white">{player.name}</div>
              <div className="text-[11px] text-gray-500">{player.archetype}</div>
            </div>
            <div>
              <div className="text-[10px] text-gray-500 uppercase mb-0.5">Game Day</div>
              <div className="text-sm font-semibold text-white">{formatDate(time.totalDays)}</div>
              <div className="text-[11px] text-gray-500">Day {time.totalDays} | Year {time.year}</div>
            </div>
            <div>
              <div className="text-[10px] text-gray-500 uppercase mb-0.5">Net Worth</div>
              <div className="text-sm font-bold text-accent-green">{formatCurrency(player.finances.totalNetWorth, true)}</div>
              <div className="text-[11px] text-gray-500">Level {player.level}</div>
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-500">No game in progress</div>
        )}
      </Card>

      {/* Save/Load */}
      <Card title="Save & Load" padding="md">
        <div className="grid grid-cols-2 gap-3">
          <Button variant="primary" onClick={saveGame} icon={<Save size={14} />} fullWidth>
            Save Game
          </Button>
          <Button variant="secondary" onClick={handleExport} icon={<Download size={14} />} fullWidth>
            Export Save File
          </Button>
          <Button variant="secondary" onClick={handleImport} icon={<Upload size={14} />} fullWidth>
            Import Save File
          </Button>
          <Button variant="danger" onClick={() => setShowResetConfirm(true)} icon={<RotateCcw size={14} />} fullWidth>
            New Game
          </Button>
        </div>
        {saveDate > 0 && (
          <div className="text-[10px] text-gray-600 mt-2">
            Last saved: {new Date(saveDate).toLocaleString()}
          </div>
        )}
      </Card>

      {/* How to Play */}
      <Card title="How to Play" padding="md">
        <div className="space-y-3 text-sm text-gray-400">
          <div>
            <div className="text-xs font-semibold text-white mb-1">🎮 Core Loop</div>
            <p>Use the <strong className="text-gray-200">Action Bar</strong> at the bottom to Work, Rest, Study, Exercise, or Network each day. Use <strong className="text-gray-200">+1 Day</strong> to advance time or <strong className="text-gray-200">+1 Week</strong> to fast-forward.</p>
          </div>
          <div>
            <div className="text-xs font-semibold text-white mb-1">📈 Investing</div>
            <p>Go to <strong className="text-gray-200">Market</strong> to browse and buy stocks, ETFs, and crypto. Click any row to see the full analysis and trading panel.</p>
          </div>
          <div>
            <div className="text-xs font-semibold text-white mb-1">💼 Career</div>
            <p>Apply for better jobs as your skills grow. Work each day to earn wages and gain experience. Higher tiers pay massively more.</p>
          </div>
          <div>
            <div className="text-xs font-semibold text-white mb-1">🎓 Skills</div>
            <p>Study skills to unlock new game mechanics and improve performance. Finance, Trading, Options, Quant, and more.</p>
          </div>
          <div>
            <div className="text-xs font-semibold text-white mb-1">⚡ Events</div>
            <p>Random events will appear every ~7 days. Make smart choices — they can dramatically change your path.</p>
          </div>
          <div>
            <div className="text-xs font-semibold text-white mb-1">🏛️ End Game</div>
            <p>Build toward launching a Hedge Fund, managing billions in AUM, and achieving billionaire status.</p>
          </div>
        </div>
      </Card>

      {/* Reset confirm */}
      <Modal isOpen={showResetConfirm} onClose={() => setShowResetConfirm(false)} title="Start New Game?" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-400">
            Are you sure? This will erase all progress and start a completely new game. This cannot be undone.
          </p>
          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={() => setShowResetConfirm(false)}>
              Cancel
            </Button>
            <Button variant="danger" fullWidth onClick={() => { resetGame(); setShowResetConfirm(false); }}>
              Yes, Start Over
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
