"""
Seed command — populates warehouses, product categories, products, and machines.
Run: python manage.py seed_initial_data
"""
from django.core.management.base import BaseCommand
from django.db import transaction


class Command(BaseCommand):
    help = "Seed initial reference data (warehouses, products, machines)."

    @transaction.atomic
    def handle(self, *args, **options):
        self._seed_warehouses()
        self._seed_categories_and_products()
        self._seed_machines()
        self.stdout.write(self.style.SUCCESS("Seed data loaded successfully."))

    def _seed_warehouses(self):
        from apps.warehouse.models import Warehouse, WarehouseType
        warehouses = [
            {"name": "Cotton Warehouse", "code": "WH-COT", "warehouse_type": WarehouseType.COTTON},
            {"name": "Fiber Warehouse", "code": "WH-FIB", "warehouse_type": WarehouseType.FIBER},
            {"name": "WIP Warehouse", "code": "WH-WIP", "warehouse_type": WarehouseType.WIP},
            {"name": "Yarn Warehouse", "code": "WH-YRN", "warehouse_type": WarehouseType.YARN},
            {"name": "Waste Warehouse", "code": "WH-WST", "warehouse_type": WarehouseType.WASTE},
        ]
        for wh in warehouses:
            Warehouse.objects.get_or_create(code=wh["code"], defaults=wh)
        self.stdout.write("  ✓ Warehouses seeded")

    def _seed_categories_and_products(self):
        from apps.warehouse.models import ProductCategory, Product
        cat, _ = ProductCategory.objects.get_or_create(
            code="RAW", defaults={"name": "Raw Materials"}
        )
        fiber_cat, _ = ProductCategory.objects.get_or_create(
            code="FIBER", defaults={"name": "Fiber & By-products"}
        )
        yarn_cat, _ = ProductCategory.objects.get_or_create(
            code="YARN", defaults={"name": "Yarn Products"}
        )

        products = [
            {"name": "Raw Cotton", "code": "P-COT-001", "product_type": "raw_cotton", "category": cat},
            {"name": "Fiber", "code": "P-FIB-001", "product_type": "fiber", "category": fiber_cat},
            {"name": "Cotton Seed", "code": "P-SEED-001", "product_type": "seed", "category": fiber_cat},
            {"name": "Lint", "code": "P-LINT-001", "product_type": "lint", "category": fiber_cat},
            {"name": "Fiber Waste", "code": "P-WST-FIB", "product_type": "waste", "category": fiber_cat},
            {"name": "Ne20/1 Carded Yarn", "code": "P-YRN-NE20C", "product_type": "yarn",
             "category": yarn_cat, "yarn_count": "Ne20/1", "yarn_type": "Carded"},
            {"name": "Ne30/1 Carded Yarn", "code": "P-YRN-NE30C", "product_type": "yarn",
             "category": yarn_cat, "yarn_count": "Ne30/1", "yarn_type": "Carded"},
            {"name": "Ne30/1 Combed Yarn", "code": "P-YRN-NE30CM", "product_type": "yarn",
             "category": yarn_cat, "yarn_count": "Ne30/1", "yarn_type": "Combed"},
            {"name": "Ne40/1 Compact Yarn", "code": "P-YRN-NE40CP", "product_type": "yarn",
             "category": yarn_cat, "yarn_count": "Ne40/1", "yarn_type": "Compact"},
        ]
        for p in products:
            Product.objects.get_or_create(code=p["code"], defaults=p)
        self.stdout.write("  ✓ Products seeded")

    def _seed_machines(self):
        from apps.cotton_production.models import Machine
        machines = [
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
        for m in machines:
            Machine.objects.get_or_create(code=m["code"], defaults=m)
        self.stdout.write("  ✓ Machines seeded")
