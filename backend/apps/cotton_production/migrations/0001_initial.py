import uuid
import django.db.models.deletion
from decimal import Decimal
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('users', '0001_initial'),
        ('warehouse', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='CottonBatch',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True, db_index=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('deleted_at', models.DateTimeField(blank=True, db_index=True, null=True)),
                ('batch_code', models.CharField(db_index=True, max_length=50, unique=True)),
                ('status', models.CharField(choices=[
                    ('draft', 'Draft'), ('in_progress', 'In Progress'),
                    ('completed', 'Completed'), ('cancelled', 'Cancelled'),
                ], default='draft', max_length=20)),
                ('start_date', models.DateField()),
                ('end_date', models.DateField(blank=True, null=True)),
                ('cotton_input_kg', models.DecimalField(decimal_places=3, default=Decimal('0'), max_digits=14)),
                ('cotton_cost_total', models.DecimalField(decimal_places=4, default=Decimal('0'), max_digits=20)),
                ('fiber_output_kg', models.DecimalField(decimal_places=3, default=Decimal('0'), max_digits=14)),
                ('seed_output_kg', models.DecimalField(decimal_places=3, default=Decimal('0'), max_digits=14)),
                ('lint_output_kg', models.DecimalField(decimal_places=3, default=Decimal('0'), max_digits=14)),
                ('waste_output_kg', models.DecimalField(decimal_places=3, default=Decimal('0'), max_digits=14)),
                ('seed_credit_value', models.DecimalField(decimal_places=4, default=Decimal('0'), max_digits=20)),
                ('lint_credit_value', models.DecimalField(decimal_places=4, default=Decimal('0'), max_digits=20)),
                ('total_production_expenses', models.DecimalField(decimal_places=4, default=Decimal('0'), max_digits=20)),
                ('calculated_fiber_cost_per_kg', models.DecimalField(decimal_places=4, default=Decimal('0'), max_digits=20)),
                ('fiber_yield_pct', models.DecimalField(decimal_places=2, default=Decimal('0'), max_digits=6)),
                ('notes', models.TextField(blank=True)),
                ('cotton_source_warehouse', models.ForeignKey(
                    blank=True, null=True, on_delete=django.db.models.deletion.PROTECT,
                    related_name='cotton_batches_in', to='warehouse.warehouse',
                )),
                ('fiber_target_warehouse', models.ForeignKey(
                    blank=True, null=True, on_delete=django.db.models.deletion.PROTECT,
                    related_name='cotton_batches_out', to='warehouse.warehouse',
                )),
                ('created_by', models.ForeignKey(
                    blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL,
                    related_name='cottonbatch_created', to=settings.AUTH_USER_MODEL,
                )),
                ('updated_by', models.ForeignKey(
                    blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL,
                    related_name='cottonbatch_updated', to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={'db_table': 'cotton_batches', 'ordering': ['-start_date', '-created_at']},
        ),
        migrations.CreateModel(
            name='CottonBatchExpense',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True, db_index=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('deleted_at', models.DateTimeField(blank=True, db_index=True, null=True)),
                ('category', models.CharField(choices=[
                    ('raw_material', 'Raw Material'), ('electricity', 'Electricity'),
                    ('gas', 'Gas'), ('water', 'Water'), ('salary', 'Salary'),
                    ('amortization', 'Amortization'), ('repair', 'Repair & Maintenance'),
                    ('logistics', 'Logistics'), ('laboratory', 'Laboratory'),
                    ('overhead', 'Management Overhead'), ('taxes', 'Taxes'), ('other', 'Other Indirect Expenses'),
                ], max_length=30)),
                ('description', models.CharField(blank=True, max_length=255)),
                ('amount', models.DecimalField(decimal_places=4, max_digits=20)),
                ('quantity', models.DecimalField(blank=True, decimal_places=3, max_digits=14, null=True)),
                ('unit', models.CharField(blank=True, max_length=20)),
                ('expense_date', models.DateField()),
                ('batch', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='expenses', to='cotton_production.cottonbatch')),
                ('created_by', models.ForeignKey(
                    blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL,
                    related_name='cottonbatchexpense_created', to=settings.AUTH_USER_MODEL,
                )),
                ('updated_by', models.ForeignKey(
                    blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL,
                    related_name='cottonbatchexpense_updated', to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={'db_table': 'cotton_batch_expenses', 'ordering': ['category', 'expense_date']},
        ),
        migrations.CreateModel(
            name='Machine',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True, db_index=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('deleted_at', models.DateTimeField(blank=True, db_index=True, null=True)),
                ('name', models.CharField(max_length=200)),
                ('code', models.CharField(max_length=50, unique=True)),
                ('machine_type', models.CharField(choices=[
                    ('cotton_gin', 'Cotton Gin'), ('opener', 'Opener'), ('cleaner', 'Cleaner'),
                    ('carding', 'Carding Machine'), ('combing', 'Combing Machine'),
                    ('drawing', 'Drawing Frame'), ('roving', 'Roving Frame'),
                    ('spinning', 'Ring Spinning Machine'), ('winding', 'Winding Machine'), ('other', 'Other'),
                ], max_length=30)),
                ('manufacturer', models.CharField(blank=True, max_length=100)),
                ('model_number', models.CharField(blank=True, max_length=100)),
                ('year_of_manufacture', models.PositiveSmallIntegerField(blank=True, null=True)),
                ('capacity_kg_per_hour', models.DecimalField(blank=True, decimal_places=3, max_digits=10, null=True)),
                ('is_active', models.BooleanField(default=True)),
                ('notes', models.TextField(blank=True)),
                ('created_by', models.ForeignKey(
                    blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL,
                    related_name='machine_created', to=settings.AUTH_USER_MODEL,
                )),
                ('updated_by', models.ForeignKey(
                    blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL,
                    related_name='machine_updated', to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={'db_table': 'machines', 'ordering': ['name']},
        ),
        migrations.CreateModel(
            name='Shift',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True, db_index=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('deleted_at', models.DateTimeField(blank=True, db_index=True, null=True)),
                ('shift_date', models.DateField(db_index=True)),
                ('shift_type', models.CharField(choices=[
                    ('morning', 'Morning (06:00-14:00)'),
                    ('afternoon', 'Afternoon (14:00-22:00)'),
                    ('night', 'Night (22:00-06:00)'),
                ], max_length=20)),
                ('planned_hours', models.DecimalField(decimal_places=2, default=Decimal('8'), max_digits=6)),
                ('actual_hours', models.DecimalField(decimal_places=2, default=Decimal('0'), max_digits=6)),
                ('cotton_processed_kg', models.DecimalField(decimal_places=3, default=Decimal('0'), max_digits=14)),
                ('fiber_produced_kg', models.DecimalField(decimal_places=3, default=Decimal('0'), max_digits=14)),
                ('downtime_minutes', models.PositiveIntegerField(default=0)),
                ('downtime_reason', models.TextField(blank=True)),
                ('notes', models.TextField(blank=True)),
                ('batch', models.ForeignKey(
                    blank=True, null=True, on_delete=django.db.models.deletion.CASCADE,
                    related_name='shifts', to='cotton_production.cottonbatch',
                )),
                ('supervisor', models.ForeignKey(
                    blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL,
                    related_name='supervised_shifts', to=settings.AUTH_USER_MODEL,
                )),
                ('created_by', models.ForeignKey(
                    blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL,
                    related_name='shift_created', to=settings.AUTH_USER_MODEL,
                )),
                ('updated_by', models.ForeignKey(
                    blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL,
                    related_name='shift_updated', to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={'db_table': 'cotton_shifts', 'ordering': ['-shift_date', 'shift_type']},
        ),
    ]
