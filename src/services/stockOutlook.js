const MOCK_MARKET_DATA = {
  AVGO: {
    currentPrice: 1420.75,
    recentPerformanceNote: '+3.8% over the last 5 sessions',
    marketSentiment: 'Bullish',
    analystConsensus: 'Moderate Buy',
    volatility: 'medium'
  },
  NVDA: {
    currentPrice: 125.61,
    recentPerformanceNote: '+4.6% over the last 5 sessions',
    marketSentiment: 'Bullish',
    analystConsensus: 'Strong Buy',
    volatility: 'high'
  },
  MSFT: {
    currentPrice: 452.18,
    recentPerformanceNote: '+1.2% over the last 5 sessions',
    marketSentiment: 'Neutral',
    analystConsensus: 'Buy',
    volatility: 'low'
  },
  TSLA: {
    currentPrice: 178.42,
    recentPerformanceNote: '-2.9% over the last 5 sessions',
    marketSentiment: 'Bearish',
    analystConsensus: 'Hold',
    volatility: 'high'
  },
  AAPL: {
    currentPrice: 214.35,
    recentPerformanceNote: '+0.7% over the last 5 sessions',
    marketSentiment: 'Neutral',
    analystConsensus: 'Buy',
    volatility: 'low'
  },
  NFLX: {
    currentPrice: 648.92,
    recentPerformanceNote: '+2.4% over the last 5 sessions',
    marketSentiment: 'Bullish',
    analystConsensus: 'Buy',
    volatility: 'medium'
  },
  IONQ: {
    currentPrice: 36.78,
    recentPerformanceNote: '-4.1% over the last 5 sessions',
    marketSentiment: 'Bearish',
    analystConsensus: 'Hold',
    volatility: 'high'
  }
};

function hashTicker(symbol) {
  return symbol.split('').reduce((hash, char) => {
    const nextHash = (hash ^ char.charCodeAt(0)) * 16777619;
    return nextHash >>> 0;
  }, 2166136261);
}

export function normalizeTicker(value = '') {
  return value.trim().toUpperCase().replace(/[^A-Z0-9.-]/g, '').slice(0, 10);
}

export function validateTicker(symbol) {
  if (!symbol) {
    return 'Enter an asset symbol to generate a stock outlook.';
  }

  if (!/^[A-Z][A-Z0-9.-]{0,9}$/.test(symbol)) {
    return 'Use a valid ticker such as AVGO, NVDA, MSFT, TSLA, or AAPL.';
  }

  return '';
}

export function formatPrice(value) {
  if (!Number.isFinite(value)) {
    return 'Unavailable';
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: value >= 1000 ? 0 : 2
  }).format(value);
}

function createFallbackMarketData(symbol) {
  const seed = hashTicker(symbol);
  const priceBands = [18, 42, 75, 120, 185, 260, 420, 680, 980];
  const basePrice = priceBands[seed % priceBands.length];
  const currentPrice = basePrice + ((seed >>> 8) % 95) + (((seed >>> 16) % 100) / 100);
  const sentimentIndex = seed % 3;
  const sentiment = sentimentIndex === 0 ? 'Bullish' : sentimentIndex === 1 ? 'Neutral' : 'Bearish';
  const performancePrefix = sentiment === 'Bearish' ? '-' : '+';
  const performance = `${performancePrefix}${(((seed >>> 12) % 55) / 10 + 0.3).toFixed(1)}% over the last 5 sessions`;
  const volatilityOptions = ['low', 'medium', 'high'];
  const consensusOptions = sentiment === 'Bullish' ? ['Buy', 'Moderate Buy'] : sentiment === 'Bearish' ? ['Hold', 'Reduce'] : ['Hold', 'Neutral'];

  return {
    currentPrice,
    recentPerformanceNote: performance,
    marketSentiment: sentiment,
    analystConsensus: consensusOptions[(seed >>> 4) % consensusOptions.length],
    volatility: volatilityOptions[(seed >>> 20) % volatilityOptions.length]
  };
}

