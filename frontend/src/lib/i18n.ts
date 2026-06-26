import { useUIStore } from "@/stores/uiStore";

export type Locale = "en" | "ru" | "uz";

export interface Translations {
  locale: Locale;
  dateLocale: string;
  auth: {
    signIn: string; signingIn: string; signInSubtitle: string;
    email: string; password: string; emailInvalid: string; passwordRequired: string;
  };
  nav: {
    dashboard: string; warehouses: string; production: string;
    costing: string; finance: string; analytics: string;
    reports: string; users: string; settings: string; notifications: string;
    tolling: string; quality: string; maintenance: string;
  };
  dashboard: {
    title: string; todayFiber: string; cottonToFiber: string;
    todayYarn: string; fiberToYarn: string; avgYarnCost: string;
    thisMonth: string; activeBatches: string; cotton: string; yarn: string;
    productionTrend: string; fiberKg: string; yarnKg: string;
    warehouseValue: string; yarnCostTrend: string; avgCostPerKg: string;
    currentYarnCosts: string; noYarnBatches: string; warehouseBalances: string;
  };
  warehouses: {
    receiveStock: string; stockBalances: string; movements: string; products: string;
    colWarehouse: string; colProduct: string; colType: string; colQtyKg: string;
    colAvgCost: string; colTotalValue: string; colLastMovement: string; colTotalCost: string;
    receiveStockTitle: string; warehouse: string; costPerKg: string; notes: string; receiving: string; stockReceived: string;
    addWarehouse: string; addWarehouseTitle: string; warehouseName: string; warehouseCode: string;
    warehouseType: string; location: string; capacityKg: string; warehouseAdded: string; adding: string;
    addProduct: string; addProductTitle: string; productName: string; productCode: string;
    productType: string; yarnCount: string; yarnType: string; productAdded: string;
    colCode: string; colUnit: string;
    wtCotton: string; wtFiber: string; wtWip: string; wtYarn: string; wtWaste: string; wtOther: string;
    ptRawCotton: string; ptFiber: string; ptSeed: string; ptLint: string; ptYarn: string; ptWaste: string; ptOther: string;
    sourceType: string; sourceOwn: string; sourceTolling: string; tollingCompany: string; selectContract: string;
    editWarehouseTitle: string; editProductTitle: string; deleteWarehouseConfirm: string; deleteProductConfirm: string;
    productUpdated: string; warehouseDeleted: string; productDeleted: string;
  };
  production: {
    newBatch: string; activeCottonBatches: string; activeYarnBatches: string;
    cottonBatchesTotal: string; yarnBatchesTotal: string;
    cottonToFiber: string; fiberToYarn: string;
    colBatch: string; colProduct: string; colNeCount: string; colStatus: string;
    colStart: string; colEnd: string; colCottonInput: string; colFiberOutput: string;
    colYield: string; colFiberCostKg: string; colFiberInput: string;
    colYarnOutput: string; colWastePct: string; colEfficiency: string; colCostKg: string;
    backToList: string; addCottonInput: string; addFiberInput: string;
    addExpense: string; completeBatch: string; completing: string;
    batchCompleted: string; adding: string; inputAdded: string; expenseAdded: string;
    costBreakdown: string; expenses: string; product: string; quantityKg: string;
    category: string; expenseDate: string; optDescription: string;
    fiberOutputKg: string; seedOutputKg: string; lintOutputKg: string;
    wasteOutputKg: string; seedCreditValue: string; lintCreditValue: string;
    yarnOutputKg: string; endDate: string;
    cottonInput: string; cottonCost: string; fiberInput: string; fiberCost: string;
    netCost: string; totalExpenses: string; byproductCredits: string;
    newCottonBatchTitle: string; newYarnBatchTitle: string;
    startDate: string; selectYarnProduct: string; batchCreated: string; creating: string;
    orders: string; ordersTab: string; shiftReportsTab: string;
    newOrder: string; newShiftReport: string;
    ordersInProgress: string; ordersDelayed: string; completedToday: string;
    outputToday: string; avgConversion: string; activeLines: string;
    pendingQC: string; colOrder: string; colLine: string; colBrigade: string;
    colShift: string; colPlanned: string; colActual: string;
    colCompletion: string; colSupervisor: string;
    colConversion: string; colReport: string; colDate: string;
    colWorkers: string; colRuntime: string; colDowntime: string; colOEE: string;
    approve: string; startProduction: string; completeOrder: string; cancelOrder: string;
    orderApproved: string; orderStarted: string;
    orderCompleted: string; orderCancelled: string;
    qcPassed: string; qcFailed: string;
    traceability: string; batchDetails: string;
    brigadeAnalytics: string; reportSubmitted: string;
    reportApproved: string; submitReport: string; approveReport: string;
    colInputKg: string; colOutputKg: string; colWasteKg: string;
    fiberSourceWarehouse: string; yarnTargetWarehouse: string;
  };
  costing: {
    title: string; avgYarnCostMonth: string; avgFiberCostMonth: string;
    yarnProducedMonth: string; avgWastePct: string;
    yarnCostTrend90: string; yarnCostKg: string; expenseBreakdown: string;
    currentYarnCostsByProduct: string;
  };
  finance: {
    totalExpensesMonth: string; totalIncomeMonth: string; netMonth: string;
    expensesByCategory: string; amount: string; recentTransactions: string;
    colType: string; colDescription: string; colDir: string;
    expense: string; income: string;
  };
  analytics: {
    machineOutput30: string; yarnOutputKg: string; wasteKg: string;
    last10BatchesCost: string; yarnCostKg: string; machinePerformance: string;
    colMachine: string; colShifts: string; colYarnOutput: string;
    colWaste: string; colAvgDowntime: string;
  };
  reports: {
    subtitle: string; from: string; to: string;
    generating: string; downloadExcel: string; downloaded: string; downloadFailed: string;
    powerBiTitle: string; powerBiDesc: string;
    yarnCostTitle: string; yarnCostDesc: string;
    fiberCostTitle: string; fiberCostDesc: string;
    warehouseBalanceTitle: string; warehouseBalanceDesc: string;
    wasteAnalysisTitle: string; wasteAnalysisDesc: string;
  };
  users: {
    title: string; inviteUser: string; searchPlaceholder: string;
    deactivated: string; activated: string; deactivateFailed: string;
    deactivate: string; activate: string;
    colName: string; colRole: string; colDepartment: string;
    colStatus: string; colLastLogin: string; colActions: string;
  };
  settings: {
    profile: string; security: string; appearance: string;
    theme: string; themeLight: string; themeDark: string; themeSystem: string;
    profileInfo: string; firstName: string; lastName: string; saveChanges: string;
    changePassword: string; currentPassword: string; newPassword: string;
    confirmPassword: string; updatePassword: string;
    notificationPrefs: string; notificationItems: string[];
  };
  common: {
    noData: string; live: string; perKg: string; by: string; date: string;
    allTime: string; batches: string; updated: string; searchProducts: string;
    statusDraft: string; statusInProgress: string; statusCompleted: string;
    statusCancelled: string; statusActive: string; statusInactive: string;
    notifications: string; noNotifications: string; markAllRead: string;
  };
  tolling: {
    title: string; contracts: string; newContract: string;
    contractNumber: string; contractDate: string; customer: string;
    customerInn: string; startDate: string; endDate: string;
    status: string; contractType: string;
    external: string; internal: string;
    yarnPriceUsd: string; exchangeRate: string;
    processorShare: string; customerShare: string; lossShare: string;
    targetYarnProduct: string; vatIncluded: string; paymentTermDays: string;
    rawWarehouse: string; fgWarehouse: string;
    statusDraft: string; statusActive: string; statusSuspended: string;
    statusCompleted: string; statusCancelled: string;
    receipts: string; newReceipt: string; receiptNumber: string; receiptDate: string;
    fiberProduct: string; quantityKg: string; qualityGrade: string;
    ttnNumber: string; supplierName: string; receiveBtn: string; received: string;
    deliveries: string; newDelivery: string; deliveryDate: string; deliveryNumber: string;
    deliverBtn: string; delivered: string;
    invoices: string; invoiceNumber: string; invoiceDate: string;
    baseAmount: string; vatAmount: string; totalAmount: string;
    paidAmount: string; balanceDue: string; paymentDue: string;
    recordPayment: string; paymentAmount: string;
    totalFiberReceived: string; totalYarnProduced: string; totalServiceFee: string;
    totalPaid: string; contractBalance: string; daysUntilExpiry: string;
    processorYarnKg: string; customerYarnKg: string; lossYarnKg: string;
    serviceFeePerKg: string;
    activate: string; suspend: string; creating: string; contractCreated: string;
    notes: string; advancePaymentPct: string;
    colContract: string; colCustomer: string; colStatus: string;
    colTotal: string; colBalance: string; colDate: string;
  };
  quality: {
    title: string; dashboard: string;
    tests: string; newTest: string; testNumber: string; testType: string;
    testDate: string; testedBy: string; labEquipment: string;
    sampleSizeKg: string; sampleLocation: string; sampleTakenBy: string;
    overallResult: string; qualityGrade: string; approvedForUse: string;
    batchNumber: string; productName: string;
    parameters: string; parameterCode: string; measuredValue: string;
    withinSpec: string; deviation: string;
    passRate: string; totalTests: string; passed: string; failed: string;
    certificates: string; certificateNumber: string; issueDate: string; validUntil: string;
    issuedBy: string; approvedBy: string; compliesWith: string; cancelCertificate: string;
    defects: string; newDefect: string; defectNumber: string; defectType: string;
    severity: string; quantityAffected: string; detectedBy: string; detectedDate: string;
    rootCause: string; correctiveAction: string; disposition: string;
    resolveDefect: string; defectResolved: string;
    evaluate: string; evaluating: string; evaluated: string;
    approve: string; approving: string; approveTest: string; testApproved: string;
    rejectTest: string; rejectionReason: string; testRejected: string;
    issueCert: string; certIssued: string;
    gradeA: string; gradeB: string; gradeC: string;
    statusPending: string; statusPassed: string; statusFailed: string;
    statusConditional: string; statusRetest: string;
    defectOpen: string; defectInvestigating: string; defectResolved2: string; defectClosed: string;
    incomingRaw: string; inProcess: string; finalProduct: string; periodic: string;
    colTest: string; colType: string; colBatch: string; colProduct: string;
    colDate: string; colResult: string; colGrade: string; colApproved: string;
    colCertificate: string; colIssueDate: string; colValid: string;
    colDefect: string; colSeverity: string; colQty: string; colStatus: string;
    complianceScore: string; gradeDistribution: string; defectPareto: string;
    passRateTrend: string; noTests: string; noCertificates: string; noDefects: string;
  };
  maintenance: {
    title: string; dashboard: string; equipment: string; records: string;
    downtime: string; spareParts: string; schedules: string;
    newEquipment: string; newRecord: string; reportDowntime: string;
    equipmentCode: string; equipmentName: string; equipmentType: string;
    manufacturer: string; model: string; serialNumber: string;
    location: string; status: string; nextMaintenance: string;
    lastMaintenance: string; operatingHours: string; isOverdue: string;
    statusOperational: string; statusMaintenance: string; statusBreakdown: string;
    statusIdle: string; statusDecommissioned: string;
    oee: string; oeeTitle: string; availability: string;
    performance: string; quality: string;
    scheduledDate: string; maintenanceType: string; technician: string;
    duration: string; laborCost: string; partsCost: string; totalCost: string;
    workDescription: string; findings: string; recommendations: string;
    startMaintenance: string; completeMaintenance: string; approveMaintenance: string;
    maintenanceStarted: string; maintenanceCompleted: string; maintenanceApproved: string;
    typePreventive: string; typeCorrective: string; typePredictive: string;
    typeEmergency: string; typeOverhaul: string;
    partCode: string; partName: string; category: string; currentStock: string;
    minimumStock: string; unitCost: string; lowStock: string; restock: string;
    restockQty: string; restocked: string; isCritical: string;
    downtimeNumber: string; downtimeType: string; reason: string;
    startTime: string; endTime: string; durationHours: string;
    productionLoss: string; actionTaken: string; resolve: string; resolved: string;
    active: string; mttr: string; totalDowntime: string;
    usePart: string; partUsed: string; quantity: string; condition: string;
    colEquipment: string; colType: string; colStatus: string; colNext: string;
    colRecord: string; colDate: string; colTechnician: string; colCost: string;
    colDowntime: string; colDuration: string; colReason: string;
    colPart: string; colStock: string; colMin: string; colReorder: string;
    noEquipment: string; noRecords: string; noDowntime: string; noParts: string;
    upcomingMaintenance: string; overdueAlert: string; lowStockAlert: string;
    activeDowntime: string; avgOEE: string; maintenanceCost: string;
  };
  advancedAnalytics: {
    title: string; executiveDashboard: string;
    costAnalysis: string; profitability: string; kpiDashboard: string; forecasting: string;
    standardCosts: string; actualCosts: string;
    newStandardCost: string; newActualCost: string; newAnalysis: string; newForecast: string;
    costPeriod: string; rawMaterialCost: string; laborCost: string;
    overheadCost: string; energyCost: string; totalStandardCost: string;
    maintenanceCost: string; wasteCost: string; totalActualCost: string;
    costPerKg: string; quantityKg: string;
    revenue: string; cogs: string; grossProfit: string; grossMargin: string;
    overhead: string; netProfit: string; netMargin: string; revenuePerKg: string;
    efficiency: string; qualityPassRate: string; wastePct: string;
    downtimeHours: string; oee: string; energyKwh: string;
    forecastQty: string; actualQty: string; accuracy: string;
    confidenceLow: string; confidenceHigh: string; method: string;
    methodMovingAvg: string; methodLinearReg: string; methodManual: string;
    periodWeekly: string; periodMonthly: string; periodQuarterly: string;
    compareStdVsActual: string; variance: string;
    costBreakdown: string; costTrend: string; profitabilityTrend: string;
    noData: string; updateActual: string; actualUpdated: string;
    colProduct: string; colPeriod: string; colStdCost: string; colActualCost: string;
    colVariance: string; colRevenue: string; colNetProfit: string; colMargin: string;
    colDate: string; colLine: string; colEfficiency: string; colOEE: string;
    colForecastQty: string; colActualQty: string; colAccuracy: string;
    totalOutput: string; avgEfficiency: string; avgOEE: string; activeDowntime: string;
    totalTests: string; passRate: string; avgNetMargin: string;
  };
}

