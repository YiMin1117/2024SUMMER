from django.contrib import admin
from web_tool.models import Gene,User

class GeneAdmin(admin.ModelAdmin): #設定Gene介面的外觀
    list_display = ('gene_id','transcript_id','numbers')

admin.site.register(Gene, GeneAdmin) #註冊Gene model

class UserAdmin(admin.ModelAdmin):
    list_display = ('user_id','user_pass','user_content')
admin.site.register(User, UserAdmin)
