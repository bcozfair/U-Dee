import AsyncStorage from '@react-native-async-storage/async-storage';
import { Navigation } from '@tamagui/lucide-icons';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Platform, useWindowDimensions } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Card, H3, Paragraph, ScrollView, Text, XStack, YStack } from 'tamagui';
import { useThemeContext } from '../context/ThemeContext';
import { FamilyMember, FamilyService } from '../services/FamilyService';

export default function MapScreen() {
  const params = useLocalSearchParams();
  const focusedMemberIdProp = params.memberId as string;
  const insets = useSafeAreaInsets();

  const [dbLocation, setDbLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [avatar, setAvatar] = useState("😊");
  const [lastCheckIn, setLastCheckIn] = useState("");
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  const mapRef = useRef<MapView>(null);

  const { isDark } = useThemeContext();
  const { height } = useWindowDimensions();
  const isSmallScreen = height < 700;

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  useEffect(() => {
    if (focusedMemberIdProp) {
      setSelectedMemberId(focusedMemberIdProp);
    }
  }, [focusedMemberIdProp]);

  useEffect(() => {
    const channel = FamilyService.subscribeToStatusUpdates((payload) => {
      console.log('Realtime update:', payload);
      if (payload.eventType === 'UPDATE' && payload.new) {
        const newData = payload.new;
        setFamilyMembers(currentMembers => currentMembers.map(member => {
          if (member.id === newData.user_id) {
            return {
              ...member,
              location: {
                latitude: newData.latitude,
                longitude: newData.longitude
              },
              status: newData.status_text,
              lastCheckIn: new Date(newData.last_updated).toLocaleString('th-TH'),
              batteryLevel: newData.battery_level,
              isOnline: newData.is_online
            };
          }
          return member;
        }));
      }
    });

    return () => {
      channel.unsubscribe();
    };
  }, []);

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
      const members = await FamilyService.getFamilyMembers();
      setFamilyMembers(members);

      // 3. Focus Map (if memberId provided)
      if (focusedMemberIdProp) {
        const target = members.find(m => m.id === focusedMemberIdProp);
        if (target && target.location && mapRef.current) {
          setTimeout(() => {
            focusLocation(target.location!.latitude, target.location!.longitude);
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

  const handleMemberSelect = (id: string, lat: number, lng: number) => {
    setSelectedMemberId(id);
    focusLocation(lat, lng);
  };

  const openMapsNavigation = () => {
    const targetMember = familyMembers.find(m => m.id === selectedMemberId);
    if (!targetMember || !targetMember.location) return;

    const lat = targetMember.location.latitude;
    const lng = targetMember.location.longitude;
    const label = encodeURIComponent(targetMember.name);

    const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' });
    const latLng = Platform.select({ ios: `${label}@${lat},${lng}`, android: `${lat},${lng}(${label})` });
    const url = Platform.select({
      ios: `${scheme}${label}@${lat},${lng}`,
      android: `${scheme}${lat},${lng}(${label})`
    });

    if (url) {
      Linking.openURL(url);
    }
  };

  if (loading && !dbLocation) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#343434ff' : '#fff' }} edges={['top']}>
        <YStack flex={1} alignItems="center" justifyContent="center" backgroundColor="$background">
          <ActivityIndicator size="large" color="#00ACC1" />
          <Paragraph color="$gray9" marginTop="$3">กำลังโหลดแผนที่...</Paragraph>
        </YStack>
      </SafeAreaView>
    );
  }

  const selectedMember = familyMembers.find(m => m.id === selectedMemberId);

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
        onPress={() => setSelectedMemberId(null)} // Deselect on map press
      >
        {/* User Marker */}
        {dbLocation && (
          <Marker
            coordinate={dbLocation}
            title="คุณ (ล่าสุด)"
            description={`เช็คอินเมื่อ: ${lastCheckIn}`}
            zIndex={2}
          >
            <YStack
              width={48}
              height={48}
              borderRadius={24}
              backgroundColor="$green5"
              borderWidth={3}
              borderColor="$green9"
              elevation={5}
              alignItems="center"
              justifyContent="center"
              shadowColor="black"
              shadowOffset={{ width: 0, height: 2 }}
              shadowOpacity={0.25}
              shadowRadius={3.84}
            >
              <Text fontSize={28}>{avatar}</Text>
            </YStack>
          </Marker>
        )}

        {/* Family Markers */}
        {familyMembers.map((member) => {
          const isSelected = selectedMemberId === member.id;
          return (
            member.location && (
              <Marker
                key={member.id}
                coordinate={member.location}
                title={member.name}
                description={`${member.status} (${member.lastCheckIn})`}
                onPress={() => handleMemberSelect(member.id, member.location!.latitude, member.location!.longitude)}
                zIndex={isSelected ? 10 : 1}
              >
                <YStack
                  width={isSelected ? 48 : 48}
                  height={isSelected ? 48 : 48}
                  borderRadius={isSelected ? 24 : 24}
                  backgroundColor={isSelected ? "$blue5" : "transparent"}
                  borderWidth={3}
                  borderColor={isSelected ? "$blue9" : "transparent"}
                  elevation={isSelected ? 5 : 5}
                  alignItems="center"
                  justifyContent="center"
                  shadowColor="black"
                  shadowOffset={{ width: 0, height: 2 }}
                  shadowOpacity={0.3}
                  shadowRadius={4}
                  // @ts-ignore
                  animation="bouncy"
                >
                  <Text fontSize={isSelected ? 28 : 24} lineHeight={isSelected ? 28 : 24}>
                    {member.avatar}
                  </Text>

                  {/* Status Dot */}
                  {member.status !== 'ปกติ' && (
                    <YStack
                      position="absolute"
                      top={0}
                      right={0}
                      width={13}
                      height={13}
                      borderRadius={6}
                      backgroundColor={member.status === 'สะกิดหน่อย' ? "$red10" : "$green10"}
                      borderWidth={2}
                      borderColor="white"
                    />
                  )}
                </YStack>
              </Marker>
            )
          );
        })}
      </MapView>

      {/* Floating Member List */}
      <Card
        elevation="$4"
        position="absolute"
        bottom={30 + insets.bottom}
        left={20}
        right={20}
        padding="$0"
        backgroundColor={isDark ? 'rgba(30,30,30,0.95)' : 'rgba(255,255,255,0.95)'}
        borderRadius="$6"
        borderWidth={1}
        borderColor="$borderColor"
        shadowColor="black"
        shadowOffset={{ width: 0, height: 4 }}
        shadowOpacity={0.1}
        shadowRadius={12}
      >
        <XStack
          paddingHorizontal="$4"
          paddingVertical="$3"
          borderBottomWidth={1}
          borderBottomColor="$borderColor"
          alignItems="center"
          justifyContent="space-between"
        >
          <H3 fontSize="$5" color="$gray11" textTransform="uppercase" letterSpacing={1}>📍 ตำแหน่งครอบครัว ({familyMembers.length})</H3>

          {selectedMember && selectedMember.location && (
            <Button
              size="$3"
              backgroundColor="$blue9"
              onPress={openMapsNavigation}
              borderRadius="$4"
              paddingHorizontal="$3"
              icon={<Navigation size={16} color="white" />}
              pressStyle={{ scale: 0.95, opacity: 0.8 }}
              // @ts-ignore
              animation="quick"
              enterStyle={{ x: 10, opacity: 0 }}
              exitStyle={{ x: 10, opacity: 0 }}
            >
              <Text color="white" fontWeight="600" fontSize="$2">นำทาง</Text>
            </Button>
          )}
        </XStack>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12 }}>
          <XStack gap="$4" alignItems="center">
            {/* User Button */}
            {dbLocation && (
              <YStack alignItems="center" gap="$2" onPress={() => focusLocation(dbLocation.latitude, dbLocation.longitude)}>
                <YStack
                  width={56} height={56}
                  borderRadius={28}
                  backgroundColor="$green5"
                  alignItems="center"
                  justifyContent="center"
                  borderWidth={3}
                  borderColor="$green9"
                >
                  <Text fontSize={28}>{avatar}</Text>
                </YStack>
                <Text fontSize="$2" color="$color" fontWeight="600">คุณ</Text>
              </YStack>
            )}

            {/* Separator */}
            <YStack width={2} height={75} backgroundColor="$gray6" />

            {/* Family Buttons */}
            {familyMembers.map((member) => {
              const isSelected = selectedMemberId === member.id;
              return (
                <YStack
                  key={member.id}
                  alignItems="center"
                  gap="$2"
                  onPress={() => member.location && handleMemberSelect(member.id, member.location.latitude, member.location.longitude)}
                  opacity={member.location ? 1 : 0.6}
                  scale={isSelected ? 1.05 : 1}
                  // @ts-ignore
                  animation="quick"
                >
                  <YStack
                    width={isSelected ? 55 : 55}
                    height={isSelected ? 55 : 55}
                    borderRadius={isSelected ? 30 : 25}
                    backgroundColor={isSelected ? "$blue5" : "$gray5"}
                    alignItems="center"
                    justifyContent="center"
                    borderWidth={isSelected ? 3 : 3}
                    borderColor={isSelected ? "$blue9" : "transparent"}
                    shadowColor={isSelected ? "$blue9" : "transparent"}
                    shadowRadius={8}
                    shadowOpacity={0.3}
                  >
                    <Text fontSize={isSelected ? 32 : 24}>{member.avatar}</Text>
                  </YStack>
                  <Text
                    fontSize="$2"
                    fontWeight={isSelected ? '600' : '400'}
                    color={isSelected ? '$blue9' : '$gray11'}
                  >
                    {member.name}
                  </Text>
                </YStack>
              );
            })}
          </XStack>
        </ScrollView>
      </Card>
    </YStack>
  );
}