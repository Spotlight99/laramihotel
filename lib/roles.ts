import { supabase } from './auth';

export const checkUserRole = async (userId: string): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();

    if (error) {
      // If table doesn't exist or row not found, return null gracefully
      if (error.code === 'PGRST116' || error.code === '42P01') {
        console.log('ℹ️ User role not found or table missing');
        return null;
      }
      console.error('❌ Error fetching role:', error);
      return null;
    }

    return data?.role || null;
  } catch (err) {
    console.error('❌ Error checking role:', err);
    return null;
  }
};

export const isManager = async (userId: string): Promise<boolean> => {
  try {
    const role = await checkUserRole(userId);
    return role === 'manager';
  } catch (err) {
    console.error('❌ Error checking manager status:', err);
    return false;
  }
};

export const assignRole = async (userId: string, role: 'manager' | 'guest') => {
  try {
    // Use upsert to handle if row already exists
    const { error } = await supabase
      .from('user_roles')
      .upsert([{ user_id: userId, role }], { onConflict: 'user_id' });

    if (error) {
      console.error('❌ Error assigning role:', error);
      return false;
    }

    console.log(`✅ Role '${role}' assigned to user`);
    return true;
  } catch (err) {
    console.error('❌ Error assigning role:', err);
    return false;
  }
};
