/**
 * ContactInfo Component
 * Displays contact information for child, guardians, and professionals
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Users, Phone, Mail, Home, School } from 'lucide-react';
import type { ContactInfo as ContactInfoType } from '@/data/ls-types';

interface ContactInfoProps {
  contactInfo: ContactInfoType;
}

export const ContactInfo: React.FC<ContactInfoProps> = ({ contactInfo }) => {
  const { child, guardians, reporters, professionals } = contactInfo;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          <CardTitle>Yhteystiedot</CardTitle>
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
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <Home className="h-3 w-3" />
                  <span>{child.address}</span>
                </div>
                {child.school && (
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <School className="h-3 w-3" />
                    <span>{child.school}</span>
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
            {(professionals.socialWorker || professionals.socialGuide || professionals.teacher) && (
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
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
