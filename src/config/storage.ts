/**
 * Firebase Storage -konfiguraatio
 *
 * Keskitetty konfiguraatio storage-poluille ja kategorioille.
 * Uusi rakenne: {clientId}/{category}/{filename}.md
 */

// Storage Base Path - Uudessa rakenteessa ei juurikansiota ("Aineisto" poistettu)
export const STORAGE_CONFIG = {
  /**
   * Juurikansio Storage:ssa
   * Vanha: 'Aineisto'
   * Uusi: '' (tyhjä, ei juurikansiota)
   */
  basePath: '',

  /**
   * Aineiston kategoriat
   */
  categories: {
    LS_ILMOITUKSET: 'LS-ilmoitukset',
    PAATOKSET: 'Päätökset',
    PTA: 'PTA',
    YHTEYSTIEDOT: 'Yhteystiedot',
    ASIAKASSUUNNITELMAT: 'Asiakassuunnitelmat',
    ASIAKASKIRJAUKSET: 'Asiakaskirjaukset',
  } as const,
} as const;

// Kategorioiden tyyppi
export type AineistoCategory = typeof STORAGE_CONFIG.categories[keyof typeof STORAGE_CONFIG.categories];

/**
 * Rakentaa storage-polun clientId, kategoria ja tiedostonimi perusteella
 *
 * @param clientId - Asiakkaan tunniste (esim. "lapsi-1")
 * @param category - Kategoria (esim. "LS-ilmoitukset")
 * @param filename - Tiedoston nimi (esim. "2024_01_15_Lastensuojeluilmoitus.md")
 * @returns Täydellinen storage-polku (esim. "lapsi-1/LS-ilmoitukset/2024_01_15_Lastensuojeluilmoitus.md")
 */
export function buildStoragePath(
  clientId: string,
  category: string,
  filename: string
): string {
  // Uusi rakenne: {clientId}/{category}/{filename}
  // Esim: "lapsi-1/LS-ilmoitukset/2024_01_15_Lastensuojeluilmoitus.md"
  const parts = [clientId, category, filename].filter(Boolean);
  return parts.join('/');
}

/**
 * Rakentaa storage-polun kategorialle
 *
 * @param clientId - Asiakkaan tunniste
 * @param category - Kategoria
 * @returns Storage-polku kategorialle (esim. "lapsi-1/LS-ilmoitukset/")
 */
export function buildCategoryPath(
  clientId: string,
  category: string
): string {
  return `${clientId}/${category}/`;
}

/**
 * Parsii storage-polun osiin
 *
 * @param fullPath - Täydellinen storage-polku (esim. "lapsi-1/LS-ilmoitukset/2024_01_15_Lastensuojeluilmoitus.md")
 * @returns Objekti jossa clientId, category ja filename
 */
export function parseStoragePath(fullPath: string): {
  clientId: string;
  category: string;
  filename: string;
} | null {
  const parts = fullPath.split('/');

  if (parts.length < 3) {
    return null;
  }

  const [clientId, category, ...filenameParts] = parts;
  const filename = filenameParts.join('/');

  return {
    clientId,
    category,
    filename,
  };
}
