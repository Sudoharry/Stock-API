# Generated by Django 5.1.7 on 2025-04-02 05:27

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('stocks', '0007_stock_sector_fk'),
    ]

    operations = [
        migrations.RenameIndex(
            model_name='stock',
            new_name='stocks_stoc_sector__b8cedc_idx',
            old_name='stocks_stoc_sector_6c2055_idx',
        ),
        migrations.RemoveField(
            model_name='stock',
            name='sector_fk',
        ),
        migrations.AlterField(
            model_name='stock',
            name='sector',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='related_stocks', to='stocks.topsector'),
        ),
    ]
