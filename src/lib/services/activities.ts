import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ActivityLog,
  ActivityEntityType,
  ActivityIconType,
  ApiResponse,
} from "@/lib/types";

/**
 * Activity Service
 *
 * Provides central logging for all system events and query retrieval
 * for user activity audit logs.
 */

export interface LogActivityParams {
  userId: string;
  entityType: ActivityEntityType;
  entityId?: string | null;
  action: string;
  title: string;
  description: string;
  metadata?: Record<string, any>;
  iconType?: ActivityIconType;
}

export interface GetActivitiesOptions {
  page?: number;
  limit?: number;
  entityType?: ActivityEntityType | "all";
}

export interface PaginatedActivities {
  items: ActivityLog[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

/**
 * Central helper to insert an activity log entry.
 * Non-blocking: Catch errors internally to ensure main CRUD operations never fail
 * if an activity log insert fails.
 */
export async function logActivity(
  supabase: SupabaseClient,
  params: LogActivityParams
): Promise<void> {
  try {
    const iconType = params.iconType || params.entityType;
    const metadata = {
      ...(params.metadata || {}),
      icon_type: iconType,
    };

    const payload = {
      user_id: params.userId,
      entity_type: params.entityType,
      entity_id: params.entityId || null,
      action: params.action,
      title: params.title,
      description: params.description,
      metadata,
    };

    // First attempt to include icon_type if column exists
    const { error } = await supabase.from("activity_logs").insert({
      ...payload,
      icon_type: iconType,
    });

    if (error) {
      // If error is about missing icon_type column, retry without icon_type column
      if (
        error.message?.includes("icon_type") ||
        error.details?.includes("icon_type") ||
        error.code === "PGRST204"
      ) {
        await supabase.from("activity_logs").insert(payload);
      } else {
        console.error("[logActivity] Failed to insert log:", error.message);
      }
    }
  } catch (err) {
    console.error("[logActivity] Exception while logging activity:", err);
  }
}

/**
 * Fetch paginated activity logs for the user.
 */
export async function getActivities(
  supabase: SupabaseClient,
  userId: string,
  options: GetActivitiesOptions = {}
): Promise<ApiResponse<PaginatedActivities>> {
  const page = Math.max(1, options.page || 1);
  const limit = Math.min(100, Math.max(1, options.limit || 20));
  const offset = (page - 1) * limit;

  let query = supabase
    .from("activity_logs")
    .select("*", { count: "exact" })
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (options.entityType && options.entityType !== "all") {
    query = query.eq("entity_type", options.entityType);
  }

  const { data, count, error } = await query.range(offset, offset + limit - 1);

  if (error) {
    return { data: null, error: error.message };
  }

  const total = count ?? 0;
  const items = (data as ActivityLog[]).map((item) => ({
    ...item,
    icon_type: item.icon_type || (item.metadata?.icon_type as ActivityIconType) || item.entity_type,
  }));

  return {
    data: {
      items,
      total,
      page,
      limit,
      hasMore: offset + items.length < total,
    },
    error: null,
  };
}
