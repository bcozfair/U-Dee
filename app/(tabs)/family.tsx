import { MapPin, Users } from '@tamagui/lucide-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Linking, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar, Button, Card, H1, H3, Paragraph, ScrollView, Spinner, XStack, YStack } from 'tamagui';
import { AlertModal } from '../../components/AlertModal';
import { useAuth } from '../../context/AuthContext';
import { useThemeContext } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';

import { FamilyMember, FamilyService } from '../../services/FamilyService';

export default function FamilyScreen() {
    const { showToast } = useToast();
    const [members, setMembers] = useState<FamilyMember[]>([]);
    const [hasFamily, setHasFamily] = useState<boolean | null>(null); // null = loading
    const [familyName, setFamilyName] = useState<string>('');
    const [inviteCode, setInviteCode] = useState<string>('');
    const { isDark } = useThemeContext();
    const { height } = useWindowDimensions();
    const isSmallScreen = height < 700;
    const { session } = useAuth();
    const [loading, setLoading] = useState(true);

    // Alert Modal Configuration
    const [alertConfig, setAlertConfig] = useState<{
        visible: boolean;
        title: string;
        message: string;
        type?: 'success' | 'error' | 'warning' | 'info' | 'custom';
        onConfirm?: () => void;
        onCancel?: () => void;
        confirmText?: string;
        cancelText?: string;
        singleAction?: boolean;
        confirmIcon?: any;
        cancelIcon?: any;
        customIcon?: React.ReactNode;
        customIconColor?: { bg: string; border: string };
        additionalContent?: React.ReactNode;
        confirmButtonColor?: string;
        cancelButtonColor?: string;
    }>({
        visible: false,
        title: '',
        message: '',
        type: 'info',
        onConfirm: () => { },
        onCancel: () => { },
    });

    const closeAlert = () => {
        setAlertConfig(prev => ({ ...prev, visible: false }));
    };

    useFocusEffect(
        useCallback(() => {
            if (session?.user) {
                loadFamilyData();
            }
        }, [session])
    );

    const loadFamilyData = async () => {
        setLoading(true);
        try {
            // 1. Get my families
            const families = await FamilyService.getMyFamilies();

            if (!families || families.length === 0) {
                setHasFamily(false);
                setLoading(false);
                return;
            }

            // For now, take the first family
            const currentFamily = families[0];
            setHasFamily(true);
            setFamilyName(currentFamily.name);
            setInviteCode(currentFamily.invite_code);

            // 2. Get members
            const allMembers = await FamilyService.getFamilyMembers();
            // Filter for this family
            const familyMembers = allMembers.filter(m => m.family_id === currentFamily.id);
            setMembers(familyMembers);

        } catch (error: any) {
            console.error('Error loading family:', error);
            showToast('เกิดข้อผิดพลาดในการโหลดข้อมูลครอบครัว', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleCall = (phoneNumber: string) => {
        // In real app, phone number should be in profile. 
        // For now, if no phone number, alert/toast
        if (phoneNumber) {
            Linking.openURL(`tel:${phoneNumber}`);
        } else {
            showToast('ไม่พบเบอร์โทรศัพท์', 'error');
        }
    };

    // --- Modal Logic (Simplified for now) ---
    const openNudgeModal = (member: FamilyMember) => {
        // Implement real Nudge logic via Edge Function or Realtime later
        showToast(`สะกิด ${member.name} แล้ว!`, 'success');
    };

    if (loading) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#1a1a1a' : '#fff' }}>
                <YStack flex={1} justifyContent="center" alignItems="center">
                    <Spinner size="large" color="$blue10" />
                </YStack>
            </SafeAreaView>
        );
    }

    if (hasFamily === false) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#1a1a1a' : '#fff' }}>
                <YStack flex={1} padding="$4" justifyContent="center" alignItems="center" gap="$4">
                    <YStack alignItems="center" marginBottom="$4">
                        <Users size={64} color="$blue10" />
                        <H3 textAlign="center" marginTop="$4">คุณยังไม่มีกลุ่มครอบครัว</H3>
                        <Paragraph textAlign="center" color="$gray10">
                            สร้างกลุ่มใหม่หรือเข้าร่วมกลุ่มที่มีอยู่เพื่อเริ่มใช้งาน
                        </Paragraph>
                    </YStack>

                    <Button
                        theme="active"
                        size="$5"
                        width="100%"
                        onPress={() => router.push('/family/create')}
                    >
                        สร้างครอบครัวใหม่
                    </Button>

                    <Button
                        variant="outlined"
                        size="$5"
                        width="100%"
                        onPress={() => router.push('/family/join')}
                    >
                        เข้าร่วมครอบครัว
                    </Button>
                </YStack>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#1a1a1a' : '#fff' }} edges={['top']}>
            <YStack flex={1} backgroundColor="$background" padding="$3">
                {/* Header */}
                <YStack marginBottom="$4">
                    <H1 fontSize={isSmallScreen ? "$6" : "$8"} fontWeight="800" color="$color">👨‍👩‍👧‍👦 {familyName}</H1>
                    <XStack justifyContent="space-between" alignItems="center">
                        <Paragraph size="$1" color="$gray10">สมาชิก {members.length} คน</Paragraph>
                        <Paragraph size="$1" color="$blue10">รหัสเชิญ: {inviteCode}</Paragraph>
                    </XStack>
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
                                    pathname: '/(tabs)/map',
                                    params: { memberId: member.id }
                                })}
                            >
                                <XStack alignItems="center" gap="$3">
                                    {/* Avatar */}
                                    <Avatar circular size="$4">
                                        <Avatar.Image src={member.avatar || 'https://i.pravatar.cc/300'} />
                                        <Avatar.Fallback backgroundColor="$gray5" />
                                    </Avatar>

                                    {/* Info */}
                                    <YStack flex={1} gap="$1">
                                        <XStack justifyContent="space-between" alignItems="center">
                                            <H3 fontSize="$4" color="$color">{member.name}</H3>
                                        </XStack>

                                        <XStack alignItems="center" gap="$2">
                                            <Paragraph size="$2" color={member.status === 'Safe' ? '$green10' : '$orange10'} numberOfLines={1}>
                                                {member.status || 'Active'}
                                            </Paragraph>
                                        </XStack>
                                    </YStack>

                                    {/* Action Icons */}
                                    <XStack gap="$2" alignItems="center">
                                        {/* Map Button */}
                                        <Button
                                            size="$3"
                                            circular
                                            chromeless
                                            backgroundColor="$blue2"
                                            onPress={() => router.push({
                                                pathname: '/(tabs)/map',
                                                params: { memberId: member.id }
                                            })}
                                        >
                                            <MapPin size={18} color="$blue9" />
                                        </Button>
                                    </XStack>
                                </XStack>
                            </Card>
                        ))}
                    </YStack>
                </ScrollView>

                {/* Unified Alert Modal */}
                <AlertModal
                    visible={alertConfig.visible}
                    title={alertConfig.title}
                    message={alertConfig.message}
                    type={alertConfig.type}
                    onConfirm={alertConfig.onConfirm}
                    onCancel={alertConfig.onCancel}
                    confirmText={alertConfig.confirmText}
                    cancelText={alertConfig.cancelText}
                    singleAction={alertConfig.singleAction}
                    confirmIcon={alertConfig.confirmIcon}
                    cancelIcon={alertConfig.cancelIcon}
                    customIcon={alertConfig.customIcon}
                    customIconColor={alertConfig.customIconColor}
                    additionalContent={alertConfig.additionalContent}
                    confirmButtonColor={alertConfig.confirmButtonColor}
                    cancelButtonColor={alertConfig.cancelButtonColor}
                />
            </YStack>
        </SafeAreaView>
    );
}
