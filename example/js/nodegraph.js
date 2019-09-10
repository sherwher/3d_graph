var graph = {}



function nodeGraph() {
    var ableLink = true;

    var store_data = {
        nodes: [],
        links: [],
        minTx: null,
        maxTx: null,
    }

    var display = {
        allNode: {
            id: 'allNode',
            value: 0,
            prefix: '노드수 : '
        },
        maxTx: {
            id: 'maxTx',
            value: 0,
            prefix: '최대 TX : '
        },
        minTx: {
            id: 'minTx',
            value: 0,
            prefix: '최소 TX : '
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


    // 특정 노드를 찾는다.
    function findNode(data, name) {
        for (var j = 0; j < data.nodes.length; j++) {
            if (name == data.nodes[j].name) {
                return data.nodes[j];
            }
        }
        return null;
    }
    // 노드를 더한다
    function addNode(node) {
        if (findNode(store_data, node.name) == null) {
            node.source = false;
            node.target = false;
            //노드 생성 위치
            node.x = 200;
            node.y = 200;
            node.txs = new Map();
            store_data.nodes.push(node);
            update(store_data);
            keepNodesOnTop();
        }

    }



    // 링크를 더한다.
    function addLink(link) {
        if (store_data.minTx == null || store_data.maxTx == null) {
            store_data.minTx = link.tx;
            store_data.maxTx = link.tx;
        } else {
            if (store_data.minTx >= link.tx) {
                store_data.minTx = link.tx;
            }

            if (store_data.maxTx < link.tx) {
                store_data.maxTx = link.tx;
            }
        }

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
        display.to.value = link.target;
        display.from.value = link.source;
        display.tx.value = link.tx;
        store_data.links.push(link);
        update(store_data);
        customUpdate();
        keepNodesOnTop();
    }

    // 링크를 더하되 기존 링크는 삭제한다.
    function addOnlyOneLink(link) {
        store_data.links = [];
        if (store_data.minTx == null || store_data.maxTx == null) {
            store_data.minTx = link.tx;
            store_data.maxTx = link.tx;
        } else {
            if (store_data.minTx >= link.tx) {
                store_data.minTx = link.tx;
            }

            if (store_data.maxTx < link.tx) {
                store_data.maxTx = link.tx;
            }
        }
        for (var j = 0; j < store_data.nodes.length; j++) {
            if (link.source == store_data.nodes[j].name) {
                store_data.nodes[j].source = true;
                store_data.nodes[j].txs.set(link.tx, link.tx);
            } else {
                store_data.nodes[j].source = false;
            }
            if (link.target == store_data.nodes[j].name) {
                store_data.nodes[j].target = true;
                store_data.nodes[j].txs.set(link.tx, link.tx);
            } else {
                store_data.nodes[j].target = false;
            }
        }
        display.to.value = link.target;
        display.from.value = link.source;
        display.tx.value = link.tx;
        store_data.links.push(link);
        update(store_data);
        customUpdate();
        keepNodesOnTop();
    }
    // 모든 노드를 삭제한다.
    function removeAllNode() {
        store_data.links = [];
        store_data.nodes = [];
        store_data.minTx = null
        store_data.maxTx = null
        update(store_data);
        keepNodesOnTop();
    }
    // 모든 링크를 삭제한다.
    function removeAllLink() {
        for (var j = 0; j < store_data.nodes.length; j++) {
            store_data.nodes[j].source = false;
            store_data.nodes[j].target = false;
        }
        display.to.value = '';
        display.from.value = '';
        display.tx.value = 0;
        store_data.links = [];
        update(store_data);
        keepNodesOnTop();
    }

    function pushNodeData(node) {
        if (findNode(store_data, node.name) == null) {
            node.source = false;
            node.target = false;
            //노드 생성 위치
            node.x = 200;
            node.y = 200;
            node.txs = new Map();
            store_data.nodes.push(node);
        }
    }

    function pushLinkData(link) {
        if (store_data.minTx == null || store_data.maxTx == null) {
            store_data.minTx = link.tx;
            store_data.maxTx = link.tx;
        } else {
            if (store_data.minTx >= link.tx) {
                store_data.minTx = link.tx;
            }

            if (store_data.maxTx < link.tx) {
                store_data.maxTx = link.tx;
            }
        }

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
        display.to.value = link.target;
        display.from.value = link.source;
        display.tx.value = link.tx;
        store_data.links.push(link);
    }

    function multiAddNodeAndLink(datas) {
        datas.forEach((tick) => {
            pushNodeData({ "name": tick.to });
            pushNodeData({ "name": tick.from });
            pushLinkData({ "source": tick.from, "target": tick.to, "tx": tick.tx });
        });
        update(store_data);
        customUpdate();
        keepNodesOnTop();
    }

    // 현재 그래프에 맞게 custom하게 처리한 부분
    function customUpdate() {
        /**
        node가 highlight되는 부분 처리
        */
        for (var i in store_data.nodes) {

            var n = store_data.nodes[i];

            // 하일라이트처리
            $("#round" + n.id)
                .attr("fill", circleColor(n))
                .attr('r', circleSize(n))

            var txs = Array.from(n.txs.keys());
            // tx_dot이 계속 겹쳐 보일 수 있으니 전체 삭제
            svg.select("#g" + n.id).selectAll('.tx_dot').remove();
            var boxs = store_data.maxTx - store_data.minTx + 1;
            var boxWidth = 40 * (1 / boxs);

            // boxWidth가 너무 작으면 눈에 보이지 않게 되므로 최소 1px아래로는 떨어지지 않게한다
            var virtualBoxWidth = boxWidth < 1 ? 1 : boxWidth;
            for (var j = 0; j < txs.length; j++) {
                svg.select("#g" + n.id)
                    .append('rect')
                    .attr('class', 'tx_dot')
                    .attr("y", -22)
                    .attr("x", -20 + boxWidth * (txs[j] - store_data.minTx))
                    .style("width", virtualBoxWidth)
            }
        }
        display.allNode.value = store_data.nodes.length;
        display.minTx.value = store_data.minTx != null ? store_data.minTx : 0;
        display.maxTx.value = store_data.maxTx != null ? store_data.maxTx : 0;

        for (var key in display) {
            svg.select('#' + display[key].id).text(display[key].prefix + display[key].value)
        }
    }

    var width = d3.select('#graph')[0][0].clientWidth - 20,
        height = d3.select('#graph')[0][0].clientHeight - 20;

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

    var tooltipWidth = 220;
    var tooltipHeight = 190;
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
        .attr("id", "maxTx")
        .text("최대 TX : ")
        .attr("x", width - tooltipWidth + "px")
        .attr("y", tooltipY + fontMargin * 2 + "px")
        .attr("font-family", "sans-serif")
        .attr("font-size", fontSize + "px")
        .attr("fill", "#ffffff")

    svg.append("text")
        .attr("id", "minTx")
        .text("최소 TX : ")
        .attr("x", width - tooltipWidth + "px")
        .attr("y", tooltipY + fontMargin * 3 + "px")
        .attr("font-family", "sans-serif")
        .attr("font-size", fontSize + "px")
        .attr("fill", "#ffffff")

    svg.append("rect")
        .attr("x", width - tooltipWidth + "px")
        .attr("y", tooltipY + fontMargin * 4 - (fontMargin / 2))
        .attr("width", tooltipWidth - fontMargin)
        .attr("height", "1px")
        .attr("fill", "#ffffff")

    svg.append("text")
        .attr("id", "from")
        .text("FROM : ")
        .attr("x", width - tooltipWidth + "px")
        .attr("y", tooltipY + fontMargin * 5 - (fontMargin / 2) + "px")
        .attr("font-family", "sans-serif")
        .attr("font-size", fontSize + "px")
        .attr("fill", "#00ff00")
        .attr('fill-opacity', 0.5);

    svg.append("text")
        .attr("id", "to")
        .text("TO : ")
        .attr("x", width - tooltipWidth + "px")
        .attr("y", tooltipY + fontMargin * 6 - (fontMargin / 2) + "px")
        .attr("font-family", "sans-serif")
        .attr("font-size", fontSize + "px")
        .attr("fill", "#0000ff")
        .attr('fill-opacity', 0.5);

    svg.append("text")
        .attr("id", "tx")
        .text("TX : ")
        .attr("x", width - tooltipWidth + "px")
        .attr("y", tooltipY + fontMargin * 7 - (fontMargin / 2) + "px")
        .attr("font-family", "sans-serif")
        .attr("font-size", fontSize + "px")
        .attr("fill", "#ffffff");

    svg.append("rect")
        .attr("x", width - tooltipWidth + "px")
        .attr("y", tooltipY + fontMargin * 7)
        .attr("width", tooltipWidth - fontMargin)
        .attr("height", "1px")
        .attr("fill", "#ffffff");

    svg.append("text")
        .attr("id", "selectNode")
        .text("선택된 노드ID : ")
        .attr("x", width - tooltipWidth + "px")
        .attr("y", tooltipY + fontMargin * 8)
        .attr("font-family", "sans-serif")
        .attr("font-size", fontSize + "px")
        .attr("fill", "#ffffff");

    svg.append("text")
        .attr("id", "lastTX")
        .text("TX List : ")
        .attr("x", width - tooltipWidth + "px")
        .attr("y", tooltipY + fontMargin * 9)
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



    function update(data) {
        data.nodes.forEach(function (d, i) {
            d.id = d.name;
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
            .attr("id", function (d) {
                return d.source.id + "-" + d.target.id;
            })
            .style("stroke-width", function (d) {
                return 3;
            })
            .attr("class", "link");

        link.exit().remove();

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

        // force
        //     .nodes(data.nodes)
        //     .links(data.links)
        //     .start();

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

    update(store_data);

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

    // job하나를 실행. 2개Node생성 1개Link생성
    function cycles_per_tick(tic) {
        var shape = {
            from: 0,
            to: 0,
            tx: 0
        };

        tick = $.extend({}, shape, tick);
        addNode({ "name": tick.from });
        addNode({ "name": tick.to });
        addOnlyOneLink({ "source": tick.from, "target": tick.to, "tx": tick.tx })
    }
    // tick단위로 작업. timer를 리턴함.
    function work_job_tick(duration) {
        var timer = setInterval(() => {
            var job = queue.dequeue();
            if (job != null) {
                cycles_per_tick(job);
            } else {
                clearInterval(this.timer);
            }
        }, duration)
        return timer;
    }
    // tic단위로 작업을 한후에 tx단위로 또 작업을 진행해야함.
    function cycles_per_tx(tick) {
        var shape = {
            from: 0,
            to: 0,
            tx: 0
        };
        tick = $.extend({}, shape, tick);
        setTimeout(addNode({ "name": tick.from }), 10);
        setTimeout(addNode({ "name": tick.to }), 10);
        setTimeout(addLink({ "source": tick.from, "target": tick.to, "tx": tick.tx }), 20);
    }

    function work_job_tx(duration) {
        var timer = setInterval(() => {
            var job = queue.dequeue();
            if (job != null) {
                if (typeof job === 'object') {
                    multiAddNodeAndLink([job]);
                    // cycles_per_tx(job);
                } else {
                    removeAllLink()
                }
            } else {
                clearInterval(timer);
            }
        }, duration)
        return timer;
    }

    this.duration = 50;

    this.timer = null;
    var queue = new Queue();
    this.ticks = [];
    this.txs = [];
    this.isTX = false;

    this.expression_per_tx = function (data) {
        this.isTX = true;
        this.txs = data;
        queue = new Queue();
        removeAllNode();
        clearInterval(this.timer);
        var test = []
        this.txs.forEach((tx) => {
            queue.enqueue("end TX");
            tx.forEach((v) => {
                queue.enqueue(v);
                test.push(v);
            });
        });
        // this.timer = work_job_tx(this.duration);
        multiAddNodeAndLink(test);
    }

    // tick당 표현
    this.expression_per_tick = function (data) {
        this.isTX = false;
        this.ticks = data;
        queue = new Queue();
        removeAllNode();
        clearInterval(this.timer);

        this.tics.forEach((v) => {
            queue.enqueue(v);
        });

        this.timer = work_job_tick(this.duration);
    }

    this.toSlow = function () {
        clearInterval(this.timer);
        this.duration = this.duration + 50 > 60000 ? 60000 : this.duration + 50;
        if (this.isTX) {
            this.timer = work_job_tx(this.duration);
        } else {
            this.timer = work_job_tick(this.duration);
        }
    }

    this.toFast = function () {
        clearInterval(this.timer);
        this.duration = this.duration - 50 > 0 ? this.duration - 50 : 50;
        if (this.isTX) {
            this.timer = work_job_tx(this.duration);
        } else {
            this.timer = work_job_tick(this.duration);
        }
    }

    this.stop = function () {
        clearInterval(this.timer);
    }

    this.start = function () {
        if (this.isTX) {
            if (queue.isEmpty()) {
                this.expression_per_tx(this.txs);
            } else {
                clearInterval(this.timer);
                this.timer = work_job_tx(this.duration);
            }
        } else {
            if (queue.isEmpty()) {
                this.expression_per_tick(this.data)
            } else {
                clearInterval(this.timer);
                this.timer = work_job_tick(this.duration);
            }
        }
    }

    this.stepTick = function () {
        clearInterval(this.timer);
        if (this.isTX) {
            var job = queue.dequeue();
            if (job != null) {
                if (typeof job === 'object') {
                    this.timer = cycles_per_tx(job);
                } else {
                    removeAllLink()
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
        update(store_data);
    }
}


this.graph = new nodeGraph();