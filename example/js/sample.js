var sample = {}

function sampleClass() {
    function name(d) { return d.name; }
    function group(d) { return d.group; }

    var color = d3.scale.category10();
    function colorByGroup(d) { return color(group(d)); }

    var width = window.innerHeight - 20,
        height = window.innerHeight - 20;

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

    var charge = 0.317 * height;
    var distance = 0.211 * height;

    var force = d3.layout.force()
        .charge(-1 * charge)
        .friction(0.2)
        .linkDistance(distance)
        .size([width, height]);

    var nodes = force.nodes();
    var links = force.links();

    this.addNode = function (node) {
        if (node.txs == null) {
            node.txs = [];
        }
        nodes.push(node);
        this.update();
    };

    this.removeNode = function (id) {
        var i = 0;
        var n = findNode(id);
        while (i < links.length) {
            if ((links[i]['source'] == n) || (links[i]['target'] == n)) {
                links.splice(i, 1);
            }
            else i++;
        }
        nodes.splice(findNodeIndex(id), 1);
        this.update();
    };

    var findNode = function (id) {
        for (var i in nodes) {
            if (nodes[i]["id"] == id) {
                return nodes[i];
            }
        };
    };

    var findNodeIndex = function (id) {
        for (var i = 0; i < nodes.length; i++) {
            if (nodes[i].id == id) {
                return i;
            }
        };
    };
    var selectedSource = null;
    var selectedTarget = null;
    var minTx = 0;
    var maxTx = 0;


    function addLinkHighlight(source, target, tx) {

        $("#round" + selectedSource.id)
            .attr("fill", "#ff0000")
            .attr('r', 15)
        // $("#rect_back" + selectedSource.id)
        //     .attr('visibility', 'visible')
        // $("#rect_state" + selectedSource.id)
        //     .attr('visibility', 'visible')
        //     .attr("x", pushTx)

        $("#round" + selectedTarget.id)
            .attr("fill", "#0000ff")
            .attr('r', 15)
        // $("#rect_back" + selectedTarget.id)
        //     .attr('visibility', 'visible')
        // $("#rect_state" + selectedTarget.id)
        //     .attr('visibility', 'visible')
        //     .attr("x", pushTx)
    }

    this.addLink = function (source, target, tx) {
        selectedSource = findNode(source);
        selectedTarget = findNode(target);

        if (tx <= minTx) {
            minTx = tx;
            if (maxTx <= minTx) {
                maxTx = minTx + 1;
            }
        }

        if (tx > maxTx) {
            maxTx = tx;
        }

        selectedSource.txs.push(tx);
        selectedTarget.txs.push(tx);

        addLinkHighlight(source, target, tx);
        links.push({ "source": selectedSource, "target": selectedTarget, "value": "1" });
        this.update();
    };

    this.removeLink = function (source, target) {
        for (var i = 0; i < links.length; i++) {
            if (links[i].source.id == source && links[i].target.id == target) {
                links.splice(i, 1);
                break;
            }
        }
        this.update();
    };

    this.removeallLinks = function () {
        $(".nodeStrokeClass").each(function (index) {
            $(this)
                .attr("fill", "#00ff00")
                .attr('r', 10)
        });

        links.splice(0, links.length);
        this.update();
    };

    this.removeAllNodes = function () {
        nodes.splice(0, nodes.length);
        this.update();
    };

    var tooltip = d3.select('body')
        .append("div")
        .style("opacity", 0)
        .attr("class", "tooltip")
        .style("background-color", "black")
        .style("border-radius", "5px")
        .style("padding", "10px")
        .style("color", "white")

    var showTooltip = function (d) {
        tooltip
            .transition()
            .duration(100)
        tooltip
            .style("opacity", 1)
            .html("NodeID : " + d.id)
            .style("left", "30px")
            .style("top", "30px")
    }
    var moveTooltip = function (d) {
        tooltip
            .style("left", "30px")
            .style("top", "30px")
    }
    var hideTooltip = function (d) {
        tooltip
            .transition()
            .duration(100)
            .style("opacity", 0)
    }

    this.update = function () {

        nodes.forEach(function (d, i) {
            d.id = d.name;
        });

        var link = svg.selectAll("line")
            .data(links, function (d) {

                return d.source.name + "-" + d.target.name;
            });

        link.enter().append("line")
            .attr("id", function (d) {
                return d.source.name + "-" + d.target.name;
            })
            .style("stroke-width", function (d) {
                return Math.sqrt(d.value + 1);
            })
            .attr("class", "link");

        link.append("title")
            .text(function (d) {
                return d.value;
            });

        link.exit().remove();

        var node = svg.selectAll("g.node")
            .data(nodes, function (d) {
                return d.id;
            });

        var nodeEnter = node.enter().append("g")
            .attr("class", "node")
            .attr('title', name)
            .call(force.drag);

        nodeEnter.on("mouseover", showTooltip)
            .on("mousemove", moveTooltip)
            .on("mouseleave", hideTooltip)

        nodeEnter.append('svg:circle')
            .attr('r', 10)
            .attr('fill', "#00ff00")
            .attr('id', function (d) {
                return "round" + d.id;
            })
            .attr("class", "nodeStrokeClass")
            .attr('fill-opacity', 0.5);

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
                return d.id;
            });

        nodeEnter.append("svg:rect")
            .attr("x", -15)
            .attr("y", -22)
            .attr("height", 5)
            .attr("width", 30)
            .attr("z-index", 99999)
            .attr("fill", "#000000")
            .attr('id', function (d) {
                return "rect_back" + d.id;
            })
            .attr("class", "hide")
            .attr('visibility', 'visible')
            .attr('fill-opacity', 0.5);


        nodes.forEach(function (d, i) {
            if (d.txs != null) {
                d.txs.forEach(function (v, i) {
                    var allTx = this.maxTx - this.minTx;
                    var pushRight = 0.4;
                    var pushTx = pushRight * ((v / allTx) * 100) - 20;
                    nodeEnter.append("svg:rect")
                        .attr("x", 10 + v)
                        .attr("y", -22)
                        .attr("height", 5)
                        .attr("width", 2)
                        .attr("z-index", 99999)
                        .attr('id', function (d) {
                            return "rect_state" + d.id;
                        })
                        .attr("class", "hide")
                        .attr('visibility', 'visible')
                        .attr("fill", "#000000")
                });
            }
        });


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
        force
            .start();
    }

    this.update();

    this.keepNodesOnTop = function () {
        $(".nodeStrokeClass").each(function (index) {
            var gnode = this.parentNode;
            gnode.parentNode.appendChild(gnode);
        });
    }
}

this.sample = new sampleClass()
