# Generated by Django 5.1.7 on 2025-04-01 11:17

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('stocks', '0003_alter_stock_current_price_alter_stock_high_52w_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='stock',
            name='pe_ratio',
            field=models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True),
        ),
    ]
