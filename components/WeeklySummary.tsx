import { Calendar, Minus, Target, TrendingDown, TrendingUp } from '@tamagui/lucide-icons';
import React from 'react';
import { Card, H3, Paragraph, Text, XStack, YStack } from 'tamagui';
import { useThemeContext } from '../context/ThemeContext';

interface WeeklySummaryProps {
    history: Array<{
        id: string;
        date: string;
        status: string;
    }>;
}

// Get start and end of current week
const getWeekRange = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();

    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    return { startOfWeek, endOfWeek };
};

// Get previous week range
const getPreviousWeekRange = () => {
    const { startOfWeek } = getWeekRange();

    const prevEnd = new Date(startOfWeek);
    prevEnd.setDate(startOfWeek.getDate() - 1);
    prevEnd.setHours(23, 59, 59, 999);

    const prevStart = new Date(prevEnd);
    prevStart.setDate(prevEnd.getDate() - 6);
    prevStart.setHours(0, 0, 0, 0);

    return { startOfWeek: prevStart, endOfWeek: prevEnd };
};

// Count unique days with check-ins in a date range
const countCheckInsInRange = (history: any[], start: Date, end: Date): number => {
    const uniqueDays = new Set<string>();

    history.forEach(item => {
        const timestamp = parseInt(item.id, 10);
        if (isNaN(timestamp)) return;

        const date = new Date(timestamp);
        if (date >= start && date <= end) {
            uniqueDays.add(date.toDateString());
        }
    });

    return uniqueDays.size;
};

// Calculate days left in week
const getDaysLeftInWeek = (): number => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    return 6 - dayOfWeek; // 0 = Sunday, 6 = Saturday
};

export default function WeeklySummary({ history }: WeeklySummaryProps) {
    const { isDark } = useThemeContext();

    const { startOfWeek, endOfWeek } = getWeekRange();
    const prevWeek = getPreviousWeekRange();

    const thisWeekCount = countCheckInsInRange(history, startOfWeek, endOfWeek);
    const prevWeekCount = countCheckInsInRange(history, prevWeek.startOfWeek, prevWeek.endOfWeek);

    const daysLeft = getDaysLeftInWeek();
    const today = new Date();
    const dayOfWeek = today.getDay() + 1; // 1-indexed

    // Calculate completion percentage
    const completionPercent = Math.round((thisWeekCount / 7) * 100);

    // Trend calculation
    const trend = thisWeekCount - (prevWeekCount / 7) * dayOfWeek; // Normalized comparison

    const getTrendInfo = () => {
        if (trend > 0.5) {
            return { icon: TrendingUp, color: '$green9', text: 'ดีขึ้น' };
        } else if (trend < -0.5) {
            return { icon: TrendingDown, color: '$red9', text: 'ลดลง' };
        }
        return { icon: Minus, color: '$gray9', text: 'เท่าเดิม' };
    };

    const trendInfo = getTrendInfo();
    const TrendIcon = trendInfo.icon;

    return (
        <Card elevation="$1" borderWidth={1} borderColor="$borderColor" padding="$3" backgroundColor="$background">
            <XStack alignItems="center" gap="$2" marginBottom="$3">
                <Calendar size={16} color="$purple9" />
                <H3 color="$color" fontSize="$4">สรุปประจำสัปดาห์</H3>
            </XStack>

            <YStack gap="$3">
                {/* Progress Row */}
                <XStack justifyContent="space-between" alignItems="center">
                    <YStack>
                        <Paragraph size="$1" color="$gray9">เช็คอินแล้ว</Paragraph>
                        <XStack alignItems="baseline" gap="$1">
                            <Text fontSize="$7" fontWeight="800" color="$green10">{thisWeekCount}</Text>
                            <Text fontSize="$3" color="$gray9">/ 7 วัน</Text>
                        </XStack>
                    </YStack>

                    <YStack alignItems="flex-end">
                        <Paragraph size="$1" color="$gray9">เหลืออีก</Paragraph>
                        <Text fontSize="$5" fontWeight="700" color="$blue10">{daysLeft} วัน</Text>
                    </YStack>
                </XStack>

                {/* Progress Bar */}
                <YStack>
                    <XStack
                        height={8}
                        backgroundColor={isDark ? '#333' : '#e0e0e0'}
                        borderRadius="$4"
                        overflow="hidden"
                    >
                        <XStack
                            width={`${completionPercent}%`}
                            backgroundColor="$green9"
                            borderRadius="$4"
                        />
                    </XStack>
                    <XStack justifyContent="space-between" marginTop="$1">
                        <Paragraph size="$1" color="$gray9">{completionPercent}% สำเร็จ</Paragraph>
                        <XStack alignItems="center" gap="$1">
                            <TrendIcon size={12} color={trendInfo.color as any} />
                            <Paragraph size="$1" color={trendInfo.color as any}>{trendInfo.text}</Paragraph>
                        </XStack>
                    </XStack>
                </YStack>

                {/* Comparison with last week */}
                <XStack
                    backgroundColor={isDark ? '#2a2a2a' : '#f5f5f5'}
                    padding="$2"
                    borderRadius="$2"
                    alignItems="center"
                    gap="$2"
                >
                    <Target size={14} color="$gray9" />
                    <Paragraph size="$1" color="$gray10">
                        สัปดาห์ที่แล้ว: {prevWeekCount} ครั้ง
                    </Paragraph>
                </XStack>
            </YStack>
        </Card>
    );
}
