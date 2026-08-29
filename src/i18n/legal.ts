// Legal document copy (Terms, Privacy, Refunds), kept out of `translations.ts`
// because it is long-form prose rather than UI chrome. Same three languages,
// same shape per language, rendered generically by `src/pages/Legal.tsx`.

import type { Language } from './translations'

/**
 * Seller identification, referenced from every document so it is edited in ONE
 * place. Name, number and address match the company's entry in the EU VIES
 * register (verified 2026-08-29) — legal pages must agree with the register.
 *
 * Note: the VAT number ends in the LETTER "O", not a zero. Cyprus VAT numbers
 * are always eight digits followed by a letter.
 */
export const COMPANY = {
  tradingName: 'Discusfood',
  legalName: 'M.M.T. Discus Milenium Ltd',
  registrationNumber: 'HE487384',
  vatNumber: 'CY60329173O',
  address: 'Epidavrou 2, Apt. 108, 2660 Kokkinotrimithia, Cyprus',
  /** The address exactly as registered, used on the Greek pages. */
  addressEl: 'Επιδαύρου 2, Διαμ./Γραφείο 108, 2660 Κοκκινοτριμιθιά, Κύπρος',
  email: 'discusmilenium@outlook.com',
} as const

/** Shown as "Last updated" on every legal page. Bump when the copy changes. */
export const LEGAL_LAST_UPDATED = '2026-08-29'

export type LegalDocId = 'terms' | 'privacy' | 'refunds'

export type LegalSection = {
  heading: string
  /** Paragraphs, rendered in order. */
  body?: string[]
  /** Optional bullet list, rendered after the paragraphs. */
  list?: string[]
}

export type LegalDoc = {
  title: string
  intro: string
  sections: LegalSection[]
}

