var graph = {}



function nodeGraph() {


    // timer
    this.timer = null;

    // 특정 단위로 진행할 것인가?
    var isStep = false;
    // 특정 단위로 진행시 데이터
    var txs = [];
    // 차트그리기의 시작과 정지를 담당
    var queue = new Queue();

    var step_queue = new Queue();

    // 큐에서 데이터를 꺼내는 시간
    this.duration = 25;
    // 빠르기를 조절할 interval
    this.interval = 25;
    // line을 그리는 애니메이션 시간 보통 큐에서 데이터를 꺼내는 시간의 4배
    var lineDuration = this.duration * 4;
    // Node를 그리는 애니메이션 시간 보통 큐에서 데이터를 꺼내는 시간의 2배
    var nodeDuration = this.duration * 2;
    // 노드가 처음 생성되는 좌표
    var createNodeX = 200;
    var createNodeY = 200;
    // 링크를 사용 할 것인가?
    var ableLink = false;

    var isScroll = true;
    var current_link = null;
    var scroll_timer = null;

    var step_type = "";

    var all_data = new Map();

    var store_data = {
        nodes: [],
        links: [],
        txs: new Map()
    }

    var backup_data = {
        nodes: [],
        links: [],
        txs: new Map()
    }
    var backup_table = new Map()

    var table_data = new Map()
    var table_data_flat = [];
    var deleted_txs = new Map()

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

    // 현재 그래프에 맞게 custom하게 처리한 부분
    function customUpdate() {

        let x = d3.scale.linear().range([-20, 20]),
            y = d3.scale.linear().range([-22, -17]);

        x.domain([0, Array.from(store_data.txs.keys()).length]);
        y.domain([0, 1]);
        /**
        node가 highlight되는 부분 처리
        */
        for (var i in store_data.nodes) {

            var n = store_data.nodes[i];
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
                    var xmap = Array.from(store_data.txs.keys()).sort();
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

        display.allNode.value = store_data.nodes.length;
        display.txlength.value = Array.from(store_data.txs.keys()).length;

        for (var key in display) {
            svg.select('#' + display[key].id).text(display[key].prefix + display[key].value)
        }
    }

    var width = d3.select('#graph')[0][0].clientWidth - 10,
        height = d3.select('#graph')[0][0].clientHeight - 2;

    var svg = d3.select('#graph')
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

    var twidth = d3.select('#table')[0][0].clientWidth,
        theight = d3.select('#graph')[0][0].clientHeight + 4

    // table 생성
    var table = d3.select('#table')
        .append('table')
        .attr('width', twidth)

    var headers = new Map([
        ['type', { text: "type", asc: false, desc: false }],
        ['txid', { text: "txid", asc: false, desc: false }],
        ['from', { text: "from", asc: false, desc: false }],
        ['to', { text: "to", asc: false, desc: false }]
    ]);
    var sorting = new Map();

    table.append('tr')
        .append('td')
        .append('table')
        .attr('class', 'headerTable')
        .attr('width', twidth - 25)
        .append('tr')
        .selectAll('th')
        .data(Array.from(headers.keys()))
        .enter()
        .append('th')
        .attr('id', function (d) {
            return "header_" + headers.get(d).text;
        })
        .text(function (d) {
            var value = headers.get(d);
            return value.text;
        })
        .on('click', function (d) {
            if (isStep && d != 'type') {
                var value = headers.get(d);
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

    function circleSize(d) {
        if (d.source || d.target) {
            return 15;
        }
        return 10;
    }

    function circleColor(d) {
        if (d.source && d.target) {
            return "#00ffff";
        } else if (d.source && !d.target) {
            return "#00ff00"
        } else if (!d.source && d.target) {
            return "#0000ff"
        } else {
            return "#ff0000";
        }
    }

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
        node.attr('transform', function (d) { return 'translate(' + d.x + ',' + d.y + ')'; })

        link.attr('x1', function (d) { return d.source.x; })
            .attr('y1', function (d) { return d.source.y; })
            .attr('x2', function (d) { return d.target.x; })
            .attr('y2', function (d) { return d.target.y; });
    });

    function scrollTopTween(scrollTop) {
        return function () {
            var i = d3.interpolateNumber(this.scrollTop, scrollTop);
            return function (t) {
                this.scrollTop = i(t);
            };
        };
    }

    function sorting_data(a, b) {
        var sort = null;
        Array.from(sorting.keys()).forEach((v) => {
            var value = headers.get(v);
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
                if (!store_data.txs.has(v)) {
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
                    click_column(step_type, d);
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
                click_column('tx', d);
            });
            rowsEnter.append("td").text(function (d) {
                return d.from
            }).on("click", function (d) {
                click_column('from', d);
            });
            rowsEnter.append("td").text(function (d) {
                return d.to
            }).on("click", function (d) {
                click_column('to', d);
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
        }

    }
    chart_update(store_data);
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

    // 모든 노드를 삭제한다.
    function removeAllNode() {
        store_data.links = [];
        store_data.nodes = [];
        chart_update(store_data);
        keepNodesOnTop();
    }

    function removeAllLinkAndTX() {
        store_data.links = [];
        store_data.nodes.forEach((v) => {
            v.txs = new Map();
            v.source = false;
            v.target = false;
        });
        store_data.txs = new Map();
        chart_update(store_data);
        customUpdate();
        keepNodesOnTop();
    }

    // 모든 링크를 삭제한다.
    function removeAllLink() {
        datas.forEach((tick) => {
            if (tick.to == null || tick.from == null) {
                store_data.txs.delete(tick.tx);
            } else {
                pushNodeData({ "name": tick.to });
                pushNodeData({ "name": tick.from });
                pushLinkData({ "source": tick.from, "target": tick.to, "tx": tick.tx, "index": tick.index }, true);
            }
        });
        chart_update(store_data);
        keepNodesOnTop();
    }

    // 노드를 처리(데이터로만 저장 -> 렌더링은 한번에 진행)
    function pushNodeData(node) {
        if (findNode(store_data, node.name) == null) {
            node.source = false;
            node.target = false;
            //노드 생성 위치
            node.x = createNodeX;
            node.y = createNodeY;
            node.txs = new Map();
            store_data.nodes.push(node);
        }
    }

    // 링크를 처리(데이터로만 저장 -> 렌더링은 한번에 진행)
    function pushLinkData(link, init_line) {
        store_data.txs.set(link.tx, link.tx);
        for (var j = 0; j < store_data.nodes.length; j++) {
            if (link.source == store_data.nodes[j].name) {
                store_data.nodes[j].source = true;
                store_data.nodes[j].txs.set(link.tx, link.tx);
            }
            if (link.target == store_data.nodes[j].name) {
                store_data.nodes[j].target = true;
                store_data.nodes[j].txs.set(link.tx, link.tx);
            }

        }
        //Link가 연결될때 기존의 라인을 초기화
        if (init_line) {
            d3.select("#" + link.source + "-" + link.target).style("stroke", "#777").style("stroke-width", 3);
        }
        display.to.value = link.target;
        display.from.value = link.source;
        display.tx.value = link.tx;
        store_data.links.push(link);
    }

    // 단일 노드와 링크를 처리(step) - 테이블 데이터 셋팅후 노드 추가
    function addNodeAndLink(tick, update) {
        pushNodeData({ "name": tick.to });
        pushNodeData({ "name": tick.from });
        pushLinkData({ "source": tick.from, "target": tick.to, "tx": tick.tx, "index": tick.index }, true);
        if (update) {
            current_link = tick;
            table_update(table_data);
            chart_update(store_data);
            customUpdate();
            keepNodesOnTop();
        }

    }

    // 다중 노드와 링크를 처리하기전 모든 링크를 삭제(실시간)
    function multiAddNodeAndLinkRemove(datas, update) {
        for (var j = 0; j < store_data.nodes.length; j++) {
            store_data.nodes[j].source = false;
            store_data.nodes[j].target = false;
        }
        display.to.value = '';
        display.from.value = '';
        display.tx.value = 0;
        store_data.links = [];

        datas.forEach((tick, i) => {
            if (tick.to == null || tick.from == null) {
                store_data.txs.delete(tick.tx);
                store_data.nodes.forEach((v) => {
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
            chart_update(store_data);
            table_update(table_data);
            customUpdate();
            keepNodesOnTop();
        }
    }



    // tx단위로 작업. timer를 리턴함
    function work_job_onetick(duration) {
        var timer = setInterval(() => {
            var job = step_queue.dequeue();
            if (job != null) {
                addNodeAndLink(job, true);
            } else {
                clearInterval(timer);
            }
        }, duration)
        return timer;
    }

    // 한번에 데이터를 받아서 tick단위로 나눈후 실행
    this.expression_onetick = function (data, duration, interval) {
        this.duration = duration ? duration : 50;
        this.interval = interval ? interval : 50;
        isStep = true;
        txs = data;
        lineDuration = 0;
        nodeDuration = 0;
        step_queue = new Queue();
        removeAllLinkAndTX();
        clearInterval(this.timer);
        var i = 0;
        txs.forEach((tx) => {
            tx.index = i++;
            step_queue.enqueue(tx);
        });
        this.timer = work_job_onetick(this.duration);
    }

    this.input_step_data = function (data, duration, interval, spec) {
        this.duration = duration ? duration : 50;
        this.interval = interval ? interval : 50;
        isStep = true;
        isScroll = false;
        txs = [];
        table_data = new Map();
        lineDuration = 0;
        nodeDuration = 0;
        step_queue = new Queue();
        removeAllLinkAndTX();
        clearInterval(this.timer);
        var i = 0;
        data.forEach((tx) => {
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
                }
            } else {
                step_queue.enqueue(tx);
            }
        });
        this.timer = work_job_onetick(this.duration);
        if (spec) {
            var job = step_queue.dequeue();
            if (job != null) {
                addNodeAndLink(job, true);
            }
            clearInterval(this.timer);
        }
    }

    var order = 0;
    var secondPerDuration = this.duration / 1500;

    this.prepare_draw_chart = function (duration, interval, forwordingSecond) {
        secondPerDuration = forwordingSecond ? this.duration / forwordingSecond : this.duration / 1500;
        this.duration = duration;
        this.interval = interval;
        isStep = false;
        this.timer = setInterval(() => {
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

    // coulmn 클릭시
    function click_column(type, data) {
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
            }
        } else {
            backup_data = $.extend({}, store_data);
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

    function init_real_time() {
        // 테이블 헤더 원위치
        Array.from(headers.keys()).forEach((v) => {
            var value = headers.get(v);
            value.desc = false;
            value.asc = false;
            d3.select('#header_' + v).text(value.text);
        })
    }

    this.toPrev = function () {
        if (isStep) {
            init_real_time();
            store_data = $.extend({}, backup_data);
            table_data = new Map(backup_table);
            step_queue = new Queue();
            lineDuration = this.duration * 4;
            nodeDuration = this.duration * 2;
            isScroll = true;
            isStep = false;
            clearInterval(this.timer);
            while (!queue.isEmpty())
                multiAddNodeAndLinkRemove(queue.dequeue(), false);

            this.timer = setInterval(() => {
                if (!queue.isEmpty())
                    multiAddNodeAndLinkRemove(queue.dequeue(), true);
            }, duration);
        }
    }

    this.toSlow = function () {
        if (isStep) {
            clearInterval(this.timer);
            this.duration = this.duration + this.interval > 60000 ? 60000 : this.duration + this.interval;
            this.timer = work_job_onetick(this.duration);
        } else {

        }
    }

    this.toFast = function () {
        if (isStep) {
            clearInterval(this.timer);
            this.duration = this.duration - this.interval > 0 ? this.duration - this.interval : this.interval;
            this.timer = work_job_onetick(this.duration);
        } else {

        }
    }

    // real시 정지
    this.stop = function () {
        clearInterval(this.timer);
    }

    // real시 큐를 날리고 새로운 데이터로 시작
    this.start = function () {
        if (isStep) {
            if (step_queue.isEmpty()) {
                this.input_step_data(txs);
            } else {
                clearInterval(this.timer);
                this.timer = work_job_onetick(this.duration);
            }
        } else {
            // 기존 큐의 데이터를 전부 소비하고 새로 시작함.
            clearInterval(this.timer);
            while (!queue.isEmpty())
                multiAddNodeAndLinkRemove(queue.dequeue(), false);

            this.timer = setInterval(() => {
                if (!queue.isEmpty())
                    multiAddNodeAndLinkRemove(queue.dequeue(), true);
            }, duration);
        }
    }

    this.stepTick = function () {
        clearInterval(this.timer);
        if (isStep) {
            if (step_queue.isEmpty()) {
                this.input_step_data(txs);
                clearInterval(this.timer);
            } else {
                var job = step_queue.dequeue();
                if (job != null) {
                    addNodeAndLink(job, true);
                }
            }
        } else {
            var job = queue.dequeue();
            if (job != null) {
                this.timer = cycles_per_tick(job);
            }
        }
    }

    this.setAbleLink = (isable) => {
        ableLink = isable;
        chart_update(store_data);
    }

    this.stopScroll = () => {
        isScroll = false;
    }

    this.startScroll = () => {
        isScroll = true;
    }
}


this.graph = new nodeGraph();