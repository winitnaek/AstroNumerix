const DEFAULT_LOCATION = {
  name: 'Cumming, Georgia, USA',
  latitude: 34.2073,
  longitude: -84.1402,
  timezone: 'America/New_York'
};

const LOCATION_ALIASES = [
  DEFAULT_LOCATION,
  { name: 'Atlanta, Georgia, USA', latitude: 33.749, longitude: -84.388, timezone: 'America/New_York' },
  { name: 'New York, New York, USA', latitude: 40.7128, longitude: -74.006, timezone: 'America/New_York' },
  { name: 'London, United Kingdom', latitude: 51.5072, longitude: -0.1276, timezone: 'Europe/London' },
  { name: 'Mumbai, Maharashtra, India', latitude: 19.076, longitude: 72.8777, timezone: 'Asia/Kolkata' },
  { name: 'Bengaluru, Karnataka, India', latitude: 12.9716, longitude: 77.5946, timezone: 'Asia/Kolkata' },
  { name: 'San Francisco, California, USA', latitude: 37.7749, longitude: -122.4194, timezone: 'America/Los_Angeles' }
];

const CHOGHADIYA_SEQUENCES = {
  0: ['Udveg', 'Char', 'Labh', 'Amrit', 'Kaal', 'Shubh', 'Rog', 'Udveg'],
  1: ['Amrit', 'Kaal', 'Shubh', 'Rog', 'Udveg', 'Char', 'Labh', 'Amrit'],
  2: ['Rog', 'Udveg', 'Char', 'Labh', 'Amrit', 'Kaal', 'Shubh', 'Rog'],
  3: ['Labh', 'Amrit', 'Kaal', 'Shubh', 'Rog', 'Udveg', 'Char', 'Labh'],
  4: ['Shubh', 'Rog', 'Udveg', 'Char', 'Labh', 'Amrit', 'Kaal', 'Shubh'],
  5: ['Char', 'Labh', 'Amrit', 'Kaal', 'Shubh', 'Rog', 'Udveg', 'Char'],
  6: ['Kaal', 'Shubh', 'Rog', 'Udveg', 'Char', 'Labh', 'Amrit', 'Kaal']
};

const RAHU_SEGMENT_BY_WEEKDAY = {
  0: 8,
  1: 2,
  2: 7,
  3: 5,
  4: 6,
  5: 4,
  6: 3
};

// Simplified deterministic segment maps for day-trading risk overlays. Traditional Vela
// methods vary by panchang source; these maps keep the output stable until a full panchang
// provider is added.
const VELA_SEGMENTS = {
  vaarVela: {
    label: 'Vaar Vela',
    segmentsByWeekday: { 0: [4], 1: [7], 2: [2], 3: [5], 4: [6], 5: [3], 6: [1] }
  },
  kaalVela: {
    label: 'Kaal Vela',
    segmentsByWeekday: { 0: [5], 1: [2], 2: [6], 3: [3], 4: [7], 5: [4], 6: [8] }
  },
  kaalRatri: {
    label: 'Kaal Ratri caution',
    // Kaal Ratri is a night-period caution, so it should not automatically
    // invalidate the final daylight Choghadiya segment.
    segmentsByWeekday: { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] }
  }
};

const ASCENDANT_GROUPS = {
  Aries: { element: 'Fire', favorable: ['Char', 'Labh'], cautious: ['Rog'] },
  Taurus: { element: 'Earth', favorable: ['Labh', 'Shubh'], cautious: ['Udveg'] },
  Gemini: { element: 'Air', favorable: ['Char', 'Shubh'], cautious: ['Kaal'] },
  Cancer: { element: 'Water', favorable: ['Amrit', 'Shubh'], cautious: ['Rog'] },
  Leo: { element: 'Fire', favorable: ['Char', 'Labh'], cautious: ['Udveg'] },
  Virgo: { element: 'Earth', favorable: ['Labh', 'Shubh'], cautious: ['Kaal'] },
  Libra: { element: 'Air', favorable: ['Char', 'Shubh'], cautious: ['Rog'] },
  Scorpio: { element: 'Water', favorable: ['Amrit', 'Labh'], cautious: ['Udveg'] },
  Sagittarius: { element: 'Fire', favorable: ['Char', 'Amrit'], cautious: ['Kaal'] },
  Capricorn: { element: 'Earth', favorable: ['Labh', 'Shubh'], cautious: ['Rog'] },
  Aquarius: { element: 'Air', favorable: ['Char', 'Labh'], cautious: ['Udveg'] },
  Pisces: { element: 'Water', favorable: ['Amrit', 'Shubh'], cautious: ['Kaal'] }
};

