# Generated by Django 5.2 on 2025-04-03 05:26

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('stocks', '0010_remove_stock_last_updated_stock_updated_at_and_more'),
    ]

    operations = [
        migrations.RenameField(
            model_name='stock',
            old_name='updated_at',
            new_name='last_updated',
        ),
    ]
