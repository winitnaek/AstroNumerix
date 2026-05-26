const PYTHAGOREAN_MAP = {
  A: 1,
  J: 1,
  S: 1,
  B: 2,
  K: 2,
  T: 2,
  C: 3,
  L: 3,
  U: 3,
  D: 4,
  M: 4,
  V: 4,
  E: 5,
  N: 5,
  W: 5,
  F: 6,
  O: 6,
  X: 6,
  G: 7,
  P: 7,
  Y: 7,
  H: 8,
  Q: 8,
  Z: 8,
  I: 9,
  R: 9
};

const NUMBER_RULES = {
  1: {
    colors: ['Gold', 'Ruby Red'],
    days: ['Sunday', 'Monday'],
    interpretation: 'Independent, direct, and ready to lead with confidence.'
  },
  2: {
    colors: ['White', 'Pearl'],
    days: ['Monday', 'Friday'],
    interpretation: 'Diplomatic, intuitive, and strongest through collaboration.'
  },
  3: {
    colors: ['Yellow', 'Violet'],
    days: ['Thursday', 'Tuesday'],
    interpretation: 'Expressive, optimistic, and energized by creative momentum.'
  },
  4: {
    colors: ['Blue', 'Steel Grey'],
    days: ['Saturday', 'Sunday'],
    interpretation: 'Practical, disciplined, and built for steady progress.'
  },
  5: {
    colors: ['Green', 'Turquoise'],
    days: ['Wednesday', 'Friday'],
    interpretation: 'Adaptable, curious, and refreshed by movement and choice.'
  },
  6: {
    colors: ['Pink', 'Sky Blue'],
    days: ['Friday', 'Tuesday'],
    interpretation: 'Caring, responsible, and naturally protective of harmony.'
  },
  7: {
    colors: ['Sea Green', 'Silver'],
    days: ['Monday', 'Thursday'],
    interpretation: 'Reflective, analytical, and guided by inner clarity.'
  },
  8: {
    colors: ['Navy', 'Charcoal'],
    days: ['Saturday', 'Wednesday'],
    interpretation: 'Ambitious, resilient, and focused on measurable results.'
  },
  9: {
    colors: ['Crimson', 'Maroon'],
    days: ['Tuesday', 'Thursday'],
    interpretation: 'Compassionate, wise, and oriented toward completion and service.'
  }
};

const FOCUS_AREAS = {
  1: 'Leadership decisions',
  2: 'Relationship clarity',
  3: 'Creative communication',
  4: 'Systems and planning',
  5: 'New opportunities',
  6: 'Home and responsibility',
  7: 'Study and reflection',
  8: 'Money and execution',
  9: 'Completion and renewal'
};

function reduceToSingleDigit(value) {
  const digits = String(value).replace(/\D/g, '');

  if (!digits) {
    return 0;
  }

  let sum = digits.split('').reduce((total, digit) => total + Number(digit), 0);

  while (sum > 9) {
    sum = String(sum)
      .split('')
      .reduce((total, digit) => total + Number(digit), 0);
  }

  return sum;
}

