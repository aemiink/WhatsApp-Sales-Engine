import { Outlet, Link, useLocation, useNavigate } from 'react-router';
import { LayoutDashboard, MessageSquare, GitBranch, Brain, Users, TrendingUp, Smartphone, Zap, Sparkles, LogOut, User } from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Live Chat', href: '/chat', icon: MessageSquare },
  { name: 'Automation', href: '/automation', icon: GitBranch },
  { name: 'AI Knowledge', href: '/ai-knowledge', icon: Brain },
  { name: 'Leads', href: '/leads', icon: Users },
  { name: 'Analytics', href: '/analytics', icon: TrendingUp },
  { name: 'Connection', href: '/connection', icon: Smartphone },
];

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    // Clear any auth tokens/session data here
    navigate('/login');
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-gradient-to-b from-[#0f0f19] to-[#0a0a0f] backdrop-blur-xl">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex items-center gap-3 border-b border-border px-6 py-5">
            <div className="relative">
              <Zap className="h-8 w-8 text-primary" fill="currentColor" />
              <div className="absolute inset-0 blur-lg opacity-50 bg-primary"></div>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-primary">
                WhatsApp
              </h1>
              <p className="text-xs text-muted-foreground">Sales Engine</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`
                    group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200
                    ${
                      isActive
                        ? 'bg-primary/10 text-primary shadow-lg shadow-primary/20'
                        : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                    }
                  `}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="font-medium">{item.name}</span>
                  {isActive && (
                    <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary shadow-lg shadow-primary/50"></div>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="border-t border-border px-4 py-4 space-y-3">
            {/* AI Status */}
            <div className="flex items-center gap-3 rounded-lg bg-gradient-to-r from-primary/10 via-[#00d9ff]/10 to-primary/10 px-3 py-2.5 border border-primary/20">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse shadow-lg shadow-primary/50"></div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-foreground">AI Trained & Active</p>
                <p className="text-xs text-muted-foreground">Brand-aware responses</p>
              </div>
            </div>

            {/* Retrain Button */}
            <Link
              to="/ai-setup"
              className="w-full px-3 py-2 rounded-lg bg-secondary/50 hover:bg-secondary text-xs font-medium transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="h-3 w-3" />
              Retrain AI
            </Link>

            {/* User Profile */}
            <div className="pt-3 border-t border-border">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/30 flex items-center justify-center">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">demo@prompta.ai</p>
                  <p className="text-xs text-muted-foreground">Premium Plan</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full px-3 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-medium transition-all flex items-center justify-center gap-2"
              >
                <LogOut className="h-3 w-3" />
                Çıkış Yap
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
