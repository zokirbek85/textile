from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("warehouse", "0002_alter_product_options_alter_productcategory_options_and_more"),
    ]

    operations = [
        migrations.AlterField(
            model_name="warehouse",
            name="warehouse_type",
            field=models.CharField(
                choices=[
                    ("cotton", "Cotton Warehouse"),
                    ("fiber", "Fiber Warehouse"),
                    ("wip", "WIP Warehouse"),
                    ("yarn", "Yarn Warehouse"),
                    ("waste", "Waste Warehouse"),
                    ("tolling_raw_material", "Tolling Raw Material"),
                    ("tolling_finished_goods", "Tolling Finished Goods"),
                    ("other", "Other"),
                ],
                max_length=25,
            ),
        ),
    ]