const BASE_TYPE_SCORES = {
  Amrit: 5,
  Shubh: 4,
  Labh: 4,
  Char: 2,
  Udveg: -1,
  Rog: -2,
  Kaal: -3
};

const EXIT_TYPE_SCORES = {
  Labh: 5,
  Amrit: 4,
  Shubh: 4,
  Char: 3,
  Udveg: 1,
  Rog: 0,
  Kaal: 0
};

function normalizeDegrees(value) {
  return ((value % 360) + 360) % 360;
}

function degToRad(value) {
  return (value * Math.PI) / 180;
}

function radToDeg(value) {
  return (value * 180) / Math.PI;
}

function resolveLocation(location = DEFAULT_LOCATION.name) {
  const normalized = String(location || DEFAULT_LOCATION.name).trim().toLowerCase();
  const found = LOCATION_ALIASES.find((item) => {
    const name = item.name.toLowerCase();
    return normalized === name || name.includes(normalized) || normalized.includes(name.split(',')[0].toLowerCase());
  });

  return found || { ...DEFAULT_LOCATION, name: location || DEFAULT_LOCATION.name };
}

function getDayOfYear(year, month, day) {
  const start = Date.UTC(year, 0, 0);
  const current = Date.UTC(year, month - 1, day);
  return Math.floor((current - start) / 86400000);
}

function calculateSolarUtcHour({ year, month, day, latitude, longitude, isSunrise }) {
  const zenith = 90.833;
  const dayOfYear = getDayOfYear(year, month, day);
  const longitudeHour = longitude / 15;
  const approximateTime = dayOfYear + ((isSunrise ? 6 : 18) - longitudeHour) / 24;
  const meanAnomaly = 0.9856 * approximateTime - 3.289;
  const trueLongitude = normalizeDegrees(
    meanAnomaly + 1.916 * Math.sin(degToRad(meanAnomaly)) + 0.02 * Math.sin(degToRad(2 * meanAnomaly)) + 282.634
  );
  let rightAscension = normalizeDegrees(radToDeg(Math.atan(0.91764 * Math.tan(degToRad(trueLongitude)))));
  rightAscension += Math.floor(trueLongitude / 90) * 90 - Math.floor(rightAscension / 90) * 90;
  rightAscension /= 15;

  const sinDeclination = 0.39782 * Math.sin(degToRad(trueLongitude));
  const cosDeclination = Math.cos(Math.asin(sinDeclination));
  const cosHourAngle =
    (Math.cos(degToRad(zenith)) - sinDeclination * Math.sin(degToRad(latitude))) /
    (cosDeclination * Math.cos(degToRad(latitude)));

  if (cosHourAngle > 1 || cosHourAngle < -1) {
    return isSunrise ? 6 - longitudeHour : 18 - longitudeHour;
  }

  const hourAngle = (isSunrise ? 360 - radToDeg(Math.acos(cosHourAngle)) : radToDeg(Math.acos(cosHourAngle))) / 15;
  const localMeanTime = hourAngle + rightAscension - 0.06571 * approximateTime - 6.622;

  return normalizeDegrees((localMeanTime - longitudeHour) * 15) / 15;
}

