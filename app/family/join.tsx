import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';
import { Button, H2, Input, Label, Spinner, Text, YStack } from 'tamagui';
import { useAuth } from '../../context/AuthContext';
import { useThemeContext } from '../../context/ThemeContext';

import { FamilyService } from '../../services/FamilyService';

export default function JoinFamilyScreen() {
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const { session } = useAuth();
    const { isDark } = useThemeContext();

    async function joinFamily() {
        if (code.length < 6) {
            Alert.alert('รหัสเชิญไม่ถูกต้อง', 'กรุณากรอกรหัส 6 หลักขึ้นไป');
            return;
        }
        setLoading(true);

        try {
            const success = await FamilyService.joinFamily(code);

            if (success) {
                Alert.alert('สำเร็จ', 'เข้าร่วมครอบครัวเรียบร้อยแล้ว!');
                router.replace('/(tabs)/family');
            } else {
                throw new Error('ไม่สามารถเข้าร่วมได้ หรือคุณอาจเป็นสมาชิกอยู่แล้ว');
            }

        } catch (error: any) {
            Alert.alert('เกิดข้อผิดพลาด', error.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <YStack flex={1} justifyContent="center" padding="$4" backgroundColor={isDark ? '$background' : '$background'}>
            <YStack gap="$4" maxWidth={400} width="100%" alignSelf="center">
                <H2 alignSelf="center" marginBottom="$4">เข้าร่วมครอบครัว</H2>

                <Text textAlign="center" color="$gray10" marginBottom="$4">
                    กรอกรหัสเชิญ 6 หลักที่ได้รับจากหัวหน้าครอบครัว
                </Text>

                <YStack gap="$4">
                    <YStack gap="$2">
                        <Label htmlFor="code">รหัสเชิญ</Label>
                        <Input
                            id="code"
                            value={code}
                            onChangeText={setCode}
                            placeholder="รหัส 8 หลัก"
                            maxLength={8}
                            textAlign="center"
                            fontSize="$6"
                            letterSpacing={2}
                            autoCapitalize="none"
                        />
                    </YStack>

                    <Button
                        theme="active"
                        disabled={loading}
                        onPress={joinFamily}
                        marginTop="$2"
                    >
                        {loading ? <Spinner /> : 'เข้าร่วม'}
                    </Button>
                </YStack>
            </YStack>
        </YStack>
    );
}
