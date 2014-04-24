    function createMatrix(nodes,edges) {
      var edgeHash = {};
      for (x in edges) {
        var id = edges[x].source + "-" + edges[x].target;
        edgeHash[id] = edges[x];
      }
      matrix = [];
      //create all possible edges
      for (a in nodes) {
        var grid = [];
        for (b in nodes) {
          var id = nodes[a].id + "-" + nodes[b].id;
          if (edgeHash[id]) {
            grid.push(edgeHash[id].weight);
          } else {
            grid.push(0);
          }
        }
        matrix.push(grid);
      }
      return matrix;
    }

    function orderByIdAscending(a, b) {
      if (a.id > b.id) {
        return 1;
      }
      return -1;
    }