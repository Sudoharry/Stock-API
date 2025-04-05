from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import Stock, TopSector, User

admin.site.register(Stock)
admin.site.register(TopSector)
admin.site.register(User, UserAdmin)

