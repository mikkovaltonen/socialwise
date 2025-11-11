/**
 * Aineisto Context Loader
 *
 * Loads all markdown files from /public/Aineisto directory
 * and formats them as context for AI prompts
 */

interface AineistoContext {
  content: string;
  fileCount: number;
  categories: string[];
}

/**
 * Load all Aineisto files and format as context
 * This provides full client data context to AI
 */
export async function loadAineistoContext(): Promise<AineistoContext> {
  const categories = [
    'LS-ilmoitukset',
    'Päätökset',
    'Yhteystiedot',
  ];

  let fullContent = '# ASIAKKAAN TIEDOT - TÄYDELLINEN KONTEKSTI\n\n';
  let fileCount = 0;

  // Load documentation
  try {
    const docResponse = await fetch('/Aineisto/DATA_PARSING_DOKUMENTAATIO.md');
    if (docResponse.ok) {
      const docContent = await docResponse.text();
      fullContent += `## Aineiston Rakenne\n\n${docContent}\n\n---\n\n`;
    }
  } catch (error) {
    console.warn('Could not load documentation file');
  }

  // Load files from each category
  for (const category of categories) {
    fullContent += `## ${category}\n\n`;

    try {
      // Try to load Lapsi_1 files from this category
      // Note: We need to know the file names in advance or use a file listing API
      const files = await loadCategoryFiles(category);

      if (files.length > 0) {
        for (const file of files) {
          fullContent += `### ${file.name}\n\n${file.content}\n\n`;
          fileCount++;
        }
      } else {
        fullContent += `_Ei tiedostoja tässä kategoriassa_\n\n`;
      }
    } catch (error) {
      console.warn(`Could not load files from category: ${category}`);
      fullContent += `_Virhe ladattaessa tiedostoja_\n\n`;
    }

    fullContent += '---\n\n';
  }

  return {
    content: fullContent,
    fileCount,
    categories,
  };
}

/**
 * Load files from a specific category
 * Note: This is a simplified version that tries known file patterns
 */
async function loadCategoryFiles(category: string): Promise<Array<{ name: string; content: string }>> {
  const files: Array<{ name: string; content: string }> = [];

  // Known file patterns for Lapsi_1 (based on actual files in Aineisto folder)
  const filePatterns: Record<string, string[]> = {
    'LS-ilmoitukset': [
      'Lapsi_1_2016_08_03_Lastensuojeluilmoitus.md',
      'Lapsi_1_2017_11_16_Lastensuojeluilmoitus.md',
      'Lapsi_1_2018_04_26_Lastensuojeluilmoitus.md',
    ],
    'Päätökset': [
      'Lapsi_1_2025_03_22_päätös.md',
    ],
    'Yhteystiedot': [
      'Lapsi_1_yhteystiedot.md',
    ],
  };

  const patterns = filePatterns[category] || [];

  for (const fileName of patterns) {
    try {
      const response = await fetch(`/Aineisto/${category}/${fileName}`);
      if (response.ok) {
        const content = await response.text();
        files.push({
          name: fileName,
          content,
        });
      }
    } catch (error) {
      // File doesn't exist, skip
      console.debug(`File not found: ${category}/${fileName}`);
    }
  }

  return files;
}

/**
 * Get a summary of available Aineisto files
 */
export async function getAineistoSummary(): Promise<string> {
  const context = await loadAineistoContext();

  return `Käytettävissä olevia asiakastietoja:
- ${context.fileCount} tiedostoa ladattu
- Kategoriat: ${context.categories.join(', ')}

Voit viitata näihin tietoihin vastauksissasi käyttämällä tarkkoja päivämääriä ja lähteitä.`;
}

/**
 * Simplified loader that returns just the essential context
 * without full file contents (for shorter prompts)
 */
export async function loadAineistoContextSummary(): Promise<string> {
  const summary = await getAineistoSummary();
  return summary;
}
