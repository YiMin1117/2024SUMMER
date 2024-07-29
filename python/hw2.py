import pandas as pd

def readfile_generate_raw_sequence (file_path):
    with open(file_path,'r') as file:
        lines=file.readlines()
        return lines[1]
    
def transform (c:str):
    if c.isupper():
        return"big"
    else:
        return"small"
    
def chips (sequence):   
    prev_state=None
    i=0
    start=0
    result=[]
    while True:
        if i==len(sequence):
            break
        cur=transform(sequence[i])
        if prev_state==None:
            prev_state=cur
        else:
            if prev_state!=cur:
                result.append(sequence[start:i])
                prev_state=cur
                start=i
        i+=1
    result.append(sequence[start:])#deal with the last one sequence
    return result

def generate_indexAndName (splice:list[str]):
    hw2_list=[]
    start=0
    for i in range(len(splice)):
        length=len(splice[i])
        end=start+len(splice[i])
        info=splice[i]
        hw2_list.append([start+1,end,length,info])
        start=start+length
    start=0
    end=len(splice)
    if splice[0].islower():
        hw2_list[1][0]=hw2_list[0][0]#exon1 start change to 5utr
        hw2_list[1][2]+=hw2_list[0][2]#exon1 len plus the 5utr len
        hw2_list[0]=["5'utr"]+hw2_list[0]
        start=1
    if splice[-1].islower():
        hw2_list[-2][1]=hw2_list[-1][1]#exon(last) end chage to 3utr end
        hw2_list[-2][2]+=hw2_list[-1][2]#exon(last) len plus the 3utr len
        hw2_list[-1]=["3'utr"]+hw2_list[-1]
        end-=1
    exon_index=1
    intron_index=1
    for i,_ in enumerate(hw2_list[start:end]):
        if splice[i+start].isupper():
            hw2_list[i+start]=[f"Exon{exon_index}"]+ hw2_list[i+start]
            exon_index+=1
        if splice[i+start].islower():
            hw2_list[i+start]=[f"Intron{intron_index}"]+ hw2_list[i+start]
            intron_index+=1
    return hw2_list
# def transform_toDataframe(l):
#     df=pd.DataFrame(l,columns=['Name','Start','End','Length'])
#     df.to_csv('hw2.csv',index=False)
#     return df

#======================vaildation============


if __name__=="__main__":
    complete_data="raw_data/unspliced+UTRTranscriptSequence_Y40B10A.2a.1 (1).fasta"
    without3_data="raw_data/without3\'.fasta"
    without5_data="raw_data/without5\'.fasta"
    withoutboth_data="raw_data/withoutboth.fasta"
    raw_sequence = readfile_generate_raw_sequence(complete_data)
    print(len(raw_sequence),'\n')
    chips_output = chips(raw_sequence)
    print(len(chips_output),'\n')

    index_and_name = generate_indexAndName(chips_output)
    print(index_and_name)
    for i in range(len(index_and_name)):
        del index_and_name[i][4]
        
    df=pd.DataFrame(index_and_name,columns=['Name','Start','End','Length'])
    print(df)
    df.to_csv('hw2.csv',index=False)
    



    

    