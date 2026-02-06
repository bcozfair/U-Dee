import { CHAT_KEYS, storage } from '../utils/storage';

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
}

export interface Message {
    id: string;
    text: string;
    senderId: string;
    timestamp: number;
    isMine: boolean;
    type?: 'text' | 'image' | 'location';
}

// Mock Data
export const MOCK_FAMILY_MEMBERS: FamilyMember[] = [
    {
        id: 'mom',
        name: 'แม่ต้อย',
        relationship: 'แม่',
        avatar: '👵',
        status: 'กำลังดูละคร',
        lastCheckIn: '10 นาทีที่แล้ว',
        batteryLevel: 85,
        isOnline: true
    },
    {
        id: 'dad',
        name: 'พ่อศักดิ์',
        relationship: 'พ่อ',
        avatar: '👴',
        status: 'รดน้ำต้นไม้',
        lastCheckIn: '1 ชั่วโมงที่แล้ว',
        batteryLevel: 60,
        isOnline: false
    },
    {
        id: 'sis',
        name: 'น้องดา',
        relationship: 'น้องสาว',
        avatar: '👧',
        status: 'เรียนพิเศษ',
        lastCheckIn: '5 ชั่วโมงที่แล้ว',
        batteryLevel: 30,
        isOnline: true
    }
];

// Quick Messages
export const QUICK_MESSAGES = [
    "กินข้าวยังครับ? 🍚",
    "ถึงบ้านแล้วนะ 🏠",
    "สบายดีไหม? 💚",
    "วันนี้กลับดึกนะ 🌙",
    "คิดถึงนะครับ ❤️",
    "โทรหาได้ไหม? 📞"
];

// Mock Bot Responses
const BOT_RESPONSES = {
    'mom': [
        "จ้าลูก แม่เพิ่งกินข้าวเสร็จ",
        "โอเคจ้ะ ดูแลตัวเองด้วยนะ",
        "แม่สบายดีจ้ะ ลูกล่ะ?",
        "รักลูกนะ ❤️",
        "จ้า อย่านอนดึกล่ะ"
    ],
    'dad': [
        "อืม พ่อกำลังยุ่งอยู่",
        "โอเค รับทราบ",
        "ตั้งใจทำงานนะลุก",
        "เดี๋ยวพ่อโทรกลับ"
    ],
    'sis': [
        "ค่าาา เดี๋ยวคุยนะ",
        "พี่ซื้อขนมมาฝากด้วยนะ 🍰",
        "โอเคค่า",
        "555+ ตลกอะ"
    ]
};

// Service Keys
const CHAT_HISTORY_KEY = 'mock_chat_history_';

export const getFamilyMembers = async (): Promise<FamilyMember[]> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return MOCK_FAMILY_MEMBERS;
};

export const getMessages = async (memberId: string): Promise<Message[]> => {
    const messages = await storage.get<Message[]>(CHAT_KEYS.HISTORY_PREFIX + memberId);
    return messages || [];
};

export const sendMessage = async (memberId: string, text: string): Promise<Message> => {
    // 1. Create User Message
    const userMsg: Message = {
        id: Date.now().toString(),
        text,
        senderId: 'me',
        timestamp: Date.now(),
        isMine: true
    };

    // 2. Save User Message
    await saveMessage(memberId, userMsg);

    // 3. Trigger Bot Reply (after delay)
    simulateBotReply(memberId);

    return userMsg;
};

const saveMessage = async (memberId: string, msg: Message) => {
    try {
        const currentMessages = await getMessages(memberId);
        const updatedMessages = [...currentMessages, msg];
        await storage.save(CHAT_KEYS.HISTORY_PREFIX + memberId, updatedMessages);
    } catch (error) {
        console.error('Error saving message:', error);
    }
};

const simulateBotReply = async (memberId: string) => {
    // Random delay 2-5 seconds
    const delay = Math.floor(Math.random() * 3000) + 2000;

    setTimeout(async () => {
        // Pick random response based on member
        const responses = BOT_RESPONSES[memberId as keyof typeof BOT_RESPONSES] || ["ครับ/ค่ะ"];
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];

        const botMsg: Message = {
            id: (Date.now() + 1).toString(),
            text: randomResponse,
            senderId: memberId,
            timestamp: Date.now(),
            isMine: false
        };

        await saveMessage(memberId, botMsg);

        // In a real app, this would trigger an event/listener to update UI
        // For now, the UI will poll or user has to refresh, or we can use a callback if we refactor
    }, delay);
};
