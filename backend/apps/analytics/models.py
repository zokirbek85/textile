from decimal import Decimal
from django.db import models
from django.core.validators import MinValueValidator
from core.models import AuditedModel


class ForecastPeriod(models.TextChoices):
    WEEKLY = "weekly", "Weekly"
    MONTHLY = "monthly", "Monthly"
    QUARTERLY = "quarterly", "Quarterly"


class ForecastMethod(models.TextChoices):
    MOVING_AVERAGE = "moving_average", "Moving Average"
    LINEAR_REGRESSION = "linear_regression", "Linear Regression"
    MANUAL = "manual", "Manual"


class WidgetType(models.TextChoices):
    KPI_CARD = "kpi_card", "KPI Card"
    BAR_CHART = "bar_chart", "Bar Chart"
    LINE_CHART = "line_chart", "Line Chart"
    PIE_CHART = "pie_chart", "Pie Chart"
    TABLE = "table", "Table"
    METRIC = "metric", "Metric"


class StandardCost(AuditedModel):
    """Standard cost norms per product for a given period."""

    product = models.ForeignKey(
        "warehouse.Product",
        on_delete=models.PROTECT,
        related_name="standard_costs",
    )
    cost_period_start = models.DateField()
    cost_period_end = models.DateField()
    raw_material_cost_per_kg = models.DecimalField(
        max_digits=14, decimal_places=2, validators=[MinValueValidator(Decimal("0"))]
    )
    labor_cost_per_kg = models.DecimalField(
        max_digits=14, decimal_places=2, validators=[MinValueValidator(Decimal("0"))]
    )
    overhead_cost_per_kg = models.DecimalField(
        max_digits=14, decimal_places=2, validators=[MinValueValidator(Decimal("0"))]
    )
    energy_cost_per_kg = models.DecimalField(
        max_digits=14, decimal_places=2, validators=[MinValueValidator(Decimal("0"))]
    )
    total_standard_cost_per_kg = models.DecimalField(
        max_digits=14, decimal_places=2, default=Decimal("0")
    )
    approved_by = models.ForeignKey(
        "users.User",
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name="approved_standard_costs",
    )
    notes = models.TextField(blank=True)

    class Meta:
        db_table = "analytics_standard_costs"
        ordering = ["-cost_period_start"]
        indexes = [models.Index(fields=["cost_period_start", "cost_period_end"])]
        verbose_name = "Standard Cost"
        verbose_name_plural = "Standard Costs"

    def __str__(self):
        return f"{self.product} | {self.cost_period_start} – {self.cost_period_end}"

    def save(self, *args, **kwargs):
        self.total_standard_cost_per_kg = (
            self.raw_material_cost_per_kg
            + self.labor_cost_per_kg
            + self.overhead_cost_per_kg
            + self.energy_cost_per_kg
        )
        super().save(*args, **kwargs)


class ActualCost(AuditedModel):
    """Actual cost breakdown for a production batch or order."""

    production_order = models.ForeignKey(
        "production.ProductionOrder",
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name="actual_costs",
    )
    production_batch = models.ForeignKey(
        "production.ProductionBatch",
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name="actual_costs",
    )
    cost_date = models.DateField(db_index=True)
    raw_material_cost_uzs = models.DecimalField(max_digits=18, decimal_places=2, default=Decimal("0"))
    labor_cost_uzs = models.DecimalField(max_digits=18, decimal_places=2, default=Decimal("0"))
    overhead_cost_uzs = models.DecimalField(max_digits=18, decimal_places=2, default=Decimal("0"))
    energy_cost_uzs = models.DecimalField(max_digits=18, decimal_places=2, default=Decimal("0"))
    maintenance_cost_uzs = models.DecimalField(max_digits=18, decimal_places=2, default=Decimal("0"))
    waste_cost_uzs = models.DecimalField(max_digits=18, decimal_places=2, default=Decimal("0"))
    total_cost_uzs = models.DecimalField(max_digits=18, decimal_places=2, default=Decimal("0"))
    quantity_kg = models.DecimalField(
        max_digits=12, decimal_places=3,
        validators=[MinValueValidator(Decimal("0.001"))],
    )
    cost_per_kg = models.DecimalField(max_digits=14, decimal_places=2, default=Decimal("0"))
    notes = models.TextField(blank=True)

    class Meta:
        db_table = "analytics_actual_costs"
        ordering = ["-cost_date"]
        indexes = [models.Index(fields=["cost_date"])]
        verbose_name = "Actual Cost"
        verbose_name_plural = "Actual Costs"

    def __str__(self):
        return f"Cost {self.cost_date} | {self.quantity_kg} kg | {self.total_cost_uzs} UZS"

    def save(self, *args, **kwargs):
        self.total_cost_uzs = (
            self.raw_material_cost_uzs + self.labor_cost_uzs
            + self.overhead_cost_uzs + self.energy_cost_uzs
            + self.maintenance_cost_uzs + self.waste_cost_uzs
        )
        if self.quantity_kg:
            self.cost_per_kg = (self.total_cost_uzs / self.quantity_kg).quantize(Decimal("0.01"))
        super().save(*args, **kwargs)


