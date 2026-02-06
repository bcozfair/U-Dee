import React from 'react';
import { Paragraph, Text, XStack, YStack } from 'tamagui';
import { useThemeContext } from '../context/ThemeContext';

interface CalendarHeatmapProps {
    checkInDates: string[]; // Array of date strings (e.g., "2026-02-05")
}

const DAYS_OF_WEEK = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];// Helper to get last 5 weeks of dates
const getLast5WeeksDates = () => {
    const dates: Date[][] = [];
    const today = new Date();

    // Find the start of this week (Sunday)
    const dayOfWeek = today.getDay();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - dayOfWeek);

    // Go back 4 more weeks
    const startDate = new Date(startOfWeek);
    startDate.setDate(startOfWeek.getDate() - 28);

    for (let week = 0; week < 5; week++) {
        const weekDates: Date[] = [];
        for (let day = 0; day < 7; day++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + (week * 7) + day);
            weekDates.push(date);
        }
        dates.push(weekDates);
    }

    return dates;
};

// Format date to YYYY-MM-DD
const formatDateKey = (date: Date): string => {
    return date.toISOString().split('T')[0];
};

// Format date to display
const formatDateDisplay = (date: Date): string => {
    return `${date.getDate()}`;
};

export default function CalendarHeatmap({ checkInDates }: CalendarHeatmapProps) {
    const { isDark } = useThemeContext();
    const weeks = getLast5WeeksDates();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const checkInSet = new Set(checkInDates);

    const getCellColor = (date: Date, isCheckedIn: boolean): string => {
        const dateTime = date.getTime();
        const todayTime = today.getTime();

        if (dateTime > todayTime) {
            // Future date
            return isDark ? '#2a2a2a' : '#f0f0f0';
        }

        if (isCheckedIn) {
            return '#22c55e'; // Green for checked in
        }

        if (dateTime === todayTime) {
            // Today but not checked in
            return isDark ? '#374151' : '#e5e5e5';
        }

        // Past date, not checked in
        return isDark ? '#1f1f1f' : '#fafafa';
    };

    const isToday = (date: Date): boolean => {
        return date.getTime() === today.getTime();
    };

    return (
        <YStack gap="$2">
            {/* Day labels */}
            <XStack gap="$1" paddingLeft="$1">
                {DAYS_OF_WEEK.map((day, i) => (
                    <YStack key={i} width={32} alignItems="center">
                        <Paragraph size="$1" color="$gray9">{day}</Paragraph>
                    </YStack>
                ))}
            </XStack>

            {/* Calendar grid */}
            {weeks.map((week, weekIndex) => (
                <XStack key={weekIndex} gap="$1" paddingLeft="$1">
                    {week.map((date, dayIndex) => {
                        const dateKey = formatDateKey(date);
                        const isCheckedIn = checkInSet.has(dateKey);
                        const cellColor = getCellColor(date, isCheckedIn);
                        const isTodayCell = isToday(date);

                        return (
                            <YStack
                                key={dayIndex}
                                width={32}
                                height={32}
                                borderRadius="$2"
                                backgroundColor={cellColor as any}
                                alignItems="center"
                                justifyContent="center"
                                borderWidth={isTodayCell ? 2 : 0}
                                borderColor="$blue9"
                            >
                                <Text
                                    fontSize={10}
                                    color={isCheckedIn ? 'white' : (isDark ? '$gray8' : '$gray10')}
                                    fontWeight={isTodayCell ? 'bold' : 'normal'}
                                >
                                    {formatDateDisplay(date)}
                                </Text>
                            </YStack>
                        );
                    })}
                </XStack>
            ))}

            {/* Legend */}
            <XStack justifyContent="center" gap="$3" marginTop="$2">
                <XStack alignItems="center" gap="$1">
                    <YStack width={12} height={12} borderRadius="$1" backgroundColor="#22c55e" />
                    <Paragraph size="$1" color="$gray9">เช็คอินแล้ว</Paragraph>
                </XStack>
                <XStack alignItems="center" gap="$1">
                    <YStack width={12} height={12} borderRadius="$1" backgroundColor={(isDark ? '#1f1f1f' : '#fafafa') as any} borderWidth={1} borderColor="$gray6" />
                    <Paragraph size="$1" color="$gray9">ยังไม่เช็คอิน</Paragraph>
                </XStack>
            </XStack>
        </YStack>
    );
}
