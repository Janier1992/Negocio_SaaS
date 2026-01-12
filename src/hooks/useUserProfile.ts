import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useUserProfile = () => {
  return useQuery({
    queryKey: ["userProfile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return null;

      // 1. Try to get business member record first
      const { data: memberData, error: memberError } = await supabase
        .from('business_members')
        .select('business_id, role')
        .eq('user_id', user.id)
        .maybeSingle();

      if (memberError && memberError.code !== 'PGRST116') {
        console.error("Error fetching business member:", memberError);
      }

      let businessId = memberData?.business_id || null;

      // 2. Fallback: Check if user owns a business directly
      if (!businessId) {
        const { data: ownedBusiness } = await supabase
          .from('businesses')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (ownedBusiness) {
          businessId = ownedBusiness.id;
        }
      }

      console.log("UserProfile Hook - Business Found:", businessId);

      // 3. Fetch profile data
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      return {
        ...profile,
        business_id: businessId
      };
    },
    retry: 1,
    staleTime: 1000 * 60 * 5 // 5 minutes
  });
};