class ProfitabilityAnalysis(AuditedModel):
    """Revenue vs cost profitability snapshot per order or period."""

    production_order = models.ForeignKey(
        "production.ProductionOrder",
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name="profitability_analyses",
    )
    analysis_date = models.DateField(db_index=True)
    period_start = models.DateField(null=True, blank=True)
    period_end = models.DateField(null=True, blank=True)
    revenue_uzs = models.DecimalField(max_digits=18, decimal_places=2, default=Decimal("0"))
    cogs_uzs = models.DecimalField(
        max_digits=18, decimal_places=2, default=Decimal("0"),
        help_text="Cost of Goods Sold",
    )
    gross_profit_uzs = models.DecimalField(max_digits=18, decimal_places=2, default=Decimal("0"))
    gross_margin_pct = models.DecimalField(max_digits=7, decimal_places=4, default=Decimal("0"))
    overhead_allocated_uzs = models.DecimalField(max_digits=18, decimal_places=2, default=Decimal("0"))
    net_profit_uzs = models.DecimalField(max_digits=18, decimal_places=2, default=Decimal("0"))
    net_margin_pct = models.DecimalField(max_digits=7, decimal_places=4, default=Decimal("0"))
    quantity_kg = models.DecimalField(max_digits=12, decimal_places=3, default=Decimal("0"))
    revenue_per_kg = models.DecimalField(max_digits=14, decimal_places=2, default=Decimal("0"))
    notes = models.TextField(blank=True)

    class Meta:
        db_table = "analytics_profitability"
        ordering = ["-analysis_date"]
        indexes = [models.Index(fields=["analysis_date"])]
        verbose_name = "Profitability Analysis"
        verbose_name_plural = "Profitability Analyses"

    def __str__(self):
        return f"Profitability {self.analysis_date} | margin {self.net_margin_pct}%"

    def save(self, *args, **kwargs):
        self.gross_profit_uzs = self.revenue_uzs - self.cogs_uzs
        if self.revenue_uzs:
            self.gross_margin_pct = (self.gross_profit_uzs / self.revenue_uzs * 100).quantize(Decimal("0.0001"))
        self.net_profit_uzs = self.gross_profit_uzs - self.overhead_allocated_uzs
        if self.revenue_uzs:
            self.net_margin_pct = (self.net_profit_uzs / self.revenue_uzs * 100).quantize(Decimal("0.0001"))
        if self.quantity_kg:
            self.revenue_per_kg = (self.revenue_uzs / self.quantity_kg).quantize(Decimal("0.01"))
        super().save(*args, **kwargs)


