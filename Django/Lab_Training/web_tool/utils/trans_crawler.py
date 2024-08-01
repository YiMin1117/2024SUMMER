import requests
import pandas as pd
def extract_spliced (data):
    if data['fields']['spliced_sequence_context']['data']['strand'] == '+':
        table = data['fields']['spliced_sequence_context']['data']['positive_strand']['features']
    else:
        table = data['fields']['spliced_sequence_context']['data']['negative_strand']['features']
    spliced_df = pd.DataFrame(table)
    spliced_df['length'] = spliced_df['stop'] - spliced_df['start'] + 1
    spliced_df = spliced_df[['type', 'start', 'stop', 'length']]

    # Determine CDS start and stop
    if 'five_prime_UTR' in spliced_df['type'].values:
        last_five_prime_utr_stop = spliced_df[spliced_df['type'] == 'five_prime_UTR']['stop'].max()
    else:
        last_five_prime_utr_stop = spliced_df[spliced_df['type'] == 'exon']['start'].min() - 1

    if 'three_prime_UTR' in spliced_df['type'].values:
        first_three_prime_utr_start = spliced_df[spliced_df['type'] == 'three_prime_UTR']['start'].min()
    else:
        first_three_prime_utr_start = spliced_df[spliced_df['type'] == 'exon']['stop'].max() + 1

    cds_start = last_five_prime_utr_stop + 1
    cds_stop = first_three_prime_utr_start - 1
    
    # Add CDS row
    spliced_df.loc[len(spliced_df)] = ['cds', cds_start, cds_stop, cds_stop - cds_start + 1]
    # Rename exon types
    exon_counter = 1
    for index, row in spliced_df.iterrows():
        if row['type'] == 'exon':
            spliced_df.at[index, 'type'] = f'exon{exon_counter}'
            exon_counter += 1
    return spliced_df

def extract_unspliced(data):
    if data['fields']['unspliced_sequence_context']['data']['strand'] == '+':
        table = data['fields']['unspliced_sequence_context']['data']['positive_strand']['features']
    else:
        table = data['fields']['unspliced_sequence_context']['data']['negative_strand']['features']
    unspliced_df = pd.DataFrame(table)
    unspliced_df['length'] = unspliced_df['stop'] - unspliced_df['start'] + 1
    unspliced_df = unspliced_df[['type', 'start', 'stop', 'length']]

    # Rename exon types
    exon_counter = 1
    intron_counter = 1
    for index, row in unspliced_df.iterrows():
        if row['type'] == 'exon':
            unspliced_df.at[index, 'type'] = f'exon{exon_counter}'
            exon_counter += 1
        elif row['type'] == 'intron':
            unspliced_df.at[index, 'type'] = f'intron{intron_counter}'
            intron_counter +=1
    
    return unspliced_df

def crawler(transcript_id: str):
    url = f'https://wormbase.org/rest/widget/transcript/{transcript_id}/sequences'
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.0 Safari/537.36'
    }
    response = requests.get(url, headers=headers)
    if response.status_code == 200:
        data = response.json()
        print(f"Raw data fetched: {data}")  # 打印原始数据
        spliced_df = extract_spliced(data)
        unspliced_df = extract_unspliced(data)
        return spliced_df,unspliced_df
    else:
        print(f"Failed to fetch data. Status code: {response.status_code}")
    return pd.DataFrame()  # 确保返回一个空的 DataFrame 而不是 None
