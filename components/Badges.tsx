import { Award, Target, Zap } from '@tamagui/lucide-icons';
import React from 'react';
import { Card, H3, Paragraph, Text, XStack, YStack } from 'tamagui';
import { useThemeContext } from '../context/ThemeContext';

interface BadgesProps {
    streak: number;
    totalCheckIns: number;
}

// Badge definitions
const BADGES = [
    { id: 'first', name: 'เริ่มต้นใหม่', emoji: '🌱', requirement: 1, type: 'total', description: 'เช็คอินครั้งแรก' },
    { id: 'week', name: '7 วันแรก', emoji: '⭐', requirement: 7, type: 'streak', description: 'Streak 7 วัน' },
    { id: 'twoweek', name: 'สองสัปดาห์', emoji: '🌟', requirement: 14, type: 'streak', description: 'Streak 14 วัน' },
    { id: 'month', name: 'หนึ่งเดือน', emoji: '🏆', requirement: 30, type: 'streak', description: 'Streak 30 วัน' },
    { id: 'fifty', name: '50 ครั้ง', emoji: '💎', requirement: 50, type: 'total', description: 'เช็คอิน 50 ครั้ง' },
    { id: 'hundred', name: '100 ครั้ง', emoji: '👑', requirement: 100, type: 'total', description: 'เช็คอิน 100 ครั้ง' },
];

// Goal milestones for streak
const STREAK_GOALS = [
    { target: 7, label: '7 วัน' },
    { target: 14, label: '14 วัน' },
    { target: 30, label: '30 วัน' },
    { target: 60, label: '60 วัน' },
    { target: 100, label: '100 วัน' },
];

const getNextGoal = (streak: number) => {
    for (const goal of STREAK_GOALS) {
        if (streak < goal.target) {
            return goal;
        }
    }
    return null;
};

export default function Badges({ streak, totalCheckIns }: BadgesProps) {
    const { isDark } = useThemeContext();

    // Get earned badges
    const earnedBadges = BADGES.filter(badge => {
        if (badge.type === 'streak') {
            return streak >= badge.requirement;
        }
        return totalCheckIns >= badge.requirement;
    });

    // Get next badge to earn
    const nextBadge = BADGES.find(badge => {
        if (badge.type === 'streak') {
            return streak < badge.requirement;
        }
        return totalCheckIns < badge.requirement;
    });

    const nextGoal = getNextGoal(streak);
    const progressToGoal = nextGoal ? Math.round((streak / nextGoal.target) * 100) : 100;

    return (
        <Card elevation="$1" borderWidth={1} borderColor="$borderColor" padding="$3" backgroundColor="$background">
            <XStack alignItems="center" gap="$2" marginBottom="$3">
                <Award size={16} color="$yellow9" />
                <H3 color="$color" fontSize="$4">เป้าหมายและความสำเร็จ</H3>
            </XStack>

            <YStack gap="$3">
                {/* Current Goal Progress */}
                {nextGoal && (
                    <YStack gap="$2">
                        <XStack justifyContent="space-between" alignItems="center">
                            <XStack alignItems="center" gap="$1">
                                <Target size={14} color="$blue9" />
                                <Paragraph size="$2" color="$gray10">เป้าหมายถัดไป</Paragraph>
                            </XStack>
                            <Text fontWeight="700" color="$blue10">{nextGoal.label}</Text>
                        </XStack>

                        <YStack>
                            <XStack
                                height={8}
                                backgroundColor={isDark ? '#333' : '#e0e0e0'}
                                borderRadius="$4"
                                overflow="hidden"
                            >
                                <XStack
                                    width={`${progressToGoal}%`}
                                    backgroundColor="$blue9"
                                    borderRadius="$4"
                                />
                            </XStack>
                            <XStack justifyContent="space-between" marginTop="$1">
                                <Paragraph size="$1" color="$gray9">{streak} วัน</Paragraph>
                                <Paragraph size="$1" color="$gray9">{nextGoal.target} วัน</Paragraph>
                            </XStack>
                        </YStack>
                    </YStack>
                )}

                {/* Badges Grid */}
                <YStack gap="$2">
                    <Paragraph size="$2" color="$gray10">ความสำเร็จที่ได้รับ</Paragraph>

                    {earnedBadges.length === 0 ? (
                        <XStack
                            backgroundColor={isDark ? '#2a2a2a' : '#f5f5f5'}
                            padding="$3"
                            borderRadius="$2"
                            alignItems="center"
                            justifyContent="center"
                        >
                            <Paragraph size="$2" color="$gray9">
                                เช็คอินต่อเนื่องเพื่อรับ badges! 🎯
                            </Paragraph>
                        </XStack>
                    ) : (
                        <XStack flexWrap="wrap" gap="$2">
                            {earnedBadges.map(badge => (
                                <YStack
                                    key={badge.id}
                                    backgroundColor={isDark ? '#2a2a2a' : '#fff8e1'}
                                    borderWidth={1}
                                    borderColor="$yellow6"
                                    padding="$2"
                                    borderRadius="$3"
                                    alignItems="center"
                                    minWidth={70}
                                >
                                    <Text fontSize={24}>{badge.emoji}</Text>
                                    <Paragraph size="$1" color="$color" fontWeight="600" textAlign="center">
                                        {badge.name}
                                    </Paragraph>
                                </YStack>
                            ))}
                        </XStack>
                    )}
                </YStack>

                {/* Next Badge */}
                {nextBadge && (
                    <XStack
                        backgroundColor={isDark ? '#2a2a2a' : '#f0f0f0'}
                        padding="$2"
                        borderRadius="$2"
                        alignItems="center"
                        gap="$2"
                    >
                        <Text fontSize={20} opacity={0.5}>{nextBadge.emoji}</Text>
                        <YStack flex={1}>
                            <Paragraph size="$1" color="$gray10">{nextBadge.name}</Paragraph>
                            <Paragraph size="$1" color="$gray9">{nextBadge.description}</Paragraph>
                        </YStack>
                        <Zap size={14} color="$gray8" />
                    </XStack>
                )}
            </YStack>
        </Card>
    );
}
