import AsyncStorage from '@react-native-async-storage/async-storage';
import { Clock, MapPin, Navigation } from '@tamagui/lucide-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, useWindowDimensions } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, H3, Paragraph, Text, XStack, YStack } from 'tamagui';
import { useThemeContext } from '../context/ThemeContext';

export default function MapScreen() {
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [avatar, setAvatar] = useState("😊");
  const [lastCheckIn, setLastCheckIn] = useState("");
  const [loading, setLoading] = useState(true);

  const { isDark } = useThemeContext();
  const { height } = useWindowDimensions();
  const isSmallScreen = height < 700;

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    setLoading(true);
    try {
      const savedLocation = await AsyncStorage.getItem('last_location');
      const savedAvatar = await AsyncStorage.getItem('user_avatar');
      const historyData = await AsyncStorage.getItem('history_log');

      if (savedLocation) {
        setLocation(JSON.parse(savedLocation));
      }
      if (savedAvatar) {
        setAvatar(savedAvatar);
      }
      if (historyData) {
        const history = JSON.parse(historyData);
        if (history.length > 0) {
          setLastCheckIn(history[0].date);
        }
      }
    } catch (error) {
      console.error('Error loading map data:', error);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#1a1a1a' : '#fff' }} edges={['top']}>
        <YStack flex={1} alignItems="center" justifyContent="center" backgroundColor="$background">
          <ActivityIndicator size="large" color="#00ACC1" />
          <Paragraph color="$gray9" marginTop="$3">กำลังโหลดตำแหน่ง...</Paragraph>
        </YStack>
      </SafeAreaView>
    );
  }

  if (!location) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#1a1a1a' : '#fff' }} edges={['top']}>
        <YStack flex={1} alignItems="center" justifyContent="center" backgroundColor="$background" gap="$3">
          <Text fontSize={60}>📍</Text>
          <H3 color="$gray10" textAlign="center">ยังไม่มีข้อมูลตำแหน่ง</H3>
          <Paragraph size="$2" color="$gray9" textAlign="center">
            กรุณาเช็คอินก่อนเพื่อบันทึกตำแหน่ง
          </Paragraph>
        </YStack>
      </SafeAreaView>
    );
  }

  return (
    <YStack flex={1} backgroundColor="$background">
      <MapView
        style={{ flex: 1 }}
        initialRegion={{
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        userInterfaceStyle={isDark ? 'dark' : 'light'}
      >
        <Marker
          coordinate={location}
          title="จุดเช็คอินล่าสุด"
          description={`เช็คอินเมื่อ: ${lastCheckIn}`}
        >
          <YStack
            backgroundColor="$blue9"
            padding="$2"
            borderRadius={20}
            borderWidth={3}
            borderColor="white"
            elevation={5}
          >
            <Text fontSize={24}>{avatar}</Text>
          </YStack>
        </Marker>
      </MapView>

      {/* Floating Info Card */}
      <Card
        elevation="$2"
        borderWidth={1}
        borderColor="$borderColor"
        position="absolute"
        bottom={30}
        left={16}
        right={16}
        padding={isSmallScreen ? "$3" : "$4"}
        backgroundColor="$background"
        borderRadius="$4"
      >
        <YStack gap="$2">
          <XStack alignItems="center" gap="$2">
            <MapPin size={18} color="$blue9" />
            <H3 color="$color" fontSize={isSmallScreen ? "$4" : "$5"}>ตำแหน่งเช็คอินล่าสุด</H3>
          </XStack>

          <XStack gap="$4">
            <YStack flex={1} gap="$1">
              <XStack alignItems="center" gap="$1">
                <Navigation size={12} color="$gray9" />
                <Paragraph size="$1" color="$gray9">พิกัด</Paragraph>
              </XStack>
              <Text fontSize="$2" fontWeight="600" color="$color">
                {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
              </Text>
            </YStack>

            <YStack flex={1} gap="$1">
              <XStack alignItems="center" gap="$1">
                <Clock size={12} color="$gray9" />
                <Paragraph size="$1" color="$gray9">เวลา</Paragraph>
              </XStack>
              <Text fontSize="$2" fontWeight="600" color="$color" numberOfLines={1}>
                {lastCheckIn || '-'}
              </Text>
            </YStack>
          </XStack>
        </YStack>
      </Card>
    </YStack>
  );
}