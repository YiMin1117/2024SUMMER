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
                    trans_output += `<a href="#" class="scrape-link" data-transcript-id="${transcript_id[i]}">${transcript_id[i]}</a>`;
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

$(document).on('click', '.scrape-link', function(e) {
    let transcript_id = $(this).data('transcript-id');
    //console.log(`Transcript ID clicked: ${transcript_id}`); // 打印 transcript_id
    let startTime = new Date();
    $.ajax({
        url: `/web_tool/scrape/${transcript_id}/`,
        beforeSend: function() {
            // 显示加载动画
            $('#loadingModal').modal('show');
        },
        success: function(response) {
            let endTime = new Date();
            let timeTaken = ((endTime - startTime) / 1000).toFixed(2); // 计算爬取时间（秒）

            console.log('Success response:', response); 

            if (response.spliced_data || response.unspliced_data) {
                $('#spliced_structure_title').text('Spliced Table of ' + transcript_id);
                $('#unspliced_structure_title').text('Unspliced Table of ' + transcript_id);
                
                // 处理 spliced_data
                let splicedTableBody = '';
                response.spliced_data.forEach(row => {
                    splicedTableBody += `<tr>
                        <td>${row.type}</td>
                        <td>${row.start}</td>
                        <td>${row.stop}</td>
                        <td>${row.length}</td>
                    </tr>`;
                });
                $('#scraped_data_table tbody').html(splicedTableBody);

                // 处理 unspliced_data
                let unsplicedTableBody = '';
                response.unspliced_data.forEach(row => {
                    unsplicedTableBody += `<tr>
                        <td>${row.type}</td>
                        <td>${row.start}</td>
                        <td>${row.stop}</td>
                        <td>${row.length}</td>
                    </tr>`;
                });
                $('#unspliced_data_table tbody').html(unsplicedTableBody);
                
                // 使用 SweetAlert 显示爬取时间
                Swal.fire({
                    title: 'Data Fetched Successfully',
                    text: `Time taken: ${timeTaken} seconds`,
                    icon: 'success',
                    confirmButtonText: 'OK',
                    
                });

            } else {
                $('#scraped_data_table tbody').html('<tr><td colspan="4">No data found</td></tr>');
                $('#unspliced_data_table tbody').html('<tr><td colspan="4">No data found</td></tr>');
                Swal.fire({
                    title: 'Error',
                    text: 'Something went wrong while fetching scrape data.',
                    icon: 'error',
                    confirmButtonText: 'OK'
                });
            }
        },
        error: function(xhr, status, error) {
            console.log('Error response:', xhr.responseText); // 打印错误回调的 response
            Swal.fire({
                title: 'Error',
                text: 'Something went wrong while fetching scrape data.',
                icon: 'error',
                confirmButtonText: 'OK'
            });
        },
        complete: function() {
            // 隐藏加载动画
            $('#loadingModal').modal('hide');
        }
    });
});
