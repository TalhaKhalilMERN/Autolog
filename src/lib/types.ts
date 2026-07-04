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

export interface ServiceRecord {
  id: string;
  user_id: string;
  vehicle_id: string;
  service_type: string;
  service_date: string;
  mileage: number;
  cost: number;
  notes: string | null;
  next_service_date: string | null;
  next_service_mileage: number | null;
  created_at: string;
}

export type ServiceRecordInsert = Omit<ServiceRecord, "id" | "user_id" | "created_at">;
export type ServiceRecordUpdate = Partial<ServiceRecordInsert>;

export interface Expense {
  id: string;
  user_id: string;
  vehicle_id: string;
  service_record_id: string | null;
  category: string;
  title: string;
  amount: number;
  expense_date: string;
  mileage: number;
  notes: string | null;
  created_at: string;
}

export type ExpenseInsert = Omit<Expense, "id" | "user_id" | "created_at">;
export type ExpenseUpdate = Partial<ExpenseInsert>;

export interface DashboardStats {
  vehicleCount: number;
  upcomingServicesCount: number;
  totalExpenses: number;
  thisMonthExpenses?: number;
}

/** Generic typed API response wrapper */
export type ApiResponse<T> =
  | { data: T; error: null }
  | { data: null; error: string };