export function getLatestMarketData(symbol) {
  return MOCK_MARKET_DATA[symbol] || createFallbackMarketData(symbol);
}

export function calculateTradingZones(marketData) {
  const price = marketData.currentPrice;
  const volatilityFactor = marketData.volatility === 'high' ? 0.045 : marketData.volatility === 'low' ? 0.024 : 0.034;
  const supportLow = price * (1 - volatilityFactor * 1.65);
  const supportHigh = price * (1 - volatilityFactor * 0.8);
  const resistanceLow = price * (1 + volatilityFactor * 0.8);
  const resistanceHigh = price * (1 + volatilityFactor * 1.65);

  return {
    supportLow,
    supportHigh,
    holdLow: supportHigh,
    holdHigh: resistanceLow,
    resistanceLow,
    resistanceHigh,
    keySupport: supportLow
  };
}

function formatRange(low, high) {
  return `${formatPrice(low)} - ${formatPrice(high)}`;
}

export function generateActionSummary(zones) {
  return [
    { priceRange: `Below ${formatPrice(zones.supportHigh)}`, action: 'Buy', tone: 'buy' },
    { priceRange: formatRange(zones.holdLow, zones.holdHigh), action: 'Hold', tone: 'hold' },
    { priceRange: `Above ${formatPrice(zones.resistanceLow)}`, action: 'Trim', tone: 'trim' }
  ];
}

export function generateFinalVerdict(marketData, zones) {
  const sentiment = marketData.marketSentiment.toLowerCase();

  if (sentiment === 'bullish') {
    return {
      rating: 'Buy on Dips',
      conclusion: `Momentum is constructive while price holds above ${formatPrice(zones.keySupport)}.`
    };
  }

  if (sentiment === 'bearish') {
    return {
      rating: 'Trim',
      conclusion: `Weak short-term tape favors reducing exposure near ${formatPrice(zones.resistanceLow)}.`
    };
  }

  return {
    rating: 'Hold',
    conclusion: `Range action favors patience between ${formatRange(zones.holdLow, zones.holdHigh)}.`
  };
}

export function buildStockOutlook(symbol, latestData) {
  const marketData = latestData || getLatestMarketData(symbol);
  const zones = calculateTradingZones(marketData);
  const actionSummary = generateActionSummary(zones);
  const verdict = generateFinalVerdict(marketData, zones);
  const sentiment = marketData.marketSentiment.toLowerCase();

  return {
    asset: symbol,
    targetPeriod: 'Next 1-2 weeks',
    currentDate: new Date().toISOString().slice(0, 10),
    snapshot: {
      price: formatPrice(marketData.currentPrice),
      recentPerformanceNote: marketData.recentPerformanceNote,
      sentiment: `${marketData.marketSentiment} short-term bias`,
      marketMood: sentiment === 'bullish' ? 'Risk-on now, constructive longer term' : sentiment === 'bearish' ? 'Defensive now, cautious longer term' : 'Mixed now, steady longer term',
      analystConsensus: marketData.analystConsensus || 'Not available'
    },
    zones: {
      buyZone: formatRange(zones.supportLow, zones.supportHigh),
      holdZone: formatRange(zones.holdLow, zones.holdHigh),
      trimZone: formatRange(zones.resistanceLow, zones.resistanceHigh),
      keySupport: formatPrice(zones.keySupport),
      resistance: formatRange(zones.resistanceLow, zones.resistanceHigh)
    },
    strategy: {
      buyNear: formatRange(zones.supportLow, zones.supportHigh),
      holdAbove: formatPrice(zones.keySupport),
      trimNear: formatRange(zones.resistanceLow, zones.resistanceHigh)
    },
    actionSummary,
    verdict,
    dataSource: MOCK_MARKET_DATA[symbol] ? 'Mock sample data' : 'Deterministic mock data'
  };
}
