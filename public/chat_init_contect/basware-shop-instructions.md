# Valmet Basware Shop - Guided Freetext Order Instructions

## Process Overview - Service Ordering with Guided Freetext Form

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                         INTERNAL SERVICE ORDERING PROCESS FLOW                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘

     [REQUESTOR/BASWARE SHOP]              [APPROVER]                [P2P SPECIALIST]
              │                                 │                            │
              ▼                                 │                            │
    ┌─────────────────┐                        │                            │
    │ Request Details │                        │                            │
    │  - Cost & Duration                       │                            │
    │  - Assignment Info                       │                            │
    └────────┬────────┘                        │                            │
              │                                 │                            │
              ▼                                 │                            │
    ┌─────────────────┐                        │                            │
    │  Cost Coding    │                        │                            │
    └────────┬────────┘                        │                            │
              │                                 │                            │
              ▼                                 ▼                            │
    ┌─────────────────┐              ┌─────────────────┐                   │
    │ Form Creation   │──────────────►│   Recommend    │                   │
    │ (Freetext Fill) │              └────────┬────────┘                   │
    └────────┬────────┘                        │                            │
              │                                 ▼                            │
              │                      ┌─────────────────┐                   │
              │                      │    Approve      │                   │
              │                      │ - Hours/Deliver.│                   │
              │                      └────────┬────────┘                   │
              │                                 │                            │
              │                                 ▼                            ▼
              │                                 │                  ┌─────────────────┐
              │                                 │                  │ Matching Order  │
              │                                 │                  │   & Payment     │
              │                                 │                  └────────┬────────┘
              │                                 │                            │
              ▼                                 ▼                            ▼
    ┌──────────────────────────────────────────────────────────────────────────┐
    │                     ORDER CREATED AND SENT TO SUPPLIER                    │
    └──────────────────────────────────────────────────────────────────────────┘
                                           │
                                           ▼
                                    [SUPPLIER]
                                           │
                              ┌────────────┼────────────┐
                              ▼            ▼            ▼
                    ┌──────────────┐ ┌──────────┐ ┌───────────────┐
                    │Order Received│ │ Delivery │ │ Invoice Sent  │
                    └──────────────┘ │Reporting │ └───────────────┘
                                     │of Hours  │
                                     └──────────┘

    Optional: Review Step (can be assigned to named business user)
    Changes: Assignment length / Budget adjustments via Supplier MD in Compass
```

## Process Overview - Leased Workforce Ordering

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                         LEASED WORKFORCE ORDERING PROCESS FLOW                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘

    [START: WORKDAY LICENSE APPROVAL]
              │
              ▼
    ┌─────────────────┐
    │   Candidate     │
    │   Selection     │
    └────────┬────────┘
              │
     [REQUESTOR/BASWARE]              [APPROVER]           [P2P SPECIALIST/iPRO]
              │                            │                         │
              ▼                            │                         │
    ┌─────────────────┐                   │                         │
    │ Request Details │                   │                         │
    │ - License #     │                   │                         │
    │ - Full Cost     │                   │                         │
    └────────┬────────┘                   │                         │
              │                            │                         │
              ▼                            │                         │
    ┌─────────────────┐                   │                         │
    │  Cost Coding    │                   │                         │
    └────────┬────────┘                   │                         │
              │                            │                         │
              ▼                            ▼                         │
    ┌─────────────────┐         ┌─────────────────┐                │
    │ Form Creation   │─────────►│ Cost Approval   │                │
    │ (Freetext Fill) │         │ - Hours/Deliver.│                │
    └────────┬────────┘         └────────┬────────┘                │
              │                            │                         │
              │                            ▼                         ▼
              │                            │               ┌─────────────────┐
              │                            │               │ Matching to PO  │
              │                            │               │ Within Validity │
              │                            │               │   and Budget    │
              │                            │               └────────┬────────┘
              ▼                            ▼                         ▼
    ┌──────────────────────────────────────────────────────────────────────────┐
    │                     ORDER CREATED AND SENT TO SUPPLIER                    │
    └──────────────────────────────────────────────────────────────────────────┘
                                           │
                                           ▼
                                    [SUPPLIER]
                                           │
                    ┌──────────────────────┼──────────────────────┐
                    ▼                      ▼                      ▼
          ┌──────────────┐      ┌───────────────────┐   ┌──────────────┐
          │Order Received│      │ Pricing Details   │   │Invoice Sent  │
          └──────────────┘      │ for Candidate     │   └──────┬───────┘
                                └───────────────────┘            │
                                                                 ▼
                                                      ┌───────────────────┐
                                                      │ Budget Increase   │
                                                      │ if needed via     │
                                                      │ Supplier MD       │
                                                      └───────────────────┘
```

