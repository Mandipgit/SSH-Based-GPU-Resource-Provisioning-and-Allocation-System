export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  name: string;
  role: "renter" | "host";
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateProfileRequest {
  firstName: string;
  lastName: string;
}

/**
 * Normalizes backend response from GET /api/auth/me into canonical UserProfile.
 */
export function normalizeProfile(
  raw: Record<string, unknown> | null | undefined
): UserProfile {
  if (!raw || typeof raw !== "object") {
    return {
      id: "",
      email: "",
      firstName: "",
      lastName: "",
      name: "Renter",
      role: "renter",
    };
  }

  const data = (raw.user || raw.data || raw) as Record<string, unknown>;

  const id = String(data.id ?? "");
  const email = String(data.email ?? "");
  let firstName = String(data.first_name ?? data.firstName ?? "");
  let lastName = String(data.last_name ?? data.lastName ?? "");
  let name = String(data.name ?? "");

  if (!firstName && !lastName && name) {
    const parts = name.trim().split(/\s+/);
    firstName = parts[0] || "";
    lastName = parts.slice(1).join(" ") || "";
  } else if (!name && (firstName || lastName)) {
    name = `${firstName} ${lastName}`.trim();
  }

  if (!firstName && !name) {
    firstName = "Renter";
  }

  const role = (data.role === "host" ? "host" : "renter") as "renter" | "host";
  const createdAt =
    data.created_at || data.createdAt
      ? String(data.created_at ?? data.createdAt)
      : undefined;
  const updatedAt =
    data.updated_at || data.updatedAt
      ? String(data.updated_at ?? data.updatedAt)
      : undefined;

  return {
    id,
    email,
    firstName,
    lastName,
    name: name || `${firstName} ${lastName}`.trim(),
    role,
    createdAt,
    updatedAt,
  };
}
