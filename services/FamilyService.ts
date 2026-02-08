import { supabase } from '../lib/supabase';
import { UserProfile } from './UserService';

export interface Family {
    id: string;
    name: string;
    invite_code: string;
    created_at: string;
    created_by: string;
}

export interface FamilyMember extends UserProfile {
    family_id: string;
    role: 'admin' | 'member';
    joined_at: string;
    status?: string;
    lastCheckIn?: string;
    location?: {
        latitude: number;
        longitude: number;
    };
    batteryLevel?: number;
    isOnline?: boolean;
    // Compatibility fields
    name: string;
    avatar: string;
    relationship: string;
    phoneNumber: string;
}

export const FamilyService = {
    /**
     * Create a new family
     */
    createFamily: async (name: string): Promise<Family | null> => {
        try {
            const { data, error } = await supabase
                .rpc('create_family', { name_input: name });

            if (error) throw error;

            // Fetch the created family details
            if (data) {
                const { data: family, error: fetchError } = await supabase
                    .from('families')
                    .select('*')
                    .eq('id', data)
                    .single();

                if (fetchError) throw fetchError;
                return family;
            }
        } catch (error) {
            console.error('Error creating family:', error);
        }
        return null;
    },

    /**
     * Join a family using invite code
     */
    joinFamily: async (inviteCode: string): Promise<boolean> => {
        try {
            const { data, error } = await supabase
                .rpc('join_family', { invite_code_input: inviteCode });

            if (error) throw error;
            return !!data;
        } catch (error) {
            console.error('Error joining family:', error);
            return false;
        }
    },

    /**
     * Get all family members for the current user
     * Returns members from all families the user belongs to
     */
    getFamilyMembers: async (): Promise<FamilyMember[]> => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return [];

            // 1. Get my families
            const { data: myFamilies, error: famError } = await supabase
                .from('family_members')
                .select('family_id')
                .eq('user_id', user.id);

            if (famError || !myFamilies || myFamilies.length === 0) return [];

            const familyIds = myFamilies.map(f => f.family_id);

            // 2. Get all members of these families (excluding self)
            const { data: members, error: memError } = await supabase
                .from('family_members')
                .select(`
                    family_id,
                    role,
                    joined_at,
                    user:profiles (
                        id,
                        full_name,
                        avatar_url,
                        emergency_contact
                    )
                `)
                .in('family_id', familyIds);
            // .neq('user_id', user.id); // Include self now as per user request

            if (memError) throw memError;

            // 3. Get status for these members
            if (!members || members.length === 0) return [];

            const memberIds = members.map((m: any) => m.user.id);
            const { data: statuses, error: statusError } = await supabase
                .from('user_status')
                .select('*')
                .in('user_id', memberIds);

            if (statusError) throw statusError;

            // 4. Merge data
            const statusMap = new Map(statuses?.map(s => [s.user_id, s]));

            return members.map((m: any) => {
                const status = statusMap.get(m.user.id);
                return {
                    id: m.user.id,
                    username: m.user.full_name || 'Unknown',
                    avatar_url: m.user.avatar_url || '👤',
                    emergency_contact: m.user.emergency_contact,
                    family_id: m.family_id,
                    role: m.role,
                    joined_at: m.joined_at,

                    // Status fields
                    status: status?.status_text || 'ปกติ',
                    lastCheckIn: status ? new Date(status.last_updated).toLocaleString('th-TH') : '-',
                    location: (status?.latitude && status?.longitude) ? {
                        latitude: status.latitude,
                        longitude: status.longitude
                    } : undefined,
                    batteryLevel: status?.battery_level,
                    isOnline: status?.is_online,

                    // For compatibility with UI that expects 'name' and 'avatar'
                    name: m.user.full_name || 'Unknown',
                    avatar: m.user.avatar_url || '👤',
                    relationship: 'Family', // Placeholder
                    phoneNumber: m.user.emergency_contact || '-'
                };
            });

        } catch (error) {
            console.error('Error fetching family members:', error);
            return [];
        }
    },

    /**
     * Get user's families
     */
    getMyFamilies: async (): Promise<Family[]> => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return [];

            const { data, error } = await supabase
                .from('families')
                .select('*')
                .filter('id', 'in', (
                    supabase
                        .from('family_members')
                        .select('family_id')
                        .eq('user_id', user.id)
                ) as any); // Subquery workarounds in JS are tricky, better separate query or view.

            // Let's use simple join approach or two-step
            const { data: myMemberships } = await supabase
                .from('family_members')
                .select('family_id')
                .eq('user_id', user.id);

            if (!myMemberships || myMemberships.length === 0) return [];

            const { data: families, error: famError } = await supabase
                .from('families')
                .select('*')
                .in('id', myMemberships.map(m => m.family_id));

            if (famError) throw famError;
            return families || [];

        } catch (error) {
            console.error('Error getting my families:', error);
            return [];
        }
    },

    /**
     * Subscribe to user status updates (for realtime map)
     */
    subscribeToStatusUpdates: (callback: (payload: any) => void) => {
        const channel = supabase
            .channel('public:user_status')
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'user_status' },
                (payload) => callback(payload)
            )
            .subscribe();

        return channel;
    }
};
