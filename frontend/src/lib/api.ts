import api from "./axios";
import type {
  AuthTokens, User, PaginatedResponse,
  Warehouse, Product, StockLedgerEntry, StockMovement,
  CottonBatch, YarnBatch,
  CostSnapshot, YarnCurrentCost, CostTrendPoint,
  DashboardOverview, ProductionTrendPoint,
  FinancialTransaction, FinancialSummary,
  TollingContract, TollingRawReceipt, TollingDelivery, TollingInvoice, TollingContractStats,
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

// ─── Download helper ───────────────────────────────────────────────────────────
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
