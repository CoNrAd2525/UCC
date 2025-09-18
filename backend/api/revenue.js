const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { swarmState } = require('../utils/storage');
const { authenticate, authorize } = require('../utils/auth');
const router = express.Router();

router.use(authenticate);

// Get revenue overview
router.get('/overview', (req, res) => {
  const { timeframe = '30d' } = req.query;
  
  // Calculate timeframe
  const now = new Date();
  let startDate;
  
  switch (timeframe) {
    case '7d':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case '90d':
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  // Filter transactions in timeframe
  const transactions = Array.from(swarmState.revenue.transactions.values())
    .filter(t => new Date(t.timestamp) >= startDate);

  const totalRevenue = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalCosts = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const profit = totalRevenue - totalCosts;

  // Calculate daily breakdown
  const dailyBreakdown = [];
  const daysInPeriod = Math.ceil((now - startDate) / (1000 * 60 * 60 * 24));
  
  for (let i = 0; i < daysInPeriod; i++) {
    const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
    const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
    
    const dayTransactions = transactions.filter(t => {
      const tDate = new Date(t.timestamp);
      return tDate >= dayStart && tDate < dayEnd;
    });
    
    const dayRevenue = dayTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const dayCosts = dayTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    dailyBreakdown.push({
      date: dayStart.toISOString().split('T')[0],
      revenue: dayRevenue,
      costs: dayCosts,
      profit: dayRevenue - dayCosts,
      transactions: dayTransactions.length
    });
  }

  res.json({
    timeframe,
    summary: {
      totalRevenue,
      totalCosts,
      profit,
      profitMargin: totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0,
      transactionCount: transactions.length,
      averageDailyRevenue: totalRevenue / daysInPeriod,
      averageDailyCosts: totalCosts / daysInPeriod
    },
    dailyBreakdown,
    topAgents: getTopPerformingAgents(timeframe),
    revenueByCategory: getRevenueByCategory(transactions)
  });
});

// Get all transactions
router.get('/transactions', (req, res) => {
  const { page = 1, limit = 50, type, agent_id } = req.query;
  
  let transactions = Array.from(swarmState.revenue.transactions.values());
  
  // Apply filters
  if (type) {
    transactions = transactions.filter(t => t.type === type);
  }
  if (agent_id) {
    transactions = transactions.filter(t => t.agent_id === agent_id);
  }
  
  // Sort by timestamp (newest first)
  transactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  // Paginate
  const startIndex = (page - 1) * limit;
  const paginatedTransactions = transactions.slice(startIndex, startIndex + parseInt(limit));
  
  res.json({
    transactions: paginatedTransactions,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: transactions.length,
      pages: Math.ceil(transactions.length / limit)
    }
  });
});

// Create new transaction
router.post('/transactions', authorize(['admin', 'operator']), (req, res) => {
  const {
    type,
    amount,
    description,
    category,
    agent_id,
    metadata
  } = req.body;

  if (!type || !amount || !description) {
    return res.status(400).json({ error: 'Type, amount, and description are required' });
  }

  if (!['income', 'expense'].includes(type)) {
    return res.status(400).json({ error: 'Type must be income or expense' });
  }

  const transactionId = uuidv4();
  const transaction = {
    id: transactionId,
    type,
    amount: parseFloat(amount),
    description,
    category: category || 'general',
    agent_id: agent_id || null,
    metadata: metadata || {},
    timestamp: new Date().toISOString(),
    created_by: req.user.username
  };

  swarmState.revenue.transactions.set(transactionId, transaction);

  // Update agent metrics if applicable
  if (agent_id && swarmState.agents.has(agent_id)) {
    const agent = swarmState.agents.get(agent_id);
    if (type === 'income') {
      agent.metrics.totalRevenue = (agent.metrics.totalRevenue || 0) + transaction.amount;
    } else {
      agent.metrics.totalCosts = (agent.metrics.totalCosts || 0) + transaction.amount;
    }
    agent.metrics.profit = (agent.metrics.totalRevenue || 0) - (agent.metrics.totalCosts || 0);
    swarmState.agents.set(agent_id, agent);
  }

  // Add event
  swarmState.events.push({
    id: uuidv4(),
    type: 'revenue_transaction',
    message: `${type === 'income' ? 'Revenue' : 'Expense'} transaction: ${description} ($${amount})`,
    timestamp: new Date().toISOString(),
    severity: 'info',
    source: 'revenue'
  });

  res.status(201).json(transaction);
});

// Update transaction
router.put('/transactions/:id', authorize(['admin', 'operator']), (req, res) => {
  const { id } = req.params;
  const transaction = swarmState.revenue.transactions.get(id);
  
  if (!transaction) {
    return res.status(404).json({ error: 'Transaction not found' });
  }

  const updates = req.body;
  const updatedTransaction = { 
    ...transaction, 
    ...updates,
    updated_at: new Date().toISOString(),
    updated_by: req.user.username
  };
  
  swarmState.revenue.transactions.set(id, updatedTransaction);
  res.json(updatedTransaction);
});

// Delete transaction
router.delete('/transactions/:id', authorize(['admin']), (req, res) => {
  const { id } = req.params;
  
  if (!swarmState.revenue.transactions.has(id)) {
    return res.status(404).json({ error: 'Transaction not found' });
  }

  swarmState.revenue.transactions.delete(id);
  res.json({ message: 'Transaction deleted successfully' });
});

