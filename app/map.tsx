import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, useWindowDimensions } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card, H3, Paragraph, ScrollView, Text, XStack, YStack } from 'tamagui';
import { useThemeContext } from '../context/ThemeContext';
import { FamilyMember, getFamilyMembers } from '../services/MockFamilyService';

export default function MapScreen() {
  const params = useLocalSearchParams();
  const focusedMemberId = params.memberId as string;
  const insets = useSafeAreaInsets();

  const [dbLocation, setDbLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [avatar, setAvatar] = useState("😊");
  const [lastCheckIn, setLastCheckIn] = useState("");
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const mapRef = useRef<MapView>(null);

  const { isDark } = useThemeContext();
  const { height, width } = useWindowDimensions();
  const isSmallScreen = height < 700;

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Load User's last location
      const savedLocation = await AsyncStorage.getItem('last_location');
      const savedAvatar = await AsyncStorage.getItem('user_avatar');
      const historyData = await AsyncStorage.getItem('history_log');

      if (savedLocation) {
        setDbLocation(JSON.parse(savedLocation));
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

      // 2. Load Family Members
      const members = await getFamilyMembers();
      setFamilyMembers(members);

      // 3. Focus Map (if memberId provided)
      if (focusedMemberId) {
        const target = members.find(m => m.id === focusedMemberId);
        if (target && target.location && mapRef.current) {
          setTimeout(() => {
            mapRef.current?.animateToRegion({
              latitude: target.location.latitude,
              longitude: target.location.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }, 1000);
          }, 500); // Delay for map load
        }
      } else if (savedLocation && mapRef.current) {
        // Default to user location
        const userLoc = JSON.parse(savedLocation);
        setTimeout(() => {
          mapRef.current?.animateToRegion({
            latitude: userLoc.latitude,
            longitude: userLoc.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }, 1000);
        }, 500);
      }

    } catch (error) {
      console.error('Error loading map data:', error);
    }
    setLoading(false);
  };

  const focusLocation = (lat: number, lng: number) => {
    mapRef.current?.animateToRegion({
      latitude: lat,
      longitude: lng,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    }, 500);
  };

  if (loading && !dbLocation) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#1a1a1a' : '#fff' }} edges={['top']}>
        <YStack flex={1} alignItems="center" justifyContent="center" backgroundColor="$background">
          <ActivityIndicator size="large" color="#00ACC1" />
          <Paragraph color="$gray9" marginTop="$3">กำลังโหลดแผนที่...</Paragraph>
        </YStack>
      </SafeAreaView>
    );
  }

  return (
    <YStack flex={1} backgroundColor="$background">
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        initialRegion={{
          latitude: 13.7563, // Default Bangkok
          longitude: 100.5018,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        }}
        userInterfaceStyle={isDark ? 'dark' : 'light'}
      >
        {/* User Marker */}
        {dbLocation && (
          <Marker
            coordinate={dbLocation}
            title="คุณ (ล่าสุด)"
            description={`เช็คอินเมื่อ: ${lastCheckIn}`}
            pinColor="green"
          >
            <YStack
              backgroundColor="$green9"
              padding="$2"
              borderRadius={20}
              borderWidth={3}
              borderColor="white"
              elevation={5}
              alignItems="center"
              justifyContent="center"
            >
              <Text fontSize={20}>{avatar}</Text>
            </YStack>
          </Marker>
        )}

        {/* Family Markers */}
        {familyMembers.map((member) => (
          member.location && (
            <Marker
              key={member.id}
              coordinate={member.location}
              title={member.name}
              description={`${member.status} (${member.lastCheckIn})`}
            >
              <YStack
                backgroundColor="$blue9"
                padding="$1.5"
                borderRadius={20}
                borderWidth={2}
                borderColor="white"
                elevation={4}
                alignItems="center"
                justifyContent="center"
                width={40}
                height={40}
              >
                <Text fontSize={18}>{member.avatar}</Text>
              </YStack>
            </Marker>
          )
        ))}
      </MapView>

      {/* Floating Member List */}
      <Card
        elevation="$2"
        position="absolute"
        bottom={16 + insets.bottom}
        left={16}
        right={16}
        padding="$0"
        backgroundColor={isDark ? 'rgba(26,26,26,0.95)' : 'rgba(255,255,255,0.95)'}
        borderRadius="$4"
        borderWidth={1}
        borderColor="$borderColor"
      >
        <YStack padding="$3" borderBottomWidth={1} borderBottomColor="$borderColor">
          <H3 fontSize="$4" color="$color">📍 ตำแหน่งครอบครัว</H3>
        </YStack>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} padding="$3">
          <XStack gap="$3">
            {/* User Button */}
            {dbLocation && (
              <YStack alignItems="center" gap="$2" onPress={() => focusLocation(dbLocation.latitude, dbLocation.longitude)}>
                <YStack
                  width={50} height={50}
                  borderRadius={25}
                  backgroundColor="$green5"
                  alignItems="center"
                  justifyContent="center"
                  borderWidth={2}
                  borderColor="$green9"
                >
                  <Text fontSize={24}>{avatar}</Text>
                </YStack>
                <Text fontSize="$2" color="$color">คุณ</Text>
              </YStack>
            )}

            {/* Family Buttons */}
            {familyMembers.map((member) => (
              <YStack
                key={member.id}
                alignItems="center"
                gap="$2"
                onPress={() => member.location && focusLocation(member.location.latitude, member.location.longitude)}
                opacity={member.location ? 1 : 0.5}
              >
                <YStack
                  width={50} height={50}
                  borderRadius={25}
                  backgroundColor="$blue3"
                  alignItems="center"
                  justifyContent="center"
                  borderWidth={2}
                  borderColor={focusedMemberId === member.id ? "$blue9" : "transparent"}
                >
                  <Text fontSize={24}>{member.avatar}</Text>
                </YStack>
                <Text fontSize="$2" color="$color">{member.name}</Text>
              </YStack>
            ))}
          </XStack>
        </ScrollView>
      </Card>
    </YStack>
  );
}