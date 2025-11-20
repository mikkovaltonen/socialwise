import React from 'react';
import { FileText, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface DocumentStructure {
  type: string;
  title: string;
  mainHeading: string;
  subHeadings: string[];
  description: string;
}

const documentStructures: DocumentStructure[] = [
  {
    type: 'pta',
    title: 'Palvelutarpeen arviointi (PTA)',
    mainHeading: '',
    subHeadings: [
      '## Päiväys',
      '## PERHE',
      '## TAUSTA',
      '## PALVELUT',
      '## YHTEISTYÖTAHOT ja VERKOSTO',
      '## LAPSEN JA PERHEEN TAPAAMINEN',
      '## ASIAKKAAN MIELIPIDE JA NÄKEMYS PALVELUTARPEESEEN',
      '## SOSIAALIHUOLLON AMMATTIHENKILÖN JOHTOPÄÄTÖKSET',
      '## ARVIO OMATYÖNTEKIJÄN TARPEESTA',
      '## JAKELU JA ALLEKIRJOITUS'
    ],
    description: 'Asiakkaan palvelutarpeen kartoitus ja arviointi'
  },
  {
    type: 'ls-ilmoitus',
    title: 'Lastensuojeluhakemus',
    mainHeading: '# Lastensuojeluhakemus',
    subHeadings: [
      '## PÄIVÄYS (automaattinen, lukittu)',
      '## ILMOITTAJAN TIEDOT',
      '## LAPSEN TIEDOT (automaattinen, lukittu)',
      '## HUOLTAJIEN TIEDOT (automaattinen, lukittu)',
      '## HUOLEN AIHEET',
      '## ILMOITUKSEN PERUSTE',
      '## TOIMENPITEET',
      '## ALLEKIRJOITUS JA KÄSITTELYN PÄÄTTYMISPÄIVÄMÄÄRÄ'
    ],
    description: 'Lastensuojeluhakemuksen dokumentointi automaattisilla kentillä'
  },
  {
    type: 'päätös',
    title: 'Päätös',
    mainHeading: '# Päätös',
    subHeadings: [
      '## RATKAISU TAI PÄÄTÖS',
      '## ASIAN VIREILLETULOPÄIVÄ',
      '## ASIAN KESKEINEN SISÄLTÖ',
      '## PÄÄTÖKSEN PERUSTELUT JA TOIMEENPANO',
      '## RATKAISU VOIMASSA',
      '## VALMISTELIJA / LAPSEN ASIOISTA VASTAAVA SOSIAALITYÖNTEKIJÄ',
      '## RATKAISIJA / VASTUUSOSIAALITYÖNTEKIJÄ / JOHTAVA SOSIAALITYÖNTEKIJÄ',
      '## TIEDOKSIANTO PMV'
    ],
    description: 'Viranomaispäätöksen dokumentointi'
  },
  {
    type: 'asiakassuunnitelma',
    title: 'Asiakassuunnitelma',
    mainHeading: '# Asiakassuunnitelma',
    subHeadings: [
      '## Lähtötilanne',
      '## Tavoitteet',
      '## Toimenpiteet',
      '## Seuranta ja arviointi'
    ],
    description: 'Asiakkaan palvelusuunnitelman laatiminen'
  },
  {
    type: 'asiakaskirjaus',
    title: 'Asiakaskirjaus',
    mainHeading: '# Asiakaskirjaus',
    subHeadings: [],
    description: 'Asiakaskontaktin dokumentointi vapaamuotoisena tekstinä'
  },
  {
    type: 'yhteystiedot',
    title: 'Yhteystiedot',
    mainHeading: '# Yhteystiedot',
    subHeadings: [
      '## Asiakas',
      '## Yhteyshenkilöt',
      '## Verkosto',
      '## Huomioitavaa'
    ],
    description: 'Asiakkaan yhteystietojen ja verkoston hallinta'
  }
];

export function DocumentStructureViewer() {
  return (
    <div className="space-y-6 max-h-[80vh] overflow-y-auto pr-4">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="h-6 w-6" />
          Dokumenttien otsikkorakenteet
        </h2>
        <p className="text-muted-foreground">
          Kaikki dokumentit käyttävät pakollista otsikkorakennetta. Otsikot ovat lukittuja ja ei-muokattavia,
          käyttäjä täyttää vain sisällöt otsikkojen alle.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {documentStructures.map((doc) => (
          <Card key={doc.type} className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{doc.title}</span>
                <Badge variant="outline">{doc.type}</Badge>
              </CardTitle>
              <CardDescription>{doc.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Main Heading */}
                {doc.mainHeading && (
                  <div className="bg-primary/5 p-3 rounded-md border-l-4 border-primary">
                    <code className="text-sm font-mono font-semibold text-primary">
                      {doc.mainHeading}
                    </code>
                    <div className="text-xs text-muted-foreground mt-1">
                      Pääotsikko (lukittu)
                    </div>
                  </div>
                )}

                {/* Metadata - Only for non-PTA and non-päätös documents */}
                {doc.type !== 'pta' && doc.type !== 'päätös' && (
                  <div className="bg-blue-50 p-2 rounded text-xs font-mono text-blue-900 border border-blue-200">
                    **Päiväys:** [automaattinen]
                  </div>
                )}

                {/* Sub Headings */}
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Pakolliset alaotsikot:
                  </div>
                  {doc.subHeadings.map((heading, index) => (
                    <div key={index} className="flex items-start gap-2 pl-2">
                      <ChevronRight className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <code className="text-sm font-mono text-foreground/90">
                          {heading}
                        </code>
                        <div className="mt-1 text-xs text-muted-foreground bg-muted/30 p-2 rounded border border-dashed">
                          [Muokattava tekstikenttä]
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-yellow-200 bg-yellow-50/50">
        <CardHeader>
          <CardTitle className="text-base">Huomioitavaa</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex gap-2">
            <span className="font-semibold min-w-[120px]">Lukitut otsikot:</span>
            <span>Käyttäjä ei voi muokata tai poistaa otsikkorakenteita</span>
          </div>
          <div className="flex gap-2">
            <span className="font-semibold min-w-[120px]">Päivämäärät:</span>
            <span>Päivämäärät ovat muokattavia kenttiä (ei automaattisia)</span>
          </div>
          <div className="flex gap-2">
            <span className="font-semibold min-w-[120px]">Tallennusmuoto:</span>
            <span>Dokumentit tallennetaan markdown-muodossa</span>
          </div>
          <div className="flex gap-2">
            <span className="font-semibold min-w-[120px]">Muokkaus koodissa:</span>
            <span className="text-xs font-mono bg-white px-2 py-1 rounded">
              src/components/MarkdownDocumentEditor.tsx
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
