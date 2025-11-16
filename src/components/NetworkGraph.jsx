import React, { useEffect, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import Papa from 'papaparse';

/**
 * NetworkGraph component
 *
 * This component loads relationship data from a CSV file, constructs a
 * network graph, and renders it using the ForceGraph2D component. The
 * graph nodes correspond to the actors listed in the CSV and the links
 * represent their interactions. Relationship types and tensions are
 * displayed as tooltips on the links.
 */
const NetworkGraph = () => {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [selectedNode, setSelectedNode] = useState(null);
  const [nodeEdges, setNodeEdges] = useState([]);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [showUploadMenu, setShowUploadMenu] = useState(false);
  const [, setTick] = useState(0);

  // Animation loop for pulsing effect on selected node
  useEffect(() => {
    if (selectedNode) {
      const interval = setInterval(() => {
        setTick(t => t + 1);
      }, 50); // Update every 50ms for smooth animation
      return () => clearInterval(interval);
    }
  }, [selectedNode]);

  // Function to determine if a node is friendly or adversary
  const getNodeType = (id) => {
    const nodeId = parseInt(id, 10);
    if ((nodeId >= 1 && nodeId <= 17) || nodeId === 33) {
      return 'friendly';
    } else if (nodeId >= 18 && nodeId <= 32) {
      return 'adversary';
    }
    return 'neutral';
  };

  // Generate color based on node type and ID
  const getNodeColor = (id) => {
    const nodeId = parseInt(id, 10);
    const type = getNodeType(id);
    
    if (type === 'friendly') {
      // Different shades of blue (17 friendly nodes + node 33)
      const friendlyIds = [...Array(17).keys()].map(i => i + 1).concat([33]);
      const index = friendlyIds.indexOf(nodeId);
      const hue = 210; // Blue hue
      const lightness = 30 + (index * 3); // Vary lightness from 30% to 75%
      return `hsl(${hue}, 70%, ${lightness}%)`;
    } else if (type === 'adversary') {
      // Different shades of red (15 adversary nodes)
      const index = nodeId - 18;
      const hue = 0; // Red hue
      const lightness = 30 + (index * 3); // Vary lightness from 30% to 75%
      return `hsl(${hue}, 70%, ${lightness}%)`;
    }
    return '#888888';
  };

  // Draw icon based on node type
  const drawNodeIcon = (node, ctx, globalScale) => {
    const size = 10;
    const type = getNodeType(node.id);
    
    ctx.fillStyle = node.color;
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1.5;

    if (type === 'friendly') {
      // NATO Friendly - Rectangle (Blue)
      const nodeId = parseInt(node.id, 10);
      
      // Draw rectangle frame
      ctx.fillStyle = node.color;
      ctx.fillRect(node.x - size, node.y - size * 0.6, size * 2, size * 1.2);
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(node.x - size, node.y - size * 0.6, size * 2, size * 1.2);
      
      // Add symbol inside based on type
      ctx.fillStyle = '#000';
      ctx.font = `bold ${size * 1.2}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Determine symbol based on node category or ID
      if (nodeId >= 1 && nodeId <= 7) {
        // Nations/Multilateral - use flag/headquarters symbol
        ctx.fillText('⚑', node.x, node.y);
      } else if (nodeId >= 8 && nodeId <= 17) {
        // US System Actors - use unit symbol
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.strokeRect(node.x - size * 0.5, node.y - size * 0.4, size, size * 0.8);
      } else if (nodeId === 33) {
        // Operational actor
        ctx.fillText('×', node.x, node.y);
      }
      
    } else if (type === 'adversary') {
      // NATO Hostile - Diamond frame (Red)
      const nodeId = parseInt(node.id, 10);
      
      // Draw diamond frame
      ctx.beginPath();
      ctx.moveTo(node.x, node.y - size);
      ctx.lineTo(node.x + size * 1.3, node.y);
      ctx.lineTo(node.x, node.y + size);
      ctx.lineTo(node.x - size * 1.3, node.y);
      ctx.closePath();
      ctx.fillStyle = node.color;
      ctx.fill();
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      
      // Add echelon/modifier inside
      ctx.fillStyle = '#000';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1.2;
      
      if (nodeId === 18 || nodeId === 19 || nodeId === 20 || nodeId === 21) {
        // Regime entities - command post symbol (circle with line)
        ctx.beginPath();
        ctx.arc(node.x, node.y, size * 0.4, 0, 2 * Math.PI);
        ctx.stroke();
      } else if ([22, 23, 24].includes(nodeId)) {
        // Criminal/Irregular - curved line symbol
        ctx.beginPath();
        ctx.arc(node.x, node.y, size * 0.5, 0.5, Math.PI - 0.5);
        ctx.stroke();
      } else if ([25, 26, 27].includes(nodeId)) {
        // Proxy/Terror groups - asterisk
        ctx.font = `bold ${size * 1.2}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('*', node.x, node.y);
      } else if ([28, 29, 30, 31, 32].includes(nodeId)) {
        // External state actors - double bar
        ctx.beginPath();
        ctx.moveTo(node.x - size * 0.5, node.y - size * 0.2);
        ctx.lineTo(node.x + size * 0.5, node.y - size * 0.2);
        ctx.moveTo(node.x - size * 0.5, node.y + size * 0.2);
        ctx.lineTo(node.x + size * 0.5, node.y + size * 0.2);
        ctx.stroke();
      }
      
    } else {
      // Neutral/Unknown - Circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, size * 0.8, 0, 2 * Math.PI, false);
      ctx.fillStyle = node.color;
      ctx.fill();
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  };

  useEffect(() => {
    // Function to load and parse CSV data
    const loadCSVData = (csvContent) => {
      const { data } = Papa.parse(csvContent, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: false,
      });

      // Build a list of nodes from the CSV data. Each node has an id and
      // a name. We could include additional properties here if desired.
      const nodes = data.map((row) => {
        const nodeId = row['Serial'];
        return {
          id: nodeId,
          name: row['Actor'],
          category: row['Category'],
          description: row['ActorDescription'],
          relevance: row['Relevance'],
          color: getNodeColor(nodeId),
        };
      });

      // Construct the list of links. For each row in the CSV, we look
      // at the "InteractsWithSerials" column which may contain semicolon-
      // separated values or ranges (e.g., "1-5"). For each listed id,
      // we create a link object with relationship and tension metadata.
      const links = [];
      data.forEach((row) => {
        const sourceId = row['Serial'];
        let interacts = row['InteractsWithSerials'];
        if (interacts) {
          // Normalize en dashes to hyphens to make range parsing easier.
          interacts = interacts.replace(/–/g, '-');
          // Split the string on semicolons to handle multiple entries.
          interacts.split(';').forEach((item) => {
            const trimmed = item.trim();
            if (!trimmed) return;
            // Handle ranges like "1-5" by creating a link for each id in the range.
            if (trimmed.includes('-')) {
              const [startStr, endStr] = trimmed.split('-').map((s) => s.trim());
              const startNum = parseInt(startStr, 10);
              const endNum = parseInt(endStr, 10);
              if (!isNaN(startNum) && !isNaN(endNum)) {
                for (let i = startNum; i <= endNum; i++) {
                  links.push({
                    source: sourceId,
                    target: String(i),
                    relationship: row['RelationshipType'],
                    tension: row['Tensions'],
                  });
                }
              }
            } else {
              // Single id case.
              const targetId = trimmed;
              links.push({
                source: sourceId,
                target: targetId,
                relationship: row['RelationshipType'],
                tension: row['Tensions'],
              });
            }
          });
        }
      });

      // Optionally, we could deduplicate links here. In some cases
      // interactions are defined in both directions in the CSV. ForceGraph2D
      // can handle duplicate links, but removing duplicates can make the
      // visualization cleaner. We'll deduplicate based on source and target.
      const uniqueLinks = [];
      const linkSet = new Set();
      links.forEach((link) => {
        const key = `${link.source}->${link.target}`;
        if (!linkSet.has(key)) {
          linkSet.add(key);
          uniqueLinks.push(link);
        }
      });

      setGraphData({ nodes, links: uniqueLinks });
    };

    if (uploadedFile) {
      // If user uploaded a file, read and parse it
      const reader = new FileReader();
      reader.onload = (e) => {
        loadCSVData(e.target.result);
      };
      reader.readAsText(uploadedFile);
    } else {
      // Load default CSV file
      const csvUrl = new URL('../data/relationships1_fixed.csv', import.meta.url);
      fetch(csvUrl)
        .then((response) => response.text())
        .then((csv) => {
          loadCSVData(csv);
        });
    }
  }, [uploadedFile]);

  const handleNodeClick = (node) => {
    setSelectedNode(node);
    
    // Find all edges connected to this node
    const connectedEdges = graphData.links.filter(
      (link) => link.source.id === node.id || link.target.id === node.id
    );
    
    // Format edge information
    const edgeInfo = connectedEdges.map((link) => {
      const isSource = link.source.id === node.id;
      const otherNode = isSource ? link.target : link.source;
      const direction = isSource ? 'to' : 'from';
      
      return {
        direction,
        otherNodeId: otherNode.id,
        otherNodeName: otherNode.name,
        otherNodeCategory: otherNode.category,
        relationship: link.relationship,
        tension: link.tension,
      };
    });
    
    setNodeEdges(edgeInfo);
  };

  const handleBackgroundClick = () => {
    setSelectedNode(null);
    setNodeEdges([]);
  };

  // Generate enhanced actor description based on relationships
  const generateEnhancedDescription = (node) => {
    if (!node) return '';
    
    const outgoingEdges = nodeEdges.filter(e => e.direction === 'to');
    const incomingEdges = nodeEdges.filter(e => e.direction === 'from');
    
    let enhanced = `${node.description || 'No description available.'}\n\n`;
    
    if (node.relevance) {
      enhanced += `**Strategic Relevance:** ${node.relevance}\n\n`;
    }
    
    if (outgoingEdges.length > 0 || incomingEdges.length > 0) {
      enhanced += `**Network Position:** `;
      
      if (outgoingEdges.length > 0 && incomingEdges.length > 0) {
        enhanced += `${node.name} serves as a key intermediary node, actively engaging ${outgoingEdges.length} entities while being influenced by ${incomingEdges.length} actors. `;
      } else if (outgoingEdges.length > 0) {
        enhanced += `${node.name} projects influence toward ${outgoingEdges.length} entities. `;
      } else {
        enhanced += `${node.name} receives influence from ${incomingEdges.length} actors. `;
      }
      
      // Categorize connections
      const categories = {};
      [...outgoingEdges, ...incomingEdges].forEach(edge => {
        const cat = edge.otherNodeCategory || 'Other';
        categories[cat] = (categories[cat] || 0) + 1;
      });
      
      const catSummary = Object.entries(categories)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([cat, count]) => `${count} ${cat}`)
        .join(', ');
      
      if (catSummary) {
        enhanced += `Primary connections include: ${catSummary}.`;
      }
    }
    
    return enhanced;
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'text/csv') {
      setUploadedFile(file);
      setSelectedNode(null);
      setNodeEdges([]);
    } else {
      alert('Please upload a valid CSV file');
    }
  };

  const handleResetToDefault = () => {
    setUploadedFile(null);
    setSelectedNode(null);
    setNodeEdges([]);
  };

  const downloadTemplate = () => {
    const templateContent = `Serial,Category,Actor,ActorDescription,InteractsWithSerials,RelationshipType,Tensions,Relevance
1,Category1,Actor1,"Description of actor 1",2;3,"Type of relationship","Potential tensions","Why this actor matters"
2,Category2,Actor2,"Description of actor 2",1;3,"Type of relationship","Potential tensions","Why this actor matters"
3,Category3,Actor3,"Description of actor 3",1;2,"Type of relationship","Potential tensions","Why this actor matters"`;
    
    const blob = new Blob([templateContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'network_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Format markdown text to HTML
  const formatMarkdown = (text) => {
    if (!text) return '';
    
    // Convert **bold** to <strong>
    let formatted = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    
    // Convert line breaks
    formatted = formatted.replace(/\n/g, '<br/>');
    
    return formatted;
  };

  return (
    <div style={{ 
      position: 'relative', 
      width: '100%', 
      height: '100%',
    }}>
      {/* Background map layer */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: `url(${new URL('../data/Americas.svg', import.meta.url).href})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        opacity: 0.15,
        pointerEvents: 'none',
        zIndex: 0,
      }} />
      
      {/* Header with Logo */}
      <div style={{
        position: 'absolute',
        top: '0',
        left: '0',
        right: '0',
        height: '90px',
        background: 'linear-gradient(135deg, #0f2537 0%, #1a4063 100%)',
        borderBottom: '4px solid #d4af37',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        zIndex: 1001,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 32px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <img 
            src={new URL('../data/whemcom.png', import.meta.url).href}
            alt="WHEMCOM" 
            style={{ height: '70px', filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))' }}
          />
          <div style={{ 
            borderLeft: '3px solid rgba(212, 175, 55, 0.5)', 
            paddingLeft: '24px',
            height: '60px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}>
            <h1 style={{ 
              margin: '0', 
              fontSize: '32px', 
              color: '#ffffff', 
              fontWeight: '700',
              letterSpacing: '1px',
              textShadow: '2px 2px 4px rgba(0, 0, 0, 0.4)'
            }}>
              RAFT Visualization
            </h1>
            <p style={{ 
              margin: '6px 0 0 0', 
              fontSize: '14px', 
              color: 'rgba(255, 255, 255, 0.85)',
              fontWeight: '400',
              letterSpacing: '0.5px'
            }}>
              Relationship Analysis & Force Topology
            </p>
          </div>
        </div>
        
        {/* Upload CSV Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowUploadMenu(!showUploadMenu)}
            style={{
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              background: 'linear-gradient(135deg, #d4af37 0%, #c4a137 100%)',
              color: '#0f2537',
              border: 'none',
              borderRadius: '8px',
              boxShadow: '0 3px 8px rgba(212, 175, 55, 0.4)',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 5px 12px rgba(212, 175, 55, 0.6)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 3px 8px rgba(212, 175, 55, 0.4)';
            }}
          >
            <span style={{ fontSize: '16px' }}>📊</span>
            <span>Upload Dataset</span>
            <span style={{ fontSize: '10px' }}>{showUploadMenu ? '▼' : '▶'}</span>
          </button>
          
          {showUploadMenu && (
            <div style={{
              position: 'absolute',
              top: '60px',
              right: '0',
              backgroundColor: '#ffffff',
              border: '2px solid #d4af37',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
              zIndex: 1002,
              minWidth: '420px',
            }}>
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', color: '#0f2537', fontWeight: '600' }}>
                  Upload Custom Dataset
                </h3>
                <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#555', lineHeight: '1.5' }}>
                  Upload a CSV file with the following columns:
                </p>
                <ul style={{ margin: '0 0 16px 0', paddingLeft: '20px', fontSize: '12px', color: '#444', lineHeight: '1.8' }}>
                  <li><strong>Serial</strong> - Unique node ID (number)</li>
                  <li><strong>Category</strong> - Node category/type</li>
                  <li><strong>Actor</strong> - Node name/label</li>
                  <li><strong>ActorDescription</strong> - Detailed description</li>
                  <li><strong>InteractsWithSerials</strong> - Semicolon-separated IDs (e.g., "1;2;3" or "1;5;10")</li>
                  <li><strong>RelationshipType</strong> - Type of relationship</li>
                  <li><strong>Tensions</strong> - Relationship tensions/challenges</li>
                  <li><strong>Relevance</strong> - Strategic relevance</li>
                </ul>
              </div>
              
              <button
                onClick={downloadTemplate}
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  marginBottom: '14px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  background: 'linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  boxShadow: '0 2px 6px rgba(46, 125, 50, 0.3)',
                  transition: 'transform 0.2s',
                }}
                onMouseEnter={(e) => e.target.style.transform = 'translateY(-1px)'}
                onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
              >
                📥 Download CSV Template
              </button>
              
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                style={{ marginBottom: '14px', fontSize: '13px', width: '100%', padding: '8px' }}
              />
              
              {uploadedFile && (
                <div style={{ 
                  padding: '12px', 
                  background: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)',
                  border: '1px solid #81c784',
                  borderRadius: '6px',
                  marginBottom: '10px'
                }}>
                  <div style={{ fontSize: '13px', color: '#1b5e20', marginBottom: '10px', fontWeight: '500' }}>
                    ✓ Current file: <strong>{uploadedFile.name}</strong>
                  </div>
                  <button
                    onClick={handleResetToDefault}
                    style={{
                      width: '100%',
                      padding: '8px 14px',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      boxShadow: '0 2px 6px rgba(245, 124, 0, 0.3)',
                    }}
                  >
                    Reset to Default Dataset
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <ForceGraph2D
        graphData={graphData}
        nodeId="id"
        nodeLabel={(node) => node.name}
        // Display a tooltip on the link showing relationship and tensions.
        linkLabel={(link) => `${link.relationship}\n${link.tension}`}
        nodeColor={(node) => node.color}
        // Add arrows to the end of links to indicate directionality.
        linkDirectionalArrowLength={6}
        linkDirectionalArrowRelPos={1}
        // Provide some padding so the graph does not overlap the header.
        width={window.innerWidth}
        height={window.innerHeight - 90}
        backgroundColor="rgba(0,0,0,0)"
        enablePointerInteraction={true}
          // Start zoomed in for better initial view
          d3VelocityDecay={0.3}
        cooldownTicks={100}
        onEngineStop={() => {
          // Auto-zoom to fit with padding after initial layout
          if (window.fgRef) {
            window.fgRef.zoomToFit(400, 80);
          }
        }}
        ref={(ref) => { 
          window.fgRef = ref;
          // Ensure the canvas is properly layered and clickable
          if (ref && ref._ctx && ref._ctx.canvas) {
            ref._ctx.canvas.style.position = 'relative';
            ref._ctx.canvas.style.zIndex = '1';
            ref._ctx.canvas.style.cursor = 'pointer';
          }
        }}
        nodeCanvasObject={(node, ctx, globalScale) => {
          // Draw the icon
          drawNodeIcon(node, ctx, globalScale);

          // Highlight selected node with pulsing glow
          if (selectedNode && selectedNode.id === node.id) {
            const time = Date.now() / 1000;
            const pulse = Math.sin(time * 3) * 0.5 + 0.5; // Oscillates between 0 and 1
            const glowSize = 15 + pulse * 5;
            
            // Draw pulsing glow
            const gradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, glowSize);
            gradient.addColorStop(0, `rgba(255, 215, 0, ${0.6 * pulse})`);
            gradient.addColorStop(0.5, `rgba(255, 215, 0, ${0.3 * pulse})`);
            gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(node.x, node.y, glowSize, 0, 2 * Math.PI);
            ctx.fill();
            
            // Draw selection ring
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(node.x, node.y, 12, 0, 2 * Math.PI);
            ctx.stroke();
          }

          // Draw label
          const label = node.name;
          const fontSize = 12 / globalScale;
          ctx.font = `${fontSize}px Sans-Serif`;
          const textWidth = ctx.measureText(label).width;
          const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2);

          // Draw label background
          ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
          ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y + 12, bckgDimensions[0], bckgDimensions[1]);

          // Draw label text
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          ctx.fillStyle = 'black';
          ctx.fillText(label, node.x, node.y + 13);
        }}
        nodePointerAreaPaint={(node, color, ctx) => {
          const size = 10;
          const type = getNodeType(node.id);
          
          ctx.fillStyle = color;
          
          if (type === 'friendly') {
            // Rectangle - same as visual
            ctx.fillRect(node.x - size - 2, node.y - size * 0.6 - 2, size * 2 + 4, size * 1.2 + 4);
          } else if (type === 'adversary') {
            // Diamond - same as visual
            ctx.beginPath();
            ctx.moveTo(node.x, node.y - size - 2);
            ctx.lineTo(node.x + size * 1.3 + 2, node.y);
            ctx.lineTo(node.x, node.y + size + 2);
            ctx.lineTo(node.x - size * 1.3 - 2, node.y);
            ctx.closePath();
            ctx.fill();
          } else {
            // Circle for neutral
            ctx.beginPath();
            ctx.arc(node.x, node.y, size + 2, 0, 2 * Math.PI, false);
            ctx.fill();
          }
        }}
        onNodeClick={handleNodeClick}
        onBackgroundClick={handleBackgroundClick}
      />
      
      {selectedNode && (
        <>
          {/* Actor Description Box - Left Side */}
          <div style={{
            position: 'absolute',
            top: '110px',
            left: '20px',
            backgroundColor: 'white',
            border: '2px solid #d4af37',
            borderRadius: '10px',
            padding: '18px',
            maxWidth: '450px',
            maxHeight: 'calc(100vh - 130px)',
            overflowY: 'auto',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            zIndex: 1000,
          }}>
            <div style={{ marginBottom: '12px', borderBottom: '2px solid #1a3a5c', paddingBottom: '8px' }}>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', color: '#1a3a5c' }}>
                Actor Profile
              </h3>
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#333' }}>
                #{selectedNode.id} - {selectedNode.name}
              </div>
              {selectedNode.category && (
                <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
                  Category: {selectedNode.category}
                </div>
              )}
            </div>
            
            <div 
              style={{ fontSize: '13px', lineHeight: '1.6' }}
              dangerouslySetInnerHTML={{ __html: formatMarkdown(generateEnhancedDescription(selectedNode)) }}
            />
          </div>

          {/* Relationships Box */}
          <div style={{
            position: 'absolute',
            top: '110px',
            right: '20px',
            backgroundColor: 'white',
            border: '2px solid #333',
            borderRadius: '10px',
            padding: '16px',
            width: '450px',
            height: 'calc(100vh - 130px)',
            overflowY: 'auto',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            zIndex: 1000,
          }}>
            <div style={{ marginBottom: '12px', borderBottom: '2px solid #333', paddingBottom: '8px' }}>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '18px' }}>
                Relationships & Tensions
              </h3>
              <button 
                onClick={handleBackgroundClick}
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  padding: '0',
                  width: '24px',
                  height: '24px',
                }}
              >
                ×
              </button>
            </div>
            
            <div style={{ fontSize: '14px' }}>
              <strong>Connections: {nodeEdges.length}</strong>
              <div style={{ marginTop: '12px' }}>
                {nodeEdges.map((edge, index) => (
                  <div 
                    key={index} 
                    style={{
                      marginBottom: '12px',
                      padding: '8px',
                      backgroundColor: '#f5f5f5',
                      borderRadius: '4px',
                    }}
                  >
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                      {edge.direction === 'to' ? '→' : '←'} #{edge.otherNodeId} - {edge.otherNodeName}
                    </div>
                    {edge.otherNodeCategory && (
                      <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>
                        {edge.otherNodeCategory}
                      </div>
                    )}
                    <div style={{ fontSize: '12px', marginTop: '4px' }}>
                      <strong>Relationship:</strong> {edge.relationship || 'N/A'}
                    </div>
                    <div style={{ fontSize: '12px', marginTop: '4px' }}>
                      <strong>Tensions:</strong> {edge.tension || 'N/A'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Legend */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        backgroundColor: 'white',
        border: '2px solid #d4af37',
        borderRadius: '10px',
        padding: '16px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        zIndex: 1000,
        minWidth: '300px',
      }}>
        <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#0f2537', fontWeight: '600', borderBottom: '2px solid #d4af37', paddingBottom: '8px' }}>
          Symbology Legend
        </h4>
        
        {/* Friendly Entities */}
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '13px', fontWeight: '600', color: '#0f2537', marginBottom: '6px' }}>
            Friendly Forces (Nodes 1-17, 33)
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingLeft: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="24" height="18" viewBox="-12 -9 24 18">
                <rect x="-10" y="-6" width="20" height="12" fill="hsl(210, 70%, 50%)" stroke="#000" strokeWidth="1.5"/>
                <text x="0" y="2" fontSize="12" textAnchor="middle" fill="#000">⚑</text>
              </svg>
              <span style={{ fontSize: '11px', color: '#555' }}>Nations/Multilateral Orgs (1-7)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="24" height="18" viewBox="-12 -9 24 18">
                <rect x="-10" y="-6" width="20" height="12" fill="hsl(210, 70%, 55%)" stroke="#000" strokeWidth="1.5"/>
                <rect x="-5" y="-4" width="10" height="8" fill="none" stroke="#000" strokeWidth="1"/>
              </svg>
              <span style={{ fontSize: '11px', color: '#555' }}>US System Actors (8-17)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="24" height="18" viewBox="-12 -9 24 18">
                <rect x="-10" y="-6" width="20" height="12" fill="hsl(210, 70%, 60%)" stroke="#000" strokeWidth="1.5"/>
                <text x="0" y="2" fontSize="14" fontWeight="bold" textAnchor="middle" fill="#000">×</text>
              </svg>
              <span style={{ fontSize: '11px', color: '#555' }}>Operational Forces (33)</span>
            </div>
          </div>
        </div>

        {/* Adversary Entities */}
        <div>
          <div style={{ fontSize: '13px', fontWeight: '600', color: '#0f2537', marginBottom: '6px' }}>
            Hostile Forces (Nodes 18-32)
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingLeft: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="24" height="20" viewBox="-12 -10 24 20">
                <path d="M0,-10 L13,0 L0,10 L-13,0 Z" fill="hsl(0, 70%, 50%)" stroke="#000" strokeWidth="1.5"/>
                <circle cx="0" cy="0" r="4" fill="none" stroke="#000" strokeWidth="1.2"/>
              </svg>
              <span style={{ fontSize: '11px', color: '#555' }}>Regime Command (18-21)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="24" height="20" viewBox="-12 -10 24 20">
                <path d="M0,-10 L13,0 L0,10 L-13,0 Z" fill="hsl(0, 70%, 55%)" stroke="#000" strokeWidth="1.5"/>
                <path d="M0,-5 Q5,0 0,5" fill="none" stroke="#000" strokeWidth="1.2"/>
              </svg>
              <span style={{ fontSize: '11px', color: '#555' }}>Irregular/TCO (22-24)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="24" height="20" viewBox="-12 -10 24 20">
                <path d="M0,-10 L13,0 L0,10 L-13,0 Z" fill="hsl(0, 70%, 60%)" stroke="#000" strokeWidth="1.5"/>
                <text x="0" y="4" fontSize="12" fontWeight="bold" textAnchor="middle" fill="#000">*</text>
              </svg>
              <span style={{ fontSize: '11px', color: '#555' }}>Terror/Proxy Groups (25-27)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="24" height="20" viewBox="-12 -10 24 20">
                <path d="M0,-10 L13,0 L0,10 L-13,0 Z" fill="hsl(0, 70%, 65%)" stroke="#000" strokeWidth="1.5"/>
                <line x1="-5" y1="-2" x2="5" y2="-2" stroke="#000" strokeWidth="1.2"/>
                <line x1="-5" y1="2" x2="5" y2="2" stroke="#000" strokeWidth="1.2"/>
              </svg>
              <span style={{ fontSize: '11px', color: '#555' }}>State Adversaries (28-32)</span>
            </div>
          </div>
        </div>
        
        <div style={{ marginTop: '12px', paddingTop: '8px', borderTop: '1px solid #ddd', fontSize: '10px', color: '#666', fontStyle: 'italic' }}>
          Based on NATO APP-6 Military Symbology
        </div>
      </div>
    </div>
  );
};

export default NetworkGraph;