import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const execAsync = promisify(exec);
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
 * Erottaa tekstin PDF-tiedostosta pdftotext-komennolla
 */
async function extractTextFromPdf(pdfPath: string): Promise<string> {
  const tempTextFile = pdfPath + '.tmp.txt';

  try {
    // Käytä pdftotext-komentoa tekstin erottamiseen (layout-tilassa säilyttää rakenteen)
    await execAsync(`pdftotext -layout "${pdfPath}" "${tempTextFile}"`);
    const text = fs.readFileSync(tempTextFile, 'utf-8');

    // Poista väliaikainen tiedosto
    fs.unlinkSync(tempTextFile);

    return text;
  } catch (error) {
    // Yritä poistaa temp-tiedosto jos se jäi
    try {
      if (fs.existsSync(tempTextFile)) {
        fs.unlinkSync(tempTextFile);
      }
    } catch {}

    throw error;
  }
}

/**
 * Muuntaa PDF-tiedoston Markdown-muotoon Grok-2 AI:n avulla
 */
async function convertPdfToMarkdown(pdfPath: string): Promise<ConversionResult> {
  const filename = path.basename(pdfPath);
  console.log(`\n📄 Käsitellään: ${filename}`);

  try {
    // Erota teksti PDF:stä
    console.log(`   📖 Erotetaan teksti PDF:stä...`);
    const pdfText = await extractTextFromPdf(pdfPath);

    const wordCount = pdfText.split(/\s+/).length;
    const charCount = pdfText.length;

    console.log(`   Sanoja: ${wordCount}`);
    console.log(`   Merkkejä: ${charCount}`);
    console.log(`   🤖 Kutsutaan Gemini 2.5 Pro API:a...`);

    // Lähetä teksti Gemini 2.5 Pro API:lle muunnettavaksi
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://socialwise.fi',
        'X-Title': 'SocialWise PDF to Markdown Converter'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [
          {
            role: 'system',
            content: `Olet PDF-dokumenttien Markdown-muunnin sosiaalityön asiakirjoille. Tehtäväsi on muuntaa annettu PDF-dokumentin teksti selkeäksi, rakenteelliseksi Markdown-dokumentiksi.

OHJEISTUS:
1. Säilytä KAIKKI alkuperäinen sisältö ja rakenne täsmälleen
2. Käytä Markdown-otsikoita (# ## ###) rakenteen luomiseen
3. Muotoile listat, taulukot ja lainaukset oikein Markdownilla
4. Säilytä päivämäärät, nimet, henkilötiedot ja kaikki muut tärkeät tiedot TÄSMÄLLEEN
5. Tunnista viittaukset korostuksiin tai tärkeisiin kohtiin tekstissä
6. Jos teksti viittaa korostuksiin, kellertämisiin tai muihin merkintöihin, merkitse ne

KOROSTUKSET JA MERKINNÄT:
7. Jos tekstissä on viittauksia korostuksiin tai tärkeisiin kohtiin, luo dokumentin loppuun erillinen osio "## Korostukset ja huomiot"
8. Listaa tähän osioon kaikki tunnistetut tai mainitut tärkeät kohdat
9. Käytä lainausmerkkejä (>) korostettujen tekstien merkitsemiseen
10. Jos alkuperäisessä PDF:ssä on ollut visuaalisia merkintöjä (kellertäminen, alleviivaus, yms.), mainitse ne

TÄRKEÄÄ:
- Tämä on lastensuojeluilmoitus, joten tarkkuus on KRIITTISTÄ
- ÄLÄ muuta tai tulkitse sisältöä - säilytä täsmälleen alkuperäinen teksti
- Säilytä kaikki päivämäärät, nimet ja yhteystiedot

Vastaa VAIN Markdown-muodossa ilman lisäselityksiä.`
          },
          {
            role: 'user',
            content: `Muunna seuraava lastensuojeluilmoitus Markdown-muotoon:\n\n${pdfText}`
          }
        ],
        temperature: 0.1,
        max_tokens: 12000
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API virhe: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const result = await response.json();

    if (!result.choices || !result.choices[0] || !result.choices[0].message) {
      throw new Error(`Virheellinen API-vastaus: ${JSON.stringify(result)}`);
    }

    const markdownContent = result.choices[0].message.content;

    // Tallenna Markdown-tiedosto
    const outputFilename = filename.replace('.pdf', '.md');
    const outputPath = path.join(__dirname, outputFilename);

    // Lisää metadata dokumentin alkuun
    const fullContent = `---
source: ${filename}
converted: ${new Date().toISOString()}
converter: google/gemini-2.5-pro via OpenRouter
type: Lastensuojeluilmoitus
note: Korostukset ja merkinnät dokumentoitu jos tunnistettu
---

${markdownContent}
`;

    fs.writeFileSync(outputPath, fullContent, 'utf-8');
    console.log(`   ✅ Tallennettu: ${outputFilename}`);
    console.log(`   📝 Markdown merkkejä: ${markdownContent.length}`);

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
  console.log('🔄 Käyttää: pdftotext + Gemini 2.5 Pro');
  console.log('==========================================\n');

  if (!OPENROUTER_API_KEY) {
    console.error('❌ VIRHE: VITE_OPEN_ROUTER_API_KEY ei löydy .env-tiedostosta');
    process.exit(1);
  }

  // Etsi kaikki lastensuojeluilmoitus PDF-tiedostot
  const pdfFiles = fs.readdirSync(__dirname)
    .filter(file => file.endsWith('.pdf') && file.includes('Lastensuojeluilmoitus'))
    .sort()
    .map(file => path.join(__dirname, file));

  if (pdfFiles.length === 0) {
    console.log('⚠️  Ei Lastensuojeluilmoitus PDF-tiedostoja löytynyt');
    return;
  }

  console.log(`Löydettiin ${pdfFiles.length} PDF-tiedostoa\n`);

  const results: ConversionResult[] = [];

  // Käsittele tiedostot yksi kerrallaan
  for (let i = 0; i < pdfFiles.length; i++) {
    const pdfFile = pdfFiles[i];
    console.log(`[${i + 1}/${pdfFiles.length}]`);
    const result = await convertPdfToMarkdown(pdfFile);
    results.push(result);

    // Odota hetki ennen seuraavaa API-kutsua (rate limiting)
    if (i < pdfFiles.length - 1) {
      console.log('   ⏳ Odotetaan 2 sekuntia...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  // Tulosta yhteenveto
  console.log('\n==========================================');
  console.log('📊 YHTEENVETO\n');

  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  console.log(`✅ Onnistuneet: ${successful}/${results.length}`);
  console.log(`❌ Epäonnistuneet: ${failed}/${results.length}\n`);

  if (successful > 0) {
    console.log('✓ Luodut Markdown-tiedostot:');
    results.filter(r => r.success).forEach(r => {
      console.log(`  - ${path.basename(r.outputPath!)}`);
    });
    console.log('');
  }

  if (failed > 0) {
    console.log('✗ Epäonnistuneet tiedostot:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`  - ${r.filename}`);
      console.log(`    Virhe: ${r.error}`);
    });
    console.log('');
  }

  console.log('✨ Valmis!');
  console.log('\n💡 Markdown-tiedostot tallennettu: data_preparation/');
  console.log('💡 Metadata sisältää lähdetiedot ja muunnospäivämäärän');
  console.log('💡 Korostukset dokumentoitu jos ne tunnistettiin tekstistä');
}

// Aja ohjelma
main().catch(error => {
  console.error('❌ Kriittinen virhe:', error);
  process.exit(1);
});
