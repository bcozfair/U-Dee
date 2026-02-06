import { AlertTriangle, MapPin, X } from '@tamagui/lucide-icons';
import * as Location from 'expo-location';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, H1, H2, H3, Paragraph, ScrollView, Text, XStack, YStack } from 'tamagui';
import { useThemeContext } from '../../context/ThemeContext';
import { calculateStreak, getRecordDate } from '../../utils/checkInLogic';
import { DATA_KEYS, storage, USER_KEYS } from '../../utils/storage';

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
  const [quote, setQuote] = useState("กำลังโหลดกำลังใจ...");
  const [loading, setLoading] = useState(false);
  const [avatar, setAvatar] = useState("😊");
  const [userName, setUserName] = useState("คุณ");
  const [streak, setStreak] = useState(0);
  const [checkedInToday, setCheckedInToday] = useState(false);
  const [showDangerAlert, setShowDangerAlert] = useState(false);

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
      loadUserData();
      loadStreak();
    }, [])
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

  const loadUserData = async () => {
    const savedAvatar = await storage.get<string>(USER_KEYS.AVATAR);
    const savedName = await storage.get<string>(USER_KEYS.NAME);
    if (savedAvatar) setAvatar(savedAvatar);
    if (savedName) setUserName(savedName);
  };

  const loadStreak = async () => {
    const history = await storage.get<any[]>(DATA_KEYS.HISTORY_LOG);
    if (history) {
      const currentStreak = calculateStreak(history);
      setStreak(currentStreak);

      if (history.length > 0) {
        let lastCheckInTime;
        try {
          const latestItem = history[0];
          lastCheckInTime = getRecordDate(latestItem);
        } catch (e) {
          lastCheckInTime = new Date();
        }

        const today = new Date();
        setCheckedInToday(
          lastCheckInTime.getDate() === today.getDate() &&
          lastCheckInTime.getMonth() === today.getMonth() &&
          lastCheckInTime.getFullYear() === today.getFullYear()
        );

        const diffHours = (today.getTime() - lastCheckInTime.getTime()) / (1000 * 60 * 60);
        setShowDangerAlert(diffHours > 24);
      } else {
        setShowDangerAlert(true);
      }
    } else {
      setShowDangerAlert(true);
    }
  };

  const initCheckIn = async () => {
    setLoading(true);
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('⚠️ ไม่สามารถเข้าถึง GPS', 'กรุณาเปิดการอนุญาตใช้ตำแหน่ง');
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

      const newRecord = {
        id: Date.now().toString(),
        date: new Date().toLocaleString('th-TH'),
        status: selectedStatus,
        coords: location.coords
      };

      const history = await storage.get<any[]>(DATA_KEYS.HISTORY_LOG) || [];
      history.unshift(newRecord);
      await storage.save(DATA_KEYS.HISTORY_LOG, history);
      await storage.save(DATA_KEYS.LAST_LOCATION, location.coords);

      const newStreak = calculateStreak(history);
      setStreak(newStreak);
      setCheckedInToday(true);
      setShowDangerAlert(false);

      Alert.alert(
        "✅ เช็คอินสำเร็จ",
        `สถานะ: "${selectedStatus}"\n🔥 Streak: ${streak + 1} วัน`,
        [
          { text: "📍 ดูตำแหน่ง", onPress: () => router.push('/map') },
          { text: "ตกลง" }
        ]
      );
    } catch (e) {
      console.log(e);
      Alert.alert("Error", "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#1a1a1a' : '#fff' }} edges={['top']}>
      <ScrollView flex={1} backgroundColor="$background" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        <YStack flex={1} padding="$4" gap={isSmallScreen ? "$2" : "$3"}>
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
            padding={isSmallScreen ? "$3" : "$4"}
            backgroundColor="$blue2"
            borderLeftWidth={4}
            borderLeftColor="$blue9"
          >
            <Paragraph size={isSmallScreen ? "$3" : "$4"} color="$blue11" fontStyle="italic" textAlign="center">
              {quote}
            </Paragraph>
          </Card>

          {/* Auto-Alert Warning */}
          {showDangerAlert && (
            <Card
              elevation="$1"
              borderWidth={1}
              borderColor="$red6"
              padding={isSmallScreen ? "$3" : "$4"}
              backgroundColor="$red2"
              marginBottom="$2"
            >
              <XStack alignItems="center" gap="$3">
                <YStack
                  backgroundColor="$red9"
                  width={40}
                  height={40}
                  borderRadius={20}
                  justifyContent="center"
                  alignItems="center"
                >
                  <AlertTriangle size={24} color="white" />
                </YStack>
                <YStack flex={1}>
                  <H3 color="$red10" fontSize={isSmallScreen ? "$4" : "$5"}>แจ้งเตือน!</H3>
                  <Paragraph size="$2" color="$red10">
                    คุณไม่ได้เช็คอินมานานกว่า 24 ชั่วโมง กรุณากดปุ่มเพื่อส่งสัญญาณว่า "อยู่ดี"
                  </Paragraph>
                </YStack>
              </XStack>
            </Card>
          )}

          {/* Streak Card */}
          <Card
            elevation="$1"
            borderWidth={1}
            padding={isSmallScreen ? "$3" : "$4"}
            backgroundColor={streak > 0 ? "$orange2" : "$gray2"}
            borderColor={streak > 0 ? "$orange6" : "$gray6"}
          >
            <XStack alignItems="center" justifyContent="center" gap="$3">
              <Text fontSize={isSmallScreen ? "$7" : "$9"}>🔥</Text>
              <YStack alignItems="center">
                <H1 fontSize={isSmallScreen ? "$8" : "$10"} fontWeight="800" color={streak > 0 ? "$orange10" : "$gray10"}>
                  {streak}
                </H1>
                <Paragraph size={isSmallScreen ? "$2" : "$3"} color="$gray10">วันติดต่อกัน</Paragraph>
              </YStack>
            </XStack>
          </Card>

          {/* Check-in Button */}
          <YStack flex={1} minHeight={buttonSize + 80} alignItems="center" justifyContent="center" paddingVertical="$4">
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
                  <Text fontSize={buttonSize * 0.28}>{avatar}</Text>
                  <Text fontSize={isSmallScreen ? "$3" : "$4"} fontWeight="700" color="white">
                    {checkedInToday ? "เช็คอินอีกครั้ง" : "กดเช็คอิน"}
                  </Text>
                </YStack>
              )}
            </Button>
          </YStack>

          {/* Footer hint */}
          <XStack justifyContent="center" alignItems="center" gap="$2" paddingBottom="$2">
            <MapPin size={14} color="$gray9" />
            <Paragraph size="$2" color="$gray9" textAlign="center">
              กดปุ่มเพื่อระบุสถานะและตำแหน่งของคุณ
            </Paragraph>
          </XStack>
        </YStack>
      </ScrollView>

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