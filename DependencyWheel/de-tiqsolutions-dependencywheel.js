/*
Created by Ralf Becher - ralf.becher@tiq-solutions.de - (c) 2015 TIQ Solutions, Leipzig, Germany
Tested on Qlik Sense 2.1.1
*/
requirejs.config({
	shim : {
		"extensions/de-tiqsolutions-dependencywheel/d3.dependencyWheel" : {
			"deps" : ["extensions/de-tiqsolutions-dependencywheel/d3.min"]
		}
	}
});
define(["jquery", "qlik", "./d3.dependencyWheel", "./chroma.min", "text!./styles/de-tiqsolutions-dependencywheel.css"], 
function($, qlik, dependencyWheel, chroma,cssContent) {

	$("<style>").html(cssContent).appendTo("head");

	return {
		initialProperties: {
			version: 1.0,
			qHyperCubeDef: {
				qDimensions: [],
				qMeasures: [],
				qInitialDataFetch: [{
					qWidth: 3,
					qHeight: 500
				}]
			}
		},
		//property panel
		definition: {
			type: "items",
			component: "accordion",
			items: {
				dimensions: {
					uses: "dimensions",
					min: 2,
					max: 2
				},
				measures: {
					uses: "measures",
					min: 1,
					max: 1
				},
				sorting: {
					uses: "sorting"
				},
				settings: {
					uses: "settings",
					items : {
					  colorSchema: {
						  ref: "colorSchema",
						  type: "string",
						  component: "dropdown",
						  label: "Color and Legend",
						  options: 
							[ {
								value: "#fff7bb,#fca835,#ee7617,#cb4b02,#993404",
								label: "Sequencial"
							}, {
								value: "#993404,#cb4b02,#ee7617,#fca835,#fff7bb",
								label: "Sequencial (Reverse colors)"
							}, {
								value: "#3d53a2,#77b7e5,#e7f1f6,#f9bd7e,#d24d3e",
								label: "Diverging"
							}, {
								value: "#d24d3e,#f9bd7e,#e7f1f6,#77b7e5,#3d53a2",
								label: "Diverging (Reverse colors)"
							}],
							defaultValue: "#fff7bb,#fca835,#ee7617,#cb4b02,#993404"
						},
					   aggregateDims:{
							type: "boolean",
							component: "switch",
							translation: "Aggregate Dimensions",
							ref: "aggregateDims",
							defaultValue: false,
							trueOption: {
							  value: true,
							  translation: "properties.on"
							},
							falseOption: {
							  value: false,
							  translation: "properties.off"
							},
							show: true
						  }
					}
				}
			}
		},
		snapshot: {
			canTakeSnapshot: true
		},

		paint: function ( $element, layout ) {
 
			$element.html("");  

			var qData = layout.qHyperCube.qDataPages[0];
			var id = "container_"+ layout.qInfo.qId;
			var emtpyDim = "n/a";

			// custom properties
			var isAdjacencyList = layout.isAdjacencyList,
			  colorSchema = layout.colorSchema.split(",");

			var dimensionLabels = layout.qHyperCube.qDimensionInfo.map(function(d) {
				return d.qFallbackTitle;
			});
			var qDimensionType = layout.qHyperCube.qDimensionInfo.map(function(d) {
				return d.qDimensionType;
			});
			var qDimSort = layout.qHyperCube.qDimensionInfo.map(function(d) {
				return d.qSortIndicator;
			});

			if(qData && qData.qMatrix) {
				//console.log(qData);
				var nodes = [],
				nodes2 = [],
				nodesObj = [],
				nodesObj2 = [],
				edges = [],
				edgesObj = [],
				dim1cnt = 0,
				node1Id = "",
				node2Id = "",
				edgeId = "",
				edgeIdRev = "",
				idx = -99,
				aggregateDims = layout.aggregateDims;
				
				//loop through the rows of the cube and push the values into the array
				$.each(layout.qHyperCube.qDataPages[0].qMatrix, function(index, value) {
					if (!this[0].qIsEmpty && !this[1].qIsEmpty) {
						//Nodes of 1st dimension:
						if(this[0].qIsOtherCell) {
							this[0].qText = layout.qHyperCube.qDimensionInfo[0].othersLabel;
						}
						if (aggregateDims) {
							node1Id = this[0].qText;
						} else {
							node1Id = dimensionLabels[0] + ": " + this[0].qText;
						}
						idx = $.inArray(this[0].qText, nodes);
						if (idx == -1) {
							nodes.push(this[0].qText);
							nodesObj.push({id: node1Id, label: this[0].qText, num: this[0].qNum, dim: 0, element: this[0].qElemNumber, dim0: this[0].qElemNumber, dim1: -1});
						} else if (nodesObj[idx].dim0 == -1) {
							nodesObj[idx].dim0 = this[0].qElemNumber;
						}
						//Nodes of 2nd dimension:
						if(this[1].qIsOtherCell) {
							this[1].qText = layout.qHyperCube.qDimensionInfo[1].othersLabel;
						}
						if (this[1].qText == '-') {
							this[1].qText = emtpyDim;
						}
						if (aggregateDims) {
							node2Id = this[1].qText;
							idx = $.inArray(this[1].qText, nodes);
							if (idx == -1) {
								nodes.push(this[1].qText);
								nodesObj.push({id: node2Id, label: this[1].qText, num: this[1].qNum, dim: 1, element: this[1].qElemNumber, dim0: -1, dim1: this[1].qElemNumber});
							} else if (nodesObj[idx].dim1 == -1) {
								nodesObj[idx].dim1 = this[1].qElemNumber;
							}
						} else {
							node2Id = dimensionLabels[1] + ": " + this[1].qText;
							idx = $.inArray(this[1].qText, nodes2);
							if (idx == -1) {
								nodes2.push(this[1].qText);
								nodesObj2.push({id: node2Id, label: this[1].qText, num: this[1].qNum, dim: 1, element: this[1].qElemNumber, dim0: -1, dim1: this[1].qElemNumber});
							} else if (nodesObj2[idx].dim1 == -1) {
								nodesObj[idx].dim1 = this[1].qElemNumber;
							}
						}
						//Edges A->B and B->A
						edgeId = node1Id + "->" + node2Id;
						if ($.inArray(edgeId, edges) == -1) {
							edges.push(edgeId);
							edgesObj.push({id: edgeId, source: node1Id, target: node2Id, weight: this[2].qNum});
						}
						if (!aggregateDims) {
							edgeIdRev = node2Id + "->" + node1Id;
							if ($.inArray(edgeIdRev, edges) == -1) {
								//add the opposite direction for the matrix (not for real graphs..)
								edges.push(edgeIdRev);
								edgesObj.push({id: edgeIdRev, source: node2Id, target: node1Id, weight: this[2].qNum});
							}
						}
					}
				});

				if (aggregateDims) {
					dim1cnt = 1;
					nodes.sort(function(a, b) {
						var x = a.toLowerCase(), y = b.toLowerCase();   
						return x < y ? -1 : x > y ? 1 : 0;
					});
					nodesObj.sort(function(a, b) {
						var x = a.id.toLowerCase(), y = b.id.toLowerCase();   
						return x < y ? -1 : x > y ? 1 : 0;
					});
				} else {
					dim1cnt = nodes.length;
					// Sorting Dim2
					if (qDimensionType[1] == "N") {
						// Numeric
						if (qDimSort[1] == "A") {
							nodesObj2.sort(function(o1,o2){ return o1.num - o2.num; });
						} else {
							nodesObj2.sort(function(o1,o2){ return o2.num - o1.num; });
						}
					} else {
						// Alphabetic
						if (qDimSort[1] == "A") {
							nodesObj2.sort(function(a, b) {
								var x = a.id.toLowerCase(), y = b.id.toLowerCase();   
								return x < y ? -1 : x > y ? 1 : 0;
							});
						} else {
							nodesObj2.sort(function(a, b) {
								var y = a.id.toLowerCase(), x = b.id.toLowerCase();   
								return x < y ? -1 : x > y ? 1 : 0;
							});
						}
					}
					nodes2 = nodesObj2.map(function(d) {
						return d.label;
					});
				
					nodes = nodes.concat(nodes2);
					nodesObj = nodesObj.concat(nodesObj2);
			  
					//not needed anymore
					nodes2 = [];
					nodesObj2 = [];
				}
				
				var colors = chroma.interpolate.bezier(colorSchema),			  
					colorPalette = [1, 1],
					colorPaletteSize = nodes.length,
					colorPaletteStep = (colorPaletteSize == 1 ? 1 : 1 / (colorPaletteSize - 1));
				for (i = 0; i < colorPaletteSize; i++) {
					colorPalette[i] = colors(i * colorPaletteStep);
				}
				
				var data = {
					self: this,
					packageNames: nodes,
					nodes: nodesObj,
					sum: d3.sum(layout.qHyperCube.qDataPages[0].qMatrix, function(d) { return d[2].qNum; }),
					dim1cnt: dim1cnt,
					aggregateDims: aggregateDims,
					matrix: createMatrix(nodesObj,edges,edgesObj,aggregateDims),
					colorPalette: colorPalette
				};
	
				var elementWidth = Math.min($element.width(),$element.height());
				var chartWidth = Math.floor(elementWidth * 0.76);

				// Check to see if the chart element has already been created
				if (document.getElementById(id)) {
					// if it has been created, empty it's contents so we can redraw it
					$("#" + id).empty();
				} else {
					// if it hasn't been created, create it with the appropriate id and size
					$element.append($('<div />').attr("id", id).width($element.width()).height($element.height()));
				} 
				// keep mouse cursor arrow instead of text select (auto)
				$("#"+id).css('cursor','default');

				var options = {
					elementId: id,
					width: chartWidth,
					margin: chartWidth * .15,
					padding: 0.02,
					maxStrLength: 15
				};

				var chart = d3.chart.dependencyWheel(options);
				d3.select('#'+id)
					.datum(data)
					.call(chart);

				var svg = $('#'+id+' svg');
				var bb = svg[0].getBBox();
				svg[0].setAttribute('viewBox',[bb.x,bb.y,bb.width,bb.height].join(','));			  
            }
		}
	};
} );

function createMatrix(nodes,edges,edgesObj,aggregateDims) {
  var id = "", pos = 0, matrix = [];
  for (a in nodes) {
	var grid = [];
	for (b in nodes) {
	  if (a === b && !aggregateDims) {
			grid.push(0);
	  } else {
		  id = nodes[a].id + "->" + nodes[b].id;
		  pos = $.inArray(id, edges);
		  if (!(pos == -1)) {
			grid.push(edgesObj[pos].weight);
		  } else {
			grid.push(0);
		  }
	  }
	}
	matrix.push(grid);
  }
  return matrix;
}