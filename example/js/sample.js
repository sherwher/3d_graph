var sample = {}

function sampleClass() {
    function name(d) { return d.name; }
    function group(d) { return d.group; }

    var color = d3.scale.category10();
    function colorByGroup(d) { return color(group(d)); }

    var width = 960,
        height = 500;

    var svg = d3.select('body')
        .append('svg')
        .attr('width', width)
        .attr('height', height);

    var node, link;

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
        .charge(-2000)
        .friction(0.3)
        .linkDistance(50)
        .size([width, height]);



    var nodes = force.nodes();
    var links = force.links();

    this.addNode = function (node) {
        nodes.push(node);
        this.update();
    };

    this.removeNode = function (id) {
        var i = 0;
        var n = findNode(id);
        console.log(nodes.length)
        while (i < links.length) {
            if ((links[i]['source'] == n) || (links[i]['target'] == n)) {
                links.splice(i, 1);
            }
            else i++;
        }
        nodes.splice(findNodeIndex(id), 1);
        console.log(nodes.length)
        this.update();
    };

    var findNode = function (id) {
        for (var i in nodes) {
            if (nodes[i]["name"] === id) return nodes[i];
        };
    };

    var findNodeIndex = function (id) {
        for (var i = 0; i < nodes.length; i++) {
            console.log(nodes[i].name)
            if (nodes[i].name == id) {
                return i;
            }
        };
    };

    this.update = function () {

        nodes.forEach(function (d, i) {
            d.id = i;
        });

        link = svg.selectAll('.link')
            .data(links)
            .enter().append('line')
            .attr('class', 'link')
            .style("stroke-width", function (d) {
                return Math.sqrt(d.value);
            });

        // node = svg.selectAll('.node')
        //     .data(nodes)
        //     .enter().append('g')
        //     .attr('title', name)
        //     .attr('class', 'node')
        //     .call(force.drag);

        var node = svg.selectAll("g.node")
            .data(nodes, function (d) {
                return d.id;
            });

        var nodeEnter = node.enter().append("g")
            .attr("class", "node")
            .call(force.drag);

        nodeEnter.append('svg:circle')
            .attr('r', 30)
            .attr('fill', colorByGroup)
            .attr('fill-opacity', 0.5);

        nodeEnter.append('svg:circle')
            .attr('r', 4)
            .attr('stroke', 'black');

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
}

this.sample = new sampleClass()