class ProductionKPI(AuditedModel):
    """Daily KPI snapshot aggregated per production line and shift."""

    production_line = models.ForeignKey(
        "production.ProductionLine",
        on_delete=models.PROTECT,
        related_name="kpis",
    )
    kpi_date = models.DateField(db_index=True)
    shift = models.CharField(max_length=20, blank=True)
    output_kg = models.DecimalField(max_digits=12, decimal_places=3, default=Decimal("0"))
    target_kg = models.DecimalField(max_digits=12, decimal_places=3, default=Decimal("0"))
    efficiency_pct = models.DecimalField(max_digits=7, decimal_places=4, default=Decimal("0"))
    quality_pass_rate_pct = models.DecimalField(max_digits=7, decimal_places=4, default=Decimal("0"))
    waste_pct = models.DecimalField(max_digits=7, decimal_places=4, default=Decimal("0"))
    downtime_hours = models.DecimalField(max_digits=6, decimal_places=2, default=Decimal("0"))
    cost_per_kg = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)
    oee_pct = models.DecimalField(max_digits=7, decimal_places=4, null=True, blank=True)
    energy_kwh = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    class Meta:
        db_table = "analytics_production_kpi"
        ordering = ["-kpi_date"]
        unique_together = [("production_line", "kpi_date", "shift")]
        indexes = [models.Index(fields=["kpi_date"])]
        verbose_name = "Production KPI"
        verbose_name_plural = "Production KPIs"

    def __str__(self):
        return f"KPI {self.production_line} {self.kpi_date} | eff {self.efficiency_pct}%"

    def save(self, *args, **kwargs):
        if self.target_kg:
            self.efficiency_pct = (self.output_kg / self.target_kg * 100).quantize(Decimal("0.0001"))
        super().save(*args, **kwargs)


class ProductionForecast(AuditedModel):
    """Production demand forecast per product and period."""

    product = models.ForeignKey(
        "warehouse.Product",
        on_delete=models.PROTECT,
        related_name="forecasts",
    )
    forecast_date = models.DateField(help_text="Date when forecast was recorded")
    period = models.CharField(max_length=20, choices=ForecastPeriod.choices)
    period_start = models.DateField()
    period_end = models.DateField()
    forecast_quantity_kg = models.DecimalField(
        max_digits=12, decimal_places=3, validators=[MinValueValidator(Decimal("0"))]
    )
    actual_quantity_kg = models.DecimalField(max_digits=12, decimal_places=3, null=True, blank=True)
    forecast_accuracy_pct = models.DecimalField(max_digits=7, decimal_places=4, null=True, blank=True)
    confidence_low_kg = models.DecimalField(max_digits=12, decimal_places=3, null=True, blank=True)
    confidence_high_kg = models.DecimalField(max_digits=12, decimal_places=3, null=True, blank=True)
    method = models.CharField(max_length=30, choices=ForecastMethod.choices, default=ForecastMethod.MANUAL)
    notes = models.TextField(blank=True)

    class Meta:
        db_table = "analytics_forecasts"
        ordering = ["-forecast_date", "-period_start"]
        indexes = [models.Index(fields=["period_start", "period_end"])]
        verbose_name = "Production Forecast"
        verbose_name_plural = "Production Forecasts"

    def __str__(self):
        return f"Forecast {self.product} {self.period_start}–{self.period_end}"

    def update_accuracy(self):
        if self.actual_quantity_kg and self.forecast_quantity_kg:
            error = abs(self.actual_quantity_kg - self.forecast_quantity_kg)
            self.forecast_accuracy_pct = (
                (1 - error / self.forecast_quantity_kg) * 100
            ).quantize(Decimal("0.0001"))


class DashboardWidget(AuditedModel):
    """User-configurable dashboard widget layout."""

    user = models.ForeignKey(
        "users.User",
        on_delete=models.CASCADE,
        related_name="dashboard_widgets",
    )
    widget_type = models.CharField(max_length=20, choices=WidgetType.choices)
    title = models.CharField(max_length=200)
    config = models.JSONField(default=dict, help_text="Widget-specific config: data source, filters, chart type")
    position_x = models.PositiveSmallIntegerField(default=0)
    position_y = models.PositiveSmallIntegerField(default=0)
    width = models.PositiveSmallIntegerField(default=2)
    height = models.PositiveSmallIntegerField(default=1)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "analytics_dashboard_widgets"
        ordering = ["position_y", "position_x"]
        verbose_name = "Dashboard Widget"
        verbose_name_plural = "Dashboard Widgets"

    def __str__(self):
        return f"{self.user} | {self.title} ({self.widget_type})"
