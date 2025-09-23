/**
 * Purchase Requisition Verification Panel
 * 
 * Allows users to view and manage their own purchase requisitions
 */

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  FileText, 
  Plus, 
  Edit, 
  Trash2, 
  Send, 
  Check, 
  X,
  Eye,
  Download,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { 
  purchaseRequisitionService, 
  PurchaseRequisition, 
  RequisitionStatus,
  RequisitionLineItem 
} from '@/lib/purchaseRequisitionService';

export const PurchaseRequisitionPanel: React.FC = () => {
  const { user } = useAuth();
  const [requisitions, setRequisitions] = useState<PurchaseRequisition[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequisition, setSelectedRequisition] = useState<PurchaseRequisition | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  
  // Form state for new requisition
  const [formData, setFormData] = useState({
    department: '',
    requestedDeliveryDate: '',
    businessJustification: '',
    urgencyLevel: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    preferredSupplier: '',
    deliveryLocationCode: 'FI-HEL-01',
    deliveryLocationName: 'Helsinki Office',
    lineItems: [] as RequisitionLineItem[]
  });

  // Load user's requisitions
  useEffect(() => {
    loadRequisitions();
  }, [user]);

  const loadRequisitions = async () => {
    if (!user?.uid) return;
    
    setLoading(true);
    try {
      const userRequisitions = await purchaseRequisitionService.getUserRequisitions(user.uid);
      setRequisitions(userRequisitions);
    } catch (error) {
      toast.error('Failed to load purchase requisitions');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRequisition = async () => {
    if (!user) {
      toast.error('You must be logged in to create requisitions');
      return;
    }

    if (!formData.department || !formData.requestedDeliveryDate || !formData.businessJustification) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.lineItems.length === 0) {
      toast.error('Please add at least one line item');
      return;
    }

    try {
      const requisitionData = {
        externalCode: `EXT-${Date.now()}`,
        requesterId: user.uid,
        requesterName: user.email || 'Unknown',
        requesterEmail: user.email || '',
        department: formData.department,
        requestedDeliveryDate: formData.requestedDeliveryDate,
        status: RequisitionStatus.DRAFT,
        currency: 'EUR',
        preferredSupplier: formData.preferredSupplier,
        deliveryAddress: {
          locationCode: formData.deliveryLocationCode,
          locationName: formData.deliveryLocationName,
          city: 'Helsinki',
          country: 'Finland'
        },
        lineItems: formData.lineItems,
        businessJustification: formData.businessJustification,
        urgencyLevel: formData.urgencyLevel
      };

      const requisitionId = await purchaseRequisitionService.createRequisition(
        user.uid,
        requisitionData
      );

      toast.success(`Purchase requisition created: ${requisitionId}`);
      setShowCreateDialog(false);
      resetForm();
      loadRequisitions();
    } catch (error) {
      toast.error('Failed to create purchase requisition');
      console.error(error);
    }
  };

  const handleSubmitForApproval = async (requisitionId: string) => {
    try {
      await purchaseRequisitionService.submitForApproval(requisitionId);
      toast.success('Requisition submitted for approval');
      loadRequisitions();
    } catch (error) {
      toast.error('Failed to submit requisition');
    }
  };

  const resetForm = () => {
    setFormData({
      department: '',
      requestedDeliveryDate: '',
      businessJustification: '',
      urgencyLevel: 'medium',
      preferredSupplier: '',
      deliveryLocationCode: 'FI-HEL-01',
      deliveryLocationName: 'Helsinki Office',
      lineItems: []
    });
  };

  const addLineItem = () => {
    const newItem: RequisitionLineItem = {
      lineNumber: formData.lineItems.length + 1,
      itemDescription: '',
      quantity: 1,
      unitOfMeasure: 'EA',
      unitPrice: 0,
      totalAmount: 0,
      requestedDate: formData.requestedDeliveryDate
    };
    
    setFormData({
      ...formData,
      lineItems: [...formData.lineItems, newItem]
    });
  };

  const updateLineItem = (index: number, field: keyof RequisitionLineItem, value: any) => {
    const updatedItems = [...formData.lineItems];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value
    };
    
    // Recalculate total if quantity or unit price changed
    if (field === 'quantity' || field === 'unitPrice') {
      updatedItems[index].totalAmount = 
        updatedItems[index].quantity * updatedItems[index].unitPrice;
    }
    
    setFormData({ ...formData, lineItems: updatedItems });
  };

  const removeLineItem = (index: number) => {
    const updatedItems = formData.lineItems.filter((_, i) => i !== index);
    // Renumber line items
    updatedItems.forEach((item, i) => {
      item.lineNumber = i + 1;
    });
    setFormData({ ...formData, lineItems: updatedItems });
  };

  const getStatusBadge = (status: RequisitionStatus) => {
    const statusConfig = {
      [RequisitionStatus.DRAFT]: { label: 'Draft', variant: 'secondary' },
      [RequisitionStatus.SUBMITTED]: { label: 'Submitted', variant: 'default' },
      [RequisitionStatus.APPROVED]: { label: 'Approved', variant: 'success' },
      [RequisitionStatus.REJECTED]: { label: 'Rejected', variant: 'destructive' },
      [RequisitionStatus.ORDERED]: { label: 'Ordered', variant: 'default' },
      [RequisitionStatus.CANCELLED]: { label: 'Cancelled', variant: 'secondary' }
    };

    const config = statusConfig[status] || { label: status, variant: 'default' };
    
    return (
      <Badge variant={config.variant as any}>
        {config.label}
      </Badge>
    );
  };

  const formatDate = (date: any) => {
    if (!date) return '-';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('fi-FI');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-6 w-6" />
              Purchase Requisition Verification
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={loadRequisitions}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create Purchase Requisition</DialogTitle>
                    <DialogDescription>
                      Create a new purchase requisition for approval
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4 py-4">
                    {/* Basic Information */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Department *</Label>
                        <Input
                          value={formData.department}
                          onChange={(e) => setFormData({...formData, department: e.target.value})}
                          placeholder="e.g., IT, Finance, Operations"
                        />
                      </div>
                      <div>
                        <Label>Requested Delivery Date *</Label>
                        <Input
                          type="date"
                          value={formData.requestedDeliveryDate}
                          onChange={(e) => setFormData({...formData, requestedDeliveryDate: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Urgency Level</Label>
                        <Select 
                          value={formData.urgencyLevel}
                          onValueChange={(value) => setFormData({...formData, urgencyLevel: value as any})}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="critical">Critical</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Preferred Supplier</Label>
                        <Input
                          value={formData.preferredSupplier}
                          onChange={(e) => setFormData({...formData, preferredSupplier: e.target.value})}
                          placeholder="Optional"
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Business Justification *</Label>
                      <Textarea
                        value={formData.businessJustification}
                        onChange={(e) => setFormData({...formData, businessJustification: e.target.value})}
                        placeholder="Explain the business need for this purchase..."
                        rows={3}
                      />
                    </div>

                    {/* Line Items */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label>Line Items</Label>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={addLineItem}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Item
                        </Button>
                      </div>
                      
                      {formData.lineItems.length > 0 && (
                        <div className="border rounded-lg p-4 space-y-4">
                          {formData.lineItems.map((item, index) => (
                            <div key={index} className="grid grid-cols-6 gap-2 items-end">
                              <div className="col-span-2">
                                <Label>Description</Label>
                                <Input
                                  value={item.itemDescription}
                                  onChange={(e) => updateLineItem(index, 'itemDescription', e.target.value)}
                                  placeholder="Item description"
                                />
                              </div>
                              <div>
                                <Label>Quantity</Label>
                                <Input
                                  type="number"
                                  value={item.quantity}
                                  onChange={(e) => updateLineItem(index, 'quantity', Number(e.target.value))}
                                />
                              </div>
                              <div>
                                <Label>Unit</Label>
                                <Input
                                  value={item.unitOfMeasure}
                                  onChange={(e) => updateLineItem(index, 'unitOfMeasure', e.target.value)}
                                />
                              </div>
                              <div>
                                <Label>Unit Price (€)</Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={item.unitPrice}
                                  onChange={(e) => updateLineItem(index, 'unitPrice', Number(e.target.value))}
                                />
                              </div>
                              <div className="flex items-end gap-2">
                                <div>
                                  <Label>Total (€)</Label>
                                  <Input
                                    value={item.totalAmount.toFixed(2)}
                                    disabled
                                  />
                                </div>
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => removeLineItem(index)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                          <div className="text-right font-semibold">
                            Total: €{formData.lineItems.reduce((sum, item) => sum + item.totalAmount, 0).toFixed(2)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateRequisition}>
                      Create Requisition
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            View and manage your purchase requisitions. Total: {requisitions.length} requisitions
          </p>
        </CardContent>
      </Card>

      {/* Requisitions Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading requisitions...</div>
          ) : requisitions.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No purchase requisitions found. Create your first one!
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Requisition #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total (€)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Urgency</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requisitions.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell className="font-medium">
                      {req.requisitionNumber || req.externalCode}
                    </TableCell>
                    <TableCell>{formatDate(req.createdDate)}</TableCell>
                    <TableCell>{req.department}</TableCell>
                    <TableCell>{req.lineItems?.length || 0}</TableCell>
                    <TableCell>€{req.totalAmount?.toFixed(2) || '0.00'}</TableCell>
                    <TableCell>{getStatusBadge(req.status)}</TableCell>
                    <TableCell>
                      <Badge variant={
                        req.urgencyLevel === 'critical' ? 'destructive' :
                        req.urgencyLevel === 'high' ? 'default' :
                        'secondary'
                      }>
                        {req.urgencyLevel || 'medium'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            setSelectedRequisition(req);
                            setShowDetailDialog(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        
                        {req.status === RequisitionStatus.DRAFT && (
                          <>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleSubmitForApproval(req.id!)}
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        
                        {req.status === RequisitionStatus.APPROVED && (
                          <Button
                            size="icon"
                            variant="ghost"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog - Full Screen */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-[95vw] w-full max-h-[95vh] h-full overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Purchase Requisition Details
            </DialogTitle>
          </DialogHeader>
          
          {selectedRequisition && (
            <div className="space-y-4 py-4">
              {/* Header Information */}
              <div className="space-y-2 border-b pb-4">
                <h3 className="font-semibold text-lg">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Requisition Number</Label>
                    <p className="font-medium">{selectedRequisition.requisitionNumber || '-'}</p>
                  </div>
                  <div>
                    <Label>External Code</Label>
                    <p className="font-medium">{selectedRequisition.externalCode || '-'}</p>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <p>{getStatusBadge(selectedRequisition.status)}</p>
                  </div>
                  <div>
                    <Label>Urgency Level</Label>
                    <Badge variant={
                      selectedRequisition.urgencyLevel === 'critical' ? 'destructive' :
                      selectedRequisition.urgencyLevel === 'high' ? 'default' :
                      'secondary'
                    }>
                      {selectedRequisition.urgencyLevel || 'medium'}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Requester Information */}
              <div className="space-y-2 border-b pb-4">
                <h3 className="font-semibold text-lg">Requester Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Requester Name</Label>
                    <p>{selectedRequisition.requesterName || '-'}</p>
                  </div>
                  <div>
                    <Label>Requester Email</Label>
                    <p>{selectedRequisition.requesterEmail || '-'}</p>
                  </div>
                  <div>
                    <Label>Creator Email</Label>
                    <p>{selectedRequisition.creatorEmail || '-'}</p>
                  </div>
                  <div>
                    <Label>Department</Label>
                    <p>{selectedRequisition.department}</p>
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div className="space-y-2 border-b pb-4">
                <h3 className="font-semibold text-lg">Dates</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Created Date</Label>
                    <p>{formatDate(selectedRequisition.createdDate)}</p>
                  </div>
                  <div>
                    <Label>Last Modified</Label>
                    <p>{formatDate(selectedRequisition.lastModifiedDate)}</p>
                  </div>
                  <div>
                    <Label>Requested Delivery</Label>
                    <p>{selectedRequisition.requestedDeliveryDate}</p>
                  </div>
                  {selectedRequisition.approvalDate && (
                    <div>
                      <Label>Approval Date</Label>
                      <p>{formatDate(selectedRequisition.approvalDate)}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Financial Information */}
              <div className="space-y-2 border-b pb-4">
                <h3 className="font-semibold text-lg">Financial Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Total Amount</Label>
                    <p className="font-semibold text-lg">
                      €{selectedRequisition.totalAmount?.toFixed(2) || '0.00'}
                    </p>
                  </div>
                  <div>
                    <Label>Currency</Label>
                    <p>{selectedRequisition.currency || 'EUR'}</p>
                  </div>
                  <div>
                    <Label>Budget Code</Label>
                    <p>{selectedRequisition.budgetCode || '-'}</p>
                  </div>
                  <div>
                    <Label>Project Code</Label>
                    <p>{selectedRequisition.projectCode || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Supplier Information */}
              <div className="space-y-2 border-b pb-4">
                <h3 className="font-semibold text-lg">Supplier Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Preferred Supplier</Label>
                    <p>{selectedRequisition.preferredSupplier || '-'}</p>
                  </div>
                  <div>
                    <Label>Supplier Code</Label>
                    <p>{selectedRequisition.supplierCode || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Delivery Information */}
              <div className="space-y-2 border-b pb-4">
                <h3 className="font-semibold text-lg">Delivery Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Location Code</Label>
                    <p>{selectedRequisition.deliveryAddress?.locationCode || '-'}</p>
                  </div>
                  <div>
                    <Label>Location Name</Label>
                    <p>{selectedRequisition.deliveryAddress?.locationName || '-'}</p>
                  </div>
                  <div>
                    <Label>Street Address</Label>
                    <p>{selectedRequisition.deliveryAddress?.streetAddress || '-'}</p>
                  </div>
                  <div>
                    <Label>City</Label>
                    <p>{selectedRequisition.deliveryAddress?.city || '-'}</p>
                  </div>
                  <div>
                    <Label>Postal Code</Label>
                    <p>{selectedRequisition.deliveryAddress?.postalCode || '-'}</p>
                  </div>
                  <div>
                    <Label>Country</Label>
                    <p>{selectedRequisition.deliveryAddress?.country || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Business Justification */}
              <div className="space-y-2 border-b pb-4">
                <h3 className="font-semibold text-lg">Business Justification</h3>
                <p className="text-sm">{selectedRequisition.businessJustification}</p>
              </div>

              {/* Notes */}
              {(selectedRequisition.internalNotes || selectedRequisition.supplierNotes) && (
                <div className="space-y-2 border-b pb-4">
                  <h3 className="font-semibold text-lg">Notes</h3>
                  {selectedRequisition.internalNotes && (
                    <div>
                      <Label>Internal Notes</Label>
                      <p className="text-sm">{selectedRequisition.internalNotes}</p>
                    </div>
                  )}
                  {selectedRequisition.supplierNotes && (
                    <div className="mt-2">
                      <Label>Supplier Notes</Label>
                      <p className="text-sm">{selectedRequisition.supplierNotes}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Attachments */}
              {selectedRequisition.attachments && selectedRequisition.attachments.length > 0 && (
                <div className="space-y-2 border-b pb-4">
                  <h3 className="font-semibold text-lg">Attachments</h3>
                  <ul className="list-disc list-inside">
                    {selectedRequisition.attachments.map((attachment, index) => (
                      <li key={index}>
                        <a href={attachment} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          Attachment {index + 1}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Line Items */}
              <div className="space-y-2 border-b pb-4">
                <h3 className="font-semibold text-lg">Line Items</h3>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>#</TableHead>
                        <TableHead>External Code</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Product Code</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Unit</TableHead>
                        <TableHead>Unit Price</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Supplier</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Account Code</TableHead>
                        <TableHead>Cost Center</TableHead>
                        <TableHead>Requested Date</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedRequisition.lineItems?.map((item) => (
                        <TableRow key={item.lineNumber}>
                          <TableCell>{item.lineNumber}</TableCell>
                          <TableCell>{item.externalCode || '-'}</TableCell>
                          <TableCell>{item.itemDescription}</TableCell>
                          <TableCell>{item.productCode || '-'}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>{item.unitOfMeasure}</TableCell>
                          <TableCell>€{item.unitPrice?.toFixed(2)}</TableCell>
                          <TableCell>€{item.totalAmount?.toFixed(2)}</TableCell>
                          <TableCell>{item.supplierName || '-'}<br/><small>{item.supplierCode || ''}</small></TableCell>
                          <TableCell>{item.categoryName || '-'}<br/><small>{item.categoryCode || ''}</small></TableCell>
                          <TableCell>{item.accountCode || '-'}</TableCell>
                          <TableCell>{item.costCenter || '-'}</TableCell>
                          <TableCell>{item.requestedDate || '-'}</TableCell>
                          <TableCell>{item.notes || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Approval Information */}
              {(selectedRequisition.approverName || selectedRequisition.approvalLevel) && (
                <div className="space-y-2 pb-4">
                  <h3 className="font-semibold text-lg">Approval Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Approval Level</Label>
                      <p>{selectedRequisition.approvalLevel || '-'}</p>
                    </div>
                    <div>
                      <Label>Approver ID</Label>
                      <p>{selectedRequisition.approverId || '-'}</p>
                    </div>
                    <div>
                      <Label>Approver Name</Label>
                      <p>{selectedRequisition.approverName || '-'}</p>
                    </div>
                    <div>
                      <Label>Approval Date</Label>
                      <p>{formatDate(selectedRequisition.approvalDate)}</p>
                    </div>
                  </div>
                  {selectedRequisition.approvalComments && (
                    <div className="mt-2">
                      <Label>Approval Comments</Label>
                      <p className="text-sm">{selectedRequisition.approvalComments}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};