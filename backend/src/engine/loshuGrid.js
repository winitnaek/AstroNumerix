const GRID_NUMBERS = [4, 9, 2, 3, 5, 7, 8, 1, 6];

const NUMBER_INSIGHTS = {
  1: {
    present: 'Leadership, self-belief, and independent decision-making are available.',
    repeated: 'Strong leadership, self-belief, and independent decision-making.',
    missing: 'Needs more confidence, initiative, and clear self-expression.'
  },
  2: {
    present: 'Sensitivity, cooperation, and relationship awareness are active.',
    repeated: 'Heightened sensitivity, cooperation, and relationship awareness.',
    missing: 'Relationship challenges or difficulty receiving support from others.'
  },
  3: {
    present: 'Creative communication, optimism, and expressive talent are supported.',
    repeated: 'Creative communication, optimism, and expressive talent.',
    missing: 'Needs more creative confidence, joy, and open communication.'
  },
  4: {
    present: 'Practical focus, discipline, and steady work energy are present.',
    repeated: 'Practical focus, discipline, and strong work ethic.',
    missing: 'Needs more structure, consistency, and grounded planning.'
  },
  5: {
    present: 'Adaptability, emotional balance, and flexible communication are available.',
    repeated: 'Adaptability, emotional range, and a strong sense of personal freedom.',
    missing: 'Adaptability issues or hesitation around new experiences and change.'
  },
  6: {
    present: 'Responsibility, nurturing energy, and harmony are supported.',
    repeated: 'Responsibility, nurturing energy, and commitment to harmony.',
    missing: 'Needs more balance around family, duty, and emotional care.'
  },
  7: {
    present: 'Analysis, intuition, and inner reflection are available.',
    repeated: 'Analysis, intuition, and a thoughtful inner life.',
    missing: 'Needs more reflection, patience, and trust in inner guidance.'
  },
  8: {
    present: 'Ambition, authority, and material execution strength are present.',
    repeated: 'Ambition, authority, and material execution strength.',
    missing: 'Needs more financial focus, resilience, and executive confidence.'
  },
  9: {
    present: 'Compassion, wisdom, and service-oriented vision are supported.',
    repeated: 'Compassion, wisdom, and service-oriented vision.',
    missing: 'Needs more completion energy, forgiveness, and broader perspective.'
  }
};

const REMEDY_RULES = {
  1: {
    remedy: 'Take initiative in small decisions, practice independent tasks, and avoid over-dependence on others.',
    guidance: 'Missing 1 can affect leadership, decision making, confidence, and the ability to begin things without external approval.',
    behavior: 'Choose one decision each day without asking for reassurance, then follow through calmly.',
    lifestyle: 'Keep a simple morning priority list and complete the first task before checking messages.',
    affirmation: 'I am confident in taking leadership decisions.'
  },
  2: {
    remedy: 'Practice active listening, build emotional patience, and create healthier relationship boundaries.',
    guidance: 'Missing 2 can create relationship strain, sensitivity issues, and difficulty cooperating without losing personal balance.',
    behavior: 'Pause before reacting, ask clarifying questions, and name feelings without blame.',
    lifestyle: 'Create quiet time for reflection and keep your living space emotionally soothing and uncluttered.',
    affirmation: 'I create peaceful, balanced, and supportive relationships.'
  },
  3: {
    remedy: 'Strengthen expression through writing, speaking, creative hobbies, and regular joyful communication.',
    guidance: 'Missing 3 can affect self-expression, creativity, optimism, and social confidence.',
    behavior: 'Share one idea clearly each day, even when it feels small or imperfect.',
    lifestyle: 'Add music, color, journaling, or a creative ritual to your daily routine.',
    affirmation: 'I express myself with clarity, joy, and confidence.'
  },
  4: {
    remedy: 'Build discipline through planning, punctuality, organized routines, and steady completion habits.',
    guidance: 'Missing 4 can affect career stability, practical planning, consistency, and patience with long-term work.',
    behavior: 'Break tasks into small steps and finish one concrete step before starting another.',
    lifestyle: 'Use a weekly planner, keep work areas tidy, and set fixed times for important responsibilities.',
    affirmation: 'I am disciplined, organized, and steady in my progress.'
  },
  5: {
    remedy: 'Practice new experiences in small doses, build flexible routines, and choose healthy variety instead of avoidance.',
    guidance: 'Missing 5 can point to adaptability issues, hesitation with change, and difficulty moving smoothly into new experiences.',
    behavior: 'Use a short breathing pause before major decisions or emotionally charged conversations.',
    lifestyle: 'Keep regular meal, sleep, and movement rhythms while leaving room for healthy variety.',
    affirmation: 'I am emotionally balanced, adaptable, and free within healthy structure.'
  },
  6: {
    remedy: 'Strengthen responsibility, care, service, and harmony without carrying every burden alone.',
    guidance: 'Missing 6 can affect family harmony, emotional responsibility, commitment, and the ability to nurture sustainably.',
    behavior: 'Offer help intentionally, but define what you can realistically give.',
    lifestyle: 'Create a warm home rhythm with regular resets, shared meals, or caring check-ins.',
    affirmation: 'I give and receive care with love, balance, and responsibility.'
  },
  7: {
    remedy: 'Develop meditation, introspection, spiritual study, analytical thinking, and trust in inner wisdom.',
    guidance: 'Missing 7 can affect patience, intuition, deep focus, and the ability to learn from solitude.',
    behavior: 'Spend ten quiet minutes reviewing your choices and lessons from the day.',
    lifestyle: 'Reduce noise, protect study time, and spend time in peaceful spaces that support concentration.',
    affirmation: 'I trust my intuition and learn deeply from every experience.'
  },
  8: {
    remedy: 'Practice financial discipline, accountability, resilience, and confident execution.',
    guidance: 'Missing 8 can affect career authority, money management, ambition, and comfort with responsibility.',
    behavior: 'Track one measurable goal and review progress with honesty each week.',
    lifestyle: 'Use a budget, organize important documents, and create systems for money and work commitments.',
    affirmation: 'I manage success, responsibility, and resources with confidence.'
  },
  9: {
    remedy: 'Practice charity, empathy, compassion, completion, forgiveness, and service without emotional exhaustion.',
    guidance: 'Missing 9 can affect compassion, empathy, closure, broader perspective, and the ability to release the past.',
    behavior: 'Complete unfinished tasks, practice empathy, and forgive without ignoring your boundaries.',
    lifestyle: 'Make space for charity, service, decluttering, and regular emotional release through journaling or reflection.',
    affirmation: 'I release the past and act with compassion, wisdom, and strength.'
  }
};

