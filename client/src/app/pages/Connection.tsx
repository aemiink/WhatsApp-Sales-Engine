import { Smartphone, CheckCircle, XCircle, RefreshCw, QrCode, Zap, Settings, Shield, Link as LinkIcon } from 'lucide-react';

export function Connection() {
  const isConnected = true;
  const connectedNumber = '+90 532 123 4567';
  const businessName = 'Prompta AI Sales';
  const connectionTime = '5 saat önce';

  return (
    <div className="h-full overflow-auto bg-background">
      <div className="mx-auto max-w-4xl p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight mb-2 bg-gradient-to-r from-primary via-[#00d9ff] to-primary bg-clip-text text-transparent">
            WhatsApp Bağlantısı
          </h1>
          <p className="text-muted-foreground">Connect and manage your WhatsApp Business account</p>
        </div>

        {/* Connection Status Card */}
        <div className={`mb-8 rounded-xl border p-8 backdrop-blur-xl transition-all ${
          isConnected
            ? 'border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5 shadow-2xl shadow-primary/20'
            : 'border-border bg-card/60'
        }`}>
          <div className="flex items-start gap-6">
            <div className={`p-4 rounded-full ${
              isConnected
                ? 'bg-primary/20 border-2 border-primary/30'
                : 'bg-secondary border-2 border-border'
            }`}>
              <Smartphone className={`h-12 w-12 ${isConnected ? 'text-primary' : 'text-muted-foreground'}`} />
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold">
                  {isConnected ? 'Bağlantı Aktif' : 'Bağlantı Yok'}
                </h2>
                {isConnected ? (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/20 border border-primary/30">
                    <div className="h-2 w-2 rounded-full bg-primary animate-pulse shadow-lg shadow-primary/50"></div>
                    <span className="text-sm font-semibold text-primary">Connected</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/20 border border-red-500/30">
                    <XCircle className="h-4 w-4 text-red-400" />
                    <span className="text-sm font-semibold text-red-400">Disconnected</span>
                  </div>
                )}
              </div>

              {isConnected ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <span className="text-sm">WhatsApp hesabınız başarıyla bağlandı</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="rounded-lg bg-card/60 border border-border p-4">
                      <p className="text-xs text-muted-foreground mb-1">Phone Number</p>
                      <p className="font-semibold">{connectedNumber}</p>
                    </div>
                    <div className="rounded-lg bg-card/60 border border-border p-4">
                      <p className="text-xs text-muted-foreground mb-1">Business Name</p>
                      <p className="font-semibold">{businessName}</p>
                    </div>
                    <div className="rounded-lg bg-card/60 border border-border p-4">
                      <p className="text-xs text-muted-foreground mb-1">Connection Time</p>
                      <p className="font-semibold">{connectionTime}</p>
                    </div>
                    <div className="rounded-lg bg-card/60 border border-border p-4">
                      <p className="text-xs text-muted-foreground mb-1">Status</p>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-primary animate-pulse"></div>
                        <p className="font-semibold text-primary">Active</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">
                  WhatsApp hesabınızı bağlayarak AI Sales Engine'i kullanmaya başlayın
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 mt-6 pt-6 border-t border-border">
            {isConnected ? (
              <>
                <button className="px-6 py-3 rounded-lg bg-secondary hover:bg-secondary/70 font-semibold text-sm transition-all flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Yeniden Bağla
                </button>
                <button className="px-6 py-3 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 font-semibold text-sm transition-all flex items-center gap-2">
                  <XCircle className="h-4 w-4" />
                  Bağlantıyı Kaldır
                </button>
              </>
            ) : (
              <button className="px-6 py-3 rounded-lg bg-primary hover:bg-primary/90 text-black font-semibold text-sm transition-all flex items-center gap-2 hover:scale-105 shadow-lg shadow-primary/30">
                <QrCode className="h-4 w-4" />
                WhatsApp'ı Bağla
              </button>
            )}
          </div>
        </div>

        {/* Connection Instructions */}
        {!isConnected && (
          <div className="mb-8 rounded-xl border border-border bg-card/60 backdrop-blur-xl p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <QrCode className="h-5 w-5 text-primary" />
              Bağlantı Adımları
            </h2>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/20 border border-primary/30 flex-shrink-0">
                  <span className="text-sm font-bold text-primary">1</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">WhatsApp Business İndirin</h3>
                  <p className="text-sm text-muted-foreground">
                    Telefonunuza WhatsApp Business uygulamasını yükleyin ve hesabınızı oluşturun
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/20 border border-primary/30 flex-shrink-0">
                  <span className="text-sm font-bold text-primary">2</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">QR Kodu Tarayın</h3>
                  <p className="text-sm text-muted-foreground">
                    "WhatsApp'ı Bağla" butonuna tıklayın ve görünen QR kodu telefonunuzla tarayın
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/20 border border-primary/30 flex-shrink-0">
                  <span className="text-sm font-bold text-primary">3</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">Bağlantıyı Onaylayın</h3>
                  <p className="text-sm text-muted-foreground">
                    Telefonunuzda bağlantıyı onaylayın ve AI Sales Engine kullanmaya başlayın
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="rounded-xl border border-border bg-card/60 backdrop-blur-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-bold">Instant Activation</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Bağlantı kurulduktan sonra AI asistanınız anında devreye girer ve mesajları yanıtlamaya başlar
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card/60 backdrop-blur-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <Shield className="h-5 w-5 text-blue-400" />
              </div>
              <h3 className="font-bold">Secure Connection</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Tüm mesajlarınız uçtan uca şifreleme ile korunur. WhatsApp güvenlik standartlarına tam uyum
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card/60 backdrop-blur-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                <Settings className="h-5 w-5 text-purple-400" />
              </div>
              <h3 className="font-bold">Full Control</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              İstediğiniz zaman AI'ı durdurabilir, manuel kontrol alabilir veya bağlantıyı kesebilirsiniz
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card/60 backdrop-blur-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <LinkIcon className="h-5 w-5 text-green-400" />
              </div>
              <h3 className="font-bold">Multi-Device Support</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              WhatsApp'ı hem telefonunuzda hem de AI Sales Engine üzerinde aynı anda kullanabilirsiniz
            </p>
          </div>
        </div>

        {/* API Integration */}
        <div className="rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5 backdrop-blur-xl p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-primary/20 border border-primary/30">
              <Settings className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold mb-2">WhatsApp Business API</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Daha gelişmiş özellikler için WhatsApp Business API entegrasyonunu kullanabilirsiniz
              </p>
              <div className="flex gap-3">
                <button className="px-4 py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-black font-semibold text-sm transition-all">
                  API Dokümantasyonu
                </button>
                <button className="px-4 py-2.5 rounded-lg bg-secondary hover:bg-secondary/70 font-semibold text-sm transition-all">
                  Destek Al
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Connection Stats */}
        {isConnected && (
          <div className="mt-8 rounded-xl border border-border bg-card/60 backdrop-blur-xl p-6">
            <h2 className="text-xl font-bold mb-6">Connection Statistics</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-primary mb-1">99.8%</p>
                <p className="text-sm text-muted-foreground">Uptime</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-400 mb-1">847ms</p>
                <p className="text-sm text-muted-foreground">Avg Latency</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-yellow-400 mb-1">12.4K</p>
                <p className="text-sm text-muted-foreground">Messages Today</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-green-400 mb-1">0</p>
                <p className="text-sm text-muted-foreground">Failed Deliveries</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
