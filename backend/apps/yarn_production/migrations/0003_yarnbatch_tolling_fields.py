from decimal import Decimal
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("yarn_production", "0002_alter_yarnbatch_created_by_and_more"),
        ("tolling", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="yarnbatch",
            name="tolling_contract",
            field=models.ForeignKey(
                blank=True, null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="yarn_batches",
                to="tolling.tollingcontract",
            ),
        ),
        migrations.AddField(
            model_name="yarnbatch",
            name="raw_material_receipt",
            field=models.ForeignKey(
                blank=True, null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="yarn_batches",
                to="tolling.tollingrawmaterialreceipt",
            ),
        ),
        migrations.AddField(
            model_name="yarnbatch",
            name="processor_yarn_kg",
            field=models.DecimalField(decimal_places=3, default=Decimal("0"), max_digits=14),
        ),
        migrations.AddField(
            model_name="yarnbatch",
            name="customer_yarn_kg",
            field=models.DecimalField(decimal_places=3, default=Decimal("0"), max_digits=14),
        ),
        migrations.AddField(
            model_name="yarnbatch",
            name="loss_yarn_kg",
            field=models.DecimalField(decimal_places=3, default=Decimal("0"), max_digits=14),
        ),
        migrations.AddField(
            model_name="yarnbatch",
            name="hard_waste_kg",
            field=models.DecimalField(decimal_places=3, default=Decimal("0"), max_digits=14),
        ),
        migrations.AddField(
            model_name="yarnbatch",
            name="soft_waste_kg",
            field=models.DecimalField(decimal_places=3, default=Decimal("0"), max_digits=14),
        ),
        migrations.AddField(
            model_name="yarnbatch",
            name="pneumo_waste_kg",
            field=models.DecimalField(decimal_places=3, default=Decimal("0"), max_digits=14),
        ),
        migrations.AddField(
            model_name="yarnbatch",
            name="service_fee_per_kg_fiber",
            field=models.DecimalField(decimal_places=4, default=Decimal("0"), max_digits=20),
        ),
        migrations.AddField(
            model_name="yarnbatch",
            name="total_service_fee",
            field=models.DecimalField(decimal_places=4, default=Decimal("0"), max_digits=20),
        ),
        migrations.AddField(
            model_name="yarnbatch",
            name="total_service_fee_with_vat",
            field=models.DecimalField(decimal_places=4, default=Decimal("0"), max_digits=20),
        ),
    ]
