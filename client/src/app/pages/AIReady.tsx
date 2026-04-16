import { Check, Globe, Instagram, Sparkles, MessageSquare, Zap, ArrowRight, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';

export function AIReady() {
  const navigate = useNavigate();

  return (
    <div className="h-full overflow-auto bg-gradient-to-b from-background via-[#0a0a0f] to-[#0f0f19] flex items-center justify-center p-8">
      <div className="max-w-3xl w-full">
        {/* Success Animation */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, type: 'spring' }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center p-6 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 border-2 border-primary/50 mb-6 relative">
            <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping"></div>
            <Check className="h-16 w-16 text-primary relative z-10" />
          </div>
          <h1 className="text-5xl font-bold tracking-tight mb-4 bg-gradient-to-r from-primary via-[#00d9ff] to-primary bg-clip-text text-transparent">
            AI Satış Asistanınız Hazır 🚀
          </h1>
          <p className="text-lg text-muted-foreground">
            Markanıza özel eğitilmiş AI asistanınız müşterilerinizle konuşmaya hazır
          </p>
        </motion.div>

        {/* Summary Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-2 gap-6 mb-8"
        >
          {[
            {
              icon: Globe,
              title: 'Website Analyzed',
              description: 'Brand tone & positioning detected',
              color: 'from-primary/20 to-primary/10 border-primary/30 text-primary',
            },
            {
              icon: Instagram,
              title: 'Instagram Analyzed',
              description: 'Content style & voice learned',
              color: 'from-pink-500/20 to-purple-500/10 border-pink-500/30 text-pink-400',
            },
            {
              icon: Sparkles,
              title: 'Brand Tone Detected',
              description: 'Professional, friendly, innovative',
              color: 'from-blue-500/20 to-blue-500/10 border-blue-500/30 text-blue-400',
            },
            {
              icon: MessageSquare,
              title: 'Sales Strategy Ready',
              description: 'Products, FAQs & rules configured',
              color: 'from-purple-500/20 to-purple-500/10 border-purple-500/30 text-purple-400',
            },
          ].map((item, idx) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + idx * 0.1 }}
              className={`rounded-xl border bg-gradient-to-br backdrop-blur-xl p-6 ${item.color}`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2 rounded-lg bg-gradient-to-br ${item.color}`}>
                  <item.icon className="h-5 w-5" />
                </div>
                <Check className="h-5 w-5 text-primary ml-auto" />
              </div>
              <h3 className="font-bold mb-1">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* AI Capabilities */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5 backdrop-blur-xl p-6 mb-8"
        >
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            AI Asistanınız Neler Yapabilir?
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              '✓ Markanıza uygun ton ve dilde konuşur',
              '✓ Ürünlerinizi detaylı anlatır',
              '✓ Sık sorulan soruları yanıtlar',
              '✓ İtirazları yönetir ve ikna eder',
              '✓ Lead nitelendirme yapar',
              '✓ Gerektiğinde temsilciye devir yapar',
            ].map((capability, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1 + idx * 0.1 }}
                className="flex items-center gap-2 text-sm"
              >
                <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
                <span>{capability}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Performance Expectations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="rounded-xl border border-border bg-card/60 backdrop-blur-xl p-6 mb-8"
        >
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Beklenen Performans
          </h2>
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary mb-1">87%</p>
              <p className="text-xs text-muted-foreground">Autonomous Resolution</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-400 mb-1">&lt;2s</p>
              <p className="text-xs text-muted-foreground">Response Time</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-400 mb-1">24/7</p>
              <p className="text-xs text-muted-foreground">Always Available</p>
            </div>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.4 }}
          className="flex gap-4"
        >
          <button
            onClick={() => navigate('/')}
            className="flex-1 px-6 py-4 rounded-lg bg-secondary hover:bg-secondary/70 font-semibold transition-all"
          >
            Dashboard'a Git
          </button>
          <button
            onClick={() => navigate('/chat')}
            className="flex-1 px-6 py-4 rounded-lg bg-gradient-to-r from-primary via-[#00d9ff] to-primary hover:opacity-90 text-black font-bold transition-all flex items-center justify-center gap-2 hover:scale-105 shadow-2xl shadow-primary/40"
          >
            Canlı Sohbetlere Geç
            <ArrowRight className="h-5 w-5" />
          </button>
        </motion.div>

        {/* Additional Info */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.6 }}
          className="text-center text-sm text-muted-foreground mt-6"
        >
          AI asistanınızı <span className="text-primary hover:underline cursor-pointer" onClick={() => navigate('/ai-knowledge')}>AI Bilgi Merkezi</span>'nden istediğiniz zaman güncelleyebilirsiniz
        </motion.p>
      </div>
    </div>
  );
}
