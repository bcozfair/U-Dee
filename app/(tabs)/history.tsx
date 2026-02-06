import { Calendar, Grid, List, MapPin, Trash2 } from '@tamagui/lucide-icons';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, FlatList, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, H1, H2, H3, Paragraph, ScrollView, Separator, Text, XStack, YStack } from 'tamagui';
import Badges from '../../components/Badges';
import CalendarHeatmap from '../../components/CalendarHeatmap';
import WeeklySummary from '../../components/WeeklySummary';
import { useThemeContext } from '../../context/ThemeContext';
import { DATA_KEYS, storage } from '../../utils/storage';

// Helper to calculate streak
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

// Helper to extract date keys from history
// Note: item.id is a timestamp (Date.now()), so we use it to get the actual date
const extractDateKeys = (history: any[]): string[] => {
  return history.map(item => {
    try {
      // item.id is Date.now() timestamp
      const timestamp = parseInt(item.id, 10);
      if (!isNaN(timestamp)) {
        const date = new Date(timestamp);
        return date.toISOString().split('T')[0];
      }
      return '';
    } catch {
      return '';
    }
  }).filter(key => key !== '');
};

interface HistoryItem {
  id: string;
  date: string;
  status: string;
  coords: {
    latitude: number;
    longitude: number;
  };
}

