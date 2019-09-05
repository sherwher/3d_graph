var graph = {}



function nodeGraph() {
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

    // this.setGraphData = function (data) {
    //     for (var j = 0; j < data.nodes.length; j++) {
    //         data.nodes[j].source = false;
    //         data.nodes[j].target = false;
    //         data.nodes[j].txs = new Map();
    //     }
    //     data.links.forEach((v, i) => {
    //         // 노드에 대한 tx값의 min, max처리
    //         if (data.minTx == null || data.maxTx == null) {
    //             data.minTx = v.tx;
    //             data.maxTx = v.tx;
    //         } else {
    //             if (data.minTx >= v.tx) {
    //                 data.minTx = v.tx;
    //             }

    //             if (data.maxTx < v.tx) {
    //                 data.maxTx = v.tx;
    //             }
    //         }
    //         // 노드에 대한 tx 및 highlight처리
    //         for (var j = 0; j < data.nodes.length; j++) {
    //             if (v.source == data.nodes[j].name || v.target == data.nodes[j].name) {
    //                 data.nodes[j].txs.set(v.tx, v.tx);
    //             }
    //             if (v.source == data.nodes[j].name) {
    //                 data.nodes[j].source = true;
    //             }
    //             if (v.target == data.nodes[j].name) {
    //                 data.nodes[j].target = true;
    //             }
    //             console.log(data.nodes[j])
    //         }

    //     });
    //     this.data = $.extend({}, this.data, data);
    //     update(this.data);
    //     keepNodesOnTop();
    // }

    function findNode(data, name) {
        for (var j = 0; j < data.nodes.length; j++) {
            if (name == data.nodes[j].name) {
                return data.nodes[j];
            }
        }
        return null;
    }

    function addNode(node) {
        if (findNode(store_data, node.name) == null) {
            node.source = false;
            node.target = false;
            node.x = 100;
            node.y = 100;
            node.txs = new Map();
            store_data.nodes.push(node);
            update(store_data);
            keepNodesOnTop();
        }
    }

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
        keepNodesOnTop();
    }
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
        keepNodesOnTop();
    }

    function removeAllNode() {
        store_data.links = [];
        store_data.nodes = [];
        store_data.minTx = null
        store_data.maxTx = null
        update(store_data);
        keepNodesOnTop();
    }

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

    var width = d3.select('#graph')[0][0].clientWidth - 20,
        height = d3.select('#graph')[0][0].clientHeight - 20;
    var charge = 0.317 * width;
    var distance = 0.211 * height;
    var svg = d3.select('#graph')
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .style("border", "1px solid black");

    var voronoi = d3.geom.voronoi()
        .x(function (d) { return d.x; })
        .y(function (d) { return d.y; })
        .clipExtent([[-10, -10], [width + 10, height + 10]]);

    function recenterVoronoi(nodes) {
        var shapes = [];
        voronoi(nodes).forEach(function (d) {
            if (!d.length) return;
            var n = [];
            d.forEach(function (c) {
                n.push([c[0] - d.point.x, c[1] - d.point.y]);
            });
            n.point = d.point;
            shapes.push(n);
        });
        return shapes;
    }

    var force = d3.layout.force()
        .charge(-1 * charge)
        // .charge(-500)
        .friction(0.2)
        .linkDistance(30)
        .size([width, height]);

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

    function update(data) {
        data.nodes.forEach(function (d, i) {
            d.id = d.name;
        });

        var link = svg.selectAll("line")
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

        link.exit()
            .transition()
            .duration(300)
            .style("stroke-width", function (d) {
                return 0;
            })
            .remove();

        var node = svg.selectAll("g.node")
            .data(data.nodes, function (d) {
                return d.id;
            });

        var nodeEnter = node.enter().append("g")
            .attr("class", "node")
            .attr('title', name)
            .attr('id', function (d) {
                return 'g' + d.id
            })
            .call(force.drag);

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
            display.lastTX.value = Array.from(d.txs.keys()).reverse()[0];
            $('#selectNode').text(display.selectNode.prefix + d.name)
            $('#lastTX').text(display.lastTX.prefix + Array.from(d.txs.keys()).reverse()[0])
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

        force.on('tick', function () {

            node.attr('transform', function (d) { return 'translate(' + d.x + ',' + d.y + ')'; })
                .attr('clip-path', function (d) { return 'url(#clip-' + d.index + ')'; });

            link.attr('x1', function (d) { return d.source.x; })
                .attr('y1', function (d) { return d.source.y; })
                .attr('x2', function (d) { return d.target.x; })
                .attr('y2', function (d) { return d.target.y; });

            var clip = svg.selectAll('.clip')
                .data(recenterVoronoi(node.data()), function (d) { return d.point.index; });

            clip.enter().append('clipPath')
                .attr('id', function (d) { return 'clip-' + d.point.index; })
                .attr('class', 'clip');
            clip.exit().remove()

            clip.selectAll('path').remove();
            clip.append('path')
                .attr('d', function (d) { return 'M' + d.join(',') + 'Z'; });
        });
        /**
        node가 highlight되는 부분 처리
        */
        for (var i in data.nodes) {
            var n = data.nodes[i];
            // 하일라이트처리
            $("#round" + n.id)
                .attr("fill", circleColor(n))
                .attr('r', circleSize(n))

            var txs = Array.from(n.txs.keys());

            // tx_dot이 계속 겹쳐 보일 수 있으니 전체 삭제
            svg.select("#g" + n.id).selectAll('.tx_dot').remove();
            var boxs = data.maxTx - data.minTx + 1;
            var boxWidth = 40 * (1 / boxs);

            // boxWidth가 너무 작으면 눈에 보이지 않게 되므로 최소 1px아래로는 떨어지지 않게한다
            var virtualBoxWidth = boxWidth < 1 ? 1 : boxWidth;
            for (var j = 0; j < txs.length; j++) {
                svg.select("#g" + n.id)
                    .append('rect')
                    .attr('class', 'tx_dot')
                    .attr("y", -22)
                    .attr("x", -20 + boxWidth * (txs[j] - data.minTx))
                    .style("width", virtualBoxWidth)
            }
        }
        display.allNode.value = data.nodes.length;
        display.minTx.value = data.minTx != null ? data.minTx : 0;
        display.maxTx.value = data.maxTx != null ? data.maxTx : 0;

        for (var key in display) {
            svg.select('#' + display[key].id).text(display[key].prefix + display[key].value)
        }

        force
            .nodes(data.nodes)
            .links(data.links)
            .start();

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

        tic = $.extend({}, shape, tic);
        addNode({ "name": tic.from });
        setTimeout(addNode({ "name": tic.to }), 500);
        setTimeout(addOnlyOneLink({ "source": tic.from, "target": tic.to, "tx": tic.tx }), 800);
        // setTimeout(addLink({ "source": tic.from, "target": tic.to, "tx": tic.tx }), 800);
    }
    // tic단위로 작업. timer를 리턴함.
    function work_job_tic(timer, druation) {
        timer = setInterval(() => {
            var job = queue.dequeue();
            if (job != null) {
                cycles_per_tick(job);
            } else {
                clearInterval(timer);
            }
        }, druation)
        return timer;
    }
    // tic단위로 작업을 한후에 tx단위로 또 작업을 진행해야함.
    function cycles_per_tx(tic) {
        var shape = {
            from: 0,
            to: 0,
            tx: 0
        };

        tic = $.extend({}, shape, tic);
        addNode({ "name": tic.from });
        setTimeout(addNode({ "name": tic.to }), 200);
        // setTimeout(addOnlyOneLink({ "source": tic.from, "target": tic.to, "tx": tic.tx }), 800);
        setTimeout(addLink({ "source": tic.from, "target": tic.to, "tx": tic.tx }), 300);
    }

    function work_job_tx(timer, duration) {
        timer = setInterval(() => {
            var job = queue.dequeue();
            if (job != null) {
                if (typeof job === 'object') {
                    cycles_per_tx(job);
                } else {
                    removeAllLink()
                }
            } else {
                clearInterval(timer);
            }
        }, duration)
        return timer;
    }

    this.duration = 3000;

    this.timer = null;
    var queue = new Queue();
    this.tics = [];
    this.txs = [];
    this.isTX = false;

    this.expression_per_tx = function (data) {
        this.isTX = true;
        this.duration = 500;
        this.txs = data;
        queue = new Queue();
        removeAllNode();
        clearInterval(this.timer);
        this.txs.forEach((tx) => {
            tx.forEach((v) => {
                queue.enqueue(v);
            });
            queue.enqueue("end TX");
        });
        this.timer = work_job_tx(queue, this.duration);
    }

    // tic당 표현
    this.expression_per_tic = function (data) {
        this.isTX = false;
        this.tics = data;
        queue = new Queue();
        removeAllNode();
        clearInterval(this.timer);

        this.tics.forEach((v) => {
            queue.enqueue(v);
        });

        this.timer = work_job_tic(queue, this.duration);
    }

    this.toSlow = function () {
        clearInterval(this.timer);
        this.duration = this.duration + 500 > 60000 ? 60000 : this.duration + 500;
        if (this.isTX) {
            this.timer = work_job_tx(queue, this.duration);
        } else {
            this.timer = work_job_tic(queue, this.duration);
        }
    }

    this.toFast = function () {
        clearInterval(this.timer);
        this.duration = this.duration - 500 > 0 ? this.duration - 500 : 500;
        if (this.isTX) {
            this.timer = work_job_tx(queue, this.duration);
        } else {
            this.timer = work_job_tic(queue, this.duration);
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
                this.timer = work_job_tx(queue, this.duration);
            }
        } else {
            if (queue.isEmpty()) {
                this.expression_per_tic(this.data)
            } else {
                clearInterval(this.timer);
                this.timer = work_job_tic(queue, this.duration);
            }
        }
    }

    this.stepTic = function () {
        clearInterval(this.timer);
        if (this.isTX) {
            var job = queue.dequeue();
            if (job != null) {
                if (typeof job === 'object') {
                    cycles_per_tx(job);
                } else {
                    removeAllLink()
                }
            }
        } else {
            var job = queue.dequeue();
            if (job != null) {
                cycles_per_tick(job);
            }

        }

    }

    this.removeLinks = function () {
        clearInterval(this.timer);
        removeAllLink();
    }
}


this.graph = new nodeGraph();