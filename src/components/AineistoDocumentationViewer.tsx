import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, FileText, AlertCircle, FileQuestion, Users, Scale, Phone, ClipboardList, File } from "lucide-react";
import MarkdownEditor from './MarkdownEditor';

interface DocumentContent {
  lsIlmoitukset: string;
  asiakaskirjaukset: string;
  paatokset: string;
  yhteystiedot: string;
  pta: string;
  asiakassuunnitelmat: string;
}

const AineistoDocumentationViewer = () => {
  const [content, setContent] = useState<DocumentContent>({
    lsIlmoitukset: "",
    asiakaskirjaukset: "",
    paatokset: "",
    yhteystiedot: "",
    pta: "",
    asiakassuunnitelmat: ""
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all 6 documentation files
        const [
          lsIlmoituksetRes,
          asiakaskirjauksetRes,
          paatoksetRes,
          yhteystiedotRes,
          ptaRes,
          asiakassuunnitelmatRes
        ] = await Promise.all([
          fetch('/Aineisto_Documentation/ls-ilmoitukset.md'),
          fetch('/Aineisto_Documentation/asiakaskirjaukset.md'),
          fetch('/Aineisto_Documentation/paatokset.md'),
          fetch('/Aineisto_Documentation/yhteystiedot.md'),
          fetch('/Aineisto_Documentation/pta.md'),
          fetch('/Aineisto_Documentation/asiakassuunnitelmat.md')
        ]);

        setContent({
          lsIlmoitukset: lsIlmoituksetRes.ok
            ? await lsIlmoituksetRes.text()
            : '# LS-ilmoitukset\n\nDokumentaatio ei ole saatavilla.',
          asiakaskirjaukset: asiakaskirjauksetRes.ok
            ? await asiakaskirjauksetRes.text()
            : '# Asiakaskirjaukset\n\nDokumentaatio ei ole saatavilla.',
          paatokset: paatoksetRes.ok
            ? await paatoksetRes.text()
            : '# Päätökset\n\nDokumentaatio ei ole saatavilla.',
          yhteystiedot: yhteystiedotRes.ok
            ? await yhteystiedotRes.text()
            : '# Yhteystiedot\n\nDokumentaatio ei ole saatavilla.',
          pta: ptaRes.ok
            ? await ptaRes.text()
            : '# PTA\n\nDokumentaatio ei ole saatavilla.',
          asiakassuunnitelmat: asiakassuunnitelmatRes.ok
            ? await asiakassuunnitelmatRes.text()
            : '# Asiakassuunnitelmat\n\nDokumentaatio ei ole saatavilla.'
        });

      } catch (err) {
        console.error('Error fetching documents:', err);
        setError('Dokumentaation lataaminen epäonnistui. Varmista että tiedostot ovat /public/Aineisto_Documentation/ -kansiossa.');
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-600">Ladataan dokumentaatiota...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900 mb-1">Virhe dokumentaation latauksessa</h3>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="ls-ilmoitukset" className="w-full">
        <TabsList className="grid w-full grid-cols-6 mb-4">
          <TabsTrigger value="ls-ilmoitukset" className="flex items-center gap-2 text-xs">
            <FileQuestion className="h-4 w-4" />
            <span className="hidden sm:inline">LS-ilmoitukset</span>
            <span className="sm:hidden">LS</span>
          </TabsTrigger>
          <TabsTrigger value="asiakaskirjaukset" className="flex items-center gap-2 text-xs">
            <ClipboardList className="h-4 w-4" />
            <span className="hidden sm:inline">Asiakaskirjaukset</span>
            <span className="sm:hidden">Kirjaukset</span>
          </TabsTrigger>
          <TabsTrigger value="paatokset" className="flex items-center gap-2 text-xs">
            <Scale className="h-4 w-4" />
            <span className="hidden sm:inline">Päätökset</span>
            <span className="sm:hidden">Päätökset</span>
          </TabsTrigger>
          <TabsTrigger value="yhteystiedot" className="flex items-center gap-2 text-xs">
            <Phone className="h-4 w-4" />
            <span className="hidden sm:inline">Yhteystiedot</span>
            <span className="sm:hidden">Yhteystiedot</span>
          </TabsTrigger>
          <TabsTrigger value="pta" className="flex items-center gap-2 text-xs">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">PTA</span>
            <span className="sm:hidden">PTA</span>
          </TabsTrigger>
          <TabsTrigger value="asiakassuunnitelmat" className="flex items-center gap-2 text-xs">
            <File className="h-4 w-4" />
            <span className="hidden sm:inline">Asiakassuunnitelmat</span>
            <span className="sm:hidden">Suunnitelmat</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ls-ilmoitukset" className="mt-0">
          <Card>
            <CardContent className="p-6">
              <MarkdownEditor
                value={content.lsIlmoitukset}
                onChange={() => {}} // Read-only
                readOnly={true}
                label="LS-ilmoitukset - Dokumentaatio"
                minHeight="600px"
                placeholder="Ladataan dokumentaatiota..."
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="asiakaskirjaukset" className="mt-0">
          <Card>
            <CardContent className="p-6">
              <MarkdownEditor
                value={content.asiakaskirjaukset}
                onChange={() => {}} // Read-only
                readOnly={true}
                label="Asiakaskirjaukset - Dokumentaatio"
                minHeight="600px"
                placeholder="Ladataan dokumentaatiota..."
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="paatokset" className="mt-0">
          <Card>
            <CardContent className="p-6">
              <MarkdownEditor
                value={content.paatokset}
                onChange={() => {}} // Read-only
                readOnly={true}
                label="Päätökset - Dokumentaatio"
                minHeight="600px"
                placeholder="Ladataan dokumentaatiota..."
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="yhteystiedot" className="mt-0">
          <Card>
            <CardContent className="p-6">
              <MarkdownEditor
                value={content.yhteystiedot}
                onChange={() => {}} // Read-only
                readOnly={true}
                label="Yhteystiedot - Dokumentaatio"
                minHeight="600px"
                placeholder="Ladataan dokumentaatiota..."
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pta" className="mt-0">
          <Card>
            <CardContent className="p-6">
              <MarkdownEditor
                value={content.pta}
                onChange={() => {}} // Read-only
                readOnly={true}
                label="PTA - Dokumentaatio"
                minHeight="600px"
                placeholder="Ladataan dokumentaatiota..."
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="asiakassuunnitelmat" className="mt-0">
          <Card>
            <CardContent className="p-6">
              <MarkdownEditor
                value={content.asiakassuunnitelmat}
                onChange={() => {}} // Read-only
                readOnly={true}
                label="Asiakassuunnitelmat - Dokumentaatio"
                minHeight="600px"
                placeholder="Ladataan dokumentaatiota..."
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AineistoDocumentationViewer;