export const legal: Record<Language, Record<LegalDocId, LegalDoc>> = {
  // ───────────────────────────────────────────────────────── English
  en: {
    terms: {
      title: 'Terms & Conditions of Sale',
      intro:
        'These terms govern every order placed through this website. Please read them before you buy — placing an order means you accept them.',
      sections: [
        {
          heading: '1. Who you are buying from',
          body: [
            `This website is operated by ${COMPANY.legalName}, trading as ${COMPANY.tradingName} ("we", "us").`,
          ],
          list: [
            `Registration number: ${COMPANY.registrationNumber}`,
            `VAT number: ${COMPANY.vatNumber}`,
            `Registered address: ${COMPANY.address}`,
            `Email: ${COMPANY.email}`,
          ],
        },
        {
          heading: '2. Scope',
          body: [
            'These terms apply to all sales of goods made through this website to both consumers and business customers. By placing an order you confirm that you have the legal capacity to enter into a contract and, where you order as a business, that you are authorised to bind that business.',
            'We may update these terms from time to time. The version published on the site at the moment you place your order is the version that applies to that order.',
          ],
        },
        {
          heading: '3. Products',
          body: [
            'We sell aquarium fish food, water conditioners and related aquarium products. Product photographs, weights and descriptions are provided in good faith and as accurately as we can, but small variations in appearance, granule size and packaging can occur between production batches.',
            'Our products are intended for ornamental aquarium fish only. They are not for human consumption and are not veterinary medicines. Always follow the feeding instructions on the packaging.',
          ],
        },
        {
          heading: '4. Prices and VAT',
          body: [
            'All prices are shown in euro (EUR) and include VAT at the applicable rate. The price you see at checkout is the total price of the goods; shipping is calculated separately and shown before you pay.',
            'We may change prices at any time, but a change never affects an order we have already accepted. If a product is listed at an obviously incorrect price because of a technical or human error, we may cancel the order and refund you in full rather than supply at that price.',
          ],
        },
        {
          heading: '5. Business (wholesale) accounts',
          body: [
            'Approved business customers see wholesale prices. To apply, register a business account and provide a valid EU VAT number, which we validate against the European Commission VIES database.',
            'Approval is at our discretion and may be withdrawn if the VAT number ceases to be valid or if the account is used for purposes other than genuine resale or professional use. Wholesale prices are confidential and may not be published or shared.',
          ],
        },
        {
          heading: '6. How the contract is formed',
          body: [
            'Your order is an offer to buy. The contract comes into existence only when we accept your order — in practice, when we confirm it and start preparing it for dispatch.',
            'We may decline an order, for example if the goods are out of stock, if we cannot deliver to your address, if payment is not authorised, or if we reasonably suspect fraud. If we decline after payment has been taken, we refund you in full.',
          ],
        },
        {
          heading: '7. Payment',
          body: [
            'Payments are processed by Stripe. We never see or store your full card number — card details are handled entirely by Stripe on their own secure systems.',
            'Payment is taken at the time of purchase. Goods remain our property until payment has been received in full.',
          ],
        },
        {
          heading: '8. Delivery',
          body: [
            'We ship within Cyprus and internationally. Shipping costs are calculated from the weight of your parcel and its destination zone, and are always shown before payment. Current rates are published on our Shipping prices page.',
            'Delivery times given at checkout are estimates, not guarantees. Once a parcel has been handed to the carrier, transit times are outside our control. Delays caused by the carrier, customs, weather or events beyond our reasonable control do not entitle you to cancel an order that has already been dispatched.',
            'For deliveries outside the European Union, any import duties, customs charges or local taxes are payable by you and are not included in the price you pay us.',
          ],
        },
        {
          heading: '9. Returns',
          body: [
            'Shipments are not returnable and all sales are final. The reasons for this, and what to do if something is wrong with your order, are set out in our Refund & Returns Policy, which forms part of these terms.',
          ],
        },
        {
          heading: '10. Your statutory rights',
          body: [
            'Nothing in these terms limits or excludes any right you have under mandatory consumer law that cannot be limited or excluded by agreement. Where a term of this agreement conflicts with such a right, the law prevails.',
          ],
        },
        {
          heading: '11. Your account',
          body: [
            'You are responsible for keeping your password confidential and for everything done through your account. Business and administrator accounts must use two-factor authentication. Tell us immediately if you believe your account has been accessed by someone else.',
            'We may suspend or close an account that is used fraudulently, abusively, or in breach of these terms.',
          ],
        },
        {
          heading: '12. Intellectual property',
          body: [
            'The content of this website — text, photographs, product imagery, logos and design — belongs to us or to our suppliers and is protected by copyright and trade mark law. You may not copy, reproduce or use it commercially without our written permission.',
          ],
        },
        {
          heading: '13. Liability',
          body: [
            'We are responsible for loss that is a foreseeable result of our breaking these terms or failing to use reasonable care. We are not responsible for unforeseeable loss, nor for loss of profit, business or opportunity.',
            'We do not limit our liability where the law does not allow it — in particular for death or personal injury caused by our negligence, or for fraud.',
            'Because the health of aquarium fish depends on tank conditions, water quality, dosage and many other factors outside our control, we cannot accept liability for livestock losses following normal use of our products.',
          ],
        },
        {
          heading: '14. Governing law and disputes',
          body: [
            'These terms are governed by the law of the Republic of Cyprus, and the courts of Cyprus have jurisdiction. If you are a consumer resident in another EU member state, you also keep the protection of the mandatory rules of your own country.',
            'We would always rather resolve a problem directly, so please contact us first. Consumers in Cyprus may also approach the Consumer Protection Service of the Ministry of Energy, Commerce and Industry.',
          ],
        },
        {
          heading: '15. Contact',
          body: [`Questions about these terms: ${COMPANY.email}`],
        },
      ],
    },

    privacy: {
      title: 'Privacy Policy',
      intro:
        'This policy explains what personal data we collect when you use this website, why we collect it, who we share it with, and the rights you have over it under the GDPR.',
      sections: [
        {
          heading: '1. Who is responsible for your data',
          body: [
            `The data controller is ${COMPANY.legalName}, trading as ${COMPANY.tradingName}, ${COMPANY.address}. For any privacy question, or to exercise the rights described below, write to ${COMPANY.email}.`,
          ],
        },
        {
          heading: '2. What we collect',
          list: [
            'Account data: email address, name, password (stored only as a cryptographic hash — we never see it), account type, and your two-factor authentication settings if you enable them.',
            'Order data: the products you bought, prices, order status, and your order history.',
            'Delivery and billing data: recipient name, postal address, telephone number and email address.',
            'Business account data: company name, VAT number, company registration number and billing address, for customers applying for wholesale pricing.',
            'Payment data: we receive confirmation of payment, the amount, and limited details such as the last four digits and card brand. We never receive or store your full card number.',
            'Technical data: your IP address and basic request information, processed by our hosting provider for security and abuse prevention.',
            'Content you submit: product reviews and messages you send us.',
          ],
        },
        {
          heading: '3. Why we use it, and our legal basis',
          list: [
            'To take, process, deliver and support your order — performance of our contract with you (Art. 6(1)(b) GDPR).',
            'To create and operate your account, including authentication and two-factor security — performance of our contract.',
            'To validate the VAT number of a business account against the EU VIES service — performance of a contract and compliance with our tax obligations.',
            'To issue invoices and keep accounting records — compliance with a legal obligation (Art. 6(1)(c) GDPR).',
            'To prevent fraud, abuse and unauthorised access — our legitimate interest in protecting the shop and its customers (Art. 6(1)(f) GDPR).',
            'To publish a product review you have chosen to write — your consent, which you may withdraw at any time.',
          ],
        },
        {
          heading: '4. Who else processes your data',
          body: ['We do not sell your personal data. We share it only with the service providers we need to run the shop:'],
          list: [
            'Supabase — hosting, database and authentication for this website.',
            'Stripe — payment processing and invoicing. Stripe acts as an independent controller for payment data under its own privacy policy.',
            'Carriers (AKIS Express within Cyprus, UPS internationally) — the delivery details needed to bring your parcel to you.',
            'Google — only if you choose to sign in with a Google account, in which case Google confirms your identity to us.',
            'The European Commission VIES service — only the VAT number of a business account, for validation.',
          ],
        },
        {
          heading: '5. Transfers outside the EEA',
          body: [
            'Our infrastructure is hosted within the European Union. Where a provider processes data outside the European Economic Area, that transfer is covered by the European Commission’s Standard Contractual Clauses or an equivalent safeguard.',
          ],
        },
        {
          heading: '6. How long we keep it',
          list: [
            'Account data: for as long as your account exists. Ask us to delete it and we will, except for what we must keep by law.',
            'Order, invoice and accounting records: for the period required by Cypriot tax and accounting law, even after an account is closed.',
            'Reviews: until you or we remove them.',
            'Security and access logs: a short period, then automatically deleted.',
          ],
        },
        {
          heading: '7. Your rights',
          body: [
            'Under the GDPR you have the right to access your data, to have it corrected, to have it erased, to restrict or object to its processing, to receive it in a portable format, and to withdraw consent where processing is based on consent.',
            `To exercise any of these rights, email ${COMPANY.email}. We respond within one month. Much of your data is also available directly in your account.`,
          ],
        },
        {
          heading: '8. Cookies and local storage',
          body: [
            'This website does not use advertising cookies, analytics cookies or third-party tracking. We do not profile you and we do not share data with advertising networks.',
            'We use only strictly necessary browser storage: your login session, your language preference and your shopping cart are kept in your browser so the site works. Storage that is strictly necessary to provide a service you requested does not require consent, which is why you do not see a cookie banner here.',
            'Stripe may set its own cookies on its checkout pages for fraud prevention. That happens on Stripe’s domain and is governed by Stripe’s privacy policy.',
          ],
        },
        {
          heading: '9. Security',
          body: [
            'All traffic to this site is encrypted with TLS. Passwords are stored only as hashes. Access to customer data at database level is restricted by row-level security rules, and business and administrator accounts are protected with two-factor authentication.',
            'No system can be guaranteed perfectly secure, but if a breach ever affects your rights we will notify you and the supervisory authority as the GDPR requires.',
          ],
        },
        {
          heading: '10. Children',
          body: [
            'This shop is not directed at children. We do not knowingly create accounts for anyone under 16. If you believe a child has given us personal data, contact us and we will delete it.',
          ],
        },
        {
          heading: '11. Complaints',
          body: [
            'If you believe we have handled your data improperly, please tell us first — we would like the chance to put it right. You also have the right to complain to the Office of the Commissioner for Personal Data Protection of the Republic of Cyprus, or to the supervisory authority of the EU country where you live.',
          ],
        },
        {
          heading: '12. Changes to this policy',
          body: [
            'If we change how we handle personal data, we will update this page and the "last updated" date above it.',
          ],
        },
      ],
    },

    refunds: {
      title: 'Refund & Returns Policy',
      intro:
        'Please read this before ordering. Shipments are not returnable and all sales are final. If something is wrong with your order, contact us and we will look at it individually.',
      sections: [
        {
          heading: '1. Shipments are not returnable',
          body: [
            'We do not accept returns and all sales are final. There is no right to return an order because you changed your mind, ordered the wrong product, or no longer need it.',
            'Please check your basket, the product variant and your delivery address carefully before you pay.',
          ],
        },
        {
          heading: '2. Why there is no cooling-off period',
          body: [
            'For most online purchases, EU consumers have fourteen days to withdraw from the contract. That right does not apply here, and the exception is set out in the law itself.',
            'Article 16(d) of Directive 2011/83/EU excludes goods that are liable to deteriorate or expire rapidly, and Article 16(e) excludes sealed goods which are not suitable for return for reasons of health protection or hygiene once they have been unsealed.',
            'Aquarium fish food falls within both. It is a perishable feed product, sold sealed, and once a container has left our control or been opened we cannot verify how it has been stored or guarantee it is safe to feed to another customer’s fish. For that reason it cannot be resold and cannot be taken back.',
          ],
        },
        {
          heading: '3. Cancelling before dispatch',
          body: [
            'If your parcel has not yet been handed to the carrier, contact us as quickly as possible and we will cancel it where we still can. Once a parcel has been dispatched it can no longer be cancelled.',
          ],
        },
        {
          heading: '4. If something is wrong with your order',
          body: [
            'If your parcel arrives damaged, if you received the wrong item, or if there is a problem with the condition of the product, write to us and describe what happened. Photographs of the parcel, the packaging and the product help us understand the situation quickly.',
            'Each case is reviewed individually and resolved at our discretion. We deal directly with our customers and we want you to be satisfied, so please contact us before taking any other step.',
          ],
        },
        {
          heading: '5. Parcels that do not arrive',
          body: [
            'Every shipment is tracked. If tracking shows your parcel as delivered but you have not received it, or if it stops moving for an unusual length of time, contact us and we will open an enquiry with the carrier.',
            'Please make sure your delivery address is complete and correct. We cannot take responsibility for a parcel delivered to an address you gave us incorrectly, or refused at delivery.',
          ],
        },
        {
          heading: '6. How a refund is issued, if one is agreed',
          body: [
            'Where we agree to a refund, it is returned through Stripe to the original payment method. Your bank decides how quickly it appears on your statement, usually within a few working days.',
          ],
        },
        {
          heading: '7. Your statutory rights',
          body: [
            'This policy does not affect rights that consumer law gives you and that cannot be excluded by agreement, including your rights in relation to goods that do not conform to the contract.',
          ],
        },
        {
          heading: '8. Contact',
          body: [
            `Write to ${COMPANY.email} with your order number and a description of the problem. We read every message.`,
          ],
        },
      ],
    },
  },

  // ───────────────────────────────────────────────────────── Ελληνικά
  el: {
    terms: {
      title: 'Όροι και Προϋποθέσεις Πώλησης',
      intro:
        'Οι παρόντες όροι διέπουν κάθε παραγγελία που υποβάλλεται μέσω αυτού του ιστότοπου. Παρακαλούμε διαβάστε τους πριν αγοράσετε — η υποβολή παραγγελίας σημαίνει ότι τους αποδέχεστε.',
      sections: [
        {
          heading: '1. Από ποιον αγοράζετε',
          body: [
            `Ο ιστότοπος λειτουργεί από την ${COMPANY.legalName}, με εμπορική ονομασία ${COMPANY.tradingName} («εμείς»).`,
          ],
          list: [
            `Αριθμός εγγραφής: ${COMPANY.registrationNumber}`,
            `Αριθμός ΦΠΑ: ${COMPANY.vatNumber}`,
            `Έδρα: ${COMPANY.addressEl}`,
            `Email: ${COMPANY.email}`,
          ],
        },
        {
          heading: '2. Πεδίο εφαρμογής',
          body: [
            'Οι όροι αυτοί ισχύουν για όλες τις πωλήσεις αγαθών μέσω του ιστότοπου, τόσο προς καταναλωτές όσο και προς επιχειρήσεις. Υποβάλλοντας παραγγελία βεβαιώνετε ότι έχετε τη νομική ικανότητα να συνάψετε σύμβαση και, εφόσον παραγγέλνετε ως επιχείρηση, ότι έχετε την εξουσία να τη δεσμεύσετε.',
            'Ενδέχεται να επικαιροποιούμε τους όρους. Για κάθε παραγγελία ισχύει η έκδοση που είναι δημοσιευμένη τη στιγμή της υποβολής της.',
          ],
        },
        {
          heading: '3. Προϊόντα',
          body: [
            'Πωλούμε τροφές για ψάρια ενυδρείου, βελτιωτικά νερού και συναφή προϊόντα ενυδρείου. Οι φωτογραφίες, τα βάρη και οι περιγραφές παρέχονται καλόπιστα και με τη μεγαλύτερη δυνατή ακρίβεια, ωστόσο μικρές διαφοροποιήσεις στην όψη, στο μέγεθος του κόκκου και στη συσκευασία μπορούν να προκύψουν μεταξύ παρτίδων παραγωγής.',
            'Τα προϊόντα προορίζονται αποκλειστικά για διακοσμητικά ψάρια ενυδρείου. Δεν προορίζονται για ανθρώπινη κατανάλωση και δεν αποτελούν κτηνιατρικά φάρμακα. Ακολουθείτε πάντα τις οδηγίες χορήγησης της συσκευασίας.',
          ],
        },
        {
          heading: '4. Τιμές και ΦΠΑ',
          body: [
            'Όλες οι τιμές αναγράφονται σε ευρώ (EUR) και περιλαμβάνουν ΦΠΑ με τον ισχύοντα συντελεστή. Η τιμή που βλέπετε στο ταμείο είναι η συνολική τιμή των αγαθών· τα μεταφορικά υπολογίζονται χωριστά και εμφανίζονται πριν από την πληρωμή.',
            'Μπορούμε να μεταβάλλουμε τις τιμές οποτεδήποτε, χωρίς όμως αυτό να επηρεάζει παραγγελία που έχουμε ήδη αποδεχθεί. Αν ένα προϊόν εμφανιστεί με προφανώς εσφαλμένη τιμή λόγω τεχνικού ή ανθρώπινου σφάλματος, μπορούμε να ακυρώσουμε την παραγγελία και να σας επιστρέψουμε πλήρως το ποσό αντί να το διαθέσουμε στην τιμή αυτή.',
          ],
        },
        {
          heading: '5. Επαγγελματικοί λογαριασμοί (χονδρική)',
          body: [
            'Οι εγκεκριμένοι επαγγελματικοί πελάτες βλέπουν τιμές χονδρικής. Για να υποβάλετε αίτηση, δημιουργήστε επαγγελματικό λογαριασμό και δηλώστε έγκυρο ευρωπαϊκό αριθμό ΦΠΑ, τον οποίο επαληθεύουμε μέσω της βάσης VIES της Ευρωπαϊκής Επιτροπής.',
            'Η έγκριση εναπόκειται στη διακριτική μας ευχέρεια και μπορεί να ανακληθεί αν ο αριθμός ΦΠΑ παύσει να ισχύει ή αν ο λογαριασμός χρησιμοποιείται για σκοπούς άλλους από γνήσια μεταπώληση ή επαγγελματική χρήση. Οι τιμές χονδρικής είναι εμπιστευτικές και δεν επιτρέπεται να δημοσιοποιούνται.',
          ],
        },
        {
          heading: '6. Πώς καταρτίζεται η σύμβαση',
          body: [
            'Η παραγγελία σας αποτελεί πρόταση για αγορά. Η σύμβαση καταρτίζεται μόνο όταν αποδεχθούμε την παραγγελία — στην πράξη, όταν την επιβεβαιώσουμε και ξεκινήσουμε την προετοιμασία της για αποστολή.',
            'Μπορούμε να απορρίψουμε παραγγελία, για παράδειγμα αν το προϊόν δεν είναι διαθέσιμο, αν δεν μπορούμε να παραδώσουμε στη διεύθυνσή σας, αν δεν εγκριθεί η πληρωμή ή αν υπάρχουν εύλογες υπόνοιες απάτης. Αν την απορρίψουμε αφού έχει ληφθεί η πληρωμή, επιστρέφουμε ολόκληρο το ποσό.',
          ],
        },
        {
          heading: '7. Πληρωμή',
          body: [
            'Οι πληρωμές διεκπεραιώνονται από τη Stripe. Δεν βλέπουμε ούτε αποθηκεύουμε ποτέ τον πλήρη αριθμό της κάρτας σας — τα στοιχεία της κάρτας τα διαχειρίζεται εξ ολοκλήρου η Stripe στα δικά της ασφαλή συστήματα.',
            'Η πληρωμή λαμβάνεται κατά την αγορά. Τα αγαθά παραμένουν στην κυριότητά μας μέχρι την πλήρη εξόφληση.',
          ],
        },
        {
          heading: '8. Παράδοση',
          body: [
            'Αποστέλλουμε εντός Κύπρου και διεθνώς. Τα μεταφορικά υπολογίζονται από το βάρος του δέματος και τη ζώνη προορισμού και εμφανίζονται πάντοτε πριν από την πληρωμή. Οι ισχύουσες χρεώσεις δημοσιεύονται στη σελίδα «Τιμές αποστολής».',
            'Οι χρόνοι παράδοσης που αναφέρονται είναι εκτιμήσεις και όχι εγγυήσεις. Από τη στιγμή που το δέμα παραδοθεί στον μεταφορέα, ο χρόνος διαμετακόμισης είναι εκτός του ελέγχου μας. Καθυστερήσεις που οφείλονται στον μεταφορέα, στο τελωνείο, στις καιρικές συνθήκες ή σε γεγονότα ανωτέρας βίας δεν θεμελιώνουν δικαίωμα ακύρωσης παραγγελίας που έχει ήδη αποσταλεί.',
            'Για παραδόσεις εκτός Ευρωπαϊκής Ένωσης, τυχόν εισαγωγικοί δασμοί, τελωνειακές επιβαρύνσεις ή τοπικοί φόροι βαρύνουν εσάς και δεν περιλαμβάνονται στην τιμή που μας καταβάλλετε.',
          ],
        },
        {
          heading: '9. Επιστροφές',
          body: [
            'Οι αποστολές δεν επιστρέφονται και όλες οι πωλήσεις είναι οριστικές. Οι λόγοι, καθώς και το τι πρέπει να κάνετε αν υπάρχει πρόβλημα με την παραγγελία σας, περιγράφονται στην Πολιτική Επιστροφών, η οποία αποτελεί μέρος των παρόντων όρων.',
          ],
        },
        {
          heading: '10. Τα νόμιμα δικαιώματά σας',
          body: [
            'Κανένας όρος του παρόντος δεν περιορίζει ούτε αποκλείει δικαίωμα που σας παρέχει αναγκαστικού δικαίου νομοθεσία προστασίας καταναλωτή. Όπου όρος του παρόντος συγκρούεται με τέτοιο δικαίωμα, υπερισχύει ο νόμος.',
          ],
        },
        {
          heading: '11. Ο λογαριασμός σας',
          body: [
            'Είστε υπεύθυνοι για την εμπιστευτικότητα του κωδικού σας και για κάθε ενέργεια που γίνεται μέσω του λογαριασμού σας. Οι επαγγελματικοί λογαριασμοί και οι λογαριασμοί διαχειριστή πρέπει να χρησιμοποιούν έλεγχο ταυτότητας δύο παραγόντων. Ενημερώστε μας αμέσως αν πιστεύετε ότι κάποιος άλλος απέκτησε πρόσβαση στον λογαριασμό σας.',
            'Μπορούμε να αναστείλουμε ή να κλείσουμε λογαριασμό που χρησιμοποιείται δόλια, καταχρηστικά ή κατά παράβαση των όρων αυτών.',
          ],
        },
        {
          heading: '12. Πνευματική ιδιοκτησία',
          body: [
            'Το περιεχόμενο του ιστότοπου — κείμενα, φωτογραφίες, εικόνες προϊόντων, λογότυπα και σχεδιασμός — ανήκει σε εμάς ή στους προμηθευτές μας και προστατεύεται από τη νομοθεσία περί πνευματικής ιδιοκτησίας και εμπορικών σημάτων. Δεν επιτρέπεται η αντιγραφή, αναπαραγωγή ή εμπορική χρήση του χωρίς γραπτή άδειά μας.',
          ],
        },
        {
          heading: '13. Ευθύνη',
          body: [
            'Ευθυνόμαστε για ζημία που αποτελεί προβλέψιμη συνέπεια παράβασης των όρων αυτών ή έλλειψης εύλογης επιμέλειας εκ μέρους μας. Δεν ευθυνόμαστε για απρόβλεπτη ζημία, ούτε για διαφυγόντα κέρδη, επιχειρηματική ζημία ή απώλεια ευκαιρίας.',
            'Δεν περιορίζουμε την ευθύνη μας όπου ο νόμος δεν το επιτρέπει — ιδίως για θάνατο ή σωματική βλάβη από αμέλειά μας, ή για δόλο.',
            'Επειδή η υγεία των ψαριών ενυδρείου εξαρτάται από τις συνθήκες του ενυδρείου, την ποιότητα του νερού, τη δοσολογία και πολλούς άλλους παράγοντες εκτός του ελέγχου μας, δεν αναλαμβάνουμε ευθύνη για απώλειες ζωικού πληθυσμού μετά από συνήθη χρήση των προϊόντων μας.',
          ],
        },
        {
          heading: '14. Εφαρμοστέο δίκαιο και διαφορές',
          body: [
            'Οι όροι αυτοί διέπονται από το δίκαιο της Κυπριακής Δημοκρατίας και αρμόδια είναι τα κυπριακά δικαστήρια. Αν είστε καταναλωτής με κατοικία σε άλλο κράτος μέλος της ΕΕ, διατηρείτε επιπλέον την προστασία των αναγκαστικού δικαίου κανόνων της χώρας σας.',
            'Προτιμούμε πάντοτε να λύνουμε τα προβλήματα απευθείας, γι’ αυτό επικοινωνήστε πρώτα μαζί μας. Οι καταναλωτές στην Κύπρο μπορούν επίσης να απευθυνθούν στην Υπηρεσία Προστασίας Καταναλωτή του Υπουργείου Ενέργειας, Εμπορίου και Βιομηχανίας.',
          ],
        },
        {
          heading: '15. Επικοινωνία',
          body: [`Ερωτήσεις για τους όρους αυτούς: ${COMPANY.email}`],
        },
      ],
    },

    privacy: {
      title: 'Πολιτική Απορρήτου',
      intro:
        'Η πολιτική αυτή εξηγεί ποια προσωπικά δεδομένα συλλέγουμε όταν χρησιμοποιείτε τον ιστότοπο, γιατί τα συλλέγουμε, με ποιους τα μοιραζόμαστε και ποια δικαιώματα έχετε βάσει του ΓΚΠΔ.',
      sections: [
        {
          heading: '1. Ποιος είναι υπεύθυνος για τα δεδομένα σας',
          body: [
            `Υπεύθυνος επεξεργασίας είναι η ${COMPANY.legalName}, με εμπορική ονομασία ${COMPANY.tradingName}, ${COMPANY.addressEl}. Για κάθε ερώτημα σχετικά με το απόρρητο ή για την άσκηση των δικαιωμάτων που περιγράφονται παρακάτω, γράψτε στο ${COMPANY.email}.`,
          ],
        },
        {
          heading: '2. Τι συλλέγουμε',
          list: [
            'Δεδομένα λογαριασμού: διεύθυνση email, όνομα, κωδικός πρόσβασης (αποθηκεύεται μόνο ως κρυπτογραφικό hash — δεν τον βλέπουμε ποτέ), τύπος λογαριασμού και οι ρυθμίσεις ελέγχου ταυτότητας δύο παραγόντων, εφόσον τον ενεργοποιήσετε.',
            'Δεδομένα παραγγελίας: τα προϊόντα που αγοράσατε, οι τιμές, η κατάσταση της παραγγελίας και το ιστορικό παραγγελιών σας.',
            'Δεδομένα παράδοσης και τιμολόγησης: όνομα παραλήπτη, ταχυδρομική διεύθυνση, τηλέφωνο και email.',
            'Δεδομένα επαγγελματικού λογαριασμού: επωνυμία εταιρείας, αριθμός ΦΠΑ, αριθμός εγγραφής και διεύθυνση τιμολόγησης, για πελάτες που αιτούνται τιμές χονδρικής.',
            'Δεδομένα πληρωμής: λαμβάνουμε επιβεβαίωση πληρωμής, το ποσό και περιορισμένα στοιχεία όπως τα τέσσερα τελευταία ψηφία και τον τύπο της κάρτας. Δεν λαμβάνουμε ούτε αποθηκεύουμε ποτέ τον πλήρη αριθμό κάρτας.',
            'Τεχνικά δεδομένα: η διεύθυνση IP σας και βασικές πληροφορίες αιτήματος, που επεξεργάζεται ο πάροχος φιλοξενίας για λόγους ασφάλειας και αποτροπής κατάχρησης.',
            'Περιεχόμενο που υποβάλλετε: κριτικές προϊόντων και μηνύματα που μας στέλνετε.',
          ],
        },
        {
          heading: '3. Γιατί τα χρησιμοποιούμε και σε ποια νομική βάση',
          list: [
            'Για την παραλαβή, επεξεργασία, παράδοση και υποστήριξη της παραγγελίας σας — εκτέλεση της σύμβασης (άρθρο 6 παρ. 1 στοιχ. β΄ ΓΚΠΔ).',
            'Για τη δημιουργία και λειτουργία του λογαριασμού σας, συμπεριλαμβανομένης της ταυτοποίησης και της ασφάλειας δύο παραγόντων — εκτέλεση της σύμβασης.',
            'Για την επαλήθευση του αριθμού ΦΠΑ επαγγελματικού λογαριασμού μέσω της υπηρεσίας VIES — εκτέλεση σύμβασης και συμμόρφωση με φορολογικές υποχρεώσεις.',
            'Για την έκδοση τιμολογίων και την τήρηση λογιστικών αρχείων — συμμόρφωση με έννομη υποχρέωση (άρθρο 6 παρ. 1 στοιχ. γ΄ ΓΚΠΔ).',
            'Για την αποτροπή απάτης, κατάχρησης και μη εξουσιοδοτημένης πρόσβασης — έννομο συμφέρον μας για την προστασία του καταστήματος και των πελατών του (άρθρο 6 παρ. 1 στοιχ. στ΄ ΓΚΠΔ).',
            'Για τη δημοσίευση κριτικής προϊόντος που επιλέξατε να γράψετε — η συγκατάθεσή σας, την οποία μπορείτε να ανακαλέσετε οποτεδήποτε.',
          ],
        },
        {
          heading: '4. Ποιοι άλλοι επεξεργάζονται τα δεδομένα σας',
          body: ['Δεν πωλούμε τα προσωπικά σας δεδομένα. Τα μοιραζόμαστε μόνο με τους παρόχους που χρειαζόμαστε για τη λειτουργία του καταστήματος:'],
          list: [
            'Supabase — φιλοξενία, βάση δεδομένων και ταυτοποίηση για τον ιστότοπο.',
            'Stripe — επεξεργασία πληρωμών και τιμολόγηση. Η Stripe ενεργεί ως αυτοτελής υπεύθυνος επεξεργασίας για τα δεδομένα πληρωμής, βάσει της δικής της πολιτικής απορρήτου.',
            'Μεταφορείς (AKIS Express εντός Κύπρου, UPS διεθνώς) — τα στοιχεία παράδοσης που απαιτούνται για να φτάσει το δέμα σε εσάς.',
            'Google — μόνο εφόσον επιλέξετε σύνδεση με λογαριασμό Google, οπότε η Google μας επιβεβαιώνει την ταυτότητά σας.',
            'Υπηρεσία VIES της Ευρωπαϊκής Επιτροπής — μόνο ο αριθμός ΦΠΑ επαγγελματικού λογαριασμού, για επαλήθευση.',
          ],
        },
        {
          heading: '5. Διαβιβάσεις εκτός ΕΟΧ',
          body: [
            'Η υποδομή μας φιλοξενείται εντός της Ευρωπαϊκής Ένωσης. Όπου πάροχος επεξεργάζεται δεδομένα εκτός του Ευρωπαϊκού Οικονομικού Χώρου, η διαβίβαση καλύπτεται από τις Τυποποιημένες Συμβατικές Ρήτρες της Ευρωπαϊκής Επιτροπής ή ισοδύναμη εγγύηση.',
          ],
        },
        {
          heading: '6. Πόσο καιρό τα διατηρούμε',
          list: [
            'Δεδομένα λογαριασμού: όσο υφίσταται ο λογαριασμός σας. Ζητήστε μας τη διαγραφή τους και θα το κάνουμε, εκτός από όσα οφείλουμε να διατηρήσουμε εκ του νόμου.',
            'Παραγγελίες, τιμολόγια και λογιστικά αρχεία: για το διάστημα που απαιτεί η κυπριακή φορολογική και λογιστική νομοθεσία, ακόμη και μετά το κλείσιμο του λογαριασμού.',
            'Κριτικές: έως ότου τις αφαιρέσετε εσείς ή εμείς.',
            'Αρχεία καταγραφής ασφάλειας και πρόσβασης: για σύντομο διάστημα και στη συνέχεια διαγράφονται αυτόματα.',
          ],
        },
        {
          heading: '7. Τα δικαιώματά σας',
          body: [
            'Βάσει του ΓΚΠΔ έχετε δικαίωμα πρόσβασης στα δεδομένα σας, διόρθωσης, διαγραφής, περιορισμού ή εναντίωσης στην επεξεργασία, φορητότητας, καθώς και ανάκλησης της συγκατάθεσης όπου η επεξεργασία βασίζεται σε αυτήν.',
            `Για την άσκηση οποιουδήποτε δικαιώματος, στείλτε email στο ${COMPANY.email}. Απαντούμε εντός ενός μηνός. Μεγάλο μέρος των δεδομένων σας είναι επίσης διαθέσιμο απευθείας στον λογαριασμό σας.`,
          ],
        },
        {
          heading: '8. Cookies και τοπική αποθήκευση',
          body: [
            'Ο ιστότοπος δεν χρησιμοποιεί διαφημιστικά cookies, cookies στατιστικών ούτε ιχνηλάτες τρίτων. Δεν δημιουργούμε προφίλ και δεν μοιραζόμαστε δεδομένα με διαφημιστικά δίκτυα.',
            'Χρησιμοποιούμε μόνο απολύτως απαραίτητη αποθήκευση στο πρόγραμμα περιήγησης: η συνεδρία σύνδεσης, η προτίμηση γλώσσας και το καλάθι σας διατηρούνται τοπικά ώστε να λειτουργεί ο ιστότοπος. Η αποθήκευση που είναι απολύτως απαραίτητη για την παροχή υπηρεσίας που ζητήσατε δεν απαιτεί συγκατάθεση — γι’ αυτό δεν βλέπετε εδώ μπάνερ cookies.',
            'Η Stripe ενδέχεται να ορίσει δικά της cookies στις σελίδες πληρωμής της για την αποτροπή απάτης. Αυτό συμβαίνει στον τομέα της Stripe και διέπεται από τη δική της πολιτική απορρήτου.',
          ],
        },
        {
          heading: '9. Ασφάλεια',
          body: [
            'Όλη η κίνηση προς τον ιστότοπο είναι κρυπτογραφημένη με TLS. Οι κωδικοί αποθηκεύονται μόνο ως hash. Η πρόσβαση στα δεδομένα πελατών σε επίπεδο βάσης περιορίζεται με κανόνες ασφάλειας ανά γραμμή, ενώ οι επαγγελματικοί λογαριασμοί και οι λογαριασμοί διαχειριστή προστατεύονται με έλεγχο ταυτότητας δύο παραγόντων.',
            'Κανένα σύστημα δεν είναι απολύτως ασφαλές, αλλά αν κάποια παραβίαση επηρεάσει τα δικαιώματά σας θα ενημερώσουμε εσάς και την εποπτική αρχή όπως απαιτεί ο ΓΚΠΔ.',
          ],
        },
        {
          heading: '10. Ανήλικοι',
          body: [
            'Το κατάστημα δεν απευθύνεται σε παιδιά. Δεν δημιουργούμε εν γνώσει μας λογαριασμούς για άτομα κάτω των 16 ετών. Αν πιστεύετε ότι παιδί μάς έδωσε προσωπικά δεδομένα, επικοινωνήστε μαζί μας και θα τα διαγράψουμε.',
          ],
        },
        {
          heading: '11. Καταγγελίες',
          body: [
            'Αν θεωρείτε ότι χειριστήκαμε τα δεδομένα σας ανάρμοστα, ενημερώστε πρώτα εμάς — θα θέλαμε την ευκαιρία να το διορθώσουμε. Έχετε επίσης δικαίωμα υποβολής καταγγελίας στο Γραφείο Επιτρόπου Προστασίας Δεδομένων Προσωπικού Χαρακτήρα της Κυπριακής Δημοκρατίας ή στην εποπτική αρχή της χώρας ΕΕ όπου διαμένετε.',
          ],
        },
        {
          heading: '12. Αλλαγές στην πολιτική',
          body: [
            'Αν αλλάξει ο τρόπος με τον οποίο χειριζόμαστε προσωπικά δεδομένα, θα επικαιροποιήσουμε τη σελίδα αυτή και την ημερομηνία τελευταίας ενημέρωσης.',
          ],
        },
      ],
    },

    refunds: {
      title: 'Πολιτική Επιστροφών και Επιστροφής Χρημάτων',
      intro:
        'Παρακαλούμε διαβάστε την πριν παραγγείλετε. Οι αποστολές δεν επιστρέφονται και όλες οι πωλήσεις είναι οριστικές. Αν υπάρχει πρόβλημα με την παραγγελία σας, επικοινωνήστε μαζί μας και θα το εξετάσουμε ατομικά.',
      sections: [
        {
          heading: '1. Οι αποστολές δεν επιστρέφονται',
          body: [
            'Δεν δεχόμαστε επιστροφές και όλες οι πωλήσεις είναι οριστικές. Δεν υφίσταται δικαίωμα επιστροφής επειδή αλλάξατε γνώμη, παραγγείλατε λάθος προϊόν ή δεν το χρειάζεστε πλέον.',
            'Παρακαλούμε ελέγξτε προσεκτικά το καλάθι σας, την παραλλαγή του προϊόντος και τη διεύθυνση παράδοσης πριν πληρώσετε.',
          ],
        },
        {
          heading: '2. Γιατί δεν υπάρχει δικαίωμα υπαναχώρησης',
          body: [
            'Στις περισσότερες διαδικτυακές αγορές, οι καταναλωτές στην ΕΕ έχουν δεκατέσσερις ημέρες για να υπαναχωρήσουν. Το δικαίωμα αυτό δεν ισχύει εδώ, και η εξαίρεση προβλέπεται από τον ίδιο τον νόμο.',
            'Το άρθρο 16 στοιχείο δ΄ της Οδηγίας 2011/83/ΕΕ εξαιρεί αγαθά που είναι πιθανό να αλλοιωθούν ή να λήξουν σύντομα, και το άρθρο 16 στοιχείο ε΄ εξαιρεί σφραγισμένα αγαθά τα οποία δεν είναι κατάλληλα προς επιστροφή για λόγους προστασίας της υγείας ή υγιεινής, εφόσον έχουν αποσφραγιστεί.',
            'Η τροφή ψαριών ενυδρείου εμπίπτει και στις δύο περιπτώσεις. Πρόκειται για αναλώσιμο, φθαρτό προϊόν διατροφής, που πωλείται σφραγισμένο· από τη στιγμή που μια συσκευασία φύγει από τον έλεγχό μας ή ανοιχθεί, δεν μπορούμε να επαληθεύσουμε πώς αποθηκεύτηκε ούτε να εγγυηθούμε ότι είναι ασφαλής για τα ψάρια άλλου πελάτη. Για τον λόγο αυτό δεν μπορεί να μεταπωληθεί ούτε να γίνει δεκτή πίσω.',
          ],
        },
        {
          heading: '3. Ακύρωση πριν από την αποστολή',
          body: [
            'Αν το δέμα σας δεν έχει ακόμη παραδοθεί στον μεταφορέα, επικοινωνήστε μαζί μας το συντομότερο δυνατό και θα το ακυρώσουμε εφόσον είναι ακόμη εφικτό. Μόλις ένα δέμα αποσταλεί, δεν μπορεί πλέον να ακυρωθεί.',
          ],
        },
        {
          heading: '4. Αν υπάρχει πρόβλημα με την παραγγελία σας',
          body: [
            'Αν το δέμα φτάσει κατεστραμμένο, αν λάβατε λάθος προϊόν ή αν υπάρχει πρόβλημα με την κατάσταση του προϊόντος, γράψτε μας περιγράφοντας τι συνέβη. Φωτογραφίες του δέματος, της συσκευασίας και του προϊόντος μάς βοηθούν να κατανοήσουμε γρήγορα την κατάσταση.',
            'Κάθε περίπτωση εξετάζεται ατομικά και επιλύεται κατά τη διακριτική μας ευχέρεια. Συνεργαζόμαστε απευθείας με τους πελάτες μας και θέλουμε να είστε ικανοποιημένοι, γι’ αυτό επικοινωνήστε μαζί μας πριν προβείτε σε οποιαδήποτε άλλη ενέργεια.',
          ],
        },
        {
          heading: '5. Δέματα που δεν παραδίδονται',
          body: [
            'Κάθε αποστολή παρακολουθείται. Αν η παρακολούθηση εμφανίζει το δέμα ως παραδοθέν αλλά δεν το έχετε λάβει, ή αν παραμένει στάσιμο για ασυνήθιστα μεγάλο διάστημα, επικοινωνήστε μαζί μας και θα ανοίξουμε έρευνα με τον μεταφορέα.',
            'Βεβαιωθείτε ότι η διεύθυνση παράδοσης είναι πλήρης και σωστή. Δεν φέρουμε ευθύνη για δέμα που παραδόθηκε σε διεύθυνση την οποία μας δηλώσατε εσφαλμένα ή που δεν παραλήφθηκε κατά την παράδοση.',
          ],
        },
        {
          heading: '6. Πώς γίνεται η επιστροφή χρημάτων, εφόσον συμφωνηθεί',
          body: [
            'Όπου συμφωνήσουμε επιστροφή χρημάτων, αυτή πραγματοποιείται μέσω Stripe στον αρχικό τρόπο πληρωμής. Ο χρόνος εμφάνισης στον λογαριασμό σας εξαρτάται από την τράπεζά σας, συνήθως λίγες εργάσιμες ημέρες.',
          ],
        },
        {
          heading: '7. Τα νόμιμα δικαιώματά σας',
          body: [
            'Η πολιτική αυτή δεν θίγει δικαιώματα που σας παρέχει η νομοθεσία προστασίας καταναλωτή και τα οποία δεν μπορούν να αποκλειστούν με συμφωνία, περιλαμβανομένων των δικαιωμάτων σας σε σχέση με αγαθά που δεν ανταποκρίνονται στη σύμβαση.',
          ],
        },
        {
          heading: '8. Επικοινωνία',
          body: [
            `Γράψτε στο ${COMPANY.email} με τον αριθμό παραγγελίας σας και περιγραφή του προβλήματος. Διαβάζουμε κάθε μήνυμα.`,
          ],
        },
      ],
    },
  },

  // ───────────────────────────────────────────────────────── Български
  bg: {
    terms: {
      title: 'Общи условия за продажба',
      intro:
        'Тези условия уреждат всяка поръчка, направена през този сайт. Моля, прочетете ги преди да купите — подаването на поръчка означава, че ги приемате.',
      sections: [
        {
          heading: '1. От кого купувате',
          body: [
            `Сайтът се управлява от ${COMPANY.legalName}, с търговско наименование ${COMPANY.tradingName} („ние“).`,
          ],
          list: [
            `Регистрационен номер: ${COMPANY.registrationNumber}`,
            `ДДС номер: ${COMPANY.vatNumber}`,
            `Седалище: ${COMPANY.address}`,
            `Имейл: ${COMPANY.email}`,
          ],
        },
        {
          heading: '2. Обхват',
          body: [
            'Тези условия се прилагат за всички продажби на стоки през сайта — както към потребители, така и към бизнес клиенти. С подаването на поръчка потвърждавате, че имате правоспособност да сключите договор, а когато поръчвате като фирма — че сте оправомощени да я задължите.',
            'Възможно е да актуализираме условията. За всяка поръчка важи версията, публикувана в момента на подаването ѝ.',
          ],
        },
        {
          heading: '3. Продукти',
          body: [
            'Продаваме храни за аквариумни риби, препарати за вода и свързани аквариумни продукти. Снимките, теглата и описанията се предоставят добросъвестно и възможно най-точно, но между производствените партиди са възможни малки разлики във външния вид, размера на гранулата и опаковката.',
            'Продуктите са предназначени единствено за декоративни аквариумни риби. Не са за човешка консумация и не са ветеринарни лекарствени продукти. Винаги следвайте указанията за хранене върху опаковката.',
          ],
        },
        {
          heading: '4. Цени и ДДС',
          body: [
            'Всички цени са в евро (EUR) и включват ДДС по приложимата ставка. Цената, която виждате при плащане, е крайната цена на стоките; доставката се изчислява отделно и се показва преди плащането.',
            'Можем да променяме цените по всяко време, но промяната никога не засяга вече приета поръчка. Ако продукт е обявен с явно грешна цена поради техническа или човешка грешка, можем да откажем поръчката и да възстановим сумата изцяло, вместо да я изпълним на тази цена.',
          ],
        },
        {
          heading: '5. Бизнес акаунти (търговия на едро)',
          body: [
            'Одобрените бизнес клиенти виждат цени на едро. За да кандидатствате, регистрирайте бизнес акаунт и посочете валиден ДДС номер от ЕС, който проверяваме в базата VIES на Европейската комисия.',
            'Одобрението е по наша преценка и може да бъде оттеглено, ако ДДС номерът престане да е валиден или ако акаунтът се използва за цели, различни от действителна препродажба или професионална употреба. Цените на едро са поверителни и не могат да бъдат публикувани или споделяни.',
          ],
        },
        {
          heading: '6. Как се сключва договорът',
          body: [
            'Вашата поръчка е предложение за покупка. Договорът се счита за сключен едва когато приемем поръчката — на практика, когато я потвърдим и започнем подготовката ѝ за изпращане.',
            'Можем да откажем поръчка, например ако стоката не е налична, ако не можем да доставим на вашия адрес, ако плащането не бъде одобрено или при основателно съмнение за измама. Ако откажем след получено плащане, възстановяваме сумата изцяло.',
          ],
        },
        {
          heading: '7. Плащане',
          body: [
            'Плащанията се обработват от Stripe. Ние никога не виждаме и не съхраняваме пълния номер на картата ви — данните на картата се обработват изцяло от Stripe в техните защитени системи.',
            'Плащането се събира в момента на покупката. Стоките остават наша собственост до пълното им заплащане.',
          ],
        },
        {
          heading: '8. Доставка',
          body: [
            'Изпращаме в рамките на Кипър и в чужбина. Цената на доставката се изчислява според теглото на пратката и зоната на местоназначение и винаги се показва преди плащането. Актуалните тарифи са публикувани на страницата „Цени за доставка“.',
            'Посочените срокове за доставка са ориентировъчни, а не гарантирани. След предаване на пратката на куриера времето за транспорт е извън нашия контрол. Забавяния по вина на куриера, митницата, времето или обстоятелства извън разумния ни контрол не дават право да откажете вече изпратена поръчка.',
            'При доставки извън Европейския съюз евентуални вносни мита, митнически такси или местни данъци са за ваша сметка и не са включени в цената, която ни заплащате.',
          ],
        },
        {
          heading: '9. Връщания',
          body: [
            'Пратките не подлежат на връщане и всички продажби са окончателни. Причините, както и какво да направите при проблем с поръчката, са описани в Политиката за връщане, която е част от тези условия.',
          ],
        },
        {
          heading: '10. Вашите законови права',
          body: [
            'Нищо в тези условия не ограничава и не изключва право, което имате по императивно потребителско законодателство и което не може да бъде ограничено или изключено по споразумение. При противоречие между клауза от този договор и такова право, законът има предимство.',
          ],
        },
        {
          heading: '11. Вашият акаунт',
          body: [
            'Вие отговаряте за поверителността на паролата си и за всичко, извършено чрез вашия акаунт. Бизнес акаунтите и администраторските акаунти трябва да използват двуфакторно удостоверяване. Уведомете ни незабавно, ако смятате, че някой друг е получил достъп до акаунта ви.',
            'Можем да спрем или закрием акаунт, който се използва с цел измама, злоупотреба или в нарушение на тези условия.',
          ],
        },
        {
          heading: '12. Интелектуална собственост',
          body: [
            'Съдържанието на сайта — текстове, фотографии, продуктови изображения, лога и дизайн — принадлежи на нас или на наши доставчици и е защитено от авторското право и правото върху марките. Не се допуска копиране, възпроизвеждане или търговско използване без наше писмено разрешение.',
          ],
        },
        {
          heading: '13. Отговорност',
          body: [
            'Отговаряме за вреди, които са предвидима последица от нарушение на тези условия или от липса на дължима грижа от наша страна. Не отговаряме за непредвидими вреди, нито за пропуснати ползи, търговски загуби или пропуснати възможности.',
            'Не ограничаваме отговорността си там, където законът не го позволява — по-специално при смърт или телесна повреда вследствие на наша небрежност, както и при измама.',
            'Тъй като здравето на аквариумните риби зависи от условията в аквариума, качеството на водата, дозирането и много други фактори извън нашия контрол, не поемаме отговорност за загуби на риби след обичайна употреба на нашите продукти.',
          ],
        },
        {
          heading: '14. Приложимо право и спорове',
          body: [
            'Тези условия се уреждат от правото на Република Кипър и компетентни са кипърските съдилища. Ако сте потребител с местожителство в друга държава — членка на ЕС, запазвате и защитата на императивните норми на вашата страна.',
            'Винаги предпочитаме да решим проблема директно с вас, затова първо се свържете с нас. Потребителите в Кипър могат да се обърнат и към Службата за защита на потребителите към Министерството на енергетиката, търговията и промишлеността.',
          ],
        },
        {
          heading: '15. Контакт',
          body: [`Въпроси по тези условия: ${COMPANY.email}`],
        },
      ],
    },

    privacy: {
      title: 'Политика за поверителност',
      intro:
        'Тази политика обяснява какви лични данни събираме, когато използвате сайта, защо ги събираме, с кого ги споделяме и какви права имате съгласно ОРЗД (GDPR).',
      sections: [
        {
          heading: '1. Кой отговаря за вашите данни',
          body: [
            `Администратор на лични данни е ${COMPANY.legalName}, с търговско наименование ${COMPANY.tradingName}, ${COMPANY.address}. За всеки въпрос относно поверителността или за упражняване на правата по-долу пишете на ${COMPANY.email}.`,
          ],
        },
        {
          heading: '2. Какво събираме',
          list: [
            'Данни за акаунта: имейл адрес, име, парола (съхранявана само като криптографски хеш — никога не я виждаме), тип на акаунта и настройките ви за двуфакторно удостоверяване, ако го активирате.',
            'Данни за поръчката: закупените продукти, цени, статус на поръчката и историята на поръчките ви.',
            'Данни за доставка и фактуриране: име на получателя, пощенски адрес, телефон и имейл.',
            'Данни за бизнес акаунт: наименование на фирмата, ДДС номер, регистрационен номер и адрес за фактуриране — за клиенти, кандидатстващи за цени на едро.',
            'Данни за плащане: получаваме потвърждение за плащането, сумата и ограничени данни като последните четири цифри и вида на картата. Никога не получаваме и не съхраняваме пълния номер на картата.',
            'Технически данни: вашият IP адрес и базова информация за заявката, обработвани от хостинг доставчика ни за целите на сигурността и предотвратяване на злоупотреби.',
            'Съдържание, което подавате: отзиви за продукти и съобщения, които ни изпращате.',
          ],
        },
        {
          heading: '3. Защо ги използваме и на какво основание',
          list: [
            'За приемане, обработка, доставка и поддръжка на поръчката ви — изпълнение на договора с вас (чл. 6, пар. 1, б. „б“ ОРЗД).',
            'За създаване и работа на акаунта ви, включително удостоверяване и двуфакторна защита — изпълнение на договора.',
            'За проверка на ДДС номера на бизнес акаунт чрез услугата VIES — изпълнение на договор и спазване на данъчните ни задължения.',
            'За издаване на фактури и водене на счетоводна документация — спазване на законово задължение (чл. 6, пар. 1, б. „в“ ОРЗД).',
            'За предотвратяване на измами, злоупотреби и неоторизиран достъп — наш законен интерес да защитим магазина и клиентите му (чл. 6, пар. 1, б. „е“ ОРЗД).',
            'За публикуване на отзив за продукт, който сте решили да напишете — вашето съгласие, което можете да оттеглите по всяко време.',
          ],
        },
        {
          heading: '4. Кой друг обработва данните ви',
          body: ['Не продаваме вашите лични данни. Споделяме ги само с доставчиците, необходими за работата на магазина:'],
          list: [
            'Supabase — хостинг, база данни и удостоверяване за този сайт.',
            'Stripe — обработка на плащания и фактуриране. Stripe действа като самостоятелен администратор за платежните данни съгласно собствената си политика за поверителност.',
            'Куриери (AKIS Express в Кипър, UPS в чужбина) — данните за доставка, необходими пратката да стигне до вас.',
            'Google — само ако изберете вход с Google акаунт, при което Google потвърждава самоличността ви пред нас.',
            'Услугата VIES на Европейската комисия — само ДДС номерът на бизнес акаунт, за проверка.',
          ],
        },
        {
          heading: '5. Предаване извън ЕИП',
          body: [
            'Инфраструктурата ни се хоства в рамките на Европейския съюз. Когато доставчик обработва данни извън Европейското икономическо пространство, предаването е покрито от Стандартните договорни клаузи на Европейската комисия или еквивалентна гаранция.',
          ],
        },
        {
          heading: '6. Колко дълго ги съхраняваме',
          list: [
            'Данни за акаунта: докато съществува акаунтът ви. Поискайте изтриване и ще го направим, освен за данните, които сме длъжни да запазим по закон.',
            'Поръчки, фактури и счетоводни документи: за срока, изискван от кипърското данъчно и счетоводно законодателство, дори след закриване на акаунта.',
            'Отзиви: докато не бъдат премахнати от вас или от нас.',
            'Логове за сигурност и достъп: кратък период, след което се изтриват автоматично.',
          ],
        },
        {
          heading: '7. Вашите права',
          body: [
            'Съгласно ОРЗД имате право на достъп до данните си, на коригиране, на изтриване, на ограничаване или възражение срещу обработването, на преносимост, както и да оттеглите съгласието си, когато обработването се основава на него.',
            `За упражняване на което и да е от тези права пишете на ${COMPANY.email}. Отговаряме в срок от един месец. Голяма част от данните ви са достъпни и директно във вашия акаунт.`,
          ],
        },
        {
          heading: '8. Бисквитки и локално съхранение',
          body: [
            'Сайтът не използва рекламни бисквитки, аналитични бисквитки или тракери на трети страни. Не изготвяме профили и не споделяме данни с рекламни мрежи.',
            'Използваме само строго необходимо съхранение в браузъра: сесията ви за вход, езиковото предпочитание и количката се пазят локално, за да работи сайтът. Съхранение, което е строго необходимо за предоставяне на поискана от вас услуга, не изисква съгласие — затова тук не виждате банер за бисквитки.',
            'Stripe може да зададе свои бисквитки на страниците си за плащане с цел предотвратяване на измами. Това се случва в домейна на Stripe и се урежда от нейната политика за поверителност.',
          ],
        },
        {
          heading: '9. Сигурност',
          body: [
            'Целият трафик към сайта е криптиран с TLS. Паролите се съхраняват само като хешове. Достъпът до клиентски данни на ниво база данни е ограничен чрез правила за сигурност на ниво ред, а бизнес и администраторските акаунти са защитени с двуфакторно удостоверяване.',
            'Нито една система не може да бъде гарантирано напълно защитена, но ако пробив някога засегне правата ви, ще уведомим вас и надзорния орган, както изисква ОРЗД.',
          ],
        },
        {
          heading: '10. Деца',
          body: [
            'Магазинът не е насочен към деца. Не създаваме съзнателно акаунти за лица под 16 години. Ако смятате, че дете ни е предоставило лични данни, свържете се с нас и ще ги изтрием.',
          ],
        },
        {
          heading: '11. Жалби',
          body: [
            'Ако смятате, че сме обработили данните ви неправомерно, моля първо кажете на нас — бихме искали възможността да го поправим. Имате право и да подадете жалба до Службата на Комисаря по защита на личните данни на Република Кипър или до надзорния орган на държавата от ЕС, в която живеете.',
          ],
        },
        {
          heading: '12. Промени в политиката',
          body: [
            'Ако променим начина, по който обработваме лични данни, ще актуализираме тази страница и датата на последна актуализация над нея.',
          ],
        },
      ],
    },

    refunds: {
      title: 'Политика за връщане и възстановяване',
      intro:
        'Моля, прочетете я преди да поръчате. Пратките не подлежат на връщане и всички продажби са окончателни. Ако има проблем с поръчката ви, свържете се с нас и ще го разгледаме индивидуално.',
      sections: [
        {
          heading: '1. Пратките не подлежат на връщане',
          body: [
            'Не приемаме връщания и всички продажби са окончателни. Няма право на връщане, защото сте променили решението си, поръчали сте грешен продукт или той вече не ви е нужен.',
            'Моля, проверете внимателно количката, варианта на продукта и адреса за доставка, преди да платите.',
          ],
        },
        {
          heading: '2. Защо няма срок за отказ',
          body: [
            'При повечето онлайн покупки потребителите в ЕС имат четиринадесет дни да се откажат от договора. Това право не се прилага тук, а изключението е предвидено в самия закон.',
            'Член 16, буква „г“ от Директива 2011/83/ЕС изключва стоки, които бързо се развалят или имат кратък срок на годност, а член 16, буква „д“ изключва запечатани стоки, които не подлежат на връщане поради съображения, свързани със защита на здравето или по хигиенни причини, след като са били разпечатани.',
            'Храната за аквариумни риби попада и в двете хипотези. Това е бързоразвалящ се фуражен продукт, който се продава запечатан; след като опаковка напусне нашия контрол или бъде отворена, не можем да проверим как е била съхранявана, нито да гарантираме, че е безопасна за рибите на друг клиент. Затова тя не може да бъде препродадена и не може да бъде приета обратно.',
          ],
        },
        {
          heading: '3. Отказ преди изпращане',
          body: [
            'Ако пратката ви още не е предадена на куриера, свържете се с нас възможно най-бързо и ще я анулираме, докато това е още възможно. След като пратката бъде изпратена, тя вече не може да бъде анулирана.',
          ],
        },
        {
          heading: '4. Ако има проблем с поръчката ви',
          body: [
            'Ако пратката пристигне повредена, ако сте получили грешен артикул или ако има проблем със състоянието на продукта, пишете ни и опишете какво се е случило. Снимки на пратката, опаковката и продукта ни помагат да разберем бързо ситуацията.',
            'Всеки случай се разглежда индивидуално и се решава по наша преценка. Работим директно с клиентите си и държим да сте доволни, затова се свържете с нас, преди да предприемете каквато и да е друга стъпка.',
          ],
        },
        {
          heading: '5. Пратки, които не пристигат',
          body: [
            'Всяка пратка се проследява. Ако проследяването показва пратката като доставена, но не сте я получили, или ако тя стои без движение необичайно дълго, свържете се с нас и ще открием проверка при куриера.',
            'Моля, уверете се, че адресът за доставка е пълен и точен. Не носим отговорност за пратка, доставена на адрес, който сте ни посочили неправилно, или отказана при доставка.',
          ],
        },
        {
          heading: '6. Как се извършва възстановяване, ако бъде договорено',
          body: [
            'Когато се съгласим на възстановяване, то се извършва през Stripe към първоначалния начин на плащане. Скоростта, с която сумата се появява по извлечението ви, зависи от вашата банка — обикновено няколко работни дни.',
          ],
        },
        {
          heading: '7. Вашите законови права',
          body: [
            'Тази политика не засяга права, които потребителското законодателство ви предоставя и които не могат да бъдат изключени по споразумение, включително правата ви във връзка със стоки, които не съответстват на договора.',
          ],
        },
        {
          heading: '8. Контакт',
          body: [
            `Пишете на ${COMPANY.email} с номера на поръчката и описание на проблема. Четем всяко съобщение.`,
          ],
        },
      ],
    },
  },
}
