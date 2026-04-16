import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Mail, Lock, Eye, EyeOff, Zap, ArrowRight, Sparkles } from 'lucide-react';

export function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate login
    setTimeout(() => {
      setIsLoading(false);
      navigate('/ai-setup'); // First-time users go to setup
      // Or navigate('/') for returning users
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-[#0a0a0f] to-[#0f0f19] p-4">
      {/* Background Grid */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(rgba(163, 255, 0, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(163, 255, 0, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />

      {/* Glow Effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-4 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/30 mb-6 relative">
            <div className="absolute inset-0 rounded-full bg-primary/10 animate-pulse"></div>
            <Zap className="h-12 w-12 text-primary relative z-10" fill="currentColor" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-2 bg-gradient-to-r from-primary via-[#00d9ff] to-primary bg-clip-text text-transparent">
            WhatsApp Sales Engine
          </h1>
          <p className="text-muted-foreground">AI-powered sales automation platform</p>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl border border-border bg-card/60 backdrop-blur-xl p-8 shadow-2xl">
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-2">Giriş Yap</h2>
            <p className="text-sm text-muted-foreground">Hesabınıza giriş yaparak devam edin</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="text-sm font-semibold mb-2 block">E-posta</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ornek@sirket.com"
                  className="w-full pl-10 pr-4 py-3 rounded-lg bg-input border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="text-sm font-semibold mb-2 block">Şifre</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-12 py-3 rounded-lg bg-input border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-border bg-input checked:bg-primary checked:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
                <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                  Beni hatırla
                </span>
              </label>
              <button
                type="button"
                className="text-sm text-primary hover:underline transition-all"
              >
                Şifremi unuttum
              </button>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-6 py-4 rounded-lg bg-gradient-to-r from-primary via-[#00d9ff] to-primary hover:opacity-90 disabled:opacity-50 text-black font-bold transition-all flex items-center justify-center gap-2 hover:scale-105 shadow-2xl shadow-primary/40"
            >
              {isLoading ? (
                <>
                  <div className="h-5 w-5 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                  Giriş yapılıyor...
                </>
              ) : (
                <>
                  Giriş Yap
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">veya</span>
            </div>
          </div>

          {/* Social Login */}
          <div className="space-y-3">
            <button className="w-full px-4 py-3 rounded-lg border border-border bg-secondary/30 hover:bg-secondary/50 transition-all flex items-center justify-center gap-3 group">
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="font-medium">Google ile giriş yap</span>
            </button>

            <button className="w-full px-4 py-3 rounded-lg border border-border bg-secondary/30 hover:bg-secondary/50 transition-all flex items-center justify-center gap-3 group">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M13.397 20.997v-8.196h2.765l.411-3.209h-3.176V7.548c0-.926.258-1.56 1.587-1.56h1.684V3.127A22.336 22.336 0 0 0 14.201 3c-2.444 0-4.122 1.492-4.122 4.231v2.355H7.332v3.209h2.753v8.202h3.312z"/>
              </svg>
              <span className="font-medium">Facebook ile giriş yap</span>
            </button>
          </div>

          {/* Sign Up Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Hesabınız yok mu?{' '}
              <button className="text-primary hover:underline font-semibold transition-all">
                Ücretsiz kayıt olun
              </button>
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="mt-8 grid grid-cols-3 gap-4">
          {[
            { icon: Sparkles, text: 'AI Powered' },
            { icon: Zap, text: '24/7 Active' },
            { icon: ArrowRight, text: 'Easy Setup' },
          ].map((feature, idx) => (
            <div key={idx} className="flex flex-col items-center gap-2 p-3 rounded-lg bg-card/40 backdrop-blur-sm border border-border/50">
              <feature.icon className="h-5 w-5 text-primary" />
              <span className="text-xs text-muted-foreground">{feature.text}</span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground">
            © 2026 WhatsApp Sales Engine • Prompta AI
          </p>
        </div>
      </div>
    </div>
  );
}
