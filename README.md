# RAFT Visualization

**Relationship Analysis & Force Topology Visualization**

An interactive network visualization tool for analyzing strategic actors and their relationships using NATO military symbology.

## Features

- **NATO Symbology**: Military-standard visual representation of friendly and hostile forces
- **Interactive Graph**: Click nodes to view detailed actor profiles and relationships
- **Custom Datasets**: Upload your own CSV files to visualize different networks
- **Professional UI**: Navy and gold color scheme with comprehensive legend
- **Real-time Analysis**: Enhanced actor descriptions with network position analysis

## Quick Start

### Development

```bash
npm install
npm run dev
```

### Production Build

```bash
npm run build
npm run preview
```

## CSV Format

Upload CSV files with the following columns:

- **Serial** - Unique node ID (number)
- **Category** - Node category/type
- **Actor** - Node name/label
- **ActorDescription** - Detailed description
- **InteractsWithSerials** - Semicolon-separated IDs (e.g., "1;2;3")
- **RelationshipType** - Type of relationship
- **Tensions** - Relationship tensions/challenges
- **Relevance** - Strategic relevance

## Deployment

### Railway

This project is configured for Railway deployment. Simply connect your GitHub repository and Railway will automatically:
- Install dependencies
- Build the project
- Deploy using the start script

### Environment Variables

No environment variables required for basic deployment.

## Technology Stack

- React 18
- Vite
- react-force-graph-2d
- PapaParse (CSV parsing)

## License

Proprietary - All rights reserved
