import { useEffect, useRef } from "react";
import cytoscape from "cytoscape";
import cola from "cytoscape-cola";

// Register the cytoscape-cola layout extension
cytoscape.use(cola);

function GraphVisualization({ graphData }) {
  const cyRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (
      !graphData ||
      !graphData.nodes ||
      !graphData.edges ||
      graphData.nodes.length === 0
    ) {
      return;
    }

     
    const elements = {
      nodes: graphData.nodes.map((node) => ({
        data: {
          id: node.id,
          label: node.label,
          type: node.type,
          ...node.data,
        },
      })),
      edges: graphData.edges.map((edge) => ({
        data: {
          id: `${edge.source}-${edge.target}-${edge.type}`,
          source: edge.source,
          target: edge.target,
          label: edge.label,
          type: edge.type,
        },
      })),
    };

     
    cyRef.current = cytoscape({
      container: containerRef.current,
      elements,
      style: [
        
        {
          selector: "node",
          style: {
            label: "data(label)",
            "text-valign": "center",
            "text-halign": "center",
            "background-color": "#666",
            color: "#fff",
            "text-outline-width": 2,
            "text-outline-color": "#666",
            "font-size": 14,
            width: 40,
            height: 40,
          },
        },
        {
          selector: 'node[type="user"]',
          style: {
            "background-color": "#4169E1",  //blue for users
            "text-outline-color": "#4169E1",
            shape: "ellipse",
          },
        },
        {
          selector: 'node[type="transaction"]',
          style: {
            "background-color": "#228B22", // green for transactions
            "text-outline-color": "#228B22",
            shape: "diamond",
          },
        },
         
        {
          selector: "edge",
          style: {
            width: 2,
            "line-color": "#999",
            "target-arrow-color": "#999",
            "target-arrow-shape": "triangle",
            "curve-style": "bezier",
            label: "data(label)",
            "font-size": 10,
            "text-rotation": "autorotate",
            "text-background-color": "white",
            "text-background-opacity": 0.7,
            "text-background-padding": 2,
          },
        },
        
        {
          selector: 'edge[type="sent"], edge[type="received"]',
          style: {
            "line-color": "#228B22", // green for transaction 
            "target-arrow-color": "#228B22",
          },
        },
        {
          selector: 'edge[type="shared_attribute"]',
          style: {
            "line-color": "#4169E1", // blue for shared
            "target-arrow-color": "#4169E1",
          },
        },
        {
          selector:
            'edge[type="SHARED_IP"], edge[type="SHARED_DEVICE"], edge[type="RELATED_TO"]',
          style: {
            "line-color": "#DC143C", //  red for transaction-to-transaction
            "target-arrow-color": "#DC143C",
          },
        },
      ],
      layout: {
        name: "cola",
        animate: true,
        nodeDimensionsIncludeLabels: true,
        refresh: 1,
        fit: true,
        padding: 30,
        nodeSpacing: function (node) {
          return 20;
        },
        edgeLength: function (edge) {
          return 100;
        },
      },
    });

     
    cyRef.current.on("tap", "node", function (evt) {
      const node = evt.target;
      console.log("Clicked node:", node.data());
    });

    return () => {
      if (cyRef.current) {
        cyRef.current.destroy();
      }
    };
  }, [graphData]);

  if (!graphData || !graphData.nodes || graphData.nodes.length === 0) {
    return (
      <div className="h-[500px] flex items-center justify-center bg-slate-900 border border-slate-800 rounded-lg">
        <p className="text-slate-400">
          Select a user or transaction to view their graph relationships
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg shadow">
      <div className="p-4 border-b border-slate-800">
        <h2 className="text-xl font-semibold text-slate-100">
          Graph Visualization
          <span className="text-sm text-slate-400 ml-2">
            ({graphData.nodes.length} nodes, {graphData.edges.length} edges)
          </span>
        </h2>
      </div>
      <div ref={containerRef} className="h-[500px]" />
      <div className="p-4 bg-slate-900 rounded-b-lg border-t border-slate-800">
        <div className="flex flex-wrap gap-4 text-slate-300">
          <div className="flex items-center">
            <div className="w-4 h-4 rounded-full bg-[#4169E1] mr-2"></div>
            <span className="text-sm">User</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-[#228B22] transform rotate-45 mr-2"></div>
            <span className="text-sm">Transaction</span>
          </div>
          <div className="flex items-center">
            <div className="w-8 h-0.5 bg-[#228B22] mr-2"></div>
            <span className="text-sm">Transaction Link</span>
          </div>
          <div className="flex items-center">
            <div className="w-8 h-0.5 bg-[#4169E1] mr-2"></div>
            <span className="text-sm">Shared Attribute</span>
          </div>
          <div className="flex items-center">
            <div className="w-8 h-0.5 bg-[#DC143C] mr-2"></div>
            <span className="text-sm">Shared Transaction</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GraphVisualization;
