import uuid
import django.db.models.deletion
from decimal import Decimal
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('warehouse', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='CostSnapshot',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True, db_index=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('stage', models.CharField(choices=[
                    ('cotton_to_fiber', 'Cotton → Fiber'),
                    ('fiber_to_yarn', 'Fiber → Yarn'),
                ], max_length=20)),
                ('reference_type', models.CharField(max_length=50)),
                ('reference_id', models.UUIDField(db_index=True)),
                ('snapshot_date', models.DateField(db_index=True)),
                ('input_kg', models.DecimalField(decimal_places=3, max_digits=14)),
                ('input_cost', models.DecimalField(decimal_places=4, max_digits=20)),
                ('output_kg', models.DecimalField(decimal_places=3, max_digits=14)),
                ('output_cost_per_kg', models.DecimalField(decimal_places=4, max_digits=20)),
                ('total_output_cost', models.DecimalField(decimal_places=4, max_digits=20)),
                ('expenses_breakdown', models.JSONField(default=dict)),
                ('yield_pct', models.DecimalField(decimal_places=2, default=Decimal('0'), max_digits=6)),
                ('waste_pct', models.DecimalField(decimal_places=2, default=Decimal('0'), max_digits=6)),
                ('product', models.ForeignKey(
                    blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL,
                    to='warehouse.product',
                )),
            ],
            options={'db_table': 'cost_snapshots', 'ordering': ['-snapshot_date', '-created_at']},
        ),
        migrations.AddIndex(
            model_name='costsnapshot',
            index=models.Index(fields=['stage', 'snapshot_date'], name='cost_snap_stage_date_idx'),
        ),
        migrations.AddIndex(
            model_name='costsnapshot',
            index=models.Index(fields=['product', 'snapshot_date'], name='cost_snap_prod_date_idx'),
        ),
    ]
