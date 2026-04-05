import React, { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { InsiderTip } from '../../types';
import {
  EyeOff, AlertTriangle, Shield, Trash2, TrendingUp, TrendingDown,
  Clock, Zap, Lock, ChevronDown, ChevronUp, Scale, UserCheck,
  Globe, Building2, User, Users, Skull
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatting';

function InvestigationBar({ level }: { level: number }) {
  const color = level < 40 ? 'bg-accent-green' : level < 70 ? 'bg-accent-yellow' : 'bg-accent-red';
  const label =
    level < 10  ? 'Clean'
    : level < 40 ? 'Radar Ping'
    : level < 70 ? 'Informal Inquiry'
    : level < 95 ? 'FORMAL INVESTIGATION'
    : 'CHARGES IMMINENT';
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-[10px] text-gray-400 uppercase tracking-wider">SEC Scrutiny</span>
        <span className={`text-[10px] font-bold ${level >= 70 ? 'text-accent-red animate-pulse' : level >= 40 ? 'text-accent-yellow' : 'text-accent-green'}`}>
          {label} — {level.toFixed(0)}%
        </span>
      </div>
      <div className="h-2 bg-dark-600 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${Math.min(100, level)}%` }} />
      </div>
    </div>
  );
}

function TipCard({ tip, onAct, onShare }: { tip: InsiderTip; onAct: (id: string) => void; onShare: (id: string) => void }) {
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
    fraud_discovered: 'Fraud Found',
    buyout: 'LBO / Buyout',
    ceo_resignation: 'CEO Departure',
    regulatory_approval: 'Reg. Approval',
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
            <p className="text-xs text-gray-400 leading-relaxed">{tip.isRevealed ? tip.fullDescription : tip.hint}</p>
          </div>
          <button onClick={() => setExpanded(e => !e)} className="text-gray-500 hover:text-gray-300 flex-shrink-0">
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>

        {expanded && (
          <div className="mt-3 pt-3 border-t border-dark-500 grid grid-cols-4 gap-2 text-center">
            <div>
              <div className="text-[10px] text-gray-500 mb-0.5">Expected Move</div>
              <div className={`text-sm font-bold num ${isPositive ? 'text-accent-green' : 'text-accent-red'}`}>
                {isPositive ? '+' : ''}{tip.expectedMovePercent}%
              </div>
            </div>
            <div>
              <div className="text-[10px] text-gray-500 mb-0.5">Base Risk</div>
              <div className={`text-sm font-bold ${riskColor}`}>{tip.investigationRiskBase}</div>
            </div>
            <div>
              <div className="text-[10px] text-gray-500 mb-0.5">Days Left</div>
              <div className={`text-sm font-bold num ${!isExpired && daysLeft <= 3 ? 'text-accent-red' : 'text-gray-200'}`}>
                {isExpired ? '—' : daysLeft}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-gray-500 mb-0.5">Profit Made</div>
              <div className={`text-sm font-bold num ${tip.illegalProfitMade > 0 ? 'text-accent-green' : 'text-gray-500'}`}>
                {tip.illegalProfitMade > 0 ? formatCurrency(tip.illegalProfitMade, true) : '—'}
              </div>
            </div>
          </div>
        )}

        <div className="mt-2 flex items-center justify-between gap-2 flex-wrap">
          <span className="text-[10px] text-gray-600 italic">Source: {tip.source}</span>
          {!isExpired && !tip.isActedOn && (
            <div className="flex gap-2">
              <button onClick={() => onShare(tip.id)}
                className="text-xs px-2 py-1 rounded bg-accent-purple/10 text-accent-purple hover:bg-accent-purple/20 border border-accent-purple/30 font-semibold transition-colors flex items-center gap-1">
                <Users size={10} />
                Share (20% cut)
              </button>
              <button onClick={() => onAct(tip.id)}
                className="text-xs px-3 py-1 rounded bg-accent-yellow/20 text-accent-yellow hover:bg-accent-yellow/30 border border-accent-yellow/40 font-semibold transition-colors flex items-center gap-1">
                <Zap size={11} />
                Act on This
              </button>
            </div>
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
  const {
    insiderTips, secStatus, player,
    actOnInsiderTip, hireLawyer, destroyEvidence,
    openOffshoreAccount, formShellCompany, buyBurnerIdentity, tipOffContact,
    time,
  } = useGameStore();

  if (!player) return null;

  const activeTips = insiderTips.filter(t => !t.isExpired && !t.isRevealed);
  const revealedTips = insiderTips.filter(t => t.isRevealed || t.isExpired).slice(-8).reverse();
  const hasLawyer = secStatus.hasLawyer;
  const networkOk = player.stats.network >= 20;
  const sec = secStatus;

  // Net risk reduction from countermeasures
  const riskReductionPct = (() => {
    if (sec.burnerUsesRemaining > 0 && sec.hasShellCompany && sec.hasOffshoreAccount) return 80;
    if (sec.hasShellCompany && sec.hasOffshoreAccount) return 65;
    if (sec.burnerUsesRemaining > 0 && sec.hasOffshoreAccount) return 70;
    if (sec.hasOffshoreAccount) return 35;
    if (sec.hasShellCompany) return 25;
    if (sec.burnerUsesRemaining > 0) return 55;
    return 0;
  })();

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-accent-red/20 flex items-center justify-center">
          <EyeOff size={16} className="text-accent-red" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white">Underground Network</h1>
          <p className="text-xs text-gray-500">Play dirty. But know the SEC has eyes everywhere.</p>
        </div>
        {sec.isConvicted && (
          <div className="ml-auto flex items-center gap-1.5 px-2 py-1 rounded bg-accent-red/20 border border-accent-red/40">
            <Scale size={12} className="text-accent-red" />
            <span className="text-xs text-accent-red font-bold">CONVICTED — On Record</span>
          </div>
        )}
        {riskReductionPct > 0 && !sec.isConvicted && (
          <div className="ml-auto flex items-center gap-1.5 px-2 py-1 rounded bg-accent-green/10 border border-accent-green/30">
            <Shield size={12} className="text-accent-green" />
            <span className="text-xs text-accent-green font-semibold">{riskReductionPct}% risk reduced</span>
          </div>
        )}
      </div>

      {/* SEC Status */}
      <div className="bg-dark-800 border border-dark-500 rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <AlertTriangle size={14} className="text-accent-yellow" />
          <span className="text-sm font-semibold text-gray-200">SEC Investigation Status</span>
        </div>
        <InvestigationBar level={sec.investigationLevel} />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          <div className="text-center">
            <div className="text-[10px] text-gray-500 mb-0.5">Tips Acted On</div>
            <div className="text-sm font-bold num text-gray-200">{sec.tipsActedOn}</div>
          </div>
          <div className="text-center">
            <div className="text-[10px] text-gray-500 mb-0.5">Illegal Profits</div>
            <div className="text-sm font-bold num text-accent-red">{formatCurrency(sec.totalIllegalProfits, true)}</div>
          </div>
          <div className="text-center">
            <div className="text-[10px] text-gray-500 mb-0.5">Fines Paid</div>
            <div className="text-sm font-bold num text-accent-red">{formatCurrency(sec.lastFineAmount, true)}</div>
          </div>
          <div className="text-center">
            <div className="text-[10px] text-gray-500 mb-0.5">Witnesses</div>
            <div className={`text-sm font-bold ${(sec.contactExposureCount || 0) > 2 ? 'text-accent-red' : (sec.contactExposureCount || 0) > 0 ? 'text-accent-yellow' : 'text-accent-green'}`}>
              {sec.contactExposureCount || 0}
            </div>
          </div>
        </div>
        {sec.isUnderFormalInvestigation && (
          <div className="flex items-center gap-2 p-2 rounded bg-accent-red/10 border border-accent-red/30">
            <AlertTriangle size={12} className="text-accent-red flex-shrink-0" />
            <p className="text-xs text-accent-red">Formal investigation open. Every trade increases risk. Act now — destroy evidence or get a lawyer before charges are filed.</p>
          </div>
        )}
        {(sec.contactExposureCount || 0) >= 3 && (
          <div className="flex items-center gap-2 p-2 rounded bg-accent-orange/10 border border-accent-orange/30">
            <Users size={12} className="text-accent-orange flex-shrink-0" />
            <p className="text-xs text-accent-orange">Warning: {sec.contactExposureCount} people know about your activities. Any one of them could flip for a reduced sentence.</p>
          </div>
        )}
      </div>

      {/* Counter-measures panel */}
      <div className="bg-dark-800 border border-dark-500 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Skull size={14} className="text-accent-purple" />
          <span className="text-sm font-semibold text-gray-200">Cover Your Tracks</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {/* Lawyer */}
          <button onClick={hireLawyer} disabled={hasLawyer || player.finances.cash < 25000}
            className="flex flex-col items-start p-3 rounded-lg border transition-colors text-left
              disabled:opacity-40 disabled:cursor-not-allowed
              enabled:bg-accent-blue/10 enabled:border-accent-blue/30 enabled:hover:bg-accent-blue/20">
            <div className="flex items-center gap-1.5 mb-1">
              <UserCheck size={13} className="text-accent-blue" />
              <span className="text-xs font-bold text-accent-blue">{hasLawyer ? `Lawyer Active (${sec.lawyerDaysRemaining}d)` : 'Hire Lawyer'}</span>
            </div>
            <span className="text-[10px] text-gray-400">$25K · 60-day retainer. -40% daily investigation pressure.</span>
          </button>

          {/* Destroy evidence */}
          <button onClick={destroyEvidence} disabled={sec.investigationLevel === 0 || player.finances.cash < 15000}
            className="flex flex-col items-start p-3 rounded-lg border transition-colors text-left
              disabled:opacity-40 disabled:cursor-not-allowed
              enabled:bg-accent-red/10 enabled:border-accent-red/30 enabled:hover:bg-accent-red/20">
            <div className="flex items-center gap-1.5 mb-1">
              <Trash2 size={13} className="text-accent-red" />
              <span className="text-xs font-bold text-accent-red">Destroy Evidence</span>
            </div>
            <span className="text-[10px] text-gray-400">$15K · Wipes 10–30 points off investigation level.</span>
          </button>

          {/* Offshore account */}
          <button onClick={openOffshoreAccount} disabled={sec.hasOffshoreAccount || player.finances.cash < 75000}
            className="flex flex-col items-start p-3 rounded-lg border transition-colors text-left
              disabled:opacity-40 disabled:cursor-not-allowed
              enabled:bg-accent-green/10 enabled:border-accent-green/30 enabled:hover:bg-accent-green/20">
            <div className="flex items-center gap-1.5 mb-1">
              <Globe size={13} className={sec.hasOffshoreAccount ? 'text-accent-green' : 'text-gray-400'} />
              <span className={`text-xs font-bold ${sec.hasOffshoreAccount ? 'text-accent-green' : 'text-gray-400'}`}>
                {sec.hasOffshoreAccount ? '✓ Offshore Active' : 'Open Offshore Account'}
              </span>
            </div>
            <span className="text-[10px] text-gray-400">$75K · Cayman Islands. Permanent -35% scrutiny multiplier.</span>
          </button>

          {/* Shell company */}
          <button onClick={formShellCompany} disabled={sec.hasShellCompany || player.finances.cash < 40000}
            className="flex flex-col items-start p-3 rounded-lg border transition-colors text-left
              disabled:opacity-40 disabled:cursor-not-allowed
              enabled:bg-accent-yellow/10 enabled:border-accent-yellow/30 enabled:hover:bg-accent-yellow/20">
            <div className="flex items-center gap-1.5 mb-1">
              <Building2 size={13} className={sec.hasShellCompany ? 'text-accent-yellow' : 'text-gray-400'} />
              <span className={`text-xs font-bold ${sec.hasShellCompany ? 'text-accent-yellow' : 'text-gray-400'}`}>
                {sec.hasShellCompany ? '✓ Shell Co. Active' : 'Form Shell Company'}
              </span>
            </div>
            <span className="text-[10px] text-gray-400">$40K · Routes trades via LLC. -30% per-tip risk bump.</span>
          </button>

          {/* Burner identities */}
          <button onClick={buyBurnerIdentity} disabled={player.finances.cash < 20000}
            className="flex flex-col items-start p-3 rounded-lg border transition-colors text-left col-span-2
              disabled:opacity-40 disabled:cursor-not-allowed
              enabled:bg-accent-purple/10 enabled:border-accent-purple/30 enabled:hover:bg-accent-purple/20">
            <div className="flex items-center justify-between w-full mb-1">
              <div className="flex items-center gap-1.5">
                <User size={13} className="text-accent-purple" />
                <span className="text-xs font-bold text-accent-purple">Buy Burner Identities</span>
              </div>
              {(sec.burnerUsesRemaining || 0) > 0 && (
                <span className="text-xs font-bold text-accent-purple bg-accent-purple/20 px-2 py-0.5 rounded">
                  {sec.burnerUsesRemaining} remaining
                </span>
              )}
            </div>
            <span className="text-[10px] text-gray-400">$20K per pack · 3 anonymous trading accounts. -75% trace risk per trade. Each use consumes one identity.</span>
          </button>
        </div>
      </div>

      {/* Access locked if network too low */}
      {!networkOk && (
        <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
          <div className="w-12 h-12 rounded-full bg-dark-600 flex items-center justify-center">
            <Lock size={20} className="text-gray-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-300">Network Too Low</p>
            <p className="text-xs text-gray-500 mt-1">You need Network ≥ 20 to receive insider contacts.<br />Network, attend events, or climb the career ladder.</p>
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
            <span className="text-[10px] text-gray-600">Updates every ~2 weeks · Network stat controls frequency</span>
          </div>
          {activeTips.length === 0 ? (
            <div className="text-center py-8 text-gray-600 text-xs">
              No active tips. Your contacts will reach out when something comes up.
            </div>
          ) : (
            <div className="space-y-2">
              {activeTips.map(tip => (
                <TipCard key={tip.id} tip={tip} onAct={actOnInsiderTip} onShare={tipOffContact} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* History */}
      {revealedTips.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-gray-500 flex items-center gap-1.5">
            <Clock size={13} /> History
          </h2>
          <div className="space-y-2">
            {revealedTips.map(tip => (
              <TipCard key={tip.id} tip={tip} onAct={actOnInsiderTip} onShare={tipOffContact} />
            ))}
          </div>
        </div>
      )}

      <div className="text-[10px] text-gray-700 text-center pb-2 italic">
        Insider trading carries fines up to $5M and 20 years imprisonment. This is a game.
      </div>
    </div>
  );
}
