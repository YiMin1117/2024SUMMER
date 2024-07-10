import pandas as pd

if __name__=="__main__":
    df=pd.read_csv('csv/hw2.csv')

    df = df[df['Name'].str.contains('Intron') == False].reset_index(drop=True)
    exons_df = df[df['Name'].str.contains('Exon')]
 
    for i in range(2, len(exons_df)+1):#reset exon
        df.loc[i, 'Start'] = df.loc[i-1, 'End'] + 1
        df.loc[i, 'End'] = df.loc[i, 'Start'] + df.loc[i, 'Length']-1
    if (df['Name'].str.contains("3'utr")).any():#if need to reset 3'utr
        indices = df.loc[df['Name'] == "3'utr"].index-1
        valid_indices = indices[indices >= 0]
        df.loc[df['Name'] == "3'utr", 'Start']=df.loc[valid_indices,'End'].iloc[0]-df.loc[df['Name'] == "3'utr","Length"].iloc[0]+1
        df.loc[df['Name'] == "3'utr", 'End']=df.loc[df['Name'] == "3'utr", 'Start'].iloc[0] +df.loc[df['Name'] == "3'utr", 'Length'].iloc[0]-1
    #generate cds
    cds_start=df.loc[df['Name'] == "5'utr", 'End'].iloc[0]+1
    cds_end=df.loc[df['Name'] == "3'utr", 'Start'].iloc[0]-1
    df.loc[len(df)]=["CDS",cds_start,cds_end,(cds_end-cds_start+1)]
    df.to_csv("hw3.csv",index=False)
