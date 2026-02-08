import { AlertTriangle, CheckCircle, Info, X, XCircle } from '@tamagui/lucide-icons';
import React from 'react';
import { Modal } from 'react-native';
import { Button, Card, H3, Paragraph, XStack, YStack } from 'tamagui';

interface AlertModalProps {
    visible: boolean;
    title: string;
    message: string;
    type?: 'success' | 'error' | 'warning' | 'info' | 'custom';
    onConfirm?: () => void;
    onCancel?: () => void;
    confirmText?: string;
    cancelText?: string;
    singleAction?: boolean; // If true, only show confirm button
    confirmIcon?: any;
    cancelIcon?: any;
    customIcon?: React.ReactNode;
    customIconColor?: { bg: string; border: string };
    additionalContent?: React.ReactNode;
    confirmButtonColor?: string;
    cancelButtonColor?: string;
}

export const AlertModal = ({
    visible,
    title,
    message,
    type = 'info',
    onConfirm,
    onCancel,
    confirmText = 'ตกลง',
    cancelText = 'ยกเลิก',
    singleAction = false,
    confirmIcon,
    cancelIcon,
    customIcon,
    customIconColor,
    additionalContent,
    confirmButtonColor,
    cancelButtonColor
}: AlertModalProps) => {

    const getIcon = () => {
        if (customIcon) return customIcon;
        switch (type) {
            case 'success': return <CheckCircle size={50} color="$green9" />;
            case 'error': return <XCircle size={50} color="$red9" />;
            case 'warning': return <AlertTriangle size={50} color="$orange9" />;
            default: return <Info size={50} color="$blue9" />;
        }
    };

    const getColors = () => {
        if (customIconColor) return { bg: customIconColor.bg, border: customIconColor.border, btn: confirmButtonColor || '$blue9', btnPress: '$blue10' };

        switch (type) {
            case 'success': return { bg: '$green2', border: '$green5', btn: '$green9', btnPress: '$green10' };
            case 'error': return { bg: '$red2', border: '$red5', btn: '$red9', btnPress: '$red10' };
            case 'warning': return { bg: '$orange2', border: '$orange5', btn: '$orange9', btnPress: '$orange10' };
            default: return { bg: '$blue2', border: '$blue5', btn: '$blue9', btnPress: '$blue10' };
        }
    };

    const colors = getColors();
    const finalConfirmColor = confirmButtonColor || colors.btn;

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onCancel || onConfirm}
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
                    {/* Close X (Only if cancelable) */}
                    {!singleAction && onCancel && (
                        <XStack width="100%" justifyContent="flex-end" position="absolute" top="$3" right="$3" zIndex={1}>
                            <Button size="$2" circular chromeless onPress={onCancel}>
                                <X size={20} color="$gray10" />
                            </Button>
                        </XStack>
                    )}

                    {/* Icon Bubble */}
                    <YStack
                        width={100}
                        height={100}
                        borderRadius={50}
                        backgroundColor={colors.bg as any}
                        alignItems="center"
                        justifyContent="center"
                        borderWidth={4}
                        borderColor={colors.border as any}
                        marginTop="$2"
                    >
                        {getIcon()}
                    </YStack>

                    <YStack alignItems="center" gap="$1" paddingHorizontal="$2">
                        <H3 color="$color" textAlign="center">{title}</H3>
                        <Paragraph color="$gray10" size="$3" textAlign="center">
                            {message}
                        </Paragraph>
                    </YStack>

                    {additionalContent}

                    <YStack width="100%" gap="$3" marginTop="$2">
                        <Button
                            size="$5"
                            backgroundColor={finalConfirmColor as any}
                            pressStyle={{ opacity: 0.9 }}
                            onPress={onConfirm}
                            icon={confirmIcon}
                        >
                            <Paragraph color="white" fontWeight="700">{confirmText}</Paragraph>
                        </Button>

                        {!singleAction && onCancel && cancelText ? (
                            <Button
                                size="$4"
                                variant="outlined"
                                borderColor={(cancelButtonColor || "$gray5") as any}
                                onPress={onCancel}
                                icon={cancelIcon}
                            >
                                <Paragraph color={cancelButtonColor ? cancelButtonColor as any : "$gray10"}>{cancelText}</Paragraph>
                            </Button>
                        ) : null}
                    </YStack>
                </Card>
            </YStack>
        </Modal>
    );
};
