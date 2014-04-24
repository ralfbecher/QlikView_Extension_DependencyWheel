/*
Created by Ralf Becher - ralf.becher@tiq-solutions.de - TIQ Solutions, Leipzig, Germany
Tested on QV 11.2 SR5

TIQ Solutions takes no responsibility for any code.
Use at your own risk. */

(function () {
    var path = "Extensions/DependencyWheel/";
	var files = [];
    files.push(path + 'd3.min.js');
    files.push(path + 'd3.dependencyWheel.js');
    files.push(path + 'dependencywheelhelper.js');

	var maxDisplayEdges = 2000;
	var directedGraph = true;
	var maxLabelLength = 20;
    var emtpyDim = "n/a";

    Qv.LoadExtensionScripts(files, function () {

		Qv.AddExtension('DependencyWheel',
            function () {
				//Qva.LoadCSS(Qva.Remote + "?public=only&name=Extensions/DependencyWheel/style.css");		
				var _this = this;
				
				directedGraph = (_this.Layout.Text0.text.toString() == "1");
				if (_this.Layout.Text1.text.toString() * 1 > 0) 
					maxLabelLength = _this.Layout.Text1.text.toString() * 1;
				if (_this.Layout.Text2.text.toString().length > 0) 
					emtpyDim = _this.Layout.Text2.text.toString();
				
				if (_this.Data.Rows.length > 0) {

					var _objId = _this.Layout.ObjectId.replace("\\", "_");

					var nodes = [];
					var nodes2 = [];
					var nodesObj = [];
					var nodesObj2 = [];
					var edges = [];
					var edgesObj = [];

		            for (var i = 0, k = Math.min(_this.Data.Rows.length,maxDisplayEdges); i < k; i++) {
						var row = _this.Data.Rows[i];

						//Nodes of 1st dimension:
						if ($.inArray(row[0].text, nodes) == -1) {
							nodes.push(row[0].text);
							nodesObj.push({id: row[0].text});
						}
						if (directedGraph) {
							//Nodes of 2nd dimension:
							if (row[1].text == '-') {
								row[1].text = emtpyDim;
							}
							if ($.inArray(row[1].text, nodes) == -1) {
								nodes.push(row[1].text);
								nodesObj.push({id: row[1].text});
							}
							if ($.inArray(row[0].text + '-' + row[1].text, edges) == -1) {
								edges.push(row[0].text + '-' + row[1].text);
								edgesObj.push({source: row[0].text, target: row[1].text, weight: row[2].text * 1});
							}
						} else {
							//Nodes of 2nd dimension:
							if (row[1].text == '-') {
								row[1].text = emtpyDim;
							}
							if ($.inArray(row[1].text, nodes2) == -1) {
								nodes2.push(row[1].text);
								nodesObj2.push({id: row[1].text});
							}
							if ($.inArray(row[0].text + '-' + row[1].text, edges) == -1) {
								edges.push(row[0].text + '-' + row[1].text);
								edgesObj.push({source: row[0].text, target: row[1].text, weight: row[2].text * 1});
			                    //add the opposite direction (not for real graphs..)
			                    edgesObj.push({source: row[1].text, target: row[0].text, weight: row[2].text * 1});
							}
		                }
					}
					nodes.sort();
					nodesObj.sort(orderByIdAscending);
					if (!directedGraph) {
						nodes2.sort();
						nodesObj2.sort(orderByIdAscending);
						nodes = nodes.concat(nodes2);
						nodesObj = nodesObj.concat(nodesObj2);
						//not needed anymore
						nodes2 = [];
						nodesObj2 = [];						
					}

					var data = {
						packageNames: nodes,
						matrix: createMatrix(nodesObj,edgesObj)
					};

					var elementWidth = Math.min(_this.GetWidth(),_this.GetHeight());
					var chartWidth = Math.floor(elementWidth * 0.76);

					$("."+_objId+" .QvContent").empty();
					$("."+_objId+" .QvContent").append($('<div />').attr("id", _objId).width(_this.GetWidth()).height(_this.GetHeight()));

					var options = {
						elementId: _objId,
						width: chartWidth,
						margin: chartWidth * .15,
						padding: 0.02,
						maxStrLength: maxLabelLength
					};

					var chart = d3.chart.dependencyWheel(options);
					d3.select('#'+_objId)
					.datum(data)
					.call(chart);

					var svg = $('#'+_objId+' svg');
					var bb = svg[0].getBBox();
					svg[0].setAttribute('viewBox',[bb.x,bb.y,bb.width,bb.height].join(','));

				}
		});
	});
	
})();
