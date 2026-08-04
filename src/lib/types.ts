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
  serviceRecordCount: number;
  totalExpenses: number;
  thisMonthExpenses: number;
  activeRemindersCount: number;
  overdueRemindersCount: number;
  upcomingRemindersCount: number; // next 7 days
}

export interface MaintenanceReminder {
  id: string;
  user_id: string;
  vehicle_id: string;
  title: string;
  description: string | null;
  reminder_type: string;
  due_date: string | null;
  due_odometer: number | null;
  status: "pending" | "completed" | "cancelled";
  created_at: string;
  updated_at: string;
}

export type MaintenanceReminderInsert = Omit<MaintenanceReminder, "id" | "user_id" | "created_at" | "updated_at">;
export type MaintenanceReminderUpdate = Partial<MaintenanceReminderInsert>;

/** Generic typed API response wrapper */
export type ApiResponse<T> =
  | { data: T; error: null }
  | { data: null; error: string };

export interface UserSettings {
  user_id: string;
  email_notifications: boolean;
  notification_days_before: number;
  notify_by_odometer: boolean;
  odometer_threshold: number;
  notification_frequency: "once" | "daily";
  created_at: string;
  updated_at: string;
}

export type UserSettingsUpdate = Partial<Omit<UserSettings, "user_id" | "created_at" | "updated_at">>;

export interface UserProfile {
  email: string;
  created_at: string;
  full_name: string;
  country: string | null;
  timezone: string | null;
}

export type UserProfileUpdate = {
  full_name: string;
  country?: string | null;
  timezone?: string | null;
};

export type ActivityEntityType =
  | "vehicle"
  | "service"
  | "expense"
  | "reminder"
  | "fuel"
  | "settings"
  | "security"
  | "profile";

export type ActivityIconType = ActivityEntityType;

export interface ActivityLog {
  id: string;
  user_id: string;
  entity_type: ActivityEntityType;
  entity_id: string | null;
  action: string;
  title: string;
  description: string;
  metadata?: Record<string, any> | null;
  icon_type?: ActivityIconType;
  created_at: string;
}

export type ActivityLogInsert = Omit<ActivityLog, "id" | "created_at">;

/**
 * Fuel Log — represents a single refuelling event for a vehicle.
 */
export interface FuelLog {
  id: string;
  user_id: string;
  vehicle_id: string;
  log_date: string;
  odometer: number;
  liters: number;
  price_per_liter: number;
  total_cost: number;
  fuel_type: string | null;
  fuel_station: string | null;
  is_full_tank: boolean;
  notes: string | null;
  created_at: string;
}

export type FuelLogInsert = Omit<FuelLog, "id" | "user_id" | "created_at">;
export type FuelLogUpdate = Partial<FuelLogInsert>;