function utcHourToDate(targetDate, utcHour) {
  const [year, month, day] = targetDate.split('-').map(Number);
  const base = Date.UTC(year, month - 1, day);
  return new Date(base + utcHour * 60 * 60 * 1000);
}

function calculateSunriseSunset(targetDate, location) {
  const [year, month, day] = targetDate.split('-').map(Number);
  const sunriseUtcHour = calculateSolarUtcHour({ year, month, day, ...location, isSunrise: true });
  let sunsetUtcHour = calculateSolarUtcHour({ year, month, day, ...location, isSunrise: false });

  if (sunsetUtcHour <= sunriseUtcHour) {
    sunsetUtcHour += 24;
  }

  return {
    sunrise: utcHourToDate(targetDate, sunriseUtcHour),
    sunset: utcHourToDate(targetDate, sunsetUtcHour)
  };
}

function formatTimeRange(start, end, timezone) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: timezone
  });

  return `${formatter.format(start)} - ${formatter.format(end)}`;
}

function getWeekday(targetDate) {
  return new Date(`${targetDate}T12:00:00.000Z`).getUTCDay();
}

function generateChoghadiya({ targetDate, location, sunrise, sunset }) {
  const weekday = getWeekday(targetDate);
  const segmentMs = (sunset.getTime() - sunrise.getTime()) / 8;
  const sequence = CHOGHADIYA_SEQUENCES[weekday];

  return sequence.map((type, index) => {
    const start = new Date(sunrise.getTime() + segmentMs * index);
    const end = new Date(start.getTime() + segmentMs);

    return {
      segment: index + 1,
      start,
      end,
      timeBlock: formatTimeRange(start, end, location.timezone),
      type
    };
  });
}

function calculateRahuKaal(choghadiyaTable, weekday) {
  const rahuSegment = RAHU_SEGMENT_BY_WEEKDAY[weekday];
  const block = choghadiyaTable.find((item) => item.segment === rahuSegment);

  return {
    segment: rahuSegment,
    timeBlock: block?.timeBlock || ''
  };
}

function getVelaReasons(segment, weekday) {
  return Object.values(VELA_SEGMENTS)
    .filter((rule) => (rule.segmentsByWeekday[weekday] || []).includes(segment))
    .map((rule) => rule.label);
}

function buildMockAssetAnalysis(asset) {
  const symbol = String(asset || '').trim().toUpperCase();

  if (!symbol) {
    return {
      asset: '',
      currentPrice: '',
      support: '',
      resistance: '',
      trendBias: '',
      dataSource: ''
    };
  }

  const hash = symbol.split('').reduce((total, char) => total + char.charCodeAt(0), 0);
  const base = 50 + (hash % 220);
  const volatility = 1 + (hash % 7);
  const support = (base - volatility * 1.7).toFixed(2);
  const resistance = (base + volatility * 2.1).toFixed(2);
  const trendBias = hash % 3 === 0 ? 'Bullish timing bias' : hash % 3 === 1 ? 'Neutral timing bias' : 'Defensive timing bias';

  return {
    asset: symbol,
    currentPrice: base.toFixed(2),
    support,
    resistance,
    trendBias,
    dataSource: 'Deterministic fallback',
    volatility
  };
}

function compactNumber(value) {
  if (!Number.isFinite(value)) {
    return '';
  }

  return value.toFixed(2);
}

function average(values) {
  if (!values.length) {
    return 0;
  }

  return values.reduce((total, value) => total + value, 0) / values.length;
}

function deriveTrendBias({ currentPrice, closes, previousClose }) {
  const recent = closes.slice(-5);
  const baseline = closes.slice(-20);
  const sma5 = average(recent);
  const sma20 = average(baseline);
  const dayChange = previousClose ? (currentPrice - previousClose) / previousClose : 0;

  if (currentPrice > sma5 && sma5 >= sma20 && dayChange >= -0.005) {
    return 'Bullish live trend';
  }

  if (currentPrice < sma5 && sma5 <= sma20 && dayChange <= 0.005) {
    return 'Defensive live trend';
  }

  return 'Neutral live trend';
}

