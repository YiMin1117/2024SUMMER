$(document).ready(function(){
    // Setup AJAX CSRF token header
    $.ajaxSetup({
        headers: { 'X-CSRFToken': csrf_token },
        type: 'POST',
    });

    // Initialize DataTables
    let scrapedDataTable = $('#scraped_data_table').DataTable();
    let unsplicedDataTable = $('#unspliced_data_table').DataTable();

    $('#submit').click(function(){
        $.ajax({
            url: '/web_tool/ajax_data/',
            data: $('#ajax_form').serialize(),
            success: function(response){
                let gene_id = response.gene_id;
                let transcript_id = JSON.parse(response.transcript_id.replace(/'/g, '"'));
                let numbers = response.numbers;
                let search_type = response.search_type;

                let trans_output="";
                for (let i = 0; i < transcript_id.length; i++) {
                    trans_output += `<a href="#" class="scrape-link" data-transcript-id="${transcript_id[i]}">${transcript_id[i]}</a>`;
                    if (i<transcript_id.length-1){
                        trans_output+=' , ';
                    }
                }

                $('#result_gene_id').text(gene_id);
                $('#result_transcript_id').html(trans_output);
                $('#result_numbers').text(numbers);

                // Clear previous styles
                $('#result_table th').removeClass('bg-dark text-white');
                // Apply new styles based on search_type
                if (search_type === 'gene_id') {
                    $('#result_table th:contains("Gene ID")').addClass('bg-dark text-white');
                } else if (search_type === 'transcript_id') {
                    $('#result_table th:contains("Transcript ID")').addClass('bg-dark text-white');
                }
                
        },
            error: function(){
                alert('Something error');
            },
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
                    
                    // 更新 spliced_data 表格
                    scrapedDataTable.clear().draw(); // 清除现有数据
                    response.spliced_data.forEach(row => {
                        scrapedDataTable.row.add([
                            row.type,
                            row.start,
                            row.stop,
                            row.length
                        ]).draw();
                    });
                    //處理spliced_sequence 
                    if (response.spliced_sequence){
                        let spliced_sequence = response.spliced_sequence;
                        let sequence_length = spliced_sequence.length;
                        let coloredSequence = Array(sequence_length).fill(null);

                        const colors ={
                            odd_exon: "#FFFF00",  // 黄色
                            even_exon: "#FFA500", // 橘色
                            utr: "#D3D3D3"       // 灰色
                        }

                        response.spliced_data.forEach((row,index) =>{
                            if(row.type.startsWith('exon')){
                                let start = row.start-1;
                                let stop = row.stop;
                                let color = (index % 2 ===0) ? colors.odd_exon :colors.even_exon;
                                for(let i =start;i<stop;i++){
                                    coloredSequence[i] = color;
                                }
                            }
                        });
                        response.spliced_data.forEach(row => {
                            if (row.type.endsWith('UTR')) {
                                let start = row.start - 1;
                                let stop = row.stop;
                                for (let i = start; i < stop; i++) {
                                    coloredSequence[i] = colors.utr;
                                }
                            }
                        });
                        //console.log(coloredSequence);

                        let coloredSegments = coloredSequence.map((color, index) => {
                            let char = spliced_sequence[index];
                            return color ? `<span style="background-color: ${color};">${char}</span>` : char;
                        });
                        let coloredString = coloredSegments.join('');
                        console.log (coloredString)
                        // 将 HTML 字符串解析为 DOM 元素
                        let tempDiv = document.createElement('div');
                        tempDiv.innerHTML = coloredString;

                        // 获取所有 <span> 元素
                        let spans = Array.from(tempDiv.querySelectorAll('span'));

                        // 初始化格式化后的字符串
                        let formattedString = '';

                        // 遍历所有 <span> 元素
                        for (let i = 0; i < spans.length; i++) {
                            // 获取当前 <span> 元素的外部 HTML
                            formattedString += spans[i].outerHTML;

                            // 每 10 个元素插入一个空格（但不在末尾）
                            if ((i + 1) % 10 === 0 && (i + 1) !== spans.length) {
                                formattedString += '&nbsp;';
                            }

                            // 每 50 个元素插入一个换行符
                            if ((i + 1) % 50 === 0 && (i + 1) !== spans.length) {
                                formattedString += '<br>';
                            }
                        }

                        // 显示结果
                        //document.getElementById('sequence_data').innerHTML = formattedString;
                        //console.log(coloredString)
                        // console.log (coloredString)
                            // 按每 50 个字符分组
                        // let formattedSplicedSequence = "";
                        // for (let i = 0; i < coloredSegments.length; i += 50) {
                        //     let segment = coloredString.slice(i, i + 50);
                        //     //console.log(segment)
                        //     // 每 10 个字符添加一个空格
                        //     let spacedSegment = segment.replace(/(.{10})(?=.)/g, '$1 ').trim();
                        //     //console.log(spacedSegment)
                        //     formattedSplicedSequence += `${(i / 50 + 1).toString().padEnd(4)} ${spacedSegment}<br>`;
                        // }
                        //console.log(formattedSplicedSequence)
                        //$('#sequence_data').html(coloredString);
                    }
                    
                    
                    // 更新 unspliced_data 表格
                    unsplicedDataTable.clear().draw(); // 清除现有数据
                    response.unspliced_data.forEach(row => {
                        unsplicedDataTable.row.add([
                            row.type,
                            row.start,
                            row.stop,
                            row.length
                        ]).draw();
                    });
                    
                    // 处理 protein_data
                    if (response.protein_data) {
                        let proteinData = response.protein_data;
                        let formattedProteinData = "";
                        for (let i = 0; i < proteinData.length; i += 40) {
                            let index = i + 1;
                            let proteinSegment = proteinData.substring(i, i + 40);
                            let spacedProteinSegment = proteinSegment.match(/.{1,10}/g).join(' ');
                            formattedProteinData += `${index.toString().padEnd(5)} ${spacedProteinSegment}\n`;
                        }
                        $('#protein_structure_title').text('Protein Data of ' + transcript_id);
                        $('#protein_data').text(formattedProteinData);
                    }

                    // 使用 SweetAlert 显示爬取时间
                    Swal.fire({
                        title: 'Data Fetched Successfully',
                        text: `Time taken: ${timeTaken} seconds`,
                        icon: 'success',
                        confirmButtonText: 'OK',
                    });

                } else {
                    scrapedDataTable.clear().draw();
                    unsplicedDataTable.clear().draw();
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
});
