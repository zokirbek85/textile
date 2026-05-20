import uuid
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('users', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Notification',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True, db_index=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('level', models.CharField(choices=[
                    ('info', 'Info'), ('success', 'Success'),
                    ('warning', 'Warning'), ('error', 'Error'),
                ], default='info', max_length=10)),
                ('event_type', models.CharField(choices=[
                    ('batch_completed', 'Batch Completed'),
                    ('batch_started', 'Batch Started'),
                    ('low_stock', 'Low Stock Alert'),
                    ('cost_spike', 'Cost Spike Alert'),
                    ('machine_downtime', 'Machine Downtime'),
                    ('system', 'System'),
                ], default='system', max_length=30)),
                ('title', models.CharField(max_length=200)),
                ('message', models.TextField()),
                ('is_read', models.BooleanField(default=False)),
                ('reference_type', models.CharField(blank=True, max_length=50)),
                ('reference_id', models.CharField(blank=True, max_length=50)),
                ('recipient', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='notifications',
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={'db_table': 'notifications', 'ordering': ['-created_at']},
        ),
        migrations.AddIndex(
            model_name='notification',
            index=models.Index(fields=['recipient', 'is_read', 'created_at'], name='notif_recipient_read_created_idx'),
        ),
    ]
