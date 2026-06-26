import api from "./axios";
import type {
  AuthTokens, User, PaginatedResponse,
  Warehouse, Product, StockLedgerEntry, StockMovement,
  CottonBatch, YarnBatch,
  CostSnapshot, YarnCurrentCost, CostTrendPoint,
  DashboardOverview, ProductionTrendPoint,
  FinancialTransaction, FinancialSummary,
  TollingContract, TollingRawReceipt, TollingDelivery, TollingInvoice, TollingContractStats,
  ProductionLine, ProductionOrder, ProductionBatch, ProductionShiftReport,
  ProductionDashboard, BrigadeAnalytics, BatchTraceability,
  QualityParameter, QualityTest, QualityTestList, QualityTestResultItem,
  QualityCertificate, DefectType, QualityDefect,
  QualityPassRate, QualityDefectPareto, QualityGradeDistribution, QualityComplianceScore,
  EquipmentList, Equipment, SparePart, MaintenanceRecordList, MaintenanceRecord,
  EquipmentDowntime, OEEMeasurement, MaintenanceCostSummary, DowntimeAnalytics, OEEDashboard,
  StandardCost, ActualCost, ProfitabilityAnalysis, ProductionKPI, ProductionForecast, DashboardWidget,
  CostBreakdownSummary, ProfitabilityExecutiveSummary, KPIDashboard, ExecutiveDashboard,
  ForecastAccuracyReport, StandardVsActualComparison,
} from "@/types";

// ─── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    api.post<AuthTokens>("/auth/login/", { email, password }),
  logout: (refresh: string) =>
    api.post("/auth/logout/", { refresh }),
  refreshToken: (refresh: string) =>
    api.post<{ access: string }>("/auth/token/refresh/", { refresh }),
};

// ─── Users ─────────────────────────────────────────────────────────────────────
export const usersApi = {
  list: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<User>>("/users/", { params }),
  me: () => api.get<User>("/users/me/"),
  get: (id: string) => api.get<User>(`/users/${id}/`),
  create: (data: unknown) => api.post<User>("/users/", data),
  update: (id: string, data: unknown) => api.patch<User>(`/users/${id}/`, data),
  deactivate: (id: string) => api.post(`/users/${id}/deactivate/`),
  activate: (id: string) => api.post(`/users/${id}/activate/`),
  changePassword: (data: unknown) => api.post("/users/change-password/", data),
};

// ─── Warehouse ─────────────────────────────────────────────────────────────────
export const warehouseApi = {
  listWarehouses: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<Warehouse>>("/warehouse/warehouses/", { params }),
  getWarehouse: (id: string) =>
    api.get<Warehouse>(`/warehouse/warehouses/${id}/`),
  createWarehouse: (data: unknown) =>
    api.post<Warehouse>("/warehouse/warehouses/", data),
  updateWarehouse: (id: string, data: unknown) =>
    api.patch<Warehouse>(`/warehouse/warehouses/${id}/`, data),
  deleteWarehouse: (id: string) =>
    api.delete(`/warehouse/warehouses/${id}/`),
  getWarehouseBalances: (id: string) =>
    api.get<unknown[]>(`/warehouse/warehouses/${id}/balances/`),
  receiveStock: (data: unknown) =>
    api.post("/warehouse/warehouses/receive/", data),
  transferStock: (data: unknown) =>
    api.post("/warehouse/warehouses/transfer/", data),

  listProducts: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<Product>>("/warehouse/products/", { params }),
  getProduct: (id: string) =>
    api.get<Product>(`/warehouse/products/${id}/`),
  createProduct: (data: unknown) =>
    api.post<Product>("/warehouse/products/", data),
  updateProduct: (id: string, data: unknown) =>
    api.patch<Product>(`/warehouse/products/${id}/`, data),
  deleteProduct: (id: string) =>
    api.delete(`/warehouse/products/${id}/`),

  listLedger: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<StockLedgerEntry>>("/warehouse/ledger/", { params }),
  listMovements: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<StockMovement>>("/warehouse/movements/", { params }),
};

