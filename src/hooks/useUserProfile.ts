
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useUserProfile() {
  const { data: userProfile, isLoading } = useQuery({
    queryKey: ["userProfile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Fetch profile and business membership in parallel
      const [profileResponse, memberResponse] = await Promise.all([
        supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle(),
        supabase
          .from("business_members")
          .select("business_id, role")
          .eq("user_id", user.id)
          .maybeSingle()
      ]);

      if (profileResponse.error) {
        console.warn("Error loading profile (safe to ignore if just business_id needed):", profileResponse.error);
      }

      if (memberResponse.error) {
        console.error("Error loading business member:", memberResponse.error);
      }

      const memberData = memberResponse.data;

      console.log("UserProfile Hook - Business Found:", memberData?.business_id);

      // Return constructed profile object
      return {
        id: user.id,
        email: user.email,
        first_name: profileResponse.data?.first_name || "",
        last_name: profileResponse.data?.last_name || "",
        avatar_url: profileResponse.data?.avatar_url || "",
        business_id: memberData?.business_id || "",
        role: memberData?.role || "staff",
        // Compatibility layer
        empresa_id: memberData?.business_id || ""
      };
    },
  });

  return {
    userProfile,
    isLoading,
    empresaId: userProfile?.business_id
  };
}
