import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { lerJSON, gravarJSON } from './manipularJson.js';

const app = express();
const PORT = 3000;

// Diretórios
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const baseDir = path.join(__dirname, 'templates');
const publicDir = path.join(__dirname, 'public');

// Middlewares
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: '10mb' })); // permite imagens base64
app.use(express.static(publicDir));

// ========== ROTAS DE PÁGINAS ==========
app.get('/', (req, res) => {
  res.sendFile(path.join(baseDir, 'index.html'));
});

app.get('/cadastrar', (req, res) => {
  res.sendFile(path.join(baseDir, 'cadastrar.html'));
});

app.get('/cadastrar_produtos', (req, res) => {
  res.sendFile(path.join(baseDir, 'cadastrar_produtos.html'));
});

// ========== API PESSOAS ==========
app.post('/cadastrar', async (req, res) => {
  try {
    const dado = req.body;
    const dados = await lerJSON('./pessoas.json');
    // Adiciona ID e timestamp
    dado.id = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    dado.criadoEm = new Date().toISOString();
    dados.push(dado);
    await gravarJSON(dados, './pessoas.json');
    res.status(201).json({ code: 201, message: 'Pessoa cadastrada com sucesso!', data: dado });
  } catch (error) {
    console.error('Erro ao cadastrar pessoa:', error);
    res.status(500).json({ error: error.message || 'Erro interno' });
  }
});

app.get('/registros', async (req, res) => {
  try {
    const dados = await lerJSON('./pessoas.json');
    res.json(dados);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao ler os dados de pessoas' });
  }
});

// ========== API PRODUTOS ==========
app.post('/api/produtos', async (req, res) => {
  try {
    const produto = req.body;

    // Validação básica
    if (!produto.nome || produto.nome.trim() === '') {
      return res.status(400).json({ error: 'Nome do produto é obrigatório' });
    }

    const produtos = await lerJSON('./produtos.json');

    // Gera ID único e timestamps
    produto.id = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    produto.criadoEm = new Date().toISOString();
    produto.atualizadoEm = produto.criadoEm;

    // Garante tipos corretos
    produto.preco = Number(produto.preco) || 0;
    produto.quantidade = Number(produto.quantidade) || 0;
    produto.tags = Array.isArray(produto.tags) ? produto.tags : (produto.tags ? String(produto.tags).split(',').map(t => t.trim()).filter(Boolean) : []);

    produtos.push(produto);
    await gravarJSON(produtos, './produtos.json');

    res.status(201).json({
      code: 201,
      message: 'Produto cadastrado com sucesso!',
      data: produto
    });
  } catch (error) {
    console.error('Erro ao cadastrar produto:', error);
    res.status(500).json({ error: error.message || 'Erro interno' });
  }
});

app.get('/api/produtos', async (req, res) => {
  try {
    const produtos = await lerJSON('./produtos.json');
    res.json(produtos);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao ler os produtos' });
  }
});

app.put('/api/produtos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const atualizacao = req.body;
    const produtos = await lerJSON('./produtos.json');
    const index = produtos.findIndex(p => p.id === id);

    if (index === -1) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    // Merge mantendo id e criadoEm
    produtos[index] = {
      ...produtos[index],
      ...atualizacao,
      id: produtos[index].id,
      criadoEm: produtos[index].criadoEm,
      atualizadoEm: new Date().toISOString(),
      preco: Number(atualizacao.preco ?? produtos[index].preco) || 0,
      quantidade: Number(atualizacao.quantidade ?? produtos[index].quantidade) || 0,
      tags: Array.isArray(atualizacao.tags)
        ? atualizacao.tags
        : (atualizacao.tags ? String(atualizacao.tags).split(',').map(t => t.trim()).filter(Boolean) : produtos[index].tags)
    };

    await gravarJSON(produtos, './produtos.json');
    res.json({ code: 200, message: 'Produto atualizado!', data: produtos[index] });
  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    res.status(500).json({ error: error.message || 'Erro interno' });
  }
});

app.delete('/api/produtos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const produtos = await lerJSON('./produtos.json');
    const filtrados = produtos.filter(p => p.id !== id);

    if (filtrados.length === produtos.length) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    await gravarJSON(filtrados, './produtos.json');
    res.json({ code: 200, message: 'Produto removido com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Erro interno' });
  }
});

// Inicializa arquivos JSON se não existirem
(async () => {
  await lerJSON('./pessoas.json');
  await lerJSON('./produtos.json');
})();

app.listen(PORT, () => {
  console.log(`Servidor rodando em: http://localhost:${PORT}`);
  console.log(`- Home:          http://localhost:${PORT}/`);
  console.log(`- Pessoas:       http://localhost:${PORT}/cadastrar`);
  console.log(`- Produtos:      http://localhost:${PORT}/cadastrar_produtos`);
});