async function fetchLiveAssetData(symbol) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4500);
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
    const lows = (quote.low || []).filter(Number.isFinite);
    const highs = (quote.high || []).filter(Number.isFinite);
    const currentPrice = Number(meta.regularMarketPrice || closes[closes.length - 1]);
    const previousClose = Number(meta.previousClose || closes[closes.length - 2]);

    if (!Number.isFinite(currentPrice) || !closes.length) {
      return null;
    }

    const recentLows = lows.slice(-20);
    const recentHighs = highs.slice(-20);
    const support = Math.min(...recentLows.filter(Number.isFinite));
    const resistance = Math.max(...recentHighs.filter(Number.isFinite));

    return {
      asset: symbol,
      currentPrice: compactNumber(currentPrice),
      support: compactNumber(Number.isFinite(support) ? support : currentPrice * 0.98),
      resistance: compactNumber(Number.isFinite(resistance) ? resistance : currentPrice * 1.02),
      trendBias: deriveTrendBias({ currentPrice, closes, previousClose }),
      dataSource: 'Yahoo Finance chart',
      volatility: compactNumber(average(recentHighs.map((high, index) => Math.abs(high - (recentLows[index] || high)))) || 0)
    };
  } catch (error) {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function analyzeAsset(asset) {
  const symbol = String(asset || '').trim().toUpperCase();

  if (!symbol) {
    return buildMockAssetAnalysis('');
  }

  const liveAnalysis = await fetchLiveAssetData(symbol);
  return liveAnalysis || buildMockAssetAnalysis(symbol);
}

function getAscendantAdjustment(ascendant, type) {
  const config = ASCENDANT_GROUPS[ascendant];

  if (!config) {
    return 0;
  }

  if (config.favorable.includes(type)) {
    return 1;
  }

  if (config.cautious.includes(type)) {
    return -1;
  }

  return 0;
}

function buildAscendantInsights(ascendant) {
  const config = ASCENDANT_GROUPS[ascendant];

  if (!ascendant || !config) {
    return '';
  }

  return `${ascendant} ascendant applies ${config.element.toLowerCase()} weighting. The timing model slightly favors windows that align with this ascendant and becomes more defensive during weaker windows.`;
}

function decideAction(score, riskReasons) {
  if (riskReasons.length) {
    return { action: 'AVOID', risk: 'HIGH' };
  }

  if (score >= 4) {
    return { action: 'BUY', risk: 'LOW' };
  }

  if (score <= -1) {
    return { action: 'SELL', risk: 'MEDIUM' };
  }

  return { action: 'HOLD', risk: 'MEDIUM' };
}

function scoreChoghadiya(block, { weekday, rahuKaal, ascendant, assetAnalysis }) {
  const riskReasons = [];

  if (block.segment === rahuKaal.segment) {
    riskReasons.push('Rahu Kaal');
  }

  riskReasons.push(...getVelaReasons(block.segment, weekday));

  let score = BASE_TYPE_SCORES[block.type] || 0;
  score += getAscendantAdjustment(ascendant, block.type);

  if (assetAnalysis.trendBias?.includes('Bullish')) {
    score += 1;
  } else if (assetAnalysis.trendBias?.includes('Defensive')) {
    score -= 1;
  }

  const decision = decideAction(score, riskReasons);
  const assetNote = assetAnalysis.asset ? `${assetAnalysis.asset}: ${assetAnalysis.trendBias}.` : '';
  const notes = [
    `Score: ${score}.`,
    riskReasons.length ? `Risk: ${riskReasons.join(', ')}.` : '',
    assetNote
  ]
    .filter(Boolean)
    .join(' ');

  return {
    segment: block.segment,
    timeBlock: block.timeBlock,
    type: block.type,
    action: decision.action,
    risk: decision.risk,
    notes,
    score,
    assetNote,
    riskReasons
  };
}

function generateFinalSummary(choghadiyaTable) {
  const buyCandidates = choghadiyaTable.filter((item) => item.action === 'BUY' && item.risk === 'LOW');
  const exitCandidates = choghadiyaTable
    .filter((item) => item.risk !== 'HIGH' && ['Labh', 'Amrit', 'Shubh', 'Char'].includes(item.type))
    .map((item) => ({
      ...item,
      exitScore:
        (EXIT_TYPE_SCORES[item.type] || 0) +
        item.segment * 0.45 +
        item.score * 0.15 +
        (item.action === 'BUY' ? 0.5 : item.action === 'HOLD' ? 0.25 : 0)
    }))
    .sort((first, second) => second.exitScore - first.exitScore);
  const fallbackExitCandidates = choghadiyaTable
    .filter((item) => item.risk !== 'HIGH' && (item.action === 'SELL' || item.action === 'HOLD'))
    .sort((first, second) => first.score - second.score);
  const bestBuy = buyCandidates.sort((first, second) => second.score - first.score)[0];
  const bestExit = exitCandidates[0] || fallbackExitCandidates[0];
  const highestRisk = choghadiyaTable.find((item) => item.risk === 'HIGH');

  return {
    bestBuyWindow: bestBuy?.timeBlock || 'No low-risk BUY window found',
    bestExitWindow: bestExit?.timeBlock || 'No clear exit window found',
    highestRiskWindow: highestRisk?.timeBlock || 'No high-risk window found'
  };
}

function buildRiskEngine(choghadiyaTable, rahuKaal) {
  return {
    rahuKaal: rahuKaal.timeBlock,
    highRiskZones: choghadiyaTable
      .filter((item) => item.risk === 'HIGH')
      .map((item) => ({
        timeBlock: item.timeBlock,
        action: item.action,
        risk: item.risk,
        notes: item.notes
      })),
    safeZones: choghadiyaTable.filter((item) => item.risk === 'LOW' && item.action === 'BUY').map((item) => item.timeBlock)
  };
}

async function analyzeCleanTrade({ targetDate, location = DEFAULT_LOCATION.name, asset = '', ascendant = '' }) {
  const resolvedLocation = resolveLocation(location);
  const { sunrise, sunset } = calculateSunriseSunset(targetDate, resolvedLocation);
  const weekday = getWeekday(targetDate);
  const rawChoghadiya = generateChoghadiya({ targetDate, location: resolvedLocation, sunrise, sunset });
  const rahuKaal = calculateRahuKaal(rawChoghadiya, weekday);
  const assetAnalysis = await analyzeAsset(asset);
  const normalizedAscendant = ascendant || '';
  const choghadiyaTable = rawChoghadiya.map((block) =>
    scoreChoghadiya(block, {
      weekday,
      rahuKaal,
      ascendant: normalizedAscendant,
      assetAnalysis
    })
  );

  return {
    input: {
      targetDate,
      location: resolvedLocation.name,
      asset: assetAnalysis.asset,
      ascendant: normalizedAscendant
    },
    summary: generateFinalSummary(choghadiyaTable),
    choghadiyaTable: choghadiyaTable.map((item) => ({
      timeBlock: item.timeBlock,
      type: item.type,
      action: item.action,
      risk: item.risk,
      notes: item.notes
    })),
    assetAnalysis: {
      asset: assetAnalysis.asset,
      currentPrice: assetAnalysis.currentPrice,
      support: assetAnalysis.support,
      resistance: assetAnalysis.resistance,
      trendBias: assetAnalysis.trendBias,
      dataSource: assetAnalysis.dataSource
    },
    ascendantInsights: buildAscendantInsights(normalizedAscendant),
    riskEngine: buildRiskEngine(choghadiyaTable, rahuKaal)
  };
}

module.exports = {
  analyzeAsset,
  analyzeCleanTrade,
  buildRiskEngine,
  calculateRahuKaal,
  calculateSunriseSunset,
  generateChoghadiya,
  generateFinalSummary,
  resolveLocation
};
