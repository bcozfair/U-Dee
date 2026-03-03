import { AlertTriangle, MapPin, X } from '@tamagui/lucide-icons';
import * as Location from 'expo-location';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Image as RNImage, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, H1, H2, H3, Paragraph, ScrollView, Text, XStack, YStack } from 'tamagui';
import { HistoryItemCard } from '../../components/HistoryItemCard';
import { useAuth } from '../../context/AuthContext';
import { useThemeContext } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { FamilyService } from '../../services/FamilyService';
import { UserService } from '../../services/UserService';
import { calculateStreak } from '../../utils/checkInLogic';

// Status Options
const STATUS_OPTIONS = [
  { label: 'สบายดี 💚', value: 'สบายดี' },
  { label: 'พักผ่อน 🏠', value: 'พักผ่อน' },
  { label: 'ทำงาน 🏢', value: 'ทำงาน' },
  { label: 'เรียน 🏫', value: 'เรียน' },
  { label: 'เดินทาง 🚗', value: 'เดินทาง' },
  { label: 'ท่องเที่ยว ✈️', value: 'ท่องเที่ยว' },
  { label: 'ออกกำลังกาย 💪', value: 'ออกกำลังกาย' },
  { label: 'ทำธุระ 📝', value: 'ทำธุระ' },
  { label: 'ทานอาหาร 🍽️', value: 'ทานอาหาร' },
  { label: 'อื่นๆ ❓', value: 'อื่นๆ' },
];

const getGreeting = (): { text: string; emoji: string } => {
  const hour = new Date().getHours();
  if (hour < 12) return { text: 'สวัสดีตอนเช้า', emoji: '🌅' };
  if (hour < 17) return { text: 'สวัสดีตอนบ่าย', emoji: '☀️' };
  if (hour < 20) return { text: 'สวัสดีตอนเย็น', emoji: '🌆' };
  return { text: 'สวัสดีตอนกลางคืน', emoji: '🌙' };
};

const DEFAULT_QUOTE = "ความสุขอยู่ที่ใจเราเอง 😊";

