import { Phone, X } from '@tamagui/lucide-icons';
import React from 'react';
import { Modal } from 'react-native';
import { Button, Card, H3, Paragraph, XStack, YStack } from 'tamagui';
import { FamilyMember } from '../services/MockFamilyService';

interface NudgeConfirmationModalProps {
    visible: boolean;
    onClose: () => void;
    onConfirm: () => void;
    onCall: () => void;
    member: FamilyMember | null;
}

export const NudgeConfirmationModal = ({ visible, onClose, onConfirm, onCall, member }: NudgeConfirmationModalProps) => {
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

                    {/* Avatar Bubble */}
                    <YStack
                        width={100}
                        height={100}
                        borderRadius={50}
                        backgroundColor="$blue2"
                        alignItems="center"
                        justifyContent="center"
                        borderWidth={4}
                        borderColor="$blue5"
                        marginTop="$2"
                    >
                        <Paragraph fontSize={50}>{member.avatar}</Paragraph>
                    </YStack>

                    <YStack alignItems="center" gap="$1">
                        <H3 color="$color">{member.name}</H3>
                        <Paragraph color="$gray10" size="$3">
                            หายไป {member.lastCheckIn} แล้ว...
                        </Paragraph>
                    </YStack>

                    <Paragraph textAlign="center" color="$gray11" size="$2">
                        ส่ง "การสะกิด" เพื่อเรียกให้เขาเช็คอิน หรือจะโทรหาเลยก็ได้นะ
                    </Paragraph>

                    <YStack width="100%" gap="$3" marginTop="$2">
                        <Button
                            size="$5"
                            backgroundColor="$orange9"
                            pressStyle={{ backgroundColor: "$orange10" }}
                            onPress={onConfirm}
                        >
                            <Paragraph color="white" fontWeight="700">👋 สะกิดเลย</Paragraph>
                        </Button>

                        <Button
                            size="$4"
                            variant="outlined"
                            borderColor="$red9"
                            icon={<Phone size={16} color="$red9" />}
                            onPress={onCall}
                        >
                            <Paragraph color="$red9">โทรหาทันที</Paragraph>
                        </Button>
                    </YStack>
                </Card>
            </YStack>
        </Modal>
    );
};
