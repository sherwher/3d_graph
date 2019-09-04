var graph = {}



function nodeGraph() {
    this.data = {
        nodes: [],
        links: [],
        minTx: null,
        maxTx: null,
    }

    this.setGraphData = function (data) {
        for (var j = 0; j < data.nodes.length; j++) {
            data.nodes[j].source = false;
            data.nodes[j].target = false;
            data.nodes[j].txs = new Map();
        }
        data.links.forEach((v, i) => {
            // 노드에 대한 tx값의 min, max처리
            if (data.minTx == null || data.maxTx == null) {
                data.minTx = v.tx;
                data.maxTx = v.tx;
            } else {
                if (data.minTx >= v.tx) {
                    data.minTx = v.tx;
                }

                if (data.maxTx < v.tx) {
                    data.maxTx = v.tx;
                }
            }
            // 노드에 대한 tx 및 highlight처리
            for (var j = 0; j < data.nodes.length; j++) {
                if (v.source == data.nodes[j].name || v.target == data.nodes[j].name) {
                    data.nodes[j].txs.set(v.tx, v.tx);
                }
                if (v.source == data.nodes[j].name) {
                    data.nodes[j].source = true;
                }
                if (v.target == data.nodes[j].name) {
                    data.nodes[j].target = true;
                }
                console.log(data.nodes[j])
            }

        });
        this.data = $.extend({}, this.data, data);
        update(this.data);
        keepNodesOnTop();
    }

    this.addNode = function (node) {
        node.source = false;
        node.target = false;
        node.txs = new Map();
        this.data.nodes.push(node);
        update(this.data);
        keepNodesOnTop();
    }

    this.addLink = function (link) {

        if (this.data.minTx == null || this.data.maxTx == null) {
            this.data.minTx = link.tx;
            this.data.maxTx = link.tx;
        } else {
            if (this.data.minTx >= link.tx) {
                this.data.minTx = link.tx;
            }

            if (this.data.maxTx < link.tx) {
                this.data.maxTx = link.tx;
            }
        }

        for (var j = 0; j < this.data.nodes.length; j++) {
            if (link.source == this.data.nodes[j].name) {
                this.data.nodes[j].source = true;
                this.data.nodes[j].txs.set(link.tx, link.tx);
            }
            if (link.target == this.data.nodes[j].name) {
                this.data.nodes[j].target = true;
                this.data.nodes[j].txs.set(link.tx, link.tx);
            }

        }
        this.data.links.push(link);
        update(this.data);
        keepNodesOnTop();
    }
    this.addOnlyOneLink = function (link) {
        this.data.links = [];
        if (this.data.minTx == null || this.data.maxTx == null) {
            this.data.minTx = link.tx;
            this.data.maxTx = link.tx;
        } else {
            if (this.data.minTx >= link.tx) {
                this.data.minTx = link.tx;
            }

            if (this.data.maxTx < link.tx) {
                this.data.maxTx = link.tx;
            }
        }
        for (var j = 0; j < this.data.nodes.length; j++) {
            if (link.source == this.data.nodes[j].name) {
                this.data.nodes[j].source = true;
                this.data.nodes[j].txs.set(link.tx, link.tx);
            } else {
                this.data.nodes[j].source = false;
            }
            if (link.target == this.data.nodes[j].name) {
                this.data.nodes[j].target = true;
                this.data.nodes[j].txs.set(link.tx, link.tx);
            } else {
                this.data.nodes[j].target = false;
            }
        }
        this.data.links.push(link);
        update(this.data);
        keepNodesOnTop();
    }
    this.removeAllNode = function () {
        this.data.links = [];
        this.data.nodes = [];
        update(this.data);
        keepNodesOnTop();
    }

    var width = window.innerHeight - 20,
        height = window.innerHeight - 20;
    var charge = 0.317 * height;
    var distance = 0.211 * height;

    var svg = d3.select('body')
        .append('svg')
        .attr('width', width)
        .attr('height', height);

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
        .friction(0.2)
        .linkDistance(distance)
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

        link.exit().remove();

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

        nodeEnter.append("svg:text")
            .attr("class", "textClass")
            .attr("x", 14)
            .attr("y", ".31em")
            .text(function (d, i) {
                return d.name;
            });

        nodeEnter.append("svg:rect")
            .attr("x", -20)
            .attr("y", -22)
            .attr("height", 5)
            .attr("width", 40)
            .attr("z-index", 9999)
            .attr("fill", "#000000")
            .attr('id', function (d) {
                return "rect_back" + d.id;
            })
            .attr("class", "hide")
            .attr('visibility', 'visible')
            .attr('fill-opacity', 0.5);


        // nodeEnter.append("rect")
        //     .attr("height", 5)
        //     .attr("width", function(d) {})
        //     .attr("z-index", 99999)
        //     .attr("fill", "#000000")
        //     .attr("x", -15)
        //     .attr("y", -22 + j * 2)
        //     .attr('visibility', 'visible')


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
            $("#round" + n.id)
                .attr("fill", circleColor(n))
                .attr('r', circleSize(n))
            $("#rect_back" + n.id).empty();
            var txs = Array.from(n.txs.keys());
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
                    .attr("x", -20 + boxWidth * (txs[j] - 1))
                    .style("width", virtualBoxWidth)
            }
        }

        force
            .nodes(data.nodes)
            .links(data.links)
            .start();
    }

    update(this.data);

    function keepNodesOnTop() {
        $(".nodeStrokeClass").each(function (index) {
            var gnode = this.parentNode;
            gnode.parentNode.appendChild(gnode);
        });
    }
}


this.graph = new nodeGraph();