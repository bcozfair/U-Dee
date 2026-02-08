import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';
import { Button, H2, Input, Label, Spinner, Text, YStack } from 'tamagui';
import { useAuth } from '../../context/AuthContext';
import { useThemeContext } from '../../context/ThemeContext';

import { FamilyService } from '../../services/FamilyService';

export default function CreateFamilyScreen() {
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const { session } = useAuth();
    const { isDark } = useThemeContext();

    function generateInviteCode() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    async function createFamily() {
        if (!name.trim()) {
            Alert.alert('กรุณากรอกชื่อครอบครัว');
            return;
        }
        setLoading(true);

        try {
            const family = await FamilyService.createFamily(name);

            if (family) {
                Alert.alert('สำเร็จ', `สร้างครอบครัว "${family.name}" เรียบร้อยแล้ว! รหัสเชิญ: ${family.invite_code}`);
                router.replace('/(tabs)/family');
            } else {
                throw new Error('Could not create family');
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
                <H2 alignSelf="center" marginBottom="$4">สร้างครอบครัวใหม่</H2>

                <Text textAlign="center" color="$gray10" marginBottom="$4">
                    สร้างกลุ่มสำหรับครอบครัวของคุณเพื่อแชร์ตำแหน่งและสถานะกัน
                </Text>

                <YStack gap="$4">
                    <YStack gap="$2">
                        <Label htmlFor="name">ชื่อครอบครัว</Label>
                        <Input
                            id="name"
                            value={name}
                            onChangeText={setName}
                            placeholder="เช่น บ้านแสนสุข"
                        />
                    </YStack>

                    <Button
                        theme="active"
                        disabled={loading}
                        onPress={createFamily}
                        marginTop="$2"
                    >
                        {loading ? <Spinner /> : 'สร้างครอบครัว'}
                    </Button>
                </YStack>
            </YStack>
        </YStack>
    );
}
