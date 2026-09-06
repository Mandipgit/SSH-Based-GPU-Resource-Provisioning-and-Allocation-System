import { api } from "./api";
import { SessionDetail, normalizeSessions, normalizeSession } from "@/types/session";

export interface CreateSessionPayload {
  gpu_id: string;
  duration_hours?: number;
  work_protection?: boolean;
}

/**
 * Fetch all sessions for the authenticated renter from GET /sessions/.
 */
export const getSessions = async (): Promise<SessionDetail[]> => {
  const response = await api.get("/sessions/");
  const data = response.data;
  const list = data?.results ?? data?.data ?? (Array.isArray(data) ? data : []);
  return normalizeSessions(list);
};

/**
 * Create a new GPU rental session.
 * Tries POST /sessions/ first (standard REST), and falls back to POST /sessions/create/ if needed.
 */
export const createSession = async (
  payload: CreateSessionPayload
): Promise<SessionDetail> => {
  const body = {
    gpu_id: payload.gpu_id,
    duration_hours: payload.duration_hours ?? 1,
    work_protection: payload.work_protection ?? false,
  };

  try {
    const response = await api.post("/sessions/", body);
    const data = response.data?.data?.session ?? response.data?.data ?? response.data;
    return normalizeSession(data);
  } catch (err: unknown) {
    const status = (err as { response?: { status?: number } })?.response?.status;
    if (status === 404 || status === 405) {
      const altResponse = await api.post("/sessions/create/", body);
      const altData = altResponse.data?.data?.session ?? altResponse.data?.data ?? altResponse.data;
      return normalizeSession(altData);
    }
    throw err;
  }
};

/**
 * Terminate an active GPU rental session via POST /sessions/{id}/stop/.
 */
export const stopSession = async (
  id: string
): Promise<{ success: boolean; session?: SessionDetail; message?: string }> => {
  const response = await api.post(`/sessions/${id}/stop/`);
  const data = response.data;
  const sessionData = data?.data?.session ?? data?.session ?? data?.data ?? data;
  const normalized = sessionData ? normalizeSession(sessionData) : undefined;

  return {
    success: true,
    session: normalized,
    message: data?.message || "Session stopped successfully.",
  };
};

/**
 * Fetch a single session by ID via GET /sessions/{id}/.
 */
export const getSessionById = async (id: string): Promise<SessionDetail | null> => {
  try {
    const response = await api.get(`/sessions/${id}/`);
    const data = response.data?.data ?? response.data;
    return normalizeSession(data);
  } catch {
    // Fallback: If GET /sessions/{id}/ fails on the backend,
    // locate the session from the user's sessions list
    try {
      const list = await getSessions();
      const found = list.find((s) => s.id === id);
      if (found) {
        try {
          const statusData = await getSessionStatus(id);
          if (statusData) {
            found.status = statusData.status as SessionDetail["status"];
            if (statusData.sshConnection) {
              found.sshConnectionString = statusData.sshConnection;
            }
          }
        } catch {
          // ignore status merge error
        }
        return found;
      }
    } catch {
      // ignore list fetch error
    }

    // Secondary fallback: if session was newly created and pending, retrieve from status endpoint
    try {
      const statusData = await getSessionStatus(id);
      if (statusData) {
        return {
          id,
          renterId: "",
          gpuId: "",
          gpuName: "Compute GPU",
          pricePerHour: 0,
          status: statusData.status as SessionDetail["status"],
          sshConnectionString: statusData.sshConnection,
          startTime: new Date().toISOString(),
          endTime: null,
          totalCost: statusData.costSoFar ?? 0,
          costSoFar: statusData.costSoFar ?? 0,
        };
      }
    } catch {
      // ignore status fetch error
    }

    return null;
  }
};

export interface SessionStatusData {
  sessionId: string;
  status: string;
  sshConnection?: string;
  progress?: number;
  costSoFar?: number;
  remainingTime?: string | null;
}

/**
 * Fetch real-time session status via GET /sessions/{id}/status/.
 */
export const getSessionStatus = async (id: string): Promise<SessionStatusData | null> => {
  try {
    const response = await api.get(`/sessions/${id}/status/`);
    const data = response.data?.data ?? response.data;
    return {
      sessionId: String(data?.session_id || id),
      status: String(data?.status || "pending").toLowerCase(),
      sshConnection: data?.ssh_connection,
      progress: typeof data?.progress === "number" ? data.progress : undefined,
      costSoFar: typeof data?.cost_so_far === "number" ? data.cost_so_far : undefined,
      remainingTime: data?.remaining_time,
    };
  } catch {
    return null;
  }
};


