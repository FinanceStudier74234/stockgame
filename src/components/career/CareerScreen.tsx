import React, { useState, useMemo } from 'react';
import { Briefcase, TrendingUp, Zap, Star, Check, X, ChevronRight } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import { formatCurrency } from '../../utils/formatting';
import { JOBS, getAvailableJobs } from '../../data/jobs';
import { Job } from '../../types';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import StatBar from '../ui/StatBar';
import Modal from '../ui/Modal';

const TIER_COLORS: Record<string, string> = {
  entry: 'text-gray-400',
  low: 'text-accent-blue',
  mid: 'text-accent-green',
  advanced: 'text-accent-purple',
  elite: 'text-gold',
  legendary: 'text-accent-orange',
};

const TIER_BADGES: Record<string, React.ReactElement> = {
  entry: <Badge variant="gray" size="xs">Entry</Badge>,
  low: <Badge variant="blue" size="xs">Junior</Badge>,
  mid: <Badge variant="green" size="xs">Mid-Level</Badge>,
  advanced: <Badge variant="purple" size="xs">Senior</Badge>,
  elite: <Badge variant="gold" size="xs">Elite</Badge>,
  legendary: <Badge variant="yellow" size="xs">Legendary</Badge>,
};

function JobCard({ job, isCurrentJob, isAvailable, onApply, onView }: {
  job: Job;
  isCurrentJob: boolean;
  isAvailable: boolean;
  onApply: (job: Job) => void;
  onView: (job: Job) => void;
}) {
  return (
    <div
      className={`card p-4 card-hover transition-all ${isCurrentJob ? 'border-accent-green/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : ''}`}
      onClick={() => onView(job)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-bold text-white">{job.title}</span>
            {isCurrentJob && <Badge variant="green" size="xs">CURRENT</Badge>}
            {!isAvailable && !isCurrentJob && <Badge variant="red" size="xs">Locked</Badge>}
          </div>
          <div className="text-[11px] text-gray-500">{job.company}</div>
        </div>
        <div>{TIER_BADGES[job.tier]}</div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3 text-center">
        <div className="bg-dark-600 rounded-lg p-2">
          <div className="text-[9px] text-gray-600 uppercase mb-0.5">Salary</div>
          <div className="text-xs font-bold text-accent-green num">{formatCurrency(job.salary, true)}/yr</div>
        </div>
        <div className="bg-dark-600 rounded-lg p-2">
          <div className="text-[9px] text-gray-600 uppercase mb-0.5">Prestige</div>
          <div className="text-xs font-bold text-accent-purple num">{job.prestige}</div>
        </div>
        <div className="bg-dark-600 rounded-lg p-2">
          <div className="text-[9px] text-gray-600 uppercase mb-0.5">Stress</div>
          <div className={`text-xs font-bold num ${job.stressPerDay > 40 ? 'text-accent-red' : job.stressPerDay > 20 ? 'text-accent-yellow' : 'text-accent-green'}`}>
            {job.stressPerDay}/day
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={e => { e.stopPropagation(); onView(job); }}
          className="flex-1 py-1.5 text-[10px] text-gray-400 hover:text-white bg-dark-600 hover:bg-dark-400 rounded transition-all border border-dark-400"
        >
          Details
        </button>
        {!isCurrentJob && (
          <button
            onClick={e => { e.stopPropagation(); if (isAvailable) onApply(job); }}
            disabled={!isAvailable}
            className={`flex-1 py-1.5 text-[10px] font-semibold rounded transition-all
              ${isAvailable
                ? 'bg-accent-blue/20 text-accent-blue hover:bg-accent-blue/30 border border-accent-blue/30'
                : 'bg-dark-600 text-gray-600 border border-dark-400 cursor-not-allowed'
              }`}
          >
            {isAvailable ? 'Apply' : 'Not Qualified'}
          </button>
        )}
      </div>
    </div>
  );
}

export default function CareerScreen() {
  const { player, applyForJob, quitJob, addNotification } = useGameStore();
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [filter, setFilter] = useState<string>('all');

  if (!player) return null;

  const availableJobs = useMemo(() => getAvailableJobs(
    player.skills as any,
    player.stats as any,
    player.unlockedMechanics
  ), [player.skills, player.stats, player.unlockedMechanics]);

  const availableIds = new Set(availableJobs.map(j => j.id));

  const tiers = ['all', 'entry', 'low', 'mid', 'advanced', 'elite', 'legendary'];

  const filteredJobs = filter === 'all' ? JOBS : JOBS.filter(j => j.tier === filter);

  const handleApply = (job: Job) => {
    applyForJob(job.id);
    setSelectedJob(null);
  };

  return (
    <div className="screen-content h-full overflow-y-auto p-4 space-y-4">
      {/* Current job status */}
      <Card padding="md">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center flex-shrink-0">
            <Briefcase size={22} className="text-white" />
          </div>
          <div className="flex-1">
            {player.currentJob ? (
              <>
                <div className="text-sm font-bold text-white">{player.currentJob.title}</div>
                <div className="text-[11px] text-gray-400">{player.currentJob.company}</div>
                <div className="flex items-center gap-3 mt-1">
                  <Badge variant="green" size="xs">{formatCurrency(player.currentJob.salary, true)}/yr</Badge>
                  <span className="text-[10px] text-gray-500">+{formatCurrency(player.currentJob.dailyWage, true)}/day</span>
                  <span className="text-[10px] text-gray-500">Stress: {player.currentJob.stressPerDay}/day</span>
                </div>
              </>
            ) : (
              <div>
                <div className="text-sm font-bold text-accent-yellow">Unemployed</div>
                <div className="text-[11px] text-gray-500">No income from work. Browse jobs below.</div>
              </div>
            )}
          </div>
          {player.currentJob && (
            <Button variant="danger" size="sm" onClick={quitJob}>
              Quit Job
            </Button>
          )}
        </div>
      </Card>

      {/* Stats required */}
      <Card title="Your Qualifications" padding="md">
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Finance', value: player.skills.finance },
            { label: 'Accounting', value: player.skills.accounting },
            { label: 'Sales', value: player.skills.sales },
            { label: 'Operations', value: player.skills.operations },
            { label: 'Leadership', value: player.skills.leadership },
            { label: 'Networking', value: player.skills.networking },
            { label: 'Valuation', value: player.skills.valuation },
            { label: 'Quant Research', value: player.skills.quantResearch },
          ].map(s => (
            <div key={s.label}>
              <StatBar label={s.label} value={s.value} size="sm" />
            </div>
          ))}
        </div>
        <div className="mt-3 pt-3 border-t border-dark-400 flex gap-4">
          <div className="text-[10px] text-gray-500">Intelligence: <span className="text-gray-200 font-medium">{Math.round(player.stats.intelligence)}</span></div>
          <div className="text-[10px] text-gray-500">Reputation: <span className="text-gray-200 font-medium">{Math.round(player.stats.reputation)}</span></div>
          <div className="text-[10px] text-gray-500">Charisma: <span className="text-gray-200 font-medium">{Math.round(player.stats.charisma)}</span></div>
          <div className="text-[10px] text-gray-500">Level: <span className="text-accent-blue font-medium">{player.level}</span></div>
        </div>
      </Card>

      {/* Filter tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {tiers.map(t => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold capitalize transition-all ${
              filter === t ? 'bg-accent-blue text-white' : 'bg-dark-400 text-gray-400 hover:text-white'
            }`}
          >
            {t === 'all' ? 'All Jobs' : t}
          </button>
        ))}
      </div>

      {/* Jobs grid */}
      <div className="grid grid-cols-3 gap-3">
        {filteredJobs.map(job => (
          <JobCard
            key={job.id}
            job={job}
            isCurrentJob={player.currentJob?.id === job.id}
            isAvailable={availableIds.has(job.id)}
            onApply={handleApply}
            onView={setSelectedJob}
          />
        ))}
      </div>

      {/* Job detail modal */}
      <Modal isOpen={!!selectedJob} onClose={() => setSelectedJob(null)} title={selectedJob?.title} size="md">
        {selectedJob && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div>
                <div className="text-sm text-gray-400">{selectedJob.company}</div>
                {TIER_BADGES[selectedJob.tier]}
              </div>
            </div>

            <p className="text-sm text-gray-400 leading-relaxed">{selectedJob.description}</p>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-dark-600 rounded-xl p-3 text-center">
                <div className="text-[10px] text-gray-500 uppercase mb-1">Annual Salary</div>
                <div className="text-lg font-bold text-accent-green num">{formatCurrency(selectedJob.salary)}</div>
                <div className="text-[10px] text-gray-500 num">+{formatCurrency(selectedJob.dailyWage)}/day</div>
              </div>
              <div className="bg-dark-600 rounded-xl p-3 text-center">
                <div className="text-[10px] text-gray-500 uppercase mb-1">Network Value</div>
                <div className="text-lg font-bold text-accent-purple">{selectedJob.networkingValue}</div>
                <div className="text-[10px] text-gray-500">Prestige: {selectedJob.prestige}</div>
              </div>
            </div>

            {/* Requirements */}
            {Object.keys(selectedJob.skillRequirements).length > 0 && (
              <div>
                <div className="text-xs font-semibold text-gray-300 mb-2">Skill Requirements</div>
                <div className="space-y-1.5">
                  {Object.entries(selectedJob.skillRequirements).map(([skill, req]) => {
                    const playerSkill = player.skills[skill as keyof typeof player.skills] || 0;
                    const met = playerSkill >= (req as number);
                    return (
                      <div key={skill} className={`flex items-center justify-between text-xs p-2 rounded ${met ? 'bg-accent-green/5' : 'bg-accent-red/5'}`}>
                        <span className="capitalize text-gray-300">{skill}</span>
                        <div className="flex items-center gap-2">
                          <span className="num text-gray-400">{Math.round(playerSkill)} / {req}</span>
                          {met ? <Check size={12} className="text-accent-green" /> : <X size={12} className="text-accent-red" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Skill gains */}
            <div>
              <div className="text-xs font-semibold text-gray-300 mb-2">Daily Skill Gains</div>
              <div className="grid grid-cols-2 gap-1">
                {Object.entries(selectedJob.skillGains).map(([skill, gain]) => (
                  <div key={skill} className="flex items-center justify-between text-[11px] text-gray-400">
                    <span className="capitalize">{skill}</span>
                    <span className="text-accent-blue num">+{(gain as number).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Promotion path */}
            {selectedJob.promotionPath.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-gray-300 mb-2">Career Path</div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="blue" size="xs">{selectedJob.title}</Badge>
                  <ChevronRight size={12} className="text-gray-600" />
                  {selectedJob.promotionPath.map(nextId => {
                    const nextJob = JOBS.find(j => j.id === nextId);
                    return nextJob ? <Badge key={nextId} variant="gray" size="xs">{nextJob.title}</Badge> : null;
                  })}
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              {player.currentJob?.id === selectedJob.id ? (
                <Button variant="danger" fullWidth onClick={quitJob}>
                  Quit This Job
                </Button>
              ) : (
                <Button
                  variant={availableIds.has(selectedJob.id) ? 'primary' : 'secondary'}
                  fullWidth
                  disabled={!availableIds.has(selectedJob.id)}
                  onClick={() => handleApply(selectedJob)}
                >
                  {availableIds.has(selectedJob.id) ? 'Accept This Role' : 'Not Qualified Yet'}
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
