import { Bell, Check, Moon, Palette, Phone, Sun, User } from '@tamagui/lucide-icons';
import React, { useEffect, useState } from 'react';
import { Alert, TextInput, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, H1, H2, H3, Paragraph, ScrollView, Switch, Text, useTheme, XStack, YStack } from 'tamagui';
import { useThemeContext } from '../../context/ThemeContext';
import {
  formatTime,
  loadNotificationSettings,
  scheduleDailyNotification,
  scheduleDemoNotification,
  toggleNotifications
} from '../../services/NotificationService';
import { DATA_KEYS, storage, USER_KEYS } from '../../utils/storage';

const AVATARS = [
  { id: '1', icon: '👦', name: 'เด็กชาย', color: '#FF6B9D' },
  { id: '2', icon: '👧', name: 'เด็กหญิง', color: '#FFA7A7' },
  { id: '3', icon: '👴', name: 'คุณปู่', color: '#9B59B6' },
  { id: '4', icon: '👵', name: 'คุณย่า', color: '#E8DAEF' },
  { id: '5', icon: '🐱', name: 'แมว', color: '#F39C12' },
  { id: '6', icon: '🐶', name: 'สุนัข', color: '#3498DB' },
  { id: '7', icon: '🦊', name: 'จิ้งจอก', color: '#E74C3C' },
  { id: '8', icon: '🐼', name: 'แพนด้า', color: '#2C3E50' },
];

