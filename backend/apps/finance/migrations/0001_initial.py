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
            name='FinancialTransaction',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True, db_index=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('deleted_at', models.DateTimeField(blank=True, db_index=True, null=True)),
                ('transaction_date', models.DateField(db_index=True)),
                ('transaction_type', models.CharField(choices=[
                    ('production_cost', 'Production Cost'),
                    ('raw_material_purchase', 'Raw Material Purchase'),
                    ('utility_expense', 'Utility Expense'),
                    ('salary_expense', 'Salary Expense'),
                    ('maintenance_expense', 'Maintenance Expense'),
                    ('overhead_allocation', 'Overhead Allocation'),
                    ('revenue', 'Revenue'),
                    ('other_expense', 'Other Expense'),
                    ('other_income', 'Other Income'),
                ], max_length=30)),
                ('amount', models.DecimalField(decimal_places=4, max_digits=20)),
                ('description', models.TextField()),
                ('reference_type', models.CharField(blank=True, max_length=50)),
                ('reference_id', models.CharField(blank=True, max_length=50)),
                ('is_expense', models.BooleanField(default=True)),
                ('expense_category', models.CharField(blank=True, max_length=30)),
                ('created_by', models.ForeignKey(
                    blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL,
                    related_name='financialtransaction_created', to=settings.AUTH_USER_MODEL,
                )),
                ('updated_by', models.ForeignKey(
                    blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL,
                    related_name='financialtransaction_updated', to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={'db_table': 'financial_transactions', 'ordering': ['-transaction_date', '-created_at']},
        ),
        migrations.AddIndex(
            model_name='financialtransaction',
            index=models.Index(fields=['transaction_date', 'transaction_type'], name='fin_tx_date_type_idx'),
        ),
        migrations.CreateModel(
            name='BudgetLine',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True, db_index=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('deleted_at', models.DateTimeField(blank=True, db_index=True, null=True)),
                ('year', models.PositiveSmallIntegerField()),
                ('month', models.PositiveSmallIntegerField()),
                ('category', models.CharField(max_length=30)),
                ('budgeted_amount', models.DecimalField(decimal_places=4, default=Decimal('0'), max_digits=20)),
                ('notes', models.TextField(blank=True)),
                ('created_by', models.ForeignKey(
                    blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL,
                    related_name='budgetline_created', to=settings.AUTH_USER_MODEL,
                )),
                ('updated_by', models.ForeignKey(
                    blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL,
                    related_name='budgetline_updated', to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={'db_table': 'budget_lines', 'ordering': ['year', 'month', 'category']},
        ),
        migrations.AddConstraint(
            model_name='budgetline',
            constraint=models.UniqueConstraint(fields=['year', 'month', 'category'], name='unique_budget_year_month_cat'),
        ),
    ]
