const MOCK_MARKET_DATA = {
  AVGO: { currentPrice: 1420.75, marketSentiment: 'Bullish', analystConsensus: 'Moderate Buy', volatility: 'medium' },
  NVDA: { currentPrice: 125.61, marketSentiment: 'Bullish', analystConsensus: 'Strong Buy', volatility: 'high' },
  MSFT: { currentPrice: 452.18, marketSentiment: 'Neutral', analystConsensus: 'Buy', volatility: 'low' },
  TSLA: { currentPrice: 178.42, marketSentiment: 'Bearish', analystConsensus: 'Hold', volatility: 'high' },
  AAPL: { currentPrice: 214.35, marketSentiment: 'Neutral', analystConsensus: 'Buy', volatility: 'low' },
  NFLX: { currentPrice: 648.92, marketSentiment: 'Bullish', analystConsensus: 'Buy', volatility: 'medium' },
  IONQ: { currentPrice: 36.78, marketSentiment: 'Bearish', analystConsensus: 'Hold', volatility: 'high' }
};

function hashTicker(symbol) {
  return symbol.split('').reduce((hash, char) => ((hash ^ char.charCodeAt(0)) * 16777619) >>> 0, 2166136261);
}

function compactNumber(value) {
  return Number.isFinite(value) ? Number(value.toFixed(2)) : null;
}

function average(values) {
  const valid = values.filter(Number.isFinite);
  return valid.length ? valid.reduce((total, value) => total + value, 0) / valid.length : 0;
}

function formatPrice(value) {
  if (!Number.isFinite(value)) {
    return 'Unavailable';
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: value >= 1000 ? 0 : 2
  }).format(value);
}

function formatRange(low, high) {
  return `${formatPrice(low)} - ${formatPrice(high)}`;
}

function deriveSentiment({ currentPrice, closes, previousClose }) {
  const sma5 = average(closes.slice(-5));
  const sma20 = average(closes.slice(-20));
  const dayChange = previousClose ? (currentPrice - previousClose) / previousClose : 0;

  if (currentPrice > sma5 && sma5 >= sma20 && dayChange >= -0.005) {
    return 'Bullish';
  }

  if (currentPrice < sma5 && sma5 <= sma20 && dayChange <= 0.005) {
    return 'Bearish';
  }

  return 'Neutral';
}

function deriveVolatility({ currentPrice, highs, lows }) {
  const ranges = highs.slice(-10).map((high, index) => Math.abs(high - (lows.slice(-10)[index] || high)));
  const rangeRatio = currentPrice ? average(ranges) / currentPrice : 0;

  if (rangeRatio >= 0.045) {
    return 'high';
  }

  if (rangeRatio <= 0.024) {
    return 'low';
  }

  return 'medium';
}

