import type { SupabaseClient } from "@supabase/supabase-js";
import type { ApiResponse } from "@/lib/types";

export interface MonthlySpendingData {
  yearMonth: string; // "2026-01"
  month: string; // "Jan 2026"
  shortMonth: string; // "Jan"
  fuel: number;
  services: number;
  manual: number;
  total: number;
}

export interface ExpenseBreakdownData {
  category: string;
  name: string;
  amount: number;
  percentage: number;
  color: string;
}

export interface VehicleCostData {
  vehicleId: string;
  name: string;
  fuel: number;
  services: number;
  manual: number;
  total: number;
}

export interface FuelEconomyDataPoint {
  id: string;
  date: string;
  formattedDate: string;
  vehicleId: string;
  vehicleName: string;
  kmPerLiter: number;
  distanceKm: number;
  liters: number;
}

export interface FuelEconomyVehicleSeries {
  vehicleId: string;
  vehicleName: string;
  points: FuelEconomyDataPoint[];
  avgKmPerLiter: number;
}

export interface DashboardAnalyticsData {
  monthlySpending: MonthlySpendingData[];
  expenseBreakdown: ExpenseBreakdownData[];
  vehicleCosts: VehicleCostData[];
  fuelEconomy: {
    overallTrend: FuelEconomyDataPoint[];
    byVehicle: FuelEconomyVehicleSeries[];
    hasEnoughData: boolean;
    totalFullTankLogs: number;
  };
  totalLifetimeSpending: number;
}

/**
 * Dashboard Analytics Service
 *
 * Runs parallel queries on Supabase tables to generate real aggregated chart data.
 */
