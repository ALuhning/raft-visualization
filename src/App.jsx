import React from 'react';
import NetworkGraph from './components/NetworkGraph.jsx';

/**
 * The top-level component for the network visualization app. It simply
 * renders the NetworkGraph component which takes care of loading the
 * relationship data and rendering the interactive graph.
 */
function App() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <NetworkGraph />
    </div>
  );
}

export default App;