export default function HistoryScreen() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [streak, setStreak] = useState(0);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

  const { isDark } = useThemeContext();
  const { height } = useWindowDimensions();
  const isSmallScreen = height < 700;

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [])
  );

  const loadHistory = async () => {
    const data = await storage.get<any[]>(DATA_KEYS.HISTORY_LOG);
    if (data) {
      setHistory(data);
      setStreak(calculateStreak(data));
    }
  };

  const deleteItem = async (id: string) => {
    Alert.alert("🗑️ ลบรายการ", "คุณแน่ใจหรือไม่?", [
      { text: "ยกเลิก", style: "cancel" },
      {
        text: "ลบ",
        style: "destructive",
        onPress: async () => {
          const newHistory = history.filter(item => item.id !== id);
          await storage.save(DATA_KEYS.HISTORY_LOG, newHistory);
          setHistory(newHistory);
          setStreak(calculateStreak(newHistory));
        }
      }
    ]);
  };

  const clearAll = async () => {
    Alert.alert("⚠️ ลบทั้งหมด", "คุณแน่ใจหรือไม่?", [
      { text: "ยกเลิก", style: "cancel" },
      {
        text: "ลบทั้งหมด",
        style: "destructive",
        onPress: async () => {
          await storage.remove(DATA_KEYS.HISTORY_LOG);
          setHistory([]);
          setStreak(0);
        }
      }
    ]);
  };

  const renderItem = ({ item, index }: { item: HistoryItem; index: number }) => (
    <Card
      elevation="$1"
      borderWidth={1}
      borderColor="$borderColor"
      padding={isSmallScreen ? "$2" : "$3"}
      marginBottom="$2"
      backgroundColor="$background"
      borderLeftWidth={4}
      borderLeftColor={index === 0 ? "$green9" : "$blue6"}
    >
      <XStack justifyContent="space-between" alignItems="flex-start">
        <XStack gap="$2" flex={1}>
          <YStack
            width={isSmallScreen ? 36 : 44}
            height={isSmallScreen ? 36 : 44}
            borderRadius={22}
            backgroundColor={index === 0 ? "$green4" : "$blue4"}
            alignItems="center"
            justifyContent="center"
          >
            <Text fontSize={isSmallScreen ? "$3" : "$5"}>{index === 0 ? "💚" : "🌿"}</Text>
          </YStack>

          <YStack flex={1} gap="$0">
            <XStack alignItems="center" gap="$1">
              <Calendar size={10} color="$gray9" />
              <Paragraph size="$1" color="$gray9" numberOfLines={1}>{item.date}</Paragraph>
            </XStack>

            <Text fontSize={isSmallScreen ? "$2" : "$3"} fontWeight="600" color="$color">{item.status}</Text>

            <XStack alignItems="center" gap="$1">
              <MapPin size={10} color="$gray8" />
              <Paragraph size="$1" color="$gray8" numberOfLines={1}>
                {item.coords.latitude.toFixed(4)}, {item.coords.longitude.toFixed(4)}
              </Paragraph>
            </XStack>
          </YStack>
        </XStack>

        <Button size="$2" circular chromeless onPress={() => deleteItem(item.id)}>
          <Trash2 size={14} color="$red9" />
        </Button>
      </XStack>
    </Card>
  );

  const EmptyState = () => (
    <YStack flex={1} alignItems="center" justifyContent="center" gap="$3" padding="$4">
      <Text fontSize={50}>📭</Text>
      <H2 color="$gray10" textAlign="center" fontSize={isSmallScreen ? "$5" : "$6"}>ยังไม่มีประวัติ</H2>
      <Paragraph size="$2" color="$gray9" textAlign="center">กลับไปหน้าแรกแล้วกดปุ่มเช็คอิน</Paragraph>
    </YStack>
  );

  const checkInDates = extractDateKeys(history);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#1a1a1a' : '#fff' }} edges={['top']}>
      <YStack flex={1} backgroundColor="$background" padding="$3">
        {/* Header */}
        <XStack justifyContent="space-between" alignItems="center" marginBottom="$2">
          <YStack>
            <H1 fontSize={isSmallScreen ? "$5" : "$7"} fontWeight="800" color="$color">📋 ประวัติ</H1>
            <Paragraph size="$1" color="$gray10">บันทึกการเช็คอิน</Paragraph>
          </YStack>

          <XStack gap="$2">
            {/* View Mode Toggle */}
            <XStack backgroundColor={isDark ? '#333' : '#f0f0f0'} borderRadius="$2" padding="$1">
              <Button
                size="$2"
                chromeless
                backgroundColor={viewMode === 'calendar' ? '$blue9' : 'transparent'}
                onPress={() => setViewMode('calendar')}
                borderRadius="$2"
              >
                <Grid size={14} color={viewMode === 'calendar' ? 'white' : '$gray9'} />
              </Button>
              <Button
                size="$2"
                chromeless
                backgroundColor={viewMode === 'list' ? '$blue9' : 'transparent'}
                onPress={() => setViewMode('list')}
                borderRadius="$2"
              >
                <List size={14} color={viewMode === 'list' ? 'white' : '$gray9'} />
              </Button>
            </XStack>

            {history.length > 0 && (
              <Button size="$2" chromeless onPress={clearAll}>
                <Trash2 size={14} color="$red9" />
              </Button>
            )}
          </XStack>
        </XStack>

        {/* Stats Card */}
        <Card
          elevation="$1"
          borderWidth={1}
          padding="$3"
          marginBottom="$3"
          backgroundColor="$orange2"
          borderColor="$orange6"
        >
          <XStack justifyContent="space-around" alignItems="center">
            <YStack alignItems="center">
              <XStack alignItems="center" gap="$1">
                <Text fontSize={isSmallScreen ? "$5" : "$7"}>🔥</Text>
                <H1 fontSize={isSmallScreen ? "$6" : "$8"} fontWeight="800" color="$orange10">{streak}</H1>
              </XStack>
              <Paragraph size="$1" color="$orange9">Streak</Paragraph>
            </YStack>

            <Separator vertical height={35} />

            <YStack alignItems="center">
              <H1 fontSize={isSmallScreen ? "$6" : "$8"} fontWeight="800" color="$blue10">{history.length}</H1>
              <Paragraph size="$1" color="$blue9">ครั้งทั้งหมด</Paragraph>
            </YStack>
          </XStack>
        </Card>

        {/* Calendar View */}
        {viewMode === 'calendar' && (
          <ScrollView showsVerticalScrollIndicator={false}>
            <YStack gap="$3">
              <Card elevation="$1" borderWidth={1} borderColor="$borderColor" padding="$3" backgroundColor="$background">
                <XStack alignItems="center" gap="$2" marginBottom="$3">
                  <Calendar size={16} color="$blue9" />
                  <H3 color="$color" fontSize="$4">ปฏิทินการเช็คอิน</H3>
                </XStack>
                <CalendarHeatmap checkInDates={checkInDates} />
              </Card>

              {/* Weekly Summary */}
              <WeeklySummary history={history} />

              {/* Goals & Badges */}
              <Badges streak={streak} totalCheckIns={history.length} />

              {/* Recent check-ins */}
              {history.length > 0 && (
                <YStack gap="$2">
                  <H3 color="$color" fontSize="$3">เช็คอินล่าสุด</H3>
                  {history.slice(0, 3).map((item, index) => (
                    <XStack key={item.id} alignItems="center" gap="$2" padding="$2" backgroundColor="$gray2" borderRadius="$2">
                      <Text fontSize="$3">{index === 0 ? "💚" : "🌿"}</Text>
                      <Paragraph size="$2" color="$color" flex={1}>{item.date}</Paragraph>
                      <Paragraph size="$1" color="$gray9">{item.status}</Paragraph>
                    </XStack>
                  ))}
                </YStack>
              )}
            </YStack>
          </ScrollView>
        )}

        {/* List View or Empty State */}
        {viewMode === 'list' && (
          history.length === 0 ? (
            <EmptyState />
          ) : (
            <FlatList
              data={history}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 10 }}
            />
          )
        )}

      </YStack>
    </SafeAreaView>
  );
}