## Freetext Order Process Steps in Basware Shop

### Decision Tree for Order Processing

```
                           [START]
                              │
                              ▼
                   ┌──────────────────┐
                   │ Check Bill-To    │
                   │ Organization Unit│
                   └─────────┬────────┘
                             │
                             ▼
                   ┌──────────────────┐
                   │ Find Correct     │
                   │ Order Form in    │
                   │ Basware Shop     │
                   └─────────┬────────┘
                             │
                             ▼
                   ┌──────────────────┐
                   │ Fill in Order    │
                   │ Line Details     │
                   └─────────┬────────┘
                             │
                    ┌────────┴────────┐
                    │ All Fields OK?  │
                    └────────┬────────┘
                       No ◄──┴──► Yes
                       │              │
                       ▼              ▼
              ┌──────────────┐ ┌──────────────────┐
              │ Fix Missing  │ │ Add to Basket    │
              │ Information  │ └─────────┬────────┘
              └──────┬───────┘           │
                     │                    ▼
                     │          ┌──────────────────┐
                     └─────────►│ View Basket      │
                                └─────────┬────────┘
                                          │
                                          ▼
                                ┌──────────────────┐
                                │ Checkout         │
                                └─────────┬────────┘
                                          │
                                          ▼
                                ┌──────────────────┐
                                │ Complete Purchase│
                                │ Request          │
                                └─────────┬────────┘
                                          │
                                          ▼
                                ┌──────────────────┐
                                │ Submit for       │
                                │ Approval         │
                                └─────────┬────────┘
                                          │
                           ┌──────────────┴──────────────┐
                           ▼                             ▼
                  ┌──────────────┐              ┌──────────────┐
                  │ Review Step  │              │ Direct to    │
                  │ (Optional)   │              │ Approver     │
                  └───────┬──────┘              └───────┬──────┘
                          │                             │
                          └──────────┬──────────────────┘
                                     ▼
                           ┌──────────────────┐
                           │ Approval Decision│
                           └─────────┬────────┘
                                     │
                        ┌────────────┴────────────┐
                        ▼                         ▼
               ┌──────────────┐          ┌──────────────┐
               │  Returned    │          │  Approved    │
               │ (Fix & Retry)│          └───────┬──────┘
               └──────────────┘                  │
                                                 ▼
                                       ┌──────────────────┐
                                       │ Order Created &  │
                                       │ Sent to Supplier │
                                       └─────────┬────────┘
                                                 │
                                                 ▼
                                       ┌──────────────────┐
                                       │ Monitor Invoices │
                                       │ in Basware Docs  │
                                       └─────────┬────────┘
                                                 │
                                     ┌───────────┴───────────┐
                                     │  Need Changes?       │
                                     └───────────┬───────────┘
                                           No ◄──┴──► Yes
                                           │              │
                                           ▼              ▼
                                    [END: Complete]  ┌──────────────┐
                                                     │ Manage Changes│
                                                     │ - Validity   │
                                                     │ - Budget     │
                                                     │ - Cancel     │
                                                     └──────────────┘
```

### Main Process Steps:

1. **Check Bill-To organization unit**
   - Default: Request created to your 'home organization'
   - Shop content may change depending on company
   - Company must be selected before opening freetext form

2. **Find correct order form in Basware Shop**
   - Only suppliers onboarded to Basware Shop available
   - Use Search bar on Basware Home or Shop tab

3. **Fill in order line details**
   - Mandatory fields marked with "*"
   - Supplier product name describes deliverable
   - Add attachments for scope details if needed

4. **Checkout and complete purchase request**
   - Add to Basket → View Basket → Checkout sequence
   - Fill justification and delivery details
   - Select approver

5. **Submit for approval**
   - Check coding before submission
   - Request goes through Review (optional) and Approval