function parseDate(dateOfBirth) {
  const date = new Date(`${dateOfBirth}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime())) {
    throw new Error('Invalid date');
  }

  return date;
}

function calculatePsychicNumber(dateOfBirth) {
  const date = parseDate(dateOfBirth);
  return reduceToSingleDigit(date.getUTCDate());
}

function calculateDestinyNumber(dateOfBirth) {
  return reduceToSingleDigit(dateOfBirth);
}

function calculateNameNumber(fullName) {
  const letters = String(fullName).toUpperCase().replace(/[^A-Z]/g, '');
  const total = letters.split('').reduce((sum, letter) => sum + PYTHAGOREAN_MAP[letter], 0);
  return reduceToSingleDigit(total);
}

function getRules(number) {
  return NUMBER_RULES[number] || NUMBER_RULES[1];
}

function calculateProfile({ fullName, dateOfBirth }) {
  const psychic = calculatePsychicNumber(dateOfBirth);
  const destiny = calculateDestinyNumber(dateOfBirth);
  const nameNumber = calculateNameNumber(fullName);
  const rule = getRules(destiny || psychic || nameNumber);

  return {
    psychic,
    destiny,
    nameNumber,
    nameCorrectionSuggestions: getNameCorrectionSuggestions({ fullName, dateOfBirth }),
    luckyColors: rule.colors,
    luckyDays: rule.days,
    interpretation: rule.interpretation,
    source: {
      fullName,
      dateOfBirth
    }
  };
}

function calculateForecast({ dateOfBirth, forecastDate = new Date().toISOString().slice(0, 10) }) {
  const destiny = calculateDestinyNumber(dateOfBirth);
  const personalDay = reduceToSingleDigit(`${forecastDate}${destiny}`);

  return {
    date: forecastDate,
    personalDay,
    luckyTimeSlots: [`${8 + personalDay}:00 - ${9 + personalDay}:00`, `${14 + (personalDay % 4)}:00 - ${15 + (personalDay % 4)}:00`],
    avoidTimeSlots: personalDay % 2 === 0 ? ['20:00 - 22:00'] : ['06:00 - 08:00'],
    focusArea: FOCUS_AREAS[personalDay],
    explanation: getRules(personalDay).interpretation
  };
}

function normalizeCompatibilityValue(value) {
  const normalized = String(value).trim();

  if (/^\d+$/.test(normalized) || /^\d{4}-\d{2}-\d{2}$/.test(normalized) || /^\d{2}-\d{2}-\d{4}$/.test(normalized)) {
    return reduceToSingleDigit(normalized);
  }

  return calculateNameNumber(normalized);
}

function calculateCompatibility({ first, second }) {
  const firstNumber = normalizeCompatibilityValue(first);
  const secondNumber = normalizeCompatibilityValue(second);
  const distance = Math.abs(firstNumber - secondNumber);
  const score = Math.max(0, Math.min(100, 100 - distance * 10 + (firstNumber === secondNumber ? 10 : 0)));

  let explanation = 'A balanced match with useful differences and shared growth potential.';
  if (score >= 90) {
    explanation = 'A highly compatible pairing with naturally aligned energy.';
  } else if (score >= 75) {
    explanation = 'A strong match where both sides can support each other well.';
  } else if (score < 55) {
    explanation = 'A challenging match that needs patience, timing, and clear communication.';
  }

  return {
    firstNumber,
    secondNumber,
    compatibilityScore: score,
    explanation
  };
}

function calculateNameCorrectionScore({ name, dateOfBirth }) {
  const nameNumber = calculateNameNumber(name);
  const destiny = calculateDestinyNumber(dateOfBirth);
  const psychic = calculatePsychicNumber(dateOfBirth);
  const destinyDistance = Math.abs(nameNumber - destiny);
  const psychicDistance = Math.abs(nameNumber - psychic);
  const score = Math.max(40, Math.min(100, 100 - destinyDistance * 9 - psychicDistance * 4));

  return {
    name,
    score,
    nameNumber,
    destiny,
    psychic
  };
}

function buildNameVariations(fullName) {
  const normalized = String(fullName || '').trim().replace(/\s+/g, ' ');
  const parts = normalized.split(' ').filter(Boolean);
  const firstName = parts[0] || normalized;
  const lastName = parts[parts.length - 1] || '';
  const middleNames = parts.slice(1, -1);
  const middleInitials = middleNames.map((part) => part[0]).join(' ');
  const compactName = [firstName, middleInitials, lastName].filter(Boolean).join(' ');
  const reversedMiddle = [firstName, ...middleNames.slice().reverse(), lastName].filter(Boolean).join(' ');
  const shortenedFirst = firstName.length > 4 ? `${firstName.slice(0, -1)} ${[...middleNames, lastName].filter(Boolean).join(' ')}`.trim() : normalized;
  const expandedFirst = `${firstName}${firstName.endsWith('h') ? '' : 'h'} ${[...middleNames, lastName].filter(Boolean).join(' ')}`.trim();
  const initialLast = [firstName, lastName ? `${lastName[0]} ${lastName}` : ''].filter(Boolean).join(' ');

  return [compactName, reversedMiddle, shortenedFirst, expandedFirst, initialLast]
    .filter((name) => name && name.toLowerCase() !== normalized.toLowerCase())
    .filter((name, index, names) => names.findIndex((item) => item.toLowerCase() === name.toLowerCase()) === index)
    .slice(0, 3);
}

function getNameCorrectionSuggestions({ fullName, dateOfBirth }) {
  const current = calculateNameCorrectionScore({ name: fullName, dateOfBirth });
  const variations = buildNameVariations(fullName).map((name, index) => ({
    ...calculateNameCorrectionScore({ name, dateOfBirth }),
    name: `Suggested Name ${index + 1}`,
    originalName: name
  }));

  return [
    { ...current, name: 'Full Name (Current)', originalName: fullName, label: 'Current' },
    ...variations.map((variation) => ({ ...variation, label: 'Optimized' }))
  ];
}

module.exports = {
  calculateCompatibility,
  calculateDestinyNumber,
  calculateForecast,
  calculateNameNumber,
  calculateNameCorrectionScore,
  calculateProfile,
  calculatePsychicNumber,
  getNameCorrectionSuggestions,
  reduceToSingleDigit
};
