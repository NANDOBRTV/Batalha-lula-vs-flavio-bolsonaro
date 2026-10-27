import express from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { TikTokLiveConnection, WebcastEvent, ControlEvent } from 'tiktok-live-connector';

const app = express();
const server = createServer(app);
const io = new Server(server);

app.use(express.static('public'));

const TIKTOK_USERNAME = (process.env.TIKTOK_USERNAME || 'nandobr_ofc').replace(/^@/, '');
const PORT = Number(process.env.PORT || 3000);
const tiktok = new TikTokLiveConnection(TIKTOK_USERNAME);

app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    tiktokUsername: TIKTOK_USERNAME,
    tiktokConnected: Boolean(tiktok.isConnected)
  });
});

io.on('connection', () => {
  console.log('🖥️ Jogo conectado ao servidor.');
});

// Registre cada evento uma única vez no servidor e envie para todos os navegadores.
tiktok.on(WebcastEvent.CHAT, (d) => {
  io.emit('tiktok-chat', {
    user: d.user?.displayId || d.user?.uniqueId || 'espectador',
    comment: d.content ?? d.comment ?? ''
  });
});

tiktok.on(WebcastEvent.LIKE, (d) => {
  io.emit('tiktok-like', {
    user: d.user?.displayId || d.user?.uniqueId || 'espectador',
    likeCount: Number(d.likeCount ?? d.count ?? 1)
  });
});

tiktok.on(WebcastEvent.GIFT, (d) => {
  const gift = d.giftDetails ?? d.gift ?? {};
  io.emit('tiktok-gift', {
    user: d.user?.displayId || d.user?.uniqueId || 'espectador',
    giftName: gift.giftName || gift.name || d.giftName || `Presente ${d.giftId ?? ''}`.trim(),
    amount: Number(d.repeatCount ?? d.repeat_count ?? 1),
    diamonds: Number(gift.diamondCount ?? gift.diamond_count ?? d.diamondCount ?? 1)
  });
});

tiktok.on(WebcastEvent.FOLLOW, (d) => {
  io.emit('tiktok-follow', {
    user: d.user?.displayId || d.user?.uniqueId || 'espectador'
  });
});

tiktok.on(ControlEvent.ERROR, (d) => {
  console.error('❌ Erro no conector TikTok LIVE:', d?.info || d?.exception || d);
});

async function start() {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Jogo disponível na porta ${PORT}`);
    console.log(`📡 Preparando conexão com @${TIKTOK_USERNAME}`);
  });

  try {
    const state = await tiktok.connect();
    console.log(`✅ Conectado à live @${TIKTOK_USERNAME} (sala ${state.roomId})`);
  } catch (error) {
    console.error(`❌ Não foi possível conectar a @${TIKTOK_USERNAME}.`);
    console.error(error?.message || error);
  }
}

start();
