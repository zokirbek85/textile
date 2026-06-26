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
export type WarehouseType = "cotton" | "fiber" | "wip" | "yarn" | "waste" | "other" | "tolling_raw_material" | "tolling_finished_goods";
export type ProductType = "raw_cotton" | "fiber" | "seed" | "lint" | "yarn" | "waste" | "other";

export interface Warehouse {
  id: string;
  name: string;
  code: string;
  warehouse_type: WarehouseType;
  warehouse_type_display: string;
  location: string;
  capacity_kg: string | null;
  notes: string;
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
  unit: string;
  description: string;
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
  // Tolling fields
  tolling_contract: string | null;
  tolling_customer_name?: string;
  processor_yarn_kg: string;
  customer_yarn_kg: string;
  loss_yarn_kg: string;
  service_fee_per_kg_fiber: string;
  total_service_fee: string;
  total_service_fee_with_vat: string;
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

// ─── Tolling ───────────────────────────────────────────────────────────────────
export type TollingContractStatus = "draft" | "active" | "suspended" | "completed" | "cancelled";
export type TollingContractType = "external" | "internal";
export type TollingReceiptStatus = "draft" | "received" | "in_production" | "completed";
export type TollingDeliveryStatus = "pending" | "ready" | "delivered" | "cancelled";
export type TollingInvoiceStatus = "draft" | "issued" | "paid" | "partially_paid" | "overdue" | "cancelled";

export interface TollingContract {
  id: string;
  contract_number: string;
  contract_date: string;
  contract_type: TollingContractType;
  contract_type_display: string;
  status: TollingContractStatus;
  status_display: string;
  customer_name: string;
  customer_inn: string;
  customer_address: string;
  customer_contact_person: string;
  customer_phone: string;
  start_date: string;
  end_date: string;
  days_until_expiry: number;
  is_active: boolean;
  yarn_price_usd: string;
  exchange_rate: string;
  processor_share_pct: string;
  customer_share_pct: string;
  loss_share_pct: string;
  target_yarn_product: string | null;
  target_yarn_product_name: string;
  min_fiber_quality_grade: string;
  max_waste_pct: string | null;
  vat_included: boolean;
  advance_payment_pct: string;
  payment_term_days: number;
  raw_material_warehouse: string | null;
  raw_material_warehouse_name: string;
  finished_goods_warehouse: string | null;
  finished_goods_warehouse_name: string;
  notes: string;
  created_at: string;
}

export interface TollingRawReceipt {
  id: string;
  contract: string;
  contract_number: string;
  customer_name: string;
  receipt_number: string;
  receipt_date: string;
  status: TollingReceiptStatus;
  status_display: string;
  ttn_number: string;
  fiber_product: string;
  fiber_product_name: string;
  quantity_kg: string;
  moisture_pct: string | null;
  impurity_pct: string | null;
  quality_grade: string;
  supplier_name: string;
  notes: string;
  created_at: string;
}

export interface TollingDelivery {
  id: string;
  contract: string;
  contract_number: string;
  customer_name: string;
  yarn_batch: string;
  batch_code: string;
  delivery_number: string;
  delivery_date: string;
  status: TollingDeliveryStatus;
  status_display: string;
  quantity_kg: string;
  delivery_act_number: string;
  ttn_number: string;
  quality_certificate_number: string;
  recipient_name: string;
  notes: string;
  created_at: string;
}

export interface TollingInvoice {
  id: string;
  contract: string;
  contract_number: string;
  customer_name: string;
  yarn_batch: string;
  batch_code: string;
  delivery: string | null;
  invoice_number: string;
  invoice_date: string;
  status: TollingInvoiceStatus;
  status_display: string;
  base_amount: string;
  vat_amount: string;
  total_amount: string;
  paid_amount: string;
  balance_due: string;
  is_overdue: boolean;
  payment_due_date: string;
  notes: string;
  created_at: string;
}

export interface TollingContractStats {
  total_fiber_received_kg: string;
  total_yarn_produced_kg: string;
  total_customer_yarn_kg: string;
  total_service_fee: string;
  total_paid: string;
  balance_due: string;
  days_until_expiry: number;
}

// ─── Production Management ────────────────────────────────────────────────────
export type ProductionLineType = "ginning" | "spinning" | "blending";
export type ProductionFactory = "paxta_zavodi" | "ip_zavodi";
export type ProductionOrderType = "direct" | "tolling" | "state";
export type ProductionOrderStatus = "draft" | "approved" | "in_progress" | "completed" | "cancelled";
export type ProductionShift = "shift_1" | "shift_2" | "shift_3" | "shift_4";
export type ProductionBatchStatus = "in_production" | "qc_pending" | "qc_passed" | "qc_failed" | "in_stock" | "shipped";
export type ShiftReportStatus = "draft" | "submitted" | "approved";

export interface ProductionLine {
  id: string;
  name: string;
  code: string;
  line_type: ProductionLineType;
  line_type_display: string;
  factory: ProductionFactory;
  factory_display: string;
  equipment_model: string;
  capacity_per_hour: string;
  is_active: boolean;
  installation_date: string | null;
  maintenance_schedule: string;
  notes: string;
  created_at: string;
}

export interface ProductionOrder {
  id: string;
  order_number: string;
  order_type: ProductionOrderType;
  order_type_display: string;
  status: ProductionOrderStatus;
  status_display: string;
  tolling_contract: string | null;
  tolling_contract_number: string | null;
  cotton_batch: string | null;
  yarn_batch: string | null;
  input_product: string;
  input_product_name: string;
  output_product: string;
  output_product_name: string;
  input_quantity_kg: string;
  planned_output_kg: string;
  actual_output_kg: string;
  waste_percentage: string;
  yarn_count: string;
  twist_per_meter: number | null;
  production_line: string;
  production_line_name: string;
  planned_start_date: string;
  planned_end_date: string;
  actual_start_date: string | null;
  actual_end_date: string | null;
  shift: ProductionShift;
  shift_display: string;
  brigade: 1 | 2 | 3 | 4;
  brigade_display: string;
  supervisor: string;
  supervisor_name: string;
  approved_by: string | null;
  approved_by_name: string | null;
  approved_at: string | null;
  completion_rate: string;
  is_delayed: boolean;
  batch_count: number;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface ProductionBatch {
  id: string;
  batch_number: string;
  production_order: string;
  order_number: string;
  status: ProductionBatchStatus;
  status_display: string;
  output_product: string;
  output_product_name: string;
  quantity_kg: string;
  yarn_count_actual: string;
  twist_actual: number | null;
  strength_cn: string | null;
  evenness_cv: string | null;
  production_date: string;
  shift: ProductionShift;
  shift_display: string;
  brigade: 1 | 2 | 3 | 4;
  machine_number: string;
  warehouse_location: string;
  pallet_number: string;
  qc_checked_at: string | null;
  qc_checked_by: string | null;
  qc_checked_by_name: string | null;
  qc_notes: string;
  notes: string;
  created_at: string;
}

export interface BatchTraceability {
  batch_number: string;
  order_number: string;
  order_type: string;
  production_line: string;
  input_product: string;
  output_product: string;
  quantity_kg: string;
  production_date: string;
  shift: string;
  brigade: number;
  tolling_contract_number: string | null;
  status: string;
}

export interface ProductionShiftReport {
  id: string;
  report_number: string;
  production_line: string;
  production_line_name: string;
  shift_date: string;
  shift: ProductionShift;
  shift_display: string;
  brigade: 1 | 2 | 3 | 4;
  supervisor: string;
  supervisor_name: string;
  workers_count: number;
  total_input_kg: string;
  total_output_kg: string;
  waste_kg: string;
  conversion_rate: string;
  planned_runtime_hours: string;
  actual_runtime_hours: string;
  downtime_hours: string;
  downtime_reason: string;
  electricity_kwh: string | null;
  gas_m3: string | null;
  water_m3: string | null;
  defect_count: number;
  defect_description: string;
  status: ShiftReportStatus;
  status_display: string;
  submitted_at: string | null;
  approved_by: string | null;
  approved_by_name: string | null;
  approved_at: string | null;
  oee_availability: string;
  oee_performance: string;
  notes: string;
  created_at: string;
}

export interface ProductionDashboard {
  total_orders: number;
  orders_in_progress: number;
  orders_delayed: number;
  orders_completed_today: number;
  total_output_today_kg: string;
  avg_conversion_rate: string;
  active_lines: number;
  pending_qc_batches: number;
}

export interface BrigadeAnalytics {
  brigade: number;
  label: string;
  report_count: number;
  avg_conversion: number | null;
  total_output: number | null;
  avg_availability: number | null;
}

// ─── Quality Control ───────────────────────────────────────────────────────────
export type QualityAppliesTo = "raw_cotton" | "cotton_fiber" | "yarn" | "sliver";
export type QualityDataType = "numeric" | "grade" | "pass_fail";
export type QualityTestType = "incoming_raw" | "in_process" | "final_product" | "periodic";
export type QualityTestResult = "pending" | "passed" | "failed" | "conditional" | "retest";
export type QualityGrade = "A" | "B" | "C" | "";
export type DefectSeverity = "critical" | "major" | "minor";
export type DefectStatus = "open" | "investigating" | "resolved" | "closed";
export type DefectDisposition = "use_as_is" | "reprocess" | "downgrade" | "scrap";
export type DetectionStage = "production" | "qc_inspection" | "packaging" | "customer";

export interface QualityParameter {
  id: string;
  parameter_code: string;
  parameter_name_uz: string;
  parameter_name_en: string;
  applies_to: QualityAppliesTo;
  applies_to_display: string;
  unit: string;
  data_type: QualityDataType;
  data_type_display: string;
  ozd_standard: string;
  min_value: string | null;
  max_value: string | null;
  optimal_value: string | null;
  testing_method: string;
  equipment_required: string;
  is_critical: boolean;
  is_active: boolean;
  created_at: string;
}

export interface QualityTestResultItem {
  id: string;
  parameter: string;
  parameter_code: string;
  parameter_name: string;
  parameter_unit: string;
  parameter_min: string | null;
  parameter_max: string | null;
  is_critical: boolean;
  data_type: QualityDataType;
  measured_value: string | null;
  measured_grade: string;
  is_within_spec: boolean;
  deviation_percentage: string | null;
  instrument_id: string;
  calibration_date: string | null;
  notes: string;
}

export interface QualityTest {
  id: string;
  test_number: string;
  test_type: QualityTestType;
  test_type_display: string;
  production_batch: string | null;
  batch_number: string | null;
  product: string;
  product_name: string;
  sample_size_kg: string;
  sample_location: string;
  sample_taken_date: string;
  sample_taken_by: string;
  sample_taken_by_name: string;
  test_date: string;
  tested_by: string;
  tested_by_name: string;
  lab_equipment: string;
  overall_result: QualityTestResult;
  overall_result_display: string;
  quality_grade: QualityGrade;
  approved_for_use: boolean;
  rejected: boolean;
  rejection_reason: string;
  reviewed_by: string | null;
  reviewed_by_name: string | null;
  reviewed_at: string | null;
  notes: string;
  created_at: string;
  test_results: QualityTestResultItem[];
  result_count: number;
  pass_count: number;
}

export interface QualityTestList {
  id: string;
  test_number: string;
  test_type: QualityTestType;
  test_type_display: string;
  batch_number: string | null;
  product_name: string;
  test_date: string;
  tested_by_name: string;
  overall_result: QualityTestResult;
  overall_result_display: string;
  quality_grade: QualityGrade;
  approved_for_use: boolean;
  created_at: string;
}

export interface QualityCertificate {
  id: string;
  certificate_number: string;
  production_batch: string;
  batch_number: string;
  product: string;
  product_name: string;
  quantity_kg: string;
  quality_grade: QualityGrade;
  quality_test: string;
  test_number: string;
  complies_with: string;
  issue_date: string;
  valid_until: string;
  issued_by: string;
  issued_by_name: string;
  approved_by: string;
  approved_by_name: string;
  is_active: boolean;
  cancelled_at: string | null;
  cancellation_reason: string;
  created_at: string;
}

export interface DefectType {
  id: string;
  defect_code: string;
  defect_name_uz: string;
  defect_name_en: string;
  severity: DefectSeverity;
  severity_display: string;
  applies_to: QualityAppliesTo;
  applies_to_display: string;
  auto_reject: boolean;
  requires_reprocessing: boolean;
  description: string;
  is_active: boolean;
}

export interface QualityDefect {
  id: string;
  defect_number: string;
  production_batch: string;
  batch_number: string;
  detection_stage: DetectionStage;
  detection_stage_display: string;
  defect_type: string;
  defect_type_code: string;
  defect_type_name: string;
  defect_severity: DefectSeverity;
  quantity_affected_kg: string;
  percentage_of_batch: string;
  detected_date: string;
  detected_by: string;
  detected_by_name: string;
  description: string;
  photo: string | null;
  root_cause: string;
  corrective_action: string;
  preventive_action: string;
  disposition: DefectDisposition | "";
  disposition_display: string;
  status: DefectStatus;
  status_display: string;
  resolved_date: string | null;
  resolved_by: string | null;
  resolved_by_name: string | null;
  created_at: string;
}

export interface QualityPassRate {
  total: number;
  passed: number;
  failed: number;
  pass_rate: number;
}

export interface QualityDefectPareto {
  defect_type__defect_code: string;
  defect_type__defect_name_uz: string;
  count: number;
  total_kg: string;
}

export interface QualityGradeDistribution {
  A: number;
  B: number;
  C: number;
}

export interface QualityComplianceScore {
  total_results: number;
  within_spec: number;
  compliance_score: number;
}

// ─── Maintenance ───────────────────────────────────────────────────────────────
export type EquipmentType =
  | "spinning_machine" | "winding_machine" | "carding_machine"
  | "drawing_machine" | "combing_machine" | "twisting_machine"
  | "weaving_machine" | "dyeing_machine" | "compressor"
  | "conveyor" | "other";

export type EquipmentStatus = "operational" | "maintenance" | "breakdown" | "idle" | "decommissioned";

export interface EquipmentList {
  id: string;
  equipment_code: string;
  equipment_name: string;
  equipment_type: EquipmentType;
  equipment_type_display: string;
  production_line_name: string | null;
  manufacturer: string;
  model: string;
  rated_capacity: string;
  capacity_unit: string;
  status: EquipmentStatus;
  status_display: string;
  next_maintenance_due: string | null;
  is_overdue: boolean;
  is_active: boolean;
}

export interface Equipment extends EquipmentList {
  production_line: string | null;
  serial_number: string;
  year_manufactured: number | null;
  spindles_count: number | null;
  installation_date: string | null;
  warranty_expires: string | null;
  location: string;
  maintenance_frequency_days: number;
  last_maintenance_date: string | null;
  total_operating_hours: string;
  photo: string | null;
  notes: string;
  created_at: string;
}

export type SparePartCategory =
  | "bearing" | "belt" | "electrical" | "pneumatic"
  | "hydraulic" | "spindle" | "roller" | "filter" | "other";

export interface SparePart {
  id: string;
  part_code: string;
  part_name: string;
  category: SparePartCategory;
  compatible_equipment: string[];
  compatible_equipment_codes: string[];
  manufacturer_part_number: string;
  supplier_name: string;
  lead_time_days: number;
  current_stock: number;
  unit_of_measure: string;
  minimum_stock: number;
  maximum_stock: number;
  unit_cost_uzs: string;
  last_purchase_date: string | null;
  storage_location: string;
  is_critical: boolean;
  is_active: boolean;
  needs_reorder: boolean;
}

export type MaintenanceType = "preventive" | "corrective" | "predictive" | "emergency" | "overhaul";
export type MaintenanceStatus = "scheduled" | "in_progress" | "completed" | "approved" | "cancelled";

export interface MaintenanceRecordList {
  id: string;
  record_number: string;
  equipment_code: string;
  equipment_name: string;
  maintenance_type: MaintenanceType;
  maintenance_type_display: string;
  scheduled_date: string;
  technician_name: string;
  total_cost_uzs: string;
  status: MaintenanceStatus;
  status_display: string;
  created_at: string;
}

export interface MaintenancePartUsage {
  id: string;
  spare_part: string;
  part_code: string;
  part_name: string;
  quantity_used: number;
  unit_cost_uzs: string;
  total_cost_uzs: string;
  removed_part_condition: string;
  condition_display: string;
  notes: string;
}

export interface MaintenanceRecord extends MaintenanceRecordList {
  equipment: string;
  scheduled_duration_hours: string;
  actual_start: string | null;
  actual_end: string | null;
  actual_duration_hours: string | null;
  assigned_technician: string;
  work_description: string;
  checklist_completed: boolean;
  findings: string;
  recommendations: string;
  labor_cost_uzs: string;
  parts_cost_uzs: string;
  approved_by: string | null;
  approved_by_name: string | null;
  approved_at: string | null;
  equipment_status_after: string | null;
  test_run_successful: boolean | null;
  part_usages: MaintenancePartUsage[];
}

export type DowntimeType = "breakdown" | "planned_maintenance" | "setup" | "material_shortage" | "power_outage" | "other";
export type DowntimeStatus = "active" | "resolved";

export interface EquipmentDowntime {
  id: string;
  downtime_number: string;
  equipment: string;
  equipment_code: string;
  equipment_name: string;
  start_time: string;
  end_time: string | null;
  duration_hours: string | null;
  downtime_type: DowntimeType;
  downtime_type_display: string;
  reason: string;
  problem_description: string;
  production_loss_kg: string;
  financial_loss_uzs: string;
  action_taken: string;
  resolved_by: string | null;
  resolved_by_name: string | null;
  maintenance_record: string | null;
  shift_report: string | null;
  status: DowntimeStatus;
  status_display: string;
  reported_by: string;
  reported_by_name: string;
  created_at: string;
}

export interface OEEMeasurement {
  id: string;
  equipment: string;
  equipment_code: string;
  equipment_name: string;
  measurement_date: string;
  shift: string;
  planned_production_time_hours: string;
  downtime_hours: string;
  availability_percentage: string;
  target_production_kg: string;
  actual_production_kg: string;
  performance_percentage: string;
  total_production_kg: string;
  defect_production_kg: string;
  quality_percentage: string;
  oee_percentage: string;
  shift_report: string | null;
  calculated_at: string;
}

export interface MaintenanceCostSummary {
  total_records: number;
  total_labor_cost: string;
  total_parts_cost: string;
  grand_total: string;
  by_type: Record<string, { count: number; total: string }>;
}

export interface DowntimeAnalytics {
  total_events: number;
  total_hours: string;
  mttr_hours: string;
  by_type: Record<string, { count: number; hours: string }>;
}

export interface OEEDashboard {
  avg_oee: string;
  avg_availability: string;
  avg_performance: string;
  avg_quality: string;
  by_equipment: Array<{
    equipment_code: string;
    equipment_name: string;
    latest_oee: string;
    measurement_count: number;
  }>;
}

// ─── Advanced Analytics (Module 4) ────────────────────────────────────────────

export type ForecastPeriod = "weekly" | "monthly" | "quarterly";
export type ForecastMethod = "moving_average" | "linear_regression" | "manual";
export type WidgetType = "kpi_card" | "bar_chart" | "line_chart" | "pie_chart" | "table" | "metric";

export interface StandardCost {
  id: string;
  product: string;
  product_name: string;
  product_code: string;
  cost_period_start: string;
  cost_period_end: string;
  raw_material_cost_per_kg: string;
  labor_cost_per_kg: string;
  overhead_cost_per_kg: string;
  energy_cost_per_kg: string;
  total_standard_cost_per_kg: string;
  approved_by: string | null;
  approved_by_name: string | null;
  notes: string;
  created_at: string;
}

export interface ActualCost {
  id: string;
  production_order: string | null;
  order_number: string | null;
  production_batch: string | null;
  batch_number: string | null;
  cost_date: string;
  raw_material_cost_uzs: string;
  labor_cost_uzs: string;
  overhead_cost_uzs: string;
  energy_cost_uzs: string;
  maintenance_cost_uzs: string;
  waste_cost_uzs: string;
  total_cost_uzs: string;
  quantity_kg: string;
  cost_per_kg: string;
  notes: string;
  created_at: string;
}

export interface ProfitabilityAnalysis {
  id: string;
  production_order: string | null;
  order_number: string | null;
  analysis_date: string;
  period_start: string | null;
  period_end: string | null;
  revenue_uzs: string;
  cogs_uzs: string;
  gross_profit_uzs: string;
  gross_margin_pct: string;
  overhead_allocated_uzs: string;
  net_profit_uzs: string;
  net_margin_pct: string;
  quantity_kg: string;
  revenue_per_kg: string;
  notes: string;
  created_at: string;
}

export interface ProductionKPI {
  id: string;
  production_line: string;
  production_line_name: string;
  production_line_code: string;
  kpi_date: string;
  shift: string;
  output_kg: string;
  target_kg: string;
  efficiency_pct: string;
  quality_pass_rate_pct: string;
  waste_pct: string;
  downtime_hours: string;
  cost_per_kg: string | null;
  oee_pct: string | null;
  energy_kwh: string | null;
  created_at: string;
}

export interface ProductionForecast {
  id: string;
  product: string;
  product_name: string;
  product_code: string;
  forecast_date: string;
  period: ForecastPeriod;
  period_display: string;
  period_start: string;
  period_end: string;
  forecast_quantity_kg: string;
  actual_quantity_kg: string | null;
  forecast_accuracy_pct: string | null;
  confidence_low_kg: string | null;
  confidence_high_kg: string | null;
  method: ForecastMethod;
  method_display: string;
  notes: string;
  created_at: string;
}

export interface DashboardWidget {
  id: string;
  widget_type: WidgetType;
  widget_type_display: string;
  title: string;
  config: Record<string, unknown>;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  is_active: boolean;
  created_at: string;
}

export interface CostBreakdownSummary {
  period: { start: string; end: string };
  record_count: number;
  total_cost_uzs: string;
  total_qty_kg: string;
  avg_cost_per_kg: string;
  breakdown: Record<string, { amount: string; pct: number }>;
}

export interface ProfitabilityExecutiveSummary {
  period: { start: string; end: string };
  revenue_uzs: string;
  cogs_uzs: string;
  gross_profit_uzs: string;
  net_profit_uzs: string;
  avg_net_margin_pct: string;
  total_qty_kg: string;
  analysis_count: number;
  total_production_cost_uzs: string;
}

export interface KPIDashboard {
  days: number;
  summary: {
    avg_efficiency_pct: string;
    avg_quality_pct: string;
    avg_oee_pct: string;
    avg_downtime_hours: string;
    total_output_kg: string;
    kpi_records: number;
  };
  by_line: Array<{
    production_line__name: string;
    production_line__code: string;
    avg_efficiency: number;
    avg_quality: number;
    avg_oee: number | null;
    total_output: number;
    records: number;
  }>;
}

export interface ExecutiveDashboard {
  days: number;
  production: {
    total_output_kg: string;
    total_input_kg: string;
    total_waste_kg: string;
    shift_count: number;
  };
  quality: { total_tests: number; passed: number; pass_rate_pct: number };
  oee: { avg_oee_pct: string };
  downtime: { active_events: number };
  profitability: { revenue_uzs: string; net_profit_uzs: string; avg_net_margin_pct: string };
  kpi_trend: Array<{ week: string; avg_eff: number; avg_quality: number; total_output: number }>;
}

export interface ForecastAccuracyReport {
  period: { start: string; end: string };
  avg_accuracy_pct: string;
  total_forecast_kg: string;
  total_actual_kg: string;
  evaluated_forecasts: number;
  by_product: Array<{ product__name: string; product__product_code: string; avg_accuracy: number; record_count: number }>;
}

export interface StandardVsActualComparison {
  product_id: string;
  period: { start: string; end: string };
  standard_cost_per_kg: string | null;
  actual_cost_per_kg: string;
  variance: string;
  total_qty_kg: string;
}
