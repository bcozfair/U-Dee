import { Battery, Hand, MapPin, Phone } from '@tamagui/lucide-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, Linking, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, H1, H3, Paragraph, ScrollView, Text, XStack, YStack } from 'tamagui';
import { useThemeContext } from '../../context/ThemeContext';
import { FamilyMember, getFamilyMembers, nudgeFamilyMember } from '../../services/MockFamilyService';

export default function FamilyScreen() {
    const [members, setMembers] = useState<FamilyMember[]>([]);
    const { isDark } = useThemeContext();
    const { height } = useWindowDimensions();
    const isSmallScreen = height < 700;

    useFocusEffect(
        useCallback(() => {
            loadMembers();
        }, [])
    );

    const handleCall = (phoneNumber: string) => {
        Linking.openURL(`tel:${phoneNumber}`);
    };

    const handleNudge = async (memberId: string) => {
        Alert.alert(
            "👋 ส่งการสะกิด",
            "ต้องการส่งสัญญาณสะกิดไปหาคนนี้หรือไม่?",
            [
                { text: "ยกเลิก", style: "cancel" },
                {
                    text: "สะกิดเลย",
                    onPress: async () => {
                        const result = await nudgeFamilyMember(memberId);
                        if (result.success && result.data) {
                            Alert.alert("✅ สำเร็จ", "เขาตอบกลับมาแล้ว! สถานะอัปเดตเป็น 'เมื่อสักครู่'");
                            setMembers(prev => prev.map(m => m.id === memberId ? { ...m, ...result.data } : m));
                        } else {
                            Alert.alert("⚠️ ไม่มีการตอบรับ", "เขาไม่ตอบกลับการสะกิด กรุณาโทรติดต่อทันที", [
                                { text: "ตกลง" },
                                { text: "โทรเลย", onPress: () => handleCall(members.find(m => m.id === memberId)?.phoneNumber || "") }
                            ]);
                        }
                    }
                }
            ]
        );
    };

    const loadMembers = async () => {
        const data = await getFamilyMembers();
        setMembers(data);
    };

    const getBatteryColor = (level: number) => {
        if (level > 50) return '$green9';
        if (level > 20) return '$yellow9';
        return '$red9';
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#1a1a1a' : '#fff' }} edges={['top']}>
            <YStack flex={1} backgroundColor="$background" padding="$3">
                {/* Header */}
                <YStack marginBottom="$4">
                    <H1 fontSize={isSmallScreen ? "$6" : "$8"} fontWeight="800" color="$color">👨‍👩‍👧‍👦 ครอบครัว</H1>
                    <Paragraph size="$1" color="$gray10">คนที่คุณรักและห่วงใย</Paragraph>
                </YStack>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
                    <YStack gap="$3">
                        {members.map((member) => (
                            <Card
                                key={member.id}
                                elevation="$1"
                                borderWidth={1}
                                borderColor="$borderColor"
                                padding="$3"
                                backgroundColor="$background"
                                pressStyle={{ scale: 0.98 }}
                                onPress={() => router.push({
                                    pathname: '/map',
                                    params: { memberId: member.id }
                                })}
                            >
                                <XStack alignItems="center" gap="$3">
                                    {/* Avatar & Online Status */}
                                    <YStack>
                                        <YStack
                                            width={50}
                                            height={50}
                                            borderRadius={25}
                                            backgroundColor="$gray3"
                                            alignItems="center"
                                            justifyContent="center"
                                            overflow="hidden"
                                        >
                                            <Text fontSize={30}>{member.avatar}</Text>
                                        </YStack>
                                        {member.isOnline && (
                                            <YStack
                                                position="absolute"
                                                bottom={0}
                                                right={0}
                                                width={14}
                                                height={14}
                                                borderRadius={7}
                                                backgroundColor="$green9"
                                                borderWidth={2}
                                                borderColor="$background"
                                            />
                                        )}
                                    </YStack>

                                    {/* Info */}
                                    <YStack flex={1} gap="$1">
                                        <XStack justifyContent="space-between" alignItems="center">
                                            <H3 fontSize="$4" color="$color">{member.name}</H3>
                                            <Paragraph
                                                size="$1"
                                                color={member.lastCheckIn.includes('วัน') ? '$red10' : '$gray9'}
                                                fontWeight={member.lastCheckIn.includes('วัน') ? '700' : '400'}
                                            >
                                                {member.lastCheckIn}
                                            </Paragraph>
                                        </XStack>

                                        <XStack alignItems="center" gap="$2">
                                            {member.lastCheckIn.includes('วัน') && <Text fontSize={16}>⚠️</Text>}
                                            <Paragraph size="$2" color={member.status === 'สะกิดหน่อย' ? '$orange10' : '$gray10'} numberOfLines={1}>
                                                {member.status}
                                            </Paragraph>
                                        </XStack>

                                        <XStack alignItems="center" gap="$2" marginTop="$1">
                                            <XStack alignItems="center" gap="$1" backgroundColor="$gray2" paddingHorizontal="$2" paddingVertical={2} borderRadius="$2">
                                                <Text fontSize={10} color="$gray10">{member.relationship}</Text>
                                            </XStack>

                                            {member.batteryLevel !== undefined && (
                                                <XStack alignItems="center" gap="$1">
                                                    <Battery size={12} color={getBatteryColor(member.batteryLevel)} />
                                                    <Text fontSize={10} color={getBatteryColor(member.batteryLevel)}>{member.batteryLevel}%</Text>
                                                </XStack>
                                            )}

                                            <XStack alignItems="center" gap="$1" marginLeft="$2">
                                                <Phone size={10} color="$gray9" />
                                                <Text fontSize={10} color="$gray9">{member.phoneNumber}</Text>
                                            </XStack>
                                        </XStack>
                                    </YStack>

                                    {/* Action Icons */}
                                    <XStack gap="$2" alignItems="center">
                                        {/* Nudge Button */}
                                        {member.lastCheckIn.includes('วัน') && (
                                            <Button
                                                size="$3"
                                                circular
                                                chromeless
                                                backgroundColor="$orange2"
                                                onPress={() => handleNudge(member.id)}
                                            >
                                                <Hand size={18} color="$orange9" />
                                            </Button>
                                        )}

                                        {/* Call Button (Only if missing/late) */}
                                        {member.lastCheckIn.includes('วัน') && (
                                            <Button
                                                size="$3"
                                                circular
                                                chromeless
                                                backgroundColor="$red2"
                                                onPress={() => handleCall(member.phoneNumber)}
                                            >
                                                <Phone size={18} color="$red9" />
                                            </Button>
                                        )}

                                        <Button
                                            size="$3"
                                            circular
                                            chromeless
                                            backgroundColor="$blue2"
                                            onPress={() => router.push({
                                                pathname: '/map',
                                                params: { memberId: member.id }
                                            })}
                                        >
                                            <MapPin size={18} color="$blue9" />
                                        </Button>
                                    </XStack>
                                </XStack>
                            </Card>
                        ))}

                        {/* Invite Button */}
                        <Button
                            size="$4"
                            variant="outlined"
                            borderColor="$blue9"
                            marginTop="$2"
                            onPress={() => alert('ฟีเจอร์นี้ยังไม่เปิดใช้งาน')}
                            borderStyle="dashed"
                        >
                            <Text color="$blue9">+ เพิ่มสมาชิกครอบครัว</Text>
                        </Button>
                    </YStack>
                </ScrollView>
            </YStack>
        </SafeAreaView>
    );
}