// ─── Cotton Production ─────────────────────────────────────────────────────────
export const cottonApi = {
  listBatches: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<CottonBatch>>("/cotton-production/batches/", { params }),
  getBatch: (id: string) =>
    api.get<CottonBatch>(`/cotton-production/batches/${id}/`),
  createBatch: (data: unknown) =>
    api.post<CottonBatch>("/cotton-production/batches/", data),
  addCotton: (id: string, data: unknown) =>
    api.post<CottonBatch>(`/cotton-production/batches/${id}/add-cotton/`, data),
  addExpense: (id: string, data: unknown) =>
    api.post<CottonBatch>(`/cotton-production/batches/${id}/add-expense/`, data),
  completeBatch: (id: string, data: unknown) =>
    api.post<CottonBatch>(`/cotton-production/batches/${id}/complete/`, data),
  getCostBreakdown: (id: string) =>
    api.get(`/cotton-production/batches/${id}/cost-breakdown/`),
  listShifts: (params?: Record<string, unknown>) =>
    api.get("/cotton-production/shifts/", { params }),
};

// ─── Yarn Production ───────────────────────────────────────────────────────────
export const yarnApi = {
  listBatches: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<YarnBatch>>("/yarn-production/batches/", { params }),
  getBatch: (id: string) =>
    api.get<YarnBatch>(`/yarn-production/batches/${id}/`),
  createBatch: (data: unknown) =>
    api.post<YarnBatch>("/yarn-production/batches/", data),
  addFiber: (id: string, data: unknown) =>
    api.post<YarnBatch>(`/yarn-production/batches/${id}/add-fiber/`, data),
  addExpense: (id: string, data: unknown) =>
    api.post<YarnBatch>(`/yarn-production/batches/${id}/add-expense/`, data),
  completeBatch: (id: string, data: unknown) =>
    api.post<YarnBatch>(`/yarn-production/batches/${id}/complete/`, data),
  completeTolling: (id: string, data: unknown) =>
    api.post(`/yarn-production/batches/${id}/complete-tolling/`, data),
  getCostBreakdown: (id: string) =>
    api.get(`/yarn-production/batches/${id}/cost-breakdown/`),
  listShifts: (params?: Record<string, unknown>) =>
    api.get("/yarn-production/shifts/", { params }),
};

// ─── Costing ───────────────────────────────────────────────────────────────────
export const costingApi = {
  listSnapshots: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<CostSnapshot>>("/costing/snapshots/", { params }),
  currentYarnCosts: () =>
    api.get<YarnCurrentCost[]>("/costing/current-yarn-costs/"),
  costTrend: (params: { stage?: string; days?: number; product_id?: string }) =>
    api.get<CostTrendPoint[]>("/costing/cost-trend/", { params }),
  expenseBreakdown: (params: { stage?: string; start_date?: string; end_date?: string }) =>
    api.get<Record<string, number>>("/costing/expense-breakdown/", { params }),
  kpiSummary: (as_of?: string) =>
    api.get("/costing/kpi-summary/", { params: as_of ? { as_of } : {} }),
};

// ─── Dashboard ─────────────────────────────────────────────────────────────────
export const dashboardApi = {
  overview: () => api.get<DashboardOverview>("/dashboard/overview/"),
  productionTrend: (days?: number) =>
    api.get<ProductionTrendPoint[]>("/dashboard/production-trend/", {
      params: days ? { days } : {},
    }),
};

// ─── Finance ───────────────────────────────────────────────────────────────────
export const financeApi = {
  listTransactions: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<FinancialTransaction>>("/finance/transactions/", { params }),
  createTransaction: (data: unknown) =>
    api.post<FinancialTransaction>("/finance/transactions/", data),
  getSummary: (params: { start_date?: string; end_date?: string }) =>
    api.get<FinancialSummary>("/finance/summary/", { params }),
};

// ─── Reports ───────────────────────────────────────────────────────────────────
export const reportsApi = {
  yarnCost: (params: { start_date?: string; end_date?: string; format?: string }) =>
    api.get("/reports/yarn-cost/", { params, responseType: params.format === "excel" ? "blob" : "json" }),
  fiberCost: (params: { start_date?: string; end_date?: string; format?: string }) =>
    api.get("/reports/fiber-cost/", { params, responseType: params.format === "excel" ? "blob" : "json" }),
  warehouseBalance: (params?: { format?: string }) =>
    api.get("/reports/warehouse-balance/", { params, responseType: params?.format === "excel" ? "blob" : "json" }),
  wasteAnalysis: (params: { start_date?: string; end_date?: string }) =>
    api.get("/reports/waste-analysis/", { params }),
};

