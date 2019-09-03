var graph = {}



function nodeGraph() {
    this.data = {
        nodes: [],
        links: [],
        minTx: 0,
        maxTx: 1,
        source: new Map(),
        target: new Map()
    }

    function findNode(id) {
        var index;
        this.data.nodes.forEach(function (v, i) {
            if (v.name = id) {
                index = i;
            }
        })
        return index;
    }

    function clearNodeSourceAndTarget() {
        this.data.nodes.forEach(function (v) {
            v.source = null;
            v.target = null;
        });
    }

    this.getGraphData = function () {
        return this.data;
    }
    this.setGraphData = function (data) {
        this.data = data;
        update(this.data);
        keepNodesOnTop();
    }
    this.addNode = function (node) {
        this.data.nodes.push(node);
        update(this.data);
        keepNodesOnTop();
    }
    this.addLink = function (link) {
        this.data.links = [];
        this.data.links.push(link);
        update(this.data);
        keepNodesOnTop();
    }

    var color = d3.scale.category10();
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

    // var nodes = force.nodes();
    // var links = force.links();
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
                return 2;
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
            .call(force.drag);

        nodeEnter.append('svg:circle')
            .attr('r', function (d) {

                return 10;
            })
            .attr('fill', function (d) {
                return "#ff0000";
            })
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
                return d.name;
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