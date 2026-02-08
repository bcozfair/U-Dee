import { Eye, EyeOff, Heart } from '@tamagui/lucide-icons';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';
import { Button, H1, Input, Paragraph, Spinner, Text, XStack, YStack } from 'tamagui';
import { useThemeContext } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const router = useRouter();
    const { isDark } = useThemeContext();

    async function signInWithEmail() {
        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            Alert.alert('เข้าสู่ระบบไม่สำเร็จ', error.message);
            setLoading(false);
        } else {
            setLoading(false);
        }
    }

    return (
        <YStack
            flex={1}
            backgroundColor={isDark ? '#0f172a' : '#fef7f0'}
        >
            {/* Top Decorative Section */}
            <YStack
                paddingTop="$8"
                paddingBottom="$6"
                paddingHorizontal="$4"
                alignItems="center"
            >
                {/* Logo/Icon */}
                <YStack
                    width={80}
                    height={80}
                    borderRadius={40}
                    backgroundColor={isDark ? '$pink9' : '$pink5'}
                    alignItems="center"
                    justifyContent="center"
                    marginBottom="$4"
                    shadowColor="$pink8"
                    shadowOffset={{ width: 0, height: 4 }}
                    shadowOpacity={0.3}
                    shadowRadius={8}
                >
                    <Heart size={40} color="white" fill="white" />
                </YStack>

                {/* App Name */}
                <H1
                    fontSize="$9"
                    fontWeight="800"
                    color={isDark ? '$pink4' : '$pink9'}
                    marginBottom="$1"
                >
                    U-Dee
                </H1>
                <Text
                    fontSize="$4"
                    color={isDark ? '$gray11' : '$gray10'}
                    fontWeight="500"
                >
                    อยู่ดี
                </Text>

                {/* Tagline */}
                <Paragraph
                    textAlign="center"
                    color={isDark ? '$gray10' : '$gray11'}
                    marginTop="$3"
                    fontSize="$3"
                    fontStyle="italic"
                >
                    "แค่รู้ว่าอยู่...ก็ดีต่อใจ"
                </Paragraph>
            </YStack>

            {/* Form Section */}
            <YStack
                flex={1}
                backgroundColor={isDark ? '$background' : 'white'}
                borderTopLeftRadius={32}
                borderTopRightRadius={32}
                paddingHorizontal="$5"
                paddingTop="$6"
                shadowColor="black"
                shadowOffset={{ width: 0, height: -2 }}
                shadowOpacity={0.05}
                shadowRadius={10}
            >
                <Text
                    fontSize="$6"
                    fontWeight="700"
                    color="$color"
                    marginBottom="$1"
                >
                    ยินดีต้อนรับกลับ 👋
                </Text>
                <Paragraph color="$gray10" marginBottom="$5">
                    เข้าสู่ระบบเพื่อดูแลคนที่คุณรัก
                </Paragraph>

                <YStack gap="$4">
                    {/* Email Input */}
                    <YStack gap="$2">
                        <Text fontSize="$2" fontWeight="600" color="$gray11">อีเมล</Text>
                        <Input
                            value={email}
                            onChangeText={setEmail}
                            placeholder="your@email.com"
                            autoCapitalize="none"
                            keyboardType="email-address"
                            size="$5"
                            borderRadius="$4"
                            backgroundColor={isDark ? '$gray3' : '$gray2'}
                            borderWidth={0}
                            placeholderTextColor="$gray9"
                        />
                    </YStack>

                    {/* Password Input */}
                    <YStack gap="$2">
                        <Text fontSize="$2" fontWeight="600" color="$gray11">รหัสผ่าน</Text>
                        <XStack alignItems="center">
                            <Input
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                                placeholder="••••••••"
                                autoCapitalize="none"
                                flex={1}
                                size="$5"
                                borderRadius="$4"
                                backgroundColor={isDark ? '$gray3' : '$gray2'}
                                borderWidth={0}
                                placeholderTextColor="$gray9"
                            />
                            <Button
                                icon={showPassword ? Eye : EyeOff}
                                position="absolute"
                                right="$3"
                                chromeless
                                size="$3"
                                onPress={() => setShowPassword(!showPassword)}
                            />
                        </XStack>
                    </YStack>

                    {/* Login Button */}
                    <Button
                        backgroundColor="$pink9"
                        disabled={loading}
                        onPress={signInWithEmail}
                        marginTop="$2"
                        size="$5"
                        borderRadius="$4"
                        pressStyle={{ backgroundColor: '$pink10' }}
                    >
                        {loading ? <Spinner color="white" /> : <Text color="white" fontWeight="600">เข้าสู่ระบบ</Text>}
                    </Button>
                </YStack>

                {/* Register Link */}
                <XStack justifyContent="center" gap="$2" marginTop="$6">
                    <Text color="$gray10">ยังไม่มีบัญชี?</Text>
                    <Link href="/auth/register" asChild>
                        <Text color="$pink9" fontWeight="bold">ลงทะเบียน</Text>
                    </Link>
                </XStack>

                {/* Footer */}
                <Paragraph
                    textAlign="center"
                    color="$gray9"
                    fontSize="$1"
                    marginTop="auto"
                    marginBottom="$4"
                >
                    แอปส่งสัญญาณความห่วงใยสำหรับคนที่คุณรัก
                </Paragraph>
            </YStack>
        </YStack>
    );
}
