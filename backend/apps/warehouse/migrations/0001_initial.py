import uuid
import django.db.models.deletion
from decimal import Decimal
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('users', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='ProductCategory',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True, db_index=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('name', models.CharField(max_length=100)),
                ('code', models.CharField(max_length=20, unique=True)),
                ('description', models.TextField(blank=True)),
            ],
            options={'db_table': 'product_categories', 'ordering': ['-created_at'], 'verbose_name_plural': 'product categories'},
        ),
        migrations.CreateModel(
            name='Warehouse',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True, db_index=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('deleted_at', models.DateTimeField(blank=True, db_index=True, null=True)),
                ('name', models.CharField(max_length=200)),
                ('code', models.CharField(max_length=20, unique=True)),
                ('warehouse_type', models.CharField(choices=[
                    ('cotton', 'Cotton Warehouse'), ('fiber', 'Fiber Warehouse'),
                    ('wip', 'WIP Warehouse'), ('yarn', 'Yarn Warehouse'),
                    ('waste', 'Waste Warehouse'), ('other', 'Other'),
                ], max_length=20)),
                ('location', models.CharField(blank=True, max_length=255)),
                ('capacity_kg', models.DecimalField(blank=True, decimal_places=3, max_digits=14, null=True)),
                ('is_active', models.BooleanField(default=True)),
                ('notes', models.TextField(blank=True)),
                ('created_by', models.ForeignKey(
                    blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL,
                    related_name='warehouse_created', to=settings.AUTH_USER_MODEL,
                )),
                ('updated_by', models.ForeignKey(
                    blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL,
                    related_name='warehouse_updated', to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={'db_table': 'warehouses', 'ordering': ['name']},
        ),
        migrations.CreateModel(
            name='Product',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True, db_index=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('deleted_at', models.DateTimeField(blank=True, db_index=True, null=True)),
                ('name', models.CharField(max_length=200)),
                ('code', models.CharField(max_length=50, unique=True)),
                ('product_type', models.CharField(choices=[
                    ('raw_cotton', 'Raw Cotton'), ('fiber', 'Fiber'), ('seed', 'Seed'),
                    ('lint', 'Lint'), ('yarn', 'Yarn'), ('waste', 'Waste'), ('other', 'Other'),
                ], max_length=20)),
                ('unit', models.CharField(default='kg', max_length=20)),
                ('description', models.TextField(blank=True)),
                ('is_active', models.BooleanField(default=True)),
                ('yarn_count', models.CharField(blank=True, max_length=20)),
                ('yarn_type', models.CharField(blank=True, max_length=50)),
                ('category', models.ForeignKey(
                    blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL,
                    related_name='products', to='warehouse.productcategory',
                )),
                ('created_by', models.ForeignKey(
                    blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL,
                    related_name='product_created', to=settings.AUTH_USER_MODEL,
                )),
                ('updated_by', models.ForeignKey(
                    blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL,
                    related_name='product_updated', to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={'db_table': 'products', 'ordering': ['-created_at']},
        ),
        migrations.CreateModel(
            name='StockLedger',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True, db_index=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('quantity_kg', models.DecimalField(decimal_places=3, default=Decimal('0'), max_digits=16)),
                ('avg_cost_per_kg', models.DecimalField(decimal_places=4, default=Decimal('0'), max_digits=20)),
                ('total_value', models.DecimalField(decimal_places=4, default=Decimal('0'), max_digits=24)),
                ('last_movement_at', models.DateTimeField(blank=True, null=True)),
                ('warehouse', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='ledger_entries', to='warehouse.warehouse')),
                ('product', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='ledger_entries', to='warehouse.product')),
            ],
            options={'db_table': 'stock_ledger', 'ordering': ['-created_at']},
        ),
        migrations.AddConstraint(
            model_name='stockledger',
            constraint=models.UniqueConstraint(fields=['warehouse', 'product'], name='unique_warehouse_product'),
        ),
        migrations.CreateModel(
            name='StockMovement',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True, db_index=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('deleted_at', models.DateTimeField(blank=True, db_index=True, null=True)),
                ('movement_type', models.CharField(choices=[
                    ('receipt', 'Receipt (Inbound)'), ('issue', 'Issue (Outbound)'),
                    ('transfer_in', 'Transfer In'), ('transfer_out', 'Transfer Out'),
                    ('production_output', 'Production Output'), ('production_consumption', 'Production Consumption'),
                    ('adjustment', 'Adjustment'), ('return', 'Return'),
                ], max_length=30)),
                ('quantity_kg', models.DecimalField(decimal_places=3, max_digits=16)),
                ('cost_per_kg', models.DecimalField(decimal_places=4, default=Decimal('0'), max_digits=20)),
                ('total_cost', models.DecimalField(decimal_places=4, default=Decimal('0'), max_digits=24)),
                ('balance_after', models.DecimalField(decimal_places=3, default=Decimal('0'), max_digits=16)),
                ('reference_type', models.CharField(blank=True, max_length=50)),
                ('reference_id', models.CharField(blank=True, max_length=50)),
                ('notes', models.TextField(blank=True)),
                ('movement_date', models.DateField(db_index=True)),
                ('warehouse', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='movements', to='warehouse.warehouse')),
                ('product', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='movements', to='warehouse.product')),
                ('created_by', models.ForeignKey(
                    blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL,
                    related_name='stockmovement_created', to=settings.AUTH_USER_MODEL,
                )),
                ('updated_by', models.ForeignKey(
                    blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL,
                    related_name='stockmovement_updated', to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={'db_table': 'stock_movements', 'ordering': ['-movement_date', '-created_at']},
        ),
        migrations.AddIndex(
            model_name='stockmovement',
            index=models.Index(fields=['warehouse', 'product', 'movement_date'], name='stock_mv_wh_prod_date_idx'),
        ),
        migrations.AddIndex(
            model_name='stockmovement',
            index=models.Index(fields=['movement_type', 'movement_date'], name='stock_mv_type_date_idx'),
        ),
    ]