// Get revenue analytics
router.get('/analytics', (req, res) => {
  const { period = 'monthly' } = req.query;
  
  const analytics = {
    revenueGrowth: calculateRevenueGrowth(period),
    profitabilityAnalysis: getProfitabilityAnalysis(),
    agentPerformance: getAgentRevenuePerformance(),
    categoryBreakdown: getRevenueByCategory(),
    projections: getRevenueProjections(),
    kpis: calculateKPIs()
  };

  res.json(analytics);
});

// Helper functions
function getTopPerformingAgents(timeframe) {
  const agents = Array.from(swarmState.agents.values());
  return agents
    .map(agent => ({
      id: agent.id,
      name: agent.name,
      totalRevenue: agent.metrics.totalRevenue || 0,
      totalCosts: agent.metrics.totalCosts || 0,
      profit: (agent.metrics.totalRevenue || 0) - (agent.metrics.totalCosts || 0),
      tasksCompleted: agent.metrics.tasksCompleted || 0,
      successRate: agent.metrics.successRate || 0
    }))
    .sort((a, b) => b.profit - a.profit)
    .slice(0, 10);
}

function getRevenueByCategory(transactions = null) {
  if (!transactions) {
    transactions = Array.from(swarmState.revenue.transactions.values());
  }
  
  const categories = {};
  transactions.forEach(transaction => {
    const category = transaction.category || 'general';
    if (!categories[category]) {
      categories[category] = { income: 0, expense: 0, count: 0 };
    }
    
    if (transaction.type === 'income') {
      categories[category].income += transaction.amount;
    } else {
      categories[category].expense += transaction.amount;
    }
    categories[category].count++;
  });

  return Object.entries(categories).map(([category, data]) => ({
    category,
    income: data.income,
    expense: data.expense,
    profit: data.income - data.expense,
    transactionCount: data.count
  }));
}

function calculateRevenueGrowth(period) {
  // Simplified growth calculation
  const now = new Date();
  const lastPeriod = new Date(now.getTime() - (period === 'monthly' ? 30 : 7) * 24 * 60 * 60 * 1000);
  const previousPeriod = new Date(lastPeriod.getTime() - (period === 'monthly' ? 30 : 7) * 24 * 60 * 60 * 1000);

  const currentRevenue = Array.from(swarmState.revenue.transactions.values())
    .filter(t => t.type === 'income' && new Date(t.timestamp) >= lastPeriod)
    .reduce((sum, t) => sum + t.amount, 0);

  const previousRevenue = Array.from(swarmState.revenue.transactions.values())
    .filter(t => t.type === 'income' && 
      new Date(t.timestamp) >= previousPeriod && 
      new Date(t.timestamp) < lastPeriod)
    .reduce((sum, t) => sum + t.amount, 0);

  const growthRate = previousRevenue > 0 ? 
    ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0;

  return {
    current: currentRevenue,
    previous: previousRevenue,
    growthRate,
    period
  };
}

function getProfitabilityAnalysis() {
  const transactions = Array.from(swarmState.revenue.transactions.values());
  const totalRevenue = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalCosts = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  return {
    grossRevenue: totalRevenue,
    totalCosts,
    grossProfit: totalRevenue - totalCosts,
    profitMargin: totalRevenue > 0 ? ((totalRevenue - totalCosts) / totalRevenue) * 100 : 0,
    breakEvenPoint: totalCosts > 0 ? totalCosts : 0
  };
}

function getAgentRevenuePerformance() {
  return Array.from(swarmState.agents.values()).map(agent => ({
    id: agent.id,
    name: agent.name,
    revenue: agent.metrics.totalRevenue || 0,
    costs: agent.metrics.totalCosts || 0,
    profit: (agent.metrics.totalRevenue || 0) - (agent.metrics.totalCosts || 0),
    roi: (agent.metrics.totalCosts || 0) > 0 ? 
      (((agent.metrics.totalRevenue || 0) - (agent.metrics.totalCosts || 0)) / (agent.metrics.totalCosts || 0)) * 100 : 0
  }));
}

function getRevenueProjections() {
  // Simple projection based on recent trends
  const recentTransactions = Array.from(swarmState.revenue.transactions.values())
    .filter(t => {
      const transactionDate = new Date(t.timestamp);
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      return transactionDate >= thirtyDaysAgo;
    });

  const dailyAverage = recentTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0) / 30;

  return {
    nextMonth: dailyAverage * 30,
    nextQuarter: dailyAverage * 90,
    nextYear: dailyAverage * 365
  };
}

function calculateKPIs() {
  const agents = Array.from(swarmState.agents.values());
  const transactions = Array.from(swarmState.revenue.transactions.values());
  
  const totalRevenue = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const activeAgents = agents.filter(a => a.status === 'active').length;
  
  return {
    revenuePerAgent: activeAgents > 0 ? totalRevenue / activeAgents : 0,
    averageTransactionValue: transactions.length > 0 ? 
      totalRevenue / transactions.filter(t => t.type === 'income').length : 0,
    monthlyRecurringRevenue: dailyAverage * 30, // Simplified
    customerLifetimeValue: totalRevenue / Math.max(activeAgents, 1) * 12 // Simplified
  };
}

module.exports = router;