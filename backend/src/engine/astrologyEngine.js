const RASHIS = [
  { name: 'Mesha', westernName: 'Aries', element: 'Fire' },
  { name: 'Vrishabha', westernName: 'Taurus', element: 'Earth' },
  { name: 'Mithuna', westernName: 'Gemini', element: 'Air' },
  { name: 'Karka', westernName: 'Cancer', element: 'Water' },
  { name: 'Simha', westernName: 'Leo', element: 'Fire' },
  { name: 'Kanya', westernName: 'Virgo', element: 'Earth' },
  { name: 'Tula', westernName: 'Libra', element: 'Air' },
  { name: 'Vrischika', westernName: 'Scorpio', element: 'Water' },
  { name: 'Dhanu', westernName: 'Sagittarius', element: 'Fire' },
  { name: 'Makara', westernName: 'Capricorn', element: 'Earth' },
  { name: 'Kumbha', westernName: 'Aquarius', element: 'Air' },
  { name: 'Meena', westernName: 'Pisces', element: 'Water' }
];

function degToRad(value) {
  return (value * Math.PI) / 180;
}

function radToDeg(value) {
  return (value * 180) / Math.PI;
}

function normalizeDegrees(value) {
  return ((value % 360) + 360) % 360;
}

function sinDeg(value) {
  return Math.sin(degToRad(value));
}

function julianDayFromUtc(date) {
  return date.getTime() / 86400000 + 2440587.5;
}

function estimateUtcDate(dateOfBirth, birthTime, longitude) {
  const [year, month, day] = dateOfBirth.split('-').map(Number);
  const [hour, minute] = birthTime.split(':').map(Number);
  const localMeanOffsetHours = longitude / 15;
  const utcMillis = Date.UTC(year, month - 1, day, hour, minute) - localMeanOffsetHours * 60 * 60 * 1000;

  return new Date(utcMillis);
}

function getAyanamsa(julianDay) {
  const yearsFromJ2000 = (julianDay - 2451545.0) / 365.2422;
  return 23.85675 + 0.013968 * yearsFromJ2000;
}

function getRashi(longitude) {
  const normalized = normalizeDegrees(longitude);
  const index = Math.floor(normalized / 30);
  const degreesInSign = normalized - index * 30;

  return {
    ...RASHIS[index],
    degrees: Number(degreesInSign.toFixed(2))
  };
}

function calculateSiderealMoonLongitude(julianDay) {
  const days = julianDay - 2451545.0;
  const meanLongitude = normalizeDegrees(218.316 + 13.176396 * days);
  const moonAnomaly = normalizeDegrees(134.963 + 13.064993 * days);
  const sunAnomaly = normalizeDegrees(357.529 + 0.98560028 * days);
  const moonElongation = normalizeDegrees(297.85 + 12.190749 * days);
  const argumentOfLatitude = normalizeDegrees(93.272 + 13.22935 * days);

  const tropicalLongitude =
    meanLongitude +
    6.289 * sinDeg(moonAnomaly) +
    1.274 * sinDeg(2 * moonElongation - moonAnomaly) +
    0.658 * sinDeg(2 * moonElongation) +
    0.214 * sinDeg(2 * moonAnomaly) -
    0.186 * sinDeg(sunAnomaly) -
    0.114 * sinDeg(2 * argumentOfLatitude);

  return normalizeDegrees(tropicalLongitude - getAyanamsa(julianDay));
}

function calculateLocalSiderealTime(julianDay, longitude) {
  const centuries = (julianDay - 2451545.0) / 36525;
  const gmst =
    280.46061837 +
    360.98564736629 * (julianDay - 2451545.0) +
    0.000387933 * centuries * centuries -
    (centuries * centuries * centuries) / 38710000;

  return normalizeDegrees(gmst + longitude);
}

function calculateSiderealAscendant(julianDay, latitude, longitude) {
  const localSiderealTime = degToRad(calculateLocalSiderealTime(julianDay, longitude));
  const obliquity = degToRad(23.439291 - 0.0130042 * ((julianDay - 2451545.0) / 36525));
  const latitudeRad = degToRad(latitude);
  const ascendant =
    radToDeg(
      Math.atan2(
        -Math.cos(localSiderealTime),
        Math.sin(localSiderealTime) * Math.cos(obliquity) + Math.tan(latitudeRad) * Math.sin(obliquity)
      )
    ) + 180;

  return normalizeDegrees(ascendant - getAyanamsa(julianDay));
}

function calculateAstrologyProfile({ dateOfBirth, birthTime, birthLocation }) {
  if (
    !dateOfBirth ||
    !birthTime ||
    !birthLocation ||
    birthLocation.latitude === undefined ||
    birthLocation.longitude === undefined ||
    birthLocation.latitude === null ||
    birthLocation.longitude === null
  ) {
    return null;
  }

  const latitude = Number(birthLocation.latitude);
  const longitude = Number(birthLocation.longitude);
  const utcDate = estimateUtcDate(dateOfBirth, birthTime, longitude);
  const julianDay = julianDayFromUtc(utcDate);
  const moonLongitude = calculateSiderealMoonLongitude(julianDay);
  const ascendantLongitude = calculateSiderealAscendant(julianDay, latitude, longitude);
  const birthRashi = getRashi(moonLongitude);
  const ascendant = getRashi(ascendantLongitude);

  return {
    ascendant,
    birthRashi,
    moonSign: birthRashi,
    source: {
      dateOfBirth,
      birthTime,
      birthLocation
    },
    calculationNotes:
      'Approximate sidereal calculation using Lahiri-style ayanamsa and longitude-based local mean time. For professional chart work, confirm with an ephemeris and official birth time zone.'
  };
}

module.exports = { calculateAstrologyProfile };
