import { Camera, Eye, EyeOff, Heart, User as UserIcon } from '@tamagui/lucide-icons';
import { decode } from 'base64-arraybuffer';
import * as ImagePicker from 'expo-image-picker';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable } from 'react-native';
import { Avatar, Button, H1, Input, Paragraph, ScrollView, Spinner, Text, XStack, YStack } from 'tamagui';
import { useThemeContext } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';

export default function RegisterScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [avatarUri, setAvatarUri] = useState<string | null>(null);
    const [imageBase64, setImageBase64] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const router = useRouter();
    const { isDark } = useThemeContext();

    const pickImage = async () => {
        // Request permission first
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (permissionResult.granted === false) {
            Alert.alert('ต้องการสิทธิ์', 'กรุณาอนุญาตให้เข้าถึงรูปภาพ');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
            base64: true,
            exif: false,
        });

        if (!result.canceled && result.assets[0]) {
            setAvatarUri(result.assets[0].uri);
            setImageBase64(result.assets[0].base64 || null);
        }
    };

    async function uploadAvatar(userId: string): Promise<string | null> {
        if (!imageBase64) return null;

        try {
            const fileName = `${userId}/${Date.now()}.jpg`;
            const { data, error } = await supabase.storage
                .from('avatars')
                .upload(fileName, decode(imageBase64), {
                    contentType: 'image/jpeg',
                    upsert: true,
                });

            if (error) {
                console.error('Upload error:', error);
                return null;
            }

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(fileName);

            return publicUrl;
        } catch (e) {
            console.error('Upload exception:', e);
            return null;
        }
    }

    async function signUpWithEmail() {
        if (!displayName.trim()) {
            Alert.alert('กรุณากรอกข้อมูล', 'กรุณากรอกชื่อที่ใช้แสดง');
            return;
        }
        if (password !== confirmPassword) {
            Alert.alert('รหัสผ่านไม่ตรงกัน', 'กรุณาตรวจสอบรหัสผ่านอีกครั้ง');
            return;
        }
        if (password.length < 6) {
            Alert.alert('รหัสผ่านสั้นเกินไป', 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
            return;
        }

        setLoading(true);

        try {
            const {
                data: { session, user },
                error,
            } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: displayName,
                        avatar_url: 'https://i.pravatar.cc/300',
                    },
                },
            });

            if (error) {
                Alert.alert('ลงทะเบียนไม่สำเร็จ', error.message);
                setLoading(false);
                return;
            }

            // user จะมีค่าเสมอหลัง signUp สำเร็จ แม้ยังไม่ confirm email
            if (user) {
                let finalAvatarUrl = 'https://i.pravatar.cc/300';

                // อัปโหลดรูป avatar ถ้ามีการเลือกรูป
                if (imageBase64) {
                    const uploadedUrl = await uploadAvatar(user.id);
                    if (uploadedUrl) {
                        finalAvatarUrl = uploadedUrl;
                    }
                }

                // อัพเดต/สร้าง profile ด้วย full_name และ avatar_url
                const { error: profileError } = await supabase
                    .from('profiles')
                    .upsert({
                        id: user.id,
                        full_name: displayName,
                        avatar_url: finalAvatarUrl,
                    }, {
                        onConflict: 'id'
                    });

                if (profileError) {
                    console.error('Profile update error:', profileError);
                }
            }

            // ถ้าไม่มี session แปลว่าต้องยืนยัน email ก่อน
            if (!session) {
                Alert.alert(
                    'ลงทะเบียนสำเร็จ! ✨',
                    'กรุณาตรวจสอบอีเมลของคุณเพื่อยืนยันบัญชี'
                );
            }
            // ถ้ามี session ระบบจะ navigate ไปหน้าหลักเองผ่าน AuthContext

        } catch (e: any) {
            console.error('Signup error:', e);
            Alert.alert('เกิดข้อผิดพลาด', e.message || 'ลองใหม่อีกครั้ง');
        } finally {
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
                paddingTop="$6"
                paddingBottom="$4"
                paddingHorizontal="$4"
                alignItems="center"
            >
                {/* Logo/Icon */}
                <YStack
                    width={60}
                    height={60}
                    borderRadius={30}
                    backgroundColor={isDark ? '$pink9' : '$pink5'}
                    alignItems="center"
                    justifyContent="center"
                    marginBottom="$2"
                >
                    <Heart size={28} color="white" fill="white" />
                </YStack>

                {/* App Name */}
                <H1
                    fontSize="$7"
                    fontWeight="800"
                    color={isDark ? '$pink4' : '$pink9'}
                >
                    U-Dee
                </H1>
                <Text
                    fontSize="$3"
                    color={isDark ? '$gray11' : '$gray10'}
                    fontWeight="500"
                >
                    อยู่ดี
                </Text>
            </YStack>

            {/* Form Section */}
            <ScrollView
                flex={1}
                backgroundColor={isDark ? '$background' : 'white'}
                borderTopLeftRadius={32}
                borderTopRightRadius={32}
                contentContainerStyle={{
                    paddingHorizontal: 24,
                    paddingTop: 24,
                    paddingBottom: 40
                }}
            >
                <Text
                    fontSize="$5"
                    fontWeight="700"
                    color="$color"
                    marginBottom="$1"
                >
                    สร้างบัญชีใหม่ ✨
                </Text>
                <Paragraph color="$gray10" marginBottom="$4">
                    เริ่มต้นดูแลคนที่คุณรักวันนี้
                </Paragraph>

                {/* Avatar Picker */}
                <YStack alignItems="center" marginBottom="$4">
                    <Pressable onPress={pickImage}>
                        <Avatar circular size="$8" borderWidth={3} borderColor="$pink5">
                            <Avatar.Image src={avatarUri || 'https://i.pravatar.cc/300'} />
                            <Avatar.Fallback backgroundColor="$pink2" alignItems="center" justifyContent="center">
                                <UserIcon size={40} color="$pink9" />
                            </Avatar.Fallback>
                        </Avatar>
                        <YStack
                            position="absolute"
                            bottom={0}
                            right={0}
                            backgroundColor="$pink9"
                            padding="$2"
                            borderRadius="$10"
                            borderWidth={2}
                            borderColor="white"
                        >
                            <Camera size={16} color="white" />
                        </YStack>
                    </Pressable>
                    <Text fontSize="$2" color="$gray10" marginTop="$2">แตะเพื่อเลือกรูปโปรไฟล์</Text>
                </YStack>

                <YStack gap="$3">
                    {/* Display Name */}
                    <YStack gap="$1">
                        <Text fontSize="$2" fontWeight="600" color="$gray11">ชื่อที่ใช้แสดง</Text>
                        <Input
                            value={displayName}
                            onChangeText={setDisplayName}
                            placeholder="เช่น พี่สมชาย, มามี้"
                            autoCapitalize="words"
                            size="$5"
                            borderRadius="$4"
                            backgroundColor={isDark ? '$gray3' : '$gray2'}
                            borderWidth={0}
                        />
                    </YStack>

                    {/* Email */}
                    <YStack gap="$1">
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
                        />
                    </YStack>

                    {/* Password */}
                    <YStack gap="$1">
                        <Text fontSize="$2" fontWeight="600" color="$gray11">รหัสผ่าน</Text>
                        <XStack alignItems="center">
                            <Input
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                                placeholder="อย่างน้อย 6 ตัวอักษร"
                                autoCapitalize="none"
                                flex={1}
                                size="$5"
                                borderRadius="$4"
                                backgroundColor={isDark ? '$gray3' : '$gray2'}
                                borderWidth={0}
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

                    {/* Confirm Password */}
                    <YStack gap="$1">
                        <Text fontSize="$2" fontWeight="600" color="$gray11">ยืนยันรหัสผ่าน</Text>
                        <XStack alignItems="center">
                            <Input
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry={!showConfirmPassword}
                                placeholder="กรอกรหัสผ่านอีกครั้ง"
                                autoCapitalize="none"
                                flex={1}
                                size="$5"
                                borderRadius="$4"
                                backgroundColor={isDark ? '$gray3' : '$gray2'}
                                borderWidth={0}
                            />
                            <Button
                                icon={showConfirmPassword ? Eye : EyeOff}
                                position="absolute"
                                right="$3"
                                chromeless
                                size="$3"
                                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                            />
                        </XStack>
                    </YStack>

                    {/* Register Button */}
                    <Button
                        backgroundColor="$pink9"
                        disabled={loading}
                        onPress={signUpWithEmail}
                        marginTop="$2"
                        size="$5"
                        borderRadius="$4"
                        pressStyle={{ backgroundColor: '$pink10' }}
                    >
                        {loading ? <Spinner color="white" /> : <Text color="white" fontWeight="600">สร้างบัญชี</Text>}
                    </Button>
                </YStack>

                {/* Login Link */}
                <XStack justifyContent="center" gap="$2" marginTop="$5">
                    <Text color="$gray10">มีบัญชีอยู่แล้ว?</Text>
                    <Link href="/auth/login" asChild>
                        <Text color="$pink9" fontWeight="bold">เข้าสู่ระบบ</Text>
                    </Link>
                </XStack>
            </ScrollView>
        </YStack>
    );
}
