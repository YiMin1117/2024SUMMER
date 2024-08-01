from django.shortcuts import render
from django.http import HttpResponse
from datetime import datetime
from django.db import connection
from django.http import JsonResponse

from web_tool.models import User,Test,Gene
from web_tool import models, forms

import pandas as pd
import json

from .utils.trans_crawler import crawler
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

#==========below is project area
def form(request):    
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

def scrape_data(request, transcript_id):
    print(f"Received transcript_id: {transcript_id}")  # 确保 transcript_id 正确
    #df = None  # 初始化 df 变量
    try:
        spliced_df,unspliced_df = crawler(transcript_id)
        if not spliced_df.empty or not unspliced_df.empty:
            spliced_data = spliced_df.to_dict(orient='records')
            unspliced_data = unspliced_df.to_dict(orient= 'records')
            response = {
                'spliced_data': spliced_data,
                'unspliced_data': unspliced_data,
                'message': 'Data fetched successfully'
            }
        else:
            response = {
                'message': 'No data found'
            }
    except Exception as e:
        response = {
            'message': 'Something wrong, please check again. Error: ' + str(e)
        }

    return JsonResponse(response)