// ─── Analytics ─────────────────────────────────────────────────────────────────
export const analyticsApi = {
  machineEfficiency: (days?: number) =>
    api.get("/analytics/machine-efficiency/", { params: { days } }),
  operatorAnalytics: (days?: number) =>
    api.get("/analytics/operator/", { params: { days } }),
  costComparison: (limit?: number) =>
    api.get("/analytics/cost-comparison/", { params: { limit } }),
  productionOverview: () =>
    api.get("/analytics/production-overview/"),
};

// ─── Tolling ───────────────────────────────────────────────────────────────────
export const tollingApi = {
  // Contracts
  listContracts: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<TollingContract>>("/tolling/contracts/", { params }),
  getContract: (id: string) =>
    api.get<TollingContract>(`/tolling/contracts/${id}/`),
  createContract: (data: unknown) =>
    api.post<TollingContract>("/tolling/contracts/", data),
  updateContract: (id: string, data: unknown) =>
    api.patch<TollingContract>(`/tolling/contracts/${id}/`, data),
  activateContract: (id: string) =>
    api.post<TollingContract>(`/tolling/contracts/${id}/activate/`),
  suspendContract: (id: string) =>
    api.post<TollingContract>(`/tolling/contracts/${id}/suspend/`),
  completeContract: (id: string) =>
    api.post<TollingContract>(`/tolling/contracts/${id}/complete/`),
  getContractStats: (id: string) =>
    api.get<TollingContractStats>(`/tolling/contracts/${id}/statistics/`),
  getContractReceipts: (id: string) =>
    api.get<TollingRawReceipt[]>(`/tolling/contracts/${id}/receipts/`),
  getContractDeliveries: (id: string) =>
    api.get<TollingDelivery[]>(`/tolling/contracts/${id}/deliveries/`),
  getContractInvoices: (id: string) =>
    api.get<TollingInvoice[]>(`/tolling/contracts/${id}/invoices/`),

  // Receipts
  createReceipt: (data: unknown) =>
    api.post<TollingRawReceipt>("/tolling/receipts/", data),
  receiveRawMaterial: (id: string) =>
    api.post<TollingRawReceipt>(`/tolling/receipts/${id}/receive/`),

  // Deliveries
  createDelivery: (data: unknown) =>
    api.post<TollingDelivery>("/tolling/deliveries/", data),
  completeDelivery: (id: string) =>
    api.post(`/tolling/deliveries/${id}/complete/`),

  // Invoices
  listInvoices: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<TollingInvoice>>("/tolling/invoices/", { params }),
  recordPayment: (id: string, amount: string) =>
    api.post<TollingInvoice>(`/tolling/invoices/${id}/record-payment/`, { amount }),
};

