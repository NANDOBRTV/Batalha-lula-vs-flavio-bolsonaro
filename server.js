const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { WebcastPushConnection } = require('tiktok-live-connector');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

// ⚠️ Troque pelo @ de quem estiver AO VIVO (sem o @)
const TIKTOK_USERNAME = 'nome_do_streamer_aqui';

const tiktok = new WebcastPushConnection(TIKTOK_USERNAME);

tiktok.connect()
  .then(state => console.log(`✅ Conectado na live (room ${state.roomId})`))
  .catch(err => console.error('❌ Falha ao conectar:', err));

io.on('connection', (socket) => {
  console.log('🖥️ Jogo conectado.');

  tiktok.on('chat', d => socket.emit('tiktok-chat', {
    user: d.uniqueId, comment: d.comment
  }));

  tiktok.on('like', d => socket.emit('tiktok-like', {
    user: d.uniqueId, likeCount: d.likeCount
  }));

  tiktok.on('gift', d => socket.emit('tiktok-gift', {
    user: d.uniqueId,
    giftName: d.giftName,
    amount: d.repeatCount,
    diamonds: d.diamondCount || 1
  }));

  tiktok.on('follow', d => socket.emit('tiktok-follow', {
    user: d.uniqueId
  }));
});

server.listen(3000, () =>
  console.log('🚀 Jogo em http://localhost:3000')
);
