from __future__ import annotations

import random
from datetime import date, timedelta
from decimal import Decimal
from typing import Iterable, List

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
from django.db.models import F, Q

from apps.users.models import User
from apps.warehouse.models import (
    Warehouse,
    ProductCategory,
    Product,
    WarehouseType,
    StockLedger,
)
from apps.warehouse.services import receive_stock, issue_stock
from apps.cotton_production.models import Machine, CottonBatch, CottonBatchExpense, Shift as CottonShift
from apps.yarn_production.models import YarnBatch, YarnBatchExpense, YarnShift, BatchStatus
from apps.tolling.services import (
    create_contract,
    receive_raw_material,
    complete_tolling_yarn_batch,
    create_delivery,
    complete_delivery,
)
from apps.tolling.models import (
    TollingContract,
    TollingRawMaterialReceipt,
    TollingDelivery,
    TollingInvoice,
    ContractStatus,
    ReceiptStatus,
    DeliveryStatus,
    InvoiceStatus,
)
from apps.finance.models import FinancialTransaction, TransactionType
from apps.notifications.models import Notification
from core.utils import round_money, round_weight
from .demo_seed_utils import (
    DEMO_MARKER,
    DEMO_NOTE,
    build_usd_uzs_series,
    decimal_money,
    decimal_weight,
    generate_company_name,
    generate_local_address,
    generate_person_name,
    generate_phone_number,
    hourly_efficiency,
    is_weekend,
    select_client_status,
    select_invoice_payment_status,
    seed_rng,
    choose_contract_share,
    faker,
)


DEMO_WAREHOUSES = [
    {"name": "Demo Cotton Warehouse", "code": "DEM-WH-COT", "warehouse_type": WarehouseType.COTTON},
    {"name": "Demo Fiber Warehouse", "code": "DEM-WH-FIB", "warehouse_type": WarehouseType.FIBER},
    {"name": "Demo Yarn Warehouse", "code": "DEM-WH-YRN", "warehouse_type": WarehouseType.YARN},
    {"name": "Demo Waste Warehouse", "code": "DEM-WH-WST", "warehouse_type": WarehouseType.WASTE},
    {"name": "Demo WIP Warehouse", "code": "DEM-WH-WIP", "warehouse_type": WarehouseType.WIP},
]

DEMO_PRODUCTS = [
    {"name": "Raw Cotton", "code": "P-COT-001", "product_type": "raw_cotton", "category_code": "RAW"},
    {"name": "Fiber", "code": "P-FIB-001", "product_type": "fiber", "category_code": "FIBER"},
    {"name": "Cotton Seed", "code": "P-SEED-001", "product_type": "seed", "category_code": "FIBER"},
    {"name": "Lint", "code": "P-LINT-001", "product_type": "lint", "category_code": "FIBER"},
    {"name": "Fiber Waste", "code": "P-WST-FIB", "product_type": "waste", "category_code": "FIBER"},
    {"name": "Ne20/1 Carded Yarn", "code": "P-YRN-NE20C", "product_type": "yarn", "category_code": "YARN", "yarn_count": "Ne20/1", "yarn_type": "Carded"},
    {"name": "Ne24/1 Carded Yarn", "code": "P-YRN-NE24C", "product_type": "yarn", "category_code": "YARN", "yarn_count": "Ne24/1", "yarn_type": "Carded"},
    {"name": "Ne30/1 Carded Yarn", "code": "P-YRN-NE30C", "product_type": "yarn", "category_code": "YARN", "yarn_count": "Ne30/1", "yarn_type": "Carded"},
    {"name": "Ne32/1 Combed Yarn", "code": "P-YRN-NE32M", "product_type": "yarn", "category_code": "YARN", "yarn_count": "Ne32/1", "yarn_type": "Combed"},
    {"name": "Ne30/1 Combed Yarn", "code": "P-YRN-NE30M", "product_type": "yarn", "category_code": "YARN", "yarn_count": "Ne30/1", "yarn_type": "Combed"},
    {"name": "Ne32/1 Compact Yarn", "code": "P-YRN-NE32CP", "product_type": "yarn", "category_code": "YARN", "yarn_count": "Ne32/1", "yarn_type": "Compact"},
]

PRODUCT_CATEGORIES = [
    {"name": "Raw Materials", "code": "RAW"},
    {"name": "Fiber & By-products", "code": "FIBER"},
    {"name": "Yarn Products", "code": "YARN"},
]

MACHINES = [
    {"name": "Cotton Gin #1", "code": "MCH-GIN-01", "machine_type": "cotton_gin"},
    {"name": "Carding Machine #1", "code": "MCH-CARD-01", "machine_type": "carding"},
    {"name": "Carding Machine #2", "code": "MCH-CARD-02", "machine_type": "carding"},
    {"name": "Combing Machine #1", "code": "MCH-COMB-01", "machine_type": "combing"},
    {"name": "Drawing Frame #1", "code": "MCH-DRAW-01", "machine_type": "drawing"},
    {"name": "Ring Spinning #1", "code": "MCH-SPIN-01", "machine_type": "spinning"},
    {"name": "Ring Spinning #2", "code": "MCH-SPIN-02", "machine_type": "spinning"},
    {"name": "Ring Spinning #3", "code": "MCH-SPIN-03", "machine_type": "spinning"},
    {"name": "Winding Machine #1", "code": "MCH-WIND-01", "machine_type": "winding"},
]

