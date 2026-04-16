import { Outlet, Link, useLocation, useNavigate } from 'react-router';
import {
  Brain,
  Bot,
  ChartSpline,
  GitBranch,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Smartphone,
  Sparkles,
  User,
  Users,
  Zap,
} from 'lucide-react';
import { NotificationBell } from './notifications/NotificationBell';

interface NavigationItem {
  name: string;
  href: string;
  icon: typeof LayoutDashboard;
  helper?: string;
}

const navigationGroups: Array<{ label: string; items: NavigationItem[] }> = [
  {
    label: 'Operasyon',
    items: [
      {
        name: 'Dashboard',
        href: '/',
        icon: LayoutDashboard,
        helper: 'Genel durum',
      },
      {
        name: 'Live Chat',
        href: '/chat',
        icon: MessageSquare,
        helper: 'Canli konusmalar',
      },
      {
        name: 'Lead Management',
        href: '/leads',
        icon: Users,
        helper: 'Mini CRM',
      },
    ],
  },
  {
    label: 'AI ve Icgoru',
    items: [
      {
        name: 'Analytics',
        href: '/analytics',
        icon: ChartSpline,
        helper: 'Performans',
      },
      {
        name: 'AI Knowledge',
        href: '/ai-knowledge',
        icon: Brain,
        helper: 'Brand training',
      },
      {
        name: 'Automation',
        href: '/automation',
        icon: GitBranch,
        helper: 'Akis yonetimi',
      },
    ],
  },
  {
    label: 'Kurulum',
    items: [
      {
        name: 'WhatsApp Connection',
        href: '/connection',
        icon: Smartphone,
        helper: 'Baglanti durumu',
      },
      {
        name: 'AI Setup',
        href: '/ai-setup',
        icon: Bot,
        helper: 'Onboarding',
      },
    ],
  },
];

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentItem =
    navigationGroups
      .flatMap((group) => group.items)
      .find((item) => item.href === location.pathname) ?? null;

  const handleLogout = () => {
    // Clear any auth tokens/session data here
    navigate('/login');
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className="hidden w-80 border-r border-border bg-gradient-to-b from-[#0f0f19] to-[#0a0a0f] backdrop-blur-xl xl:block">
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
          <nav className="flex-1 space-y-5 px-3 py-4">
            {navigationGroups.map((group) => (
              <section key={group.label} className="space-y-2">
                <h2 className="px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {group.label}
                </h2>
                <div className="space-y-1">
                  {group.items.map((item) => {
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
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium">{item.name}</p>
                          {item.helper ? (
                            <p className="truncate text-xs text-muted-foreground">
                              {item.helper}
                            </p>
                          ) : null}
                        </div>
                        {isActive && (
                          <div className="h-2 w-2 rounded-full bg-primary shadow-lg shadow-primary/50"></div>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </section>
            ))}
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
        <div className="sticky top-0 z-40 border-b border-border bg-card/85 px-4 py-3 backdrop-blur">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                {currentItem?.helper ?? 'Operations'}
              </p>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">
                  {currentItem?.name ?? 'WhatsApp Sales Engine'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <NotificationBell />
              <Link
                to="/chat"
                className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-black"
              >
                Live Chat
              </Link>
            </div>
          </div>
        </div>
        <Outlet />
      </main>
    </div>
  );
}
