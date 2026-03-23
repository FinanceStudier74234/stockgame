import { GameEvent } from '../types';

export const GAME_EVENTS: GameEvent[] = [
  // ---- CAREER EVENTS ----
  {
    id: 'job_offer_better',
    title: 'Better Job Offer',
    description: 'You receive an unsolicited call from a recruiter. They have a role that pays 30% more than your current job. Risk: it\'s at a smaller, less stable company.',
    category: 'career',
    flavor: '"We\'d love to have someone with your potential on our team."',
    probability: 0.08,
    isOneTime: false,
    choices: [
      {
        id: 'accept',
        label: 'Accept the Offer',
        description: 'Take the higher paying role. More risk, more reward.',
        outcomes: [
          {
            probability: 0.70,
            description: 'The new job is great. Big pay increase and fast track to promotion.',
            cashChange: 8000,
            statChanges: { confidence: 10, reputation: 8, stress: 8 },
            skillChanges: { networking: 3 },
            addBiography: 'Took a bold career leap for a 30% pay increase.',
          },
          {
            probability: 0.30,
            description: 'The company culture is toxic. You survive but it\'s rough.',
            cashChange: 3000,
            statChanges: { stress: 20, confidence: -5, health: -5 },
            addBiography: 'Jumped for more money but landed in a difficult environment.',
          },
        ],
        risk: 35,
        rewardPotential: 75,
      },
      {
        id: 'negotiate_current',
        label: 'Use it to Negotiate a Raise',
        description: 'Go back to your boss with the offer as leverage.',
        outcomes: [
          {
            probability: 0.55,
            description: 'Your boss matches the offer. You stay and get paid more.',
            cashChange: 4000,
            statChanges: { confidence: 8, reputation: 5 },
            skillChanges: { negotiation: 5 },
            addBiography: 'Successfully negotiated a raise using a competing offer.',
          },
          {
            probability: 0.45,
            description: 'Your boss calls your bluff. Awkward. No raise, no new job.',
            statChanges: { stress: 10, confidence: -8, reputation: -3 },
            addBiography: 'Tried to negotiate with a competing offer. It backfired.',
          },
        ],
        risk: 45,
        rewardPotential: 50,
      },
      {
        id: 'decline',
        label: 'Stay at Current Job',
        description: 'Play it safe. Stability over risk.',
        outcomes: [
          {
            probability: 1.0,
            description: 'You stay. Nothing changes, but you have peace of mind.',
            statChanges: { stress: -5 },
          },
        ],
        risk: 0,
        rewardPotential: 0,
      },
    ],
    conditions: [],
  },
  {
    id: 'market_tip',
    title: 'Hot Stock Tip',
    description: 'A coworker whispers that they heard a company is about to announce major news. You can\'t verify it, but they seem confident. This could be insider information territory.',
    category: 'market',
    flavor: '"I\'m just saying... the timing seems... interesting."',
    probability: 0.06,
    isOneTime: false,
    choices: [
      {
        id: 'invest_big',
        label: 'Go All In',
        description: 'Bet big on the tip.',
        outcomes: [
          {
            probability: 0.45,
            description: 'The news drops and the stock surges 40%. You made a killing.',
            cashChange: 15000,
            statChanges: { confidence: 15, riskTolerance: 5 },
            addBiography: 'A hot tip turned into a massive windfall.',
          },
          {
            probability: 0.35,
            description: 'The news was already priced in. The stock barely moves.',
            cashChange: -1000,
            statChanges: { confidence: -5 },
          },
          {
            probability: 0.20,
            description: 'The stock crashes instead. The tip was wrong.',
            cashChange: -8000,
            statChanges: { confidence: -15, stress: 20 },
            addBiography: 'A hot stock tip burned me. Learned not to trust rumors.',
          },
        ],
        risk: 75,
        rewardPotential: 90,
        requiresCash: 5000,
      },
      {
        id: 'invest_small',
        label: 'Put In a Small Amount',
        description: 'Bet just enough to participate if it works.',
        outcomes: [
          {
            probability: 0.45,
            description: 'The stock pops. Small position but a great percentage gain.',
            cashChange: 2000,
            statChanges: { confidence: 8 },
          },
          {
            probability: 0.55,
            description: 'Doesn\'t pan out. You lose the small amount.',
            cashChange: -800,
            statChanges: { confidence: -3 },
          },
        ],
        risk: 45,
        rewardPotential: 40,
        requiresCash: 1000,
      },
      {
        id: 'ignore',
        label: 'Ignore the Tip',
        description: 'Stick to your process. Don\'t trade on rumors.',
        outcomes: [
          {
            probability: 1.0,
            description: 'You pass. Smart or missed opportunity? You\'ll never know.',
            skillChanges: { tradingPsychology: 3 },
            statChanges: { discipline: 5 },
          },
        ],
        risk: 0,
        rewardPotential: 0,
      },
    ],
  },
  {
    id: 'mentor_appears',
    title: 'A Mentor Appears',
    description: 'You meet a retired hedge fund manager at a local event. He takes an interest in you and offers to share what he knows. Time is limited - he\'s leaving the country in 3 months.',
    category: 'opportunity',
    flavor: '"Everyone I know who succeeded had someone show them the ropes. Let me show you."',
    probability: 0.04,
    isOneTime: true,
    minLevel: 2,
    choices: [
      {
        id: 'commit_fully',
        label: 'Commit Fully - Every Weekend for 3 Months',
        description: 'Sacrifice your weekends to absorb everything he knows.',
        outcomes: [
          {
            probability: 0.85,
            description: 'Transformative experience. You absorb decades of wisdom in months.',
            skillChanges: { finance: 15, valuation: 12, macroAnalysis: 10, tradingPsychology: 15 },
            statChanges: { financialKnowledge: 20, investingSkill: 15, confidence: 12, reputation: 8 },
            addBiography: 'Was mentored by a retired hedge fund legend. Life-changing.',
            unlockMechanic: 'advanced_strategies',
          },
          {
            probability: 0.15,
            description: 'Good learning but his style doesn\'t fit yours. Still very valuable.',
            skillChanges: { finance: 8, valuation: 6, macroAnalysis: 5, tradingPsychology: 8 },
            statChanges: { financialKnowledge: 12, investingSkill: 8 },
            addBiography: 'Had a mentor who pushed your thinking significantly.',
          },
        ],
        risk: 10,
        rewardPotential: 95,
      },
      {
        id: 'casual_meetups',
        label: 'Casual Monthly Meetups',
        description: 'Pick his brain occasionally without full commitment.',
        outcomes: [
          {
            probability: 1.0,
            description: 'You get some good insights but miss the deeper lessons.',
            skillChanges: { finance: 5, valuation: 4, macroAnalysis: 3 },
            statChanges: { financialKnowledge: 8, investingSkill: 5 },
            addBiography: 'Had casual mentorship with an experienced investor.',
          },
        ],
        risk: 0,
        rewardPotential: 40,
      },
      {
        id: 'decline_mentor',
        label: 'Politely Decline',
        description: 'Too busy. Maybe next time.',
        outcomes: [
          {
            probability: 1.0,
            description: 'You decline. He respects the decision and moves on.',
            statChanges: { stress: -5 },
          },
        ],
        risk: 0,
        rewardPotential: 0,
      },
    ],
  },
  {
    id: 'market_crash_alert',
    title: 'Signs of a Coming Crash',
    description: 'Your research is showing classic bear market signals. Credit spreads widening, leading indicators falling, insiders selling. The market is still up but feels fragile.',
    category: 'market',
    flavor: '"When the music is playing, everyone dances. But where will you be when it stops?"',
    probability: 0.05,
    isOneTime: false,
    triggeredByPhase: ['euphoria', 'boom'],
    choices: [
      {
        id: 'go_defensive',
        label: 'Go Defensive - Sell 50% of Portfolio',
        description: 'Reduce risk ahead of potential crash.',
        outcomes: [
          {
            probability: 0.60,
            description: 'Smart call. Market drops 30% and you only lose half.',
            statChanges: { confidence: 15, discipline: 10 },
            skillChanges: { macroAnalysis: 8, tradingPsychology: 8 },
            addBiography: 'Called a market crash and moved defensive. Preserved capital.',
          },
          {
            probability: 0.40,
            description: 'Market keeps rallying. You miss the gains. Called it too early.',
            statChanges: { confidence: -10 },
            skillChanges: { tradingPsychology: 5 },
            addBiography: 'Sold too early before a crash that came later than expected.',
          },
        ],
        risk: 25,
        rewardPotential: 70,
      },
      {
        id: 'short_market',
        label: 'Go Short - Bet on a Crash',
        description: 'Put on hedges and short positions.',
        outcomes: [
          {
            probability: 0.50,
            description: 'The market crashes. Your shorts print massively.',
            cashChange: 25000,
            statChanges: { confidence: 25, reputation: 15, riskTolerance: 5 },
            addBiography: 'Shorted the market ahead of a major crash. Legendary trade.',
          },
          {
            probability: 0.50,
            description: 'The market keeps running. Your shorts bleed. Painful lesson.',
            cashChange: -10000,
            statChanges: { confidence: -15, stress: 20 },
            addBiography: 'Tried to short the market too early. Painful.',
          },
        ],
        risk: 80,
        rewardPotential: 95,
        requiresSkill: { options: 10 },
      },
      {
        id: 'stay_invested',
        label: 'Stay Fully Invested',
        description: 'Time in the market beats timing the market.',
        outcomes: [
          {
            probability: 0.45,
            description: 'You were right to stay. Market keeps climbing.',
            statChanges: { confidence: 10 },
          },
          {
            probability: 0.55,
            description: 'Market crashes. You ride it down. Painful paper losses.',
            statChanges: { stress: 25, confidence: -10 },
            skillChanges: { tradingPsychology: 5 },
            addBiography: 'Held through a significant market crash. Character building.',
          },
        ],
        risk: 55,
        rewardPotential: 50,
      },
    ],
  },
  {
    id: 'business_opportunity',
    title: 'Business Opportunity',
    description: 'A friend is starting a small business and needs a co-founder with capital and drive. The idea is a finance newsletter targeting retail investors. Startup cost: $5,000.',
    category: 'business',
    flavor: '"We could build something really special together. I just need someone I can trust."',
    probability: 0.05,
    isOneTime: false,
    minNetWorth: 5000,
    choices: [
      {
        id: 'co_found',
        label: 'Co-Found the Business ($5,000 Investment)',
        description: 'Put in cash and time to build together.',
        outcomes: [
          {
            probability: 0.55,
            description: 'The newsletter grows to 5,000 subscribers. Monthly cash flow!',
            cashChange: -5000,
            statChanges: { reputation: 10, network: 8, confidence: 10 },
            skillChanges: { entrepreneurship: 10, branding: 8, sales: 6 },
            unlockMechanic: 'side_business',
            addBiography: 'Co-founded a finance newsletter that became profitable.',
          },
          {
            probability: 0.30,
            description: 'It struggles to get traction. You part ways after 6 months.',
            cashChange: -5000,
            statChanges: { stress: 15 },
            skillChanges: { entrepreneurship: 5 },
            addBiography: 'A business venture didn\'t pan out. Learned valuable lessons.',
          },
          {
            probability: 0.15,
            description: 'The business grows fast. A media company offers to acquire it.',
            cashChange: 40000,
            statChanges: { confidence: 20, reputation: 20, network: 15 },
            skillChanges: { entrepreneurship: 15, branding: 12 },
            unlockMechanic: 'side_business',
            addBiography: 'Co-founded a business that got acquired for 8x return.',
          },
        ],
        risk: 50,
        rewardPotential: 80,
        requiresCash: 5000,
      },
      {
        id: 'invest_only',
        label: 'Just Invest ($2,000), No Time Commitment',
        description: 'Put in money but stay hands-off.',
        outcomes: [
          {
            probability: 0.50,
            description: 'Pays out over time with modest returns.',
            cashChange: 1500,
            statChanges: { network: 5 },
          },
          {
            probability: 0.50,
            description: 'Fails. You lose your investment.',
            cashChange: -2000,
            statChanges: { stress: 8 },
          },
        ],
        risk: 40,
        rewardPotential: 40,
        requiresCash: 2000,
      },
      {
        id: 'pass_business',
        label: 'Pass on This One',
        description: 'Not the right time or opportunity.',
        outcomes: [
          {
            probability: 1.0,
            description: 'You pass. Focus on what you\'re already doing.',
          },
        ],
        risk: 0,
        rewardPotential: 0,
      },
    ],
  },
  {
    id: 'health_scare',
    title: 'Health Scare',
    description: 'You\'ve been burning the candle at both ends. A doctor visit reveals you\'re dangerously stressed. They recommend you reduce your workload for a few weeks.',
    category: 'personal',
    flavor: '"Your cortisol levels are off the charts. This is a warning."',
    probability: 0.06,
    isOneTime: false,
    conditions: [{ field: 'stress', operator: '>', value: 70 }],
    choices: [
      {
        id: 'take_break',
        label: 'Take a Real Break (2 Weeks)',
        description: 'Rest, recover, and come back stronger.',
        outcomes: [
          {
            probability: 1.0,
            description: 'You recover your health and mental clarity. Worth every day.',
            statChanges: { health: 20, energy: 25, stress: -35, discipline: 5 },
            addBiography: 'Hit burnout and took time off to recover.',
          },
        ],
        risk: 5,
        rewardPotential: 40,
      },
      {
        id: 'power_through',
        label: 'Power Through - No Time to Stop',
        description: 'You\'re too close to something important.',
        outcomes: [
          {
            probability: 0.40,
            description: 'You push through and hit your goals. Iron will.',
            statChanges: { discipline: 8, health: -10 },
            skillChanges: { tradingPsychology: 3 },
          },
          {
            probability: 0.60,
            description: 'Your health deteriorates. You get sick and miss even more time.',
            statChanges: { health: -25, energy: -30, stress: 15 },
            addBiography: 'Ignored health warning signs and paid for it.',
          },
        ],
        risk: 65,
        rewardPotential: 25,
      },
    ],
  },
  {
    id: 'lp_opportunity',
    title: 'Limited Partner Interest',
    description: 'Your track record has caught the attention of a family office. They\'re interested in allocating $500,000 to your fund. This is your chance to raise institutional capital.',
    category: 'fund',
    flavor: '"We\'ve been watching your performance for 18 months. We like what we see."',
    probability: 0.04,
    isOneTime: false,
    minLevel: 8,
    requiredMechanics: ['hedge_fund_registered'],
    choices: [
      {
        id: 'accept_lp',
        label: 'Accept the Allocation',
        description: 'Take the money. Prove yourself with institutional capital.',
        outcomes: [
          {
            probability: 0.80,
            description: 'The capital comes in smoothly. Your AUM is now significantly larger.',
            statChanges: { reputation: 15, confidence: 10, network: 10 },
            addBiography: 'Attracted first institutional capital to the fund.',
            unlockMechanic: 'institutional_capital',
          },
          {
            probability: 0.20,
            description: 'They add restrictive terms at the last minute. Painful negotiation.',
            statChanges: { stress: 15, reputation: 5 },
            skillChanges: { negotiation: 8 },
          },
        ],
        risk: 20,
        rewardPotential: 90,
      },
      {
        id: 'negotiate_terms',
        label: 'Negotiate Better Terms First',
        description: 'Push back on fees and lockup periods.',
        outcomes: [
          {
            probability: 0.55,
            description: 'You get favorable terms. Smart negotiation.',
            statChanges: { reputation: 12, confidence: 12 },
            skillChanges: { negotiation: 10 },
            addBiography: 'Negotiated excellent LP terms for the fund.',
            unlockMechanic: 'institutional_capital',
          },
          {
            probability: 0.45,
            description: 'They walk away. Too much pushback for their style.',
            statChanges: { stress: 10, confidence: -5 },
            addBiography: 'Lost an LP deal through over-negotiation.',
          },
        ],
        risk: 40,
        rewardPotential: 80,
      },
      {
        id: 'decline_lp',
        label: 'Decline - Not Ready for Outside Capital',
        description: 'Stay independent until you\'re more confident.',
        outcomes: [
          {
            probability: 1.0,
            description: 'You maintain independence. It feels right for now.',
            statChanges: { stress: -5 },
          },
        ],
        risk: 0,
        rewardPotential: 0,
      },
    ],
  },
  {
    id: 'short_squeeze',
    title: 'Meme Stock Short Squeeze',
    description: 'Social media is going crazy. A heavily shorted stock is exploding. Retail traders are piling in and squeezing shorts. You have a chance to ride the momentum - or be destroyed by it.',
    category: 'market',
    flavor: '"To the moon! Diamond hands! The hedge funds are scared!"',
    probability: 0.04,
    isOneTime: false,
    choices: [
      {
        id: 'ride_momentum',
        label: 'Buy and Ride the Squeeze',
        description: 'Join the retail army. High risk, enormous potential.',
        outcomes: [
          {
            probability: 0.35,
            description: 'Perfect timing. You get in early and ride it up 300%.',
            cashChange: 20000,
            statChanges: { confidence: 20, riskTolerance: 8 },
            addBiography: 'Rode a meme stock short squeeze for a massive gain.',
          },
          {
            probability: 0.45,
            description: 'You buy at the top. The squeeze reverses violently.',
            cashChange: -8000,
            statChanges: { confidence: -15, stress: 20 },
            addBiography: 'Got caught in a meme stock reversal. Painful lesson.',
          },
          {
            probability: 0.20,
            description: 'Moderate gain. You time an exit before the crash.',
            cashChange: 5000,
            statChanges: { confidence: 10 },
          },
        ],
        risk: 85,
        rewardPotential: 95,
        requiresCash: 3000,
      },
      {
        id: 'short_the_squeeze',
        label: 'Short the Squeeze - Bet Against It',
        description: 'These things always end badly. Bet on the collapse.',
        outcomes: [
          {
            probability: 0.35,
            description: 'It collapses and your short prints. Contrarian genius.',
            cashChange: 15000,
            statChanges: { confidence: 20, reputation: 10 },
          },
          {
            probability: 0.65,
            description: 'The squeeze continues longer than logic allows. Massive loss.',
            cashChange: -15000,
            statChanges: { confidence: -20, stress: 30 },
            addBiography: 'Shorted a squeeze too early. Nearly wiped out.',
          },
        ],
        risk: 95,
        rewardPotential: 80,
        requiresSkill: { options: 15 },
        requiresCash: 5000,
      },
      {
        id: 'watch_sidelines',
        label: 'Watch from the Sidelines',
        description: 'Not your game. Real investors don\'t play in casinos.',
        outcomes: [
          {
            probability: 1.0,
            description: 'You watch the chaos unfold. Either the right call or a missed opportunity.',
            skillChanges: { tradingPsychology: 4 },
            statChanges: { discipline: 5 },
          },
        ],
        risk: 0,
        rewardPotential: 0,
      },
    ],
  },
  {
    id: 'black_swan_crisis',
    title: 'Black Swan Event',
    description: 'An unexpected crisis hits the global financial system. Banks are panicking, credit is freezing, and the market is in freefall. No one knows how bad it will get.',
    category: 'black_swan',
    flavor: '"Events that were supposed to happen once every hundred years now seem to happen every decade."',
    probability: 0.02,
    isOneTime: false,
    triggeredByPhase: ['crisis'],
    choices: [
      {
        id: 'buy_the_dip',
        label: 'Be Greedy When Others Are Fearful',
        description: 'Deploy everything into the crash. All in.',
        outcomes: [
          {
            probability: 0.65,
            description: 'Brilliant contrarian call. You buy generational lows.',
            cashChange: 50000,
            statChanges: { confidence: 25, reputation: 20 },
            skillChanges: { tradingPsychology: 12, macroAnalysis: 8 },
            addBiography: 'Bought a black swan crash with conviction. Life-defining trade.',
          },
          {
            probability: 0.35,
            description: 'The crisis gets worse before it gets better. Deep paper losses.',
            cashChange: -20000,
            statChanges: { stress: 30, confidence: -10 },
            addBiography: 'Bought the crash but it kept crashing. Survived but shaken.',
          },
        ],
        risk: 75,
        rewardPotential: 98,
        requiresCash: 10000,
      },
      {
        id: 'hedged_approach',
        label: 'Careful Accumulation with Hedges',
        description: 'Deploy capital slowly with protective options.',
        outcomes: [
          {
            probability: 0.80,
            description: 'Smart risk management during the crisis. Good results.',
            cashChange: 20000,
            statChanges: { confidence: 15, reputation: 15 },
            skillChanges: { options: 8, macroAnalysis: 6 },
            addBiography: 'Navigated a black swan with disciplined risk management.',
          },
          {
            probability: 0.20,
            description: 'Hedges cost more than the recovery gains.',
            cashChange: 5000,
            statChanges: { confidence: 5 },
          },
        ],
        risk: 40,
        rewardPotential: 70,
        requiresSkill: { options: 10 },
        requiresCash: 5000,
      },
      {
        id: 'hunker_down',
        label: 'Move to Cash - Protect What You Have',
        description: 'Capital preservation above all else.',
        outcomes: [
          {
            probability: 1.0,
            description: 'You protect your capital but miss the recovery.',
            statChanges: { stress: -20 },
            skillChanges: { tradingPsychology: 5 },
          },
        ],
        risk: 5,
        rewardPotential: 0,
      },
    ],
  },
];

export function getRandomEvents(
  count: number,
  phase: string,
  playerLevel: number,
  netWorth: number,
  unlockedMechanics: string[],
  triggeredEvents: string[]
): GameEvent[] {
  const eligible = GAME_EVENTS.filter(event => {
    if (event.isOneTime && triggeredEvents.includes(event.id)) return false;
    if (event.minLevel && playerLevel < event.minLevel) return false;
    if (event.minNetWorth && netWorth < event.minNetWorth) return false;
    if (event.maxNetWorth && netWorth > event.maxNetWorth) return false;
    if (event.requiredMechanics && !event.requiredMechanics.every(m => unlockedMechanics.includes(m))) return false;
    if (event.triggeredByPhase && !event.triggeredByPhase.includes(phase as any)) return false;
    return Math.random() < event.probability;
  });

  return eligible.slice(0, count);
}
