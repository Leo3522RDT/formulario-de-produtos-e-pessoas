import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Lê um arquivo JSON e retorna o conteúdo parseado.
 * Se o arquivo não existir, cria com array vazio.
 * @param {string} filePath - Caminho relativo ou absoluto do arquivo
 * @returns {Promise<Array|Object>}
 */
export async function lerJSON(filePath) {
  const fullPath = path.isAbsolute(filePath)
    ? filePath
    : path.join(__dirname, filePath);

  try {
    const data = await readFile(fullPath, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    if (err.code === 'ENOENT') {
      // Arquivo não existe: cria com array vazio
      await writeFile(fullPath, '[]', 'utf-8');
      return [];
    }
    throw err;
  }
}

/**
 * Grava dados em um arquivo JSON (pretty-print).
 * @param {Array|Object} data - Dados a serem gravados
 * @param {string} filePath - Caminho do arquivo
 */
export async function gravarJSON(data, filePath) {
  const fullPath = path.isAbsolute(filePath)
    ? filePath
    : path.join(__dirname, filePath);

  await writeFile(fullPath, JSON.stringify(data, null, 2), 'utf-8');
}
