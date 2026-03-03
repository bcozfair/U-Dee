import { supabase } from '../lib/supabase';

export interface UserProfile {
    id: string;
    username: string;
    avatar_url: string;
    emergency_contact?: string;
}

export interface UserStatus {
    latitude: number;
    longitude: number;
    status_text: string;
    is_online: boolean;
    battery_level: number;
    last_updated: string;
}

export const UserService = {
    /**
     * Get user profile from Supabase
     */
    getProfile: async (userId: string): Promise<UserProfile | null> => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) throw error;

            if (data) {
                return {
                    id: data.id,
                    username: data.full_name || 'ผู้ใช้งาน', // DB uses full_name
                    avatar_url: data.avatar_url || '👦',
                    emergency_contact: data.emergency_contact
                };
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        }
        return null;
    },

    /**
     * Update user profile in Supabase
     */
    updateProfile: async (userId: string, updates: Partial<UserProfile>): Promise<boolean> => {
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    full_name: updates.username, // Map username (App) -> full_name (DB)
                    avatar_url: updates.avatar_url,
                    emergency_contact: updates.emergency_contact,
                    updated_at: new Date().toISOString()
                })
                .eq('id', userId);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error updating profile:', error);
            return false;
        }
    },

    /**
     * Update user status (Location, Battery, etc)
     * AND record to location_history
     */
    updateStatus: async (userId: string, status: Partial<UserStatus>): Promise<void> => {
        try {
            const timestamp = new Date().toISOString();

            // 1. Update current status
            const { data, error } = await supabase
                .from('user_status')
                .update({
                    ...status,
                    last_updated: timestamp
                })
                .eq('user_id', userId)
                .select();

            if (error) {
                console.error('Error updating status (update):', error);
            }

            if (!data || data.length === 0) {
                await supabase
                    .from('user_status')
                    .insert({
                        user_id: userId,
                        ...status,
                        last_updated: timestamp
                    });
            }

            // 2. Record to history if it's a location update
            if (status.latitude && status.longitude) {
                // Use the updated status from DB, or the one passed in, or default
                const currentStatusText = data?.[0]?.status_text || status.status_text || 'Active';

                await supabase
                    .from('location_history')
                    .insert({
                        user_id: userId,
                        latitude: status.latitude,
                        longitude: status.longitude,
                        status_text: currentStatusText,
                        battery_level: status.battery_level
                    });
            }
        } catch (error) {
            console.error('Error updating status (exception):', error);
        }
    },

    /**
     * Upload avatar to Supabase Storage
     * Deletes old avatars to save space
     */
    uploadAvatar: async (userId: string, uri: string): Promise<string | null> => {
        try {
            // 1. Prepare file
            const response = await fetch(uri);
            const arrayBuffer = await response.arrayBuffer();


            const fileExt = uri.split('.').pop()?.toLowerCase() || 'jpeg';
            const fileName = `${userId}/${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            // 2. Upload to Supabase Storage
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, arrayBuffer, {
                    contentType: `image/${fileExt}`,
                    upsert: true
                });

            if (uploadError) {
                console.error('Supabase upload error details:', JSON.stringify(uploadError, null, 2));
                throw uploadError;
            }

            // 3. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            // 4. Update Profile
            await UserService.updateProfile(userId, { avatar_url: publicUrl });

            // 5. Cleanup Old Avatars (Save space)
            const { data: list, error: listError } = await supabase.storage
                .from('avatars')
                .list(userId, {
                    limit: 100,
                    offset: 0,
                    sortBy: { column: 'created_at', order: 'desc' },
                });

            if (listError) {
                console.error('List error:', listError);
            }

            if (list && list.length > 0) {
                console.log('Current avatar files:', list);
                const currentFileName = fileName.split('/').pop();

                const filesToDelete = list
                    .filter(f => f.name !== currentFileName) // Keep the new file
                    .map(f => `${userId}/${f.name}`);

                if (filesToDelete.length > 0) {
                    console.log('Deleting old avatars:', filesToDelete);
                    const { data: deleteData, error: deleteError } = await supabase.storage
                        .from('avatars')
                        .remove(filesToDelete);

                    if (deleteError) {
                        console.error('Delete error', deleteError);
                    } else {
                        console.log('Deleted result data:', deleteData); // Check if this is empty
                        if (deleteData && deleteData.length > 0) {
                            console.log('Deleted old avatars successfully');
                        } else {
                            console.warn('Delete operation returned success but no files were returned - check RLS policies');
                        }
                    }
                }
            }

            return publicUrl;
        } catch (error) {
            console.error('Error uploading avatar:', error);
            return null;
        }
    }
};
