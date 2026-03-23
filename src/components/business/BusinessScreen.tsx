import React, { useState } from 'react';
import { Building2, TrendingUp, TrendingDown, Lock, AlertCircle, ChevronUp, X } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import { BUSINESS_TEMPLATES, getAvailableBusinesses } from '../../data/businesses';
import { formatCurrency, formatPercent } from '../../utils/formatting';
import { Business } from '../../types';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import Modal from '../ui/Modal';

function BusinessStatusCard({ biz, onUpgrade, onClose }: {
  biz: Business;
  onUpgrade: () => void;
  onClose: () => void;
}) {
  const isProfit = biz.monthlyProfit >= 0;
  const ageMonths = Math.floor((useGameStore.getState().time.totalDays - biz.foundedDate) / 30);

  return (
    <Card padding="md" glowColor={isProfit ? 'green' : 'none'}>
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="text-sm font-bold text-white">{biz.name}</div>
          <div className="text-[10px] text-gray-500 capitalize">{biz.category.replace(/_/g, ' ')} • Level {biz.level}</div>
        </div>
        <div className="flex items-center gap-1">
          <Badge variant={isProfit ? 'green' : 'red'} size="xs">
            {isProfit ? '●' : '▼'} {isProfit ? 'Profitable' : 'Losing'}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="bg-dark-600 rounded-lg p-2 text-center">
          <div className="text-[9px] text-gray-600">Revenue/mo</div>
          <div className="text-xs font-bold text-accent-green num">{formatCurrency(biz.monthlyRevenue, true)}</div>
        </div>
        <div className="bg-dark-600 rounded-lg p-2 text-center">
          <div className="text-[9px] text-gray-600">Expenses/mo</div>
          <div className="text-xs font-bold text-accent-red num">{formatCurrency(biz.monthlyExpenses, true)}</div>
        </div>
        <div className="bg-dark-600 rounded-lg p-2 text-center">
          <div className="text-[9px] text-gray-600">Profit/mo</div>
          <div className={`text-xs font-bold num ${isProfit ? 'text-accent-green' : 'text-accent-red'}`}>
            {isProfit ? '+' : ''}{formatCurrency(biz.monthlyProfit, true)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3 text-[10px]">
        <div className="flex justify-between">
          <span className="text-gray-500">Total Revenue</span>
          <span className="text-accent-green num">{formatCurrency(biz.totalRevenue, true)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Age</span>
          <span className="text-gray-300">{ageMonths} months</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Satisfaction</span>
          <span className="text-gray-300">{biz.satisfaction}/100</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Growth Rate</span>
          <span className="text-accent-blue num">+{(biz.growthRate * 100).toFixed(1)}%/mo</span>
        </div>
      </div>

      <div className="flex gap-2">
        <Button variant="secondary" size="sm" onClick={onUpgrade} fullWidth>
          <ChevronUp size={10} className="inline mr-1" />
          Upgrade (${(biz.startupCost * 0.5 * biz.level / 1000).toFixed(0)}K)
        </Button>
        <Button variant="danger" size="sm" onClick={onClose}>
          Close
        </Button>
      </div>
    </Card>
  );
}

export default function BusinessScreen() {
  const { player, businesses, startBusiness, upgradeBusiness, closeBusiness } = useGameStore();
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [tab, setTab] = useState<'active' | 'available' | 'locked'>('active');
  const [confirmClose, setConfirmClose] = useState<string | null>(null);

  if (!player) return null;

  const available = getAvailableBusinesses(player.skills as any, player.unlockedMechanics, player.finances.cash);
  const allLocked = BUSINESS_TEMPLATES.filter(b => !available.find(a => a.id === b.id));
  const ownedList = Object.values(businesses);
  const template = BUSINESS_TEMPLATES.find(b => b.id === selectedTemplate);

  const totalMonthlyProfit = ownedList.reduce((s, b) => s + b.monthlyProfit, 0);
  const totalRevenue = ownedList.reduce((s, b) => s + b.totalRevenue, 0);

  const bizToClose = businesses[confirmClose || ''];

  return (
    <div className="screen-content h-full overflow-y-auto p-4 space-y-4">
      {/* Header metrics */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Active Businesses', value: ownedList.length, color: 'text-accent-blue' },
          { label: 'Monthly Cash Flow', value: formatCurrency(totalMonthlyProfit, true), color: totalMonthlyProfit >= 0 ? 'text-accent-green' : 'text-accent-red' },
          { label: 'Total Revenue', value: formatCurrency(totalRevenue, true), color: 'text-accent-yellow' },
          { label: 'Available to Launch', value: available.length - ownedList.filter(b => available.find(a => a.id === b.id.split('_').slice(0, -1).join('_'))).length, color: 'text-accent-purple' },
        ].map(item => (
          <Card key={item.label} padding="md">
            <div className="text-[10px] text-gray-500 uppercase mb-1">{item.label}</div>
            <div className={`text-xl font-bold ${item.color}`}>{item.value}</div>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5">
        {[
          { id: 'active', label: `Active (${ownedList.length})` },
          { id: 'available', label: `Launch New (${available.length})` },
          { id: 'locked', label: `Locked (${allLocked.length})` },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as any)}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${
              tab === t.id ? 'bg-accent-blue text-white' : 'bg-dark-400 text-gray-400 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ACTIVE BUSINESSES */}
      {tab === 'active' && (
        <>
          {ownedList.length === 0 ? (
            <Card padding="md">
              <div className="flex items-center gap-3 text-gray-500">
                <Building2 size={24} className="text-gray-600" />
                <div>
                  <div className="text-sm font-semibold text-gray-400">No active businesses</div>
                  <div className="text-xs mt-1">Launch a business to start building passive income streams.</div>
                  <button
                    onClick={() => setTab('available')}
                    className="text-xs text-accent-blue hover:text-blue-400 mt-2 transition-colors"
                  >
                    Browse available businesses →
                  </button>
                </div>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {ownedList.map(biz => (
                <BusinessStatusCard
                  key={biz.id}
                  biz={biz}
                  onUpgrade={() => upgradeBusiness(biz.id)}
                  onClose={() => setConfirmClose(biz.id)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* AVAILABLE TO LAUNCH */}
      {tab === 'available' && (
        <>
          {available.length === 0 ? (
            <Card padding="md">
              <div className="flex items-center gap-3 text-gray-500">
                <AlertCircle size={20} />
                <div>
                  <div className="text-sm font-semibold text-gray-400">No businesses available yet</div>
                  <div className="text-xs mt-1">Build Finance, Entrepreneurship, and Branding skills to unlock business opportunities.</div>
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
                    Est. {formatCurrency(t.monthlyRevenue[0], true)}–{formatCurrency(t.monthlyRevenue[1], true)}/mo
                  </div>
                  <div className="text-[10px] text-gray-500 italic mt-1">"{t.flavor}"</div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* LOCKED */}
      {tab === 'locked' && (
        <div className="grid grid-cols-4 gap-2">
          {allLocked.map(t => (
            <div key={t.id} className="card p-3 opacity-50">
              <div className="text-xl mb-1 grayscale">{t.icon}</div>
              <div className="text-xs font-semibold text-gray-500">{t.name}</div>
              <div className="text-[10px] text-gray-600 mt-1">
                {t.requiredUnlocks.map(u => u.replace(/_/g, ' ')).join(', ')}
              </div>
              {t.startupCost > player.finances.cash && (
                <div className="text-[10px] text-accent-red mt-1">
                  Need {formatCurrency(t.startupCost, true)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Launch modal */}
      <Modal isOpen={!!selectedTemplate} onClose={() => setSelectedTemplate(null)} title={template?.name} size="md">
        {template && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-4xl">{template.icon}</span>
              <div>
                <Badge variant="gray" size="xs">{template.category.replace(/_/g, ' ')}</Badge>
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
                <div className="text-[10px] text-gray-500 mb-1">Revenue Range</div>
                <div className="text-sm font-bold text-accent-green num">
                  {formatCurrency(template.monthlyRevenue[0], true)}–{formatCurrency(template.monthlyRevenue[1], true)}/mo
                </div>
              </div>
              <div className="bg-dark-600 rounded-xl p-3 text-center">
                <div className="text-[10px] text-gray-500 mb-1">Time Required</div>
                <div className="text-sm font-bold text-gray-200">{template.timeRequired}h/wk</div>
              </div>
            </div>

            <div className="p-3 bg-dark-600 rounded-lg space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400">Risk Level</span>
                <Badge variant={template.risk > 60 ? 'red' : template.risk > 30 ? 'yellow' : 'green'} size="xs">
                  {template.risk}%
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Scalability</span>
                <span className="text-accent-blue">{template.scalability}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Your Cash</span>
                <span className={player.finances.cash >= template.startupCost ? 'text-accent-green' : 'text-accent-red'}>
                  {formatCurrency(player.finances.cash, true)}
                </span>
              </div>
            </div>

            <div className="text-[11px] text-gray-500 leading-relaxed p-3 bg-dark-600 rounded-lg">
              <strong className="text-gray-300">Note:</strong> Revenue starts at ~30% capacity and ramps up over the first 3–6 months as your business gains traction.
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" fullWidth onClick={() => setSelectedTemplate(null)}>Cancel</Button>
              <Button
                variant={player.finances.cash >= template.startupCost ? 'success' : 'secondary'}
                fullWidth
                disabled={player.finances.cash < template.startupCost}
                onClick={() => { startBusiness(template.id); setSelectedTemplate(null); }}
              >
                {player.finances.cash >= template.startupCost
                  ? `Launch for ${formatCurrency(template.startupCost)}`
                  : 'Not Enough Cash'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Close confirmation */}
      <Modal isOpen={!!confirmClose} onClose={() => setConfirmClose(null)} title="Close Business" size="sm">
        {bizToClose && (
          <div className="space-y-4">
            <p className="text-sm text-gray-300">
              Close <strong className="text-white">{bizToClose.name}</strong>?
            </p>
            <div className="p-3 bg-dark-600 rounded-lg text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-400">Liquidation Value</span>
                <span className="text-accent-yellow">{formatCurrency(bizToClose.startupCost * 0.2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Lost Monthly Profit</span>
                <span className={bizToClose.monthlyProfit >= 0 ? 'text-accent-red' : 'text-accent-green'}>
                  {formatCurrency(bizToClose.monthlyProfit)}/mo
                </span>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" fullWidth onClick={() => setConfirmClose(null)}>Keep It</Button>
              <Button
                variant="danger"
                fullWidth
                onClick={() => { closeBusiness(confirmClose!); setConfirmClose(null); }}
              >
                Close Business
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
