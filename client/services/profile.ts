import { api } from "./api";
import { UserProfile, normalizeProfile, UpdateProfileRequest } from "@/types/user";
import { useAuthStore } from "@/stores/auth-store";

/**
 * Fetch authenticated renter's profile information from GET /auth/me/.
 */
export const getProfile = async (): Promise<UserProfile> => {
  const response = await api.get("/auth/me/");
  const data = response.data?.data ?? response.data;
  const profile = normalizeProfile(data);

  // Sync updated info into auth store
  const storeUser = useAuthStore.getState().user;
  if (storeUser && (storeUser.name !== profile.name || storeUser.email !== profile.email)) {
    useAuthStore.getState().updateUser({
      name: profile.name,
      firstName: profile.firstName,
      lastName: profile.lastName,
      email: profile.email,
      createdAt: profile.createdAt,
    });
  }

  return profile;
};

/**
 * Update authenticated renter's profile information via PATCH /auth/me/.
 */
export const updateProfile = async (
  data: UpdateProfileRequest
): Promise<{ success: boolean; profile: UserProfile; message?: string }> => {
  const payload = {
    first_name: data.firstName.trim(),
    last_name: data.lastName.trim(),
  };

  const response = await api.patch("/auth/me/", payload);
  const responseData = response.data?.data ?? response.data;
  const updatedProfile = normalizeProfile(responseData);

  // Sync into auth store
  useAuthStore.getState().updateUser({
    name: updatedProfile.name,
    firstName: updatedProfile.firstName,
    lastName: updatedProfile.lastName,
  });

  return {
    success: true,
    profile: updatedProfile,
    message: response.data?.message || "Profile updated successfully.",
  };
};

