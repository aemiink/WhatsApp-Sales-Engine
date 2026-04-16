import { useState } from 'react';
import { Plus, MessageSquare, HelpCircle, GitBranch, Package, AlertTriangle, UserCog, Save, Play, Settings, Sparkles, Target } from 'lucide-react';

type NodeType = 'welcome' | 'question' | 'condition' | 'product' | 'objection' | 'handoff' | 'ai-suggestion' | 'product-recommend';

interface FlowNode {
  id: string;
  type: NodeType;
  title: string;
  content: string;
  x: number;
  y: number;
}

const initialNodes: FlowNode[] = [
  { id: '1', type: 'welcome', title: 'Welcome Message', content: 'Merhaba! Size nasıl yardımcı olabilirim?', x: 100, y: 100 },
  { id: '2', type: 'ai-suggestion', title: 'AI Intent Detection', content: 'Analyze customer intent using brand context', x: 100, y: 250 },
  { id: '3', type: 'condition', title: 'Check Response', content: 'Premium / Standard / Diğer', x: 100, y: 400 },
  { id: '4', type: 'product-recommend', title: 'Smart Product Match', content: 'AI recommends best product based on needs', x: 300, y: 550 },
  { id: '5', type: 'objection', title: 'Brand-Aware Objection Handler', content: 'Handle objection using brand tone & strategy', x: 500, y: 400 },
  { id: '6', type: 'handoff', title: 'Human Takeover', content: 'Temsilciye aktar', x: 300, y: 700 },
];

const nodeColors = {
  welcome: 'from-primary/20 to-primary/10 border-primary/30 text-primary',
  question: 'from-blue-500/20 to-blue-500/10 border-blue-500/30 text-blue-400',
  condition: 'from-purple-500/20 to-purple-500/10 border-purple-500/30 text-purple-400',
  product: 'from-green-500/20 to-green-500/10 border-green-500/30 text-green-400',
  objection: 'from-red-500/20 to-red-500/10 border-red-500/30 text-red-400',
  handoff: 'from-orange-500/20 to-orange-500/10 border-orange-500/30 text-orange-400',
  'ai-suggestion': 'from-cyan-500/20 to-cyan-500/10 border-cyan-500/30 text-cyan-400',
  'product-recommend': 'from-yellow-500/20 to-yellow-500/10 border-yellow-500/30 text-yellow-400',
};

const nodeIcons = {
  welcome: MessageSquare,
  question: HelpCircle,
  condition: GitBranch,
  product: Package,
  objection: AlertTriangle,
  handoff: UserCog,
  'ai-suggestion': Sparkles,
  'product-recommend': Target,
};

