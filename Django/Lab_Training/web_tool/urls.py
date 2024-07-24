from django.urls import path
from . import views

urlpatterns = [
    path('', views.index),
    path('info/',views.info),
    path('ajax_data/', views.ajax_data),
    path('form/', views.form)
]