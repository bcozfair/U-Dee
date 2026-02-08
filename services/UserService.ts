import { supabase } from '../lib/supabase';
import { storage, USER_KEYS } from '../utils/storage';

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
     * Falls back to local storage if offline/error
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
                // Update local cache
                // Map full_name (DB) -> username (App)
                if (data.full_name) await storage.save(USER_KEYS.NAME, data.full_name);
                if (data.avatar_url) await storage.save(USER_KEYS.AVATAR, data.avatar_url);
                if (data.emergency_contact) {
                    await storage.save(USER_KEYS.EMERGENCY_CONTACT, data.emergency_contact);
                }

                return {
                    id: data.id,
                    username: data.full_name || 'ผู้ใช้งาน', // DB uses full_name
                    avatar_url: data.avatar_url || '👦',
                    emergency_contact: data.emergency_contact
                };
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
            // Fallback to local storage
            const name = await storage.get<string>(USER_KEYS.NAME);
            const avatar = await storage.get<string>(USER_KEYS.AVATAR);
            const contact = await storage.get<string>(USER_KEYS.EMERGENCY_CONTACT);

            if (name && avatar) {
                return {
                    id: userId,
                    username: name,
                    avatar_url: avatar,
                    emergency_contact: contact || undefined
                };
            }
        }
        return null;
    },

    /**
     * Update user profile in Supabase and local storage
     */
    updateProfile: async (userId: string, updates: Partial<UserProfile>): Promise<boolean> => {
        try {
            // 1. Update Supabase
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

            // 2. Update Local Storage
            if (updates.username) await storage.save(USER_KEYS.NAME, updates.username);
            if (updates.avatar_url) await storage.save(USER_KEYS.AVATAR, updates.avatar_url);
            if (updates.emergency_contact) await storage.save(USER_KEYS.EMERGENCY_CONTACT, updates.emergency_contact);

            return true;
        } catch (error) {
            console.error('Error updating profile:', error);
            // Even if cloud fails, might want to save locally? 
            // For now, let's return false to indicate sync failure.
            return false;
        }
    },

    /**
     * Update user status (Location, Battery, etc)
     */
    /**
     * Update user status (Location, Battery, etc)
     * Uses UPDATE first to preserve existing fields not in payload,
     * falls back to INSERT if record doesn't exist.
     */
    updateStatus: async (userId: string, status: Partial<UserStatus>): Promise<void> => {
        try {
            const timestamp = new Date().toISOString();

            // 1. Try to UPDATE first (Patch existing record)
            const { data, error } = await supabase
                .from('user_status')
                .update({
                    ...status,
                    last_updated: timestamp
                })
                .eq('user_id', userId)
                .select(); // documented: select() returns the updated rows

            if (error) {
                console.error('Error updating status (update):', error);
                // If error is not "row not found" (which shows as empty data, not error usually), we might want to retry as insert?
                // But typically Supabase update returns empty data if ID not found.
            }

            // 2. If no record existed (data is empty array), INSERT new record
            if (!data || data.length === 0) {
                const { error: insertError } = await supabase
                    .from('user_status')
                    .insert({
                        user_id: userId,
                        ...status,
                        last_updated: timestamp
                    });

                if (insertError) {
                    // If insert fails (maybe race condition?), try upsert as last resort
                    console.error('Error updating status (insert):', insertError);
                }
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
