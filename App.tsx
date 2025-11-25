import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Image, ScrollView, Text, View, useWindowDimensions, Platform } from 'react-native';
import { useFonts } from 'expo-font';
import Animated, { FadeIn, useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import styled from 'styled-components/native';
import { getForecastByCity, getForecastByCoords, getWeatherByCity, getWeatherByCoords, ForecastItem, WeatherResponse } from './lib/weatherApi';

const Container = styled.View`
  flex: 1;
  background-color: #2E2E2E;
`;

const Header = styled(LinearGradient).attrs({
  colors: ['#264a7c', '#00D4FF'],
  start: { x: 0, y: 0 },
  end: { x: 1, y: 1 },
})`
  padding-top: 60px;
  padding-left: 24px;
  padding-right: 24px;
  padding-bottom: 24px;
  border-bottom-left-radius: 32px;
  border-bottom-right-radius: 32px;
  align-items: center;
  justify-content: center;
`;

const HeaderRow = styled.View`
  flex-direction: row;
  align-items: center;
  margin-top: ${Platform.OS === 'web' ? '0px' : '-40px'};
`;

const AnimatedSection = styled(Animated.View)`
  margin-top: 24px;
`;

const MainRow = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  margin-top: ${Platform.OS === 'web' ? '0px' : '-50px'};
`;

const CityName = styled.Text`
  color: #F5F8FF;
  font-weight: 600;
  font-size: 20px;
`;

const CurrentTemp = styled.Text`
  color: #F5F8FF;
  font-weight: 700;
  font-size: 64px;
`;

const CurrentDesc = styled.Text`
  color: #F5F8FF;
  font-weight: 500;
  margin-top: 4px;
  text-transform: capitalize;
`;

const Metrics = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-around;
  width: 100%;
  margin-top: 24px;
  flex-wrap: nowrap;
`;

const MetricItem = styled.View`
  flex-direction: column;
  align-items: center;
`;

const Label = styled.Text`
  color: rgba(245, 248, 255, 0.8);
  margin-bottom: 4px;
`;

const Value = styled.Text`
  color: #F5F8FF;
  font-weight: 600;
`;

const Banner = styled.View`
  background-color: #1B2A41;
  border-radius: 16px;
  padding: 12px 16px;
  margin-bottom: 12px;
`;

const Section = styled.View`
  margin-top: 8px;
`;

const SectionTitle = styled.Text`
  color: #F5F8FF;
  font-weight: 600;
  margin-bottom: 12px;
`;

const HourCard = styled.View`
  background-color: #1B2A41;
  border-radius: 16px;
  padding: 12px 16px;
  margin-right: 12px;
  align-items: center;
`;

const DayRow = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  background-color: #1B2A41;
  border-radius: 16px;
  padding: 12px 16px;
  margin-bottom: 8px;
`;

const LabelLight = styled.Text`
  color: #F5F8FF;
`;

const InputLabel = styled.Text`
  color: #F5F8FF;
  margin-bottom: 8px;
`;

const Input = styled.TextInput`
  border-width: 1px;
  border-color: rgba(27, 42, 65, 0.3);
  border-radius: 12px;
  padding: 12px 16px;
  background-color: #1B2A41;
  color: #F5F8FF;
`;

const Button = styled.TouchableOpacity<{ disabled?: boolean }>`
  border-radius: 12px;
  padding: 12px;
  align-items: center;
  margin-top: 16px;
  background-color: ${(p) => (p.disabled ? '#1B2A41' : '#3A8DFF')};
`;

const ButtonText = styled.Text`
  color: #F5F8FF;
  font-weight: 600;
`;

const LoadingText = styled.Text`
  margin-top: 24px;
  color: #F5F8FF;
`;

const ErrorText = styled.Text`
  margin-top: 24px;
  color: #F5F8FF;
`;


export default function App() {
  const { width } = useWindowDimensions();
  const logoSize = Math.min(192, Math.round(width * 0.3));
  const mainIconSize = Math.min(160, Math.round(width * 0.3));
  const [fontsLoaded] = useFonts({ Rubik: require('./Rubik-VariableFont_wght.ttf') });
  const [city, setCity] = useState('');
  const [data, setData] = useState<WeatherResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forecast, setForecast] = useState<ForecastItem[]>([]);
  const apiKey = process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY;
  const hasKey = !!apiKey;

  // Animations: Header slide down on mount, then reveal content with fade
  const headerTranslateY = useSharedValue(-100);
  const contentOpacity = useSharedValue(0);
  const contentTranslateY = useSharedValue(12);
  const iconOpacity = useSharedValue(0);
  const iconTranslateY = useSharedValue(-20);
  const hoursOpacity = useSharedValue(0);
  const hoursTranslateY = useSharedValue(12);
  const daysOpacity = useSharedValue(0);
  const daysTranslateY = useSharedValue(12);

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: headerTranslateY.value }],
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: contentTranslateY.value }],
  }));

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    opacity: iconOpacity.value,
    transform: [{ translateY: iconTranslateY.value }],
  }));

  const hoursAnimatedStyle = useAnimatedStyle(() => ({
    opacity: hoursOpacity.value,
    transform: [{ translateY: hoursTranslateY.value }],
  }));

  const daysAnimatedStyle = useAnimatedStyle(() => ({
    opacity: daysOpacity.value,
    transform: [{ translateY: daysTranslateY.value }],
  }));

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

  // Trigger header slide and content fade on mount (slower)
  useEffect(() => {
    headerTranslateY.value = withTiming(0, { duration: 1200, easing: Easing.out(Easing.cubic) }, (finished) => {
      if (finished) {
        // Icon fade + slide
        iconOpacity.value = withTiming(1, { duration: 800 });
        iconTranslateY.value = withTiming(0, { duration: 800, easing: Easing.out(Easing.cubic) });

        // Content fade + slide
        contentOpacity.value = withTiming(1, { duration: 900 });
        contentTranslateY.value = withTiming(0, { duration: 900, easing: Easing.out(Easing.cubic) });

        // Sections
        hoursOpacity.value = withTiming(1, { duration: 950 });
        hoursTranslateY.value = withTiming(0, { duration: 950, easing: Easing.out(Easing.cubic) });
        daysOpacity.value = withTiming(1, { duration: 1000 });
        daysTranslateY.value = withTiming(0, { duration: 1000, easing: Easing.out(Easing.cubic) });
      }
    });
  }, []);

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
    <Container>
      <Animated.View style={headerAnimatedStyle}>
        <Header>
          <HeaderRow>
            <Image source={require('./assets/icon.png')} resizeMode="contain" style={{ width: logoSize, height: logoSize, marginRight: 12 }} />
          </HeaderRow>
          {data && (
            <AnimatedSection entering={FadeIn}>
              <MainRow>
                <View>
                  <CityName>{data.name}</CityName>
                  <CurrentTemp>{Math.round(data.main.temp)}°</CurrentTemp>
                  <CurrentDesc>{data.weather[0].description}</CurrentDesc>
                </View>
              <Animated.View style={iconAnimatedStyle}>
                <MaterialCommunityIcons name={currentIcon as any} size={mainIconSize} color="#00D4FF" />
              </Animated.View>
              </MainRow>
              <Metrics>
                <MetricItem>
                  <Label>Vento</Label>
                  <Value>{Math.round((data.wind?.speed ?? 0) * 3.6)} km/h</Value>
                </MetricItem>
                <MetricItem>
                  <Label>Umidade</Label>
                  <Value>{data.main.humidity}%</Value>
                </MetricItem>
                <MetricItem>
                  <Label>Chuva</Label>
                  <Value>{Math.round((nextHours[0]?.pop ?? 0) * 100)}%</Value>
                </MetricItem>
              </Metrics>
            </AnimatedSection>
          )}
        </Header>
      </Animated.View>

      <Animated.ScrollView
        style={[contentAnimatedStyle, { flex: 1 }]}
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 32 }}
      >
          {!hasKey && (
            <Banner>
              <LabelLight>Defina EXPO_PUBLIC_OPENWEATHER_API_KEY para habilitar a busca.</LabelLight>
            </Banner>
          )}
          <Section>
            <SectionTitle>Próximas horas</SectionTitle>
          <Animated.View style={hoursAnimatedStyle}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {nextHours.map((it, idx) => {
                const hour = new Date(it.dt * 1000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                const iname = iconNameFor(it.weather[0]);
                return (
                  <HourCard key={idx}>
                    <MaterialCommunityIcons name={iname as any} size={40} color="#00D4FF" />
                    <LabelLight style={{ marginTop: 4 }}>{Math.round(it.main.temp_max)}°</LabelLight>
                    <LabelLight style={{ opacity: 0.8, fontSize: 12 }}>{hour}</LabelLight>
                  </HourCard>
                );
              })}
            </ScrollView>
          </Animated.View>
          </Section>

          <Section style={{ marginTop: 24 }}>
            <SectionTitle>7 dias</SectionTitle>
          <Animated.View style={daysAnimatedStyle}>
            {forecast.filter((_, i) => i % 8 === 4).slice(0, 7).map((it, idx) => {
              const day = new Date(it.dt * 1000).toLocaleDateString('pt-BR', { weekday: 'short' });
              const iname = iconNameFor(it.weather[0]);
              return (
                <DayRow key={idx}>
                  <LabelLight style={{ textTransform: 'capitalize' }}>{day}</LabelLight>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <MaterialCommunityIcons name={iname as any} size={28} color="#00D4FF" style={{ marginRight: 12 }} />
                    <LabelLight>{Math.round(it.main.temp_max)}°/{Math.round(it.main.temp_min)}°</LabelLight>
                  </View>
                </DayRow>
              );
            })}
          </Animated.View>
          </Section>

          <Section style={{ marginTop: 24 }}>
            <InputLabel>Cidade</InputLabel>
            <Input
              value={city}
              onChangeText={setCity}
              placeholder="Digite o nome da cidade"
              placeholderTextColor="#F5F8FF55"
              returnKeyType="search"
              onSubmitEditing={fetchWeather}
            />
            <Button onPress={fetchWeather} disabled={!hasKey} activeOpacity={0.8}>
              <ButtonText>Buscar</ButtonText>
            </Button>
          </Section>

          {loading && <LoadingText>Carregando...</LoadingText>}
          {error && <ErrorText>{error}</ErrorText>}
      </Animated.ScrollView>
      <StatusBar style="light" />
    </Container>
  );
}