export default function SettingsScreen() {
  const [selectedAvatar, setSelectedAvatar] = useState<string>('👦');
  const [userName, setUserName] = useState<string>('ผู้ใช้งาน');
  const [emergencyContact, setEmergencyContact] = useState<string>('');
  const [isEditing, setIsEditing] = useState<boolean>(false);

  // Notification state
  const [notificationEnabled, setNotificationEnabled] = useState<boolean>(false);
  const [notificationHour, setNotificationHour] = useState<number>(9);
  const [notificationMinute, setNotificationMinute] = useState<number>(0);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);

  const handleDemoModeToggle = async (value: boolean) => {
    setIsDemoMode(value);
    if (value) {
      // Enable Demo Mode: Schedule every 5 mins
      await scheduleDemoNotification();
      Alert.alert('⚡ เปิดโหมดสาธิต', 'ระบบจะแจ้งเตือนทุกๆ 5 นาที เพื่อทดสอบการทำงาน');
    } else {
      // Disable Demo Mode: Revert to daily schedule
      if (notificationEnabled) {
        await scheduleDailyNotification(notificationHour, notificationMinute);
        Alert.alert('✅ ปิดโหมดสาธิต', `กลับสู่การแจ้งเตือนปกติเวลา ${formatTime(notificationHour, notificationMinute)}`);
      }
    }
  };

  const { isDark, toggleTheme } = useThemeContext();
  const theme = useTheme();
  const { width, height } = useWindowDimensions();
  const isSmallScreen = height < 700;
  const avatarButtonSize = Math.floor((width - 48) / 4) - 8;

  useEffect(() => {
    loadSettings();
    loadNotificationState();
  }, []);

  const loadNotificationState = async () => {
    const settings = await loadNotificationSettings();
    setNotificationEnabled(settings.enabled);
    setNotificationHour(settings.hour);
    setNotificationMinute(settings.minute);
  };

  const handleNotificationToggle = async (value: boolean) => {
    const success = await toggleNotifications(value, notificationHour, notificationMinute);
    if (success) {
      setNotificationEnabled(value);
      Alert.alert(
        value ? '🔔 เปิดแจ้งเตือน' : '🔕 ปิดแจ้งเตือน',
        value ? `จะแจ้งเตือนทุกวันเวลา ${formatTime(notificationHour, notificationMinute)}` : 'ปิดการแจ้งเตือนแล้ว'
      );
    } else {
      Alert.alert('❌ ไม่สามารถตั้งค่าได้', 'กรุณาอนุญาตการแจ้งเตือนในตั้งค่าเครื่อง');
    }
  };

  const adjustTime = (type: 'hour' | 'minute', delta: number) => {
    if (type === 'hour') {
      const newHour = Math.max(0, Math.min(23, notificationHour + delta));
      setNotificationHour(newHour);
    } else {
      const newMinute = Math.max(0, Math.min(59, notificationMinute + delta));
      setNotificationMinute(newMinute);
    }
  };

  const saveNotificationTime = async () => {
    if (notificationEnabled) {
      await scheduleDailyNotification(notificationHour, notificationMinute);
    }
    Alert.alert('✅ บันทึกเวลา', `แจ้งเตือนเวลา ${formatTime(notificationHour, notificationMinute)}`);
  };

  const loadSettings = async () => {
    try {
      const avatar = await storage.get<string>(USER_KEYS.AVATAR);
      const name = await storage.get<string>(USER_KEYS.NAME);
      const contact = await storage.get<string>(USER_KEYS.EMERGENCY_CONTACT);

      if (avatar) setSelectedAvatar(avatar);
      if (name) setUserName(name);
      if (contact) setEmergencyContact(contact);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveAvatar = async (icon: string) => {
    try {
      await storage.save(USER_KEYS.AVATAR, icon);
      setSelectedAvatar(icon);
      Alert.alert('✅ สำเร็จ', 'เปลี่ยนตัวแทนเรียบร้อย');
    } catch (error) {
      Alert.alert('❌ ผิดพลาด', 'ไม่สามารถบันทึกได้');
    }
  };

  const saveName = async () => {
    try {
      await storage.save(USER_KEYS.NAME, userName);
      setIsEditing(false);
      Alert.alert('✅ สำเร็จ', 'บันทึกชื่อเรียบร้อย');
    } catch (error) {
      Alert.alert('❌ ผิดพลาด', 'ไม่สามารถบันทึกได้');
    }
  };

  const saveEmergencyContact = async () => {
    try {
      await storage.save(USER_KEYS.EMERGENCY_CONTACT, emergencyContact);
      Alert.alert('✅ สำเร็จ', 'บันทึกเบอร์ฉุกเฉินเรียบร้อย');
    } catch (error) {
      Alert.alert('❌ ผิดพลาด', 'ไม่สามารถบันทึกได้');
    }
  };

  const resetSettings = async () => {
    Alert.alert('⚠️ รีเซ็ตการตั้งค่า', 'ข้อมูลทั้งหมดจะถูกลบ', [
      { text: 'ยกเลิก', style: 'cancel' },
      {
        text: 'รีเซ็ต',
        style: 'destructive',
        onPress: async () => {
          await storage.multiRemove([
            USER_KEYS.AVATAR,
            USER_KEYS.NAME,
            USER_KEYS.EMERGENCY_CONTACT,
            USER_KEYS.DARK_MODE,
            DATA_KEYS.HISTORY_LOG,
            DATA_KEYS.LAST_LOCATION
          ]);
          setSelectedAvatar('👦');
          setUserName('ผู้ใช้งาน');
          setEmergencyContact('');
          if (isDark) toggleTheme(); // Reset to light mode
          Alert.alert('✅ สำเร็จ', 'รีเซ็ตเรียบร้อย');
        },
      },
    ]);
  };

  const selectedAvatarObj = AVATARS.find(a => a.icon === selectedAvatar);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#1a1a1a' : '#fff' }} edges={['top']}>
      <ScrollView flex={1} backgroundColor="$background" showsVerticalScrollIndicator={false}>
        <YStack padding="$3" gap="$3">
          {/* Header */}
          <YStack>
            <H1 fontSize={isSmallScreen ? "$6" : "$8"} fontWeight="800" color="$color">⚙️ ตั้งค่า</H1>
            <Paragraph size="$2" color="$gray10">ปรับแต่งแอปตามที่คุณต้องการ</Paragraph>
          </YStack>

          {/* Profile Card */}
          <Card
            elevation="$1"
            borderWidth={1}
            borderColor="$borderColor"
            padding="$3"
            backgroundColor="$background"
            borderLeftWidth={4}
            borderLeftColor={selectedAvatarObj?.color as any || '$blue9'}
          >
            <XStack alignItems="center" gap="$3">
              <YStack
                width={isSmallScreen ? 60 : 70}
                height={isSmallScreen ? 60 : 70}
                borderRadius={35}
                backgroundColor={selectedAvatarObj?.color as any || '$blue4'}
                justifyContent="center"
                alignItems="center"
              >
                <Text fontSize={isSmallScreen ? 28 : 36}>{selectedAvatar}</Text>
              </YStack>
              <YStack flex={1}>
                <XStack alignItems="center" gap="$1">
                  <User size={14} color="$gray9" />
                  <Paragraph size="$1" color="$gray9">ชื่อของคุณ</Paragraph>
                </XStack>
                {isEditing ? (
                  <XStack gap="$2" alignItems="center">
                    <TextInput
                      value={userName}
                      onChangeText={setUserName}
                      style={{
                        flex: 1,
                        fontSize: 16,
                        fontWeight: 'bold',
                        borderBottomWidth: 2,
                        borderBottomColor: '#00ACC1',
                        paddingVertical: 2,
                        color: isDark ? '#fff' : '#000',
                      }}
                      autoFocus
                      placeholderTextColor={isDark ? '#888' : '#999'}
                    />
                    <Button size="$2" backgroundColor="$blue9" onPress={saveName}>
                      <Check size={14} color="white" />
                    </Button>
                  </XStack>
                ) : (
                  <Button chromeless onPress={() => setIsEditing(true)} paddingHorizontal={0} height="auto">
                    <H2 color="$color" fontSize={isSmallScreen ? "$5" : "$6"}>{userName}</H2>
                  </Button>
                )}
              </YStack>
            </XStack>
          </Card>

          {/* Avatar Selection */}
          <Card elevation="$1" borderWidth={1} borderColor="$borderColor" padding="$3" backgroundColor="$background">
            <XStack alignItems="center" gap="$2" marginBottom="$2">
              <Palette size={18} color="$blue9" />
              <H3 color="$color" fontSize={isSmallScreen ? "$4" : "$5"}>เลือกตัวแทน</H3>
            </XStack>

            <XStack flexWrap="wrap" gap="$2" justifyContent="space-between">
              {AVATARS.map((item) => {
                const isSelected = selectedAvatar === item.icon;
                return (
                  <Button
                    key={item.id}
                    width={avatarButtonSize}
                    height={avatarButtonSize}
                    borderWidth={isSelected ? 3 : 1}
                    borderColor={isSelected ? (item.color as any) : '$gray6'}
                    borderRadius="$3"
                    backgroundColor={isSelected ? (item.color as any) : '$gray2'}
                    onPress={() => saveAvatar(item.icon)}
                    pressStyle={{ scale: 0.95 }}
                    padding="$1"
                  >
                    <YStack alignItems="center" gap="$0">
                      <Text fontSize={avatarButtonSize * 0.4}>{item.icon}</Text>
                      <Paragraph size="$1" color={isSelected ? 'white' : '$gray10'} numberOfLines={1}>
                        {item.name}
                      </Paragraph>
                    </YStack>
                  </Button>
                );
              })}
            </XStack>
          </Card>

          {/* Emergency Contact */}
          <Card elevation="$1" borderWidth={1} borderColor="$borderColor" padding="$3" backgroundColor="$background">
            <XStack alignItems="center" gap="$2" marginBottom="$2">
              <Phone size={18} color="$red9" />
              <H3 color="$color" fontSize={isSmallScreen ? "$4" : "$5"}>เบอร์ติดต่อฉุกเฉิน</H3>
            </XStack>

            <Paragraph size="$1" color="$gray9" marginBottom="$2">
              ใช้ในกรณีไม่เช็คอินติดต่อกัน
            </Paragraph>

            <XStack gap="$2" alignItems="center">
              <TextInput
                value={emergencyContact}
                onChangeText={setEmergencyContact}
                placeholder="081-234-5678"
                keyboardType="phone-pad"
                placeholderTextColor={isDark ? '#666' : '#999'}
                style={{
                  flex: 1,
                  fontSize: 14,
                  borderWidth: 1,
                  borderColor: isDark ? '#444' : '#ddd',
                  borderRadius: 8,
                  paddingHorizontal: 10,
                  paddingVertical: 8,
                  backgroundColor: isDark ? '#2a2a2a' : '#f9f9f9',
                  color: isDark ? '#fff' : '#000',
                }}
              />
              <Button size="$3" backgroundColor="$red9" onPress={saveEmergencyContact}>
                <Text color="white" fontWeight="600" fontSize="$2">บันทึก</Text>
              </Button>
            </XStack>
          </Card>

          {/* Theme Toggle */}
          <Card elevation="$1" borderWidth={1} borderColor="$borderColor" padding="$3" backgroundColor="$background">
            <XStack justifyContent="space-between" alignItems="center">
              <XStack alignItems="center" gap="$2">
                {isDark ? <Moon size={20} color="$purple9" /> : <Sun size={20} color="$yellow9" />}
                <YStack>
                  <H3 color="$color" fontSize={isSmallScreen ? "$4" : "$5"}>โหมดมืด</H3>
                  <Paragraph size="$1" color="$gray9">
                    {isDark ? 'เปิดอยู่' : 'ปิดอยู่'}
                  </Paragraph>
                </YStack>
              </XStack>
              <Switch
                size="$3"
                checked={isDark}
                onCheckedChange={toggleTheme}
                backgroundColor={isDark ? '$purple9' : '$gray5'}
              >
                <Switch.Thumb />
              </Switch>
            </XStack>
          </Card>

          {/* Notification Settings */}
          <Card elevation="$1" borderWidth={1} borderColor="$borderColor" padding="$3" backgroundColor="$background">
            <XStack alignItems="center" gap="$2" marginBottom="$2">
              <Bell size={18} color="$blue9" />
              <H3 color="$color" fontSize={isSmallScreen ? "$4" : "$5"}>แจ้งเตือนประจำวัน</H3>
            </XStack>

            <Paragraph size="$1" color="$gray9" marginBottom="$2">
              รับการแจ้งเตือนเพื่อเช็คอินทุกวัน
            </Paragraph>

            <XStack justifyContent="space-between" alignItems="center" marginBottom="$2">
              <Paragraph size="$2" color="$color">เปิดการแจ้งเตือน</Paragraph>
              <Switch
                size="$3"
                checked={notificationEnabled}
                onCheckedChange={handleNotificationToggle}
                backgroundColor={notificationEnabled ? '$blue9' : '$gray5'}
              >
                <Switch.Thumb />
              </Switch>
            </XStack>

            {notificationEnabled && (
              <YStack gap="$2">
                <XStack justifyContent="space-between" alignItems="center">
                  <Paragraph size="$2" color="$color">เวลาแจ้งเตือน</Paragraph>
                  <XStack gap="$2" alignItems="center">
                    <Button
                      size="$2"
                      chromeless
                      onPress={() => adjustTime('hour', -1)}
                      disabled={notificationHour <= 0}
                    >
                      <Text color="$blue9" fontSize="$4">−</Text>
                    </Button>
                    <Text fontWeight="700" fontSize="$4" color="$color" minWidth={60} textAlign="center">
                      {formatTime(notificationHour, notificationMinute)}
                    </Text>
                    <Button
                      size="$2"
                      chromeless
                      onPress={() => adjustTime('hour', 1)}
                      disabled={notificationHour >= 23}
                    >
                      <Text color="$blue9" fontSize="$4">+</Text>
                    </Button>
                  </XStack>
                </XStack>

                <Button
                  size="$3"
                  backgroundColor="$blue9"
                  onPress={saveNotificationTime}
                >
                  <Text color="white" fontWeight="600">💾 บันทึกเวลาแจ้งเตือน</Text>
                </Button>

                {/* Demo Mode Toggle */}
                <XStack alignItems="center" gap="$2" marginTop="$2" padding="$2" backgroundColor="$yellow2" borderRadius="$2">
                  <Switch
                    size="$2"
                    checked={isDemoMode}
                    onCheckedChange={handleDemoModeToggle}
                    backgroundColor={isDemoMode ? '$orange9' : '$gray5'}
                  >
                    <Switch.Thumb />
                  </Switch>
                  <YStack>
                    <Text fontSize="$2" fontWeight="700" color="$orange10">โหมดสาธิต (Demo)</Text>
                    <Paragraph size="$1" color="$orange10">แจ้งเตือนทุก 5 นาที (สำหรับทดสอบ)</Paragraph>
                  </YStack>
                </XStack>
              </YStack>
            )}</Card>

          {/* Reset Button */}
          <Button
            size="$4"
            backgroundColor="$red4"
            borderColor="$red9"
            borderWidth={1}
            onPress={resetSettings}
            pressStyle={{ backgroundColor: '$red5' }}
          >
            <Text fontWeight="700" fontSize="$3" color="$red9">🔄 รีเซ็ตการตั้งค่าทั้งหมด</Text>
          </Button>

          {/* App Info */}
          <YStack alignItems="center" paddingVertical="$3" gap="$1">
            <Text fontSize={30}>💚</Text>
            <H3 color="$gray10" fontSize="$4">U-Dee v1.0.0</H3>
            <Paragraph size="$1" color="$gray9" textAlign="center">
              แอปเช็คอินเพื่อคนที่คุณรัก
            </Paragraph>
          </YStack>
        </YStack>
      </ScrollView>
    </SafeAreaView>
  );
}