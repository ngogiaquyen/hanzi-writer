import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const directory = path.resolve('public/hsk-vocab-json');
const files = [1, 2, 3, 4, 5, 6].map((level) => path.join(directory, `hsk-level-${level}.json`));
const workerCount = 3;
const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

const cleanSource = (translations) => translations
  .slice(0, 2)
  .join('; ')
  .replace(/CL:[^;]+/g, '')
  .replace(/\[[^\]]+\]/g, '')
  .replace(/\s+/g, ' ')
  .trim()
  .slice(0, 450);

async function translate(source) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(source)}&langpair=en|vi`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      const translated = data.responseData?.translatedText?.trim();
      if (translated) return translated;
    } catch {
      if (attempt < 2) await wait(500 * (attempt + 1));
    }
  }
  return '';
}

for (const file of files) {
  const words = JSON.parse(await readFile(file, 'utf8'));
  let nextIndex = 0;
  let completed = 0;

  async function worker() {
    while (nextIndex < words.length) {
      const index = nextIndex;
      nextIndex += 1;
      const source = cleanSource(words[index].translations);
      const translated = await translate(source);
      if (translated) words[index].vietnamese = translated;
      completed += 1;
      if (completed % 50 === 0 || completed === words.length) {
        console.log(`${path.basename(file)}: ${completed}/${words.length}`);
      }
      await wait(100);
    }
  }

  await Promise.all(Array.from({ length: workerCount }, worker));
  await writeFile(file, `${JSON.stringify(words, null, 2)}\n`, 'utf8');
  console.log(`Saved ${path.basename(file)}`);
}
