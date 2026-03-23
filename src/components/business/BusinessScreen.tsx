import React, { useState } from 'react';
import { Building2, Plus, TrendingUp, DollarSign, AlertCircle } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import { BUSINESS_TEMPLATES, getAvailableBusinesses } from '../../data/businesses';
import { formatCurrency } from '../../utils/formatting';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import Modal from '../ui/Modal';

export default function BusinessScreen() {
  const { player, businesses, addNotification } = useGameStore();
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  if (!player) return null;

  const available = getAvailableBusinesses(player.skills as any, player.unlockedMechanics, player.finances.cash);
  const locked = BUSINESS_TEMPLATES.filter(b => !available.find(a => a.id === b.id));
  const ownedList = Object.values(businesses);

  const template = BUSINESS_TEMPLATES.find(b => b.id === selectedTemplate);

  const handleStart = (templateId: string) => {
    const t = BUSINESS_TEMPLATES.find(b => b.id === templateId);
    if (!t) return;
    if (player.finances.cash < t.startupCost) {
      addNotification({ type: 'error', title: 'Insufficient Funds', message: `Need ${formatCurrency(t.startupCost)} to start this business.` });
      return;
    }
    // TODO: Implement in store
    addNotification({ type: 'success', title: 'Business Started!', message: `${t.name} is now active.` });
    setSelectedTemplate(null);
  };

  return (
    <div className="screen-content h-full overflow-y-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-white">Business Empire</h1>
          <p className="text-xs text-gray-500">Build multiple income streams beyond your job and investments.</p>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-gray-500">Active Businesses</div>
          <div className="text-2xl font-bold text-accent-green">{ownedList.length}</div>
        </div>
      </div>

      {ownedList.length > 0 && (
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Your Businesses</h2>
          <div className="grid grid-cols-3 gap-3">
            {ownedList.map(biz => (
              <Card key={biz.id} padding="md" glowColor="green">
                <div className="text-lg mb-1">{biz.type}</div>
                <div className="text-sm font-bold text-white">{biz.name}</div>
                <div className="text-xs text-gray-400 mb-3">{biz.description}</div>
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="bg-dark-600 rounded-lg p-2">
                    <div className="text-[9px] text-gray-500">Revenue/mo</div>
                    <div className="text-xs font-bold text-accent-green num">{formatCurrency(biz.monthlyRevenue, true)}</div>
                  </div>
                  <div className="bg-dark-600 rounded-lg p-2">
                    <div className="text-[9px] text-gray-500">Profit/mo</div>
                    <div className={`text-xs font-bold num ${biz.monthlyProfit >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>{formatCurrency(biz.monthlyProfit, true)}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Available Businesses</h2>
        {available.length === 0 ? (
          <Card padding="md">
            <div className="flex items-center gap-3 text-gray-500">
              <AlertCircle size={20} />
              <div>
                <div className="text-sm font-semibold text-gray-400">No businesses available yet</div>
                <div className="text-xs mt-1">Build more skills (Finance, Entrepreneurship, Branding) and unlock mechanics to access business opportunities.</div>
              </div>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {available.map(t => (
              <Card key={t.id} padding="md" hover onClick={() => setSelectedTemplate(t.id)}>
                <div className="text-2xl mb-2">{t.icon}</div>
                <div className="text-sm font-bold text-white mb-1">{t.name}</div>
                <div className="text-[10px] text-gray-500 mb-3 leading-relaxed">{t.description}</div>
                <div className="flex flex-wrap gap-1 mb-3">
                  <Badge variant="yellow" size="xs">Cost: {formatCurrency(t.startupCost, true)}</Badge>
                  <Badge variant={t.risk > 60 ? 'red' : t.risk > 30 ? 'yellow' : 'green'} size="xs">
                    Risk: {t.risk}%
                  </Badge>
                  <Badge variant="cyan" size="xs">Scale: {t.scalability}%</Badge>
                </div>
                <div className="text-[10px] text-accent-green">
                  Est. ${t.monthlyRevenue[0].toLocaleString()}-${t.monthlyRevenue[1].toLocaleString()}/mo revenue
                </div>
                <div className="text-[10px] text-gray-500 italic mt-1">"{t.flavor}"</div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {locked.length > 0 && (
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Locked ({locked.length})</h2>
          <div className="grid grid-cols-4 gap-2">
            {locked.map(t => (
              <div key={t.id} className="card p-3 opacity-50">
                <div className="text-xl mb-1 grayscale">{t.icon}</div>
                <div className="text-xs font-semibold text-gray-500">{t.name}</div>
                <div className="text-[10px] text-gray-600">
                  {t.requiredUnlocks.map(u => u.replace(/_/g, ' ')).join(', ')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Modal isOpen={!!selectedTemplate} onClose={() => setSelectedTemplate(null)} title={template?.name} size="md">
        {template && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-4xl">{template.icon}</span>
              <div>
                <Badge variant="gray" size="xs">{template.category}</Badge>
                <p className="text-sm text-gray-400 mt-1">{template.description}</p>
                <p className="text-[11px] text-gray-500 italic mt-1">"{template.flavor}"</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-dark-600 rounded-xl p-3 text-center">
                <div className="text-[10px] text-gray-500 mb-1">Startup Cost</div>
                <div className="text-sm font-bold text-accent-yellow num">{formatCurrency(template.startupCost)}</div>
              </div>
              <div className="bg-dark-600 rounded-xl p-3 text-center">
                <div className="text-[10px] text-gray-500 mb-1">Monthly Revenue</div>
                <div className="text-sm font-bold text-accent-green num">{formatCurrency(template.monthlyRevenue[0], true)}-{formatCurrency(template.monthlyRevenue[1], true)}</div>
              </div>
              <div className="bg-dark-600 rounded-xl p-3 text-center">
                <div className="text-[10px] text-gray-500 mb-1">Time Required</div>
                <div className="text-sm font-bold text-gray-200">{template.timeRequired}h/wk</div>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" fullWidth onClick={() => setSelectedTemplate(null)}>Cancel</Button>
              <Button
                variant={player.finances.cash >= template.startupCost ? 'success' : 'secondary'}
                fullWidth
                disabled={player.finances.cash < template.startupCost}
                onClick={() => handleStart(template.id)}
              >
                {player.finances.cash >= template.startupCost ? `Launch for ${formatCurrency(template.startupCost)}` : 'Not Enough Cash'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
