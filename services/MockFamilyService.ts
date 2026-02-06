
// Types
export interface FamilyMember {
    id: string;
    name: string;
    relationship: string;
    avatar: string;
    status: string;
    lastCheckIn: string;
    batteryLevel?: number;
    isOnline?: boolean;
    phoneNumber: string; // New field
    location: {
        latitude: number;
        longitude: number;
    };
}

// ... Message interface ...

// Mock Data
// Coordinates centered around Khlong Luang, Pathum Thani
const KHLONG_LUANG_LAT = 14.0649;
const KHLONG_LUANG_LNG = 100.6161;

const getRandomLocation = () => ({
    latitude: KHLONG_LUANG_LAT + (Math.random() - 0.5) * 0.05, // ~5km radius
    longitude: KHLONG_LUANG_LNG + (Math.random() - 0.5) * 0.05
});

export const MOCK_FAMILY_MEMBERS: FamilyMember[] = [
    {
        id: 'mom',
        name: 'แม่ต้อย',
        relationship: 'แม่',
        avatar: '👵',
        status: 'สบายดี',
        lastCheckIn: '10 นาทีที่แล้ว',
        batteryLevel: 85,
        isOnline: true,
        phoneNumber: '081-111-1111',
        location: getRandomLocation()
    },
    {
        id: 'dad',
        name: 'พ่อศักดิ์',
        relationship: 'พ่อ',
        avatar: '👴',
        status: 'อยู่ที่ทำงาน',
        lastCheckIn: '1 ชั่วโมงที่แล้ว',
        batteryLevel: 60,
        isOnline: false,
        phoneNumber: '082-222-2222',
        location: getRandomLocation()
    },
    {
        id: 'sis',
        name: 'น้องดา',
        relationship: 'น้องสาว',
        avatar: '👧',
        status: 'อยู่โรงเรียน',
        lastCheckIn: '5 ชั่วโมงที่แล้ว',
        batteryLevel: 30,
        isOnline: true,
        phoneNumber: '083-333-3333',
        location: getRandomLocation()
    }
];

// ... (Only keeping FamilyMember related code)
// The user explicitly asked to remove chat functions.

// Status Options (Simplified for one-tap usage)
const MOCK_STATUSES = [
    'สบายดี',
    'พักผ่อน',
    'ทำงาน',
    'เรียน',
    'เดินทาง',
    'ท่องเที่ยว',
    'ออกกำลังกาย',
    'ทำธุระ',
    'ทานอาหาร',
    'อื่นๆ'
];

// Generate random check-in time (some > 24 hours)
const getRandomCheckIn = () => {
    // 30% chance of being > 24 hours (Emergency/Missing scenario)
    const isEmergency = Math.random() < 0.3;

    if (isEmergency) {
        const days = Math.floor(Math.random() * 5) + 2; // 2-6 days
        return {
            text: `${days} วันที่แล้ว`,
            isOnline: false
        };
    } else {
        const hours = Math.floor(Math.random() * 12);
        const minutes = Math.floor(Math.random() * 59);

        if (hours === 0) return { text: `${minutes} นาทีที่แล้ว`, isOnline: true };
        return { text: `${hours} ชม. ${minutes} นาทีที่แล้ว`, isOnline: Math.random() > 0.5 };
    }
};

export const getFamilyMembers = async (): Promise<FamilyMember[]> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Randomize data on every fetch
    return MOCK_FAMILY_MEMBERS.map(member => {
        const timeData = getRandomCheckIn();
        const isLate = timeData.text.includes('วัน');

        return {
            ...member,
            status: isLate ? 'สะกิดหน่อย' : MOCK_STATUSES[Math.floor(Math.random() * MOCK_STATUSES.length)],
            lastCheckIn: timeData.text,
            isOnline: timeData.isOnline,
            batteryLevel: Math.floor(Math.random() * 100),
            location: getRandomLocation() // Refresh location too
        };
    });
};

export const nudgeFamilyMember = async (memberId: string): Promise<{ success: boolean; data?: Partial<FamilyMember> }> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 50% chance of success (They see the nudge and check in)
    const isSuccess = Math.random() > 0.5;

    if (isSuccess) {
        return {
            success: true,
            data: {
                lastCheckIn: 'เมื่อสักครู่',
                isOnline: true,
                status: 'สบายดี',
                location: getRandomLocation() // Update location too
            }
        };
    }

    return { success: false };
};
