import { supabase } from './supabase';

export const checkUserRole = async (userId: string): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();

    if (error) {
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
  const role = await checkUserRole(userId);
  return role === 'manager';
};

export const assignRole = async (userId: string, role: 'manager' | 'guest') => {
  try {
    const { error } = await supabase
      .from('user_roles')
      .insert([{ user_id: userId, role }]);

    if (error) {
      console.error('❌ Error assigning role:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('❌ Error assigning role:', err);
    return false;
  }
};
