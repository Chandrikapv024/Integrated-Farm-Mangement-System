import api from './api';
import { WeatherRecord } from '../types';

export const MOCK_WEATHER: WeatherRecord = {
  temperature: 27.5,
  humidity: 68,
  windSpeed: 14.2,
  rainfall: 12.8,
  condition: 'Partly Cloudy',
  location: 'Green Valley Farm Station (Lat: 12.9716, Lng: 77.5946)',
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  forecast: [
    { day: 'Today', date: 'Aug 18', tempMax: 29, tempMin: 21, condition: 'Partly Cloudy', rainProb: 20, icon: 'cloud-sun' },
    { day: 'Wed', date: 'Aug 19', tempMax: 26, tempMin: 20, condition: 'Heavy Rain', rainProb: 85, icon: 'cloud-rain' },
    { day: 'Thu', date: 'Aug 20', tempMax: 24, tempMin: 19, condition: 'Thunderstorm', rainProb: 90, icon: 'cloud-lightning' },
    { day: 'Fri', date: 'Aug 21', tempMax: 27, tempMin: 20, condition: 'Light Rain', rainProb: 40, icon: 'cloud-drizzle' },
    { day: 'Sat', date: 'Aug 22', tempMax: 30, tempMin: 22, condition: 'Sunny', rainProb: 10, icon: 'sun' },
    { day: 'Sun', date: 'Aug 23', tempMax: 31, tempMin: 23, condition: 'Sunny', rainProb: 5, icon: 'sun' },
    { day: 'Mon', date: 'Aug 24', tempMax: 28, tempMin: 21, condition: 'Partly Cloudy', rainProb: 15, icon: 'cloud-sun' },
  ],
  alert: {
    severity: 'High',
    message: 'Heavy rainfall event (>45mm) predicted within 24–36 hours.',
    action: 'Delay scheduled overhead irrigation across Field A & Field B to prevent soil waterlogging and nutrient leaching.',
  },
};

export const weatherService = {
  getWeather: async (lat?: number, lng?: number): Promise<WeatherRecord> => {
    try {
      const res = await api.get('/weather', {
        params: { lat, lng }
      });
      return res.data;
    } catch {
      return MOCK_WEATHER;
    }
  },
};
