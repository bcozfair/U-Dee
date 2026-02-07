import React from 'react';
import { Circle, Paragraph, Text, XStack, YStack } from 'tamagui';
import { useThemeContext } from '../context/ThemeContext';

interface CalendarHeatmapProps {
    checkInDates: string[]; // Array of date strings (e.g., "2026-02-05")
}

const DAYS_OF_WEEK = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

// Helper to get dates for a standard monthly view (last 4 weeks)
const getCalendarWeeks = () => {
    const dates: Date[][] = [];
    const today = new Date();

    // Find the start of the current week (Sunday)
    const dayOfWeek = today.getDay(); // 0-6
    const startOfCurrentWeek = new Date(today);
    startOfCurrentWeek.setDate(today.getDate() - dayOfWeek);
    startOfCurrentWeek.setHours(0, 0, 0, 0);

    // Start from 3 weeks before the current week to show total 4 weeks
    const startDate = new Date(startOfCurrentWeek);
    startDate.setDate(startOfCurrentWeek.getDate() - 21);

    for (let week = 0; week < 4; week++) {
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

const formatDateDisplay = (date: Date): string => {
    return `${date.getDate()}`;
};

export default function CalendarHeatmap({ checkInDates }: CalendarHeatmapProps) {
    const { isDark } = useThemeContext();
    const weeks = getCalendarWeeks();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const checkInSet = new Set(checkInDates);

    const getCellStatus = (date: Date, isCheckedIn: boolean) => {
        const dateTime = date.getTime();
        const todayTime = today.getTime();

        if (dateTime > todayTime) return 'future';
        if (isCheckedIn) return 'checked-in';
        if (dateTime === todayTime) return 'today-missed';
        return 'missed';
    };

    const isToday = (date: Date): boolean => {
        return date.getTime() === today.getTime();
    };

    return (
        <YStack gap="$4" paddingHorizontal="$2" paddingVertical="$2">

            {/* Header / Stats */}
            <XStack justifyContent="space-between" alignItems="center">
                <Text fontSize="$4" fontWeight="700" color="$color">
                    30 วันล่าสุด
                </Text>
                <XStack gap="$3">
                    <XStack alignItems="center" gap="$1.5">
                        <Circle size={8} backgroundColor="$green9" />
                        <Paragraph size="$1" color="$gray9">เช็คอิน</Paragraph>
                    </XStack>
                    <XStack alignItems="center" gap="$1.5">
                        <Circle size={8} borderWidth={1} borderColor="$gray6" />
                        <Paragraph size="$1" color="$gray9">ขาด</Paragraph>
                    </XStack>
                </XStack>
            </XStack>

            <YStack gap="$2">
                {/* Header Row (Days) */}
                <XStack justifyContent="space-between" paddingHorizontal="$1">
                    {DAYS_OF_WEEK.map((day, i) => (
                        <YStack key={i} width={36} alignItems="center">
                            <Paragraph size="$1" color="$gray9" fontWeight="600">{day}</Paragraph>
                        </YStack>
                    ))}
                </XStack>

                {/* Weeks Rows */}
                {weeks.map((week, weekIndex) => (
                    <XStack key={weekIndex} justifyContent="space-between">
                        {week.map((date, dayIndex) => {
                            const dateKey = formatDateKey(date);
                            const isCheckedIn = checkInSet.has(dateKey);
                            const status = getCellStatus(date, isCheckedIn);
                            const isTodayCell = isToday(date);

                            let bg = 'transparent';
                            let textColor = '$color';
                            let borderWidth = 0;
                            let borderColor = 'transparent';

                            if (status === 'checked-in') {
                                bg = '$green9';
                                textColor = 'white';
                            } else if (status === 'today-missed') {
                                bg = '$orange3';
                                textColor = '$orange10';
                                borderWidth = 1;
                                borderColor = '$orange9';
                            } else if (status === 'missed') {
                                bg = isDark ? '$gray3' : '$gray2';
                                textColor = '$gray9';
                            } else if (status === 'future') {
                                textColor = '$gray6';
                            }

                            return (
                                <YStack
                                    key={dayIndex}
                                    width={36}
                                    height={36}
                                    borderRadius={18} // Fully round
                                    backgroundColor={bg as any}
                                    alignItems="center"
                                    justifyContent="center"
                                    borderWidth={borderWidth}
                                    borderColor={borderColor as any}
                                    opacity={status === 'future' ? 0.5 : 1}
                                >
                                    <Text
                                        fontSize="$2"
                                        color={textColor as any}
                                        fontWeight={isTodayCell || status === 'checked-in' ? '700' : '400'}
                                    >
                                        {formatDateDisplay(date)}
                                    </Text>

                                    {/* Indicator dot for today if not checked in */}
                                    {status === 'today-missed' && (
                                        <Circle size={4} backgroundColor="$orange9" position="absolute" bottom={4} />
                                    )}
                                </YStack>
                            );
                        })}
                    </XStack>
                ))}
            </YStack>
        </YStack>
    );
}
