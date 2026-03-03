import { Bell, Camera, Check, LogOut, Moon, Phone, Sun } from '@tamagui/lucide-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import { Switch, TextInput, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar, Button, Card, H2, H3, Paragraph, Text, useTheme, XStack, YStack } from 'tamagui';
import { AlertModal } from '../../components/AlertModal';
import { TimeSelectorModal } from '../../components/TimeSelectorModal';
import { useAuth } from '../../context/AuthContext';
import { useThemeContext } from '../../context/ThemeContext';
import {
  formatTime,
  loadNotificationSettings,
  saveNotificationSettings,
  scheduleDailyNotification,
  toggleNotifications
} from '../../services/NotificationService';
import { UserService } from '../../services/UserService';
import { NOTIFICATION_KEYS, storage, USER_KEYS } from '../../utils/storage';

export default function SettingsScreen() {
  const [selectedAvatar, setSelectedAvatar] = useState<string>('👦');
  const [userName, setUserName] = useState<string>('ผู้ใช้งาน');
  const [emergencyContact, setEmergencyContact] = useState<string>('');
  const [isEditing, setIsEditing] = useState<boolean>(false);

  // Notification state
  const [notificationEnabled, setNotificationEnabled] = useState<boolean>(false);
  const [notificationHour, setNotificationHour] = useState<number>(9);
  const [notificationMinute, setNotificationMinute] = useState<number>(0);


  // Alert Modal State
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'info' as 'success' | 'error' | 'warning' | 'info',
    onConfirm: () => { },
    singleAction: true,
    confirmText: 'ตกลง',
    cancelText: 'ยกเลิก'
  });

  // Time Selector State
  const [timeSelector, setTimeSelector] = useState<{
    visible: boolean;
    type: 'hour' | 'minute';
    title: string;
    data: number[];
  }>({
    visible: false,
    type: 'hour',
    title: '',
    data: []
  });

  const openTimeSelector = (type: 'hour' | 'minute') => {
    setTimeSelector({
      visible: true,
      type,
      title: type === 'hour' ? 'เลือกชั่วโมง' : 'เลือกนาที',
      data: type === 'hour' ? Array.from({ length: 24 }, (_, i) => i) : Array.from({ length: 60 }, (_, i) => i)
    });
  };

  const handleTimeSelect = (value: number) => {
    if (timeSelector.type === 'hour') {
      setNotificationHour(value);
    } else {
      setNotificationMinute(value);
    }
    setTimeSelector(prev => ({ ...prev, visible: false }));
  };

  const showAlert = (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info', singleAction = true, onConfirm = () => { }) => {
    setAlertConfig({
      visible: true,
      title,
      message,
      type,
      singleAction,
      onConfirm: () => {
        onConfirm();
        setAlertConfig(prev => ({ ...prev, visible: false }));
      },
      confirmText: 'ตกลง',
      cancelText: 'ยกเลิก'
    });
  };



  const { isDark, toggleTheme } = useThemeContext();
  const { signOut, user } = useAuth();
  const theme = useTheme();
  const { width, height } = useWindowDimensions();
  const isSmallScreen = height < 700;
  const avatarButtonSize = Math.floor((width - 48) / 4) - 8;

  useEffect(() => {
    if (user) {
      loadSettings(user.id);
    }
    loadNotificationState();
  }, [user]);

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
      showAlert(
        value ? '🔔 เปิดแจ้งเตือน' : '🔕 ปิดแจ้งเตือน',
        value ? `จะแจ้งเตือนทุกวันเวลา ${formatTime(notificationHour, notificationMinute)}` : 'ปิดการแจ้งเตือนแล้ว',
        value ? 'success' : 'info'
      );
    } else {
      showAlert('❌ ไม่สามารถตั้งค่าได้', 'กรุณาอนุญาตการแจ้งเตือนในตั้งค่าเครื่อง', 'error');
    }
  };

  const adjustTime = (type: 'hour' | 'minute', delta: number) => {
    if (type === 'hour') {
      const newHour = (notificationHour + delta + 24) % 24;
      setNotificationHour(newHour);
    } else {
      const newMinute = (notificationMinute + delta + 60) % 60;
      setNotificationMinute(newMinute);
    }
  };

  const saveNotificationTime = async () => {
    if (notificationEnabled) {
      await scheduleDailyNotification(notificationHour, notificationMinute);
    }
    // Save settings to storage
    await saveNotificationSettings({
      enabled: notificationEnabled,
      hour: notificationHour,
      minute: notificationMinute
    });
    showAlert('✅ บันทึกเวลา', `แจ้งเตือนเวลา ${formatTime(notificationHour, notificationMinute)}`, 'success');
  };

  const loadSettings = async (userId: string) => {
    try {
      const profile = await UserService.getProfile(userId);
      if (profile) {
        setSelectedAvatar(profile.avatar_url || 'https://i.pravatar.cc/300');
        setUserName(profile.username);
        setEmergencyContact(profile.emergency_contact || '');
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const pickImage = async () => {
    if (!user) return;

    // Request permissions
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showAlert('❌ ต้องการสิทธิ์', 'กรุณาอนุญาตให้เข้าถึงคลังภาพเพื่อเปลี่ยนรูปโปรไฟล์', 'warning');
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        // @ts-ignore: Deprecated but types not updated yet
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.3, // Compressed for storage efficiency
      });

      if (!result.canceled) {
        // Upload to Supabase
        showAlert('⏳ กำลังอัปโหลด', 'กรุณารอสักครู่...', 'info', false);

        const publicUrl = await UserService.uploadAvatar(user.id, result.assets[0].uri);

        setAlertConfig(prev => ({ ...prev, visible: false })); // Close loading alert

        if (publicUrl) {
          setSelectedAvatar(publicUrl);
          showAlert('✅ สำเร็จ', 'เปลี่ยนรูปโปรไฟล์เรียบร้อย', 'success');
        } else {
          throw new Error('Upload failed');
        }
      }
    } catch (error) {
      console.error('Pick image error:', error);
      showAlert('❌ ผิดพลาด', 'ไม่สามารถอัปโหลดรูปภาพได้', 'error');
    }
  };

  const saveName = async () => {
    if (!user) return;
    try {
      const success = await UserService.updateProfile(user.id, { username: userName });
      if (success) {
        setIsEditing(false);
        showAlert('✅ สำเร็จ', 'บันทึกชื่อเรียบร้อย', 'success');
      } else {
        throw new Error('Update failed');
      }
    } catch (error) {
      showAlert('❌ ผิดพลาด', 'ไม่สามารถบันทึกได้', 'error');
    }
  };

  const saveEmergencyContact = async () => {
    if (!user) return;
    try {
      const success = await UserService.updateProfile(user.id, { emergency_contact: emergencyContact });
      if (success) {
        showAlert('✅ สำเร็จ', 'บันทึกเบอร์ฉุกเฉินเรียบร้อย', 'success');
      } else {
        throw new Error('Update failed');
      }
    } catch (error) {
      showAlert('❌ ผิดพลาด', 'ไม่สามารถบันทึกได้', 'error');
    }
  };

  const resetSettings = async () => {
    setAlertConfig({
      visible: true,
      title: '⚠️ รีเซ็ตการตั้งค่า',
      message: 'ข้อมูลทั้งหมดจะถูกลบรวมถึงประวัติและข้อมูลส่วนตัว คุณแน่ใจหรือไม่?',
      type: 'error',
      singleAction: false,
      confirmText: 'รีเซ็ต',
      cancelText: 'ยกเลิก',
      onConfirm: async () => {
        await storage.multiRemove([
          USER_KEYS.DARK_MODE,
          NOTIFICATION_KEYS.ENABLED,
          NOTIFICATION_KEYS.TIME,
          NOTIFICATION_KEYS.ID
        ]);
        if (isDark) toggleTheme(); // Reset to light mode
        setAlertConfig({
          visible: true,
          title: '✅ สำเร็จ',
          message: 'รีเซ็ตเรียบร้อยแล้ว',
          type: 'success',
          singleAction: true,
          confirmText: 'ตกลง',
          cancelText: 'ยกเลิก',
          onConfirm: () => setAlertConfig(prev => ({ ...prev, visible: false }))
        });
      },
    });
  };

  const handleLogout = async () => {
    setAlertConfig({
      visible: true,
      title: '🚫 ออกจากระบบ',
      message: 'คุณต้องการออกจากระบบหรือไม่?',
      type: 'warning',
      singleAction: false,
      confirmText: 'ออกจากระบบ',
      cancelText: 'ยกเลิก',
      onConfirm: async () => {
        setAlertConfig(prev => ({ ...prev, visible: false }));
        await signOut();
      },
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#1a1a1a' : '#fff' }} edges={['top']}>
      <YStack flex={1} backgroundColor="$background" padding="$3" justifyContent="space-between">

        {/* Top Content */}
        <YStack gap="$3">
          {/* Header & Theme Toggle */}
          <XStack justifyContent="space-between" alignItems="center">
            <XStack alignItems="center" gap="$2">
              <H2 fontSize={isSmallScreen ? "$5" : "$6"} fontWeight="800" color="$color">⚙️ ตั้งค่า</H2>
            </XStack>
            <XStack alignItems="center" gap="$2" backgroundColor="$gray2" paddingHorizontal="$2" paddingVertical="$1" borderRadius="$4">
              {isDark ? <Moon size={16} color="$purple9" /> : <Sun size={16} color="$yellow9" />}
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: '#767577', true: '#2196F3' }}
                thumbColor="#ffffff"
                style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
              />
            </XStack>
          </XStack>

          {/* Profile Card (Compact) */}
          <Card
            borderWidth={1}
            borderColor="$borderColor"
            padding="$3"
            backgroundColor="$background"
            elevation="$1"
          >
            <XStack alignItems="center" gap="$3">
              <YStack position="relative">
                <Avatar circular size="$6">
                  <Avatar.Image src={selectedAvatar} />
                  <Avatar.Fallback backgroundColor="$blue4" alignItems="center" justifyContent="center">
                    <Text fontSize="$3">👤</Text>
                  </Avatar.Fallback>
                </Avatar>
                <Button position="absolute" bottom={-4} right={-4} size="$2" circular backgroundColor="$blue9" onPress={pickImage}>
                  <Camera size={12} color="white" />
                </Button>
              </YStack>

              <YStack flex={1} gap="$1">
                <Paragraph size="$1" color="$gray9">ชื่อแสดงผล</Paragraph>
                {isEditing ? (
                  <XStack gap="$2" alignItems="center">
                    <TextInput
                      value={userName}
                      onChangeText={setUserName}
                      style={{
                        flex: 1, fontSize: 16, borderBottomWidth: 1, borderBottomColor: '#2196F3',
                        color: isDark ? '#fff' : '#000', paddingVertical: 2
                      }}
                      autoFocus
                    />
                    <Button size="$2" circular backgroundColor="$green9" onPress={saveName} icon={<Check size={12} color="white" />} />
                  </XStack>
                ) : (
                  <XStack alignItems="center" gap="$2" onPress={() => setIsEditing(true)}>
                    <H3 fontSize="$5" color="$color">{userName}</H3>
                    <Text fontSize="$3" color="$blue9">✎</Text>
                  </XStack>
                )}
              </YStack>
            </XStack>
          </Card>

          {/* Settings Group */}
          <YStack gap="$2">
            {/* Emergency Contact (Compact) */}
            <Card
              borderWidth={1}
              borderColor="$borderColor"
              padding="$3"
              backgroundColor="$background"
            >
              <YStack gap="$2">
                <XStack alignItems="center" gap="$2">
                  <Phone size={16} color="$red9" />
                  <Text fontWeight="600" color="$color">เบอร์ฉุกเฉิน</Text>
                </XStack>
                <XStack gap="$2">
                  <TextInput
                    value={emergencyContact}
                    onChangeText={setEmergencyContact}
                    placeholder="08X-XXX-XXXX"
                    keyboardType="phone-pad"
                    placeholderTextColor={isDark ? '#666' : '#999'}
                    style={{
                      flex: 1, fontSize: 14, borderWidth: 1, borderColor: isDark ? '#444' : '#ddd',
                      borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6,
                      backgroundColor: isDark ? '#2a2a2a' : '#f9f9f9', color: isDark ? '#fff' : '#000'
                    }}
                  />
                  <Button size="$3" backgroundColor="$red9" onPress={saveEmergencyContact}>
                    <Text color="white" fontSize="$2">บันทึก</Text>
                  </Button>
                </XStack>
              </YStack>
            </Card>

            {/* Notification (Compact) */}
            <Card
              borderWidth={1}
              borderColor="$borderColor"
              padding="$3"
              backgroundColor="$background"
            >
              <XStack justifyContent="space-between" alignItems="center">
                <XStack alignItems="center" gap="$2">
                  <Bell size={16} color="$blue9" />
                  <YStack>
                    <Text fontWeight="600" color="$color">แจ้งเตือนประจำวัน</Text>
                    {notificationEnabled && (
                      <Text fontSize="$2" color="$gray9">
                        เวลา {notificationHour.toString().padStart(2, '0')}:{notificationMinute.toString().padStart(2, '0')} น.
                      </Text>
                    )}
                  </YStack>
                </XStack>
                <Switch
                  value={notificationEnabled}
                  onValueChange={handleNotificationToggle}
                  trackColor={{ false: '#767577', true: '#2196F3' }}
                  thumbColor="#ffffff"
                  style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                />
              </XStack>

              {notificationEnabled && (
                <XStack justifyContent="flex-end" marginTop="$2" gap="$2" alignItems="center">
                  <Button size="$2" chromeless onPress={() => openTimeSelector('hour')} borderWidth={1} borderColor="$borderColor">
                    <Text fontWeight="700">{notificationHour.toString().padStart(2, '0')}</Text>
                  </Button>
                  <Text>:</Text>
                  <Button size="$2" chromeless onPress={() => openTimeSelector('minute')} borderWidth={1} borderColor="$borderColor">
                    <Text fontWeight="700">{notificationMinute.toString().padStart(2, '0')}</Text>
                  </Button>
                  <Button size="$2" backgroundColor="$blue9" onPress={saveNotificationTime}>
                    <Text color="white">บันทึก</Text>
                  </Button>
                </XStack>
              )}
            </Card>
          </YStack>
        </YStack>

        {/* Footer Actions */}
        <YStack gap="$2" marginBottom="$2">
          <XStack gap="$3">
            <Button flex={1} size="$3" backgroundColor="$gray3" onPress={resetSettings}>
              <Text color="$gray11">รีเซ็ตข้อมูล</Text>
            </Button>
            <Button flex={1} size="$3" backgroundColor="$red2" borderColor="$red5" borderWidth={1} onPress={handleLogout}>
              <XStack gap="$2" alignItems="center" justifyContent="center">
                <LogOut size={16} color="$red9" />
                <Text color="$red9" fontWeight="600">ออกจากระบบ</Text>
              </XStack>
            </Button>
          </XStack>
          <XStack justifyContent="center" alignItems="center" gap="$1" opacity={0.6}>
            <Text fontSize="$1">U-Dee v1.0.0 💚</Text>
          </XStack>
        </YStack>

      </YStack>

      <AlertModal
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onConfirm={alertConfig.onConfirm}
        onCancel={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
        confirmText={alertConfig.confirmText}
        cancelText={alertConfig.cancelText}
        singleAction={alertConfig.singleAction}
      />

      <TimeSelectorModal
        visible={timeSelector.visible}
        title={timeSelector.title}
        data={timeSelector.data}
        selectedValue={timeSelector.type === 'hour' ? notificationHour : notificationMinute}
        onSelect={handleTimeSelect}
        onClose={() => setTimeSelector(prev => ({ ...prev, visible: false }))}
      />
    </SafeAreaView>
  );
}