const en: Translations = {
  locale: "en",
  dateLocale: "en-GB",
  auth: {
    signIn: "Sign in", signingIn: "Signing in…", signInSubtitle: "Sign in to your account",
    email: "Email", password: "Password",
    emailInvalid: "Enter a valid email", passwordRequired: "Password is required",
  },
  nav: {
    dashboard: "Dashboard", warehouses: "Warehouses", production: "Production",
    quality: "Quality Control", maintenance: "Maintenance",
    costing: "Costing", finance: "Finance", analytics: "Analytics",
    reports: "Reports", users: "Users", settings: "Settings", notifications: "Notifications",
    tolling: "Tolling",
  },
  dashboard: {
    title: "Dashboard", todayFiber: "Today Fiber Produced", cottonToFiber: "Cotton → Fiber",
    todayYarn: "Today Yarn Produced", fiberToYarn: "Fiber → Yarn",
    avgYarnCost: "Avg Yarn Cost", thisMonth: "This month",
    activeBatches: "Active Batches", cotton: "Cotton", yarn: "Yarn",
    productionTrend: "Production Trend (30 days)", fiberKg: "Fiber (kg)", yarnKg: "Yarn (kg)",
    warehouseValue: "Warehouse Value", yarnCostTrend: "Yarn Cost Trend",
    avgCostPerKg: "Avg Cost/kg", currentYarnCosts: "Current Yarn Costs",
    noYarnBatches: "No yarn batches completed yet", warehouseBalances: "Warehouse Balances",
  },
  warehouses: {
    receiveStock: "Receive Stock", stockBalances: "Stock Balances",
    movements: "Movements", products: "Products",
    colWarehouse: "Warehouse", colProduct: "Product", colType: "Type",
    colQtyKg: "Qty (kg)", colAvgCost: "Avg Cost/kg", colTotalValue: "Total Value",
    colLastMovement: "Last Movement", colTotalCost: "Total Cost",
    receiveStockTitle: "Receive Stock into Warehouse", warehouse: "Warehouse",
    costPerKg: "Cost per kg", notes: "Notes (optional)", receiving: "Receiving…", stockReceived: "Stock received",
    addWarehouse: "Add Warehouse", addWarehouseTitle: "New Warehouse",
    warehouseName: "Name", warehouseCode: "Code (e.g. WH-01)", warehouseType: "Type",
    location: "Location (optional)", capacityKg: "Capacity (kg, optional)",
    warehouseAdded: "Warehouse created", adding: "Adding…",
    addProduct: "Add Product", addProductTitle: "New Product",
    productName: "Product Name", productCode: "Code (e.g. YRN-Ne30)", productType: "Product Type",
    yarnCount: "Yarn Count (e.g. Ne30/1)", yarnType: "Yarn Type (e.g. Combed)",
    productAdded: "Product created",
    colCode: "Code", colUnit: "Unit",
    wtCotton: "Cotton", wtFiber: "Fiber", wtWip: "WIP", wtYarn: "Yarn", wtWaste: "Waste", wtOther: "Other",
    ptRawCotton: "Raw Cotton", ptFiber: "Fiber", ptSeed: "Seed", ptLint: "Lint", ptYarn: "Yarn", ptWaste: "Waste", ptOther: "Other",
    sourceType: "Source Type", sourceOwn: "Own", sourceTolling: "Tolling", tollingCompany: "Company (Contract)", selectContract: "Select contract",
    editWarehouseTitle: "Edit Warehouse", editProductTitle: "Edit Product",
    deleteWarehouseConfirm: "Delete this warehouse? This cannot be undone.",
    deleteProductConfirm: "Delete this product? This cannot be undone.",
    productUpdated: "Product updated", warehouseDeleted: "Warehouse deleted", productDeleted: "Product deleted",
  },
  production: {
    newBatch: "New Batch", activeCottonBatches: "Active Cotton Batches",
    activeYarnBatches: "Active Yarn Batches", cottonBatchesTotal: "Cotton Batches Total",
    yarnBatchesTotal: "Yarn Batches Total", cottonToFiber: "Cotton → Fiber", fiberToYarn: "Fiber → Yarn",
    colBatch: "Batch", colProduct: "Product", colNeCount: "Ne Count", colStatus: "Status",
    colStart: "Start", colEnd: "End", colCottonInput: "Cotton Input", colFiberOutput: "Fiber Output",
    colYield: "Yield", colFiberCostKg: "Fiber Cost/kg", colFiberInput: "Fiber Input",
    colYarnOutput: "Yarn Output", colWastePct: "Waste %", colEfficiency: "Efficiency", colCostKg: "Cost/kg",
    backToList: "← Production", addCottonInput: "Add Cotton Input", addFiberInput: "Add Fiber Input",
    addExpense: "Add Expense", completeBatch: "Complete Batch", completing: "Completing…",
    batchCompleted: "Batch completed successfully", adding: "Adding…",
    inputAdded: "Input recorded", expenseAdded: "Expense added",
    costBreakdown: "Cost Breakdown", expenses: "Expenses", product: "Product",
    quantityKg: "Quantity (kg)", category: "Category", expenseDate: "Expense Date",
    optDescription: "Description (optional)",
    fiberOutputKg: "Fiber Output (kg)", seedOutputKg: "Seed Output (kg)",
    lintOutputKg: "Lint Output (kg)", wasteOutputKg: "Waste Output (kg)",
    seedCreditValue: "Seed Credit Value", lintCreditValue: "Lint Credit Value",
    yarnOutputKg: "Yarn Output (kg)", endDate: "End Date",
    cottonInput: "Cotton Input (kg)", cottonCost: "Cotton Cost",
    fiberInput: "Fiber Input (kg)", fiberCost: "Fiber Cost",
    netCost: "Net Cost", totalExpenses: "Total Expenses", byproductCredits: "Byproduct Credits",
    newCottonBatchTitle: "New Cotton Batch", newYarnBatchTitle: "New Yarn Batch",
    startDate: "Start Date", selectYarnProduct: "Yarn Product", batchCreated: "Batch created", creating: "Creating…",
    fiberSourceWarehouse: "Fiber Warehouse (source)", yarnTargetWarehouse: "Yarn Warehouse (destination)",
    // Production Orders
    orders: "Orders", ordersTab: "Production Orders", shiftReportsTab: "Shift Reports",
    newOrder: "New Order", newShiftReport: "New Shift Report",
    ordersInProgress: "In Progress", ordersDelayed: "Delayed", completedToday: "Completed Today",
    outputToday: "Output Today", avgConversion: "Avg Conversion", activeLines: "Active Lines",
    pendingQC: "Pending QC", colOrder: "Order", colLine: "Line", colBrigade: "Brigade",
    colShift: "Shift", colPlanned: "Planned", colActual: "Actual",
    colCompletion: "Completion", colSupervisor: "Supervisor",
    colConversion: "Conversion", colReport: "Report", colDate: "Date",
    colWorkers: "Workers", colRuntime: "Runtime", colDowntime: "Downtime",
    colOEE: "OEE",
    approve: "Approve", startProduction: "Start", completeOrder: "Complete", cancelOrder: "Cancel",
    orderApproved: "Order approved", orderStarted: "Production started",
    orderCompleted: "Order completed", orderCancelled: "Order cancelled",
    qcPassed: "QC Passed", qcFailed: "QC Failed",
    traceability: "Traceability", batchDetails: "Batch Details",
    brigadeAnalytics: "Brigade Performance", reportSubmitted: "Report submitted",
    reportApproved: "Report approved", submitReport: "Submit", approveReport: "Approve",
    colInputKg: "Input (kg)", colOutputKg: "Output (kg)", colWasteKg: "Waste (kg)",
  },
  costing: {
    title: "Costing Engine", avgYarnCostMonth: "Avg Yarn Cost (Month)",
    avgFiberCostMonth: "Avg Fiber Cost (Month)", yarnProducedMonth: "Yarn Produced (Month)",
    avgWastePct: "Avg Waste %", yarnCostTrend90: "Yarn Cost Trend (90 days)",
    yarnCostKg: "Yarn Cost/kg", expenseBreakdown: "Spinning Expense Breakdown",
    currentYarnCostsByProduct: "Current Yarn Costs by Product",
  },
  finance: {
    totalExpensesMonth: "Total Expenses (Month)", totalIncomeMonth: "Total Income (Month)",
    netMonth: "Net (Month)", expensesByCategory: "Expenses by Category (This Month)",
    amount: "Amount", recentTransactions: "Recent Transactions",
    colType: "Type", colDescription: "Description", colDir: "Dir.",
    expense: "▼ EXP", income: "▲ INC",
  },
  analytics: {
    machineOutput30: "Machine Output (30 days)", yarnOutputKg: "Yarn Output (kg)",
    wasteKg: "Waste (kg)", last10BatchesCost: "Last 10 Batches — Cost/kg",
    yarnCostKg: "Yarn Cost/kg", machinePerformance: "Machine Performance Summary",
    colMachine: "Machine", colShifts: "Shifts", colYarnOutput: "Yarn Output",
    colWaste: "Waste", colAvgDowntime: "Avg Downtime",
  },
  reports: {
    subtitle: "Generate and download production & costing reports in Excel format.",
    from: "From", to: "To", generating: "Generating…", downloadExcel: "Download Excel",
    downloaded: "downloaded!", downloadFailed: "Download failed. Please try again.",
    powerBiTitle: "Power BI Integration",
    powerBiDesc: "All report endpoints are available as JSON REST APIs for Power BI DirectQuery. Append ?format=json to any report URL. Use your JWT token in the Authorization header.",
    yarnCostTitle: "Yarn Cost Report",
    yarnCostDesc: "Detailed cost breakdown for each yarn batch — fiber cost, spinning expenses, and final cost/kg.",
    fiberCostTitle: "Fiber Cost Report",
    fiberCostDesc: "Cotton-to-fiber batch costs including byproduct credits and yield analysis.",
    warehouseBalanceTitle: "Warehouse Balance Report",
    warehouseBalanceDesc: "Current stock balances across all warehouses with average costs and total values.",
    wasteAnalysisTitle: "Waste Analysis Report",
    wasteAnalysisDesc: "Waste percentage and quantity per yarn batch — identify efficiency losses.",
  },
  users: {
    title: "Users & Roles", inviteUser: "Invite User",
    searchPlaceholder: "Search users by name or email…",
    deactivated: "User deactivated", activated: "User activated",
    deactivateFailed: "Failed to deactivate user",
    deactivate: "Deactivate", activate: "Activate",
    colName: "Name", colRole: "Role", colDepartment: "Department",
    colStatus: "Status", colLastLogin: "Last Login", colActions: "Actions",
  },
  settings: {
    profile: "Profile", security: "Security", appearance: "Appearance",
    theme: "Theme", themeLight: "Light", themeDark: "Dark", themeSystem: "System",
    profileInfo: "Profile Information", firstName: "First Name", lastName: "Last Name",
    saveChanges: "Save Changes", changePassword: "Change Password",
    currentPassword: "Current Password", newPassword: "New Password",
    confirmPassword: "Confirm New Password", updatePassword: "Update Password",
    notificationPrefs: "Notification Preferences",
    notificationItems: [
      "Batch completed alerts", "Low stock warnings", "Cost spike alerts",
      "Machine downtime alerts", "Daily production summary",
    ],
  },
  common: {
    noData: "No data available", live: "Live", perKg: "per kg", by: "By",
    date: "Date", allTime: "All time", batches: "batches", updated: "Updated",
    searchProducts: "Search products…",
    statusDraft: "Draft", statusInProgress: "In Progress", statusCompleted: "Completed",
    statusCancelled: "Cancelled", statusActive: "Active", statusInactive: "Inactive",
    notifications: "Notifications", noNotifications: "No new notifications", markAllRead: "Mark all read",
  },
  tolling: {
    title: "Tolling Contracts", contracts: "Contracts", newContract: "New Contract",
    contractNumber: "Contract #", contractDate: "Contract Date", customer: "Customer",
    customerInn: "INN", startDate: "Start Date", endDate: "End Date",
    status: "Status", contractType: "Type",
    external: "External", internal: "Internal",
    yarnPriceUsd: "Yarn Price (USD/kg)", exchangeRate: "Exchange Rate (UZS/USD)",
    processorShare: "Processor Share %", customerShare: "Customer Share %", lossShare: "Loss/Fire %",
    targetYarnProduct: "Target Yarn Product", vatIncluded: "VAT Included (12%)",
    paymentTermDays: "Payment Term (days)",
    rawWarehouse: "Raw Material Warehouse", fgWarehouse: "Finished Goods Warehouse",
    statusDraft: "Draft", statusActive: "Active", statusSuspended: "Suspended",
    statusCompleted: "Completed", statusCancelled: "Cancelled",
    receipts: "Raw Material Receipts", newReceipt: "Receive Fiber", receiptNumber: "Receipt #",
    receiptDate: "Receipt Date", fiberProduct: "Fiber Product", quantityKg: "Quantity (kg)",
    qualityGrade: "Quality Grade", ttnNumber: "TTN #", supplierName: "Supplier",
    receiveBtn: "Mark Received", received: "Received",
    deliveries: "Deliveries", newDelivery: "New Delivery", deliveryDate: "Delivery Date",
    deliveryNumber: "Delivery #", deliverBtn: "Complete Delivery", delivered: "Delivered",
    invoices: "Invoices", invoiceNumber: "Invoice #", invoiceDate: "Invoice Date",
    baseAmount: "Base Amount", vatAmount: "VAT (12%)", totalAmount: "Total",
    paidAmount: "Paid", balanceDue: "Balance Due", paymentDue: "Payment Due",
    recordPayment: "Record Payment", paymentAmount: "Payment Amount",
    totalFiberReceived: "Fiber Received", totalYarnProduced: "Yarn Produced",
    totalServiceFee: "Service Fee (incl. VAT)", totalPaid: "Total Paid",
    contractBalance: "Outstanding Balance", daysUntilExpiry: "Days Until Expiry",
    processorYarnKg: "Processor Share (kg)", customerYarnKg: "Customer Share (kg)",
    lossYarnKg: "Fire/Loss (kg)", serviceFeePerKg: "Service Fee/kg Fiber",
    activate: "Activate", suspend: "Suspend", creating: "Creating…",
    contractCreated: "Contract created", notes: "Notes", advancePaymentPct: "Advance %",
    colContract: "Contract", colCustomer: "Customer", colStatus: "Status",
    colTotal: "Total (UZS)", colBalance: "Balance", colDate: "Date",
  },
  quality: {
    title: "Quality Control", dashboard: "QC Dashboard",
    tests: "Quality Tests", newTest: "New Test", testNumber: "Test #", testType: "Test Type",
    testDate: "Test Date", testedBy: "Tested By", labEquipment: "Lab Equipment",
    sampleSizeKg: "Sample Size (kg)", sampleLocation: "Sample Location", sampleTakenBy: "Sample Taken By",
    overallResult: "Overall Result", qualityGrade: "Grade", approvedForUse: "Approved",
    batchNumber: "Batch #", productName: "Product",
    parameters: "Parameters", parameterCode: "Code", measuredValue: "Measured Value",
    withinSpec: "Within Spec", deviation: "Deviation %",
    passRate: "Pass Rate", totalTests: "Total Tests", passed: "Passed", failed: "Failed",
    certificates: "Certificates", certificateNumber: "Cert #", issueDate: "Issue Date", validUntil: "Valid Until",
    issuedBy: "Issued By", approvedBy: "Approved By", compliesWith: "Complies With", cancelCertificate: "Cancel Certificate",
    defects: "Defects", newDefect: "Report Defect", defectNumber: "Defect #", defectType: "Defect Type",
    severity: "Severity", quantityAffected: "Qty Affected (kg)", detectedBy: "Detected By", detectedDate: "Detected Date",
    rootCause: "Root Cause", correctiveAction: "Corrective Action", disposition: "Disposition",
    resolveDefect: "Resolve Defect", defectResolved: "Defect resolved",
    evaluate: "Evaluate", evaluating: "Evaluating…", evaluated: "Results evaluated",
    approve: "Approve", approving: "Approving…", approveTest: "Approve Test", testApproved: "Test approved",
    rejectTest: "Reject", rejectionReason: "Rejection Reason", testRejected: "Test rejected",
    issueCert: "Issue Certificate", certIssued: "Certificate issued",
    gradeA: "Grade A", gradeB: "Grade B", gradeC: "Grade C",
    statusPending: "Pending", statusPassed: "Passed", statusFailed: "Failed",
    statusConditional: "Conditional", statusRetest: "Retest",
    defectOpen: "Open", defectInvestigating: "Investigating", defectResolved2: "Resolved", defectClosed: "Closed",
    incomingRaw: "Incoming Raw", inProcess: "In-Process", finalProduct: "Final Product", periodic: "Periodic",
    colTest: "Test", colType: "Type", colBatch: "Batch", colProduct: "Product",
    colDate: "Date", colResult: "Result", colGrade: "Grade", colApproved: "Approved",
    colCertificate: "Certificate", colIssueDate: "Issue Date", colValid: "Valid Until",
    colDefect: "Defect", colSeverity: "Severity", colQty: "Qty (kg)", colStatus: "Status",
    complianceScore: "Compliance Score", gradeDistribution: "Grade Distribution", defectPareto: "Defects by Type",
    passRateTrend: "Pass Rate", noTests: "No quality tests yet", noCertificates: "No certificates issued", noDefects: "No defects reported",
  },
  maintenance: {
    title: "Equipment & Maintenance", dashboard: "Maintenance Dashboard",
    equipment: "Equipment", records: "Maintenance Records", downtime: "Downtime",
    spareParts: "Spare Parts", schedules: "Schedules",
    newEquipment: "New Equipment", newRecord: "New Maintenance", reportDowntime: "Report Downtime",
    equipmentCode: "Equipment Code", equipmentName: "Equipment Name", equipmentType: "Type",
    manufacturer: "Manufacturer", model: "Model", serialNumber: "Serial Number",
    location: "Location", status: "Status", nextMaintenance: "Next Maintenance",
    lastMaintenance: "Last Maintenance", operatingHours: "Operating Hours", isOverdue: "Overdue",
    statusOperational: "Operational", statusMaintenance: "Maintenance", statusBreakdown: "Breakdown",
    statusIdle: "Idle", statusDecommissioned: "Decommissioned",
    oee: "OEE", oeeTitle: "OEE Dashboard", availability: "Availability",
    performance: "Performance", quality: "Quality",
    scheduledDate: "Scheduled Date", maintenanceType: "Maintenance Type", technician: "Technician",
    duration: "Duration (hrs)", laborCost: "Labor Cost", partsCost: "Parts Cost", totalCost: "Total Cost",
    workDescription: "Work Description", findings: "Findings", recommendations: "Recommendations",
    startMaintenance: "Start Maintenance", completeMaintenance: "Complete", approveMaintenance: "Approve",
    maintenanceStarted: "Maintenance started", maintenanceCompleted: "Maintenance completed", maintenanceApproved: "Maintenance approved",
    typePreventive: "Preventive", typeCorrective: "Corrective", typePredictive: "Predictive",
    typeEmergency: "Emergency", typeOverhaul: "Overhaul",
    partCode: "Part Code", partName: "Part Name", category: "Category", currentStock: "Current Stock",
    minimumStock: "Min Stock", unitCost: "Unit Cost", lowStock: "Low Stock", restock: "Restock",
    restockQty: "Quantity to Add", restocked: "Stock updated", isCritical: "Critical",
    downtimeNumber: "Downtime #", downtimeType: "Downtime Type", reason: "Reason",
    startTime: "Start Time", endTime: "End Time", durationHours: "Duration (hrs)",
    productionLoss: "Production Loss (kg)", actionTaken: "Action Taken", resolve: "Resolve", resolved: "Downtime resolved",
    active: "Active", mttr: "MTTR (hrs)", totalDowntime: "Total Downtime (hrs)",
    usePart: "Use Part", partUsed: "Part usage recorded", quantity: "Quantity", condition: "Condition",
    colEquipment: "Equipment", colType: "Type", colStatus: "Status", colNext: "Next Due",
    colRecord: "Record", colDate: "Date", colTechnician: "Technician", colCost: "Total Cost",
    colDowntime: "Downtime", colDuration: "Duration", colReason: "Reason",
    colPart: "Part", colStock: "Stock", colMin: "Min", colReorder: "Reorder?",
    noEquipment: "No equipment registered", noRecords: "No maintenance records", noDowntime: "No downtime events", noParts: "No spare parts",
    upcomingMaintenance: "Upcoming Maintenance", overdueAlert: "Overdue", lowStockAlert: "Low Stock",
    activeDowntime: "Active Downtime", avgOEE: "Avg OEE", maintenanceCost: "Maintenance Cost",
  },
  advancedAnalytics: {
    title: "Advanced Analytics", executiveDashboard: "Executive Dashboard",
    costAnalysis: "Cost Analysis", profitability: "Profitability", kpiDashboard: "KPI Dashboard", forecasting: "Forecasting",
    standardCosts: "Standard Costs", actualCosts: "Actual Costs",
    newStandardCost: "New Standard Cost", newActualCost: "New Actual Cost", newAnalysis: "New Analysis", newForecast: "New Forecast",
    costPeriod: "Cost Period", rawMaterialCost: "Raw Material Cost", laborCost: "Labor Cost",
    overheadCost: "Overhead Cost", energyCost: "Energy Cost", totalStandardCost: "Total Standard Cost",
    maintenanceCost: "Maintenance Cost", wasteCost: "Waste Cost", totalActualCost: "Total Actual Cost",
    costPerKg: "Cost / kg", quantityKg: "Quantity (kg)",
    revenue: "Revenue", cogs: "COGS", grossProfit: "Gross Profit", grossMargin: "Gross Margin %",
    overhead: "Overhead", netProfit: "Net Profit", netMargin: "Net Margin %", revenuePerKg: "Revenue / kg",
    efficiency: "Efficiency %", qualityPassRate: "Quality Pass Rate", wastePct: "Waste %",
    downtimeHours: "Downtime Hours", oee: "OEE %", energyKwh: "Energy (kWh)",
    forecastQty: "Forecast (kg)", actualQty: "Actual (kg)", accuracy: "Accuracy %",
    confidenceLow: "Conf. Low", confidenceHigh: "Conf. High", method: "Method",
    methodMovingAvg: "Moving Average", methodLinearReg: "Linear Regression", methodManual: "Manual",
    periodWeekly: "Weekly", periodMonthly: "Monthly", periodQuarterly: "Quarterly",
    compareStdVsActual: "Std vs Actual", variance: "Variance",
    costBreakdown: "Cost Breakdown", costTrend: "Cost Trend", profitabilityTrend: "Profitability Trend",
    noData: "No data available", updateActual: "Update Actual", actualUpdated: "Actual updated",
    colProduct: "Product", colPeriod: "Period", colStdCost: "Std Cost/kg", colActualCost: "Actual Cost/kg",
    colVariance: "Variance", colRevenue: "Revenue", colNetProfit: "Net Profit", colMargin: "Margin",
    colDate: "Date", colLine: "Line", colEfficiency: "Efficiency", colOEE: "OEE",
    colForecastQty: "Forecast", colActualQty: "Actual", colAccuracy: "Accuracy",
    totalOutput: "Total Output", avgEfficiency: "Avg Efficiency", avgOEE: "Avg OEE", activeDowntime: "Active Downtime",
    totalTests: "Total Tests", passRate: "Pass Rate", avgNetMargin: "Avg Net Margin",
  },
};

