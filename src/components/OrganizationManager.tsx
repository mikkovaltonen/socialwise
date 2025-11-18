/**
 * Organization Manager Component
 *
 * Manages client organizations and user roles
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  getUserClientOrganizations,
  getClientOrganization,
  createClientOrganization,
  updateClientOrganization,
  addUserRole,
  removeUserRole,
} from '@/lib/organizationService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Users, Edit, Trash2, AlertCircle, Check, RefreshCw } from 'lucide-react';
import type { ClientOrganization, UserRole } from '@/data/ls-types';

const ROLE_LABELS = {
  'oma_työntekijä': 'Oma työntekijä',
  'vastuullinen_sosiaalityöntekijä': 'Vastuullinen sosiaalityöntekijä',
  'sosiaalipalvelun_esimies': 'Sosiaalipalvelun esimies',
};

const ROLE_COLORS = {
  'oma_työntekijä': 'bg-blue-100 text-blue-800',
  'vastuullinen_sosiaalityöntekijä': 'bg-green-100 text-green-800',
  'sosiaalipalvelun_esimies': 'bg-purple-100 text-purple-800',
};

export default function OrganizationManager() {
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState<ClientOrganization[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Create/Edit dialogs
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingOrg, setEditingOrg] = useState<ClientOrganization | null>(null);

  // Form data
  const [clientName, setClientName] = useState('');
  const [socialSecurityNumber, setSocialSecurityNumber] = useState('');

  // Role management
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [managingOrg, setManagingOrg] = useState<ClientOrganization | null>(null);
  const [newRoleUserEmail, setNewRoleUserEmail] = useState('');
  const [newRoleType, setNewRoleType] = useState<UserRole['role']>('oma_työntekijä');

  useEffect(() => {
    if (user) {
      loadOrganizations();
    }
  }, [user]);

  const loadOrganizations = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const orgs = await getUserClientOrganizations(user.uid);
      setOrganizations(orgs);
    } catch (error) {
      console.error('Error loading organizations:', error);
      setError('Virhe organisaatioiden lataamisessa');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrganization = async () => {
    if (!user || !clientName.trim()) return;

    setSaving(true);
    setMessage('');
    setError('');

    try {
      // Generate technical client ID (UUID)
      const clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const organization = await createClientOrganization(
        clientId,
        clientName.trim(),
        socialSecurityNumber.trim() || undefined,
        user.uid,
        user.email || ''
      );

      setOrganizations(prev => [...prev, organization]);
      setShowCreateDialog(false);
      setClientName('');
      setSocialSecurityNumber('');
      setMessage('Organisaatio luotu onnistuneesti');
    } catch (error) {
      console.error('Error creating organization:', error);
      setError('Virhe organisaation luomisessa');
    } finally {
      setSaving(false);
    }
  };

  const handleEditOrganization = async () => {
    if (!editingOrg || !clientName.trim()) return;

    setSaving(true);
    setMessage('');
    setError('');

    try {
      await updateClientOrganization(editingOrg.clientId, {
        clientName: clientName.trim(),
        socialSecurityNumber: socialSecurityNumber.trim() || undefined,
      });

      setOrganizations(prev =>
        prev.map(org =>
          org.clientId === editingOrg.clientId
            ? { ...org, clientName: clientName.trim(), socialSecurityNumber: socialSecurityNumber.trim() || undefined }
            : org
        )
      );

      setShowEditDialog(false);
      setEditingOrg(null);
      setClientName('');
      setSocialSecurityNumber('');
      setMessage('Organisaatio päivitetty onnistuneesti');
    } catch (error) {
      console.error('Error updating organization:', error);
      setError('Virhe organisaation päivityksessä');
    } finally {
      setSaving(false);
    }
  };

  const handleAddRole = async () => {
    if (!managingOrg || !newRoleUserEmail.trim()) return;

    setSaving(true);
    setMessage('');
    setError('');

    try {
      // In a real app, you'd look up the user ID by email
      // For now, we'll use a placeholder user ID
      const placeholderUserId = `user_${newRoleUserEmail.replace('@', '_').replace('.', '_')}`;

      await addUserRole(
        managingOrg.clientId,
        placeholderUserId,
        newRoleUserEmail.trim(),
        newRoleType
      );

      // Reload organizations to get updated data
      await loadOrganizations();

      setNewRoleUserEmail('');
      setNewRoleType('oma_työntekijä');
      setMessage('Rooli lisätty onnistuneesti');
    } catch (error) {
      console.error('Error adding role:', error);
      setError('Virhe roolin lisäämisessä');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveRole = async (orgId: string, userId: string, role: UserRole['role']) => {
    setSaving(true);
    setMessage('');
    setError('');

    try {
      await removeUserRole(orgId, userId, role);

      // Reload organizations to get updated data
      await loadOrganizations();

      setMessage('Rooli poistettu onnistuneesti');
    } catch (error) {
      console.error('Error removing role:', error);
      setError('Virhe roolin poistamisessa');
    } finally {
      setSaving(false);
    }
  };

  const openEditDialog = (org: ClientOrganization) => {
    setEditingOrg(org);
    setClientName(org.clientName);
    setSocialSecurityNumber(org.socialSecurityNumber || '');
    setShowEditDialog(true);
  };

  const openRoleDialog = (org: ClientOrganization) => {
    setManagingOrg(org);
    setShowRoleDialog(true);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <RefreshCw className="w-6 h-6 animate-spin mr-2" />
          Ladataan organisaatioita...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Info Alert */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Huom:</strong> Jokaisella lapsella voi olla kolme käyttäjäroolia: Oma työntekijä, Vastuullinen sosiaalityöntekijä ja Sosiaalipalvelun esimies.
          Dokumentit yhdistetään teknisen avaimen perusteella, ei lapsen nimen perusteella.
        </AlertDescription>
      </Alert>

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Organisaatioiden hallinta</h2>
          <p className="text-gray-600">Hallitse asiakasorganisaatioita ja käyttäjärooleja</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Lisää uusi asiakas
        </Button>
      </div>

      {/* Messages */}
      {message && (
        <Alert>
          <Check className="h-4 w-4" />
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Organizations List */}
      <div className="grid gap-4">
        {organizations.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center h-32">
              <div className="text-center">
                <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">Ei organisaatioita</p>
                <p className="text-sm text-gray-400">Luo ensimmäinen asiakas aloittaaksesi</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          organizations.map((org) => (
            <Card key={org.clientId}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{org.clientName}</CardTitle>
                    <CardDescription>
                      ID: {org.clientId}
                      {org.socialSecurityNumber && ` • SOTU: ${org.socialSecurityNumber}`}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(org)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openRoleDialog(org)}
                    >
                      <Users className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">Käyttäjäroolit:</h4>
                  {org.roles.length === 0 ? (
                    <p className="text-sm text-gray-500">Ei rooleja määritelty</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {org.roles.map((role, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <Badge className={ROLE_COLORS[role.role]}>
                            {ROLE_LABELS[role.role]}
                          </Badge>
                          <span className="text-sm text-gray-600">{role.userEmail}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveRole(org.clientId, role.userId, role.role)}
                            className="h-6 w-6 p-0 text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create Organization Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Luo uusi asiakasorganisaatio</DialogTitle>
            <DialogDescription>
              Anna asiakkaan perustiedot. Sinut lisätään automaattisesti "Oma työntekijä" rooliin.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="client-name">Asiakkaan nimi</Label>
              <Input
                id="client-name"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Esim. Lapsi Virtanen"
              />
            </div>
            <div>
              <Label htmlFor="social-security">Henkilötunnus (valinnainen)</Label>
              <Input
                id="social-security"
                value={socialSecurityNumber}
                onChange={(e) => setSocialSecurityNumber(e.target.value)}
                placeholder="123456-789A"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Peruuta
            </Button>
            <Button
              onClick={handleCreateOrganization}
              disabled={saving || !clientName.trim()}
            >
              {saving ? 'Luodaan...' : 'Luo organisaatio'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Organization Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Muokkaa asiakasta</DialogTitle>
            <DialogDescription>
              Päivitä asiakkaan perustiedot.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="edit-client-name">Asiakkaan nimi</Label>
              <Input
                id="edit-client-name"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Esim. Lapsi Virtanen"
              />
            </div>
            <div>
              <Label htmlFor="edit-social-security">Henkilötunnus (valinnainen)</Label>
              <Input
                id="edit-social-security"
                value={socialSecurityNumber}
                onChange={(e) => setSocialSecurityNumber(e.target.value)}
                placeholder="123456-789A"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Peruuta
            </Button>
            <Button
              onClick={handleEditOrganization}
              disabled={saving || !clientName.trim()}
            >
              {saving ? 'Tallennetaan...' : 'Tallenna muutokset'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Role Management Dialog */}
      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Hallitse käyttäjärooleja</DialogTitle>
            <DialogDescription>
              {managingOrg?.clientName} - Lisää tai poista käyttäjärooleja
            </DialogDescription>
          </DialogHeader>

          {managingOrg && (
            <div className="space-y-6">
              {/* Current Roles */}
              <div>
                <h4 className="font-medium mb-3">Nykyiset roolit:</h4>
                {managingOrg.roles.length === 0 ? (
                  <p className="text-sm text-gray-500">Ei rooleja määritelty</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Rooli</TableHead>
                        <TableHead>Käyttäjä</TableHead>
                        <TableHead>Toiminnot</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {managingOrg.roles.map((role, idx) => (
                        <TableRow key={idx}>
                          <TableCell>
                            <Badge className={ROLE_COLORS[role.role]}>
                              {ROLE_LABELS[role.role]}
                            </Badge>
                          </TableCell>
                          <TableCell>{role.userEmail}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveRole(managingOrg.clientId, role.userId, role.role)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>

              {/* Add New Role */}
              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Lisää uusi rooli:</h4>
                <div className="flex gap-2">
                  <Input
                    placeholder="Käyttäjän sähköposti"
                    value={newRoleUserEmail}
                    onChange={(e) => setNewRoleUserEmail(e.target.value)}
                    className="flex-1"
                  />
                  <Select value={newRoleType} onValueChange={(value: UserRole['role']) => setNewRoleType(value)}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="oma_työntekijä">Oma työntekijä</SelectItem>
                      <SelectItem value="vastuullinen_sosiaalityöntekijä">Vastuullinen sosiaalityöntekijä</SelectItem>
                      <SelectItem value="sosiaalipalvelun_esimies">Sosiaalipalvelun esimies</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={handleAddRole}
                    disabled={saving || !newRoleUserEmail.trim()}
                  >
                    {saving ? 'Lisätään...' : 'Lisää'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRoleDialog(false)}>
              Sulje
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}