function performanceNote({ closes, currentPrice, previousClose }) {
  const base = closes.length >= 6 ? closes[closes.length - 6] : previousClose;
  const change = base ? ((currentPrice - base) / base) * 100 : 0;
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(1)}% over the last 5 sessions`;
}

async function fetchYahooChart(symbol) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1mo&interval=1d`;

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'User-Agent': 'Mozilla/5.0 AstroNumerix'
      }
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const result = data?.chart?.result?.[0];
    const quote = result?.indicators?.quote?.[0];
    const meta = result?.meta || {};

    if (!result || !quote) {
      return null;
    }

    const closes = (quote.close || []).filter(Number.isFinite);
    const highs = (quote.high || []).filter(Number.isFinite);
    const lows = (quote.low || []).filter(Number.isFinite);
    const currentPrice = Number(meta.regularMarketPrice || closes[closes.length - 1]);
    const previousClose = Number(meta.previousClose || closes[closes.length - 2]);

    if (!Number.isFinite(currentPrice) || !closes.length) {
      return null;
    }

    return {
      currentPrice,
      previousClose,
      closes,
      highs,
      lows,
      recentPerformanceNote: performanceNote({ closes, currentPrice, previousClose }),
      marketSentiment: deriveSentiment({ currentPrice, closes, previousClose }),
      analystConsensus: 'Not available',
      volatility: deriveVolatility({ currentPrice, highs, lows }),
      support: Math.min(...lows.slice(-20).filter(Number.isFinite)),
      resistance: Math.max(...highs.slice(-20).filter(Number.isFinite)),
      dataSource: 'Yahoo Finance chart'
    };
  } catch (error) {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function createFallbackMarketData(symbol) {
  const sample = MOCK_MARKET_DATA[symbol];

  if (sample) {
    return {
      ...sample,
      recentPerformanceNote: `${sample.marketSentiment === 'Bearish' ? '-' : '+'}${sample.volatility === 'high' ? '4.1' : sample.volatility === 'medium' ? '2.4' : '0.8'}% over the last 5 sessions`,
      dataSource: 'Mock sample data'
    };
  }

  const seed = hashTicker(symbol);
  const priceBands = [18, 42, 75, 120, 185, 260, 420, 680, 980];
  const basePrice = priceBands[seed % priceBands.length];
  const currentPrice = basePrice + ((seed >>> 8) % 95) + (((seed >>> 16) % 100) / 100);
  const sentimentIndex = seed % 3;
  const marketSentiment = sentimentIndex === 0 ? 'Bullish' : sentimentIndex === 1 ? 'Neutral' : 'Bearish';
  const volatilityOptions = ['low', 'medium', 'high'];
  const volatility = volatilityOptions[(seed >>> 20) % volatilityOptions.length];
  const performancePrefix = marketSentiment === 'Bearish' ? '-' : '+';

  return {
    currentPrice,
    recentPerformanceNote: `${performancePrefix}${(((seed >>> 12) % 55) / 10 + 0.3).toFixed(1)}% over the last 5 sessions`,
    marketSentiment,
    analystConsensus: 'Not available',
    volatility,
    dataSource: 'Deterministic mock data'
  };
}

function calculateTradingZones(marketData) {
  const price = marketData.currentPrice;
  const volatilityFactor = marketData.volatility === 'high' ? 0.045 : marketData.volatility === 'low' ? 0.024 : 0.034;
  const fallbackSupportLow = price * (1 - volatilityFactor * 1.65);
  const fallbackSupportHigh = price * (1 - volatilityFactor * 0.8);
  const fallbackResistanceLow = price * (1 + volatilityFactor * 0.8);
  const fallbackResistanceHigh = price * (1 + volatilityFactor * 1.65);
  const supportLow = Number.isFinite(marketData.support) ? Math.min(marketData.support, fallbackSupportLow) : fallbackSupportLow;
  const supportHigh = Number.isFinite(marketData.support) ? Math.max(marketData.support, fallbackSupportHigh) : fallbackSupportHigh;
  const resistanceLow = Number.isFinite(marketData.resistance) ? Math.min(marketData.resistance, fallbackResistanceLow) : fallbackResistanceLow;
  const resistanceHigh = Number.isFinite(marketData.resistance) ? Math.max(marketData.resistance, fallbackResistanceHigh) : fallbackResistanceHigh;

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

function generateActionSummary(zones) {
  return [
    { priceRange: `Below ${formatPrice(zones.supportHigh)}`, action: 'Buy', tone: 'buy' },
    { priceRange: formatRange(zones.holdLow, zones.holdHigh), action: 'Hold', tone: 'hold' },
    { priceRange: `Above ${formatPrice(zones.resistanceLow)}`, action: 'Trim', tone: 'trim' }
  ];
}

function generateFinalVerdict(marketData, zones) {
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

async function buildStockOutlook(symbol, { allowFallback = true } = {}) {
  const liveData = await fetchYahooChart(symbol);

  if (!liveData && !allowFallback) {
    const error = new Error('Live market data is unavailable for this asset');
    error.statusCode = 503;
    throw error;
  }

  const marketData = liveData || createFallbackMarketData(symbol);
  const zones = calculateTradingZones(marketData);
  const sentiment = marketData.marketSentiment.toLowerCase();

  return {
    asset: symbol,
    targetPeriod: 'Next 1-2 weeks',
    currentDate: new Date().toISOString().slice(0, 10),
    snapshot: {
      price: formatPrice(compactNumber(marketData.currentPrice)),
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
    actionSummary: generateActionSummary(zones),
    verdict: generateFinalVerdict(marketData, zones),
    dataSource: marketData.dataSource
  };
}

module.exports = {
  buildStockOutlook,
  calculateTradingZones,
  formatPrice,
  generateActionSummary,
  generateFinalVerdict
};
