
bash

cat /home/claude/cha-presentes/server.js
Saída

const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

const DATA_FILE = path.join(__dirname, 'data.json');
const ADMIN_PASSWORD = 'gica2025'; // TROQUE PELA SUA SENHA

// Dados iniciais
const defaultData = {
  gifts: [
    {id:1,emoji:'🍳',name:'Frigideira antiaderente',cat:'Cozinha',price:'R$ 120',taken:false,by:'',img:''},
    {id:2,emoji:'🫖',name:'Chaleira elétrica',cat:'Cozinha',price:'R$ 80',taken:false,by:'',img:''},
    {id:3,emoji:'🧴',name:'Kit toalhas de banho',cat:'Banheiro',price:'R$ 90',taken:false,by:'',img:''},
    {id:4,emoji:'🕯️',name:'Velas aromáticas (kit)',cat:'Decoração',price:'R$ 60',taken:false,by:'',img:''},
    {id:5,emoji:'🛋️',name:'Almofadas decorativas',cat:'Sala',price:'R$ 70',taken:false,by:'',img:''},
    {id:6,emoji:'🪴',name:'Vaso com planta',cat:'Decoração',price:'R$ 45',taken:false,by:'',img:''},
    {id:7,emoji:'🍽️',name:'Jogo de pratos (6 pçs)',cat:'Cozinha',price:'R$ 150',taken:false,by:'',img:''},
    {id:8,emoji:'🧺',name:'Cesto organizador',cat:'Organização',price:'R$ 55',taken:false,by:'',img:''},
  ]
};

function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch(e) {}
  return JSON.parse(JSON.stringify(defaultData));
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// Inicializa o arquivo se não existir
if (!fs.existsSync(DATA_FILE)) saveData(defaultData);

// ── ROTAS PÚBLICAS (convidados) ──────────────────────
// Página dos convidados
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

// Buscar lista (só os disponíveis)
app.get('/api/gifts', (req, res) => {
  const data = loadData();
  const available = data.gifts.filter(g => !g.taken).map(g => ({
    id: g.id, emoji: g.emoji, name: g.name, cat: g.cat, price: g.price, img: g.img
  }));
  res.json(available);
});

// Convidado escolhe um presente
app.post('/api/choose/:id', (req, res) => {
  const { name } = req.body;
  if (!name || name.trim().length < 2) return res.status(400).json({ error: 'Nome inválido' });
  const data = loadData();
  const gift = data.gifts.find(g => g.id === parseInt(req.params.id));
  if (!gift) return res.status(404).json({ error: 'Presente não encontrado' });
  if (gift.taken) return res.status(409).json({ error: 'Presente já foi escolhido' });
  gift.taken = true;
  gift.by = name.trim();
  saveData(data);
  res.json({ ok: true, gift: gift.name });
});

// ── ROTAS ADMIN ──────────────────────────────────────
// Verificar senha
app.post('/api/admin/login', (req, res) => {
  if (req.body.password === ADMIN_PASSWORD) res.json({ ok: true });
  else res.status(401).json({ error: 'Senha incorreta' });
});

// Buscar lista completa (admin)
app.get('/api/admin/gifts', (req, res) => {
  if (req.headers['x-admin-pass'] !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Não autorizado' });
  res.json(loadData().gifts);
});

// Adicionar presente
app.post('/api/admin/gifts', (req, res) => {
  if (req.headers['x-admin-pass'] !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Não autorizado' });
  const { emoji, name, cat, price, img } = req.body;
  if (!name) return res.status(400).json({ error: 'Nome obrigatório' });
  const data = loadData();
  const newGift = { id: Date.now(), emoji: emoji||'🎁', name, cat: cat||'Geral', price: price||'', taken: false, by: '', img: img||'' };
  data.gifts.push(newGift);
  saveData(data);
  res.json(newGift);
});

// Remover presente
app.delete('/api/admin/gifts/:id', (req, res) => {
  if (req.headers['x-admin-pass'] !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Não autorizado' });
  const data = loadData();
  data.gifts = data.gifts.filter(g => g.id !== parseInt(req.params.id));
  saveData(data);
  res.json({ ok: true });
});

// Página admin (rota separada e oculta)
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