// ─── Production Management ─────────────────────────────────────────────────────
export const productionApi = {
  // Lines
  listLines: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<ProductionLine>>("/production/lines/", { params }),
  getLine: (id: string) =>
    api.get<ProductionLine>(`/production/lines/${id}/`),
  createLine: (data: unknown) =>
    api.post<ProductionLine>("/production/lines/", data),
  updateLine: (id: string, data: unknown) =>
    api.patch<ProductionLine>(`/production/lines/${id}/`, data),
  getLineSchedule: (id: string) =>
    api.get<ProductionOrder[]>(`/production/lines/${id}/schedule/`),
  getLineUtilization: (id: string) =>
    api.get(`/production/lines/${id}/utilization/`),

  // Orders
  listOrders: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<ProductionOrder>>("/production/orders/", { params }),
  getOrder: (id: string) =>
    api.get<ProductionOrder>(`/production/orders/${id}/`),
  createOrder: (data: unknown) =>
    api.post<ProductionOrder>("/production/orders/", data),
  updateOrder: (id: string, data: unknown) =>
    api.patch<ProductionOrder>(`/production/orders/${id}/`, data),
  approveOrder: (id: string) =>
    api.post<ProductionOrder>(`/production/orders/${id}/approve/`),
  startOrder: (id: string) =>
    api.post<ProductionOrder>(`/production/orders/${id}/start/`),
  completeOrder: (id: string) =>
    api.post<ProductionOrder>(`/production/orders/${id}/complete/`),
  cancelOrder: (id: string, reason?: string) =>
    api.post<ProductionOrder>(`/production/orders/${id}/cancel/`, { reason }),
  getOrderBatches: (id: string) =>
    api.get<ProductionBatch[]>(`/production/orders/${id}/batches/`),

  // Batches
  listBatches: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<ProductionBatch>>("/production/batches/", { params }),
  getBatch: (id: string) =>
    api.get<ProductionBatch>(`/production/batches/${id}/`),
  createBatch: (data: unknown) =>
    api.post<ProductionBatch>("/production/batches/", data),
  updateBatch: (id: string, data: unknown) =>
    api.patch<ProductionBatch>(`/production/batches/${id}/`, data),
  updateBatchQC: (id: string, data: unknown) =>
    api.post<ProductionBatch>(`/production/batches/${id}/qc-update/`, data),
  getBatchTraceability: (id: string) =>
    api.get<BatchTraceability>(`/production/batches/${id}/traceability/`),

  // Shift Reports
  listShiftReports: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<ProductionShiftReport>>("/production/shift-reports/", { params }),
  getShiftReport: (id: string) =>
    api.get<ProductionShiftReport>(`/production/shift-reports/${id}/`),
  createShiftReport: (data: unknown) =>
    api.post<ProductionShiftReport>("/production/shift-reports/", data),
  updateShiftReport: (id: string, data: unknown) =>
    api.patch<ProductionShiftReport>(`/production/shift-reports/${id}/`, data),
  submitShiftReport: (id: string) =>
    api.post<ProductionShiftReport>(`/production/shift-reports/${id}/submit/`),
  approveShiftReport: (id: string) =>
    api.post<ProductionShiftReport>(`/production/shift-reports/${id}/approve/`),
  getShiftAnalytics: (params?: { start_date?: string; end_date?: string }) =>
    api.get<BrigadeAnalytics[]>("/production/shift-reports/analytics/", { params }),

  // Dashboard
  getDashboard: () =>
    api.get<ProductionDashboard>("/production/dashboard/"),
};

// ─── Quality Control ───────────────────────────────────────────────────────────
export const qualityApi = {
  // Parameters
  listParameters: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<QualityParameter>>("/quality/parameters/", { params }),
  getParametersByProduct: (productType: string) =>
    api.get<QualityParameter[]>(`/quality/parameters/by-product/${productType}/`),

  // Tests
  listTests: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<QualityTestList>>("/quality/tests/", { params }),
  getTest: (id: string) =>
    api.get<QualityTest>(`/quality/tests/${id}/`),
  createTest: (data: unknown) =>
    api.post<QualityTest>("/quality/tests/", data),
  updateTest: (id: string, data: unknown) =>
    api.patch<QualityTest>(`/quality/tests/${id}/`, data),
  updateTestResult: (testId: string, resultId: string, data: unknown) =>
    api.patch<QualityTestResultItem>(`/quality/tests/${testId}/results/${resultId}/`),
  evaluateTest: (id: string) =>
    api.post<QualityTest>(`/quality/tests/${id}/evaluate/`),
  submitTest: (id: string) =>
    api.post<QualityTest>(`/quality/tests/${id}/submit/`),
  approveTest: (id: string) =>
    api.post<QualityTest>(`/quality/tests/${id}/approve/`),
  rejectTest: (id: string, reason: string) =>
    api.post<QualityTest>(`/quality/tests/${id}/reject/`, { reason }),
  issueCertificate: (testId: string, complies_with?: string) =>
    api.post<QualityCertificate>(`/quality/tests/${testId}/issue-certificate/`, { complies_with }),

  // Certificates
  listCertificates: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<QualityCertificate>>("/quality/certificates/", { params }),
  getCertificate: (number: string) =>
    api.get<QualityCertificate>(`/quality/certificates/${number}/`),
  cancelCertificate: (number: string, reason: string) =>
    api.post<QualityCertificate>(`/quality/certificates/${number}/cancel/`, { reason }),

  // Defect Types
  listDefectTypes: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<DefectType>>("/quality/defect-types/", { params }),

  // Defects
  listDefects: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<QualityDefect>>("/quality/defects/", { params }),
  getDefect: (id: string) =>
    api.get<QualityDefect>(`/quality/defects/${id}/`),
  createDefect: (data: unknown) =>
    api.post<QualityDefect>("/quality/defects/", data),
  updateDefect: (id: string, data: unknown) =>
    api.patch<QualityDefect>(`/quality/defects/${id}/`, data),
  resolveDefect: (id: string, data: { disposition: string; root_cause: string; corrective_action: string }) =>
    api.post<QualityDefect>(`/quality/defects/${id}/resolve/`, data),

  // Analytics
  getPassRate: (params?: { start_date?: string; end_date?: string }) =>
    api.get<QualityPassRate>("/quality/analytics/pass-rate/", { params }),
  getDefectsByType: (params?: { start_date?: string; end_date?: string }) =>
    api.get<QualityDefectPareto[]>("/quality/analytics/defects-by-type/", { params }),
  getGradeDistribution: (params?: { start_date?: string; end_date?: string }) =>
    api.get<QualityGradeDistribution>("/quality/analytics/grade-distribution/", { params }),
  getComplianceScore: () =>
    api.get<QualityComplianceScore>("/quality/analytics/compliance-score/"),
};

