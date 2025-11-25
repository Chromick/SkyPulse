import axios from 'axios';

const API_KEY = process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY;
const BASE_URL = 'https://api.openweathermap.org/data/2.5/';

export type WeatherResponse = {
  name: string;
  main: { temp: number; humidity: number };
  weather: { id: number; main: string; description: string; icon: string }[];
  wind?: { speed: number };
};

export type ForecastItem = {
  dt: number;
  main: { temp_min: number; temp_max: number; humidity: number };
  weather: { id: number; main: string; description: string; icon: string }[];
  wind: { speed: number };
  pop: number;
};

export type ForecastResponse = { list: ForecastItem[] };

export async function getWeatherByCity(city: string) {
  if (!API_KEY) return Promise.reject(new Error('Sem chave'));
  const res = await axios.get<WeatherResponse>(`${BASE_URL}weather`, {
    params: { q: city, appid: API_KEY, units: 'metric', lang: 'pt_br' },
  });
  return res.data;
}

export async function getForecastByCity(city: string) {
  if (!API_KEY) return Promise.reject(new Error('Sem chave'));
  const res = await axios.get<ForecastResponse>(`${BASE_URL}forecast`, {
    params: { q: city, appid: API_KEY, units: 'metric', lang: 'pt_br' },
  });
  return res.data;
}

export async function getWeatherByCoords(lat: number, lon: number) {
  if (!API_KEY) return Promise.reject(new Error('Sem chave'));
  const res = await axios.get<WeatherResponse>(`${BASE_URL}weather`, {
    params: { lat, lon, appid: API_KEY, units: 'metric', lang: 'pt_br' },
  });
  return res.data;
}

export async function getForecastByCoords(lat: number, lon: number) {
  if (!API_KEY) return Promise.reject(new Error('Sem chave'));
  const res = await axios.get<ForecastResponse>(`${BASE_URL}forecast`, {
    params: { lat, lon, appid: API_KEY, units: 'metric', lang: 'pt_br' },
  });
  return res.data;
}
