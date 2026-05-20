// ─── Auth ──────────────────────────────────────────────────────────────────────
export type UserRole =
  | "admin" | "director" | "accountant"
  | "production_manager" | "warehouse_manager"
  | "lab_operator" | "sales_manager";

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  role_display: string;
  avatar: string | null;
  phone: string;
  department: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
  user: AuthUser;
}

// ─── Users ─────────────────────────────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: UserRole;
  role_display: string;
  avatar: string | null;
  phone: string;
  department: string;
  is_active: boolean;
  date_joined: string;
  last_login: string | null;
}

// ─── Warehouse ─────────────────────────────────────────────────────────────────
export type WarehouseType = "cotton" | "fiber" | "wip" | "yarn" | "waste" | "other";
export type ProductType = "raw_cotton" | "fiber" | "seed" | "lint" | "yarn" | "waste" | "other";

export interface Warehouse {
  id: string;
  name: string;
  code: string;
  warehouse_type: WarehouseType;
  warehouse_type_display: string;
  location: string;
  capacity_kg: string | null;
  is_active: boolean;
  total_stock_value: number;
  total_quantity_kg: number;
}

export interface Product {
  id: string;
  name: string;
  code: string;
  product_type: ProductType;
  product_type_display: string;
  category: string | null;
  category_name: string | null;
  yarn_count: string;
  yarn_type: string;
  is_active: boolean;
}

export interface StockLedgerEntry {
  id: string;
  warehouse: string;
  warehouse_name: string;
  product: string;
  product_name: string;
  product_code: string;
  product_type: ProductType;
  quantity_kg: string;
  avg_cost_per_kg: string;
  total_value: string;
  last_movement_at: string | null;
}

export interface StockMovement {
  id: string;
  warehouse_name: string;
  product_name: string;
  movement_type: string;
  movement_type_display: string;
  quantity_kg: string;
  cost_per_kg: string;
  total_cost: string;
  balance_after: string;
  movement_date: string;
  created_by_name: string;
  notes: string;
}

// ─── Production ────────────────────────────────────────────────────────────────
export type BatchStatus = "draft" | "in_progress" | "completed" | "cancelled";

export interface CottonBatch {
  id: string;
  batch_code: string;
  status: BatchStatus;
  status_display: string;
  start_date: string;
  end_date: string | null;
  cotton_input_kg: string;
  cotton_cost_total: string;
  fiber_output_kg: string;
  seed_output_kg: string;
  lint_output_kg: string;
  waste_output_kg: string;
  seed_credit_value: string;
  lint_credit_value: string;
  total_byproduct_credit: string;
  total_production_expenses: string;
  net_cost: string;
  calculated_fiber_cost_per_kg: string;
  fiber_yield_pct: string;
  notes: string;
  created_at: string;
  expenses?: BatchExpense[];
}

export interface YarnBatch {
  id: string;
  batch_code: string;
  status: BatchStatus;
  status_display: string;
  start_date: string;
  end_date: string | null;
  yarn_product: string | null;
  yarn_product_name: string;
  yarn_count: string;
  yarn_type: string;
  fiber_input_kg: string;
  fiber_cost_total: string;
  yarn_output_kg: string;
  waste_output_kg: string;
  waste_pct: string;
  efficiency_pct: string;
  total_spinning_expenses: string;
  net_cost: string;
  calculated_yarn_cost_per_kg: string;
  notes: string;
  created_at: string;
  expenses?: BatchExpense[];
}

export interface BatchExpense {
  id: string;
  category: string;
  category_display: string;
  description: string;
  amount: string;
  quantity: string | null;
  unit: string;
  expense_date: string;
}

// ─── Costing ───────────────────────────────────────────────────────────────────
export interface CostSnapshot {
  id: string;
  stage: string;
  stage_display: string;
  snapshot_date: string;
  input_kg: string;
  output_kg: string;
  output_cost_per_kg: string;
  total_output_cost: string;
  expenses_breakdown: Record<string, number>;
  yield_pct: string;
  waste_pct: string;
  product_name: string | null;
}

export interface YarnCurrentCost {
  product_id: string;
  product_name: string;
  yarn_count: string;
  yarn_type: string;
  cost_per_kg: string | null;
  snapshot_date: string | null;
}

export interface CostTrendPoint {
  week: string;
  avg_cost: number;
  batches: number;
}

// ─── Dashboard ─────────────────────────────────────────────────────────────────
export interface DashboardOverview {
  today: { fiber_produced_kg: number; yarn_produced_kg: number; date: string };
  this_month: {
    fiber_kg: number;
    yarn_kg: number;
    avg_yarn_cost_per_kg: number | null;
    cotton_batches_completed: number;
    yarn_batches_completed: number;
  };
  active_batches: { cotton: number; yarn: number };
  warehouses: Array<{
    id: string; name: string; type: string;
    total_kg: number; total_value: number;
  }>;
  current_yarn_costs: YarnCurrentCost[];
  yarn_cost_trend: CostTrendPoint[];
  machine_efficiency: Array<{
    machine__name: string; machine__code: string;
    avg_efficiency: number; total_yarn: number; shifts: number;
  }>;
}

export interface ProductionTrendPoint {
  date: string;
  fiber_kg: number;
  yarn_kg: number;
  waste_kg: number;
}

// ─── Finance ───────────────────────────────────────────────────────────────────
export interface FinancialTransaction {
  id: string;
  transaction_date: string;
  transaction_type: string;
  transaction_type_display: string;
  amount: string;
  description: string;
  is_expense: boolean;
  expense_category: string;
  created_by_name: string;
}

export interface FinancialSummary {
  period: { start: string; end: string };
  total_expenses: number;
  total_income: number;
  net: number;
  expenses_by_category: Record<string, number>;
}

// ─── API Pagination ────────────────────────────────────────────────────────────
export interface PaginatedResponse<T> {
  count: number;
  total_pages: number;
  current_page: number;
  page_size: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// ─── Notifications ─────────────────────────────────────────────────────────────
export interface Notification {
  id: string;
  level: "info" | "success" | "warning" | "error";
  event_type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}
