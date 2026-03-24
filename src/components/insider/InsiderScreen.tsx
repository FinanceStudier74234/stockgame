import React, { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { InsiderTip } from '../../types';
import {
  EyeOff, AlertTriangle, Shield, Trash2, TrendingUp, TrendingDown,
  Clock, Zap, Lock, ChevronDown, ChevronUp, Scale, UserCheck
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatting';

function InvestigationBar({ level }: { level: number }) {
  const color =
    level < 40 ? 'bg-accent-green' :
    level < 70 ? 'bg-accent-yellow' :
    'bg-accent-red';
  const label =
    level < 10 ? 'Clean' :
    level < 40 ? 'Radar Ping' :
    level < 70 ? 'Informal Inquiry' :
    level < 95 ? 'FORMAL INVESTIGATION' :
    'CHARGES IMMINENT';

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-[10px] text-gray-400 uppercase tracking-wider">SEC Scrutiny</span>
        <span className={`text-[10px] font-bold ${level >= 70 ? 'text-accent-red animate-pulse' : level >= 40 ? 'text-accent-yellow' : 'text-accent-green'}`}>
          {label} — {level.toFixed(0)}%
        </span>
      </div>
      <div className="h-2 bg-dark-600 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${Math.min(100, level)}%` }}
        />
      </div>
    </div>
  );
}

function TipCard({ tip, onAct }: { tip: InsiderTip; onAct: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const isPositive = tip.expectedMovePercent > 0;
  const riskColor = tip.investigationRiskBase < 45 ? 'text-accent-green' : tip.investigationRiskBase < 65 ? 'text-accent-yellow' : 'text-accent-red';
  const daysLeft = tip.eventFiringDay - useGameStore.getState().time.totalDays;
  const isExpired = tip.isExpired || tip.isRevealed;

  const tipTypeLabel: Record<string, string> = {
    merger_acquisition: 'M&A',
    earnings_beat: 'Earnings Beat',
    earnings_miss: 'Earnings Miss',
    drug_approval: 'Drug Approval',
    drug_rejection: 'Drug Rejection',
    contract_win: 'Contract Win',
    fraud_discovered: 'Fraud Discovered',
    buyout: 'LBO / Buyout',
    ceo_resignation: 'CEO Departure',
    regulatory_approval: 'Regulatory',
    patent_granted: 'Patent',
  };

  return (
    <div className={`border rounded-lg overflow-hidden transition-all duration-200 ${
      isExpired ? 'border-dark-500 opacity-50' :
      tip.isActedOn ? 'border-accent-yellow/40 bg-accent-yellow/5' :
      'border-dark-400 bg-dark-700 hover:border-dark-300'
    }`}>
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-sm font-bold text-white">{tip.ticker}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-dark-500 text-gray-400 uppercase tracking-wide">
                {tipTypeLabel[tip.tipType] || tip.tipType}
              </span>
              {tip.isActedOn && !isExpired && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent-yellow/20 text-accent-yellow font-bold">ACTED ON</span>
              )}
              {tip.isRevealed && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent-blue/20 text-accent-blue font-bold">REVEALED</span>
              )}
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              {tip.isRevealed ? tip.fullDescription : tip.hint}
            </p>
          </div>
          <button
            onClick={() => setExpanded(e => !e)}
            className="text-gray-500 hover:text-gray-300 flex-shrink-0"
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>

        {expanded && (
          <div className="mt-3 pt-3 border-t border-dark-500 grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-[10px] text-gray-500 mb-0.5">Expected Move</div>
              <div className={`text-sm font-bold num ${isPositive ? 'text-accent-green' : 'text-accent-red'}`}>
                {isPositive ? '+' : ''}{tip.expectedMovePercent}%
              </div>
            </div>
            <div>
              <div className="text-[10px] text-gray-500 mb-0.5">Risk Level</div>
              <div className={`text-sm font-bold ${riskColor}`}>{tip.investigationRiskBase}</div>
            </div>
            <div>
              <div className="text-[10px] text-gray-500 mb-0.5">Days Until Event</div>
              <div className={`text-sm font-bold num ${daysLeft <= 3 ? 'text-accent-red' : 'text-gray-200'}`}>
                {isExpired ? '—' : daysLeft}
              </div>
            </div>
          </div>
        )}

        <div className="mt-2 flex items-center justify-between">
          <span className="text-[10px] text-gray-600 italic">Source: {tip.source}</span>
          {!isExpired && !tip.isActedOn && (
            <button
              onClick={() => onAct(tip.id)}
              className="text-xs px-3 py-1 rounded bg-accent-yellow/20 text-accent-yellow hover:bg-accent-yellow/30 border border-accent-yellow/40 font-semibold transition-colors flex items-center gap-1"
            >
              <Zap size={11} />
              Act on This
            </button>
          )}
          {tip.isActedOn && !isExpired && (
            <div className="flex items-center gap-1 text-[10px] text-accent-yellow">
              <Clock size={11} />
              Watching market...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function InsiderScreen() {
  const { insiderTips, secStatus, player, actOnInsiderTip, hireLawyer, destroyEvidence, time } = useGameStore();

  if (!player) return null;

  const activeTips = insiderTips.filter(t => !t.isExpired && !t.isRevealed);
  const revealedTips = insiderTips.filter(t => t.isRevealed || t.isExpired).slice(-8).reverse();
  const hasLawyer = secStatus.hasLawyer;
  const networkOk = player.stats.network >= 20;

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-accent-red/20 flex items-center justify-center">
          <EyeOff size={16} className="text-accent-red" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white">Underground Network</h1>
          <p className="text-xs text-gray-500">High risk, high reward — and the SEC is always watching.</p>
        </div>
        {secStatus.isConvicted && (
          <div className="ml-auto flex items-center gap-1.5 px-2 py-1 rounded bg-accent-red/20 border border-accent-red/40">
            <Scale size={12} className="text-accent-red" />
            <span className="text-xs text-accent-red font-bold">CONVICTED — On Record</span>
          </div>
        )}
      </div>

      {/* SEC Status panel */}
      <div className="bg-dark-800 border border-dark-500 rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle size={14} className="text-accent-yellow" />
          <span className="text-sm font-semibold text-gray-200">SEC Investigation Status</span>
        </div>

        <InvestigationBar level={secStatus.investigationLevel} />

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          <div className="text-center">
            <div className="text-[10px] text-gray-500 mb-0.5">Tips Acted On</div>
            <div className="text-sm font-bold num text-gray-200">{secStatus.tipsActedOn}</div>
          </div>
          <div className="text-center">
            <div className="text-[10px] text-gray-500 mb-0.5">Illegal Profits</div>
            <div className="text-sm font-bold num text-accent-red">{formatCurrency(secStatus.totalIllegalProfits)}</div>
          </div>
          <div className="text-center">
            <div className="text-[10px] text-gray-500 mb-0.5">Fines Paid</div>
            <div className="text-sm font-bold num text-accent-red">{formatCurrency(secStatus.lastFineAmount)}</div>
          </div>
          <div className="text-center">
            <div className="text-[10px] text-gray-500 mb-0.5">Lawyer</div>
            <div className={`text-sm font-bold ${hasLawyer ? 'text-accent-green' : 'text-gray-500'}`}>
              {hasLawyer ? `${secStatus.lawyerDaysRemaining}d` : 'None'}
            </div>
          </div>
        </div>

        {secStatus.isUnderFormalInvestigation && (
          <div className="flex items-center gap-2 p-2 rounded bg-accent-red/10 border border-accent-red/30 mt-2">
            <AlertTriangle size={12} className="text-accent-red flex-shrink-0" />
            <p className="text-xs text-accent-red">Formal investigation is open. Every trade increases risk. Hire a lawyer or destroy evidence immediately.</p>
          </div>
        )}

        {/* Counter-measures */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={hireLawyer}
            disabled={hasLawyer || player.finances.cash < 25000}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded text-xs font-semibold border transition-colors
              disabled:opacity-40 disabled:cursor-not-allowed
              enabled:bg-accent-blue/15 enabled:border-accent-blue/40 enabled:text-accent-blue enabled:hover:bg-accent-blue/25"
          >
            <UserCheck size={13} />
            Hire Lawyer ($25K)
          </button>
          <button
            onClick={destroyEvidence}
            disabled={secStatus.investigationLevel === 0 || player.finances.cash < 15000}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded text-xs font-semibold border transition-colors
              disabled:opacity-40 disabled:cursor-not-allowed
              enabled:bg-accent-red/10 enabled:border-accent-red/30 enabled:text-accent-red enabled:hover:bg-accent-red/20"
          >
            <Trash2 size={13} />
            Destroy Evidence ($15K)
          </button>
        </div>
      </div>

      {/* Access locked if network too low */}
      {!networkOk && (
        <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
          <div className="w-12 h-12 rounded-full bg-dark-600 flex items-center justify-center">
            <Lock size={20} className="text-gray-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-300">Network Too Low</p>
            <p className="text-xs text-gray-500 mt-1">You need Network ≥ 20 to access insider contacts.<br />Network, attend conferences, or climb the career ladder.</p>
          </div>
          <div className="text-xs text-gray-600">Current Network: {Math.round(player.stats.network)} / 20</div>
        </div>
      )}

      {/* Active tips */}
      {networkOk && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-300 flex items-center gap-1.5">
              <Shield size={13} className="text-accent-yellow" />
              Active Tips ({activeTips.length})
            </h2>
            <span className="text-[10px] text-gray-600">Updates every ~2 weeks based on Network stat</span>
          </div>

          {activeTips.length === 0 ? (
            <div className="text-center py-8 text-gray-600 text-xs">
              No active tips. Keep networking — your contacts will reach out.
            </div>
          ) : (
            <div className="space-y-2">
              {activeTips.map(tip => (
                <TipCard key={tip.id} tip={tip} onAct={actOnInsiderTip} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Revealed / expired tips */}
      {revealedTips.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-gray-500 flex items-center gap-1.5">
            <Clock size={13} />
            History
          </h2>
          <div className="space-y-2">
            {revealedTips.map(tip => (
              <TipCard key={tip.id} tip={tip} onAct={actOnInsiderTip} />
            ))}
          </div>
        </div>
      )}

      {/* Disclaimer flavor text */}
      <div className="text-[10px] text-gray-700 text-center pb-2 italic">
        Insider trading is a federal crime carrying fines up to $5M and 20 years imprisonment. This is a game.
      </div>
    </div>
  );
}
