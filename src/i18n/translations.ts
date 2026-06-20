// All UI copy lives here, keyed by language. English is the source of truth;
// Greek (el) and Bulgarian (bg) mirror the same keys.

export type Language = 'en' | 'el' | 'bg'

export const LANGUAGES: { code: Language; label: string; nativeLabel: string; flag: string }[] = [
  { code: 'en', label: 'English', nativeLabel: 'English', flag: '🇬🇧' },
  { code: 'el', label: 'Greek', nativeLabel: 'Ελληνικά', flag: '🇬🇷' },
  { code: 'bg', label: 'Bulgarian', nativeLabel: 'Български', flag: '🇧🇬' },
]

export type TranslationKey = keyof (typeof translations)['en']

export const translations = {
  en: {
    // Navbar
    'nav.shop': 'Shop',
    'nav.catalog': 'Catalog',
    'nav.whyUs': 'Why us',
    'nav.contact': 'Contact',
    'nav.cart': 'Cart',
    'nav.language': 'Language',

    // Catalog drawer
    'catalog.title': 'Catalog',
    'catalog.close': 'Close catalog',
    'catalog.tabProducts': 'Products',
    'catalog.tabComing': 'New Products — Coming Soon',
    'catalog.emptyProducts': 'No products available yet — check the “Coming Soon” tab!',
    'catalog.emptyComing': 'No upcoming products right now.',

    // Language drawer
    'lang.title': 'Choose language',
    'lang.subtitle': 'Select your preferred language.',
    'lang.close': 'Close language menu',

    // Hero
    'hero.badge': 'Vet-formulated nutrition',
    'hero.title1': 'Vibrant color.',
    'hero.title2': 'Healthier discus.',
    'hero.subtitle':
      'Premium foods crafted for the unique needs of discus fish — for richer colors, stronger growth, and happier tanks.',
    'hero.shop': 'Shop the collection',
    'hero.why': 'Why DiscusFish',
    'hero.rating': '⭐ 4.9/5 from 2,000+ keepers',
    'hero.shipping': '🚚 Free shipping over $35',
    'hero.cardTitle': 'Premium Discus Granules',
    'hero.cardSubtitle': 'Color-enhancing · high protein',

    // Product grid
    'products.title': 'Shop our discus foods',
    'products.subtitle':
      'Carefully formulated blends to keep your discus colorful, active, and thriving.',

    // Product card
    'product.addToCart': 'Add to cart',
    'product.soldOut': 'Sold out',
    'product.comingSoon': 'Coming soon…',

    // CTA banner
    'cta.title': 'Nutrition that brings out their best',
    'cta.subtitle':
      'From fry to full-grown showpieces, our foods are built to deepen color and fuel healthy growth — naturally.',
    'cta.shopNow': 'Shop now',

    // Features
    'features.title': 'Made for happy, healthy discus',
    'features.subtitle':
      'Everything we make is designed around what discus actually need.',
    'features.color.title': 'Color enhancing',
    'features.color.text':
      'Natural astaxanthin and carotenoids bring out deep reds and blues.',
    'features.vet.title': 'Vet-formulated',
    'features.vet.text': 'Balanced protein and nutrients tuned to the discus diet.',
    'features.water.title': 'Clean water',
    'features.water.text':
      'Low-waste recipes that won’t cloud your tank or spike ammonia.',
    'features.shipping.title': 'Fast shipping',
    'features.shipping.text':
      'Free delivery on orders over $35, shipped within 24 hours.',

    // Footer
    'footer.tagline':
      'Premium nutrition for vibrant, healthy discus. Made by keepers, for keepers.',
    'footer.shop': 'Shop',
    'footer.allFoods': 'All foods',
    'footer.bestSellers': 'Best sellers',
    'footer.support': 'Support',
    'footer.whyUs': 'Why us',
    'footer.contact': 'Contact',
    'footer.rights': 'All rights reserved.',

    // Cart drawer
    'cart.title': 'Your cart',
    'cart.close': 'Close cart',
    'cart.empty': 'Your cart is empty',
    'cart.emptyHint': 'Add some food to keep your discus happy.',
    'cart.remove': 'Remove',
    'cart.clear': 'Clear cart',
    'cart.subtotal': 'Subtotal',
    'cart.checkout': 'Checkout',
    'cart.redirecting': 'Redirecting…',
    'cart.securePayment': 'Secure payment powered by Stripe',
    'cart.error':
      'Checkout isn’t available yet — the payments back-end still needs to be configured.',
    'cart.decrease': 'Decrease quantity',
    'cart.increase': 'Increase quantity',

    // Auth
    'auth.login': 'Log in',
    'auth.signup': 'Sign up',
    'auth.logout': 'Log out',
    'auth.loginTitle': 'Welcome back',
    'auth.signupTitle': 'Create your account',
    'auth.username': 'User name',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.passwordHint': 'At least 6 characters',
    'auth.confirmPassword': 'Confirm password',
    'auth.createAccount': 'Create account',
    'auth.haveAccount': 'Already have an account?',
    'auth.noAccount': 'No account yet?',
    'auth.close': 'Close',
    'auth.adminPanel': 'Admin panel',
    'auth.signingIn': 'Logging in…',
    'auth.creating': 'Creating…',
    'auth.errPasswordShort': 'Password must be at least 6 characters.',
    'auth.errPasswordMatch': 'Passwords do not match.',
    'auth.errFields': 'Please fill in all fields.',
    'auth.signupSuccess': 'Account created! You can now log in.',
  },

  el: {
    // Navbar
    'nav.shop': 'Κατάστημα',
    'nav.catalog': 'Κατάλογος',
    'nav.whyUs': 'Γιατί εμάς',
    'nav.contact': 'Επικοινωνία',
    'nav.cart': 'Καλάθι',
    'nav.language': 'Γλώσσα',

    // Catalog drawer
    'catalog.title': 'Κατάλογος',
    'catalog.close': 'Κλείσιμο καταλόγου',
    'catalog.tabProducts': 'Προϊόντα',
    'catalog.tabComing': 'Νέα Προϊόντα — Σύντομα',
    'catalog.emptyProducts': 'Δεν υπάρχουν διαθέσιμα προϊόντα ακόμη — δείτε την καρτέλα «Σύντομα»!',
    'catalog.emptyComing': 'Δεν υπάρχουν επερχόμενα προϊόντα αυτή τη στιγμή.',

    // Language drawer
    'lang.title': 'Επιλέξτε γλώσσα',
    'lang.subtitle': 'Επιλέξτε την προτιμώμενη γλώσσα σας.',
    'lang.close': 'Κλείσιμο μενού γλώσσας',

    // Hero
    'hero.badge': 'Διατροφή με κτηνιατρική σύσταση',
    'hero.title1': 'Ζωντανό χρώμα.',
    'hero.title2': 'Πιο υγιή discus.',
    'hero.subtitle':
      'Premium τροφές φτιαγμένες για τις ιδιαίτερες ανάγκες των ψαριών discus — για πιο πλούσια χρώματα, πιο δυνατή ανάπτυξη και πιο ευτυχισμένα ενυδρεία.',
    'hero.shop': 'Δείτε τη συλλογή',
    'hero.why': 'Γιατί DiscusFish',
    'hero.rating': '⭐ 4.9/5 από 2.000+ εκτροφείς',
    'hero.shipping': '🚚 Δωρεάν αποστολή άνω των $35',
    'hero.cardTitle': 'Premium Κόκκοι Discus',
    'hero.cardSubtitle': 'Ενίσχυση χρώματος · υψηλή πρωτεΐνη',

    // Product grid
    'products.title': 'Αγοράστε τις τροφές discus μας',
    'products.subtitle':
      'Προσεκτικά διαμορφωμένα μείγματα για να κρατούν τα discus σας πολύχρωμα, δραστήρια και ακμαία.',

    // Product card
    'product.addToCart': 'Προσθήκη στο καλάθι',
    'product.soldOut': 'Εξαντλήθηκε',
    'product.comingSoon': 'Σύντομα κοντά σας…',

    // CTA banner
    'cta.title': 'Διατροφή που αναδεικνύει τον καλύτερό τους εαυτό',
    'cta.subtitle':
      'Από τα μικρά μέχρι τα πλήρως ανεπτυγμένα εκθεσιακά ψάρια, οι τροφές μας ενισχύουν το χρώμα και τροφοδοτούν την υγιή ανάπτυξη — φυσικά.',
    'cta.shopNow': 'Αγοράστε τώρα',

    // Features
    'features.title': 'Φτιαγμένο για ευτυχισμένα, υγιή discus',
    'features.subtitle':
      'Όλα όσα φτιάχνουμε σχεδιάζονται γύρω από αυτό που πραγματικά χρειάζονται τα discus.',
    'features.color.title': 'Ενίσχυση χρώματος',
    'features.color.text':
      'Η φυσική ασταξανθίνη και τα καροτενοειδή αναδεικνύουν βαθιά κόκκινα και μπλε.',
    'features.vet.title': 'Κτηνιατρική σύσταση',
    'features.vet.text':
      'Ισορροπημένη πρωτεΐνη και θρεπτικά συστατικά προσαρμοσμένα στη διατροφή των discus.',
    'features.water.title': 'Καθαρό νερό',
    'features.water.text':
      'Συνταγές χαμηλών αποβλήτων που δεν θολώνουν το ενυδρείο ούτε αυξάνουν την αμμωνία.',
    'features.shipping.title': 'Γρήγορη αποστολή',
    'features.shipping.text':
      'Δωρεάν παράδοση για παραγγελίες άνω των $35, αποστολή εντός 24 ωρών.',

    // Footer
    'footer.tagline':
      'Premium διατροφή για ζωντανά, υγιή discus. Φτιαγμένη από εκτροφείς, για εκτροφείς.',
    'footer.shop': 'Κατάστημα',
    'footer.allFoods': 'Όλες οι τροφές',
    'footer.bestSellers': 'Δημοφιλέστερα',
    'footer.support': 'Υποστήριξη',
    'footer.whyUs': 'Γιατί εμάς',
    'footer.contact': 'Επικοινωνία',
    'footer.rights': 'Με την επιφύλαξη παντός δικαιώματος.',

    // Cart drawer
    'cart.title': 'Το καλάθι σας',
    'cart.close': 'Κλείσιμο καλαθιού',
    'cart.empty': 'Το καλάθι σας είναι άδειο',
    'cart.emptyHint': 'Προσθέστε λίγη τροφή για να κρατήσετε τα discus σας ευτυχισμένα.',
    'cart.remove': 'Αφαίρεση',
    'cart.clear': 'Άδειασμα καλαθιού',
    'cart.subtotal': 'Υποσύνολο',
    'cart.checkout': 'Ολοκλήρωση αγοράς',
    'cart.redirecting': 'Ανακατεύθυνση…',
    'cart.securePayment': 'Ασφαλής πληρωμή μέσω Stripe',
    'cart.error':
      'Η ολοκλήρωση αγοράς δεν είναι ακόμη διαθέσιμη — το σύστημα πληρωμών πρέπει να ρυθμιστεί.',
    'cart.decrease': 'Μείωση ποσότητας',
    'cart.increase': 'Αύξηση ποσότητας',

    // Auth
    'auth.login': 'Σύνδεση',
    'auth.signup': 'Εγγραφή',
    'auth.logout': 'Αποσύνδεση',
    'auth.loginTitle': 'Καλώς ήρθατε ξανά',
    'auth.signupTitle': 'Δημιουργήστε τον λογαριασμό σας',
    'auth.username': 'Όνομα χρήστη',
    'auth.email': 'Email',
    'auth.password': 'Κωδικός',
    'auth.passwordHint': 'Τουλάχιστον 6 χαρακτήρες',
    'auth.confirmPassword': 'Επιβεβαίωση κωδικού',
    'auth.createAccount': 'Δημιουργία λογαριασμού',
    'auth.haveAccount': 'Έχετε ήδη λογαριασμό;',
    'auth.noAccount': 'Δεν έχετε λογαριασμό;',
    'auth.close': 'Κλείσιμο',
    'auth.adminPanel': 'Πίνακας διαχείρισης',
    'auth.signingIn': 'Σύνδεση…',
    'auth.creating': 'Δημιουργία…',
    'auth.errPasswordShort': 'Ο κωδικός πρέπει να έχει τουλάχιστον 6 χαρακτήρες.',
    'auth.errPasswordMatch': 'Οι κωδικοί δεν ταιριάζουν.',
    'auth.errFields': 'Συμπληρώστε όλα τα πεδία.',
    'auth.signupSuccess': 'Ο λογαριασμός δημιουργήθηκε! Μπορείτε τώρα να συνδεθείτε.',
  },

  bg: {
    // Navbar
    'nav.shop': 'Магазин',
    'nav.catalog': 'Каталог',
    'nav.whyUs': 'Защо нас',
    'nav.contact': 'Контакт',
    'nav.cart': 'Количка',
    'nav.language': 'Език',

    // Catalog drawer
    'catalog.title': 'Каталог',
    'catalog.close': 'Затвори каталога',
    'catalog.tabProducts': 'Продукти',
    'catalog.tabComing': 'Нови продукти — Очаквайте скоро',
    'catalog.emptyProducts': 'Все още няма налични продукти — вижте раздел „Очаквайте скоро“!',
    'catalog.emptyComing': 'В момента няма предстоящи продукти.',

    // Language drawer
    'lang.title': 'Изберете език',
    'lang.subtitle': 'Изберете предпочитания от вас език.',
    'lang.close': 'Затваряне на менюто за език',

    // Hero
    'hero.badge': 'Хранене с ветеринарна формула',
    'hero.title1': 'Ярки цветове.',
    'hero.title2': 'По-здрави дискуси.',
    'hero.subtitle':
      'Премиум храни, създадени за уникалните нужди на рибите дискус — за по-наситени цветове, по-силен растеж и по-щастливи аквариуми.',
    'hero.shop': 'Разгледай колекцията',
    'hero.why': 'Защо DiscusFish',
    'hero.rating': '⭐ 4.9/5 от над 2000 развъдчици',
    'hero.shipping': '🚚 Безплатна доставка над $35',
    'hero.cardTitle': 'Премиум гранули за дискус',
    'hero.cardSubtitle': 'Подсилва цвета · високо съдържание на протеин',

    // Product grid
    'products.title': 'Разгледайте нашите храни за дискус',
    'products.subtitle':
      'Внимателно разработени смеси, които поддържат вашите дискуси цветни, активни и в отлично здраве.',

    // Product card
    'product.addToCart': 'Добави в количката',
    'product.soldOut': 'Изчерпано',
    'product.comingSoon': 'Очаквайте скоро…',

    // CTA banner
    'cta.title': 'Хранене, което разкрива най-доброто от тях',
    'cta.subtitle':
      'От малките до напълно израсналите изложбени екземпляри, нашите храни са създадени да задълбочат цвета и да захранят здравословния растеж — естествено.',
    'cta.shopNow': 'Купи сега',

    // Features
    'features.title': 'Създадено за щастливи, здрави дискуси',
    'features.subtitle':
      'Всичко, което правим, е проектирано според това, от което дискусите наистина се нуждаят.',
    'features.color.title': 'Подсилване на цвета',
    'features.color.text':
      'Естественият астаксантин и каротеноидите подчертават наситени червени и сини нюанси.',
    'features.vet.title': 'Ветеринарна формула',
    'features.vet.text':
      'Балансиран протеин и хранителни вещества, съобразени с диетата на дискуса.',
    'features.water.title': 'Чиста вода',
    'features.water.text':
      'Рецепти с малко отпадъци, които няма да размътят аквариума или да повишат амоняка.',
    'features.shipping.title': 'Бърза доставка',
    'features.shipping.text':
      'Безплатна доставка за поръчки над $35, изпратена в рамките на 24 часа.',

    // Footer
    'footer.tagline':
      'Премиум хранене за ярки, здрави дискуси. Създадено от развъдчици, за развъдчици.',
    'footer.shop': 'Магазин',
    'footer.allFoods': 'Всички храни',
    'footer.bestSellers': 'Най-продавани',
    'footer.support': 'Поддръжка',
    'footer.whyUs': 'Защо нас',
    'footer.contact': 'Контакт',
    'footer.rights': 'Всички права запазени.',

    // Cart drawer
    'cart.title': 'Вашата количка',
    'cart.close': 'Затваряне на количката',
    'cart.empty': 'Количката ви е празна',
    'cart.emptyHint': 'Добавете малко храна, за да поддържате дискусите си щастливи.',
    'cart.remove': 'Премахни',
    'cart.clear': 'Изчисти количката',
    'cart.subtotal': 'Междинна сума',
    'cart.checkout': 'Плащане',
    'cart.redirecting': 'Пренасочване…',
    'cart.securePayment': 'Сигурно плащане чрез Stripe',
    'cart.error':
      'Плащането все още не е достъпно — системата за плащания трябва да бъде конфигурирана.',
    'cart.decrease': 'Намали количеството',
    'cart.increase': 'Увеличи количеството',

    // Auth
    'auth.login': 'Вход',
    'auth.signup': 'Регистрация',
    'auth.logout': 'Изход',
    'auth.loginTitle': 'Добре дошли отново',
    'auth.signupTitle': 'Създайте своя акаунт',
    'auth.username': 'Потребителско име',
    'auth.email': 'Имейл',
    'auth.password': 'Парола',
    'auth.passwordHint': 'Поне 6 символа',
    'auth.confirmPassword': 'Потвърдете паролата',
    'auth.createAccount': 'Създай акаунт',
    'auth.haveAccount': 'Вече имате акаунт?',
    'auth.noAccount': 'Нямате акаунт?',
    'auth.close': 'Затвори',
    'auth.adminPanel': 'Админ панел',
    'auth.signingIn': 'Влизане…',
    'auth.creating': 'Създаване…',
    'auth.errPasswordShort': 'Паролата трябва да е поне 6 символа.',
    'auth.errPasswordMatch': 'Паролите не съвпадат.',
    'auth.errFields': 'Моля, попълнете всички полета.',
    'auth.signupSuccess': 'Акаунтът е създаден! Вече можете да влезете.',
  },
} as const
