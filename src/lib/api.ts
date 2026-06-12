const BASE_URL = "";

export type PortalSnapshotUser = {
  portalUserId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  role: "user" | "super_admin";
};

export async function requestJson<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}

export async function getPortalSnapshot() {
  return requestJson<{ user: PortalSnapshotUser | null }>("/api/auth/me");
}
