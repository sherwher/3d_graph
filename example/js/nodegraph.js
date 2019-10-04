var graph = {}

function Queue() {

    var queue = [];
    var offset = 0;

    this.getLength = function () {
        return (queue.length - offset);
    }

    this.isEmpty = function () {
        return (queue.length == 0);
    }

    this.enqueue = function (item) {
        queue.push(item);
    }

    this.enqueue_first = function (item) {
        queue.unshift(item);
    }

    this.dequeue = function () {

        if (queue.length == 0) return undefined;

        var item = queue[offset];

        if (++offset * 2 >= queue.length) {
            queue = queue.slice(offset);
            offset = 0;
        }

        return item;

    }

    this.peek = function () {
        return (queue.length > 0 ? queue[offset] : undefined);
    }

}

function Stack() {

    var stack = [];

    this.getLength = function () {
        return stack.length;
    }

    this.isEmpty = function () {
        return (stack.length == 0);
    }

    this.push = function (item) {
        stack.unshift(item);
    }

    this.pop = function () {
        if (stack.length == 0) return undefined;

        var item = stack.shift();

        return item;
    }

}

function nodeGraph() {
    // timer
    main_timer = null;
    // 특정 단위로 진행할 것인가?
    var isStep = false;
    // 특정 단위로 진행시 데이터
    var txs = [];
    // 차트그리기의 시작과 정지를 담당
    var queue = new Queue();
    // 단계별 진행
    var step_queue = new Queue();
    // 되돌리기를 구현하기 위한 스택
    var rewind_stack = new Stack();

    // 큐에서 데이터를 꺼내는 시간
    var duration = 25;
    // 빠르기를 조절할 interval
    var interval = 25;
    // line을 그리는 애니메이션 시간 보통 큐에서 데이터를 꺼내는 시간의 4배
    var lineDuration = duration * 4;
    // Node를 그리는 애니메이션 시간 보통 큐에서 데이터를 꺼내는 시간의 2배
    var nodeDuration = duration * 2;
    // 노드가 처음 생성되는 좌표
    var createNodeX = 200;
    var createNodeY = 200;
    // 링크를 사용 할 것인가?
    var ableLink = false;
    // 스크롤을 사용할 것인가?
    var isScroll = true;
    // 테이블에 현재 상태를 보여주기 위한 변수
    var current_link = null;
    // 실시간 -> Step시 클릭타입
    var step_type = "";
    // 차트 실행이후 전체데이터
    var all_data = new Map();
    // 차트를 그리기 위한 데이터
    var chart_data = {
        nodes: [],
        links: [],
        txs: new Map()
    }
    // step으로 넘어갔다가 다시 돌아올때를 대비하기 위한 백업데이터
    var backup_data = {
        nodes: [],
        links: [],
        txs: new Map()
    }
    // 테이블을 그리기 위한 데이터    
    var table_data = new Map();
    // step으로 넘어갔다가 다시 돌아올때를 대비하기 위한 백업데이터
    var backup_table = new Map();
    // table_data의 전체 데이터를 한 배열로 두기위한 배열
    var table_data_flat = [];

    var table_headers = new Map([
        ['type', { text: "type", asc: false, desc: false }],
        ['txid', { text: "txid", asc: false, desc: false }],
        ['from', { text: "from", asc: false, desc: false }],
        ['to', { text: "to", asc: false, desc: false }]
    ]);

    var sorting = new Map();

    var display = {
        allNode: {
            id: 'allNode',
            value: 0,
            prefix: '노드수 : '
        },
        txlength: {
            id: 'txlength',
            value: 0,
            prefix: '표시 TX수 : '
        },
        to: {
            id: 'to',
            value: '',
            prefix: 'TO : '
        },
        from: {
            id: 'from',
            value: '',
            prefix: 'FROM : '
        },
        tx: {
            id: "tx",
            value: 0,
            prefix: 'TX : '
        },
        selectNode: {
            id: "selectNode",
            value: '',
            prefix: '선택된 노드ID : '
        },
        lastTX: {
            id: "lastTX",
            value: [],
            prefix: '최신TX : '
        }
    }

    var width = d3.select('#node_graph')[0][0].clientWidth - 10,
        height = d3.select('#node_graph')[0][0].clientHeight - 2;

    var svg = d3.select('#node_graph')
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .style("border", "1px solid black");

    var force = d3.layout.force()
        .gravity(0.3)
        .friction(0.5)
        .linkDistance(function (d) { return 80 })
        .size([width, height])
        .charge(-300)

    var twidth = d3.select('#node_table')[0][0].clientWidth,
        theight = d3.select('#node_graph')[0][0].clientHeight + 4

    // table 생성
    var table = d3.select('#node_table')
        .append('table')
        .attr('width', twidth)

    table.append('tr')
        .append('td')
        .append('table')
        .attr('class', 'headerTable')
        .attr('width', twidth - 25)
        .append('tr')
        .selectAll('th')
        .data(Array.from(table_headers.keys()))
        .enter()
        .append('th')
        .attr('id', function (d) {
            return "header_" + table_headers.get(d).text;
        })
        .text(function (d) {
            var value = table_headers.get(d);
            return value.text;
        })
        .on('click', function (d) {
            if (isStep && d != 'type') {
                var value = table_headers.get(d);
                var postfix = "";
                if (!(value.desc && value.asc)) {
                    if (value.desc && !value.asc) {
                        value.asc = false;
                        value.desc = false;
                        postfix = "";
                        sorting.delete(d);
                    } else if (!value.desc && value.asc) {
                        value.asc = false;
                        value.desc = true;
                        postfix = "▼";
                        sorting.set(d);
                    } else {
                        value.asc = true;
                        postfix = "▲";
                        sorting.set(d);
                    }
                }
                d3.select('#header_' + d).text(value.text + postfix);
                var nodeData = Array.from(table_data.values()).flat().sort(function (a, b) { return sorting_data(a, b); });
                graph.input_step_data(nodeData, 50, 50, nodeData[0]);
            }
        });

    var inner = table.append("tr").attr('class', 'table_remove').append("td")
        .append("div").attr("class", "scroll").attr("id", "table_scroll").attr("width", twidth).attr("style", "height:" + (theight - 40) + "px;")
        .append("table").attr("class", "bodyTable").attr("border", 1).attr("width", twidth - 25).attr("height", (theight - 40)).attr("style", "table-layout:fixed");


    var tbody = inner.append("tbody").attr('id', 'tbody');

    var tooltipWidth = 250;
    var tooltipHeight = 170;
    var tooltipY = 10;
    var tooltipMargin = 10;
    var fontSize = 15;
    var fontMargin = 20;

    svg.append("rect")
        .attr("class", "tooltip")
        .attr("padding", "10px")
        .attr("fill", "#000000")
        .attr("x", width - tooltipWidth - tooltipMargin + "px")
        .attr("y", tooltipY + "px")
        .attr("width", tooltipWidth + "px")
        .attr("height", tooltipHeight + "px")
        .attr("rx", "10")
        .attr("ry", "10")
        .attr("fill-opacity", "0.5")

    svg.append("text")
        .attr("id", "allNode")
        .text("표현된 노드수 : ")
        .attr("x", width - tooltipWidth + "px")
        .attr("y", tooltipY + fontMargin + "px")
        .attr("font-family", "sans-serif")
        .attr("font-size", fontSize + "px")
        .attr("fill", "#ffffff")

    svg.append("text")
        .attr("id", "txlength")
        .text("표시 TX수 : ")
        .attr("x", width - tooltipWidth + "px")
        .attr("y", tooltipY + fontMargin * 2 + "px")
        .attr("font-family", "sans-serif")
        .attr("font-size", fontSize + "px")
        .attr("fill", "#ffffff")

    svg.append("rect")
        .attr("x", width - tooltipWidth + "px")
        .attr("y", tooltipY + fontMargin * 3 - (fontMargin / 2))
        .attr("width", tooltipWidth - fontMargin)
        .attr("height", "1px")
        .attr("fill", "#ffffff")

    svg.append("text")
        .attr("id", "from")
        .text("FROM : ")
        .attr("x", width - tooltipWidth + "px")
        .attr("y", tooltipY + fontMargin * 4 - (fontMargin / 2) + "px")
        .attr("font-family", "sans-serif")
        .attr("font-size", fontSize + "px")
        .attr("fill", "#00ff00")
        .attr('fill-opacity', 0.5);

    svg.append("text")
        .attr("id", "to")
        .text("TO : ")
        .attr("x", width - tooltipWidth + "px")
        .attr("y", tooltipY + fontMargin * 5 - (fontMargin / 2) + "px")
        .attr("font-family", "sans-serif")
        .attr("font-size", fontSize + "px")
        .attr("fill", "#0000ff")
        .attr('fill-opacity', 0.5);

    svg.append("text")
        .attr("id", "tx")
        .text("TX : ")
        .attr("x", width - tooltipWidth + "px")
        .attr("y", tooltipY + fontMargin * 6 - (fontMargin / 2) + "px")
        .attr("font-family", "sans-serif")
        .attr("font-size", fontSize + "px")
        .attr("fill", "#ffffff");

    svg.append("rect")
        .attr("x", width - tooltipWidth + "px")
        .attr("y", tooltipY + fontMargin * 6)
        .attr("width", tooltipWidth - fontMargin)
        .attr("height", "1px")
        .attr("fill", "#ffffff");

    svg.append("text")
        .attr("id", "selectNode")
        .text("선택된 노드ID : ")
        .attr("x", width - tooltipWidth + "px")
        .attr("y", tooltipY + fontMargin * 7)
        .attr("font-family", "sans-serif")
        .attr("font-size", fontSize + "px")
        .attr("fill", "#ffffff");

    svg.append("text")
        .attr("id", "lastTX")
        .text("TX List : ")
        .attr("x", width - tooltipWidth + "px")
        .attr("y", tooltipY + fontMargin * 8)
        .attr("font-family", "sans-serif")
        .attr("font-size", fontSize + "px")
        .attr("fill", "#ffffff");

    var node, link;

    force.on('tick', function () {
        node.attr('transform', function (d) { return 'translate(' + d.x + ',' + d.y + ')'; });

        link.attr('x1', function (d) { return d.source.x; })
            .attr('y1', function (d) { return d.source.y; })
            .attr('x2', function (d) { return d.target.x; })
            .attr('y2', function (d) { return d.target.y; });
    });

    // scroll의 위치를 계산
    function scrollTopTween(scrollTop) {
        return function () {
            var i = d3.interpolateNumber(this.scrollTop, scrollTop);
            return function (t) {
                this.scrollTop = i(t);
            };
        };
    }

    // Node background size
    function circleSize(node) {
        if (node.source || node.target) {
            return 15;
        }
        return 10;
    }

    // Node background color
    function circleColor(node) {
        if (node.source && node.target) {
            return "#00ffff";
        } else if (node.source && !node.target) {
            return "#00ff00"
        } else if (!node.source && node.target) {
            return "#0000ff"
        } else {
            return "#ff0000";
        }
    }

    // 현재 그래프에 맞게 custom하게 처리한 부분
    function custom_update() {

        let x = d3.scale.linear().range([-20, 20]),
            y = d3.scale.linear().range([-22, -17]);

        x.domain([0, Array.from(chart_data.txs.keys()).length]);
        y.domain([0, 1]);
        /**
        node가 highlight되는 부분 처리
        */
        for (var i in chart_data.nodes) {

            var n = chart_data.nodes[i];
            // 하일라이트처리
            d3.select("#round" + n.id)
                .transition()
                .duration(nodeDuration)
                .attr("fill", circleColor(n))
                .attr('r', circleSize(n))

            // tx박스 전체 삭제    
            svg.select("#g" + n.id).selectAll('.path-fill').remove();

            // tx박스 설정(area그래프 path로 처리)
            d3.select('#g' + n.id)
                .append("path")
                .attr("class", "path-fill")
                .attr("d", function (d) {
                    var xmap = Array.from(chart_data.txs.keys()).sort();
                    let fill = `M-20,-22`;
                    for (var i = 0; i < xmap.length; i++) {
                        let y0, x0;
                        if (d.txs.has(xmap[i])) {
                            y0 = y(1);
                            x0 = x(i + 1);
                        } else {
                            y0 = y(0);
                            x0 = x(i + 1);
                        }
                        fill += `V${y0}H${x0}`;
                    }
                    fill += `V-22Z`;
                    return fill;
                });

        }

        display.allNode.value = chart_data.nodes.length;
        display.txlength.value = Array.from(chart_data.txs.keys()).length;

        for (var key in display) {
            svg.select('#' + display[key].id).text(display[key].prefix + display[key].value)
        }
    }

    // 데이터 리스트를 sorting처리
    function sorting_data(a, b) {
        var sort = null;
        Array.from(sorting.keys()).forEach((v) => {
            var value = table_headers.get(v);
            if (!value.asc || !value.desc) {
                if (!value.asc && value.desc) {
                    switch (v) {
                        case 'txid':
                            sort = sort === null ? d3.descending(a.tx, b.tx) : sort || d3.descending(a.tx, b.tx);
                            break;
                        case 'from':
                            sort = sort === null ? d3.descending(a.from, b.from) : sort || d3.descending(a.from, b.from);
                            break;
                        case 'to':
                            sort = sort === null ? d3.descending(a.to, b.to) : sort || d3.descending(a.to, b.to);
                            break;
                        default:
                            break;
                    }
                } else if (value.asc && !value.desc) {
                    switch (v) {
                        case 'txid':
                            sort = sort === null ? d3.ascending(a.tx, b.tx) : sort || d3.ascending(a.tx, b.tx);
                            break;
                        case 'from':
                            sort = sort === null ? d3.ascending(a.from, b.from) : sort || d3.ascending(a.from, b.from);
                            break;
                        case 'to':
                            sort = sort === null ? d3.ascending(a.to, b.to) : sort || d3.ascending(a.to, b.to);
                            break;
                        default:
                            break;
                    }
                }
            }
        });
        return sort === null ? a.index > b.index : sort || a.index - b.index;
    }


    // 테이블을 업데이트 침
    function table_update(table_data) {
        if (isStep) {
            tbody.selectAll("tr").remove();
        } else {
            Array.from(table_data.keys()).forEach((v) => {
                if (!chart_data.txs.has(v)) {
                    table_data.delete(v);
                    d3.selectAll('.' + v).remove();
                }
            });
        }

        if (isStep) {
            tbody.selectAll("tr").remove();
            table_data_flat = Array.from(table_data.values())
                .flat()
                .sort((a, b) => {
                    return sorting_data(a, b);
                });
        } else {
            table_data_flat = Array.from(table_data.values())
                .flat()
                .sort((a, b) => {
                    return a.index - b.index;
                });
        }

        var rows = tbody.selectAll("tr")
            .data(table_data_flat)

        var rowsEnter = null;

        if (isStep) {
            rowsEnter = rows.enter()
                .append("tr")
                .attr('class', function (d) {
                    return d.tx + " selected";
                })
                .attr('id', function (d) {
                    return d.tx + "_" + d.index;
                })
                .on("click", function (d) {
                    click_table(step_type, d);
                });

            rowsEnter.append("td").text(function (d) {
                return d.type
            });
            rowsEnter.append("td").text(function (d) {
                return d.tx
            });
            rowsEnter.append("td").text(function (d) {
                return d.from
            });
            rowsEnter.append("td").text(function (d) {
                return d.to
            });
        } else {
            rowsEnter = rows.enter()
                .append("tr")
                .attr('class', function (d) {
                    return d.tx + " nonselected";
                })
                .attr('id', function (d) {
                    return d.tx + "_" + d.index;
                });
            rowsEnter.append("td").text(function (d) {
                return d.type
            });
            rowsEnter.append("td").text(function (d) {
                return d.tx
            }).on("click", function (d) {
                click_table('tx', d);
            });
            rowsEnter.append("td").text(function (d) {
                return d.from
            }).on("click", function (d) {
                click_table('from', d);
            });
            rowsEnter.append("td").text(function (d) {
                return d.to
            }).on("click", function (d) {
                click_table('to', d);
            });
        }

        // // 스크롤을 아래로 내림
        if (isScroll) {
            var scroll_height = d3.select('#table_scroll').property("scrollHeight");
            d3.select("#table_scroll").transition().duration(25).tween("uniquetweenname", scrollTopTween(scroll_height))
        } else {
            if (isStep && current_link != null) {
                // offsetTop
                d3.select('#' + current_link.id).style('background-color', '#cccccc');
                var scroll_height = 40 * current_link.index;
                d3.select("#table_scroll").transition().duration(0).tween("uniquetweenname", scrollTopTween(scroll_height))
            }
        }
    }

    // 변경점이 생겼을경우 차트를 업데이트함.
    function chart_update(data) {
        data.nodes.forEach(function (d, i) {
            d.id = d.name;
            d.index = i;
        });

        link = svg.selectAll("line")
            .data(data.links, function (d) {
                data.nodes.forEach(function (n, i) {
                    if (n.id == d.source) {
                        d.source = n;
                    }
                    if (n.id == d.target) {
                        d.target = n;
                    }
                });
                return d.source.id + "-" + d.target.id;
            });

        link.enter().append("line")
            .style("stroke", "#777")
            .attr("id", function (d) {
                return d.source.id + "-" + d.target.id;
            })
            .style("stroke-width", function (d) {
                return 3;
            })
            .attr("class", "link");

        if (isStep) {
            link
                .exit()
                .remove()
        } else {
            link
                .transition()
                .duration(lineDuration)
                .style("stroke", "#fff")
                .style("stroke-width", 0)
        }

        node = svg.selectAll("g.node")
            .data(data.nodes, function (d) {
                return d.id;
            });

        var nodeEnter = node.enter().append("g")
            .attr("class", "node")
            .attr('title', name)
            .attr('id', function (d) {
                return 'g' + d.id
            })


        nodeEnter.append('svg:circle')
            .attr('id', function (d) {
                return "round" + d.id;
            })
            .attr("class", "nodeStrokeClass")
            .attr('fill-opacity', 0.5)
            .attr('r', 10)
            .attr('fill', "#00ff00");

        nodeEnter.append('svg:circle')
            .attr('id', function (d) {
                return "inner" + d.id;
            })
            .attr('r', 2)
            .attr('stroke', 'black');

        nodeEnter.append("svg:rect")
            .attr("x", -20)
            .attr("y", -22)
            .attr("height", 5)
            .attr("width", 40)
            .attr("fill", "#000000")
            .attr('id', function (d) {
                return "rect_back" + d.id;
            })
            .attr("class", "tx_bar")
            .attr('visibility', 'visible')
            .attr('fill-opacity', 0.5);

        var showTooltip = function (d) {
            display.selectNode.value = d.name;
            var txs = Array.from(d.txs.keys()).reverse();
            display.lastTX.value = txs[0] + " (총갯수 : " + txs.length + ")";
            $('#selectNode').text(display.selectNode.prefix + d.name)
            $('#lastTX').text(display.lastTX.prefix + txs[0] + " (총갯수: " + txs.length + ")");
        }

        var hideTooltip = function (d) {
            display.selectNode.value = '';
            display.lastTX.value = [];
            $('#selectNode').text(display.selectNode.prefix)
            $('#lastTX').text(display.lastTX.prefix)
        }

        nodeEnter.on("mouseover", showTooltip)
            .on("mouseleave", hideTooltip)

        node.exit().remove();

        if (ableLink) {
            d3.selectAll("g.node").call(force.drag);
            force
                .nodes(data.nodes)
                .links(data.links)
                .start();
        } else {
            d3.selectAll("g.node").on('mousedown.drag', null);
            force
                .nodes(data.nodes)
                .links([])
                .start();

            if (isStep) {
                force
                    .nodes([])
                    .links([])
                    .start();
            }
        }

    }

    chart_update(chart_data);
    table_update(table_data);

    function keepNodesOnTop() {
        $(".nodeStrokeClass").each(function (index) {
            var gnode = this.parentNode;
            gnode.parentNode.appendChild(gnode);
        });
        $(".tx_bar").each(function (index) {
            var gnode = this.parentNode;
            gnode.parentNode.appendChild(gnode);
        });
    }


    // 특정 노드를 찾는다.
    function findNode(data, name) {
        for (var j = 0; j < data.nodes.length; j++) {
            if (name == data.nodes[j].name) {
                return data.nodes[j];
            }
        }
        return null;
    }

    // 모든 링크와 각 TX리스트를 삭제
    function removeAllLinkAndTX() {
        chart_data.links = [];
        chart_data.nodes.forEach((v) => {
            v.txs = new Map();
            v.source = false;
            v.target = false;
            v.source_count = 0;
            v.target_count = 0;
        });
        chart_data.txs = new Map();
        chart_update(chart_data);
        custom_update();
        keepNodesOnTop();
    }

    // 노드를 처리(데이터로만 저장 -> 렌더링은 한번에 진행)
    function pushNodeData(node) {
        if (findNode(chart_data, node.name) == null) {
            node.source = false;
            node.source_count = 0;
            node.target = false;
            node.target_count = 0;
            //노드 생성 위치
            node.x = createNodeX;
            node.y = createNodeY;
            node.txs = new Map();
            chart_data.nodes.push(node);
        }
    }

    // 링크를 처리(데이터로만 저장 -> 렌더링은 한번에 진행)
    function pushLinkData(link, init_line) {
        chart_data.txs.set(link.tx, link.tx);
        for (var j = 0; j < chart_data.nodes.length; j++) {
            if (link.source == chart_data.nodes[j].name) {
                chart_data.nodes[j].source = true;
                chart_data.nodes[j].source_count++;
                if (chart_data.nodes[j].txs.has(link.tx)) {
                    var count = chart_data.nodes[j].txs.get(link.tx);
                    chart_data.nodes[j].txs.set(link.tx, count + 1);
                } else {
                    chart_data.nodes[j].txs.set(link.tx, 1);
                }
            }
            if (link.target == chart_data.nodes[j].name) {
                chart_data.nodes[j].target = true;
                chart_data.nodes[j].target_count++;
                if (chart_data.nodes[j].txs.has(link.tx)) {
                    var count = chart_data.nodes[j].txs.get(link.tx);
                    chart_data.nodes[j].txs.set(link.tx, count + 1);
                } else {
                    chart_data.nodes[j].txs.set(link.tx, 1);
                }
            }

        }
        //Link가 연결될때 기존의 라인을 초기화
        if (init_line) {
            d3.select("#" + link.source + "-" + link.target).style("stroke", "#777").style("stroke-width", 3);
        }
        display.to.value = link.target;
        display.from.value = link.source;
        display.tx.value = link.tx;
        chart_data.links.push(link);
    }

    // rewind처리
    function removeLink(link) {
        // 선택된 Node의 Count정리
        var target_node = findNode(chart_data, link.to);
        var source_node = findNode(chart_data, link.from);

        var target_count = target_node.txs.get(link.tx);
        target_node.txs.set(link.tx, target_count - 1);

        var source_count = source_node.txs.get(link.tx);
        source_node.txs.set(link.tx, source_count - 1);
        var is_empty_tx = true;
        for (var j = 0; j < chart_data.nodes.length; j++) {
            if (chart_data.nodes[j].txs.get(link.tx) == 0) {
                chart_data.nodes[j].txs.delete(link.tx);
            }
            if (chart_data.nodes[j].txs.has(link.tx)) {
                is_empty_tx = false;
            }
            if (link.from == chart_data.nodes[j].name) {
                chart_data.nodes[j].source_count--;
                if (chart_data.nodes[j].source_count == 0) {
                    chart_data.nodes[j].source = false;
                }
            }
            if (link.to == chart_data.nodes[j].name) {
                chart_data.nodes[j].target_count--;
                if (chart_data.nodes[j].target_count == 0) {
                    chart_data.nodes[j].target = false;
                }
            }
        }
        if (is_empty_tx) chart_data.txs.delete(link.tx);
        // Link가 연결될때 기존의 라인을 초기화
        if (!target_node.target) {

            d3.select("#" + link.from + "-" + link.to).style("stroke", "#fff").style("stroke-width", 0);
        }
        current_link = link;
        display.to.value = link.to;
        display.from.value = link.from;
        display.tx.value = link.tx;
        var copy_links = $.extend([], chart_data.links);
        chart_data.links = copy_links;
        chart_update(chart_data);
        table_update(table_data);
        custom_update();
        keepNodesOnTop();
    }

    // 단일 노드와 링크를 처리(step) - 테이블 데이터 셋팅후 노드 추가
    function addNodeAndLink(tick, update) {
        pushNodeData({ "name": tick.to });
        pushNodeData({ "name": tick.from });
        pushLinkData({ "source": tick.from, "target": tick.to, "tx": tick.tx, "index": tick.index }, true);
        if (update) {
            current_link = tick;
            table_update(table_data);
            chart_update(chart_data);
            custom_update();
            keepNodesOnTop();
        }
    }

    // 다중 노드와 링크를 처리하기전 모든 링크를 삭제(실시간)
    function multiAddNodeAndLinkRemove(datas, update) {
        for (var j = 0; j < chart_data.nodes.length; j++) {
            chart_data.nodes[j].source = false;
            chart_data.nodes[j].target = false;
        }
        display.to.value = '';
        display.from.value = '';
        display.tx.value = 0;
        chart_data.links = [];

        datas.forEach((tick, i) => {
            if (tick.to == null || tick.from == null) {
                chart_data.txs.delete(tick.tx);
                chart_data.nodes.forEach((v) => {
                    v.txs.delete(tick.tx);
                });
            } else {
                pushNodeData({ "name": tick.to });
                pushNodeData({ "name": tick.from });
                pushLinkData({ "source": tick.from, "target": tick.to, "tx": tick.tx, "index": tick.index }, update);
                tick.id = tick.tx + "_" + tick.index;
                if (table_data.has(tick.tx)) {
                    table_data.get(tick.tx).push(tick);
                } else {
                    table_data.set(tick.tx, [tick]);
                }
            }
        });
        if (update) {
            chart_update(chart_data);
            table_update(table_data);
            custom_update();
            keepNodesOnTop();
        }
    }

    // coulmn 클릭시
    function click_table(type, data) {
        if (isStep) {
            step_queue = new Queue();
            if (type === 'tx') {
                var txData = table_data.get(data.tx);
                graph.input_step_data(txData, 50, 50, data);
            } else if (type === 'from') {
                var nodeData = Array.from(table_data.values()).flat();
                graph.input_step_data(nodeData, 50, 50, data);
            } else if (type === 'to') {
                var nodeData = Array.from(table_data.values()).flat();
                graph.input_step_data(nodeData, 50, 50, data);
            } else {
                var txData = table_data.get(data.tx);
                graph.input_step_data(txData, 50, 50, data);
            }
        } else {
            backup_data = $.extend({}, chart_data);
            backup_table = new Map(table_data);
            step_queue = new Queue();
            step_type = type;
            if (type === 'tx') {
                var txData = table_data.get(data.tx);
                graph.input_step_data(txData, 50, 50);
            } else if (type === 'from') {
                var nodeData = []
                Array.from(all_data.values()).flat().map((v) => {
                    if (data.from === v.from) nodeData.push(v);
                });
                graph.input_step_data(nodeData, 50, 50);
            } else if (type === 'to') {
                var nodeData = []
                Array.from(all_data.values()).flat().map((v) => {
                    if (data.to === v.to) nodeData.push(v);
                });
                graph.input_step_data(nodeData, 50, 50);
            }
        }

    }

    // 스텝 그래프에서 리얼 타임 그래프로 넘어갈때 처리
    function init_real_time() {
        // 테이블 헤더 원위치
        Array.from(table_headers.keys()).forEach((v) => {
            var value = table_headers.get(v);
            value.desc = false;
            value.asc = false;
            d3.select('#header_' + v).text(value.text);
        });
        tbody.selectAll("tr").remove();
        step_type = null;
    }

    // tx단위로 작업. timer를 리턴함
    function work_job_onetick(duration) {
        var timer = setInterval(() => {
            var job = step_queue.dequeue();
            if (job != null) {
                addNodeAndLink(job, true);
                rewind_stack.push(job);
            } else {
                clearInterval(timer);
            }
        }, duration)
        return timer;
    }

    // job단위로 되로 돌림
    function work_job_rewind(duration) {
        var timer = setInterval(() => {
            var job = rewind_stack.pop();
            step_queue.enqueue_first(job);
            if (job != null) {
                removeLink(job);
            } else {
                clearInterval(timer);
                step_queue = new Queue();
            }
        }, duration);
        return timer;
    }


    // 스텝별로 차트를 그림
    this.input_step_data = function (data, duration, interval, spec) {
        duration = duration ? duration : 50;
        interval = interval ? interval : 50;
        isStep = true;
        isScroll = false;
        txs = [];
        table_data = new Map();
        lineDuration = 0;
        nodeDuration = 0;
        step_queue = new Queue();
        rewind_stack = new Stack();
        removeAllLinkAndTX();
        clearInterval(main_timer);
        var i = 0;
        data.flat().forEach((tx) => {
            tx.index = i++;
            tx.id = tx.tx + "_" + tx.index;
            if (table_data.has(tx.tx)) {
                table_data.get(tx.tx).push(tx);
            } else {
                table_data.set(tx.tx, [tx]);
            }
            txs.push(tx);
            if (spec) {
                if (tx.index >= spec.index) {
                    step_queue.enqueue(tx);
                } else {
                    addNodeAndLink(tx, false);
                    rewind_stack.push(tx);
                }
            } else {
                step_queue.enqueue(tx);
            }
        });
        main_timer = work_job_onetick(duration);

        // 특정 row클릭시 하나 실행후 멈춘다.
        if (spec) {
            var job = step_queue.dequeue();
            if (job != null) {
                addNodeAndLink(job, true);
                rewind_stack.push(job);
            }
            clearInterval(main_timer);
        }
    }

    // 실시간으로 들어오는 데이터의 전체 order
    var order = 0;
    // 한번에 표현할 데이터 갯수를 정하기 위한 초당 duration
    var secondPerDuration = duration / 1000;

    // 실시간 차트를 그릴 준비 - queue를 모니터링시작 queue의 데이터가 존재할 경우 그리기 시작
    this.prepare_draw_chart = function () {
        duration = 25;
        interval = 25;
        secondPerDuration = duration / 1000;
        isStep = false;
        main_timer = setInterval(() => {
            if (!queue.isEmpty())
                multiAddNodeAndLinkRemove(queue.dequeue(), true);
        }, duration)
    }

    // order는 전체 order
    // realtime data를 계속 셋팅한다.
    this.input_realtime_data = function (data) {
        // 현재 표현되는 TX의 총 리스트
        // timer를 멈출 경우 table_data에 데이터는 계속 쌓이지만 실제 테이블에 표현은 되지 않음.
        var data_map = new Map();

        data.forEach((v) => {
            v.index = order++;
            if (all_data.has(v.tx)) {
                all_data.get(v.tx).push(v);
            } else {
                all_data.set(v.tx, [v]);
            }

            if (data_map.has(v.tx)) {
                data_map.get(v.tx).push(v);
            } else {
                data_map.set(v.tx, [v]);
            }
        });
        // 한번에 표현할 갯수
        var term = Math.ceil(data.length * secondPerDuration);
        var copyData = $.extend([], Array.from(data_map.values()).flat().sort((a, b) => { return a.index < b.index }));
        var ticks = [];
        while (copyData.length > 0) {
            ticks.push(copyData.splice(0, term));
        }
        ticks.forEach((v, i) => {
            queue.enqueue(v);
        });
    }


    // 되감기
    this.rewind = function () {
        if (isStep) {
            clearInterval(main_timer);
            main_timer = work_job_rewind(duration);
        }
    };

    // step차트에서 실시간차트로 이동
    this.toPrev = function () {
        if (isStep && step_type) {
            init_real_time();
            chart_data = $.extend({}, backup_data);
            table_data = new Map(backup_table);
            step_queue = new Queue();
            duration = 25;
            interval = 25;
            lineDuration = duration * 4;
            nodeDuration = duration * 2;
            isScroll = true;
            isStep = false;
            clearInterval(main_timer);
            while (!queue.isEmpty())
                multiAddNodeAndLinkRemove(queue.dequeue(), false);

            main_timer = setInterval(() => {
                if (!queue.isEmpty())
                    multiAddNodeAndLinkRemove(queue.dequeue(), true);
            }, duration);
        }
    }

    // interval만큼 느리게
    this.toSlow = function () {
        if (isStep) {
            clearInterval(main_timer);
            duration = duration + interval > 60000 ? 60000 : duration + interval;
            // main_timer = work_job_onetick(duration);
        }
    }

    // interval만큼 빠르게
    this.toFast = function () {
        if (isStep) {
            clearInterval(main_timer);
            duration = duration - interval > 25 ? duration - interval : interval;
            // main_timer = work_job_onetick(duration);
        }
    }

    // real시 정지
    this.stop = function () {
        clearInterval(main_timer);
    }

    // real시 큐를 날리고 새로운 데이터로 시작
    this.start = function () {
        if (isStep) {
            if (step_queue.isEmpty()) {
                this.input_step_data(txs, duration, interval);
            } else {
                clearInterval(main_timer);
                main_timer = work_job_onetick(duration);
            }
        } else {
            // 기존 큐의 데이터를 전부 소비하고 새로 시작함.
            clearInterval(main_timer);
            while (!queue.isEmpty())
                multiAddNodeAndLinkRemove(queue.dequeue(), false);

            main_timer = setInterval(() => {
                if (!queue.isEmpty())
                    multiAddNodeAndLinkRemove(queue.dequeue(), true);
            }, duration);
        }
    }

    // 한스텝씩 진행
    this.stepTick = function () {
        if (isStep) {
            clearInterval(main_timer);
            if (step_queue.isEmpty()) {
                this.input_step_data(txs);
                clearInterval(main_timer);
            } else {
                var job = step_queue.dequeue();
                if (job != null) {
                    addNodeAndLink(job, true);
                }
            }
        }
    }

    // 링크 사용안함.
    this.disableLink = () => {
        ableLink = false;
        chart_update(chart_data);
    }
    // 링크 사용함
    this.ableLink = () => {
        ableLink = true;
        chart_update(chart_data);
    }
    // 스크롤 멈춤
    this.stopScroll = () => {
        isScroll = false;
    }
    // 스크롤 자동으로 아래로 내림
    this.startScroll = () => {
        isScroll = true;
    }

    function randomRange(n1, n2) {
        return Math.floor((Math.random() * (n2 - n1 + 1)) + n1);
    }
}


this.graph = new nodeGraph();