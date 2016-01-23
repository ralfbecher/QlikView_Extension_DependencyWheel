d3.chart = d3.chart || {};

/**
 * Dependency wheel chart for d3.js
 *
 * Usage:
 * var chart = d3.chart.dependencyWheel();
 * d3.select('#chart_placeholder')
 *   .datum({
 *      packageNames: [the name of the packages in the matrix],
 *      matrix: [your dependency matrix]
 *   })
 *   .call(chart);
 *
 * // Data must be a matrix of dependencies. The first item must be the main package.
 * // For instance, if the main package depends on packages A and B, and package A
 * // also depends on package B, you should build the data as follows:
 *
 * var data = {
 *   packageNames: ['Main', 'A', 'B'],
 *   matrix: [[0, 1, 1], // Main depends on A and B
 *            [0, 0, 1], // A depends on B
 *            [0, 0, 0]] // B doesn't depend on A or Main
 * };
 *
 * // You can customize the chart width, margin (used to display package names),
 * // and padding (separating groups in the wheel)
 * var chart = d3.chart.dependencyWheel().width(700).margin(150).padding(.02);
 *
 * @author François Zaninotto
 * @license MIT
 * @see https://github.com/fzaninotto/DependencyWheel for complete source and license
 */
d3.chart.dependencyWheel = function(options) {

  if (options) {
    var width = options.width;
    var margin = options.margin;
    var padding = options.padding;
    var maxStrLength = options.maxStrLength;
  } else {
    var width = 800;
    var margin = 150;
    var padding = 0.02;
    var maxStrLength = 20;
  }

  function chart(selection) {
    selection.each(function(data) {

      var formatX = d3.format("0,.2f");

      var self = data.self,
		matrix = data.matrix,
		packageNames = data.packageNames,
		nodes = data.nodes,
		sum = data.sum,
		dim1cnt = Math.max(1,data.dim1cnt),
		aggregateDims = data.aggregateDims,
		colorPalette = data.colorPalette,
		radius = width / 2 - margin;

      // create the layout
      var chord = d3.layout.chord()
        .padding(padding)
        .sortSubgroups(d3.descending);

      // Select the svg element, if it exists.
      //var svg = d3.select(this).selectAll("svg").data([data]);
      var svg = d3.select(this).append("svg:svg")
        .attr("width", "100%")
        .attr("height", "100%")
        .attr("preserveAspectRatio", "xMidYMid")
        .attr("class", "dependencyWheel")
      ;

      svg.data([data]);

      // create the skeletal chart.
      var gEnter = svg
        .append("g");
        //.attr("transform", "translate(" + ((width / 2) + (width * .2)) + "," + ((width / 2) + (width * .2)) + ")");

      var arc = d3.svg.arc()
        .innerRadius(radius)
        .outerRadius(radius + 20);

      var fill = function(d) {
        //if (d.index === 0) return '#ccc';
        //return "hsl(" + parseInt(((packageNames[d.index][0].charCodeAt() - 97) / 26) * 360, 10) + ",90%,70%)";
		return colorPalette[d.index];
      };

      // Returns an event handler for fading a given chord group.
      var fade = function(opacity) {
        return function(g, i) {
          svg.selectAll(".chord")
              .filter(function(d) {
                return d.source.index != i && d.target.index != i;
              })
            .transition()
              .style("opacity", opacity);
          var groups = [];
          svg.selectAll(".chord")
              .filter(function(d) {
                if (d.source.index == i) {
                  groups.push(d.target.index);
                }
                if (d.target.index == i) {
                  groups.push(d.source.index);
                }
              });
          groups.push(i);
          var length = groups.length;
          svg.selectAll('.group')
              .filter(function(d) {
                for (var i = 0; i < length; i++) {
                  if(groups[i] == d.index) return false;
                }
                return true;
              })
              .transition()
                .style("opacity", opacity);
        };
      };

      chord.matrix(matrix);
		if (aggregateDims) {
			rotation = 0;
		} else {
			  var rotation = 90 - (chord.groups()[dim1cnt-1].endAngle - chord.groups()[0].startAngle) / 2 * (180 / Math.PI);
		}

	var g = gEnter.selectAll("g.group")
        .data(chord.groups)
        .enter().append("svg:g")
        .attr("class", "group")
        .attr("transform", function(d) {
			return "rotate(" + rotation + ")";
        })
		.on("click", function(d,i) {
			if (aggregateDims) {
				self.backendApi.selectValues(0, [nodes[i].dim0], false);
				self.backendApi.selectValues(1, [nodes[i].dim1], false);				
			} else {
				self.backendApi.selectValues(nodes[i].dim, [nodes[i].element], true);
			}
		});
		g.append("title").text(function(d,i,g) {
			  return "Total "+nodes[i].id+"\n"+formatX(d.value) + " (" + formatX(d.value/sum*100) + "%)";
			});

		var gValuesArr = g[0].map(function(d,i) {
							return [nodes[i].id, d.__data__.value];
						});
		var gValuesObj = {};
		$.each(gValuesArr, function(index, value){
			gValuesObj[value[0]] = value[1];
		});
	
      g.append("svg:path")
        .style("fill", fill)
        .style("stroke", fill)
        .attr("d", arc)
        .on("mouseover", fade(0.1))
        .on("mouseout", fade(1));

      g.append("svg:text")
        .each(function(d) { d.angle = (d.startAngle + d.endAngle) / 2; })
        .attr("dy", ".35em")
        .attr("text-anchor", function(d) { return d.angle > Math.PI ? "end" : null; })
		.attr("class", "mono")
        .attr("transform", function(d) {
          return "rotate(" + (d.angle * 180 / Math.PI - 90) + ")" +
            "translate(" + (radius + 26) + ")" +
            (d.angle > Math.PI ? "rotate(180)" : "");
        })
        .text(function(d) { return packageNames[d.index].substring(0, maxStrLength) + ((packageNames[d.index].length > maxStrLength) ? '..' : ''); });

      gEnter.selectAll("path.chord")
          .data(chord.chords)
          .enter().append("svg:path")
          .attr("class", "chord")
          .style("stroke", function(d) { return d3.rgb(fill(d.source)).darker(); })
          .style("fill", function(d) { return fill(d.source); })
          .attr("d", d3.svg.chord().radius(radius))
          .attr("transform", function(d) {
				return "rotate(" + rotation + ")";
          })
          .style("opacity", 1)
		  .on("click", function(d,i) {
			if (aggregateDims) {
				self.backendApi.selectValues(0, [nodes[d.source.index].dim0,nodes[d.target.index].dim0], false);
				self.backendApi.selectValues(1, [nodes[d.source.index].dim1,nodes[d.target.index].dim1], false);
			} else {
				self.backendApi.selectValues(0, [nodes[d.source.index].element], false);
				self.backendApi.selectValues(1, [nodes[d.target.index].element], false);
			}
		  })
          // Add an elaborate mouseover title for each chord.
          .append("title").text(function(d) {
			  if (aggregateDims) {
				  if (nodes[d.source.index].id == nodes[d.target.index].id) {
					return ( nodes[d.source.index].id + " ↔ " + nodes[d.target.index].id + ": " + formatX(d.source.value) + " (" + formatX(d.source.value/gValuesObj[nodes[d.source.index].id]*100) + "%)" );
				  } else {
					return (
						nodes[d.source.index].id + " → " + nodes[d.target.index].id + ": " + formatX(d.source.value) + " (" + formatX(d.source.value/gValuesObj[nodes[d.source.index].id]*100) + "%)\n" +
						nodes[d.target.index].id + " → " + nodes[d.source.index].id + ": " + formatX(d.target.value) + " (" + formatX(d.target.value/gValuesObj[nodes[d.target.index].id]*100) + "%)"
						);
				  }
			  } else {
					return( nodes[d.source.index].id + " → " + nodes[d.target.index].id + "\n" + formatX(d.source.value) + 
					" (" + formatX(d.source.value/gValuesObj[nodes[d.source.index].id]*100) + "% → " + 
					formatX(d.source.value/gValuesObj[nodes[d.target.index].id]*100) +  "%)" );
			  }
          });

    });

  }

  chart.width = function(value) {
    if (!arguments.length) return width;
    width = value;
    return chart;
  };

  chart.margin = function(value) {
    if (!arguments.length) return margin;
    margin = value;
    return chart;
  };

  chart.padding = function(value) {
    if (!arguments.length) return padding;
    padding = value;
    return chart;
  };

  return chart;
};
