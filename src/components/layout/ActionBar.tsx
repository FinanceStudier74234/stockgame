import React, { useState } from 'react';
import { Briefcase, BookOpen, Coffee, Dumbbell, Users, FastForward, Play } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import { formatCurrency, formatDate } from '../../utils/formatting';

export default function ActionBar() {
  const { player, time, doWork, doRest, doStudy, doExercise, doNetwork, advanceDay, advanceWeek, saveGame } = useGameStore();
  const [studyMode, setStudyMode] = useState(false);

  if (!player) return null;

  const SKILLS = [
    { id: 'finance', label: 'Finance' },
    { id: 'chartAnalysis', label: 'Charts' },
    { id: 'tradingPsychology', label: 'Psychology' },
    { id: 'economics', label: 'Economics' },
    { id: 'options', label: 'Options' },
    { id: 'coding', label: 'Coding' },
    { id: 'entrepreneurship', label: 'Entrepreneur' },
    { id: 'macroAnalysis', label: 'Macro' },
  ];

  return (
    <div className="h-11 bg-dark-800 border-t border-dark-500 flex items-center gap-2 px-4 overflow-x-auto"
         style={{ gridColumn: '2 / 3', gridRow: '3 / 4' }}>
      {/* Action buttons */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <span className="text-[9px] text-gray-600 uppercase tracking-wider mr-1">Actions</span>

        <button
          onClick={doWork}
          disabled={!player.currentJob || player.stats.energy < 10}
          title={player.currentJob ? `Work at ${player.currentJob.company}` : 'No job - apply first'}
          className={`
            flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all
            ${player.currentJob && player.stats.energy >= 10
              ? 'bg-accent-green/20 text-accent-green hover:bg-accent-green/30 border border-accent-green/30'
              : 'bg-dark-400 text-gray-600 border border-dark-300 cursor-not-allowed'
            }
          `}
        >
          <Briefcase size={12} />
          <span>Work</span>
          {player.currentJob && <span className="text-[10px] opacity-70">+${player.currentJob.dailyWage.toFixed(0)}</span>}
        </button>

        <button
          onClick={doRest}
          title="Rest to recover energy and reduce stress"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-dark-400 text-gray-300 hover:bg-dark-300 hover:text-white border border-dark-300 transition-all"
        >
          <Coffee size={12} />
          <span>Rest</span>
        </button>

        <button
          onClick={doExercise}
          title="Exercise to improve health and reduce stress"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-dark-400 text-gray-300 hover:bg-dark-300 hover:text-white border border-dark-300 transition-all"
        >
          <Dumbbell size={12} />
          <span>Exercise</span>
        </button>

        <button
          onClick={doNetwork}
          disabled={player.stats.energy < 10}
          title="Network to build connections"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-dark-400 text-gray-300 hover:bg-dark-300 hover:text-white border border-dark-300 transition-all disabled:opacity-40"
        >
          <Users size={12} />
          <span>Network</span>
        </button>

        <div className="relative">
          <button
            onClick={() => setStudyMode(!studyMode)}
            disabled={player.stats.energy < 15}
            title="Study a skill"
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-all
              ${studyMode ? 'bg-accent-purple/20 text-accent-purple border-accent-purple/30' : 'bg-dark-400 text-gray-300 hover:bg-dark-300 hover:text-white border-dark-300'}
              disabled:opacity-40
            `}
          >
            <BookOpen size={12} />
            <span>Study</span>
          </button>

          {studyMode && (
            <>
              {/* Backdrop to close on outside click */}
              <div className="fixed inset-0 z-40" onClick={() => setStudyMode(false)} />
              {/* Popup fixed to top-right so it never obscures the action bar */}
              <div className="fixed top-14 right-4 bg-dark-700 border border-dark-300 rounded-xl p-3 shadow-2xl z-50 w-56">
                <div className="flex items-center justify-between mb-2 pb-2 border-b border-dark-500">
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Choose Skill to Study</span>
                  <span className="text-[9px] text-accent-purple">-15 energy</span>
                </div>
                {SKILLS.map(sk => {
                  const lvl = Math.floor(player.skills[sk.id as keyof typeof player.skills] || 0);
                  const pct = ((player.skills[sk.id as keyof typeof player.skills] || 0) % 1) * 100;
                  return (
                    <button
                      key={sk.id}
                      onClick={() => { doStudy(sk.id); setStudyMode(false); }}
                      className="w-full text-left px-2 py-2 rounded-lg text-xs text-gray-300 hover:bg-dark-500 hover:text-white transition-colors group"
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium group-hover:text-white">{sk.label}</span>
                        <span className="text-[10px] text-accent-blue font-bold">Lv {lvl}</span>
                      </div>
                      <div className="w-full h-1 bg-dark-400 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-accent-purple/60 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="h-6 w-px bg-dark-400 mx-1 flex-shrink-0" />

      {/* Time controls */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <span className="text-[9px] text-gray-600 uppercase tracking-wider mr-1">Time</span>
        <button
          onClick={advanceDay}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-accent-blue/20 text-accent-blue hover:bg-accent-blue/30 border border-accent-blue/30 transition-all"
        >
          <Play size={12} />
          <span>+1 Day</span>
        </button>
        <button
          onClick={advanceWeek}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-dark-400 text-gray-300 hover:bg-dark-300 border border-dark-300 transition-all"
        >
          <FastForward size={12} />
          <span>+1 Week</span>
        </button>
      </div>

      <div className="h-6 w-px bg-dark-400 mx-1 flex-shrink-0" />

      {/* Status summary */}
      <div className="flex items-center gap-4 text-[10px] flex-shrink-0 ml-auto">
        <span className="text-gray-500">
          Energy: <span className={`font-semibold num ${player.stats.energy > 30 ? 'text-accent-green' : 'text-accent-red'}`}>{Math.round(player.stats.energy)}</span>
        </span>
        <span className="text-gray-500">
          Day: <span className="text-gray-300 num">{time.totalDays}</span>
        </span>
        <button
          onClick={saveGame}
          className="text-gray-500 hover:text-gray-200 transition-colors text-[10px] px-2 py-1 rounded hover:bg-dark-400"
        >
          💾 Save
        </button>
      </div>
    </div>
  );
}