ROLE_DEFINITIONS = [
    ("admin", "admin@demo.textile.local", "textile.admin"),
    ("director", "director@demo.textile.local", "textile.director"),
    ("accountant", "accountant@demo.textile.local", "textile.accountant"),
    ("warehouse_manager", "warehouse@demo.textile.local", "textile.warehouse"),
    ("production_manager", "production@demo.textile.local", "textile.production"),
    ("sales_manager", "sales@demo.textile.local", "textile.sales"),
]

FINANCIAL_CATEGORIES = [
    (TransactionType.RAW_MATERIAL_PURCHASE, "Raw cotton purchases"),
    (TransactionType.UTILITY_EXPENSE, "Electricity and water"),
    (TransactionType.SALARY_EXPENSE, "Salaries and wages"),
    (TransactionType.MAINTENANCE_EXPENSE, "Machine repair and maintenance"),
    (TransactionType.OTHER_EXPENSE, "Logistics and shipping"),
    (TransactionType.OTHER_EXPENSE, "General overhead"),
    (TransactionType.REVENUE, "Yarn sales revenue"),
    (TransactionType.OTHER_INCOME, "Foreign exchange adjustment"),
]


class DemoDataGenerator:
    def __init__(self, days: int, seed_value: int | None = None):
        self.days = max(30, min(days, 365))
        self.today = timezone.now().date()
        self.start_date = self.today - timedelta(days=self.days - 1)
        self.seed = seed_rng(seed_value)
        self.users_by_role = {}
        self.products = {}
        self.warehouses = {}
        self.machines = {}
        self.exch_rates = build_usd_uzs_series(self.start_date, self.days)
        self.raw_cotton_product: Product | None = None
        self.fiber_product: Product | None = None
        self.seed_product: Product | None = None
        self.lint_product: Product | None = None
        self.waste_product: Product | None = None
        self.yarn_products: list[Product] = []

    def run(self) -> None:
        self._seed_reference_data()
        self._seed_users()
        self._seed_warehouses()
        self._seed_machines()
        self._seed_inventory_receipts()
        self._seed_cotton_batches()
        self._seed_yarn_batches()
        self._seed_tolling_contracts()
        self._seed_financial_transactions()
        self._seed_notifications()
        self._integrity_report()

    def _seed_users(self) -> None:
        for role, email, username in ROLE_DEFINITIONS:
            first_name, last_name = generate_person_name()
            defaults = {
                "username": username,
                "first_name": first_name,
                "last_name": last_name,
                "role": role,
                "department": role.replace("_", " ").title(),
                "is_active": True,
                "is_staff": role in ["admin", "director", "accountant"],
                "is_superuser": role == "admin",
            }
            user, created = User.objects.update_or_create(
                email=email,
                defaults=defaults,
            )
            if created:
                user.set_password("Demo1234")
                user.save(update_fields=["password"])
            self.users_by_role[role] = user

    def _seed_reference_data(self) -> None:
        category_map = {}
        for category in PRODUCT_CATEGORIES:
            model, _ = ProductCategory.objects.get_or_create(
                code=category["code"],
                defaults={"name": category["name"]},
            )
            category_map[category["code"]] = model

        products = []
        for item in DEMO_PRODUCTS:
            defaults = {
                "name": item["name"],
                "product_type": item["product_type"],
                "category": category_map[item["category_code"]],
                "unit": "kg",
                "yarn_count": item.get("yarn_count", ""),
                "yarn_type": item.get("yarn_type", ""),
                "is_active": True,
            }
            product, _ = Product.objects.update_or_create(
                code=item["code"],
                defaults=defaults,
            )
            products.append(product)

        product_map = {product.code: product for product in products}
        self.raw_cotton_product = product_map["P-COT-001"]
        self.fiber_product = product_map["P-FIB-001"]
        self.seed_product = product_map["P-SEED-001"]
        self.lint_product = product_map["P-LINT-001"]
        self.waste_product = product_map["P-WST-FIB"]
        self.yarn_products = [product_map[code] for code in [
            "P-YRN-NE20C", "P-YRN-NE24C", "P-YRN-NE30C", "P-YRN-NE32M", "P-YRN-NE30M", "P-YRN-NE32CP",
        ]]

    def _seed_warehouses(self) -> None:
        for warehouse_data in DEMO_WAREHOUSES:
            defaults = {
                "name": warehouse_data["name"],
                "warehouse_type": warehouse_data["warehouse_type"],
                "location": "Demo production site",
                "capacity_kg": Decimal("150000.000"),
                "is_active": True,
            }
            warehouse, _ = Warehouse.objects.update_or_create(
                code=warehouse_data["code"],
                defaults=defaults,
            )
            self.warehouses[warehouse.code] = warehouse

        self.warehouses.setdefault(
            "WH-YARN-SELF",
            Warehouse.objects.get_or_create(
                code="WH-YARN-SELF",
                defaults={
                    "name": "Self Yarn Warehouse",
                    "warehouse_type": WarehouseType.YARN,
                    "location": "Headquarters",
                    "capacity_kg": Decimal("100000.000"),
                    "is_active": True,
                },
            )[0],
        )

    def _seed_machines(self) -> None:
        for machine_data in MACHINES:
            machine, _ = Machine.objects.get_or_create(
                code=machine_data["code"],
                defaults={
                    "name": machine_data["name"],
                    "machine_type": machine_data["machine_type"],
                    "manufacturer": "Demo Industrial",
                    "model_number": machine_data["code"],
                    "year_of_manufacture": 2015 + random.randint(0, 8),
                    "capacity_kg_per_hour": Decimal(str(random.randint(30, 120))) if random.random() > 0.1 else None,
                    "is_active": True,
                },
            )
            self.machines[machine.code] = machine

    def _seed_inventory_receipts(self) -> None:
        if not self.raw_cotton_product:
            return

        warehouse = self.warehouses["DEM-WH-COT"]
        product = self.raw_cotton_product
        stock_count = StockLedger.objects.filter(warehouse=warehouse, product=product).count()
        receipts = []
        for current_date in self._business_date_range():
            count = 1 if is_weekend(current_date) else random.randint(2, 4)
            for _ in range(count):
                qty = decimal_weight(random.uniform(700, 1800))
                cost_per_kg = decimal_money(random.uniform(11400, 12400))
                notes = f"{DEMO_NOTE} | Raw cotton receipt"
                movement = receive_stock(
                    warehouse=warehouse,
                    product=product,
                    quantity_kg=qty,
                    cost_per_kg=cost_per_kg,
                    movement_date=current_date,
                    reference_type="inventory_receipt",
                    reference_id=f"RAW-{current_date.isoformat()}-{random.randint(1000,9999)}",
                    notes=notes,
                    user=self.users_by_role.get("warehouse_manager"),
                )
                receipts.append(movement)
        self.stdout_write(f"Seeded {len(receipts)} raw cotton receipts")

    def _seed_cotton_batches(self) -> None:
        warehouse = self.warehouses["DEM-WH-COT"]
        fiber_warehouse = self.warehouses["DEM-WH-FIB"]
        seed_warehouse = self.warehouses["DEM-WH-WST"]
        lint_warehouse = self.warehouses["DEM-WH-WST"]
        waste_warehouse = self.warehouses["DEM-WH-WST"]
        if not self.fiber_product or not self.raw_cotton_product:
            return

        batch_dates = list(self._batch_dates())
        created = 0
        for idx, batch_date in enumerate(batch_dates, start=1):
            ledger = StockLedger.objects.filter(warehouse=warehouse, product=self.raw_cotton_product).first()
            if not ledger or ledger.quantity_kg < Decimal("700"):
                continue
            input_qty = decimal_weight(random.uniform(600, float(min(ledger.quantity_kg, Decimal("1400")))))
            issue_movement, issue_cost = issue_stock(
                warehouse=warehouse,
                product=self.raw_cotton_product,
                quantity_kg=input_qty,
                movement_date=batch_date,
                movement_type="production_consumption",
                reference_type="cotton_batch",
                reference_id=f"CB-{batch_date.isoformat()}-{idx:03d}",
                notes=f"{DEMO_NOTE} | Cotton processing consumption",
                user=self.users_by_role.get("production_manager"),
            )
            fiber_qty = decimal_weight(input_qty * Decimal(str(random.uniform(0.72, 0.78))))
            seed_qty = decimal_weight(input_qty * Decimal(str(random.uniform(0.055, 0.085))))
            lint_qty = decimal_weight(input_qty * Decimal(str(random.uniform(0.035, 0.055))))
            waste_qty = decimal_weight(input_qty - fiber_qty - seed_qty - lint_qty)
            if waste_qty < Decimal("0"):
                waste_qty = decimal_weight(input_qty * Decimal("0.08"))
            total_production_expenses = Decimal("0")
            batch = CottonBatch.objects.create(
                batch_code=f"DEM-COT-{batch_date.strftime('%y%m%d')}-{idx:03d}",
                status=BatchStatus.COMPLETED,
                start_date=batch_date,
                end_date=batch_date,
                cotton_input_kg=input_qty,
                cotton_cost_total=issue_cost,
                cotton_source_warehouse=warehouse,
                fiber_output_kg=fiber_qty,
                seed_output_kg=seed_qty,
                lint_output_kg=lint_qty,
                waste_output_kg=waste_qty,
                fiber_target_warehouse=fiber_warehouse,
                notes=f"{DEMO_NOTE} | Fiber batch from cotton processing",
                created_by=self.users_by_role.get("production_manager"),
                updated_by=self.users_by_role.get("production_manager"),
            )
            for expense_idx in range(random.randint(2, 4)):
                amount = decimal_money(random.uniform(3200, 8600))
                CottonBatchExpense.objects.create(
                    batch=batch,
                    category=random.choice(["electricity", "water", "repair", "laboratory", "other"]),
                    description=f"Demo cotton batch expense {expense_idx + 1}",
                    amount=amount,
                    quantity=decimal_weight(random.uniform(10, 120)),
                    unit="unit",
                    expense_date=batch_date,
                    created_by=self.users_by_role.get("accountant"),
                    updated_by=self.users_by_role.get("accountant"),
                )
                total_production_expenses += amount
            fiber_credit = decimal_money((seed_qty + lint_qty) * Decimal(str(random.uniform(4.5, 6.5))))
            batch.total_production_expenses = total_production_expenses
            batch.seed_credit_value = decimal_money(seed_qty * Decimal(str(random.uniform(4.0, 5.5))))
            batch.lint_credit_value = decimal_money(lint_qty * Decimal(str(random.uniform(4.0, 5.0))))
            batch.total_production_expenses = total_production_expenses
            net_cost = issue_cost + total_production_expenses - batch.total_byproduct_credit
            batch.calculated_fiber_cost_per_kg = round_money(net_cost / fiber_qty) if fiber_qty else Decimal("0")
            batch.fiber_yield_pct = round_money(fiber_qty / input_qty * Decimal("100"))
            batch.save(update_fields=[
                "total_production_expenses",
                "seed_credit_value",
                "lint_credit_value",
                "calculated_fiber_cost_per_kg",
                "fiber_yield_pct",
            ])
            receive_stock(
                warehouse=fiber_warehouse,
                product=self.fiber_product,
                quantity_kg=fiber_qty,
                cost_per_kg=batch.calculated_fiber_cost_per_kg,
                movement_date=batch_date,
                reference_type="cotton_batch",
                reference_id=str(batch.id),
                notes=f"{DEMO_NOTE} | Fiber output from cotton batch",
                user=self.users_by_role.get("warehouse_manager"),
            )
            if self.seed_product and seed_qty > Decimal("0"):
                receive_stock(
                    warehouse=seed_warehouse,
                    product=self.seed_product,
                    quantity_kg=seed_qty,
                    cost_per_kg=Decimal("0"),
                    movement_date=batch_date,
                    reference_type="cotton_batch",
                    reference_id=str(batch.id),
                    notes=f"{DEMO_NOTE} | Seed byproduct",
                    user=self.users_by_role.get("warehouse_manager"),
                )
            if self.lint_product and lint_qty > Decimal("0"):
                receive_stock(
                    warehouse=lint_warehouse,
                    product=self.lint_product,
                    quantity_kg=lint_qty,
                    cost_per_kg=Decimal("0"),
                    movement_date=batch_date,
                    reference_type="cotton_batch",
                    reference_id=str(batch.id),
                    notes=f"{DEMO_NOTE} | Lint byproduct",
                    user=self.users_by_role.get("warehouse_manager"),
                )
            if self.waste_product and waste_qty > Decimal("0"):
                receive_stock(
                    warehouse=waste_warehouse,
                    product=self.waste_product,
                    quantity_kg=waste_qty,
                    cost_per_kg=Decimal("0"),
                    movement_date=batch_date,
                    reference_type="cotton_batch",
                    reference_id=str(batch.id),
                    notes=f"{DEMO_NOTE} | Waste byproduct",
                    user=self.users_by_role.get("warehouse_manager"),
                )
            produced = Decimal("0")
            shifts = []
            for shift_number in range(3):
                shift_qty = decimal_weight(fiber_qty * Decimal(str(random.uniform(0.28, 0.37))))
                if shift_number == 2:
                    shift_qty = fiber_qty - produced
                produced += shift_qty
                actual_hours, downtime = hourly_efficiency()
                shifts.append(CottonShift(
                    shift_date=batch_date,
                    shift_type=random.choice(["morning", "afternoon", "night"]),
                    batch=batch,
                    supervisor=self.users_by_role.get("production_manager"),
                    planned_hours=Decimal("8"),
                    actual_hours=actual_hours,
                    cotton_processed_kg=shift_qty,
                    fiber_produced_kg=shift_qty,
                    downtime_minutes=int(downtime),
                    downtime_reason="Demo shift adjustments" if downtime > 15 else "",
                    notes=f"{DEMO_NOTE} | Cotton production shift",
                    created_by=self.users_by_role.get("production_manager"),
                    updated_by=self.users_by_role.get("production_manager"),
                ))
            CottonShift.objects.bulk_create(shifts)
            created += 1
        self.stdout_write(f"Seeded {created} cotton batches and linked production shifts")

    def _seed_yarn_batches(self) -> None:
        fiber_warehouse = self.warehouses["DEM-WH-FIB"]
        yarn_warehouse = self.warehouses["WH-YARN-SELF"]
        if not self.yarn_products:
            return

        available_dates = list(self._batch_dates(offset_days=5))
        created = 0
        for idx, batch_date in enumerate(available_dates, start=1):
            ledger = StockLedger.objects.filter(warehouse=fiber_warehouse, product=self.fiber_product).first()
            if not ledger or ledger.quantity_kg < Decimal("400"):
                continue
            fiber_qty = decimal_weight(random.uniform(300, float(min(ledger.quantity_kg, Decimal("900")))))
            issue_movement, issue_cost = issue_stock(
                warehouse=fiber_warehouse,
                product=self.fiber_product,
                quantity_kg=fiber_qty,
                movement_date=batch_date,
                movement_type="production_consumption",
                reference_type="yarn_batch",
                reference_id=f"YB-{batch_date.isoformat()}-{idx:03d}",
                notes=f"{DEMO_NOTE} | Fiber to yarn consumption",
                user=self.users_by_role.get("production_manager"),
            )
            yarn_qty = decimal_weight(fiber_qty * Decimal(str(random.uniform(0.82, 0.88))))
            waste_qty = decimal_weight(fiber_qty - yarn_qty)
            product = random.choice(self.yarn_products)
            batch = YarnBatch.objects.create(
                batch_code=f"DEM-YRN-{batch_date.strftime('%y%m%d')}-{idx:03d}",
                status=BatchStatus.COMPLETED,
                start_date=batch_date,
                end_date=batch_date,
                yarn_product=product,
                fiber_input_kg=fiber_qty,
                fiber_cost_total=issue_cost,
                fiber_source_warehouse=fiber_warehouse,
                yarn_output_kg=yarn_qty,
                waste_output_kg=waste_qty,
                yarn_target_warehouse=yarn_warehouse,
                waste_pct=round_money(waste_qty / fiber_qty * Decimal("100")) if fiber_qty else Decimal("0"),
                efficiency_pct=round_money(yarn_qty / fiber_qty * Decimal("100")) if fiber_qty else Decimal("0"),
                total_spinning_expenses=Decimal("0"),
                calculated_yarn_cost_per_kg=Decimal("0"),
                notes=f"{DEMO_NOTE} | Internal yarn production",
                created_by=self.users_by_role.get("production_manager"),
                updated_by=self.users_by_role.get("production_manager"),
            )
            expenses_total = Decimal("0")
            expense_objects = []
            for expense_idx in range(random.randint(2, 4)):
                amount = decimal_money(random.uniform(4200, 9800))
                expense_objects.append(YarnBatchExpense(
                    batch=batch,
                    category=random.choice(["electricity", "overhead", "repair", "laboratory"]),
                    description=f"Demo yarn batch expense {expense_idx + 1}",
                    amount=amount,
                    quantity=decimal_weight(random.uniform(15, 110)),
                    unit="unit",
                    expense_date=batch_date,
                    created_by=self.users_by_role.get("accountant"),
                    updated_by=self.users_by_role.get("accountant"),
                ))
                expenses_total += amount
            YarnBatchExpense.objects.bulk_create(expense_objects)
            batch.total_spinning_expenses = expenses_total
            batch.calculated_yarn_cost_per_kg = round_money((issue_cost + expenses_total) / yarn_qty)
            batch.total_spinning_expenses = expenses_total
            batch.save(update_fields=["total_spinning_expenses", "calculated_yarn_cost_per_kg"])
            receive_stock(
                warehouse=yarn_warehouse,
                product=product,
                quantity_kg=yarn_qty,
                cost_per_kg=batch.calculated_yarn_cost_per_kg,
                movement_date=batch_date,
                reference_type="yarn_batch",
                reference_id=str(batch.id),
                notes=f"{DEMO_NOTE} | Yarn output receipt",
                user=self.users_by_role.get("warehouse_manager"),
            )
            produced = Decimal("0")
            shifts = []
            for shift_number in range(3):
                shift_qty = decimal_weight(yarn_qty * Decimal(str(random.uniform(0.28, 0.37))))
                if shift_number == 2:
                    shift_qty = yarn_qty - produced
                produced += shift_qty
                actual_hours, downtime = hourly_efficiency()
                shifts.append(YarnShift(
                    shift_date=batch_date,
                    shift_type=random.choice(["morning", "afternoon", "night"]),
                    batch=batch,
                    operator=self.users_by_role.get("production_manager"),
                    machine=random.choice(list(self.machines.values())),
                    planned_hours=Decimal("8"),
                    actual_hours=actual_hours,
                    fiber_consumed_kg=shift_qty,
                    yarn_produced_kg=shift_qty,
                    waste_kg=decimal_weight(waste_qty * Decimal(str(random.uniform(0.18, 0.25)))),
                    downtime_minutes=int(downtime),
                    downtime_reason="Demo spinning downtime" if downtime > 20 else "",
                    notes=f"{DEMO_NOTE} | Yarn production shift",
                    created_by=self.users_by_role.get("production_manager"),
                    updated_by=self.users_by_role.get("production_manager"),
                ))
            YarnShift.objects.bulk_create(shifts)
            created += 1
        self.stdout_write(f"Seeded {created} yarn batches and shifts")

    def _seed_tolling_contracts(self) -> None:
        client_count = 80
        contract_count = 0
        for idx in range(1, client_count + 1):
            customer_name = generate_company_name()
            status_label, active, debtor = select_client_status()
            contract_number = f"DEM-CTR-{idx:03d}"
            start_date = self.start_date + timedelta(days=random.randint(0, max(0, self.days - 45)))
            end_date = start_date + timedelta(days=random.randint(30, 90))
            yarn_price_usd = decimal_money(random.uniform(1.70, 2.45))
            exchange_rate = next((rate for dt, rate in self.exch_rates if dt == start_date), self.exch_rates[-1][1])
            processor_share, customer_share, loss_share = choose_contract_share()
            contract_data = {
                "contract_number": contract_number,
                "contract_date": start_date,
                "contract_type": "external",
                "status": ContractStatus.ACTIVE if active else ContractStatus.COMPLETED,
                "customer_name": customer_name,
                "customer_inn": str(random.randint(100000000, 999999999)),
                "customer_address": generate_local_address(),
                "customer_contact_person": faker.name(),
                "customer_phone": generate_phone_number(),
                "start_date": start_date,
                "end_date": end_date,
                "yarn_price_usd": yarn_price_usd,
                "exchange_rate": exchange_rate,
                "processor_share_pct": processor_share,
                "customer_share_pct": customer_share,
                "loss_share_pct": loss_share,
                "target_yarn_product": random.choice(self.yarn_products),
                "min_fiber_quality_grade": random.choice(["A", "B", "C"]),
                "max_waste_pct": decimal_money(random.uniform(3.0, 8.0)),
                "vat_included": True,
                "advance_payment_pct": decimal_money(random.choice([10, 15, 20, 25])),
                "payment_term_days": random.choice([15, 30, 45]),
                "terms_and_conditions": "Demo contract terms.",
                "notes": DEMO_NOTE,
            }
            if TollingContract.objects.filter(contract_number=contract_number).exists():
                continue
            contract = create_contract(data=contract_data, user=self.users_by_role.get("sales_manager"))
            contract_count += 1
            receipt_qty = 0
            for receipt_idx in range(random.randint(1, 2)):
                quantity = decimal_weight(random.uniform(250, 550))
                receipt = TollingRawMaterialReceipt.objects.create(
                    contract=contract,
                    receipt_number=f"DEM-RCP-{contract_number}-{receipt_idx + 1}",
                    receipt_date=start_date + timedelta(days=receipt_idx * 3),
                    status=ReceiptStatus.DRAFT,
                    ttn_number=f"TTN-{contract_number}-{receipt_idx + 1}",
                    ttn_date=start_date + timedelta(days=receipt_idx * 3),
                    acceptance_act_number=f"ACT-{contract_number}-{receipt_idx + 1}",
                    acceptance_act_date=start_date + timedelta(days=receipt_idx * 3 + 1),
                    fiber_product=self.fiber_product,
                    quantity_kg=quantity,
                    moisture_pct=decimal_money(random.uniform(7.0, 9.5)),
                    impurity_pct=decimal_money(random.uniform(1.2, 2.5)),
                    fiber_length_mm=decimal_money(random.uniform(28.0, 35.0)),
                    quality_grade=random.choice(["A", "B"]),
                    supplier_name=generate_company_name(),
                    driver_name=faker.name(),
                    vehicle_number=f"{random.randint(10,99)}{random.choice(['AG','BX','BM'])}{random.randint(1000,9999)}",
                    received_by=self.users_by_role.get("warehouse_manager"),
                    notes=DEMO_NOTE,
                    created_by=self.users_by_role.get("warehouse_manager"),
                    updated_by=self.users_by_role.get("warehouse_manager"),
                )
                receipt_qty += quantity
                receive_raw_material(receipt=receipt, user=self.users_by_role.get("warehouse_manager"))
            for batch_idx in range(random.randint(1, 2)):
                if receipt_qty < Decimal("200"):
                    continue
                batch_qty = decimal_weight(receipt_qty * Decimal(str(random.uniform(0.75, 0.88))))
                yarn_qty = decimal_weight(batch_qty * Decimal(str(random.uniform(0.80, 0.88))))
                waste_qty = decimal_weight(batch_qty - yarn_qty)
                batch = YarnBatch.objects.create(
                    batch_code=f"DEM-TOL-{contract.contract_number}-{batch_idx + 1}",
                    status=BatchStatus.DRAFT,
                    start_date=start_date + timedelta(days=batch_idx * 2),
                    yarn_product=contract.target_yarn_product,
                    fiber_input_kg=batch_qty,
                    fiber_cost_total=decimal_money(batch_qty * exchange_rate * Decimal(str(random.uniform(1.2, 1.8)))),  # approximate cost
                    fiber_source_warehouse=contract.raw_material_warehouse,
                    yarn_output_kg=yarn_qty,
                    waste_output_kg=waste_qty,
                    yarn_target_warehouse=contract.finished_goods_warehouse,
                    waste_pct=round_money(waste_qty / batch_qty * Decimal("100")) if batch_qty else Decimal("0"),
                    efficiency_pct=round_money(yarn_qty / batch_qty * Decimal("100")) if batch_qty else Decimal("0"),
                    tolling_contract=contract,
                    raw_material_receipt=contract.raw_receipts.first(),
                    notes=DEMO_NOTE,
                    created_by=self.users_by_role.get("production_manager"),
                    updated_by=self.users_by_role.get("production_manager"),
                )
                complete_tolling_yarn_batch(
                    batch=batch,
                    yarn_output_kg=yarn_qty,
                    waste_output_kg=waste_qty,
                    efficiency_pct=batch.efficiency_pct,
                    end_date=batch.start_date,
                    user=self.users_by_role.get("production_manager"),
                )
                line_qty = batch.customer_yarn_kg
                if line_qty <= Decimal("0"):
                    continue
                split_count = random.randint(1, 2)
                remaining = line_qty
                for delivery_idx in range(split_count):
                    if delivery_idx == split_count - 1:
                        delivery_qty = remaining
                    else:
                        delivery_qty = decimal_weight(remaining * Decimal(str(random.uniform(0.35, 0.7))))
                    remaining -= delivery_qty
                    if delivery_qty <= Decimal("0"):
                        continue
                    delivery = create_delivery(
                        data={
                            "contract": contract,
                            "yarn_batch": batch,
                            "delivery_number": f"DEM-DEL-{contract.contract_number}-{delivery_idx + 1}",
                            "delivery_date": batch.start_date + timedelta(days=delivery_idx * 2 + 5),
                            "quantity_kg": delivery_qty,
                            "recipient_name": contract.customer_contact_person,
                            "recipient_phone": contract.customer_phone,
                            "vehicle_number": f"{random.randint(1000,9999)}-{random.choice(['TF','TZ','TK'])}",
                            "driver_name": faker.name(),
                            "notes": DEMO_NOTE,
                        },
                        user=self.users_by_role.get("warehouse_manager"),
                    )
                    result = complete_delivery(delivery=delivery, user=self.users_by_role.get("warehouse_manager"))
                    invoice = result["invoice"]
                    if random.random() < 0.7:
                        paid = invoice.total_amount
                    elif random.random() < 0.65:
                        paid = invoice.total_amount * Decimal("0.6")
                    else:
                        paid = Decimal("0")
                    invoice.paid_amount = round_money(paid)
                    invoice.status = select_invoice_payment_status(invoice.total_amount, invoice.paid_amount)
                    if invoice.status == "issued" and invoice.payment_due_date < self.today:
                        invoice.status = InvoiceStatus.OVERDUE
                    invoice.updated_by = self.users_by_role.get("accountant")
                    invoice.save(update_fields=["paid_amount", "status", "updated_by"])
        self.stdout_write(f"Seeded {contract_count} tolling contracts and related production cycles")

    def _seed_financial_transactions(self) -> None:
        transactions: List[FinancialTransaction] = []
        for current_date, rate in self.exch_rates:
            count = 12 if not is_weekend(current_date) else 6
            for _ in range(count):
                txn_type, description = random.choice(FINANCIAL_CATEGORIES)
                amount = decimal_money(random.uniform(3500, 18500))
                if txn_type in {TransactionType.REVENUE, TransactionType.OTHER_INCOME}:
                    is_expense = False
                else:
                    is_expense = True
                if txn_type == TransactionType.OTHER_INCOME:
                    description = f"Daily USD/UZS rate adjustment {rate}"
                    amount = decimal_money(random.uniform(2500, 9500))
                entry = FinancialTransaction(
                    transaction_date=current_date,
                    transaction_type=txn_type,
                    amount=amount,
                    description=f"{DEMO_NOTE} | {description}",
                    reference_type="demo_finance",
                    reference_id=current_date.isoformat(),
                    is_expense=is_expense,
                    expense_category=txn_type if is_expense else "",
                    created_by=self.users_by_role.get("accountant"),
                    updated_by=self.users_by_role.get("accountant"),
                )
                transactions.append(entry)
        FinancialTransaction.objects.bulk_create(transactions)
        self.stdout_write(f"Seeded {len(transactions)} financial transactions")

    def _seed_notifications(self) -> None:
        notifications: List[Notification] = []
        invoices = TollingInvoice.objects.filter(contract__contract_number__startswith="DEM-CTR")[:800]
        for invoice in invoices:
            if invoice.status == InvoiceStatus.OVERDUE:
                notifications.append(Notification(
                    recipient=self.users_by_role.get("director"),
                    level="warning",
                    event_type="low_stock",
                    title=f"Overdue invoice {invoice.invoice_number}",
                    message=f"Invoice {invoice.invoice_number} for {invoice.contract.customer_name} is overdue by {max((self.today - invoice.payment_due_date).days, 0)} days.",
                    reference_type="invoice",
                    reference_id=str(invoice.id),
                    is_read=False,
                ))
        completed_batches = list(YarnBatch.objects.filter(notes__contains=DEMO_MARKER, status=BatchStatus.COMPLETED)[:400])
        for batch in completed_batches:
            notifications.append(Notification(
                recipient=self.users_by_role.get("production_manager"),
                level="success",
                event_type="batch_completed",
                title=f"Yarn batch completed {batch.batch_code}",
                message=f"Yarn batch {batch.batch_code} completed with output {batch.yarn_output_kg} kg.",
                reference_type="yarn_batch",
                reference_id=str(batch.id),
            ))
        for _ in range(400):
            notifications.append(Notification(
                recipient=self.users_by_role.get("warehouse_manager"),
                level=random.choice(["info", "warning", "error"]),
                event_type=random.choice(["low_stock", "machine_downtime", "cost_spike"]),
                title=f"Demo notification {_ + 1}",
                message=faker.sentence(nb_words=14),
                reference_type="demo",
                reference_id=str(random.randint(1, 999999)),
            ))
        Notification.objects.bulk_create(notifications)
        self.stdout_write(f"Seeded {len(notifications)} notifications")

    def _integrity_report(self) -> None:
        issues = []
        negative_ledgers = StockLedger.objects.filter(quantity_kg__lt=0)
        if negative_ledgers.exists():
            issues.append(f"Negative stock ledger entries: {negative_ledgers.count()}")
        bad_invoices = TollingInvoice.objects.filter(
            Q(status=InvoiceStatus.PAID, paid_amount__lt=F("total_amount")) |
            Q(status=InvoiceStatus.PARTIALLY_PAID, paid_amount__lte=0) |
            Q(status=InvoiceStatus.ISSUED, paid_amount__gt=0)
        )
        if bad_invoices.exists():
            issues.append(f"Invoice status mismatches: {bad_invoices.count()}")
        if issues:
            self.stdout_write("Integrity issues detected")
            for issue in issues:
                self.stdout_write(f"  - {issue}")
        else:
            self.stdout_write("Integrity check passed: no obvious stock or payment mismatches")
        self.stdout_write("Summary: ")
        self.stdout_write(f"  Contracts: {TollingContract.objects.filter(contract_number__startswith='DEM-CTR').count()}")
        self.stdout_write(f"  Invoices: {TollingInvoice.objects.filter(contract__contract_number__startswith='DEM-CTR').count()}")
        self.stdout_write(f"  Stock ledger rows: {StockLedger.objects.filter(warehouse__code__startswith='DEM-').count()}")
        self.stdout_write(f"  Notifications: {Notification.objects.filter(message__contains=DEMO_MARKER).count()}")

    def _business_date_range(self) -> Iterable[date]:
        current = self.start_date
        while current <= self.today:
            yield current
            current += timedelta(days=1)

    def _batch_dates(self, offset_days: int = 0) -> Iterable[date]:
        current = self.start_date + timedelta(days=offset_days)
        last_yielded: date | None = None
        while current <= self.today:
            if current.weekday() < 5:
                last_yielded = current
                yield current
            current += timedelta(days=random.randint(2, 5))
        if self.today.weekday() < 5 and last_yielded != self.today:
            yield self.today

    def stdout_write(self, message: str) -> None:
        print(message)


