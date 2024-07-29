$.ajaxSetup({
    headers: { 'X-CSRFToken': csrf_token },
    type: 'POST',
});
//{"message": "Transcript ID: ['F52H2.2a.1', 'F52H2.2b.1']<br>Numbers: 2"}
$(document).ready(function(){

    $('#submit').click(function(){
        
        $.ajax({
            url: '/web_tool/ajax_data/', 
            data: $('#ajax_form').serialize(),
            success: function(response){
                // let gene_id = $('input[name="gene_id"]').val(); 
                // let parts = response.message.split('<br>');
                // let transcript_id = parts[0].split(': ')[1];
                // transcript_id = transcript_id.replace(/'/g, '"');
                // transcript_id = JSON.parse(transcript_id);
                //let numbers = parts[1].split(': ')[1]; 
                let gene_id = response.gene_id;
                let transcript_id = JSON.parse(response.transcript_id.replace(/'/g, '"'));
                let numbers = response.numbers;
                
                let trans_output="";
                for (let i = 0; i < transcript_id.length; i++) {
                    //trans_output += transcript_id[i].toString();
                    trans_output += `<a href="/web_tool/scrape/${transcript_id[i]}">${transcript_id[i]}</a>`;
                    if (i<transcript_id.length-1){
                        trans_output+=' , ';
                    }
                }

                $('#result_gene_id').text(gene_id);
                $('#result_transcript_id').html(trans_output);
                $('#result_numbers').text(numbers);
        },
            error: function(){
                alert('Something error');
            },
        });
    });
});