6. **Monitor matched invoices in Basware Documents**
   - Check status: Draft, Returned, Approved, Ordered, Confirmed, Received
   - View related documents and invoices

7. **Manage changes to order scope**
   - Validity period changes via Service Request
   - Budget changes by editing PO line
   - Order cancellation through dropdown menu
INTERNALInstructionsprovidedetailsonwhereontheorderforinformationneeds to beinput Information Wheretoinputonorder Whyit’sneeded Durationof theassignment (startandenddates)
Desireddeliverystart & enddate Validto – Validfrom Deliverydatesarevisibleonorderemailgoingtosupplier Validityrangeis thetimeperiod , thatinvoicesareautomaticallymatchedto theorder Estimatedtotalhoursfor theassignmentxhourlynetprice, tocalculateestimatedtotalamountfor theorder Netunitprice (purchasing)
Thisis theamountwhichwill beinternallyapprovedforpurchase.
in casetheworkisagreedto beinvoicedontime&materialbasis, thereisacheckboxthatcan betickedtohidetheestimatedtotalpricefrom thesupplier Valmetcostapprover Approverfieldin orderdetails4 eyeprincipleisfollowedwithorders – asinvoicesmatchingtoanapprovedorderarematchedandprocessedforpayment Costcoding (project& activityorledgeraccountandcostcenter)
Codingfieldsareavailableontheorderform Invoicesmatchedto theorderarepostedwith thecostcodingontheorder Beforeyoustart – informationthatisneededonhandtocompleteorder24September2025

© Valmet | Author / Title4

INTERNALBeforeyoustart – checkusersettingsandsetprofessionalview24September2025

© Valmet | Author / Title5

### Internal

- 

Asadefault, requestiscreatedtoyour ‘homeorganization’;

- 

Shopcontentmaychangedepending onthecompanyyouarebuyingfor;

- 

Companymust beselectedbeforeopeningthefreetextform;

- 

Baswarewillrememberyourpreviousselection, soyouwillnotneedtoalwaysselectthesameentity.
Check Bill-Toorganizationunit Guided Buyingtrainingfor Basware Shopv.1.06

### Internal

- 

Only Suppliersexplicitlyonboardedto Basware Shopprocessareavailable forordering

- 

Use Search – bareitheron Basware Hometabor Shop Tab Findcorrectformbysearchingwithsuppliername Guided Buyingtrainingfor Basware Shopv.1.07

### Internal


Note, somefieldsaremandatory (endingwith “*”) such as: Supplier*, Netunitprice (purchasing)*, Supplierproductname* etc. whileotherfieldsareoptional, in casemoreclarificationneeded 
Supplierproductnameis themainfield, wherethedeliverablethatisorderedisdescribed. Itcan becomplementedbyaddinganattachmentthatdefinesthescopeof workinmoredetail24September2025

© Valmet | Author / Title8

Fillin orderlinedetailswith theform INTERNAL 
Addingscopeorquotedocumentasattachment 

- use “+” singtoaddattachmentandselect “Attachmentissenttosupplier”;
- Ifboxis notchecked, documentswillremainas Internalandsupplierwillnotbeabletosee / receiveattachmentsonceorderissentforconfirmation24September2025

© Valmet | Author / Title10Fillin orderlinedetailswith theform INTERNAL


Addto Basket, Viewbasketand Checkout

- aftermandatoryfieldsarefilledin, pressthesebuttonsin thefollowingorder:

## 1. Addto Basket;

## 2. View Basket;

## 3. Checkout.

24September2025

© Valmet | Author / Title11Proceedtocompleteorder INTERNALUpdatemandatoryfieldsfor Purchaserequestandorder

- Justification – addtheinternalreasonof theorder – approverreceivesthisinformationwithapprovalrequest.
- Desireddeliverydate – defaultedfrom thefreetextform
- Desireddeliveryaddress – selectalocationfrom thedrop-downmenuoraddacustomaddressifthedesiredoneis notin thelist;
- Approver – addnameof thepersonwhoapprovespurchaserequestandthusconfirmsthecostandcostallocation;
- Goods Receiver – can bechanged, nameandemailofthispersonwill besentto thesupplierontheorder,
- Editdetails – proceedtonextpagebypressingthisbutton.

