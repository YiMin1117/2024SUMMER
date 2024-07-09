import pandas as pd
import re
from collections import defaultdict
import time


def parse_fasta(file_path):
    genes_dict=defaultdict(list)
    with open(file_path,'rt')as file:
        for line in file.readlines():
            line=line.strip()
            if line.startswith(">"):
                head=line[1:]
                transcript,gene=head.split(" gene=")
                genes_dict[gene].append(transcript)
    return genes_dict

def createDataFrame (genes_dict):
    gene_data={
        "Gene_ID":[],
        "transcript_ID":[],
        "# of transcripts":[]
    }
    for gene,transcripts in genes_dict.items():
        gene_data["Gene_ID"].append(gene)
        gene_data["transcript_ID"].append(transcripts)
        gene_data["# of transcripts"].append(len(transcripts))
    df=pd.DataFrame(gene_data)
    return df

def sortIndexByGene_ID(df):
    df['Gene_Num']=df['Gene_ID'].apply(lambda x:int(re.search(r'\d+',x).group()))
    df=df.sort_values(by='Gene_Num').drop(columns='Gene_Num').reset_index(drop=True)
    return df

if __name__ == "__main__":
    start=time.perf_counter()
    file_path="raw_data/c_elegans.PRJNA13758.WS284.mRNA_transcripts.fa"
    output_csv = "hw1.csv"
    
    genes_dict=parse_fasta(file_path)
    unsortdf=createDataFrame(genes_dict)
    df=sortIndexByGene_ID(unsortdf)
    df.to_csv(output_csv, index=False)
    
    end=time.perf_counter()
    print(f"CSV file saved: {output_csv}")
    print(f"total time{(end-start)}")
 