function createEmptyGrid() {
  return GRID_NUMBERS.reduce((grid, number) => {
    grid[number] = 0;
    return grid;
  }, {});
}

function normalizeDob(value) {
  const dob = String(value || '').trim();
  const ddmmyyyy = /^(\d{2})-(\d{2})-(\d{4})$/.exec(dob);
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dob);

  if (!ddmmyyyy && !iso) {
    throw new Error('Date of birth must be DD-MM-YYYY');
  }

  const day = ddmmyyyy ? ddmmyyyy[1] : iso[3];
  const month = ddmmyyyy ? ddmmyyyy[2] : iso[2];
  const year = ddmmyyyy ? ddmmyyyy[3] : iso[1];
  const date = new Date(`${year}-${month}-${day}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== `${year}-${month}-${day}`) {
    throw new Error('Please enter a valid date of birth');
  }

  return `${day}-${month}-${year}`;
}

function buildInterpretation({ missingNumbers, repeatedNumbers }) {
  const parts = [];

  if (!missingNumbers.length) {
    parts.push('The grid is balanced, showing stable access to the main Lo Shu energies.');
  } else {
    parts.push(`Missing numbers ${missingNumbers.join(', ')} point to growth areas that may need conscious attention.`);
  }

  if (repeatedNumbers.length) {
    parts.push(`Repeated numbers ${repeatedNumbers.join(', ')} show dominant traits and natural strengths.`);
  } else {
    parts.push('There are no repeated numbers, which can indicate an even distribution of traits rather than one dominant pattern.');
  }

  return parts.join(' ');
}

function buildRemedies(missingNumbers) {
  const rules = missingNumbers.map((number) => REMEDY_RULES[number]);

  return {
    missingNumbersRemedies: rules.map((rule) => rule.remedy),
    weakAreaGuidance: rules.map((rule) => rule.guidance),
    behavioralSuggestions: rules.map((rule) => rule.behavior),
    lifestyleRecommendations: rules.map((rule) => rule.lifestyle),
    affirmations: rules.map((rule) => rule.affirmation)
  };
}

function buildOverRepeatedWeakness(number, count) {
  return `Number ${number} appears ${count} times, which can over-amplify this energy and needs conscious balance.`;
}

function analyzeLoShuGrid({ dob }) {
  const normalizedDob = normalizeDob(dob);
  const grid = createEmptyGrid();

  normalizedDob.replace(/\D/g, '').split('').forEach((digit) => {
    const number = Number(digit);
    if (number >= 1 && number <= 9) {
      grid[number] += 1;
    }
  });

  const missingNumbers = GRID_NUMBERS.filter((number) => grid[number] === 0).sort((first, second) => first - second);
  const repeatedNumbers = GRID_NUMBERS.filter((number) => grid[number] > 1).sort((first, second) => first - second);
  const presentNumbers = GRID_NUMBERS.filter((number) => grid[number] > 0).sort((first, second) => first - second);
  const overRepeatedNumbers = GRID_NUMBERS.filter((number) => grid[number] > 2).sort((first, second) => first - second);
  const strengths = presentNumbers.map((number) => {
    const base = NUMBER_INSIGHTS[number][grid[number] > 1 ? 'repeated' : 'present'];
    return `Number ${number}: ${base}`;
  });
  const weaknesses = [
    ...missingNumbers.map((number) => `Missing ${number}: ${NUMBER_INSIGHTS[number].missing}`),
    ...overRepeatedNumbers.map((number) => buildOverRepeatedWeakness(number, grid[number]))
  ];

  return {
    grid,
    presentNumbers,
    missingNumbers,
    repeatedNumbers,
    overRepeatedNumbers,
    strengths,
    weaknesses,
    interpretation: buildInterpretation({ missingNumbers, repeatedNumbers }),
    remedies: buildRemedies(missingNumbers)
  };
}

module.exports = {
  GRID_NUMBERS,
  analyzeLoShuGrid
};
