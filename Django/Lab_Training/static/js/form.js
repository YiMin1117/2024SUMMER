$.ajaxSetup({
    headers: { 'X-CSRFToken': csrf_token },
    type: 'POST',
});

$(document).ready(function(){
    $('#submit').click(function(){
        $.ajax({
            url: '/web_tool/ajax_data/', 
            data: formData,
            success: function(response){ 
                let gene_id = $('input[name="gene_id"]').val();
                let parts = response.message.split('<br>');
                let transcript_id = parts[0].split(': ')[1];
                let numbers = parts[1].split(': ')[1];
                let tableHtml = `
                        <table class="table table-bordered">
                            <thead>
                                <tr>
                                    <th>Gene ID</th>
                                    <th>Transcript ID</th>
                                    <th>Numbers</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>${gene_id}</td>
                                    <td>${transcript_id}</td>
                                    <td>${numbers}</td>
                                </tr>
                            </tbody>
                        </table>
                    `;

                    // 将表格插入到页面中
                    $("#message").html(tableHtml);
            },
            error: function(){
                alert('Something went wrong.');
            },
        });
    });
});
