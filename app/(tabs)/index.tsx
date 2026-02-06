import { AlertTriangle, MapPin } from '@tamagui/lucide-icons';
import * as Location from 'expo-location';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, H1, H2, H3, Paragraph, ScrollView, Text, XStack, YStack } from 'tamagui';
import { useThemeContext } from '../../context/ThemeContext';
import { DATA_KEYS, storage, USER_KEYS } from '../../utils/storage';

// Helper function to get greeting based on time of day
const getGreeting = (): { text: string; emoji: string } => {
  const hour = new Date().getHours();
  if (hour < 12) return { text: 'สวัสดีตอนเช้า', emoji: '🌅' };
  if (hour < 17) return { text: 'สวัสดีตอนบ่าย', emoji: '☀️' };
  if (hour < 20) return { text: 'สวัสดีตอนเย็น', emoji: '🌆' };
  return { text: 'สวัสดีตอนกลางคืน', emoji: '🌙' };
};

// Helper function to calculate streak
const calculateStreak = (history: any[]): number => {
  if (!history || history.length === 0) return 0;

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const sortedHistory = [...history].sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  let checkDate = new Date(today);

  for (const record of sortedHistory) {
    const recordDate = new Date(record.date);
    recordDate.setHours(0, 0, 0, 0);

    const diffTime = checkDate.getTime() - recordDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else if (diffDays === 1) {
      streak++;
      checkDate = recordDate;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
};

// Array of motivational quotes
const QUOTES = [
  "☁️ ท้องฟ้าหลังฝน ย่อมสวยงามเสมอ",
  "🌟 ทุกวันคือโอกาสใหม่ในการเริ่มต้น",
  "💪 คุณเก่งกว่าที่คุณคิด",
  "🌈 หลังพายุ มีรุ้งกินน้ำเสมอ",
  "🌻 ยิ้มให้วันใหม่ แล้ววันนี้จะยิ้มให้คุณ",
  "❤️ การดูแลตัวเองคือการรักตัวเองที่ดีที่สุด",
  "✨ ความสุขอยู่ในสิ่งเล็กๆ รอบตัว",
  "🙏 ขอบคุณที่ยังอยู่ที่นี่",
];

export default function HomeScreen() {
  const [quote, setQuote] = useState("กำลังโหลดกำลังใจ...");
  const [loading, setLoading] = useState(false);
  const [avatar, setAvatar] = useState("😊");
  const [userName, setUserName] = useState("คุณ");
  const [streak, setStreak] = useState(0);
  const [checkedInToday, setCheckedInToday] = useState(false);
  const [showDangerAlert, setShowDangerAlert] = useState(false);

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

  // EP5: Fetch - ดึงข้อมูลจาก API
  useEffect(() => {
    const fetchQuote = async () => {
      try {
        const response = await fetch('https://jsonplaceholder.typicode.com/users/1');
        await response.json();
        const randomQuote = QUOTES[Math.floor(Math.random() * QUOTES.length)];
        setQuote(randomQuote);
      } catch (err) {
        console.error(err);
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
        // ... (Date parsing logic remains same)
        // ... (We need to copy the logic or assume it's part of replacement. Since I can't put "..." inside replacement logic easily if I replace the whole function, I should include it)
        // Let's rewrite the logic inside loadStreak

        let lastCheckInTime;
        try {
          const latestItem = history[0];
          const timestamp = parseInt(latestItem.id, 10);

          if (!isNaN(timestamp) && timestamp > 0) {
            lastCheckInTime = new Date(timestamp);
          } else {
            lastCheckInTime = new Date(latestItem.date);
          }
        } catch (e) {
          console.log('Error parsing date:', e);
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

  const handleCheckIn = async () => {
    setLoading(true);

    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('⚠️ ไม่สามารถเข้าถึง GPS', 'กรุณาเปิดการอนุญาตใช้ตำแหน่ง');
      setLoading(false);
      return;
    }

    let location = await Location.getCurrentPositionAsync({});

    const newRecord = {
      id: Date.now().toString(),
      date: new Date().toLocaleString('th-TH'),
      status: "ฉันสบายดี 💚",
      coords: location.coords
    };

    try {
      const history = await storage.get<any[]>(DATA_KEYS.HISTORY_LOG) || [];
      history.unshift(newRecord);
      await storage.save(DATA_KEYS.HISTORY_LOG, history);
      await storage.save(DATA_KEYS.LAST_LOCATION, location.coords);

      const newStreak = calculateStreak(history);
      setStreak(newStreak);
      setCheckedInToday(true);
    } catch (e) {
      console.log(e);
    }

    setLoading(false);

    Alert.alert(
      "✅ เช็คอินสำเร็จ",
      `คุณได้ส่งสัญญาณ "อยู่ดี" แล้ว\n🔥 Streak: ${streak + 1} วัน`,
      [
        { text: "📍 ดูตำแหน่ง", onPress: () => router.push('/map') },
        { text: "ตกลง" }
      ]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#1a1a1a' : '#fff' }} edges={['top']}>
      <ScrollView flex={1} backgroundColor="$background" showsVerticalScrollIndicator={false}>
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
              onPress={handleCheckIn}
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
                    {checkedInToday ? "เช็คอินแล้ว ✓" : "กดเช็คอิน"}
                  </Text>
                </YStack>
              )}
            </Button>
          </YStack>

          {/* Footer hint */}
          <XStack justifyContent="center" alignItems="center" gap="$2" paddingBottom="$2">
            <MapPin size={14} color="$gray9" />
            <Paragraph size="$2" color="$gray9" textAlign="center">
              กดปุ่มเพื่อส่งสัญญาณ "อยู่ดี"
            </Paragraph>
          </XStack>
        </YStack>
      </ScrollView>
    </SafeAreaView>
  );
}