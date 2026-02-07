import { AlertTriangle, Phone, X } from '@tamagui/lucide-icons';
import React from 'react';
import { Modal } from 'react-native';
import { Button, Card, H3, Paragraph, XStack, YStack } from 'tamagui';
import { FamilyMember } from '../services/MockFamilyService';

interface NoResponseModalProps {
    visible: boolean;
    onClose: () => void;
    onCall: () => void;
    member: FamilyMember | null;
}

export const NoResponseModal = ({ visible, onClose, onCall, member }: NoResponseModalProps) => {
    if (!member) return null;

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <YStack flex={1} justifyContent="center" alignItems="center" backgroundColor="rgba(0,0,0,0.5)" padding="$4">
                <Card
                    elevation="$5"
                    width="100%"
                    maxWidth={340}
                    backgroundColor="$background"
                    padding="$5"
                    borderRadius="$8"
                    alignItems="center"
                    gap="$4"
                >
                    <XStack width="100%" justifyContent="flex-end" position="absolute" top="$3" right="$3" zIndex={1}>
                        <Button size="$2" circular chromeless onPress={onClose}>
                            <X size={20} color="$gray10" />
                        </Button>
                    </XStack>

                    {/* Alert Icon Bubble */}
                    <YStack
                        width={100}
                        height={100}
                        borderRadius={50}
                        backgroundColor="$red2"
                        alignItems="center"
                        justifyContent="center"
                        borderWidth={4}
                        borderColor="$red5"
                        marginTop="$2"
                    >
                        <AlertTriangle size={50} color="$red9" />
                    </YStack>

                    <YStack alignItems="center" gap="$1">
                        <H3 color="$color">ไม่มีการตอบรับ</H3>
                        <Paragraph color="$gray10" size="$3" textAlign="center">
                            {member.name} ไม่ได้ตอบกลับการสะกิดของคุณ
                        </Paragraph>
                    </YStack>

                    <Paragraph textAlign="center" color="$gray11" size="$2">
                        อาจเกิดเหตุฉุกเฉิน หรือเขาอาจจะไม่ว่าง{"\n"}แนะนำให้โทรติดต่อทันที
                    </Paragraph>

                    <YStack width="100%" gap="$3" marginTop="$2">
                        <Button
                            size="$5"
                            backgroundColor="$red9"
                            pressStyle={{ backgroundColor: "$red10" }}
                            icon={<Phone size={20} color="white" />}
                            onPress={onCall}
                        >
                            <Paragraph color="white" fontWeight="700">โทรหาทันที</Paragraph>
                        </Button>

                        <Button
                            size="$4"
                            variant="outlined"
                            borderColor="$gray5"
                            onPress={onClose}
                        >
                            <Paragraph color="$gray10">ไว้ทีหลัง</Paragraph>
                        </Button>
                    </YStack>
                </Card>
            </YStack>
        </Modal>
    );
};
