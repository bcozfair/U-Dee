import { Calendar, MapPin, Trash2 } from '@tamagui/lucide-icons';
import * as Location from 'expo-location';
import React, { useEffect, useState } from 'react';
import { Button, Card, Paragraph, Text, XStack, YStack } from 'tamagui';

// Status Options (duplicated for now, or export from a constant file)
const STATUS_OPTIONS = [
    { label: 'สบายดี 💚', value: 'สบายดี' },
    { label: 'พักผ่อน 🏠', value: 'พักผ่อน' },
    { label: 'ทำงาน 🏢', value: 'ทำงาน' },
    { label: 'เรียน 🏫', value: 'เรียน' },
    { label: 'เดินทาง 🚗', value: 'เดินทาง' },
    { label: 'ท่องเที่ยว ✈️', value: 'ท่องเที่ยว' },
    { label: 'ออกกำลังกาย 💪', value: 'ออกกำลังกาย' },
    { label: 'ทำธุระ 📝', value: 'ทำธุระ' },
    { label: 'ทานอาหาร 🍽️', value: 'ทานอาหาร' },
    { label: 'อื่นๆ ❓', value: 'อื่นๆ' },
];

interface HistoryItemProps {
    item: {
        id: string;
        date: string;
        status: string;
        coords: {
            latitude: number;
            longitude: number;
        };
    };
    index: number;
    onDelete?: (id: string) => void;
    showDelete?: boolean;
}

export const HistoryItemCard = ({ item, index, onDelete, showDelete = false }: HistoryItemProps) => {
    const [address, setAddress] = useState<string | null>(null);

    // Extract time from Thai formatted date string "DD/MM/YYYY HH:mm น."
    // Split by space: ["19/02/2569", "21:22", "น."]
    const timeParts = item.date.split(' ');
    const timeString = timeParts.length >= 2 ? timeParts[1] : '';

    // Get Emoji
    const getEmoji = () => {
        const option = STATUS_OPTIONS.find(s => s.value === item.status);
        return option ? option.label.split(' ')[1] : '❓';
    };

    useEffect(() => {
        const getAddress = async () => {
            if (item.coords) {
                // console.log('📍 Fetching address for:', item.id, item.coords);
                try {
                    const locations = await Location.reverseGeocodeAsync({
                        latitude: item.coords.latitude,
                        longitude: item.coords.longitude
                    });

                    // console.log('📍 Location result:', locations);

                    if (locations && locations.length > 0) {
                        const loc = locations[0];
                        // Formats: "District, Province" (e.g., Klong Luang, Pathum Thani)
                        // Fallback to City/Region if District is missing
                        const line1 = loc.district || loc.subregion || loc.street;
                        const line2 = loc.city || loc.region || loc.country;

                        const parts = [line1, line2].filter(p => p);

                        if (parts.length > 0) {
                            const formattedAddress = parts.join(', ');
                            setAddress(formattedAddress);
                        } else {
                            setAddress(`${item.coords.latitude.toFixed(4)}, ${item.coords.longitude.toFixed(4)}`);
                        }
                    }
                } catch (error) {
                    console.log('Error reverse geocoding:', error);
                    // On error, keep fallback (null -> renders coords)
                }
            }
        };

        getAddress();
    }, [item.id]); // Removed item.coords from dependency to avoid loop if object ref changes

    return (
        <Card
            elevation="$1"
            backgroundColor="$background"
            paddingHorizontal="$3"
            paddingVertical="$2"
            borderRadius="$3"
            borderWidth={1}
            borderColor="$borderColor"
            borderLeftWidth={4}
            borderLeftColor={index === 0 ? "$green9" : "$gray5"}
            marginBottom="$2"
        >
            <XStack justifyContent="space-between" alignItems="center">
                <XStack alignItems="center" gap="$3" flex={1}>
                    {/* Icon Bubble */}
                    <YStack
                        width={36}
                        height={36}
                        borderRadius={18}
                        backgroundColor={index === 0 ? "$green2" : "$gray2"}
                        alignItems="center"
                        justifyContent="center"
                    >
                        <Text fontSize="$5">{getEmoji()}</Text>
                    </YStack>

                    {/* Text Content */}
                    <YStack flex={1} gap="$0">
                        <XStack justifyContent="space-between" alignItems="center" paddingRight="$2">
                            <Text fontWeight="600" color="$color" fontSize="$3">{item.status}</Text>
                            <XStack alignItems="center" gap="$1">
                                <Calendar size={10} color="$gray9" />
                                <Paragraph size="$2" color="$gray9">{item.date.split(' ')[0]} {timeString}</Paragraph>
                            </XStack>
                        </XStack>

                        <XStack alignItems="center" gap="$1">
                            <MapPin size={10} color="$gray8" />
                            <Paragraph size="$1" color="$gray8" numberOfLines={1}>
                                {address || (item.coords ? (address === null ? 'กำลังระบุตำแหน่ง...' : `${item.coords.latitude.toFixed(4)}, ${item.coords.longitude.toFixed(4)}`) : 'ไม่ระบุตำแหน่ง')}
                            </Paragraph>
                        </XStack>
                    </YStack>
                </XStack>

                {/* Delete Button */}
                {showDelete && onDelete && (
                    <Button size="$2" circular chromeless onPress={() => onDelete(item.id)}>
                        <Trash2 size={16} color="$red9" />
                    </Button>
                )}
            </XStack>
        </Card>
    );
};
