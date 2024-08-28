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
                    updateChart(response.spliced_data);

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

                        let exonIndex = 0;
                        response.spliced_data.forEach(row => {
                            if (row.type.startsWith('exon')) {
                                let start = row.start - 1;
                                let stop = row.stop;
                                let color = (exonIndex % 2 === 0) ? colors.odd_exon : colors.even_exon;
                                //console.log(`Exon ${exonIndex + 1}: Start=${start}, Stop=${stop}, Color=${color}`);
                                for (let i = start; i < stop; i++) {
                                    coloredSequence[i] = color;
                                }
                                exonIndex++;
                            }
                        });

                        // 再处理UTR区域
                        response.spliced_data.forEach(row => {
                            if (row.type.endsWith('UTR')) {
                                let start = row.start - 1;
                                let stop = row.stop;
                                //console.log(`UTR: Start=${start}, Stop=${stop}`);
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
                        //console.log (coloredString)
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
                        document.getElementById('sequence_data').innerHTML = formattedString;
                        
                    }
                    //**********************處理unspliced_sequence *************/
                    if (response.unspliced_sequence) {
                        let unspliced_sequence = response.unspliced_sequence;
                        let sequence_length = unspliced_sequence.length;
                        let coloredSequence = Array(sequence_length).fill('transparent');
                    
                        const colors = {
                            odd_exon: "#FFFF00",  // 黄色
                            even_exon: "#FFA500", // 橘色
                            utr: "#D3D3D3"        // 灰色
                        };
                    
                        //console.log("Unspliced Data:", response.unspliced_data);
                    
                        let exonIndex = 0;
                        // 先上色外显子
                        response.unspliced_data.forEach((row) => {
                            if (row.type.startsWith('exon')) {
                                let start = row.start - 1;
                                let stop = row.stop;
                                let color = (exonIndex % 2 === 0) ? colors.odd_exon : colors.even_exon;
                                //console.log(`Exon ${exonIndex + 1}: Start=${start}, Stop=${stop}, Color=${color}`);
                                for (let i = start; i < stop; i++) {
                                    if (i >= 0 && i < sequence_length) { // 确保索引在范围内
                                        coloredSequence[i] = color;
                                    } else {
                                        console.warn(`Index ${i} out of range for sequence length ${sequence_length}`);
                                    }
                                }
                                exonIndex++;
                            }
                        });
                    
                        // 再上色UTR，覆盖掉外显子颜色
                        response.unspliced_data.forEach((row) => {
                            if (row.type.endsWith('UTR')) {
                                let start = row.start - 1;
                                let stop = row.stop;
                                //console.log(`UTR: Start=${start}, Stop=${stop}`);
                                for (let i = start; i < stop; i++) {
                                    if (i >= 0 && i < sequence_length) { // 确保索引在范围内
                                        coloredSequence[i] = colors.utr;
                                    } else {
                                        console.warn(`Index ${i} out of range for sequence length ${sequence_length}`);
                                    }
                                }
                            }
                        });
                            // intron 不需要上色，保持 null
                    
                        //console.log("Colored Sequence Array:", coloredSequence);
                        let coloredSegments = coloredSequence.map((color, index) => {
                            let char = unspliced_sequence[index];
                            return color ? `<span style="background-color: ${color};">${char}</span>` : char;
                        });
                        let coloredString = coloredSegments.join('');
                        //console.log("Colored String:", coloredString);
                    
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
                        //console.log("Formatted String:", formattedString);
                        document.getElementById('unspliced_sequence_data').innerHTML = formattedString;
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

function generateTooltipContent(d) {
    return `<table class='table' id='specific-table'>
                <tr><th>region</th><th>length(bp)</th><th>start</th><th>end</th></tr>
                <tr><td>${d.type}</td><td>${d.stop - d.start}</td><td>${d.start}</td><td>${d.stop}</td></tr>
            </table>`;
}

function updateChart(data) {
    const svg = d3.select("#d3_chart");
    const margin = { top: 20, right: 30, bottom: 40, left: 40 };
    const width = 800 - margin.left - margin.right;
    const height = 200 - margin.top - margin.bottom;

    svg.attr("width", width + margin.left + margin.right)
       .attr("height", height + margin.top + margin.bottom);

    // 清除之前的内容(子元素)
    svg.selectAll("*").remove();

    const g = svg.append("g")
                 .attr("transform", `translate(${margin.left},${margin.top})`);

    // 设置 x 轴比例尺
    const x = d3.scaleLinear()
                .domain([0, d3.max(data, d => d.stop)])
                .range([0, width]);

    const y = d3.scaleBand()
    .domain(['utr', 'cds', 'exon'])
    .range([0, height])
    .padding(0.1);


    // 添加 x 轴
    g.append("g")
     .attr("transform", `translate(0,${height})`)
     .call(d3.axisBottom(x));

    // 定义颜色
    const colors = {
        'utr': '#D3D3D3',  // 黑色
        'cds': '#008000' ,  // 绿色
        'odd_exon': '#FFFF00',
        'even_exon': '#FFA500'
    };
    // 固定条形图的高度
    const barHeight = 20;
    const barSpacing = 5;

   // 绘制 UTR 和 CDS 条形图
    g.selectAll(".bar")
    .data(data.filter(d => d.type && (d.type.toLowerCase().includes('utr') || d.type.toLowerCase() === 'cds')))
    .enter().append("rect")
    .attr("class", "bar")
    .attr("x", d => x(d.start))
    .attr("y", d => y(d.type.toLowerCase().includes('UTR') ? 'UTR' : 'cds'))
    .attr("width", d => x(d.stop) - x(d.start))
    .attr("height", barHeight) // 固定高度
    .attr("fill", d => colors[d.type.toLowerCase().includes('utr') ? 'utr' : 'cds'])
    .attr("data-tippy-content", d => generateTooltipContent(d));
    // 绘制 exon 条形图
    let exonIndex = 0;
    g.selectAll(".exon")
        .data(data.filter(d => d.type && d.type.toLowerCase().includes('exon')))
        .enter().append("rect")
        .attr("class", "bar exon")
        .attr("x", d => x(d.start))
        .attr("y", y('cds') + barHeight + barSpacing)
        .attr("width", d => x(d.stop) - x(d.start))
        .attr("height", barHeight)
        .attr("fill", d => exonIndex++ % 2 === 0 ? colors['odd_exon'] : colors['even_exon'])
        .attr("data-tippy-content", d => generateTooltipContent(d));
    tippy('.bar', {
        allowHTML: true,
        theme: 'light',
        arrow: true
    });
}


