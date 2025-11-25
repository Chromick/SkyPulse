import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Image, ScrollView, Text, TextInput, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { useFonts } from 'expo-font';
import Animated, { FadeIn } from 'react-native-reanimated';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getForecastByCity, getForecastByCoords, getWeatherByCity, getWeatherByCoords, ForecastItem, WeatherResponse } from './lib/weatherApi';


export default function App() {
  const { width } = useWindowDimensions();
  const logoSize = Math.min(128, Math.round(width * 0.2));
  const mainIconSize = Math.min(160, Math.round(width * 0.3));
  const [fontsLoaded] = useFonts({ Rubik: require('./Rubik-VariableFont_wght.ttf') });
  const [city, setCity] = useState('');
  const [data, setData] = useState<WeatherResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forecast, setForecast] = useState<ForecastItem[]>([]);
  const apiKey = process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY;
  const hasKey = !!apiKey;

  async function fetchWeather() {
    if (!city) return;
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const json = await getWeatherByCity(city);
      setData(json);
      const fjson = await getForecastByCity(city);
      setForecast(fjson.list);
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'Erro ao buscar clima';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function fetchWeatherByLocation() {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Permissão de localização negada');
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = pos.coords;
      const json = await getWeatherByCoords(latitude, longitude);
      setData(json);
      setCity(json.name);
      const fjson = await getForecastByCoords(latitude, longitude);
      setForecast(fjson.list);
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'Ative a localização e tente novamente';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!hasKey) {
      setError('Adicione EXPO_PUBLIC_OPENWEATHER_API_KEY para carregar o clima');
      return;
    }
    fetchWeatherByLocation().catch(() => {});
  }, [hasKey]);

  useEffect(() => {
    if (fontsLoaded) {
      const anyText: any = Text as any;
      anyText.defaultProps = anyText.defaultProps || {};
      const prevStyle = anyText.defaultProps.style || {};
      anyText.defaultProps.style = [{ ...prevStyle, fontFamily: 'Rubik' }];
    }
  }, [fontsLoaded]);

  function iconNameFor(w?: { id: number; main: string; description: string }) {
    if (!w) return 'weather-cloudy';
    const m = w.main.toLowerCase();
    if (m.includes('thunder')) return 'weather-lightning';
    if (m.includes('drizzle')) return 'weather-rainy';
    if (m.includes('rain')) return 'weather-pouring';
    if (m.includes('snow')) return 'weather-snowy';
    if (m.includes('mist') || m.includes('fog')) return 'weather-fog';
    if (m.includes('clear')) return 'weather-sunny';
    if (m.includes('cloud')) return 'weather-cloudy';
    return 'weather-cloudy';
  }
  const currentIcon = iconNameFor(data?.weather?.[0]);
  const nextHours = forecast.slice(0, 6);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View className="flex-1 bg-neutralLight">
      <LinearGradient colors={["#3A8DFF", "#00D4FF"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingTop: 60, paddingHorizontal: 24, paddingBottom: 24, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 }}>
        <View className="flex-row items-center">
          <Image source={require('./assets/icon.png')} resizeMode="contain" style={{ width: logoSize, height: logoSize, marginRight: 12 }} />
          <Text className="text-3xl font-semibold text-white" style={{ fontWeight: '700' }}>SkyPulse</Text>
        </View>
        <Text className="text-white/80 mt-1" style={{ fontWeight: '400' }}>App de Previsão do Tempo</Text>
        {data && (
          <Animated.View entering={FadeIn} className="mt-6">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-white text-xl" style={{ fontWeight: '600' }}>{data.name}</Text>
                <Text className="text-white text-6xl font-bold" style={{ fontWeight: '700' }}>{Math.round(data.main.temp)}°</Text>
                <Text className="text-white mt-1 capitalize" style={{ fontWeight: '500' }}>{data.weather[0].description}</Text>
              </View>
              <MaterialCommunityIcons name={currentIcon as any} size={mainIconSize} color="#00D4FF" />
            </View>
            <View className="flex-row gap-6 mt-6">
              <View className="items-center">
                <Text className="text-white/80">Vento</Text>
                <Text className="text-white font-semibold">{Math.round((data.wind?.speed ?? 0) * 3.6)} km/h</Text>
              </View>
              <View className="items-center">
                <Text className="text-white/80">Umidade</Text>
                <Text className="text-white font-semibold">{data.main.humidity}%</Text>
              </View>
              <View className="items-center">
                <Text className="text-white/80">Chuva</Text>
                <Text className="text-white font-semibold">{Math.round((nextHours[0]?.pop ?? 0) * 100)}%</Text>
              </View>
            </View>
          </Animated.View>
        )}
      </LinearGradient>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 32 }}>
        {!hasKey && (
          <View className="mb-3 bg-secondary rounded-2xl px-4 py-3">
            <Text className="text-white">Defina EXPO_PUBLIC_OPENWEATHER_API_KEY para habilitar a busca.</Text>
          </View>
        )}
        <View className="mt-2">
          <Text className="text-secondary mb-3" style={{ fontWeight: '600' }}>Próximas horas</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {nextHours.map((it, idx) => {
              const hour = new Date(it.dt * 1000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
              const iname = iconNameFor(it.weather[0]);
              return (
                <View key={idx} className="mr-3 bg-secondary rounded-2xl px-4 py-3 items-center">
                  <MaterialCommunityIcons name={iname as any} size={40} color="#00D4FF" />
                  <Text className="text-white mt-1">{Math.round(it.main.temp_max)}°</Text>
                  <Text className="text-white/80 text-xs">{hour}</Text>
                </View>
              );
            })}
          </ScrollView>
        </View>

        <View className="mt-6">
          <Text className="text-secondary mb-3" style={{ fontWeight: '600' }}>7 dias</Text>
          {forecast.filter((_, i) => i % 8 === 4).slice(0, 7).map((it, idx) => {
            const day = new Date(it.dt * 1000).toLocaleDateString('pt-BR', { weekday: 'short' });
            const iname = iconNameFor(it.weather[0]);
            return (
              <View key={idx} className="flex-row items-center justify-between bg-secondary rounded-2xl px-4 py-3 mb-2">
                <Text className="text-white capitalize">{day}</Text>
                <View className="flex-row items-center">
                  <MaterialCommunityIcons name={iname as any} size={28} color="#00D4FF" style={{ marginRight: 12 }} />
                  <Text className="text-white">{Math.round(it.main.temp_max)}°/{Math.round(it.main.temp_min)}°</Text>
                </View>
              </View>
            );
          })}
        </View>

        <View className="mt-6">
          <Text className="text-secondary mb-2">Cidade</Text>
          <TextInput value={city} onChangeText={setCity} placeholder="Digite o nome da cidade" placeholderTextColor="#2E2E2E55" className="border border-secondary/30 rounded-xl px-4 py-3 bg-white text-neutralDark" returnKeyType="search" onSubmitEditing={fetchWeather} />
          <TouchableOpacity onPress={fetchWeather} disabled={!hasKey} activeOpacity={0.8} className="mt-4 rounded-xl py-3 items-center" style={{ backgroundColor: hasKey ? '#3A8DFF' : '#1B2A41' }}>
            <Text className="text-white font-medium" style={{ fontWeight: '600' }}>Buscar</Text>
          </TouchableOpacity>
        </View>

        {loading && <Text className="mt-6 text-secondary">Carregando...</Text>}
        {error && <Text className="mt-6 text-red-600">{error}</Text>}
      </ScrollView>
      <StatusBar style="light" />
    </View>
  );
}
