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
  };
  production: {
    newBatch: string; activeCottonBatches: string; activeYarnBatches: string;
    cottonBatchesTotal: string; yarnBatchesTotal: string;
    cottonToFiber: string; fiberToYarn: string;
    colBatch: string; colProduct: string; colNeCount: string; colStatus: string;
    colStart: string; colEnd: string; colCottonInput: string; colFiberOutput: string;
    colYield: string; colFiberCostKg: string; colFiberInput: string;
    colYarnOutput: string; colWastePct: string; colEfficiency: string; colCostKg: string;
    // detail page
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
    costing: "Costing", finance: "Finance", analytics: "Analytics",
    reports: "Reports", users: "Users", settings: "Settings", notifications: "Notifications",
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
    costing: "Калькуляция", finance: "Финансы", analytics: "Аналитика",
    reports: "Отчёты", users: "Пользователи", settings: "Настройки", notifications: "Уведомления",
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
    costing: "Narxlash", finance: "Moliya", analytics: "Tahlil",
    reports: "Hisobotlar", users: "Foydalanuvchilar", settings: "Sozlamalar", notifications: "Bildirishnomalar",
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