export async function getDashboardAnalytics(
  supabase: SupabaseClient
): Promise<ApiResponse<DashboardAnalyticsData>> {
  // Fetch vehicles, fuel logs, service records, and expenses in parallel
  const [vehiclesRes, fuelLogsRes, serviceRecordsRes, expensesRes] = await Promise.all([
    supabase
      .from("vehicles")
      .select("id, make, model, year")
      .order("created_at", { ascending: true }),
    supabase
      .from("fuel_logs")
      .select("id, vehicle_id, log_date, odometer, liters, total_cost, is_full_tank")
      .order("log_date", { ascending: true })
      .order("odometer", { ascending: true }),
    supabase
      .from("service_records")
      .select("id, vehicle_id, service_date, cost, service_type")
      .order("service_date", { ascending: true }),
    supabase
      .from("expenses")
      .select("id, vehicle_id, expense_date, amount, category, service_record_id")
      .order("expense_date", { ascending: true }),
  ]);

  if (vehiclesRes.error) return { data: null, error: vehiclesRes.error.message };
  if (fuelLogsRes.error) return { data: null, error: fuelLogsRes.error.message };
  if (serviceRecordsRes.error) return { data: null, error: serviceRecordsRes.error.message };
  if (expensesRes.error) return { data: null, error: expensesRes.error.message };

  const vehicles = vehiclesRes.data || [];
  const fuelLogs = fuelLogsRes.data || [];
  const serviceRecords = serviceRecordsRes.data || [];
  const expenses = expensesRes.data || [];

  // Vehicle map for lookup
  const vehicleMap = new Map<string, string>();
  vehicles.forEach((v) => {
    vehicleMap.set(v.id, `${v.year ? `${v.year} ` : ""}${v.make} ${v.model}`.trim());
  });

  // ── 1. MONTHLY SPENDING (Last 12 Months) ────────────────────────────────────
  const monthlySpendingMap = new Map<string, { fuel: number; services: number; manual: number }>();

  // Generate last 12 months array
  const now = new Date();
  const monthKeys: string[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const yearMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthKeys.push(yearMonth);
    monthlySpendingMap.set(yearMonth, { fuel: 0, services: 0, manual: 0 });
  }

  // Populate fuel spending
  fuelLogs.forEach((f) => {
    if (!f.log_date) return;
    const ym = f.log_date.substring(0, 7);
    if (monthlySpendingMap.has(ym)) {
      const entry = monthlySpendingMap.get(ym)!;
      entry.fuel += Number(f.total_cost || 0);
    }
  });

  // Populate service spending
  serviceRecords.forEach((s) => {
    if (!s.service_date) return;
    const ym = s.service_date.substring(0, 7);
    if (monthlySpendingMap.has(ym)) {
      const entry = monthlySpendingMap.get(ym)!;
      entry.services += Number(s.cost || 0);
    }
  });

  // Populate manual expenses (excluding service_records linked rows to avoid duplicate count)
  expenses.forEach((e) => {
    if (e.service_record_id) return; // linked to service_record already counted
    if (!e.expense_date) return;
    const ym = e.expense_date.substring(0, 7);
    if (monthlySpendingMap.has(ym)) {
      const entry = monthlySpendingMap.get(ym)!;
      const catLower = (e.category || "").toLowerCase();
      if (catLower.includes("fuel")) {
        entry.fuel += Number(e.amount || 0);
      } else if (catLower.includes("service") || catLower.includes("maintenance")) {
        entry.services += Number(e.amount || 0);
      } else {
        entry.manual += Number(e.amount || 0);
      }
    }
  });

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const monthlySpending: MonthlySpendingData[] = monthKeys.map((ym) => {
    const [yearStr, monthStr] = ym.split("-");
    const monthIndex = parseInt(monthStr, 10) - 1;
    const shortMonth = monthNames[monthIndex];
    const fullMonth = `${shortMonth} ${yearStr}`;
    const data = monthlySpendingMap.get(ym) || { fuel: 0, services: 0, manual: 0 };
    const fuel = Math.round(data.fuel * 100) / 100;
    const services = Math.round(data.services * 100) / 100;
    const manual = Math.round(data.manual * 100) / 100;
    const total = Math.round((fuel + services + manual) * 100) / 100;

    return {
      yearMonth: ym,
      month: fullMonth,
      shortMonth,
      fuel,
      services,
      manual,
      total,
    };
  });

  // ── 2. EXPENSE BREAKDOWN (Donut Chart) ──────────────────────────────────────
  let totalFuel = fuelLogs.reduce((sum, f) => sum + Number(f.total_cost || 0), 0);
  let totalServices = serviceRecords.reduce((sum, s) => sum + Number(s.cost || 0), 0);
  let totalOther = 0;

  expenses.forEach((e) => {
    if (e.service_record_id) return;
    const catLower = (e.category || "").toLowerCase();
    if (catLower.includes("fuel")) {
      totalFuel += Number(e.amount || 0);
    } else if (catLower.includes("service") || catLower.includes("maintenance")) {
      totalServices += Number(e.amount || 0);
    } else {
      totalOther += Number(e.amount || 0);
    }
  });

  totalFuel = Math.round(totalFuel * 100) / 100;
  totalServices = Math.round(totalServices * 100) / 100;
  totalOther = Math.round(totalOther * 100) / 100;
  const totalLifetimeSpending = Math.round((totalFuel + totalServices + totalOther) * 100) / 100;

  const expenseBreakdown: ExpenseBreakdownData[] = [
    {
      category: "fuel",
      name: "Fuel",
      amount: totalFuel,
      percentage: totalLifetimeSpending > 0 ? Math.round((totalFuel / totalLifetimeSpending) * 1000) / 10 : 0,
      color: "var(--primary)",
    },
    {
      category: "services",
      name: "Services / Maintenance",
      amount: totalServices,
      percentage: totalLifetimeSpending > 0 ? Math.round((totalServices / totalLifetimeSpending) * 1000) / 10 : 0,
      color: "#10b981", // emerald-500
    },
    {
      category: "other",
      name: "Other Expenses",
      amount: totalOther,
      percentage: totalLifetimeSpending > 0 ? Math.round((totalOther / totalLifetimeSpending) * 1000) / 10 : 0,
      color: "#f59e0b", // amber-500
    },
  ];

  // ── 3. VEHICLE COST COMPARISON (Horizontal Bar Chart) ───────────────────────
  const vehicleCostMap = new Map<string, { fuel: number; services: number; manual: number }>();

  // Initialize for all existing vehicles
  vehicles.forEach((v) => {
    vehicleCostMap.set(v.id, { fuel: 0, services: 0, manual: 0 });
  });

  fuelLogs.forEach((f) => {
    if (!f.vehicle_id) return;
    const entry = vehicleCostMap.get(f.vehicle_id) || { fuel: 0, services: 0, manual: 0 };
    entry.fuel += Number(f.total_cost || 0);
    vehicleCostMap.set(f.vehicle_id, entry);
  });

  serviceRecords.forEach((s) => {
    if (!s.vehicle_id) return;
    const entry = vehicleCostMap.get(s.vehicle_id) || { fuel: 0, services: 0, manual: 0 };
    entry.services += Number(s.cost || 0);
    vehicleCostMap.set(s.vehicle_id, entry);
  });

  expenses.forEach((e) => {
    if (e.service_record_id || !e.vehicle_id) return;
    const entry = vehicleCostMap.get(e.vehicle_id) || { fuel: 0, services: 0, manual: 0 };
    const catLower = (e.category || "").toLowerCase();
    if (catLower.includes("fuel")) {
      entry.fuel += Number(e.amount || 0);
    } else if (catLower.includes("service") || catLower.includes("maintenance")) {
      entry.services += Number(e.amount || 0);
    } else {
      entry.manual += Number(e.amount || 0);
    }
    vehicleCostMap.set(e.vehicle_id, entry);
  });

  const vehicleCosts: VehicleCostData[] = Array.from(vehicleCostMap.entries())
    .map(([vId, data]) => {
      const fuel = Math.round(data.fuel * 100) / 100;
      const services = Math.round(data.services * 100) / 100;
      const manual = Math.round(data.manual * 100) / 100;
      const total = Math.round((fuel + services + manual) * 100) / 100;
      return {
        vehicleId: vId,
        name: vehicleMap.get(vId) || "Unknown Vehicle",
        fuel,
        services,
        manual,
        total,
      };
    })
    .filter((v) => v.total > 0)
    .sort((a, b) => b.total - a.total); // Sort highest cost first

  // ── 4. FUEL ECONOMY TREND (Line Chart — Full Tank Only) ─────────────────────
  // Group fuel logs by vehicle_id
  const fuelLogsByVehicle = new Map<string, typeof fuelLogs>();
  fuelLogs.forEach((log) => {
    if (!log.vehicle_id) return;
    const list = fuelLogsByVehicle.get(log.vehicle_id) || [];
    list.push(log);
    fuelLogsByVehicle.set(log.vehicle_id, list);
  });

  const overallTrendPoints: FuelEconomyDataPoint[] = [];
  const vehicleSeries: FuelEconomyVehicleSeries[] = [];
  let totalFullTankLogsCount = 0;

  fuelLogsByVehicle.forEach((logs, vId) => {
    // Sort ascending by odometer
    logs.sort((a, b) => Number(a.odometer || 0) - Number(b.odometer || 0));

    const fullTankLogs = logs.filter((l) => l.is_full_tank);
    totalFullTankLogsCount += fullTankLogs.length;

    const vName = vehicleMap.get(vId) || "Vehicle";
    const vPoints: FuelEconomyDataPoint[] = [];

    // Calculate km/L for consecutive full tank logs
    for (let i = 1; i < fullTankLogs.length; i++) {
      const prev = fullTankLogs[i - 1];
      const curr = fullTankLogs[i];

      const dist = Number(curr.odometer) - Number(prev.odometer);
      const liters = Number(curr.liters);

      if (dist > 0 && liters > 0) {
        const kmPerLiter = Math.round((dist / liters) * 100) / 100;
        const d = new Date(curr.log_date);
        const formattedDate = !isNaN(d.getTime())
          ? d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
          : curr.log_date;

        const point: FuelEconomyDataPoint = {
          id: curr.id,
          date: curr.log_date,
          formattedDate,
          vehicleId: vId,
          vehicleName: vName,
          kmPerLiter,
          distanceKm: dist,
          liters,
        };

        vPoints.push(point);
        overallTrendPoints.push(point);
      }
    }

    if (vPoints.length > 0) {
      const avgKmL =
        Math.round(
          (vPoints.reduce((sum, p) => sum + p.kmPerLiter, 0) / vPoints.length) * 100
        ) / 100;
      vehicleSeries.push({
        vehicleId: vId,
        vehicleName: vName,
        points: vPoints,
        avgKmPerLiter: avgKmL,
      });
    }
  });

  // Sort overall trend by date ascending
  overallTrendPoints.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const hasEnoughData = overallTrendPoints.length >= 1;

  return {
    data: {
      monthlySpending,
      expenseBreakdown,
      vehicleCosts,
      fuelEconomy: {
        overallTrend: overallTrendPoints,
        byVehicle: vehicleSeries,
        hasEnoughData,
        totalFullTankLogs: totalFullTankLogsCount,
      },
      totalLifetimeSpending,
    },
    error: null,
  };
}
