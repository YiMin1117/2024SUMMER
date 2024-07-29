from django.shortcuts import render
from django.http import HttpResponse
from datetime import datetime
from django.db import connection
from django.http import JsonResponse

from web_tool.models import User,Test,Gene
from web_tool import models, forms

import pandas as pd
import json
# Create your views here.
def hello_world(request):
    time = datetime.now()
    return render(request, 'hello_world.html', locals())
def index(request):

    # df = pd.read_csv('data/hw1_output_ans.csv')
    # df = df.head(10)
    # df = df.rename(columns={"Gene_ID": "id",
    #                         "transcript_ID": "transcript",
    #                         "# of transcripts": "number",
    #                         })
    # json_string = df.to_json(orient='records')
    # genes = json.loads(json_string)
    genes=Gene.objects.all()
    test=Test.objects.all()
    return render(request, 'index.html', locals())
    
def info(request):
    return render(request,'info.html',locals())


# 將 SQL 指令回傳的 List 轉成 Dict
def dictfetchall(cursor):
    columns = [col[0] for col in cursor.description]
    return [
        dict(zip(columns, row))
        for row in cursor.fetchall()
    ]


def form(request):

    # # SQL Test
    # try:
    #     id = request.GET['user_id']
    #     password = request.GET['user_pass']
    #     cursor = connection.cursor()
    #     cursor.execute("SELECT * FROM web_tool_user WHERE user_id='{}' AND user_pass='{}'".format(id,password))
    #     user = dictfetchall(cursor)
        
    #     if user:
    #         message = user[0]['user_content']
    #     else:
    #         message = "ID or Password not found."
            
    # except:
    #     pass

    # # ORM Test
    # try:
    #     id2 = request.POST['user_id2']
    #     password2 = request.POST['user_pass2']
    #     user2 = User.objects.filter(user_id=id2, user_pass=password2)

    #     if user2:
    #         message2 = user2[0].user_content
    #     else:
    #         message2 = "ID or Password not found."
            
    # except:
    #     pass
    
    # # ModelForm
    # if request.method == 'POST':
    #     user_form = forms.UserForm(request.POST)
    #     if user_form.is_valid():
    #         user_form.save()
    #         message3 = 'Saved successfully.'
    #     else:
    #         message3 = 'Something wrong, please check again.'
    # else:
    #     user_form = forms.UserForm()
    
    return render(request, 'form.html', locals()) 

def ajax_data(request):
    search_input = request.POST.get('search_input', '')

    try:
        if search_input.startswith('WBGene'):
            gene = models.Gene.objects.get(gene_id=search_input)
        else:
            gene = models.Gene.objects.get(transcript_id__contains=search_input)
        
        transcript = gene.transcript_id
        numbers = gene.numbers
        message = 'Transcript ID: ' + transcript + '<br>Numbers: ' + str(numbers)
        response = {
            'message': message,
            'gene_id': gene.gene_id,
            'transcript_id': transcript,
            'numbers': numbers
        }
    except models.Gene.DoesNotExist:
        message = 'No record found for the provided ID.'
        response = {
            'message': message
        }
    except Exception as e:
        message = 'Something wrong, please check again. Error: ' + str(e)
        response = {
            'message': message
        }
    
    return JsonResponse(response)