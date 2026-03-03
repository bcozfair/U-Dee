import { Calendar, Grid, List, Trash2 } from '@tamagui/lucide-icons';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { FlatList, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, H1, H2, H3, Paragraph, ScrollView, Separator, Text, XStack, YStack } from 'tamagui';
import { AlertModal } from '../../components/AlertModal';
import Badges from '../../components/Badges';
import CalendarHeatmap from '../../components/CalendarHeatmap';
import WeeklySummary from '../../components/WeeklySummary';
import { useAuth } from '../../context/AuthContext';
import { useThemeContext } from '../../context/ThemeContext';
import { FamilyService } from '../../services/FamilyService';

import { HistoryItemCard } from '../../components/HistoryItemCard';
import { calculateStreak } from '../../utils/checkInLogic';

// Helper to extract date keys from history
const extractDateKeys = (history: any[]): string[] => {
  return history.map(item => {
    try {
      if (item.createdAt) {
        return new Date(item.createdAt).toISOString().split('T')[0];
      }
      // Fallback for old items (unlikely)
      const date = new Date(item.date);
      if (!isNaN(date.getTime())) {
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
  createdAt?: string;
  latitude?: number;
  longitude?: number;
  coords: {
    latitude: number;
    longitude: number;
  };
}

export default function HistoryScreen() {
  const { session } = useAuth();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [streak, setStreak] = useState(0);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

  // Alert Modal State
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    onConfirm: () => void;
    confirmText: string;
    cancelText: string;
    confirmIcon?: React.ReactNode;
  }>({
    visible: false,
    title: '',
    message: '',
    type: 'info',
    onConfirm: () => { },
    confirmText: 'ตกลง',
    cancelText: 'ยกเลิก'
  });

  const { isDark } = useThemeContext();
  const { height } = useWindowDimensions();
  const isSmallScreen = height < 700;

  useFocusEffect(
    useCallback(() => {
      if (session?.user?.id) {
        loadHistory(session.user.id);
      } else {
        setHistory([]);
      }
    }, [session])
  );

  const loadHistory = async (userId: string) => {
    const data = await FamilyService.getLocationHistory(userId, 100);
    if (data) {
      // Map Supabase data to HistoryItem format
      const mapped = data.map((item: any) => ({
        id: item.id || Date.now().toString(),
        date: item.date,
        createdAt: item.createdAt, // Pass through ISO string
        status: item.status || 'Active',
        coords: {
          latitude: item.latitude,
          longitude: item.longitude
        }
      }));
      setHistory(mapped);
      setStreak(calculateStreak(mapped));
    }
  };

  const deleteItem = async (id: string) => {
    setAlertConfig({
      visible: true,
      title: "🗑️ ลบรายการ",
      message: "คุณแน่ใจหรือไม่ที่จะลบรายการนี้?",
      type: 'warning',
      confirmText: 'ลบ',
      cancelText: 'ยกเลิก',
      confirmIcon: <Trash2 size={20} color="white" />,
      onConfirm: async () => {
        // Optimistic update
        const newHistory = history.filter(item => item.id !== id);
        setHistory(newHistory);
        setStreak(calculateStreak(newHistory));
        setAlertConfig(prev => ({ ...prev, visible: false }));

        // Delete from Supabase
        await FamilyService.deleteLocation(id);
      }
    });
  };

  const clearAll = async () => {
    setAlertConfig({
      visible: true,
      title: "⚠️ ลบทั้งหมด",
      message: "ประวัติการเช็คอินทั้งหมดจะหายไป คุณแน่ใจหรือไม่?",
      type: 'error',
      confirmText: 'ลบทั้งหมด',
      cancelText: 'ยกเลิก',
      confirmIcon: <Trash2 size={20} color="white" />,
      onConfirm: async () => {
        // Optimistic update
        setHistory([]);
        setStreak(0);
        setAlertConfig(prev => ({ ...prev, visible: false }));

        // Delete all from Supabase
        if (session?.user?.id) {
          await FamilyService.clearLocationHistory(session.user.id);
        }
      }
    });
  };

  const renderItem = ({ item, index }: { item: HistoryItem; index: number }) => (
    <HistoryItemCard
      item={item}
      index={index}
      onDelete={deleteItem}
      showDelete={true}
    />
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
              <Paragraph size="$1" color="$orange9">วันติดต่อกัน</Paragraph>
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
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
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
              contentContainerStyle={{ paddingBottom: 100 }}
            />
          )
        )}

      </YStack>

      <AlertModal
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onConfirm={alertConfig.onConfirm}
        onCancel={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
        confirmText={alertConfig.confirmText}
        cancelText={alertConfig.cancelText}
        confirmIcon={alertConfig.confirmIcon}
      />
    </SafeAreaView>
  );
}