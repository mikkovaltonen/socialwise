import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pdfParse from 'pdf-parse';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OPENROUTER_API_KEY = process.env.VITE_OPEN_ROUTER_API_KEY;

interface ConversionResult {
  filename: string;
  success: boolean;
  outputPath?: string;
  error?: string;
}

/**
 * Muuntaa PDF-tiedoston Markdown-muotoon Grok-4-Fast AI:n avulla
 */
async function convertPdfToMarkdown(pdfPath: string): Promise<ConversionResult> {
  const filename = path.basename(pdfPath);
  console.log(`\n📄 Käsitellään: ${filename}`);

  try {
    // Lue PDF-tiedosto
    const dataBuffer = fs.readFileSync(pdfPath);
    const pdfData = await pdfParse(dataBuffer);

    console.log(`   Sivuja: ${pdfData.numpages}`);
    console.log(`   Merkkejä: ${pdfData.text.length}`);

    // Lähetä teksti Grok-4-Fast API:lle muunnettavaksi
    console.log(`   🤖 Kutsutaan Grok-4-Fast API:a...`);

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://socialwise.fi',
        'X-Title': 'SocialWise PDF to Markdown Converter'
      },
      body: JSON.stringify({
        model: 'x-ai/grok-2-1212',
        messages: [
          {
            role: 'system',
            content: `Olet PDF-dokumenttien Markdown-muunnin. Tehtäväsi on muuntaa annettu PDF-dokumentin teksti selkeäksi, rakenteelliseksi Markdown-dokumentiksi.

OHJEISTUS:
1. Säilytä kaikki alkuperäinen sisältö ja rakenne
2. Käytä Markdown-otsikoita (# ## ###) rakenteen luomiseen
3. Muotoile listat, taulukot ja lainaukset oikein Markdownilla
4. Säilytä päivämäärät, nimet ja muut tärkeät tiedot täsmälleen
5. Jos huomaat viittauksia korostuksiin, kellertämisiin tai muihin visuaalisiin merkintöihin tekstissä, dokumentoi ne

KOROSTUKSET:
- Jos tekstissä on viittauksia korostuksiin tai tärkeisiin kohtiin, luo dokumentin loppuun erillinen osio "## Korostukset ja huomiot"
- Listaa tähän osioon kaikki tunnistetut tärkeät kohdat ja korostukset
- Käytä lainausmerkkejä (>) korostettujen tekstien merkitsemiseen

Vastaa VAIN Markdown-muodossa ilman lisäselityksiä.`
          },
          {
            role: 'user',
            content: `Muunna seuraava PDF-dokumentin teksti Markdown-muotoon:\n\n${pdfData.text}`
          }
        ],
        temperature: 0.3,
        max_tokens: 8000
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API virhe: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const result = await response.json();
    const markdownContent = result.choices[0].message.content;

    // Tallenna Markdown-tiedosto
    const outputFilename = filename.replace('.pdf', '.md');
    const outputPath = path.join(__dirname, outputFilename);

    // Lisää metadata dokumentin alkuun
    const fullContent = `---
source: ${filename}
converted: ${new Date().toISOString()}
pages: ${pdfData.numpages}
converter: Grok-2-1212 via OpenRouter
---

${markdownContent}
`;

    fs.writeFileSync(outputPath, fullContent, 'utf-8');
    console.log(`   ✅ Tallennettu: ${outputFilename}`);

    return {
      filename,
      success: true,
      outputPath
    };

  } catch (error) {
    console.error(`   ❌ Virhe: ${error instanceof Error ? error.message : String(error)}`);
    return {
      filename,
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Pääohjelma: käsittelee kaikki PDF-tiedostot kansiossa
 */
async function main() {
  console.log('🚀 PDF to Markdown Converter');
  console.log('================================\n');

  if (!OPENROUTER_API_KEY) {
    console.error('❌ VIRHE: VITE_OPEN_ROUTER_API_KEY ei löydy .env-tiedostosta');
    process.exit(1);
  }

  // Etsi kaikki PDF-tiedostot data_preparation-kansiosta
  const pdfFiles = fs.readdirSync(__dirname)
    .filter(file => file.endsWith('.pdf'))
    .map(file => path.join(__dirname, file));

  if (pdfFiles.length === 0) {
    console.log('⚠️  Ei PDF-tiedostoja löytynyt');
    return;
  }

  console.log(`Löydettiin ${pdfFiles.length} PDF-tiedostoa\n`);

  const results: ConversionResult[] = [];

  // Käsittele tiedostot yksi kerrallaan (API rate limiting)
  for (const pdfFile of pdfFiles) {
    const result = await convertPdfToMarkdown(pdfFile);
    results.push(result);

    // Odota hetki ennen seuraavaa API-kutsua
    if (pdfFile !== pdfFiles[pdfFiles.length - 1]) {
      console.log('   ⏳ Odotetaan 2 sekuntia...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  // Tulosta yhteenveto
  console.log('\n================================');
  console.log('📊 YHTEENVETO\n');

  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  console.log(`✅ Onnistuneet: ${successful}/${results.length}`);
  console.log(`❌ Epäonnistuneet: ${failed}/${results.length}\n`);

  if (failed > 0) {
    console.log('Epäonnistuneet tiedostot:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`  - ${r.filename}: ${r.error}`);
    });
  }

  console.log('\n✨ Valmis!');
}

// Aja ohjelma
main().catch(error => {
  console.error('❌ Kriittinen virhe:', error);
  process.exit(1);
});
