import React, { useState } from 'react';
import { AlertTriangle, TrendingUp, TrendingDown, Zap, DollarSign } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import { GameEvent, EventChoice } from '../../types';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Modal from '../ui/Modal';

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  career: <span className="text-2xl">💼</span>,
  market: <span className="text-2xl">📈</span>,
  personal: <span className="text-2xl">🧘</span>,
  business: <span className="text-2xl">🏪</span>,
  fund: <span className="text-2xl">🏛️</span>,
  economic: <span className="text-2xl">🌍</span>,
  black_swan: <span className="text-2xl">🦢</span>,
  opportunity: <span className="text-2xl">⭐</span>,
  crisis: <span className="text-2xl">⚡</span>,
};

function ChoiceCard({ choice, onSelect, disabled }: {
  choice: EventChoice;
  onSelect: () => void;
  disabled?: boolean;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onSelect}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`
        w-full text-left p-4 rounded-xl border transition-all
        ${disabled ? 'opacity-40 cursor-not-allowed border-dark-400 bg-dark-600' :
          hovered
            ? 'border-accent-blue bg-accent-blue/10 shadow-[0_0_15px_rgba(59,130,246,0.15)]'
            : 'border-dark-300 bg-dark-600 hover:border-dark-200'}
      `}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="font-semibold text-sm text-white">{choice.label}</div>
        <div className="flex gap-2 flex-shrink-0 ml-2">
          <div className="text-center">
            <div className="text-[8px] text-gray-600 uppercase">Risk</div>
            <div className={`text-xs font-bold num ${choice.risk > 70 ? 'text-accent-red' : choice.risk > 40 ? 'text-accent-yellow' : 'text-accent-green'}`}>
              {choice.risk}%
            </div>
          </div>
          <div className="text-center">
            <div className="text-[8px] text-gray-600 uppercase">Reward</div>
            <div className={`text-xs font-bold num ${choice.rewardPotential > 70 ? 'text-accent-green' : choice.rewardPotential > 40 ? 'text-accent-blue' : 'text-gray-400'}`}>
              {choice.rewardPotential}%
            </div>
          </div>
        </div>
      </div>
      <p className="text-[11px] text-gray-400 leading-relaxed">{choice.description}</p>
      {choice.requiresCash && (
        <div className="mt-2 text-[10px] text-accent-yellow flex items-center gap-1">
          <DollarSign size={10} />
          Requires ${choice.requiresCash.toLocaleString()} cash
        </div>
      )}
      {choice.requiresSkill && (
        <div className="mt-1 flex gap-1 flex-wrap">
          {Object.entries(choice.requiresSkill).map(([skill, val]) => (
            <Badge key={skill} variant="purple" size="xs">Need {skill} ≥ {val}</Badge>
          ))}
        </div>
      )}
    </button>
  );
}

export default function EventModal() {
  const { events, player, resolveEvent, dismissEvent } = useGameStore();
  const event = events.activeEvent;
  if (!event || !player) return null;

  const canMakeChoice = (choice: EventChoice): boolean => {
    if (choice.requiresCash && player.finances.cash < choice.requiresCash) return false;
    if (choice.requiresSkill) {
      for (const [skill, req] of Object.entries(choice.requiresSkill)) {
        if ((player.skills[skill as keyof typeof player.skills] || 0) < (req as number)) return false;
      }
    }
    return true;
  };

  return (
    <Modal isOpen={true} onClose={dismissEvent} title="" size="lg" showClose={false}>
      <div className="space-y-4">
        {/* Event header */}
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            {CATEGORY_ICONS[event.category] || <span className="text-2xl">❓</span>}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-lg font-bold text-white">{event.title}</h2>
              <Badge
                variant={event.category === 'black_swan' ? 'red' : event.category === 'opportunity' ? 'green' : 'blue'}
                size="xs"
              >
                {event.category.replace('_', ' ')}
              </Badge>
            </div>
            <p className="text-sm text-gray-300 leading-relaxed">{event.description}</p>
            {event.flavor && (
              <p className="text-xs text-gray-500 italic mt-2 border-l-2 border-dark-300 pl-3">
                {event.flavor}
              </p>
            )}
          </div>
        </div>

        {/* Choices */}
        <div>
          <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-3">Choose your response:</div>
          <div className="space-y-2">
            {event.choices.map(choice => (
              <ChoiceCard
                key={choice.id}
                choice={choice}
                onSelect={() => resolveEvent(event.id, choice.id)}
                disabled={!canMakeChoice(choice)}
              />
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={dismissEvent}
            className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
          >
            Skip / Dismiss (miss the opportunity)
          </button>
        </div>
      </div>
    </Modal>
  );
}
