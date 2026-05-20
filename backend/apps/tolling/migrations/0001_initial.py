from django.conf import settings
from django.db import migrations, models
import django.core.validators
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("warehouse", "0003_add_tolling_warehouse_types"),
        ("yarn_production", "0002_alter_yarnbatch_created_by_and_more"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="TollingContract",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("contract_number", models.CharField(db_index=True, max_length=50, unique=True)),
                ("contract_date", models.DateField()),
                ("contract_type", models.CharField(
                    choices=[("external", "External Customer"), ("internal", "Internal Transfer")],
                    default="external", max_length=20,
                )),
                ("status", models.CharField(
                    choices=[
                        ("draft", "Draft"), ("active", "Active"), ("suspended", "Suspended"),
                        ("completed", "Completed"), ("cancelled", "Cancelled"),
                    ],
                    default="draft", max_length=20,
                )),
                ("customer_name", models.CharField(max_length=200)),
                ("customer_inn", models.CharField(blank=True, max_length=20)),
                ("customer_address", models.TextField(blank=True)),
                ("customer_contact_person", models.CharField(blank=True, max_length=200)),
                ("customer_phone", models.CharField(blank=True, max_length=50)),
                ("start_date", models.DateField()),
                ("end_date", models.DateField()),
                ("yarn_price_usd", models.DecimalField(decimal_places=4, max_digits=12)),
                ("exchange_rate", models.DecimalField(decimal_places=4, max_digits=12)),
                ("processor_share_pct", models.DecimalField(
                    decimal_places=2, max_digits=5,
                    validators=[
                        django.core.validators.MinValueValidator(0),
                        django.core.validators.MaxValueValidator(100),
                    ],
                )),
                ("customer_share_pct", models.DecimalField(
                    decimal_places=2, max_digits=5,
                    validators=[
                        django.core.validators.MinValueValidator(0),
                        django.core.validators.MaxValueValidator(100),
                    ],
                )),
                ("loss_share_pct", models.DecimalField(
                    decimal_places=2, max_digits=5,
                    validators=[
                        django.core.validators.MinValueValidator(0),
                        django.core.validators.MaxValueValidator(100),
                    ],
                )),
                ("min_fiber_quality_grade", models.CharField(blank=True, max_length=50)),
                ("max_waste_pct", models.DecimalField(blank=True, decimal_places=2, max_digits=5, null=True)),
                ("vat_included", models.BooleanField(default=True)),
                ("advance_payment_pct", models.DecimalField(
                    decimal_places=2, default=0, max_digits=5,
                    validators=[
                        django.core.validators.MinValueValidator(0),
                        django.core.validators.MaxValueValidator(100),
                    ],
                )),
                ("payment_term_days", models.PositiveIntegerField(default=30)),
                ("terms_and_conditions", models.TextField(blank=True)),
                ("notes", models.TextField(blank=True)),
                ("created_by", models.ForeignKey(
                    blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL,
                    related_name="tollingcontract_created", to=settings.AUTH_USER_MODEL,
                )),
                ("updated_by", models.ForeignKey(
                    blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL,
                    related_name="tollingcontract_updated", to=settings.AUTH_USER_MODEL,
                )),
                ("target_yarn_product", models.ForeignKey(
                    on_delete=django.db.models.deletion.PROTECT,
                    related_name="tolling_contracts", to="warehouse.product",
                )),
                ("raw_material_warehouse", models.ForeignKey(
                    blank=True, null=True, on_delete=django.db.models.deletion.PROTECT,
                    related_name="tolling_contracts_raw", to="warehouse.warehouse",
                )),
                ("finished_goods_warehouse", models.ForeignKey(
                    blank=True, null=True, on_delete=django.db.models.deletion.PROTECT,
                    related_name="tolling_contracts_finished", to="warehouse.warehouse",
                )),
            ],
            options={"db_table": "tolling_contracts", "ordering": ["-contract_date", "-created_at"]},
        ),
        migrations.CreateModel(
            name="TollingRawMaterialReceipt",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("receipt_number", models.CharField(db_index=True, max_length=50, unique=True)),
                ("receipt_date", models.DateField()),
                ("status", models.CharField(
                    choices=[
                        ("draft", "Draft"), ("received", "Received"),
                        ("in_production", "In Production"), ("completed", "Completed"),
                    ],
                    default="draft", max_length=20,
                )),
                ("ttn_number", models.CharField(blank=True, max_length=50)),
                ("ttn_date", models.DateField(blank=True, null=True)),
                ("acceptance_act_number", models.CharField(blank=True, max_length=50)),
                ("acceptance_act_date", models.DateField(blank=True, null=True)),
                ("quantity_kg", models.DecimalField(decimal_places=3, max_digits=14)),
                ("moisture_pct", models.DecimalField(blank=True, decimal_places=2, max_digits=5, null=True)),
                ("impurity_pct", models.DecimalField(blank=True, decimal_places=2, max_digits=5, null=True)),
                ("fiber_length_mm", models.DecimalField(blank=True, decimal_places=2, max_digits=6, null=True)),
                ("quality_grade", models.CharField(blank=True, max_length=50)),
                ("supplier_name", models.CharField(blank=True, max_length=200)),
                ("driver_name", models.CharField(blank=True, max_length=200)),
                ("vehicle_number", models.CharField(blank=True, max_length=50)),
                ("notes", models.TextField(blank=True)),
                ("contract", models.ForeignKey(
                    on_delete=django.db.models.deletion.PROTECT,
                    related_name="raw_receipts", to="tolling.tollingcontract",
                )),
                ("fiber_product", models.ForeignKey(
                    limit_choices_to={"product_type": "fiber"},
                    on_delete=django.db.models.deletion.PROTECT,
                    to="warehouse.product",
                )),
                ("received_by", models.ForeignKey(
                    blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL,
                    related_name="tolling_receipts_received", to=settings.AUTH_USER_MODEL,
                )),
                ("created_by", models.ForeignKey(
                    blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL,
                    related_name="tollingrawmaterialreceipt_created", to=settings.AUTH_USER_MODEL,
                )),
                ("updated_by", models.ForeignKey(
                    blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL,
                    related_name="tollingrawmaterialreceipt_updated", to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={"db_table": "tolling_raw_receipts", "ordering": ["-receipt_date", "-created_at"]},
        ),
        migrations.CreateModel(
            name="TollingDelivery",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("delivery_number", models.CharField(db_index=True, max_length=50, unique=True)),
                ("delivery_date", models.DateField()),
                ("status", models.CharField(
                    choices=[
                        ("pending", "Topshirish kutilmoqda"), ("ready", "Topshirish uchun tayyor"),
                        ("delivered", "Topshirildi"), ("cancelled", "Bekor qilindi"),
                    ],
                    default="pending", max_length=20,
                )),
                ("quantity_kg", models.DecimalField(decimal_places=3, max_digits=14)),
                ("delivery_act_number", models.CharField(blank=True, max_length=50)),
                ("ttn_number", models.CharField(blank=True, max_length=50)),
                ("quality_certificate_number", models.CharField(blank=True, max_length=50)),
                ("yarn_count_actual", models.CharField(blank=True, max_length=20)),
                ("strength_cn", models.DecimalField(blank=True, decimal_places=2, max_digits=8, null=True)),
                ("twist_tpm", models.DecimalField(blank=True, decimal_places=2, max_digits=8, null=True)),
                ("moisture_pct", models.DecimalField(blank=True, decimal_places=2, max_digits=5, null=True)),
                ("recipient_name", models.CharField(blank=True, max_length=200)),
                ("recipient_phone", models.CharField(blank=True, max_length=50)),
                ("vehicle_number", models.CharField(blank=True, max_length=50)),
                ("driver_name", models.CharField(blank=True, max_length=200)),
                ("notes", models.TextField(blank=True)),
                ("contract", models.ForeignKey(
                    on_delete=django.db.models.deletion.PROTECT,
                    related_name="deliveries", to="tolling.tollingcontract",
                )),
                ("yarn_batch", models.ForeignKey(
                    on_delete=django.db.models.deletion.PROTECT,
                    related_name="tolling_deliveries", to="yarn_production.yarnbatch",
                )),
                ("delivered_by", models.ForeignKey(
                    blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL,
                    related_name="tolling_deliveries_issued", to=settings.AUTH_USER_MODEL,
                )),
                ("created_by", models.ForeignKey(
                    blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL,
                    related_name="tollingdelivery_created", to=settings.AUTH_USER_MODEL,
                )),
                ("updated_by", models.ForeignKey(
                    blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL,
                    related_name="tollingdelivery_updated", to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={"db_table": "tolling_deliveries", "ordering": ["-delivery_date", "-created_at"]},
        ),
        migrations.CreateModel(
            name="TollingInvoice",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("invoice_number", models.CharField(db_index=True, max_length=50, unique=True)),
                ("invoice_date", models.DateField()),
                ("status", models.CharField(
                    choices=[
                        ("draft", "Draft"), ("issued", "Yuborildi"), ("paid", "To'landi"),
                        ("partially_paid", "Qisman to'landi"), ("overdue", "Muddati o'tgan"),
                        ("cancelled", "Bekor qilindi"),
                    ],
                    default="draft", max_length=20,
                )),
                ("base_amount", models.DecimalField(decimal_places=4, max_digits=20)),
                ("vat_amount", models.DecimalField(decimal_places=4, default=0, max_digits=20)),
                ("total_amount", models.DecimalField(decimal_places=4, max_digits=20)),
                ("paid_amount", models.DecimalField(decimal_places=4, default=0, max_digits=20)),
                ("payment_due_date", models.DateField()),
                ("notes", models.TextField(blank=True)),
                ("contract", models.ForeignKey(
                    on_delete=django.db.models.deletion.PROTECT,
                    related_name="invoices", to="tolling.tollingcontract",
                )),
                ("yarn_batch", models.ForeignKey(
                    on_delete=django.db.models.deletion.PROTECT,
                    related_name="tolling_invoices", to="yarn_production.yarnbatch",
                )),
                ("delivery", models.ForeignKey(
                    blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL,
                    related_name="invoices", to="tolling.tollingdelivery",
                )),
                ("created_by", models.ForeignKey(
                    blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL,
                    related_name="tollinginvoice_created", to=settings.AUTH_USER_MODEL,
                )),
                ("updated_by", models.ForeignKey(
                    blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL,
                    related_name="tollinginvoice_updated", to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={"db_table": "tolling_invoices", "ordering": ["-invoice_date", "-created_at"]},
        ),
    ]
