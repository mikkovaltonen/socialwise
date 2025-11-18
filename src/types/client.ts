/**
 * Asiakastietojen tyyppimäärittelyt
 *
 * Määrittelee Firestore-kokoelmien rakenteet asiakkaille ja yhteystiedoille.
 */

import { Timestamp } from 'firebase/firestore';

/**
 * Asiakas (Firestore: clients-kokoelma)
 *
 * Perustiedot asiakkaasta joka liitetään organisaatioon.
 */
export interface Client {
  /**
   * Asiakkaan yksilöllinen tunniste
   * Esim: "lapsi-1", "lapsi-2"
   */
  id: string;

  /**
   * Asiakkaan nimi / tunniste
   * Esim: "Lapsi 1", "Perhe Smith"
   */
  name: string;

  /**
   * Organisaation ID johon asiakas kuuluu
   */
  organizationId?: string;

  /**
   * Luontipäivämäärä
   */
  createdAt?: Timestamp;

  /**
   * Viimeisin päivitys
   */
  updatedAt?: Timestamp;

  /**
   * Luonut käyttäjä
   */
  createdBy?: string;

  /**
   * Aktiivinen / arkistoitu
   */
  isActive?: boolean;

  /**
   * Vapaamuotoiset metatiedot
   */
  metadata?: Record<string, any>;
}

/**
 * Asiakkaan perustiedot (Firestore: ASIAKAS_PERUSTIEDOT-kokoelma)
 *
 * Yhteystiedot ja muut perustiedot jotka aiemmin olivat markdown-tiedostoissa.
 * Nyt siirretty Firestoreen paremman haettavuuden ja muokattavuuden vuoksi.
 */
export interface ClientBasicInfo {
  /**
   * Asiakkaan ID (linkki clients-kokoelmaan)
   */
  clientId: string;

  /**
   * Lapsen tiedot
   */
  child?: {
    nimi: string;
    puhelin?: string;
    koulu?: string;
    koulunPuhelin?: string;
  };

  /**
   * Huoltajat (array)
   */
  guardians?: Array<{
    nimi: string;
    rooli: string; // "äiti", "isä", jne.
    puhelin?: string;
    sahkoposti?: string; // HUOM: ilman ääkkösiä Firestoressa
    osoite?: string;
  }>;

  /**
   * Ammattilaiset (array)
   */
  professionals?: Array<{
    nimi: string;
    rooli: string; // "oma sosiaali työntekijä", "vastuutyöntekijä", jne.
    puhelin?: string;
    sahkoposti?: string; // HUOM: ilman ääkkösiä Firestoressa
  }>;

  /**
   * Täysi markdown-teksti (legacy)
   */
  fullText?: string;

  /**
   * Luontipäivämäärä
   */
  createdAt?: Timestamp;

  /**
   * Luonut käyttäjä
   */
  createdBy?: string;
}

/**
 * Asiakkaan yhteenvedon tiedot (Generoitu LLM:llä)
 *
 * Tämä ei ole Firestore-dokumentti, vaan runtime-generoitu data.
 */
export interface ClientSummary {
  /**
   * Pääongelmat (lyhyt kuvaus)
   */
  mainProblems: string;

  /**
   * Aikaväli (esim. "2016-2024")
   */
  timePeriod: string;

  /**
   * Ladataanko yhteenvetoa
   */
  isLoading: boolean;

  /**
   * Virheviesti jos generointi epäonnistui
   */
  error?: string;
}
