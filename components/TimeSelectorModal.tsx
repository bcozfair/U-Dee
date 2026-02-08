import { X } from '@tamagui/lucide-icons';
import React from 'react';
import { FlatList, Modal, TouchableOpacity } from 'react-native';
import { Button, Card, H3, Text, XStack } from 'tamagui';

interface TimeSelectorModalProps {
    visible: boolean;
    title: string;
    data: number[];
    onSelect: (value: number) => void;
    onClose: () => void;
    selectedValue: number;
}

export const TimeSelectorModal = ({
    visible,
    title,
    data,
    onSelect,
    onClose,
    selectedValue
}: TimeSelectorModalProps) => {

    const renderItem = ({ item }: { item: number }) => {
        const isSelected = item === selectedValue;
        return (
            <TouchableOpacity onPress={() => onSelect(item)} style={{ width: '100%' }}>
                <XStack
                    paddingVertical="$3"
                    paddingHorizontal="$4"
                    backgroundColor={isSelected ? '$blue2' : 'transparent'}
                    borderRadius="$4"
                    justifyContent="center"
                    alignItems="center"
                    width="100%"
                >
                    <Text
                        fontSize="$5"
                        fontWeight={isSelected ? '700' : '400'}
                        color={isSelected ? '$blue9' : '$color'}
                    >
                        {item.toString().padStart(2, '0')}
                    </Text>
                </XStack>
            </TouchableOpacity>
        );
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableOpacity
                style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}
                activeOpacity={1}
                onPress={onClose}
            >
                <TouchableOpacity activeOpacity={1} style={{ width: '100%', alignItems: 'center' }}>
                    <Card
                        elevation="$5"
                        width={280}
                        height={400} // Fixed height for scrolling
                        backgroundColor="$background"
                        padding="$0"
                        borderRadius="$8"
                        overflow="hidden"
                    >
                        {/* Header */}
                        <XStack
                            padding="$3"
                            borderBottomWidth={1}
                            borderColor="$borderColor"
                            justifyContent="space-between"
                            alignItems="center"
                            backgroundColor="$gray1"
                        >
                            <H3 fontSize="$5" color="$color">{title}</H3>
                            <Button size="$2" circular chromeless onPress={onClose}>
                                <X size={20} color="$gray10" />
                            </Button>
                        </XStack>

                        {/* Scrollable List */}
                        <FlatList
                            data={data}
                            renderItem={renderItem}
                            keyExtractor={(item) => item.toString()}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{ padding: 10 }}
                            initialScrollIndex={Math.max(0, data.indexOf(selectedValue))}
                            getItemLayout={(data, index) => (
                                { length: 50, offset: 50 * index, index }
                            )}
                            onScrollToIndexFailed={(info) => {
                                // Fallback just in case, though usually handled
                                console.log("Scroll failed", info);
                            }}
                        />
                    </Card>
                </TouchableOpacity>
            </TouchableOpacity>
        </Modal>
    );
};
