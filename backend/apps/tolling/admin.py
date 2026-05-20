from django.contrib import admin
from .models import TollingContract, TollingRawMaterialReceipt, TollingDelivery, TollingInvoice

admin.site.register(TollingContract)
admin.site.register(TollingRawMaterialReceipt)
admin.site.register(TollingDelivery)
admin.site.register(TollingInvoice)