Guided Buyingtrainingfor Basware Shopv.1.012INTERNAL13Splititemcosttoseveralcodinglines Guided Buyingtrainingfor Basware Shopv.1.01. Select "Lines" tabintoppanelandselectthelineyouwishtosplitthecodingfor2. Select "Coding" tabinbottompanelandclick "Duplicaterow"
INTERNAL14Splititemcosttoseveralcodinglines Guided Buyingtrainingfor Basware Shopv.1.03. Putin thecodingandpreferredmethodofcostsplit (percentage / amountorcoding). Use "Save" buttonafterediting INTERNALSubmitforapproval Guided Buyingtrainingfor Basware Shopv.1.015

- 

Note! Codingmust becheckedbeforerequestingapproval;

- 

Clickthe "Lines" taband "Coding" sub-tab, in thebottomof thepage, toviewcoding. Checkthatcostsarecodedcorrectly.
INTERNALSubmitforapproval Guided Buyingtrainingfor Basware Shopv.1.016

- 

Ifneeded, somefieldssuch as: Justificationorcodinginformationcanstillbeupdatedatthispoint;

- 

Ifrequestiscomplete, press “Getapproval” button;

- 

Yourrequestmaymovefirstto Reviewstage (pre-determined) and Approval (selectedapprover).
INTERNALGuided Buyingtrainingfor Basware Shopv.1.017Checkingstatus Draft - Requestis notfinalized, openandcheckmissinginformation. Byupdating, requestcan becontinued. Ifnotlongernecessary, requestshould becancelled.
Returned - Requestwassentbackwithacomment, checkthereasonandmakenecessaryupdates.
Approve - Requestisstillpendingapproval, follow-upwithapprover, ifneeded.
Ordered - Requestapprovedandsenttosupplier.
Confirmed - Orderhas beenconfirmedbysupplier.
Received - receipthas beenfinalized.
FYI: Wheretofindyourrequest / purchaseorderandhowtocheckstatusofit From Documents Tab, select Purchaserequisitionsor Purchase Orders Subtabsandpress Searchbuttontofindyourrequests / orders:
INTERNALMonitormatchedinvoices Guided Buyingtrainingfor Basware Shopv.1.018Invoicesmatchedtoyour Purchase Ordercan becheckedbyopeningthe POfrom Documentstab, under Related Documentssection INTERNALManagechangestoyourorder Guided Buyingtrainingfor Basware Shopv.1.0191. Changeto Validityperiod – servicenowrequestfrom GFO, select Basware Shopas Ticket Category Service Requests - Valmet Portal2. Changeto Budget

- open POfrom Documentstabandpresson POlineor “View Details” from Dropdownarrowin Linessection:

INTERNALManagechangestoyourorder - Changeto Budget Guided Buyingtrainingfor Basware Shopv.1.020

- Whenin thelineview, clickonpenicontoeditlinedetailsandonlyadjustnetunitprice;
- Finally, click Save INTERNALManagechangestoyourorder - Changeto Budget Guided Buyingtrainingfor Basware Shopv.1.021
- Youcanaddaninternalrationalefor thechangesbyclickingaddcomment:

INTERNALManagechangestoyourorder - Changeto Budget Guided Buyingtrainingfor Basware Shopv.1.022

- Afteryouaredonewitheditingthelineinformation, clickbackin thetopleftcornerof thescreen.

INTERNALManagechangestoyourorder - Changeto Budget Guided Buyingtrainingfor Basware Shopv.1.023

- Becausetheorderamounthasincreased, anewapprovalbytheapprovalisneeded. Alsoonthescreenyoucanseein theworkflowsectionontherightthecommentyouaddedto thelineinformation. Tosubmityourchangesforapproval, click Get Approval.

INTERNALManagechangestoyourorder -Cancel Order Guided Buyingtrainingfor Basware Shopv.1.0243. Cancel Order

- 

in casethereisachangein theneedforanassignmentalreadyagreedwiththat, withblanket POtherequestercancanceltheorder.

- 

Ordercancellationisdonebynavigatingto thepurchaseorderfromdocuments, thenselectingfrom thedropdowncancelorder. Thesupplierwillreceiveane-mailnotifyingthattheorderhas beencancelled INTERNAL