const ru: Translations = {
  locale: "ru",
  dateLocale: "ru-RU",
  auth: {
    signIn: "Войти", signingIn: "Вход…", signInSubtitle: "Войдите в свой аккаунт",
    email: "Эл. почта", password: "Пароль",
    emailInvalid: "Введите корректный email", passwordRequired: "Пароль обязателен",
  },
  nav: {
    dashboard: "Панель", warehouses: "Склады", production: "Производство",
    quality: "Контроль качества", maintenance: "Техобслуживание",
    costing: "Калькуляция", finance: "Финансы", analytics: "Аналитика",
    reports: "Отчёты", users: "Пользователи", settings: "Настройки", notifications: "Уведомления",
    tolling: "Давальческий",
  },
  dashboard: {
    title: "Панель управления", todayFiber: "Волокно за сегодня", cottonToFiber: "Хлопок → Волокно",
    todayYarn: "Пряжа за сегодня", fiberToYarn: "Волокно → Пряжа",
    avgYarnCost: "Ср. себ-сть пряжи", thisMonth: "За этот месяц",
    activeBatches: "Активные партии", cotton: "Хлопок", yarn: "Пряжа",
    productionTrend: "Динамика производства (30 дней)", fiberKg: "Волокно (кг)", yarnKg: "Пряжа (кг)",
    warehouseValue: "Стоимость запасов", yarnCostTrend: "Динамика себестоимости",
    avgCostPerKg: "Ср. себ-сть/кг", currentYarnCosts: "Текущая себестоимость пряжи",
    noYarnBatches: "Партии пряжи ещё не завершены", warehouseBalances: "Остатки на складах",
  },
  warehouses: {
    receiveStock: "Принять на склад", stockBalances: "Остатки",
    movements: "Движения", products: "Продукция",
    colWarehouse: "Склад", colProduct: "Продукт", colType: "Тип",
    colQtyKg: "Кол-во (кг)", colAvgCost: "Ср. стоимость/кг", colTotalValue: "Общая стоимость",
    colLastMovement: "Последнее движение", colTotalCost: "Итого",
    receiveStockTitle: "Принять товар на склад", warehouse: "Склад",
    costPerKg: "Цена за кг", notes: "Примечание (необязательно)", receiving: "Принятие…", stockReceived: "Товар принят",
    addWarehouse: "Добавить склад", addWarehouseTitle: "Новый склад",
    warehouseName: "Название", warehouseCode: "Код (напр. WH-01)", warehouseType: "Тип склада",
    location: "Местоположение (необязательно)", capacityKg: "Вместимость (кг, необязательно)",
    warehouseAdded: "Склад создан", adding: "Создание…",
    addProduct: "Добавить продукт", addProductTitle: "Новый продукт",
    productName: "Название продукта", productCode: "Код (напр. YRN-Ne30)", productType: "Тип продукта",
    yarnCount: "Номер пряжи (напр. Ne30/1)", yarnType: "Вид пряжи (напр. Гребённая)",
    productAdded: "Продукт создан",
    colCode: "Код", colUnit: "Ед. изм.",
    wtCotton: "Хлопок", wtFiber: "Волокно", wtWip: "НЗП", wtYarn: "Пряжа", wtWaste: "Отходы", wtOther: "Прочее",
    ptRawCotton: "Сырой хлопок", ptFiber: "Волокно", ptSeed: "Семена", ptLint: "Линт", ptYarn: "Пряжа", ptWaste: "Отходы", ptOther: "Прочее",
    sourceType: "Тип источника", sourceOwn: "Собственное", sourceTolling: "Давальческое", tollingCompany: "Компания (Договор)", selectContract: "Выберите договор",
    editWarehouseTitle: "Изменить склад", editProductTitle: "Изменить продукт",
    deleteWarehouseConfirm: "Удалить этот склад? Это действие необратимо.",
    deleteProductConfirm: "Удалить этот продукт? Это действие необратимо.",
    productUpdated: "Продукт обновлён", warehouseDeleted: "Склад удалён", productDeleted: "Продукт удалён",
  },
  production: {
    newBatch: "Новая партия", activeCottonBatches: "Активные партии хлопка",
    activeYarnBatches: "Активные партии пряжи", cottonBatchesTotal: "Партий хлопка всего",
    yarnBatchesTotal: "Партий пряжи всего", cottonToFiber: "Хлопок → Волокно", fiberToYarn: "Волокно → Пряжа",
    colBatch: "Партия", colProduct: "Продукт", colNeCount: "Ne номер", colStatus: "Статус",
    colStart: "Начало", colEnd: "Конец", colCottonInput: "Вход хлопка", colFiberOutput: "Выход волокна",
    colYield: "Выход", colFiberCostKg: "Себ-сть волокна/кг", colFiberInput: "Вход волокна",
    colYarnOutput: "Выход пряжи", colWastePct: "Отходы %", colEfficiency: "Эффективность", colCostKg: "Себ-сть/кг",
    backToList: "← Производство", addCottonInput: "Добавить хлопок", addFiberInput: "Добавить волокно",
    addExpense: "Добавить расход", completeBatch: "Завершить партию", completing: "Завершение…",
    batchCompleted: "Партия успешно завершена", adding: "Добавление…",
    inputAdded: "Сырьё добавлено", expenseAdded: "Расход добавлен",
    costBreakdown: "Структура затрат", expenses: "Расходы", product: "Продукт",
    quantityKg: "Количество (кг)", category: "Категория", expenseDate: "Дата расхода",
    optDescription: "Описание (необязательно)",
    fiberOutputKg: "Выход волокна (кг)", seedOutputKg: "Семена (кг)",
    lintOutputKg: "Линт (кг)", wasteOutputKg: "Отходы (кг)",
    seedCreditValue: "Кредит за семена", lintCreditValue: "Кредит за линт",
    yarnOutputKg: "Выход пряжи (кг)", endDate: "Дата завершения",
    cottonInput: "Вход хлопка (кг)", cottonCost: "Стоимость хлопка",
    fiberInput: "Вход волокна (кг)", fiberCost: "Стоимость волокна",
    netCost: "Чистые затраты", totalExpenses: "Итого расходы", byproductCredits: "Кредиты за побочные продукты",
    newCottonBatchTitle: "Новая партия хлопка", newYarnBatchTitle: "Новая партия пряжи",
    startDate: "Дата начала", selectYarnProduct: "Продукт (пряжа)", batchCreated: "Партия создана", creating: "Создание…",
    fiberSourceWarehouse: "Склад волокна (источник)", yarnTargetWarehouse: "Склад пряжи (назначение)",
    // Production Orders
    orders: "Заказы", ordersTab: "Производственные заказы", shiftReportsTab: "Сменные отчёты",
    newOrder: "Новый заказ", newShiftReport: "Новый отчёт",
    ordersInProgress: "В процессе", ordersDelayed: "Задержаны", completedToday: "Завершено сегодня",
    outputToday: "Выпуск сегодня", avgConversion: "Ср. конверсия", activeLines: "Активных линий",
    pendingQC: "Ожидают ОТК", colOrder: "Заказ", colLine: "Линия", colBrigade: "Бригада",
    colShift: "Смена", colPlanned: "План", colActual: "Факт",
    colCompletion: "Выполнение", colSupervisor: "Мастер",
    colConversion: "Конверсия", colReport: "Отчёт", colDate: "Дата",
    colWorkers: "Рабочих", colRuntime: "Время работы", colDowntime: "Простой",
    colOEE: "ОЭЭ",
    approve: "Утвердить", startProduction: "Начать", completeOrder: "Завершить", cancelOrder: "Отменить",
    orderApproved: "Заказ утверждён", orderStarted: "Производство начато",
    orderCompleted: "Заказ завершён", orderCancelled: "Заказ отменён",
    qcPassed: "ОТК пройден", qcFailed: "ОТК не пройден",
    traceability: "Прослеживаемость", batchDetails: "Сведения о партии",
    brigadeAnalytics: "Эффективность бригад", reportSubmitted: "Отчёт подан",
    reportApproved: "Отчёт утверждён", submitReport: "Подать", approveReport: "Утвердить",
    colInputKg: "Вход (кг)", colOutputKg: "Выход (кг)", colWasteKg: "Отходы (кг)",
  },
  costing: {
    title: "Калькуляция затрат", avgYarnCostMonth: "Ср. себ-сть пряжи (месяц)",
    avgFiberCostMonth: "Ср. себ-сть волокна (месяц)", yarnProducedMonth: "Пряжи произведено (месяц)",
    avgWastePct: "Ср. отходы %", yarnCostTrend90: "Динамика себестоимости пряжи (90 дней)",
    yarnCostKg: "Себестоимость пряжи/кг", expenseBreakdown: "Структура затрат на прядение",
    currentYarnCostsByProduct: "Текущая себестоимость пряжи по продуктам",
  },
  finance: {
    totalExpensesMonth: "Расходы (месяц)", totalIncomeMonth: "Доходы (месяц)",
    netMonth: "Итого (месяц)", expensesByCategory: "Расходы по статьям (этот месяц)",
    amount: "Сумма", recentTransactions: "Последние операции",
    colType: "Тип", colDescription: "Описание", colDir: "Напр.",
    expense: "▼ РАС", income: "▲ ДОХ",
  },
  analytics: {
    machineOutput30: "Производительность машин (30 дней)", yarnOutputKg: "Выход пряжи (кг)",
    wasteKg: "Отходы (кг)", last10BatchesCost: "Последние 10 партий — себ-сть/кг",
    yarnCostKg: "Себестоимость пряжи/кг", machinePerformance: "Сводка по производительности машин",
    colMachine: "Машина", colShifts: "Смены", colYarnOutput: "Выход пряжи",
    colWaste: "Отходы", colAvgDowntime: "Ср. простой",
  },
  reports: {
    subtitle: "Формирование и загрузка отчётов о производстве и себестоимости в формате Excel.",
    from: "С", to: "По", generating: "Формирование…", downloadExcel: "Скачать Excel",
    downloaded: "загружен!", downloadFailed: "Ошибка загрузки. Попробуйте снова.",
    powerBiTitle: "Интеграция с Power BI",
    powerBiDesc: "Все конечные точки отчётов доступны как JSON REST API для Power BI DirectQuery. Добавьте ?format=json к URL отчёта. Используйте JWT-токен в заголовке Authorization.",
    yarnCostTitle: "Отчёт по себестоимости пряжи",
    yarnCostDesc: "Детальная структура затрат по каждой партии пряжи — стоимость волокна, расходы на прядение и итоговая себестоимость/кг.",
    fiberCostTitle: "Отчёт по себестоимости волокна",
    fiberCostDesc: "Затраты на переработку хлопка в волокно с учётом побочных продуктов и анализа выхода.",
    warehouseBalanceTitle: "Отчёт по остаткам склада",
    warehouseBalanceDesc: "Текущие остатки на всех складах со средними ценами и общей стоимостью.",
    wasteAnalysisTitle: "Анализ отходов",
    wasteAnalysisDesc: "Процент и количество отходов по партиям пряжи — выявление потерь эффективности.",
  },
  users: {
    title: "Пользователи и роли", inviteUser: "Пригласить",
    searchPlaceholder: "Поиск по имени или email…",
    deactivated: "Пользователь деактивирован", activated: "Пользователь активирован",
    deactivateFailed: "Ошибка деактивации",
    deactivate: "Деактивировать", activate: "Активировать",
    colName: "Имя", colRole: "Роль", colDepartment: "Отдел",
    colStatus: "Статус", colLastLogin: "Последний вход", colActions: "Действия",
  },
  settings: {
    profile: "Профиль", security: "Безопасность", appearance: "Внешний вид",
    theme: "Тема", themeLight: "Светлая", themeDark: "Тёмная", themeSystem: "Системная",
    profileInfo: "Данные профиля", firstName: "Имя", lastName: "Фамилия",
    saveChanges: "Сохранить", changePassword: "Смена пароля",
    currentPassword: "Текущий пароль", newPassword: "Новый пароль",
    confirmPassword: "Подтвердите пароль", updatePassword: "Обновить пароль",
    notificationPrefs: "Настройки уведомлений",
    notificationItems: [
      "Завершение партии", "Низкий остаток на складе", "Резкий рост себестоимости",
      "Простой оборудования", "Ежедневный отчёт о производстве",
    ],
  },
  common: {
    noData: "Нет данных", live: "В эфире", perKg: "за кг", by: "Кем",
    date: "Дата", allTime: "За всё время", batches: "партий", updated: "Обновлено",
    searchProducts: "Поиск продуктов…",
    statusDraft: "Черновик", statusInProgress: "В процессе", statusCompleted: "Завершено",
    statusCancelled: "Отменено", statusActive: "Активный", statusInactive: "Неактивный",
    notifications: "Уведомления", noNotifications: "Нет новых уведомлений", markAllRead: "Отметить все прочитанными",
  },
  tolling: {
    title: "Давальческие Контракты", contracts: "Контракты", newContract: "Новый контракт",
    contractNumber: "Контракт №", contractDate: "Дата контракта", customer: "Заказчик",
    customerInn: "ИНН", startDate: "Дата начала", endDate: "Дата окончания",
    status: "Статус", contractType: "Тип",
    external: "Внешний", internal: "Внутренний",
    yarnPriceUsd: "Цена пряжи (USD/кг)", exchangeRate: "Курс (UZS/USD)",
    processorShare: "Доля переработчика %", customerShare: "Доля давальца %", lossShare: "Угар %",
    targetYarnProduct: "Продукт пряжи", vatIncluded: "НДС включен (12%)",
    paymentTermDays: "Срок оплаты (дней)",
    rawWarehouse: "Склад сырья", fgWarehouse: "Склад готовой продукции",
    statusDraft: "Черновик", statusActive: "Активный", statusSuspended: "Приостановлен",
    statusCompleted: "Завершён", statusCancelled: "Отменён",
    receipts: "Приём сырья", newReceipt: "Принять волокно", receiptNumber: "Квитанция №",
    receiptDate: "Дата приёма", fiberProduct: "Продукт (волокно)", quantityKg: "Количество (кг)",
    qualityGrade: "Сорт качества", ttnNumber: "ТТН №", supplierName: "Поставщик",
    receiveBtn: "Принять", received: "Принято",
    deliveries: "Выдача продукции", newDelivery: "Новая выдача", deliveryDate: "Дата выдачи",
    deliveryNumber: "Выдача №", deliverBtn: "Завершить выдачу", delivered: "Выдано",
    invoices: "Счета-фактуры", invoiceNumber: "Счёт №", invoiceDate: "Дата счёта",
    baseAmount: "Базовая сумма", vatAmount: "НДС (12%)", totalAmount: "Итого",
    paidAmount: "Оплачено", balanceDue: "Остаток долга", paymentDue: "Срок оплаты",
    recordPayment: "Зафиксировать оплату", paymentAmount: "Сумма оплаты",
    totalFiberReceived: "Принято волокна", totalYarnProduced: "Произведено пряжи",
    totalServiceFee: "Услуга (с НДС)", totalPaid: "Оплачено",
    contractBalance: "Задолженность", daysUntilExpiry: "Дней до окончания",
    processorYarnKg: "Доля переработчика (кг)", customerYarnKg: "Доля давальца (кг)",
    lossYarnKg: "Угар (кг)", serviceFeePerKg: "Услуга/кг волокна",
    activate: "Активировать", suspend: "Приостановить", creating: "Создание…",
    contractCreated: "Контракт создан", notes: "Примечания", advancePaymentPct: "Аванс %",
    colContract: "Контракт", colCustomer: "Заказчик", colStatus: "Статус",
    colTotal: "Сумма (UZS)", colBalance: "Задолженность", colDate: "Дата",
  },
  quality: {
    title: "Контроль качества", dashboard: "Панель КК",
    tests: "Тесты качества", newTest: "Новый тест", testNumber: "Тест №", testType: "Тип теста",
    testDate: "Дата теста", testedBy: "Испытатель", labEquipment: "Оборудование",
    sampleSizeKg: "Размер образца (кг)", sampleLocation: "Место образца", sampleTakenBy: "Образец взял",
    overallResult: "Результат", qualityGrade: "Сорт", approvedForUse: "Утверждён",
    batchNumber: "Партия №", productName: "Продукт",
    parameters: "Параметры", parameterCode: "Код", measuredValue: "Измеренное значение",
    withinSpec: "В норме", deviation: "Отклонение %",
    passRate: "Процент прохождения", totalTests: "Всего тестов", passed: "Прошли", failed: "Не прошли",
    certificates: "Сертификаты", certificateNumber: "Серт. №", issueDate: "Дата выдачи", validUntil: "Действителен до",
    issuedBy: "Выдан", approvedBy: "Утверждён", compliesWith: "Соответствует", cancelCertificate: "Аннулировать",
    defects: "Дефекты", newDefect: "Зарегистрировать дефект", defectNumber: "Дефект №", defectType: "Тип дефекта",
    severity: "Критичность", quantityAffected: "Объём (кг)", detectedBy: "Обнаружил", detectedDate: "Дата обнаружения",
    rootCause: "Корень причины", correctiveAction: "Корр. действие", disposition: "Решение",
    resolveDefect: "Закрыть дефект", defectResolved: "Дефект закрыт",
    evaluate: "Оценить", evaluating: "Оценка…", evaluated: "Результаты оценены",
    approve: "Утвердить", approving: "Утверждение…", approveTest: "Утвердить тест", testApproved: "Тест утверждён",
    rejectTest: "Отклонить", rejectionReason: "Причина отказа", testRejected: "Тест отклонён",
    issueCert: "Выдать сертификат", certIssued: "Сертификат выдан",
    gradeA: "Сорт A", gradeB: "Сорт B", gradeC: "Сорт C",
    statusPending: "Ожидает", statusPassed: "Прошёл", statusFailed: "Не прошёл",
    statusConditional: "Условно", statusRetest: "Повторный тест",
    defectOpen: "Открыт", defectInvestigating: "Расследуется", defectResolved2: "Устранён", defectClosed: "Закрыт",
    incomingRaw: "Входящее сырьё", inProcess: "В процессе", finalProduct: "Готовая продукция", periodic: "Периодический",
    colTest: "Тест", colType: "Тип", colBatch: "Партия", colProduct: "Продукт",
    colDate: "Дата", colResult: "Результат", colGrade: "Сорт", colApproved: "Утверждён",
    colCertificate: "Сертификат", colIssueDate: "Дата выдачи", colValid: "Действителен до",
    colDefect: "Дефект", colSeverity: "Критичность", colQty: "Кол-во (кг)", colStatus: "Статус",
    complianceScore: "Соответствие норме", gradeDistribution: "Распределение по сортам", defectPareto: "Дефекты по типам",
    passRateTrend: "Процент прохождения", noTests: "Тестов пока нет", noCertificates: "Сертификатов нет", noDefects: "Дефектов нет",
  },
  maintenance: {
    title: "Оборудование и ТО", dashboard: "Панель ТО",
    equipment: "Оборудование", records: "Записи ТО", downtime: "Простои",
    spareParts: "Запасные части", schedules: "Расписание",
    newEquipment: "Новое оборудование", newRecord: "Новое ТО", reportDowntime: "Зарегистрировать простой",
    equipmentCode: "Код оборудования", equipmentName: "Наименование", equipmentType: "Тип",
    manufacturer: "Производитель", model: "Модель", serialNumber: "Серийный номер",
    location: "Местоположение", status: "Статус", nextMaintenance: "Следующее ТО",
    lastMaintenance: "Последнее ТО", operatingHours: "Часы работы", isOverdue: "Просрочено",
    statusOperational: "Рабочее", statusMaintenance: "На ТО", statusBreakdown: "Поломка",
    statusIdle: "Простой", statusDecommissioned: "Списано",
    oee: "ОЭЭ", oeeTitle: "Панель ОЭЭ", availability: "Доступность",
    performance: "Производительность", quality: "Качество",
    scheduledDate: "Дата плановая", maintenanceType: "Вид ТО", technician: "Техник",
    duration: "Длительность (ч)", laborCost: "Затраты на труд", partsCost: "Затраты на запчасти", totalCost: "Итого затраты",
    workDescription: "Описание работ", findings: "Выявленные неисправности", recommendations: "Рекомендации",
    startMaintenance: "Начать ТО", completeMaintenance: "Завершить", approveMaintenance: "Утвердить",
    maintenanceStarted: "ТО начато", maintenanceCompleted: "ТО завершено", maintenanceApproved: "ТО утверждено",
    typePreventive: "Плановое", typeCorrective: "Ремонт", typePredictive: "Предиктивное",
    typeEmergency: "Аварийное", typeOverhaul: "Капремонт",
    partCode: "Код запчасти", partName: "Наименование", category: "Категория", currentStock: "На складе",
    minimumStock: "Мин. запас", unitCost: "Цена за ед.", lowStock: "Мало на складе", restock: "Пополнить",
    restockQty: "Количество к добавлению", restocked: "Запас пополнен", isCritical: "Критичная",
    downtimeNumber: "Простой №", downtimeType: "Тип простоя", reason: "Причина",
    startTime: "Время начала", endTime: "Время окончания", durationHours: "Длительность (ч)",
    productionLoss: "Потери производства (кг)", actionTaken: "Принятые меры", resolve: "Закрыть", resolved: "Простой закрыт",
    active: "Активный", mttr: "MTTR (ч)", totalDowntime: "Суммарный простой (ч)",
    usePart: "Использовать запчасть", partUsed: "Использование запчасти зафиксировано", quantity: "Количество", condition: "Состояние",
    colEquipment: "Оборудование", colType: "Тип", colStatus: "Статус", colNext: "Следующее ТО",
    colRecord: "Запись", colDate: "Дата", colTechnician: "Техник", colCost: "Итого",
    colDowntime: "Простой", colDuration: "Длительность", colReason: "Причина",
    colPart: "Запчасть", colStock: "На складе", colMin: "Мин.", colReorder: "Дозаказ?",
    noEquipment: "Оборудование не зарегистрировано", noRecords: "Записей ТО нет", noDowntime: "Простоев нет", noParts: "Запасных частей нет",
    upcomingMaintenance: "Предстоящие ТО", overdueAlert: "Просрочено", lowStockAlert: "Мало на складе",
    activeDowntime: "Активные простои", avgOEE: "Ср. ОЭЭ", maintenanceCost: "Затраты на ТО",
  },
  advancedAnalytics: {
    title: "Расширенная аналитика", executiveDashboard: "Исполнительная панель",
    costAnalysis: "Анализ затрат", profitability: "Рентабельность", kpiDashboard: "KPI панель", forecasting: "Прогнозирование",
    standardCosts: "Нормативные затраты", actualCosts: "Фактические затраты",
    newStandardCost: "Новая норма затрат", newActualCost: "Новые факт. затраты", newAnalysis: "Новый анализ", newForecast: "Новый прогноз",
    costPeriod: "Период затрат", rawMaterialCost: "Сырьё", laborCost: "Труд",
    overheadCost: "Накладные", energyCost: "Энергия", totalStandardCost: "Итого (норм.)",
    maintenanceCost: "ТО", wasteCost: "Отходы", totalActualCost: "Итого (факт.)",
    costPerKg: "Себест./кг", quantityKg: "Кол-во (кг)",
    revenue: "Выручка", cogs: "Себестоимость", grossProfit: "Валовая прибыль", grossMargin: "Валовая маржа %",
    overhead: "Накладные", netProfit: "Чистая прибыль", netMargin: "Чистая маржа %", revenuePerKg: "Выр./кг",
    efficiency: "Эффективность %", qualityPassRate: "Качество %", wastePct: "Отходы %",
    downtimeHours: "Простой (ч)", oee: "ОЭЭ %", energyKwh: "Энергия (кВт·ч)",
    forecastQty: "Прогноз (кг)", actualQty: "Факт (кг)", accuracy: "Точность %",
    confidenceLow: "Конф. нижн.", confidenceHigh: "Конф. верхн.", method: "Метод",
    methodMovingAvg: "Скольз. среднее", methodLinearReg: "Линейн. регрессия", methodManual: "Вручную",
    periodWeekly: "Нед.", periodMonthly: "Мес.", periodQuarterly: "Квар.",
    compareStdVsActual: "Норм. vs Факт.", variance: "Отклонение",
    costBreakdown: "Структура затрат", costTrend: "Динамика затрат", profitabilityTrend: "Динамика прибыли",
    noData: "Нет данных", updateActual: "Обновить факт", actualUpdated: "Факт обновлён",
    colProduct: "Продукт", colPeriod: "Период", colStdCost: "Норм. себест.", colActualCost: "Факт. себест.",
    colVariance: "Откл.", colRevenue: "Выручка", colNetProfit: "Чист. прибыль", colMargin: "Маржа",
    colDate: "Дата", colLine: "Линия", colEfficiency: "Эфф-ть", colOEE: "ОЭЭ",
    colForecastQty: "Прогноз", colActualQty: "Факт", colAccuracy: "Точность",
    totalOutput: "Всего продукции", avgEfficiency: "Ср. эфф-ть", avgOEE: "Ср. ОЭЭ", activeDowntime: "Акт. простои",
    totalTests: "Всего тестов", passRate: "Прохождение", avgNetMargin: "Ср. маржа",
  },
};

