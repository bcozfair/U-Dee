import React from 'react';
import { Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Card, H3, Paragraph, useTheme, YStack } from 'tamagui';
import { getRecordDate } from '../utils/checkInLogic';

interface HistoryItem {
    id: string;
    date: string;
    status: string;
}

interface HistoryChartProps {
    history: HistoryItem[];
}

export default function HistoryChart({ history }: HistoryChartProps) {
    const theme = useTheme();
    const screenWidth = Dimensions.get('window').width;

    // Process data for the last 7 days
    const processData = () => {
        const today = new Date();
        const labels: string[] = [];
        const dataPoints: number[] = [];

        // Initialize last 7 days
        for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);

            // Label: Mon, Tue (Thai: จ, อ)
            const days = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
            labels.push(days[d.getDay()]);

            // Find check-in for this day
            // item.id is timestamp
            const found = history.find(h => {
                const hDate = getRecordDate(h as any);
                return hDate.getDate() === d.getDate() &&
                    hDate.getMonth() === d.getMonth() &&
                    hDate.getFullYear() === d.getFullYear();
            });

            if (found) {
                const hDate = getRecordDate(found as any);
                const hours = hDate.getHours() + (hDate.getMinutes() / 60);
                dataPoints.push(hours);
            } else {
                dataPoints.push(0); // 0 means no check-in
            }
        }

        return { labels, dataPoints };
    };

    const { labels, dataPoints } = processData();
    const hasData = dataPoints.some(v => v > 0);

    if (!hasData) return null;

    return (
        <Card
            elevation="$1"
            borderWidth={1}
            borderColor="$borderColor"
            padding="$3"
            backgroundColor="$background"
            overflow="hidden"
        >
            <YStack marginBottom="$3">
                <H3 fontSize="$4" color="$color">📈 เวลาเช็คอิน (7 วันล่าสุด)</H3>
                <Paragraph size="$1" color="$gray9">ดูแนวโน้มเวลาตื่นนอนของคุณ</Paragraph>
            </YStack>

            <LineChart
                data={{
                    labels: labels,
                    datasets: [
                        {
                            data: dataPoints,
                            color: (opacity = 1) => `rgba(0, 172, 193, ${opacity})`, // Optional
                            strokeWidth: 2
                        }
                    ]
                }}
                width={screenWidth - 48} // Padding adjustments
                height={220}
                yAxisLabel=""
                yAxisSuffix=" น."
                chartConfig={{
                    backgroundColor: theme.background?.val,
                    backgroundGradientFrom: theme.background?.val,
                    backgroundGradientTo: theme.background?.val,
                    decimalPlaces: 1, // optional, defaults to 2dp
                    color: (opacity = 1) => `rgba(0, 172, 193, ${opacity})`,
                    labelColor: (opacity = 1) => theme.color?.val || `rgba(0, 0, 0, ${opacity})`,
                    style: {
                        borderRadius: 16
                    },
                    propsForDots: {
                        r: "4",
                        strokeWidth: "2",
                        stroke: "#00ACC1"
                    }
                }}
                bezier
                style={{
                    marginVertical: 8,
                    borderRadius: 16,
                    marginLeft: -16 // Adjust for chart padding
                }}
                fromZero
                segments={4}
            />
        </Card>
    );
}
