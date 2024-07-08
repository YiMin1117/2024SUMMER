from Bio.Seq import Seq
import hw2

def generate_sequence(index_and_name_and_info):
    only_sequence=[]
    for i in range(len(index_and_name_and_info)):
        sequence=index_and_name_and_info[i][4]
        if sequence.isupper():
            only_sequence.append(sequence)
    return only_sequence

complete_data="raw_data/unspliced+UTRTranscriptSequence_Y40B10A.2a.1 (1).fasta"
raw_sequence=hw2.readfile_generate_raw_sequence(complete_data)
chips_output=hw2.chips(raw_sequence)
index_and_name_and_info=hw2.generate_indexAndName(chips_output)
only_sequence=generate_sequence(index_and_name_and_info)
cds=''.join(only_sequence)
coding_dna=Seq(cds)
protein=coding_dna.translate(to_stop=True)
print(str(protein))
