import axios from 'axios';

export async function geocodeBirthLocation(query) {
  const value = String(query || '').trim();

  if (!value) {
    return null;
  }

  const response = await axios.get('https://nominatim.openstreetmap.org/search', {
    params: {
      q: value,
      format: 'json',
      limit: 1
    },
    timeout: 8000
  });
  const place = response.data?.[0];

  if (!place) {
    return null;
  }

  return {
    name: place.display_name,
    latitude: Number(place.lat),
    longitude: Number(place.lon)
  };
}