class Command(BaseCommand):
    help = "Generate 3-month demo ERP data for textile production, inventory, tolling, finance, and notifications."

    def add_arguments(self, parser):
        parser.add_argument("--reset", action="store_true", help="Delete demo-generated data created by this command.")
        parser.add_argument("--days", type=int, default=90, help="Number of history days to generate.")
        parser.add_argument("--seed", type=int, default=None, help="Optional random seed for repeatable results.")

    @transaction.atomic
    def handle(self, *args, **options):
        reset = options.get("reset", False)
        days = options.get("days", 90)
        seed_value = options.get("seed")
        if reset:
            self._reset_demo_data()
            return

        self.stdout.write(self.style.NOTICE(f"Starting demo data generation for the last {days} days using seed={seed_value or 'random'}"))
        generator = DemoDataGenerator(days=days, seed_value=seed_value)
        generator.run()
        self.stdout.write(self.style.SUCCESS("Demo data generation finished."))

    def _reset_demo_data(self):
        self.stdout.write(self.style.WARNING("Resetting demo-generated data. This operation targets data created by the demo command."))
        contract_qs = TollingContract.objects.filter(contract_number__startswith="DEM-CTR")
        invoice_qs = TollingInvoice.objects.filter(contract__contract_number__startswith="DEM-CTR")
        delivery_qs = TollingDelivery.objects.filter(delivery_number__startswith("DEM-DEL-"))
        receipt_qs = TollingRawMaterialReceipt.objects.filter(receipt_number__startswith("DEM-RCP-"))
        notification_qs = Notification.objects.filter(message__contains=DEMO_MARKER)
        finance_qs = FinancialTransaction.objects.filter(description__contains=DEMO_MARKER)
        batch_qs = YarnBatch.objects.filter(notes__contains=DEMO_MARKER)
        cotton_batch_qs = CottonBatch.objects.filter(notes__contains=DEMO_MARKER)
        demo_warehouse_codes = [wh["code"] for wh in DEMO_WAREHOUSES]
        warehouse_qs = Warehouse.objects.filter(code__in=demo_warehouse_codes)
        ledger_qs = StockLedger.objects.filter(warehouse__code__in=demo_warehouse_codes)
        # Delete child objects first.
        invoice_qs.delete()
        delivery_qs.delete()
        receipt_qs.delete()
        contract_qs.delete()
        batch_qs.delete()
        cotton_batch_qs.delete()
        notification_qs.delete()
        finance_qs.delete()
        ledger_qs.delete()
        warehouse_qs.delete()
        user_qs = User.objects.filter(email__endswith="@demo.textile.local")
        user_qs.delete()
        self.stdout.write(self.style.SUCCESS("Demo-generated objects removed where possible."))