export function AutomationBuilder() {
  const [nodes, setNodes] = useState<FlowNode[]>(initialNodes);
  const [selectedNode, setSelectedNode] = useState<FlowNode | null>(null);

  return (
    <div className="flex h-screen bg-background">
      {/* Toolbar */}
      <div className="w-64 border-r border-border bg-gradient-to-b from-[#0f0f19]/50 to-background overflow-y-auto">
        <div className="sticky top-0 z-10 border-b border-border bg-card/80 backdrop-blur-xl px-4 py-4">
          <h2 className="text-lg font-bold mb-1">Flow Builder</h2>
          <p className="text-xs text-muted-foreground">Drag nodes to create automation</p>
        </div>

        <div className="p-4 space-y-6">
          {/* Node Types */}
          <div>
            <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Node Types</h3>
            <div className="space-y-2">
              {Object.entries(nodeIcons).map(([type, Icon]) => {
                const label = type === 'ai-suggestion' ? 'AI Suggestion' :
                             type === 'product-recommend' ? 'Product Recommend' :
                             type.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                return (
                  <button
                    key={type}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border bg-gradient-to-br transition-all hover:scale-105 ${
                      nodeColors[type as NodeType]
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-sm font-medium">{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div>
            <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Actions</h3>
            <div className="space-y-2">
              <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-black font-semibold transition-all hover:scale-105">
                <Save className="h-4 w-4" />
                <span className="text-sm">Save Flow</span>
              </button>
              <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-secondary hover:bg-secondary/70 transition-all">
                <Play className="h-4 w-4" />
                <span className="text-sm font-medium">Test Flow</span>
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="rounded-lg border border-border bg-card/60 p-4">
            <h3 className="text-sm font-semibold mb-3">Flow Stats</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Nodes:</span>
                <span className="font-semibold text-primary">{nodes.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Connections:</span>
                <span className="font-semibold">8</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Completion Rate:</span>
                <span className="font-semibold text-green-400">87%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden bg-gradient-to-br from-background via-[#0a0a0f] to-[#0f0f19]">
        {/* Grid Background */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(rgba(163, 255, 0, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(163, 255, 0, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '30px 30px',
          }}
        />

        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 border-b border-border bg-card/80 backdrop-blur-xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">Sales Flow Automation</h1>
              <p className="text-sm text-muted-foreground">Design your AI conversation flow</p>
            </div>
            <div className="flex items-center gap-3">
              <button className="px-4 py-2 rounded-lg bg-secondary hover:bg-secondary/70 text-sm font-medium transition-all flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Settings
              </button>
              <button className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-black font-semibold text-sm transition-all flex items-center gap-2 hover:scale-105 shadow-lg shadow-primary/30">
                <Play className="h-4 w-4" />
                Deploy Flow
              </button>
            </div>
          </div>
        </div>

        {/* Canvas Content */}
        <div className="absolute inset-0 top-[73px] overflow-auto p-12">
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
            {/* Connection Lines */}
            <line key="line-1" x1="180" y1="140" x2="180" y2="250" stroke="rgba(163, 255, 0, 0.3)" strokeWidth="2" />
            <line key="line-2" x1="180" y1="290" x2="180" y2="400" stroke="rgba(163, 255, 0, 0.3)" strokeWidth="2" />
            <line key="line-3" x1="200" y1="440" x2="380" y2="550" stroke="rgba(163, 255, 0, 0.3)" strokeWidth="2" />
            <line key="line-4" x1="200" y1="440" x2="580" y2="400" stroke="rgba(163, 255, 0, 0.3)" strokeWidth="2" />
            <line key="line-5" x1="380" y1="590" x2="380" y2="700" stroke="rgba(163, 255, 0, 0.3)" strokeWidth="2" />
          </svg>

          {/* Flow Nodes */}
          {nodes.map((node) => {
            const Icon = nodeIcons[node.type];
            return (
              <div
                key={node.id}
                onClick={() => setSelectedNode(node)}
                style={{
                  position: 'absolute',
                  left: node.x,
                  top: node.y,
                  zIndex: 10,
                }}
                className={`w-60 rounded-lg border bg-gradient-to-br backdrop-blur-xl p-4 cursor-pointer transition-all hover:scale-105 hover:shadow-2xl ${
                  selectedNode?.id === node.id
                    ? `${nodeColors[node.type]} ring-2 ring-offset-2 ring-offset-background shadow-2xl scale-105`
                    : nodeColors[node.type]
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="h-4 w-4" />
                  <h3 className="font-semibold text-sm">{node.title}</h3>
                </div>
                <p className="text-xs text-foreground/70 line-clamp-2">{node.content}</p>

                {/* Connection Points */}
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 h-4 w-4 rounded-full bg-primary border-2 border-background"></div>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 h-4 w-4 rounded-full bg-primary border-2 border-background"></div>
              </div>
            );
          })}

          {/* Add Node Button */}
          <button className="absolute bottom-8 right-8 h-14 w-14 rounded-full bg-primary hover:bg-primary/90 text-black shadow-2xl shadow-primary/40 flex items-center justify-center transition-all hover:scale-110">
            <Plus className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Properties Panel */}
      <div className="w-80 border-l border-border bg-gradient-to-b from-[#0f0f19]/50 to-background overflow-y-auto">
        <div className="sticky top-0 z-10 border-b border-border bg-card/80 backdrop-blur-xl px-6 py-4">
          <h2 className="text-lg font-bold">
            {selectedNode ? 'Node Properties' : 'Select a Node'}
          </h2>
        </div>

        {selectedNode ? (
          <div className="p-6 space-y-4">
            <div>
              <label className="text-sm font-semibold mb-2 block">Node Type</label>
              <div className={`px-3 py-2 rounded-lg border bg-gradient-to-br ${nodeColors[selectedNode.type]} text-sm font-medium capitalize`}>
                {selectedNode.type}
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold mb-2 block">Title</label>
              <input
                type="text"
                value={selectedNode.title}
                className="w-full px-3 py-2 rounded-lg bg-input border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
              />
            </div>

            <div>
              <label className="text-sm font-semibold mb-2 block">Content</label>
              <textarea
                value={selectedNode.content}
                rows={4}
                className="w-full px-3 py-2 rounded-lg bg-input border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm resize-none"
              />
            </div>

            {selectedNode.type === 'condition' && (
              <div>
                <label className="text-sm font-semibold mb-2 block">Conditions</label>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Condition 1"
                    className="w-full px-3 py-2 rounded-lg bg-input border border-border text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Condition 2"
                    className="w-full px-3 py-2 rounded-lg bg-input border border-border text-sm"
                  />
                  <button className="w-full px-3 py-2 rounded-lg border border-dashed border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary transition-all">
                    + Add Condition
                  </button>
                </div>
              </div>
            )}

            <div className="pt-4 space-y-2">
              <button className="w-full px-4 py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-black font-semibold text-sm transition-all">
                Save Changes
              </button>
              <button className="w-full px-4 py-2.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 font-semibold text-sm transition-all">
                Delete Node
              </button>
            </div>

            <div className="rounded-lg border border-border bg-card/60 p-4">
              <h3 className="text-sm font-semibold mb-3">Node Statistics</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Times Triggered:</span>
                  <span className="font-semibold text-primary">1,248</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Success Rate:</span>
                  <span className="font-semibold text-green-400">92%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Avg. Time:</span>
                  <span className="font-semibold">2.3s</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 flex items-center justify-center h-64">
            <p className="text-sm text-muted-foreground text-center">
              Click on a node to view and edit its properties
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
