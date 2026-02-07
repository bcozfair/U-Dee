import { AlertTriangle, CheckCircle, Info, XCircle } from '@tamagui/lucide-icons';
import React from 'react';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card, Paragraph, XStack } from 'tamagui';
import { useToast } from '../context/ToastContext';

export const CustomToast = () => {
    const { visible, message, type } = useToast();
    const insets = useSafeAreaInsets();

    if (!visible) return null;

    const getIcon = () => {
        switch (type) {
            case 'success': return <CheckCircle size={20} color="$green10" />;
            case 'error': return <XCircle size={20} color="$red10" />;
            case 'warning': return <AlertTriangle size={20} color="$yellow10" />;
            default: return <Info size={20} color="$blue10" />;
        }
    };

    const getBgColor = () => {
        switch (type) {
            case 'success': return '$green3';
            case 'error': return '$red3';
            case 'warning': return '$yellow3';
            default: return '$blue3';
        }
    };

    const getBorderColor = () => {
        switch (type) {
            case 'success': return '$green6';
            case 'error': return '$red6';
            case 'warning': return '$yellow6';
            default: return '$blue6';
        }
    };

    return (
        <Animated.View
            entering={FadeInUp.springify()}
            exiting={FadeOutUp}
            style={{
                position: 'absolute',
                top: insets.top + 10,
                left: 20,
                right: 20,
                zIndex: 9999,
                alignItems: 'center',
            }}
        >
            <Card
                elevation="$4"
                backgroundColor={getBgColor()}
                borderColor={getBorderColor()}
                paddingHorizontal="$4"
                paddingVertical="$3"
                borderRadius="$10"
                shadowColor="$shadowColor"
                shadowRadius={10}
                shadowOpacity={0.1}
            >
                <XStack alignItems="center" gap="$3">
                    {getIcon()}
                    <Paragraph fontWeight="600" color="$color" fontSize="$4" flexShrink={1}>
                        {message}
                    </Paragraph>
                </XStack>
            </Card>
        </Animated.View>
    );
};