export default function HomeScreen() {
  const { showToast } = useToast();
  const { session } = useAuth();
  const [quote, setQuote] = useState("กำลังโหลดกำลังใจ...");
  const [loading, setLoading] = useState(false);
  const [avatar, setAvatar] = useState("😊");
  const [userName, setUserName] = useState("คุณ");
  const [streak, setStreak] = useState(0);
  const [checkedInToday, setCheckedInToday] = useState(false);
  const [showDangerAlert, setShowDangerAlert] = useState(false);
  const [recentHistory, setRecentHistory] = useState<any[]>([]);

  // Sheet State
  const [openSheet, setOpenSheet] = useState(false);
  const [position, setPosition] = useState(0);

  const { isDark } = useThemeContext();
  const { width, height } = useWindowDimensions();
  const isSmallScreen = height < 700;
  const buttonSize = Math.min(width * 0.45, 180);

  const greeting = getGreeting();

  useFocusEffect(
    useCallback(() => {
      if (session?.user?.id) {
        loadUserData(session.user.id);
        loadStreak(session.user.id);
      }
    }, [session])
  );

  useEffect(() => {
    const fetchQuote = async () => {
      try {
        const response = await fetch('https://raw.githubusercontent.com/bcozfair/U-Dee/refs/heads/master/quotes.json');
        const data = await response.json();
        if (data.quotes && data.quotes.length > 0) {
          const randomQuote = data.quotes[Math.floor(Math.random() * data.quotes.length)];
          setQuote(randomQuote.text);
        }
      } catch (err) {
        setQuote(DEFAULT_QUOTE);
      }
    };
    fetchQuote();
  }, []);

  const loadUserData = async (userId: string) => {
    const profile = await UserService.getProfile(userId);
    if (profile) {
      setAvatar(profile.avatar_url);
      setUserName(profile.username);
    }
  };

  const loadStreak = async (userId: string) => {
    const history = await FamilyService.getLocationHistory(userId, 50);
    if (history && history.length > 0) {
      setRecentHistory(history.slice(0, 3));
      const currentStreak = calculateStreak(history);
      setStreak(currentStreak);

      const lastCheckInDate = new Date(history[0].date);
      const today = new Date();
      setCheckedInToday(
        lastCheckInDate.getDate() === today.getDate() &&
        lastCheckInDate.getMonth() === today.getMonth() &&
        lastCheckInDate.getFullYear() === today.getFullYear()
      );

      const diffHours = (today.getTime() - lastCheckInDate.getTime()) / (1000 * 60 * 60);
      setShowDangerAlert(diffHours > 24);
    } else {
      setShowDangerAlert(true);
    }
  };

  const initCheckIn = async () => {
    setLoading(true);
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      showToast('กรุณาเปิดการอนุญาตใช้ตำแหน่ง', 'error');
      setLoading(false);
      return;
    }
    setLoading(false);
    setOpenSheet(true);
  };

  const confirmCheckIn = async (selectedStatus: string) => {
    setOpenSheet(false);
    setLoading(true);

    try {
      let location = await Location.getCurrentPositionAsync({});

      // Save to Supabase via UserService (updates user_status AND location_history)
      if (session?.user?.id) {
        await UserService.updateStatus(session.user.id, {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          status_text: selectedStatus,
          is_online: true,
          battery_level: 100,
          last_updated: new Date().toISOString()
        });

        // Reload streak and history from Supabase
        await loadStreak(session.user.id);
      }

      setCheckedInToday(true);
      setShowDangerAlert(false);
      showToast(`เช็คอิน: "${selectedStatus}" เรียบร้อย!`, 'success');
    } catch (e) {
      console.log(e);
      showToast("เกิดข้อผิดพลาดในการบันทึกข้อมูล", 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#1a1a1a' : '#fff' }} edges={['top', 'bottom']}>
      <YStack flex={1} padding="$4" gap="$2" justifyContent="space-between">
        {/* Top Section */}
        <YStack gap="$2">
          {/* Header Section */}
          <XStack alignItems="center" gap="$2">
            <Text fontSize={isSmallScreen ? "$6" : "$8"}>{greeting.emoji}</Text>
            <YStack>
              <Paragraph size={isSmallScreen ? "$2" : "$3"} color="$gray10">{greeting.text}</Paragraph>
              <H2 color="$color" fontWeight="700" fontSize={isSmallScreen ? "$5" : "$6"}>{userName}</H2>
            </YStack>
          </XStack>

          {/* Quote Card */}
          <Card
            elevation="$1"
            borderWidth={1}
            borderColor="$borderColor"
            padding={isSmallScreen ? "$2" : "$3"}
            backgroundColor="$blue2"
            borderLeftWidth={4}
            borderLeftColor="$blue9"
          >
            <Paragraph size={isSmallScreen ? "$2" : "$3"} color="$blue11" fontStyle="italic" textAlign="center" numberOfLines={2}>
              {quote}
            </Paragraph>
          </Card>

          {/* Auto-Alert Warning */}
          {showDangerAlert && (
            <Card
              elevation="$1"
              borderWidth={1}
              borderColor="$red6"
              padding={isSmallScreen ? "$2" : "$3"}
              backgroundColor="$red2"
            >
              <XStack alignItems="center" gap="$3">
                <YStack
                  backgroundColor="$red9"
                  width={32}
                  height={32}
                  borderRadius={16}
                  justifyContent="center"
                  alignItems="center"
                >
                  <AlertTriangle size={18} color="white" />
                </YStack>
                <YStack flex={1}>
                  <H3 color="$red10" fontSize={isSmallScreen ? "$3" : "$4"}>แจ้งเตือน!</H3>
                  <Paragraph size="$1" color="$red10" numberOfLines={2}>
                    คุณไม่ได้เช็คอินมานานกว่า 24 ชั่วโมง
                  </Paragraph>
                </YStack>
              </XStack>
            </Card>
          )}

          {/* Streak Card */}
          <Card
            elevation="$1"
            borderWidth={1}
            padding={isSmallScreen ? "$2" : "$3"}
            backgroundColor={streak > 0 ? "$orange2" : "$gray2"}
            borderColor={streak > 0 ? "$orange6" : "$gray6"}
          >
            <XStack alignItems="center" justifyContent="center" gap="$3">
              <Text fontSize={isSmallScreen ? "$6" : "$8"}>🔥</Text>
              <YStack alignItems="center">
                <H1 fontSize={isSmallScreen ? "$7" : "$9"} fontWeight="800" color={streak > 0 ? "$orange10" : "$gray10"}>
                  {streak}
                </H1>
                <Paragraph size={isSmallScreen ? "$2" : "$3"} color="$gray10">วันติดต่อกัน</Paragraph>
              </YStack>
            </XStack>
          </Card>
        </YStack>

        {/* Check-in Button (Center) */}
        <YStack flex={1} alignItems="center" justifyContent="center">
          <Button
            width={buttonSize}
            height={buttonSize}
            borderRadius={buttonSize / 2}
            backgroundColor={checkedInToday ? "$green9" : "$blue9"}
            pressStyle={{
              backgroundColor: checkedInToday ? "$green10" : "$blue10",
              scale: 0.95
            }}
            onPress={initCheckIn}
            disabled={loading}
            elevation="$4"
            borderWidth={4}
            borderColor={checkedInToday ? "$green6" : "$blue6"}
          >
            {loading ? (
              <ActivityIndicator size="large" color="white" />
            ) : (
              <YStack alignItems="center" gap="$1">
                {(avatar.startsWith('http') || avatar.startsWith('file')) ? (
                  <RNImage
                    source={{ uri: avatar }}
                    style={{ width: buttonSize * 0.4, height: buttonSize * 0.4, borderRadius: buttonSize * 0.2, marginBottom: 8 }}
                  />
                ) : (
                  <Text fontSize={buttonSize * 0.28}>{avatar}</Text>
                )}
                <Text fontSize={isSmallScreen ? "$3" : "$4"} fontWeight="700" color="white">
                  {checkedInToday ? "เช็คอินอีกครั้ง" : "กดเช็คอิน"}
                </Text>
              </YStack>
            )}
          </Button>
        </YStack>

        {/* Bottom Section */}
        <YStack gap="$2" justifyContent="flex-end">
          {/* Recent Check-ins */}
          {recentHistory.length > 0 && (
            <YStack gap="$2">
              <H3 color="$gray10" fontSize="$3" marginLeft="$2">เช็คอินล่าสุด</H3>
              <YStack gap="$2">
                {recentHistory.slice(0, 2).map((item, index) => (
                  <HistoryItemCard
                    key={item.id}
                    item={item}
                    index={index}
                    showDelete={false}
                  />
                ))}
              </YStack>
            </YStack>
          )}

          {/* Footer hint */}
          <XStack justifyContent="center" alignItems="center" gap="$2" paddingBottom="$1" opacity={0.6}>
            <MapPin size={12} color="$gray9" />
            <Paragraph size="$1" color="$gray9" textAlign="center">
              กดปุ่มเพื่อระบุสถานะและตำแหน่งของคุณ
            </Paragraph>
          </XStack>
        </YStack>
      </YStack>

      {/* Status Selection Modal */}
      <Modal
        visible={openSheet}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setOpenSheet(false)}
      >
        <YStack flex={1} justifyContent="flex-end" backgroundColor="rgba(0,0,0,0.5)">
          <YStack
            backgroundColor="$background"
            borderTopLeftRadius="$4"
            borderTopRightRadius="$4"
            padding="$4"
            gap="$4"
            width="100%"
            minHeight={300}
          >
            <XStack justifyContent="space-between" alignItems="center">
              <H3 fontSize="$6" color="$color">วันนี้เป็นยังไงบ้าง?</H3>
              <Button size="$3" circular chromeless onPress={() => setOpenSheet(false)}>
                <X size={24} color="$gray10" />
              </Button>
            </XStack>

            <ScrollView showsVerticalScrollIndicator={false}>
              <XStack gap="$3" flexWrap="wrap" justifyContent="center" paddingBottom="$4">
                {STATUS_OPTIONS.map((option) => (
                  <Button
                    key={option.value}
                    width="47%"
                    height={60}
                    backgroundColor="$blue2"
                    borderColor="$blue5"
                    borderWidth={1}
                    onPress={() => confirmCheckIn(option.value)}
                    pressStyle={{ backgroundColor: "$blue4" }}
                  >
                    <Text fontSize={16} fontWeight="600" color="$blue11">{option.label}</Text>
                  </Button>
                ))}
              </XStack>
            </ScrollView>
          </YStack>
        </YStack>
      </Modal>
    </SafeAreaView>
  );
}