/**
 * Shared domain types for AutoLog.
 * Used by API routes, services, and UI components.
 */

export interface Vehicle {
  id: string;
  user_id: string;
  created_at: string;
  make: string;
  model: string;
  year: number;
  variant: string | null;
  engine: string | null;
  transmission: string | null;
  fuel_type: string | null;
  registration_number: string | null;
  current_odometer: number | null;
}

export type VehicleInsert = Omit<Vehicle, "id" | "user_id" | "created_at">;

export interface DashboardStats {
  vehicleCount: number;
}

/** Generic typed API response wrapper */
export type ApiResponse<T> =
  | { data: T; error: null }
  | { data: null; error: string };
