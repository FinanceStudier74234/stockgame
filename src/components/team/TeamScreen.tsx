import React from 'react';
import { Users, Lock } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import Card from '../ui/Card';
import Badge from '../ui/Badge';

export default function TeamScreen() {
  const { player, employees } = useGameStore();
  if (!player) return null;
  const hasTeamHiring = player.unlockedMechanics.includes('team_hiring');
  const employeeList = Object.values(employees);

  if (!hasTeamHiring) {
    return (
      <div className="screen-content h-full flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <Lock size={48} className="text-gray-600 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-gray-400 mb-2">Team Building Locked</h2>
          <p className="text-sm text-gray-500">Reach a higher career level and build your leadership skills to unlock team hiring.</p>
          <div className="mt-4">
            <Badge variant="purple" size="sm">Requires: Leadership ≥ 25 or advanced role</Badge>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="screen-content h-full overflow-y-auto p-4 space-y-4">
      <h1 className="text-lg font-bold text-white">Team Management</h1>
      <p className="text-sm text-gray-400">Build and manage your team of analysts, traders, and operators.</p>

      {employeeList.length === 0 ? (
        <Card padding="md">
          <div className="text-center py-8">
            <Users size={40} className="text-gray-600 mx-auto mb-3" />
            <div className="text-sm font-semibold text-gray-400 mb-1">No team members yet</div>
            <p className="text-xs text-gray-500">Hire your first analyst or assistant to scale your operations.</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {employeeList.map(emp => (
            <Card key={emp.id} padding="md">
              <div className="font-bold text-sm text-white">{emp.name}</div>
              <div className="text-xs text-gray-400">{emp.role}</div>
              <div className="text-xs text-accent-yellow mt-2">${emp.salary.toLocaleString()}/yr</div>
            </Card>
          ))}
        </div>
      )}

      <Card padding="md" className="border-dashed border-dark-300">
        <div className="text-center py-4">
          <div className="text-sm text-gray-400 mb-2">Team hiring system — Full implementation coming in next phase</div>
          <Badge variant="blue" size="xs">Coming Soon: Full hire/fire/promote system</Badge>
        </div>
      </Card>
    </div>
  );
}