// ─── Maintenance ──────────────────────────────────────────────────────────────
export const maintenanceApi = {
  // Equipment
  listEquipment: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<EquipmentList>>("/maintenance/equipment/", { params }),
  getEquipment: (id: string) =>
    api.get<Equipment>(`/maintenance/equipment/${id}/`),
  createEquipment: (data: Record<string, unknown>) =>
    api.post<Equipment>("/maintenance/equipment/", data),
  updateEquipment: (id: string, data: Record<string, unknown>) =>
    api.patch<Equipment>(`/maintenance/equipment/${id}/`, data),
  updateEquipmentStatus: (id: string, status: string) =>
    api.post<Equipment>(`/maintenance/equipment/${id}/update-status/`, { status }),
  getEquipmentHistory: (id: string) =>
    api.get<MaintenanceRecordList[]>(`/maintenance/equipment/${id}/history/`),
  getEquipmentOEE: (id: string) =>
    api.get<OEEMeasurement[]>(`/maintenance/equipment/${id}/oee/`),
  getEquipmentDowntime: (id: string) =>
    api.get<EquipmentDowntime[]>(`/maintenance/equipment/${id}/downtime/`),

  // Spare Parts
  listSpareParts: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<SparePart>>("/maintenance/spare-parts/", { params }),
  getLowStock: () =>
    api.get<SparePart[]>("/maintenance/spare-parts/low-stock/"),
  restockPart: (id: string, quantity: number) =>
    api.post<SparePart>(`/maintenance/spare-parts/${id}/restock/`, { quantity }),

  // Maintenance Records
  listRecords: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<MaintenanceRecordList>>("/maintenance/records/", { params }),
  getRecord: (id: string) =>
    api.get<MaintenanceRecord>(`/maintenance/records/${id}/`),
  createRecord: (data: Record<string, unknown>) =>
    api.post<MaintenanceRecord>("/maintenance/records/", data),
  startMaintenance: (id: string) =>
    api.post<MaintenanceRecord>(`/maintenance/records/${id}/start/`),
  completeMaintenance: (id: string, data: Record<string, unknown>) =>
    api.post<MaintenanceRecord>(`/maintenance/records/${id}/complete/`, data),
  approveMaintenance: (id: string) =>
    api.post<MaintenanceRecord>(`/maintenance/records/${id}/approve/`),
  usePart: (id: string, data: Record<string, unknown>) =>
    api.post(`/maintenance/records/${id}/use-part/`, data),

  // Schedules
  getUpcoming: (days?: number) =>
    api.get<EquipmentList[]>("/maintenance/schedules/upcoming/", { params: { days } }),

  // Downtime
  listDowntime: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<EquipmentDowntime>>("/maintenance/downtime/", { params }),
  createDowntime: (data: Record<string, unknown>) =>
    api.post<EquipmentDowntime>("/maintenance/downtime/", data),
  resolveDowntime: (id: string, data: Record<string, unknown>) =>
    api.post<EquipmentDowntime>(`/maintenance/downtime/${id}/resolve/`, data),
  getDowntimeAnalytics: (params?: { start_date?: string; end_date?: string }) =>
    api.get<DowntimeAnalytics>("/maintenance/downtime/analytics/", { params }),

  // OEE
  getOEEDashboard: () =>
    api.get<OEEDashboard>("/maintenance/oee/dashboard/"),
  listOEE: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<OEEMeasurement>>("/maintenance/oee/", { params }),
  calculateOEE: (equipment_id: string, shift_report_id: string) =>
    api.post<OEEMeasurement>("/maintenance/oee/calculate/", { equipment_id, shift_report_id }),

  // Analytics
  getCostSummary: (params?: { start_date?: string; end_date?: string }) =>
    api.get<MaintenanceCostSummary>("/maintenance/analytics/cost-summary/", { params }),
};

