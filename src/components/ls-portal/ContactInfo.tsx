/**
 * ContactInfo Component
 * Displays contact information for child, guardians, and professionals
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Users, Phone, Mail, Home, School, Edit } from 'lucide-react';
import ContactInfoEditor from '../ContactInfoEditor';
import type { ContactInfo as ContactInfoType } from '@/data/ls-types';
import type { ClientBasicInfo } from '@/types/client';
import { getClientBasicInfo } from '@/lib/clientService';
import { logger } from '@/lib/logger';

interface ContactInfoProps {
  contactInfo?: ContactInfoType;
  clientId: string;
  onUpdate?: () => void;
}

export const ContactInfo: React.FC<ContactInfoProps> = ({ contactInfo, clientId, onUpdate }) => {
  const [showEditor, setShowEditor] = useState(false);
  const [basicInfo, setBasicInfo] = useState<ClientBasicInfo | undefined>(undefined);

  // Load basic info from ASIAKAS_PERUSTIEDOT collection
  useEffect(() => {
    const loadBasicInfo = async () => {
      try {
        const data = await getClientBasicInfo(clientId);
        logger.debug('Loaded basicInfo from ASIAKAS_PERUSTIEDOT:', data);
        setBasicInfo(data || undefined);
      } catch (error) {
        logger.error('Error loading basic info:', error);
      }
    };

    if (clientId) {
      loadBasicInfo();
    }
  }, [clientId]);

  // Muunna ContactInfo -> ClientBasicInfo lomaketta varten
  const convertToBasicInfo = (): ClientBasicInfo | undefined => {
    if (!contactInfo) return undefined;

    // Muunna guardians object -> array
    const guardians: ClientBasicInfo['guardians'] = [];
    if (contactInfo.guardians.mother) {
      guardians.push({
        nimi: contactInfo.guardians.mother.name,
        rooli: 'äiti',
        puhelin: contactInfo.guardians.mother.phone,
        sahkoposti: contactInfo.guardians.mother.email,
        osoite: contactInfo.guardians.mother.address,
      });
    }
    if (contactInfo.guardians.father) {
      guardians.push({
        nimi: contactInfo.guardians.father.name,
        rooli: 'isä',
        puhelin: contactInfo.guardians.father.phone,
        sahkoposti: contactInfo.guardians.father.email,
        osoite: contactInfo.guardians.father.address,
      });
    }

    // Muunna professionals object -> array
    const professionals: ClientBasicInfo['professionals'] = [];
    if (contactInfo.professionals.socialWorker) {
      professionals.push({
        nimi: contactInfo.professionals.socialWorker.name,
        rooli: 'oma sosiaali työntekijä',
        puhelin: contactInfo.professionals.socialWorker.phone,
        sahkoposti: contactInfo.professionals.socialWorker.email,
      });
    }
    if (contactInfo.professionals.socialGuide) {
      professionals.push({
        nimi: contactInfo.professionals.socialGuide.name,
        rooli: 'sosiaaliohjaaja',
        puhelin: contactInfo.professionals.socialGuide.phone,
        sahkoposti: contactInfo.professionals.socialGuide.email,
      });
    }
    if (contactInfo.professionals.supervisor) {
      professionals.push({
        nimi: contactInfo.professionals.supervisor.name,
        rooli: 'tiimin esimies',
        puhelin: contactInfo.professionals.supervisor.phone,
        sahkoposti: contactInfo.professionals.supervisor.email,
      });
    }

    return {
      clientId,
      child: {
        nimi: contactInfo.child.name,
        puhelin: contactInfo.child.phone,
        koulu: contactInfo.child.school,
        koulunPuhelin: contactInfo.child.schoolPhone,
      },
      guardians,
      professionals,
    };
  };

  // Handle missing contact info
  if (!contactInfo) {
    return (
      <>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <CardTitle>Yhteystiedot</CardTitle>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowEditor(true)}
                className="ml-auto"
              >
                <Edit className="h-4 w-4 mr-1" />
                Muokkaa
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[220px] pr-4">
              <div className="flex flex-col items-center justify-center h-full text-center p-6">
                <Users className="h-12 w-12 text-gray-300 mb-3" />
                <p className="text-sm text-gray-500 mb-2">Ei yhteystietoja</p>
                <p className="text-xs text-gray-400">Lisää yhteystiedot muokkaa-painikkeesta</p>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
        <ContactInfoEditor
          open={showEditor}
          onClose={() => setShowEditor(false)}
          clientId={clientId}
          existingData={basicInfo || convertToBasicInfo()}
          onSaved={async () => {
            // Reload basicInfo from Firestore after save
            try {
              const data = await getClientBasicInfo(clientId);
              setBasicInfo(data || undefined);
            } catch (error) {
              logger.error('Error reloading basic info:', error);
            }

            setShowEditor(false);
            if (onUpdate) {
              onUpdate();
            }
          }}
        />
      </>
    );
  }

  const { child, guardians, reporters, professionals } = contactInfo;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            <CardTitle>Yhteystiedot</CardTitle>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowEditor(true)}
              className="ml-auto"
            >
              <Edit className="h-4 w-4 mr-1" />
              Muokkaa
            </Button>
          </div>
        </CardHeader>
      <CardContent>
        <ScrollArea className="h-[220px] pr-4">
          <div className="space-y-4">
            {/* Child Information */}
            <div className="border-l-4 border-blue-500 pl-3 py-1">
              <h4 className="font-semibold text-sm mb-2 text-blue-900">Lapsi</h4>
              <div className="space-y-1 text-sm">
                <p className="font-medium">{child.name}</p>
                {child.phone && (
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Phone className="h-3 w-3" />
                    <span>{child.phone}</span>
                  </div>
                )}
                {child.address && (
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Home className="h-3 w-3" />
                    <span>{child.address}</span>
                  </div>
                )}
                {child.school && (
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <School className="h-3 w-3" />
                    <span>{child.school}</span>
                    {child.schoolPhone && (
                      <span className="text-gray-500">({child.schoolPhone})</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Guardians */}
            {(guardians.mother || guardians.father) && (
              <div className="border-l-4 border-green-500 pl-3 py-1">
                <h4 className="font-semibold text-sm mb-2 text-green-900">
                  Huoltajat
                </h4>
                <div className="space-y-3">
                  {guardians.mother && (
                    <div className="text-sm">
                      <p className="font-medium text-xs text-gray-500 mb-1">Äiti</p>
                      <p>{guardians.mother.name}</p>
                      {guardians.mother.phone && (
                        <div className="flex items-center gap-2 text-xs text-gray-600 mt-1">
                          <Phone className="h-3 w-3" />
                          <span>{guardians.mother.phone}</span>
                        </div>
                      )}
                      {guardians.mother.email && (
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <Mail className="h-3 w-3" />
                          <span>{guardians.mother.email}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {guardians.father && (
                    <div className="text-sm">
                      <p className="font-medium text-xs text-gray-500 mb-1">Isä</p>
                      <p>{guardians.father.name}</p>
                      {guardians.father.phone && (
                        <div className="flex items-center gap-2 text-xs text-gray-600 mt-1">
                          <Phone className="h-3 w-3" />
                          <span>{guardians.father.phone}</span>
                        </div>
                      )}
                      {guardians.father.email && (
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <Mail className="h-3 w-3" />
                          <span>{guardians.father.email}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Reporters */}
            {reporters.length > 0 && (
              <div className="border-l-4 border-yellow-500 pl-3 py-1">
                <h4 className="font-semibold text-sm mb-2 text-yellow-900">
                  Ilmoittajat
                </h4>
                <div className="space-y-2">
                  {reporters.map((reporter, idx) => (
                    <div key={idx} className="text-sm">
                      <p className="font-medium">{reporter.name}</p>
                      <p className="text-xs text-gray-600">{reporter.profession}</p>
                      {reporter.phone && (
                        <div className="flex items-center gap-2 text-xs text-gray-600 mt-0.5">
                          <Phone className="h-3 w-3" />
                          <span>{reporter.phone}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Professionals */}
            {(professionals.socialWorker || professionals.socialGuide || professionals.teacher || professionals.supervisor) && (
              <div className="border-l-4 border-purple-500 pl-3 py-1">
                <h4 className="font-semibold text-sm mb-2 text-purple-900">
                  Ammattilaiset
                </h4>
                <div className="space-y-2">
                  {professionals.socialWorker && (
                    <div className="text-sm">
                      <p className="text-xs text-gray-500 mb-0.5">
                        Sosiaalityöntekijä
                      </p>
                      <p className="font-medium">{professionals.socialWorker.name}</p>
                      {professionals.socialWorker.phone && (
                        <div className="flex items-center gap-2 text-xs text-gray-600 mt-0.5">
                          <Phone className="h-3 w-3" />
                          <span>{professionals.socialWorker.phone}</span>
                        </div>
                      )}
                      {professionals.socialWorker.email && (
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <Mail className="h-3 w-3" />
                          <span>{professionals.socialWorker.email}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {professionals.socialGuide && (
                    <div className="text-sm">
                      <p className="text-xs text-gray-500 mb-0.5">Sosiaaliohjaaja</p>
                      <p className="font-medium">{professionals.socialGuide.name}</p>
                      {professionals.socialGuide.phone && (
                        <div className="flex items-center gap-2 text-xs text-gray-600 mt-0.5">
                          <Phone className="h-3 w-3" />
                          <span>{professionals.socialGuide.phone}</span>
                        </div>
                      )}
                      {professionals.socialGuide.email && (
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <Mail className="h-3 w-3" />
                          <span>{professionals.socialGuide.email}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {professionals.supervisor && (
                    <div className="text-sm">
                      <p className="text-xs text-gray-500 mb-0.5">Esimies</p>
                      <p className="font-medium">{professionals.supervisor.name}</p>
                      {professionals.supervisor.phone && (
                        <div className="flex items-center gap-2 text-xs text-gray-600 mt-0.5">
                          <Phone className="h-3 w-3" />
                          <span>{professionals.supervisor.phone}</span>
                        </div>
                      )}
                      {professionals.supervisor.email && (
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <Mail className="h-3 w-3" />
                          <span>{professionals.supervisor.email}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {professionals.teacher && (
                    <div className="text-sm">
                      <p className="text-xs text-gray-500 mb-0.5">Opettaja</p>
                      <p className="font-medium">{professionals.teacher.name}</p>
                      {professionals.teacher.school && (
                        <p className="text-xs text-gray-600">
                          {professionals.teacher.school}
                        </p>
                      )}
                      {professionals.teacher.phone && (
                        <div className="flex items-center gap-2 text-xs text-gray-600 mt-0.5">
                          <Phone className="h-3 w-3" />
                          <span>{professionals.teacher.phone}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>

    {/* Contact Info Editor */}
    <ContactInfoEditor
      open={showEditor}
      onClose={() => setShowEditor(false)}
      clientId={clientId}
      existingData={basicInfo || convertToBasicInfo()}
      onSaved={async () => {
        // Reload basicInfo from Firestore after save
        try {
          const data = await getClientBasicInfo(clientId);
          setBasicInfo(data || undefined);
        } catch (error) {
          logger.error('Error reloading basic info:', error);
        }

        setShowEditor(false);
        if (onUpdate) {
          onUpdate();
        }
      }}
    />
    </>
  );
};