const uz: Translations = {
  locale: "uz",
  dateLocale: "ru-RU",
  auth: {
    signIn: "Kirish", signingIn: "Kirilmoqda…", signInSubtitle: "Hisobingizga kiring",
    email: "Elektron pochta", password: "Parol",
    emailInvalid: "To'g'ri elektron pochta kiriting", passwordRequired: "Parol kiritilishi shart",
  },
  nav: {
    dashboard: "Boshqaruv", warehouses: "Omborxonalar", production: "Ishlab chiqarish",
    quality: "Sifat nazorati", maintenance: "Texnik xizmat",
    costing: "Narxlash", finance: "Moliya", analytics: "Tahlil",
    reports: "Hisobotlar", users: "Foydalanuvchilar", settings: "Sozlamalar", notifications: "Bildirishnomalar",
    tolling: "Daval",
  },
  dashboard: {
    title: "Boshqaruv paneli", todayFiber: "Bugungi tola", cottonToFiber: "Paxta → Tola",
    todayYarn: "Bugungi ip", fiberToYarn: "Tola → Ip",
    avgYarnCost: "O'rt. ip tannarxi", thisMonth: "Bu oy",
    activeBatches: "Faol partiyalar", cotton: "Paxta", yarn: "Ip",
    productionTrend: "Ishlab chiqarish trendi (30 kun)", fiberKg: "Tola (kg)", yarnKg: "Ip (kg)",
    warehouseValue: "Ombor qiymati", yarnCostTrend: "Ip tannarxi trendi",
    avgCostPerKg: "O'rt. narx/kg", currentYarnCosts: "Joriy ip tannarxi",
    noYarnBatches: "Ip partiyalari hali yakunlanmagan", warehouseBalances: "Ombor qoldiqlari",
  },
  warehouses: {
    receiveStock: "Qabul qilish", stockBalances: "Qoldiqlar",
    movements: "Harakatlar", products: "Mahsulotlar",
    colWarehouse: "Ombor", colProduct: "Mahsulot", colType: "Tur",
    colQtyKg: "Miqdor (kg)", colAvgCost: "O'rt. narx/kg", colTotalValue: "Umumiy qiymat",
    colLastMovement: "Oxirgi harakat", colTotalCost: "Jami",
    receiveStockTitle: "Omborga qabul qilish", warehouse: "Ombor",
    costPerKg: "Kg narxi", notes: "Izoh (ixtiyoriy)", receiving: "Qabul qilinmoqda…", stockReceived: "Mahsulot qabul qilindi",
    addWarehouse: "Ombor qo'shish", addWarehouseTitle: "Yangi ombor",
    warehouseName: "Nomi", warehouseCode: "Kod (mas. WH-01)", warehouseType: "Ombor turi",
    location: "Manzil (ixtiyoriy)", capacityKg: "Sig'im (kg, ixtiyoriy)",
    warehouseAdded: "Ombor yaratildi", adding: "Yaratilmoqda…",
    addProduct: "Mahsulot qo'shish", addProductTitle: "Yangi mahsulot",
    productName: "Mahsulot nomi", productCode: "Kod (mas. YRN-Ne30)", productType: "Mahsulot turi",
    yarnCount: "Ip raqami (mas. Ne30/1)", yarnType: "Ip turi (mas. Taralgan)",
    productAdded: "Mahsulot yaratildi",
    colCode: "Kod", colUnit: "O'lchov",
    wtCotton: "Paxta", wtFiber: "Tola", wtWip: "NTM", wtYarn: "Ip", wtWaste: "Chiqindi", wtOther: "Boshqa",
    ptRawCotton: "Xom paxta", ptFiber: "Tola", ptSeed: "Urug'", ptLint: "Lint", ptYarn: "Ip", ptWaste: "Chiqindi", ptOther: "Boshqa",
    sourceType: "Kirim turi", sourceOwn: "O'zining", sourceTolling: "Tolling (Daval)", tollingCompany: "Kompaniya (Shartnoma)", selectContract: "Shartnomani tanlang",
    editWarehouseTitle: "Omborni tahrirlash", editProductTitle: "Mahsulotni tahrirlash",
    deleteWarehouseConfirm: "Bu ombor o'chirilsinmi? Bu amalni bekor qilib bo'lmaydi.",
    deleteProductConfirm: "Bu mahsulot o'chirilsinmi? Bu amalni bekor qilib bo'lmaydi.",
    productUpdated: "Mahsulot yangilandi", warehouseDeleted: "Ombor o'chirildi", productDeleted: "Mahsulot o'chirildi",
  },
  production: {
    newBatch: "Yangi partiya", activeCottonBatches: "Faol paxta partiyalari",
    activeYarnBatches: "Faol ip partiyalari", cottonBatchesTotal: "Paxta partiyalari jami",
    yarnBatchesTotal: "Ip partiyalari jami", cottonToFiber: "Paxta → Tola", fiberToYarn: "Tola → Ip",
    colBatch: "Partiya", colProduct: "Mahsulot", colNeCount: "Ne raqami", colStatus: "Holat",
    colStart: "Boshlanish", colEnd: "Tugash", colCottonInput: "Paxta kirishi", colFiberOutput: "Tola chiqishi",
    colYield: "Hosil", colFiberCostKg: "Tola tannarxi/kg", colFiberInput: "Tola kirishi",
    colYarnOutput: "Ip chiqishi", colWastePct: "Chiqindi %", colEfficiency: "Samaradorlik", colCostKg: "Narx/kg",
    backToList: "← Ishlab chiqarish", addCottonInput: "Paxta qo'shish", addFiberInput: "Tola qo'shish",
    addExpense: "Xarajat qo'shish", completeBatch: "Partiyani yakunlash", completing: "Yakunlanmoqda…",
    batchCompleted: "Partiya muvaffaqiyatli yakunlandi", adding: "Qo'shilmoqda…",
    inputAdded: "Xomashyo qo'shildi", expenseAdded: "Xarajat qo'shildi",
    costBreakdown: "Xarajatlar tarkibi", expenses: "Xarajatlar", product: "Mahsulot",
    quantityKg: "Miqdor (kg)", category: "Kategoriya", expenseDate: "Xarajat sanasi",
    optDescription: "Tavsif (ixtiyoriy)",
    fiberOutputKg: "Tola chiqishi (kg)", seedOutputKg: "Urug' (kg)",
    lintOutputKg: "Lint (kg)", wasteOutputKg: "Chiqindi (kg)",
    seedCreditValue: "Urug' krediti", lintCreditValue: "Lint krediti",
    yarnOutputKg: "Ip chiqishi (kg)", endDate: "Tugash sanasi",
    cottonInput: "Paxta kirishi (kg)", cottonCost: "Paxta qiymati",
    fiberInput: "Tola kirishi (kg)", fiberCost: "Tola qiymati",
    netCost: "Sof xarajat", totalExpenses: "Jami xarajatlar", byproductCredits: "Yon mahsulot kreditlari",
    newCottonBatchTitle: "Yangi paxta partiyasi", newYarnBatchTitle: "Yangi ip partiyasi",
    startDate: "Boshlanish sanasi", selectYarnProduct: "Ip mahsuloti", batchCreated: "Partiya yaratildi", creating: "Yaratilmoqda…",
    fiberSourceWarehouse: "Tola ombori (manba)", yarnTargetWarehouse: "Ip ombori (manzil)",
    // Production Orders
    orders: "Buyurtmalar", ordersTab: "Ishlab chiqarish buyurtmalari", shiftReportsTab: "Smena xisobotlari",
    newOrder: "Yangi buyurtma", newShiftReport: "Yangi smena xisoboti",
    ordersInProgress: "Jarayonda", ordersDelayed: "Kechikkan", completedToday: "Bugun yakunlangan",
    outputToday: "Bugungi chiqim", avgConversion: "O'rt. konversiya", activeLines: "Faol liniyalar",
    pendingQC: "Sifat nazoratida", colOrder: "Buyurtma", colLine: "Liniya", colBrigade: "Brigada",
    colShift: "Smena", colPlanned: "Reja", colActual: "Haqiqiy",
    colCompletion: "Bajarilish", colSupervisor: "Mas'ul",
    colConversion: "Konversiya", colReport: "Hisobot", colDate: "Sana",
    colWorkers: "Ishchilar", colRuntime: "Ish vaqti", colDowntime: "To'xtash",
    colOEE: "OEE",
    approve: "Tasdiqlash", startProduction: "Boshlash", completeOrder: "Yakunlash", cancelOrder: "Bekor qilish",
    orderApproved: "Buyurtma tasdiqlandi", orderStarted: "Ishlab chiqarish boshlandi",
    orderCompleted: "Buyurtma yakunlandi", orderCancelled: "Buyurtma bekor qilindi",
    qcPassed: "Sifat o'tdi", qcFailed: "Sifat o'tmadi",
    traceability: "Kuzatuvchanlik", batchDetails: "Partiya tafsilotlari",
    brigadeAnalytics: "Brigada samaradorligi", reportSubmitted: "Hisobot yuborildi",
    reportApproved: "Hisobot tasdiqlandi", submitReport: "Yuborish", approveReport: "Tasdiqlash",
    colInputKg: "Kirish (kg)", colOutputKg: "Chiqish (kg)", colWasteKg: "Chiqindi (kg)",
  },
  costing: {
    title: "Tannarx kalkulyatsiyasi", avgYarnCostMonth: "O'rt. ip tannarxi (oy)",
    avgFiberCostMonth: "O'rt. tola tannarxi (oy)", yarnProducedMonth: "Ishlab chiqarilgan ip (oy)",
    avgWastePct: "O'rt. chiqindi %", yarnCostTrend90: "Ip tannarxi trendi (90 kun)",
    yarnCostKg: "Ip tannarxi/kg", expenseBreakdown: "Yigirish xarajatlari tarkibi",
    currentYarnCostsByProduct: "Mahsulot bo'yicha joriy ip tannarxi",
  },
  finance: {
    totalExpensesMonth: "Umumiy xarajatlar (oy)", totalIncomeMonth: "Umumiy daromad (oy)",
    netMonth: "Sof foyda (oy)", expensesByCategory: "Kategoriyalar bo'yicha xarajatlar (bu oy)",
    amount: "Summa", recentTransactions: "So'nggi operatsiyalar",
    colType: "Tur", colDescription: "Tavsif", colDir: "Yo'n.",
    expense: "▼ XAR", income: "▲ DAR",
  },
  analytics: {
    machineOutput30: "Mashinalar unumdorligi (30 kun)", yarnOutputKg: "Ip chiqishi (kg)",
    wasteKg: "Chiqindi (kg)", last10BatchesCost: "Oxirgi 10 partiya — narx/kg",
    yarnCostKg: "Ip tannarxi/kg", machinePerformance: "Mashinalar samaradorligi xulosasi",
    colMachine: "Mashina", colShifts: "Navbatlar", colYarnOutput: "Ip chiqishi",
    colWaste: "Chiqindi", colAvgDowntime: "O'rt. to'xtash",
  },
  reports: {
    subtitle: "Ishlab chiqarish va tannarx hisobotlarini Excel formatida yarating va yuklab oling.",
    from: "Dan", to: "Gacha", generating: "Yaratilmoqda…", downloadExcel: "Excel yuklab olish",
    downloaded: "yuklandi!", downloadFailed: "Yuklashda xato. Qayta urinib ko'ring.",
    powerBiTitle: "Power BI integratsiyasi",
    powerBiDesc: "Barcha hisobot nuqtalari Power BI DirectQuery uchun JSON REST API sifatida mavjud. Har qanday hisobot URL manziliga ?format=json qo'shing. Authorization sarlavhasida JWT tokeningizdan foydalaning.",
    yarnCostTitle: "Ip tannarxi hisoboti",
    yarnCostDesc: "Har bir ip partiyasi bo'yicha xarajatlar tarkibi — tola narxi, yigirish xarajatlari va yakuniy narx/kg.",
    fiberCostTitle: "Tola tannarxi hisoboti",
    fiberCostDesc: "Yon mahsulot kreditlari va hosil tahlilini o'z ichiga olgan paxtadan tolaga qayta ishlash xarajatlari.",
    warehouseBalanceTitle: "Ombor qoldiqlari hisoboti",
    warehouseBalanceDesc: "O'rtacha narxlar va umumiy qiymatlar bilan barcha omborlardagi joriy qoldiqlar.",
    wasteAnalysisTitle: "Chiqindi tahlili hisoboti",
    wasteAnalysisDesc: "Ip partiyalari bo'yicha chiqindi foizi va miqdori — samaradorlik yo'qotishlarini aniqlash.",
  },
  users: {
    title: "Foydalanuvchilar va rollar", inviteUser: "Taklif etish",
    searchPlaceholder: "Ism yoki email bo'yicha qidirish…",
    deactivated: "Foydalanuvchi faolsizlantirildi", activated: "Foydalanuvchi faollashtirildi",
    deactivateFailed: "Faolsizlantirish xatosi",
    deactivate: "Faolsizlantirish", activate: "Faollashtirish",
    colName: "Ism", colRole: "Rol", colDepartment: "Bo'lim",
    colStatus: "Holat", colLastLogin: "Oxirgi kirish", colActions: "Amallar",
  },
  settings: {
    profile: "Profil", security: "Xavfsizlik", appearance: "Ko'rinish",
    theme: "Mavzu", themeLight: "Yorug'", themeDark: "Qorong'u", themeSystem: "Tizim",
    profileInfo: "Profil ma'lumotlari", firstName: "Ism", lastName: "Familiya",
    saveChanges: "Saqlash", changePassword: "Parolni o'zgartirish",
    currentPassword: "Joriy parol", newPassword: "Yangi parol",
    confirmPassword: "Yangi parolni tasdiqlang", updatePassword: "Parolni yangilash",
    notificationPrefs: "Bildirishnoma sozlamalari",
    notificationItems: [
      "Partiya yakunlanganligi", "Kam qoldiq ogohlantirishi", "Narx oshishi ogohlantirishi",
      "Mashina to'xtab qolishi", "Kunlik ishlab chiqarish xulosasi",
    ],
  },
  common: {
    noData: "Ma'lumot yo'q", live: "Jonli", perKg: "kg uchun", by: "Kim tomonidan",
    date: "Sana", allTime: "Barcha vaqt", batches: "partiya", updated: "Yangilangan",
    searchProducts: "Mahsulot qidirish…",
    statusDraft: "Qoralama", statusInProgress: "Jarayonda", statusCompleted: "Yakunlandi",
    statusCancelled: "Bekor qilindi", statusActive: "Faol", statusInactive: "Faolsiz",
    notifications: "Bildirishnomalar", noNotifications: "Yangi bildirishnomalar yo'q", markAllRead: "Hammasini o'qilgan deb belgilash",
  },
  tolling: {
    title: "Daval Shartnomalar", contracts: "Shartnomalar", newContract: "Yangi shartnoma",
    contractNumber: "Shartnoma №", contractDate: "Shartnoma sanasi", customer: "Mijoz",
    customerInn: "INN", startDate: "Boshlanish sanasi", endDate: "Tugash sanasi",
    status: "Holat", contractType: "Tur",
    external: "Tashqi", internal: "Ichki",
    yarnPriceUsd: "Ip narxi (USD/kg)", exchangeRate: "Kurs (UZS/USD)",
    processorShare: "Qayta ishlovchi ulushi %", customerShare: "Davaletsiy ulushi %", lossShare: "Fire %",
    targetYarnProduct: "Ip mahsuloti", vatIncluded: "QQS qo'shiladi (12%)",
    paymentTermDays: "To'lov muddati (kun)",
    rawWarehouse: "Xom ashyo ombori", fgWarehouse: "Tayyor mahsulot ombori",
    statusDraft: "Qoralama", statusActive: "Faol", statusSuspended: "To'xtatilgan",
    statusCompleted: "Yakunlangan", statusCancelled: "Bekor qilingan",
    receipts: "Xom ashyo qabul", newReceipt: "Tola qabul qilish", receiptNumber: "Qabul №",
    receiptDate: "Qabul sanasi", fiberProduct: "Tola mahsuloti", quantityKg: "Miqdor (kg)",
    qualityGrade: "Sifat darajasi", ttnNumber: "TTN №", supplierName: "Yetkazib beruvchi",
    receiveBtn: "Qabul qilish", received: "Qabul qilindi",
    deliveries: "Topshirish", newDelivery: "Yangi topshirish", deliveryDate: "Topshirish sanasi",
    deliveryNumber: "Topshirish №", deliverBtn: "Topshirishni yakunlash", delivered: "Topshirildi",
    invoices: "Hisob-fakturalar", invoiceNumber: "Faktura №", invoiceDate: "Faktura sanasi",
    baseAmount: "Asosiy summa", vatAmount: "QQS (12%)", totalAmount: "Jami",
    paidAmount: "To'langan", balanceDue: "Qoldiq qarz", paymentDue: "To'lov muddati",
    recordPayment: "To'lovni qayd etish", paymentAmount: "To'lov summasi",
    totalFiberReceived: "Qabul qilingan tola", totalYarnProduced: "Ishlab chiqarilgan ip",
    totalServiceFee: "Xizmat haqi (QQS bilan)", totalPaid: "Jami to'langan",
    contractBalance: "Qoldiq qarz", daysUntilExpiry: "Tugashiga kun",
    processorYarnKg: "Qayta ishlovchi ulushi (kg)", customerYarnKg: "Davaletsiy ulushi (kg)",
    lossYarnKg: "Fire (kg)", serviceFeePerKg: "Xizmat haqi/kg tola",
    activate: "Faollashtirish", suspend: "To'xtatish", creating: "Yaratilmoqda…",
    contractCreated: "Shartnoma yaratildi", notes: "Izohlar", advancePaymentPct: "Avans %",
    colContract: "Shartnoma", colCustomer: "Mijoz", colStatus: "Holat",
    colTotal: "Jami (UZS)", colBalance: "Qoldiq", colDate: "Sana",
  },
  quality: {
    title: "Sifat nazorati", dashboard: "Sifat boshqaruvi",
    tests: "Sifat sinovlari", newTest: "Yangi sinov", testNumber: "Sinov №", testType: "Sinov turi",
    testDate: "Sinov sanasi", testedBy: "Laborant", labEquipment: "Jihozlar",
    sampleSizeKg: "Namuna miqdori (kg)", sampleLocation: "Namuna joyi", sampleTakenBy: "Namuna oldi",
    overallResult: "Umumiy natija", qualityGrade: "Sinf", approvedForUse: "Tasdiqlangan",
    batchNumber: "Partiya №", productName: "Mahsulot",
    parameters: "Parametrlar", parameterCode: "Kod", measuredValue: "O'lchov qiymati",
    withinSpec: "Normada", deviation: "Og'ish %",
    passRate: "O'tish darajasi", totalTests: "Jami sinovlar", passed: "O'tdi", failed: "O'tmadi",
    certificates: "Sertifikatlar", certificateNumber: "Sert. №", issueDate: "Berilgan sana", validUntil: "Amal qilish muddati",
    issuedBy: "Beruvchi", approvedBy: "Tasdiqlagan", compliesWith: "Standart", cancelCertificate: "Bekor qilish",
    defects: "Nuqsonlar", newDefect: "Nuqson qayd etish", defectNumber: "Nuqson №", defectType: "Nuqson turi",
    severity: "Darajasi", quantityAffected: "Ta'sirlangan miqdor (kg)", detectedBy: "Aniqladi", detectedDate: "Aniqlanish sanasi",
    rootCause: "Ildiz sabab", correctiveAction: "Tuzatish chorasi", disposition: "Qaror",
    resolveDefect: "Nuqsonni yopish", defectResolved: "Nuqson yopildi",
    evaluate: "Baholash", evaluating: "Baholanmoqda…", evaluated: "Natijalar baholandi",
    approve: "Tasdiqlash", approving: "Tasdiqlanmoqda…", approveTest: "Sinovni tasdiqlash", testApproved: "Sinov tasdiqlandi",
    rejectTest: "Rad etish", rejectionReason: "Rad etish sababi", testRejected: "Sinov rad etildi",
    issueCert: "Sertifikat berish", certIssued: "Sertifikat berildi",
    gradeA: "A sinf", gradeB: "B sinf", gradeC: "C sinf",
    statusPending: "Kutilmoqda", statusPassed: "O'tdi", statusFailed: "O'tmadi",
    statusConditional: "Shartli", statusRetest: "Qayta sinov",
    defectOpen: "Ochiq", defectInvestigating: "Tekshirilmoqda", defectResolved2: "Hal qilindi", defectClosed: "Yopildi",
    incomingRaw: "Kiruvchi xom ashyo", inProcess: "Jarayonda", finalProduct: "Tayyor mahsulot", periodic: "Davriy",
    colTest: "Sinov", colType: "Tur", colBatch: "Partiya", colProduct: "Mahsulot",
    colDate: "Sana", colResult: "Natija", colGrade: "Sinf", colApproved: "Tasdiqlangan",
    colCertificate: "Sertifikat", colIssueDate: "Berilgan sana", colValid: "Muddati",
    colDefect: "Nuqson", colSeverity: "Daraja", colQty: "Miqdor (kg)", colStatus: "Holat",
    complianceScore: "Mos kelish darajasi", gradeDistribution: "Sinf taqsimoti", defectPareto: "Nuqson turlari",
    passRateTrend: "O'tish darajasi", noTests: "Sinovlar hali yo'q", noCertificates: "Sertifikatlar yo'q", noDefects: "Nuqsonlar yo'q",
  },
  maintenance: {
    title: "Jihozlar va texnik xizmat", dashboard: "TX boshqaruvi",
    equipment: "Jihozlar", records: "TX yozuvlari", downtime: "To'xtashlar",
    spareParts: "Ehtiyot qismlar", schedules: "Jadval",
    newEquipment: "Yangi jihoz", newRecord: "Yangi TX", reportDowntime: "To'xtashni qayd etish",
    equipmentCode: "Jihoz kodi", equipmentName: "Jihoz nomi", equipmentType: "Turi",
    manufacturer: "Ishlab chiqaruvchi", model: "Model", serialNumber: "Seriya raqami",
    location: "Joylashuv", status: "Holat", nextMaintenance: "Keyingi TX",
    lastMaintenance: "Oxirgi TX", operatingHours: "Ish soatlari", isOverdue: "Muddati o'tgan",
    statusOperational: "Ishlayapti", statusMaintenance: "TX da", statusBreakdown: "Nosoz",
    statusIdle: "Ishlamayapti", statusDecommissioned: "Hisobdan chiqarilgan",
    oee: "OEE", oeeTitle: "OEE boshqaruvi", availability: "Mavjudlik",
    performance: "Unumdorlik", quality: "Sifat",
    scheduledDate: "Rejalashtirilgan sana", maintenanceType: "TX turi", technician: "Texnik",
    duration: "Davomiyligi (soat)", laborCost: "Mehnat xarajati", partsCost: "Qismlar xarajati", totalCost: "Jami xarajat",
    workDescription: "Ish tavsifi", findings: "Topilmalar", recommendations: "Tavsiyalar",
    startMaintenance: "TX boshlash", completeMaintenance: "Yakunlash", approveMaintenance: "Tasdiqlash",
    maintenanceStarted: "TX boshlandi", maintenanceCompleted: "TX yakunlandi", maintenanceApproved: "TX tasdiqlandi",
    typePreventive: "Profilaktik", typeCorrective: "Ta'mirlash", typePredictive: "Prognoz asosida",
    typeEmergency: "Favqulodda", typeOverhaul: "Kapital ta'mirlash",
    partCode: "Qism kodi", partName: "Qism nomi", category: "Kategoriya", currentStock: "Mavjud",
    minimumStock: "Min. zaxira", unitCost: "Birlik narxi", lowStock: "Kam zaxira", restock: "To'ldirish",
    restockQty: "Qo'shish miqdori", restocked: "Zaxira to'ldirildi", isCritical: "Muhim",
    downtimeNumber: "To'xtash №", downtimeType: "To'xtash turi", reason: "Sabab",
    startTime: "Boshlanish vaqti", endTime: "Tugash vaqti", durationHours: "Davomiylik (soat)",
    productionLoss: "Ishlab chiqarish yo'qotishi (kg)", actionTaken: "Ko'rilgan chora", resolve: "Yopish", resolved: "To'xtash yopildi",
    active: "Faol", mttr: "MTTR (soat)", totalDowntime: "Jami to'xtash (soat)",
    usePart: "Qism ishlatish", partUsed: "Qism ishlatildi", quantity: "Miqdor", condition: "Holat",
    colEquipment: "Jihoz", colType: "Tur", colStatus: "Holat", colNext: "Keyingi TX",
    colRecord: "Yozuv", colDate: "Sana", colTechnician: "Texnik", colCost: "Jami",
    colDowntime: "To'xtash", colDuration: "Davomiylik", colReason: "Sabab",
    colPart: "Qism", colStock: "Zaxira", colMin: "Min.", colReorder: "Buyurtma?",
    noEquipment: "Jihozlar ro'yxatga olinmagan", noRecords: "TX yozuvlari yo'q", noDowntime: "To'xtashlar yo'q", noParts: "Ehtiyot qismlar yo'q",
    upcomingMaintenance: "Yaqinlashayotgan TX", overdueAlert: "Muddati o'tgan", lowStockAlert: "Kam zaxira",
    activeDowntime: "Faol to'xtashlar", avgOEE: "O'rt. OEE", maintenanceCost: "TX xarajati",
  },
  advancedAnalytics: {
    title: "Kengaytirilgan tahlil", executiveDashboard: "Boshqaruvchi paneli",
    costAnalysis: "Xarajatlar tahlili", profitability: "Rentabellik", kpiDashboard: "KPI paneli", forecasting: "Prognozlash",
    standardCosts: "Normativ xarajatlar", actualCosts: "Haqiqiy xarajatlar",
    newStandardCost: "Yangi norma", newActualCost: "Yangi xarajat", newAnalysis: "Yangi tahlil", newForecast: "Yangi prognoz",
    costPeriod: "Xarajat davri", rawMaterialCost: "Xom ashyo", laborCost: "Mehnat",
    overheadCost: "Qo'shimcha xarajat", energyCost: "Energiya", totalStandardCost: "Jami (norma)",
    maintenanceCost: "TX xarajati", wasteCost: "Chiqindi", totalActualCost: "Jami (haqiqiy)",
    costPerKg: "Tannarx/kg", quantityKg: "Miqdor (kg)",
    revenue: "Daromad", cogs: "Tannarx", grossProfit: "Yalpi foyda", grossMargin: "Yalpi marjа %",
    overhead: "Qo'shimcha", netProfit: "Sof foyda", netMargin: "Sof marja %", revenuePerKg: "Dar./kg",
    efficiency: "Samaradorlik %", qualityPassRate: "Sifat %", wastePct: "Chiqindi %",
    downtimeHours: "To'xtash (soat)", oee: "OEE %", energyKwh: "Energiya (kVt·s)",
    forecastQty: "Prognoz (kg)", actualQty: "Haqiqiy (kg)", accuracy: "Aniqlik %",
    confidenceLow: "Konf. quyi", confidenceHigh: "Konf. yuqori", method: "Usul",
    methodMovingAvg: "Ko'ch. o'rtacha", methodLinearReg: "Chiziqli regr.", methodManual: "Qo'lda",
    periodWeekly: "Haftalik", periodMonthly: "Oylik", periodQuarterly: "Kvartal",
    compareStdVsActual: "Norma vs Haqiqiy", variance: "Og'ish",
    costBreakdown: "Xarajatlar tarkibi", costTrend: "Xarajatlar dinamikasi", profitabilityTrend: "Foyda dinamikasi",
    noData: "Ma'lumot yo'q", updateActual: "Haqiqiyni yangilash", actualUpdated: "Yangilandi",
    colProduct: "Mahsulot", colPeriod: "Davr", colStdCost: "Norma/kg", colActualCost: "Haqiqiy/kg",
    colVariance: "Og'ish", colRevenue: "Daromad", colNetProfit: "Sof foyda", colMargin: "Marja",
    colDate: "Sana", colLine: "Liniya", colEfficiency: "Sam-lik", colOEE: "OEE",
    colForecastQty: "Prognoz", colActualQty: "Haqiqiy", colAccuracy: "Aniqlik",
    totalOutput: "Jami mahsulot", avgEfficiency: "O'rt. sam-lik", avgOEE: "O'rt. OEE", activeDowntime: "Faol to'xt.",
    totalTests: "Jami testlar", passRate: "O'tish darajasi", avgNetMargin: "O'rt. marja",
  },
};

export const TRANSLATIONS: Record<Locale, Translations> = { en, ru, uz };

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  ru: "Русский",
  uz: "O'zbek",
};

export function useT(): Translations {
  const locale = useUIStore((s) => s.locale);
  return TRANSLATIONS[locale];
}

export function useLocale() {
  const locale = useUIStore((s) => s.locale);
  const setLocale = useUIStore((s) => s.setLocale);
  return { locale, setLocale };
}