// ─── Advanced Analytics (Module 4) ────────────────────────────────────────────
export const advancedAnalyticsApi = {
  // Standard Costs
  listStandardCosts: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<StandardCost>>("/analytics/standard-costs/", { params }),
  createStandardCost: (data: Record<string, unknown>) =>
    api.post<StandardCost>("/analytics/standard-costs/", data),
  updateStandardCost: (id: string, data: Record<string, unknown>) =>
    api.patch<StandardCost>(`/analytics/standard-costs/${id}/`, data),
  compareStandardVsActual: (product: string, start_date: string, end_date: string) =>
    api.get<StandardVsActualComparison>("/analytics/standard-costs/compare/", { params: { product, start_date, end_date } }),

  // Actual Costs
  listActualCosts: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<ActualCost>>("/analytics/actual-costs/", { params }),
  createActualCost: (data: Record<string, unknown>) =>
    api.post<ActualCost>("/analytics/actual-costs/", data),
  getCostTrend: (params?: { days?: number; group_by?: string }) =>
    api.get<unknown[]>("/analytics/actual-costs/trend/", { params }),
  getCostBreakdown: (days?: number) =>
    api.get<CostBreakdownSummary>("/analytics/actual-costs/breakdown/", { params: { days } }),

  // Profitability
  listProfitability: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<ProfitabilityAnalysis>>("/analytics/profitability/", { params }),
  createProfitability: (data: Record<string, unknown>) =>
    api.post<ProfitabilityAnalysis>("/analytics/profitability/", data),
  getProfitabilityTrend: (days?: number) =>
    api.get<unknown[]>("/analytics/profitability/trend/", { params: { days } }),
  getExecutiveSummary: (days?: number) =>
    api.get<ProfitabilityExecutiveSummary>("/analytics/profitability/executive-summary/", { params: { days } }),

  // KPIs
  listKPIs: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<ProductionKPI>>("/analytics/kpi/", { params }),
  createKPI: (data: Record<string, unknown>) =>
    api.post<ProductionKPI>("/analytics/kpi/", data),
  getKPIDashboard: (days?: number) =>
    api.get<KPIDashboard>("/analytics/kpi/dashboard/", { params: { days } }),
  snapshotKPI: (shift_report_id: string) =>
    api.post<ProductionKPI>("/analytics/kpi/snapshot/", { shift_report_id }),

  // Forecasts
  listForecasts: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<ProductionForecast>>("/analytics/forecasts/", { params }),
  createForecast: (data: Record<string, unknown>) =>
    api.post<ProductionForecast>("/analytics/forecasts/", data),
  updateForecastActual: (id: string, actual_quantity_kg: number) =>
    api.post<ProductionForecast>(`/analytics/forecasts/${id}/update-actual/`, { actual_quantity_kg }),
  getForecastAccuracy: (days?: number) =>
    api.get<ForecastAccuracyReport>("/analytics/forecasts/accuracy-report/", { params: { days } }),

  // Dashboard
  getExecutiveDashboard: (days?: number) =>
    api.get<ExecutiveDashboard>("/analytics/widgets/executive-dashboard/", { params: { days } }),
  listWidgets: () =>
    api.get<PaginatedResponse<DashboardWidget>>("/analytics/widgets/"),
  createWidget: (data: Record<string, unknown>) =>
    api.post<DashboardWidget>("/analytics/widgets/", data),
  updateWidget: (id: string, data: Record<string, unknown>) =>
    api.patch<DashboardWidget>(`/analytics/widgets/${id}/`, data),
  deleteWidget: (id: string) =>
    api.delete(`/analytics/widgets/${id}/`),
};

// ─── Download helper ───────────────────────────────────────────────────────────
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
