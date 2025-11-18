/**
 * ContactInfoEditor - Rakenteellinen lomake yhteystietojen muokkaamiseen
 *
 * Tallentaa tiedot suoraan Firestore ASIAKAS_PERUSTIEDOT-kokoelmaan
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Save, X, Loader2, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { saveClientBasicInfo } from '@/lib/clientService';
import type { ClientBasicInfo } from '@/types/client';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';

interface ContactInfoEditorProps {
  open: boolean;
  onClose: () => void;
  clientId: string;
  existingData?: ClientBasicInfo;
  onSaved?: () => void;
}

export const ContactInfoEditor: React.FC<ContactInfoEditorProps> = ({
  open,
  onClose,
  clientId,
  existingData,
  onSaved,
}) => {
  // Lapsen tiedot
  const [childName, setChildName] = useState('');
  const [childPhone, setChildPhone] = useState('');
  const [childSchool, setChildSchool] = useState('');
  const [childSchoolPhone, setChildSchoolPhone] = useState('');

  // Huoltajat
  const [guardians, setGuardians] = useState<Array<{
    nimi: string;
    rooli: string;
    puhelin: string;
    sahkoposti: string;
    osoite: string;
  }>>([]);

  // Ammattilaiset
  const [professionals, setProfessionals] = useState<Array<{
    nimi: string;
    rooli: string;
    puhelin: string;
    sahkoposti: string;
  }>>([]);

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Lataa olemassa olevat tiedot
  useEffect(() => {
    if (open && existingData) {
      setChildName(existingData.child?.nimi || '');
      setChildPhone(existingData.child?.puhelin || '');
      setChildSchool(existingData.child?.koulu || '');
      setChildSchoolPhone(existingData.child?.koulunPuhelin || '');
      setGuardians(existingData.guardians || []);
      setProfessionals(existingData.professionals || []);
    } else if (open && !existingData) {
      // Tyhjennä lomake uudelle asiakkaalle
      resetForm();
    }
  }, [open, existingData]);

  const resetForm = () => {
    setChildName('');
    setChildPhone('');
    setChildSchool('');
    setChildSchoolPhone('');
    setGuardians([]);
    setProfessionals([]);
    setError(null);
  };

  const handleAddGuardian = () => {
    setGuardians([
      ...guardians,
      { nimi: '', rooli: 'äiti', puhelin: '', sahkoposti: '', osoite: '' },
    ]);
  };

  const handleRemoveGuardian = (index: number) => {
    setGuardians(guardians.filter((_, i) => i !== index));
  };

  const handleUpdateGuardian = (index: number, field: string, value: string) => {
    const updated = [...guardians];
    updated[index] = { ...updated[index], [field]: value };
    setGuardians(updated);
  };

  const handleAddProfessional = () => {
    setProfessionals([
      ...professionals,
      { nimi: '', rooli: 'oma sosiaali työntekijä', puhelin: '', sahkoposti: '' },
    ]);
  };

  const handleRemoveProfessional = (index: number) => {
    setProfessionals(professionals.filter((_, i) => i !== index));
  };

  const handleUpdateProfessional = (index: number, field: string, value: string) => {
    const updated = [...professionals];
    updated[index] = { ...updated[index], [field]: value };
    setProfessionals(updated);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);

      // Validoi pakolliset kentät
      if (!childName.trim()) {
        setError('Lapsen nimi on pakollinen');
        return;
      }

      const basicInfo: ClientBasicInfo = {
        clientId,
        child: {
          nimi: childName.trim(),
          puhelin: childPhone.trim() || undefined,
          koulu: childSchool.trim() || undefined,
          koulunPuhelin: childSchoolPhone.trim() || undefined,
        },
        guardians: guardians.filter(g => g.nimi.trim()), // Poista tyhjät
        professionals: professionals.filter(p => p.nimi.trim()), // Poista tyhjät
      };

      const success = await saveClientBasicInfo(basicInfo);

      if (success) {
        toast.success('Yhteystiedot tallennettu');
        logger.debug('Contact info saved successfully');

        if (onSaved) {
          onSaved();
        }

        onClose();
      } else {
        setError('Tallennus epäonnistui. Yritä uudelleen.');
      }
    } catch (err) {
      logger.error('Error saving contact info:', err);
      setError(err instanceof Error ? err.message : 'Tallennus epäonnistui');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Muokkaa yhteystietoja</DialogTitle>
          <DialogDescription>
            Päivitä asiakkaan ja verkostotoimijoiden yhteystiedot
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Lapsen tiedot */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Lapsen tiedot</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="child-name">Nimi *</Label>
                <Input
                  id="child-name"
                  value={childName}
                  onChange={(e) => setChildName(e.target.value)}
                  placeholder="Etunimi Sukunimi"
                />
              </div>

              <div>
                <Label htmlFor="child-phone">Puhelinnumero</Label>
                <Input
                  id="child-phone"
                  value={childPhone}
                  onChange={(e) => setChildPhone(e.target.value)}
                  placeholder="040-1234567"
                />
              </div>

              <div>
                <Label htmlFor="child-school">Koulu</Label>
                <Input
                  id="child-school"
                  value={childSchool}
                  onChange={(e) => setChildSchool(e.target.value)}
                  placeholder="Koulun nimi"
                />
              </div>

              <div>
                <Label htmlFor="child-school-phone">Koulun puhelinnumero</Label>
                <Input
                  id="child-school-phone"
                  value={childSchoolPhone}
                  onChange={(e) => setChildSchoolPhone(e.target.value)}
                  placeholder="09-1234567"
                />
              </div>
            </div>
          </div>

          {/* Huoltajat */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-lg font-semibold">Huoltajat</h3>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleAddGuardian}
              >
                <Plus className="h-4 w-4 mr-1" />
                Lisää huoltaja
              </Button>
            </div>

            {guardians.map((guardian, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-3 bg-gray-50">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">
                    Huoltaja {index + 1}
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemoveGuardian(index)}
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Nimi</Label>
                    <Input
                      value={guardian.nimi}
                      onChange={(e) => handleUpdateGuardian(index, 'nimi', e.target.value)}
                      placeholder="Etunimi Sukunimi"
                    />
                  </div>

                  <div>
                    <Label>Rooli</Label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={guardian.rooli}
                      onChange={(e) => handleUpdateGuardian(index, 'rooli', e.target.value)}
                    >
                      <option value="äiti">Äiti</option>
                      <option value="isä">Isä</option>
                      <option value="huoltaja">Huoltaja</option>
                    </select>
                  </div>

                  <div>
                    <Label>Puhelinnumero</Label>
                    <Input
                      value={guardian.puhelin}
                      onChange={(e) => handleUpdateGuardian(index, 'puhelin', e.target.value)}
                      placeholder="040-1234567"
                    />
                  </div>

                  <div>
                    <Label>Sähköposti</Label>
                    <Input
                      value={guardian.sahkoposti}
                      onChange={(e) => handleUpdateGuardian(index, 'sahkoposti', e.target.value)}
                      placeholder="email@example.com"
                    />
                  </div>

                  <div className="col-span-2">
                    <Label>Osoite</Label>
                    <Input
                      value={guardian.osoite}
                      onChange={(e) => handleUpdateGuardian(index, 'osoite', e.target.value)}
                      placeholder="Katuosoite, Postinumero Kaupunki"
                    />
                  </div>
                </div>
              </div>
            ))}

            {guardians.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">
                Ei huoltajia. Lisää huoltaja yllä olevasta painikkeesta.
              </p>
            )}
          </div>

          {/* Ammattilaiset */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-lg font-semibold">Ammattilaiset</h3>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleAddProfessional}
              >
                <Plus className="h-4 w-4 mr-1" />
                Lisää ammattilainen
              </Button>
            </div>

            {professionals.map((prof, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-3 bg-gray-50">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">
                    Ammattilainen {index + 1}
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemoveProfessional(index)}
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Nimi</Label>
                    <Input
                      value={prof.nimi}
                      onChange={(e) => handleUpdateProfessional(index, 'nimi', e.target.value)}
                      placeholder="Etunimi Sukunimi"
                    />
                  </div>

                  <div>
                    <Label>Rooli</Label>
                    <Input
                      value={prof.rooli}
                      onChange={(e) => handleUpdateProfessional(index, 'rooli', e.target.value)}
                      placeholder="esim. oma sosiaali työntekijä"
                    />
                  </div>

                  <div>
                    <Label>Puhelinnumero</Label>
                    <Input
                      value={prof.puhelin}
                      onChange={(e) => handleUpdateProfessional(index, 'puhelin', e.target.value)}
                      placeholder="040-1234567"
                    />
                  </div>

                  <div>
                    <Label>Sähköposti</Label>
                    <Input
                      value={prof.sahkoposti}
                      onChange={(e) => handleUpdateProfessional(index, 'sahkoposti', e.target.value)}
                      placeholder="email@example.com"
                    />
                  </div>
                </div>
              </div>
            ))}

            {professionals.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">
                Ei ammattilaisia. Lisää ammattilainen yllä olevasta painikkeesta.
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSaving}
          >
            <X className="h-4 w-4 mr-1" />
            Peruuta
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                Tallennetaan...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-1" />
                Tallenna
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ContactInfoEditor;
