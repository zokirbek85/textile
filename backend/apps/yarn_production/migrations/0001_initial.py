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
        ('cotton_production', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='YarnBatch',
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
                ('fiber_input_kg', models.DecimalField(decimal_places=3, default=Decimal('0'), max_digits=14)),
                ('fiber_cost_total', models.DecimalField(decimal_places=4, default=Decimal('0'), max_digits=20)),
                ('yarn_output_kg', models.DecimalField(decimal_places=3, default=Decimal('0'), max_digits=14)),
                ('waste_output_kg', models.DecimalField(decimal_places=3, default=Decimal('0'), max_digits=14)),
                ('waste_pct', models.DecimalField(decimal_places=2, default=Decimal('0'), max_digits=6)),
                ('efficiency_pct', models.DecimalField(decimal_places=2, default=Decimal('0'), max_digits=6)),
                ('total_spinning_expenses', models.DecimalField(decimal_places=4, default=Decimal('0'), max_digits=20)),
                ('calculated_yarn_cost_per_kg', models.DecimalField(decimal_places=4, default=Decimal('0'), max_digits=20)),
                ('notes', models.TextField(blank=True)),
                ('yarn_product', models.ForeignKey(
                    blank=True, null=True, on_delete=django.db.models.deletion.PROTECT,
                    related_name='yarn_batches', to='warehouse.product',
                )),
                ('fiber_source_warehouse', models.ForeignKey(
                    blank=True, null=True, on_delete=django.db.models.deletion.PROTECT,
                    related_name='yarn_batches_in', to='warehouse.warehouse',
                )),
                ('yarn_target_warehouse', models.ForeignKey(
                    blank=True, null=True, on_delete=django.db.models.deletion.PROTECT,
                    related_name='yarn_batches_out', to='warehouse.warehouse',
                )),
                ('created_by', models.ForeignKey(
                    blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL,
                    related_name='yarnbatch_created', to=settings.AUTH_USER_MODEL,
                )),
                ('updated_by', models.ForeignKey(
                    blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL,
                    related_name='yarnbatch_updated', to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={'db_table': 'yarn_batches', 'ordering': ['-start_date', '-created_at']},
        ),
        migrations.CreateModel(
            name='YarnBatchExpense',
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
                ('batch', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='expenses', to='yarn_production.yarnbatch')),
                ('created_by', models.ForeignKey(
                    blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL,
                    related_name='yarnbatchexpense_created', to=settings.AUTH_USER_MODEL,
                )),
                ('updated_by', models.ForeignKey(
                    blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL,
                    related_name='yarnbatchexpense_updated', to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={'db_table': 'yarn_batch_expenses', 'ordering': ['category', 'expense_date']},
        ),
        migrations.CreateModel(
            name='YarnShift',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True, db_index=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('deleted_at', models.DateTimeField(blank=True, db_index=True, null=True)),
                ('shift_date', models.DateField(db_index=True)),
                ('shift_type', models.CharField(choices=[
                    ('morning', 'Morning'), ('afternoon', 'Afternoon'), ('night', 'Night'),
                ], max_length=20)),
                ('planned_hours', models.DecimalField(decimal_places=2, default=Decimal('8'), max_digits=6)),
                ('actual_hours', models.DecimalField(decimal_places=2, default=Decimal('0'), max_digits=6)),
                ('fiber_consumed_kg', models.DecimalField(decimal_places=3, default=Decimal('0'), max_digits=14)),
                ('yarn_produced_kg', models.DecimalField(decimal_places=3, default=Decimal('0'), max_digits=14)),
                ('waste_kg', models.DecimalField(decimal_places=3, default=Decimal('0'), max_digits=14)),
                ('downtime_minutes', models.PositiveIntegerField(default=0)),
                ('downtime_reason', models.TextField(blank=True)),
                ('notes', models.TextField(blank=True)),
                ('batch', models.ForeignKey(
                    blank=True, null=True, on_delete=django.db.models.deletion.CASCADE,
                    related_name='shifts', to='yarn_production.yarnbatch',
                )),
                ('machine', models.ForeignKey(
                    blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL,
                    related_name='yarn_shifts', to='cotton_production.machine',
                )),
                ('operator', models.ForeignKey(
                    blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL,
                    related_name='yarn_shifts', to=settings.AUTH_USER_MODEL,
                )),
                ('created_by', models.ForeignKey(
                    blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL,
                    related_name='yarnshift_created', to=settings.AUTH_USER_MODEL,
                )),
                ('updated_by', models.ForeignKey(
                    blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL,
                    related_name='yarnshift_updated', to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={'db_table': 'yarn_shifts', 'ordering': ['-shift_date', 'shift_type']},
        ),
    ]
