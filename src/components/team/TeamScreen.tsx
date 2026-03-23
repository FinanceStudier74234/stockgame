import React, { useState, useMemo } from 'react';
import { Users, Lock, Star, TrendingUp, AlertTriangle, X, Plus, Briefcase } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import { formatCurrency } from '../../utils/formatting';
import {
  EMPLOYEE_POOL, ROLE_LABELS, ROLE_COLORS,
  getAvailableCandidates, EmployeeCandidate
} from '../../data/employeeRoster';
import { Employee } from '../../types';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import Modal from '../ui/Modal';

const TIER_BADGES: Record<string, React.ReactElement> = {
  junior: <Badge variant="gray" size="xs">Junior</Badge>,
  mid: <Badge variant="blue" size="xs">Mid-Level</Badge>,
  senior: <Badge variant="purple" size="xs">Senior</Badge>,
  elite: <Badge variant="gold" size="xs">Elite</Badge>,
};

function EmployeeCard({ emp, onFire }: { emp: Employee; onFire: () => void }) {
  const role = ROLE_LABELS[emp.role] || emp.role;
  const roleColor = ROLE_COLORS[emp.role] || 'text-gray-400';
  const isAtRisk = emp.morale < 30 || emp.loyalty < 30;

  return (
    <Card padding="md" glowColor={isAtRisk ? 'red' : 'none'}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-sm font-bold text-white">{emp.name}</div>
          <div className={`text-[10px] ${roleColor}`}>{role}</div>
        </div>
        {isAtRisk && <Badge variant="red" size="xs">AT RISK</Badge>}
      </div>

      <div className="grid grid-cols-3 gap-1.5 mb-3">
        {[
          { label: 'Productivity', value: emp.productivity, color: emp.productivity > 70 ? 'text-accent-green' : 'text-accent-yellow' },
          { label: 'Morale', value: emp.morale, color: emp.morale > 50 ? 'text-accent-blue' : 'text-accent-red' },
          { label: 'Loyalty', value: emp.loyalty, color: emp.loyalty > 60 ? 'text-accent-purple' : 'text-accent-red' },
        ].map(stat => (
          <div key={stat.label} className="bg-dark-600 rounded-lg p-2 text-center">
            <div className="text-[9px] text-gray-600 mb-0.5">{stat.label}</div>
            <div className={`text-xs font-bold ${stat.color}`}>{stat.value}</div>
            <div className="w-full h-0.5 bg-dark-400 rounded mt-1 overflow-hidden">
              <div
                className="h-full bg-current rounded transition-all"
                style={{ width: `${stat.value}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mb-3">
        <div className="text-xs text-accent-yellow font-semibold">{formatCurrency(emp.salary, true)}/yr</div>
        <div className="text-[10px] text-gray-500">{formatCurrency(emp.salary / 12, true)}/mo</div>
      </div>

      {emp.specialAbility && (
        <div className="p-2 bg-accent-purple/5 border border-accent-purple/20 rounded-lg mb-3">
          <div className="text-[9px] text-accent-purple uppercase mb-0.5">Special Ability</div>
          <div className="text-[10px] text-gray-300 leading-relaxed">{emp.specialAbility}</div>
        </div>
      )}

      <Button variant="danger" size="sm" onClick={onFire} fullWidth>
        Let Go
      </Button>
    </Card>
  );
}

function CandidateCard({ candidate, onHire }: { candidate: EmployeeCandidate; onHire: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const role = ROLE_LABELS[candidate.role] || candidate.role;
  const roleColor = ROLE_COLORS[candidate.role] || 'text-gray-400';

  return (
    <Card padding="md" hover onClick={() => setExpanded(!expanded)}>
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="text-sm font-bold text-white">{candidate.name}</div>
          <div className={`text-[10px] ${roleColor}`}>{role}</div>
        </div>
        <div className="flex items-center gap-1">
          {TIER_BADGES[candidate.tier]}
        </div>
      </div>

      <p className="text-[10px] text-gray-500 mb-3 leading-relaxed">{candidate.description}</p>

      <div className="flex items-center justify-between mb-3">
        <div className="text-xs font-semibold text-accent-yellow">{formatCurrency(candidate.salary, true)}/yr</div>
        <div className="text-[10px] text-gray-600">Productivity: {candidate.productivity}</div>
      </div>

      {candidate.specialAbility && (
        <div className="p-2 bg-accent-purple/5 border border-accent-purple/20 rounded-lg mb-3">
          <div className="text-[9px] text-accent-purple uppercase mb-0.5">⭐ Special Ability</div>
          <div className="text-[10px] text-gray-300 leading-relaxed">{candidate.specialAbility}</div>
        </div>
      )}

      {expanded && (
        <div className="mb-3 space-y-1">
          <div className="text-[9px] text-gray-500 uppercase mb-1">Key Skills</div>
          {Object.entries(candidate.skills).map(([skill, value]) => (
            <div key={skill} className="flex justify-between text-[10px]">
              <span className="capitalize text-gray-400">{skill.replace(/([A-Z])/g, ' $1').toLowerCase()}</span>
              <span className="text-accent-blue num">{value}</span>
            </div>
          ))}
        </div>
      )}

      <div onClick={e => e.stopPropagation()}>
        <Button variant="primary" size="sm" fullWidth onClick={onHire}>
          Hire for {formatCurrency(candidate.salary, true)}/yr
        </Button>
      </div>
    </Card>
  );
}

export default function TeamScreen() {
  const { player, employees, hireEmployee, fireEmployee } = useGameStore();
  const [tab, setTab] = useState<'roster' | 'hire'>('roster');
  const [confirmFire, setConfirmFire] = useState<string | null>(null);

  if (!player) return null;

  const hasTeamHiring = player.unlockedMechanics.includes('team_hiring') ||
    player.skills.leadership >= 25 ||
    ['senior_analyst', 'portfolio_manager', 'coo', 'hedge_fund_manager'].includes(player.currentJob?.id || '');

  if (!hasTeamHiring) {
    return (
      <div className="screen-content h-full flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <Lock size={48} className="text-gray-600 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-gray-400 mb-2">Team Building Locked</h2>
          <p className="text-sm text-gray-500 mb-4">
            Build your leadership skills to unlock the ability to hire a team.
          </p>
          <div className={`text-xs ${player.skills.leadership >= 25 ? 'text-accent-green' : 'text-accent-red'}`}>
            {player.skills.leadership >= 25 ? '✓' : '✗'} Leadership ≥ 25 (current: {Math.round(player.skills.leadership)})
          </div>
        </div>
      </div>
    );
  }

  const employeeList = Object.values(employees);
  const hiredIds = employeeList.map(e => e.id);
  const monthlyPayroll = employeeList.reduce((sum, e) => sum + e.salary / 12, 0);
  const avgProductivity = employeeList.length > 0
    ? employeeList.reduce((s, e) => s + e.productivity, 0) / employeeList.length
    : 0;

  const candidates = useMemo(() =>
    getAvailableCandidates(player.skills.leadership, player.stats.reputation, hiredIds),
    [player.skills.leadership, player.stats.reputation, hiredIds]
  );

  const empToFire = employees[confirmFire || ''];

  return (
    <div className="screen-content h-full overflow-y-auto p-4 space-y-4">
      {/* Header stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Team Size', value: employeeList.length, color: 'text-accent-blue', suffix: ' people' },
          { label: 'Monthly Payroll', value: formatCurrency(monthlyPayroll, true), color: 'text-accent-red' },
          { label: 'Avg Productivity', value: `${avgProductivity.toFixed(0)}%`, color: avgProductivity > 70 ? 'text-accent-green' : 'text-accent-yellow' },
          { label: 'Performance Bonus', value: `+${((Math.max(0, (avgProductivity - 50) / 10 * 0.001)) * 100).toFixed(2)}%/mo`, color: 'text-accent-purple' },
        ].map(item => (
          <Card key={item.label} padding="md">
            <div className="text-[10px] text-gray-500 uppercase mb-1">{item.label}</div>
            <div className={`text-xl font-bold ${item.color}`}>{item.value}{item.suffix || ''}</div>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5">
        <button
          onClick={() => setTab('roster')}
          className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${
            tab === 'roster' ? 'bg-accent-blue text-white' : 'bg-dark-400 text-gray-400 hover:text-white'
          }`}
        >
          <Users size={10} className="inline mr-1" />
          Roster ({employeeList.length})
        </button>
        <button
          onClick={() => setTab('hire')}
          className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${
            tab === 'hire' ? 'bg-accent-green text-white' : 'bg-dark-400 text-gray-400 hover:text-white'
          }`}
        >
          <Plus size={10} className="inline mr-1" />
          Hire ({candidates.length} available)
        </button>
      </div>

      {/* ROSTER */}
      {tab === 'roster' && (
        <>
          {employeeList.length === 0 ? (
            <Card padding="md">
              <div className="text-center py-8">
                <Users size={40} className="text-gray-600 mx-auto mb-3" />
                <div className="text-sm font-semibold text-gray-400 mb-1">No team members yet</div>
                <p className="text-xs text-gray-500 mb-4">Hire your first analyst or assistant to scale your operations.</p>
                <Button variant="primary" size="sm" onClick={() => setTab('hire')}>Browse Candidates →</Button>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {employeeList.map(emp => (
                <EmployeeCard
                  key={emp.id}
                  emp={emp}
                  onFire={() => setConfirmFire(emp.id)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* HIRE */}
      {tab === 'hire' && (
        <>
          {candidates.length === 0 ? (
            <Card padding="md">
              <div className="text-center py-6">
                <div className="text-sm text-gray-400">All available candidates are already hired.</div>
                <div className="text-xs text-gray-500 mt-1">Build leadership and reputation to unlock elite candidates.</div>
              </div>
            </Card>
          ) : (
            <>
              <div className="text-xs text-gray-500">
                {candidates.length} candidate{candidates.length > 1 ? 's' : ''} available. Leadership: {Math.round(player.skills.leadership)} | Reputation: {Math.round(player.stats.reputation)}
              </div>
              <div className="grid grid-cols-3 gap-3">
                {candidates.map(candidate => (
                  <CandidateCard
                    key={candidate.id}
                    candidate={candidate}
                    onHire={() => hireEmployee(candidate.id)}
                  />
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* Fire confirmation modal */}
      <Modal
        isOpen={!!confirmFire}
        onClose={() => setConfirmFire(null)}
        title="Let Employee Go"
        size="sm"
      >
        {empToFire && (
          <div className="space-y-4">
            <p className="text-sm text-gray-300">
              Are you sure you want to let <strong className="text-white">{empToFire.name}</strong> go?
            </p>
            <div className="p-3 bg-accent-red/10 border border-accent-red/20 rounded-lg text-xs text-accent-red">
              Severance pay: {formatCurrency(empToFire.salary * 0.1)} (1 month salary)
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" fullWidth onClick={() => setConfirmFire(null)}>
                Keep {empToFire.name}
              </Button>
              <Button
                variant="danger"
                fullWidth
                onClick={() => { fireEmployee(confirmFire!); setConfirmFire(null); }}
              >
                Let Them Go
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
