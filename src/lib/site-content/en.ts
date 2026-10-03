import type { SiteContent } from "./types";

const en: SiteContent = {
  ui: {
    back: "Back", updated: "Last updated", onThisPage: "On this page", contactTitle: "Need to talk to a person?",
    contactBody: "Tell us what happened and what you expected. The clearer you are, the faster we can help.",
    contactInApp: "Inside the app: More → Help & feedback.", emailUs: "Email us at", operator: "Service operator",
    helpTitle: "Help center", helpIntro: "Short answers for the day-to-day: materials, purchases, proposals, invoices and team.",
    searchPh: "Search: buy, invoice, employee, install…", noResults: "We found nothing for that search. Try another word or contact us.",
    startTitle: "Get started in 5 steps",
    startSteps: [
      "Create your account and fill in your company details in More → Settings (name, logo, currency, time zone).",
      "Add your customer and create the project: everything else hangs from the project.",
      "Build the material list. Choose “Buy now” to generate the purchase order, or “Request quotes from suppliers” to compare prices.",
      "Create the proposal for your customer and send them the secure link: they can approve it or ask for changes without installing anything.",
      "As the work moves forward, invoice from the approved proposal and record the payments you receive.",
    ],
    legalLinks: "Legal", terms: "Terms & conditions", privacy: "Privacy policy", help: "Help",
    acceptNote: "By creating your account you accept the", footerRights: "All rights reserved.", print: "Print", topics: "Topics", related: "Related",
  },
  terms: {
    title: "Terms & conditions",
    summaryTitle: "In plain words",
    summary: [
      "BidPower is a tool to organize your operation: projects, customers, materials, purchases, proposals, invoices and team.",
      "Your data is yours. You decide who on your team sees what. You are responsible for what you send to your customers and suppliers.",
      "BidPower does not collect money for you, does not process payments and does not replace your accountant or your lawyer.",
    ],
    sections: [
      { id: "acceptance", title: "1. Acceptance of the terms", body: [
        "By creating an account, signing in or using BidPower you accept these terms and the Privacy policy. If you use BidPower on behalf of a company, you state that you have authority to bind it.",
        "If you do not agree, do not use the service.",
      ] },
      { id: "service", title: "2. What BidPower is and is not", body: [
        "BidPower is a web and installable (PWA) application for contractors, their teams and their suppliers. It lets you:",
        "- Create and control projects and customers.",
        "- Build material lists, request prices from a supply house and generate purchase orders.",
        "- Create proposals for customers, share them by secure link and record their response.",
        "- Record expenses and receipts, issue invoices and record the payments received.",
        "- Invite employees with individual permissions.",
        "BidPower is not accounting software, does not file taxes, is not legal, tax, accounting or engineering advice, and is not a party to any transaction between contractors, customers and suppliers.",
      ] },
      { id: "accounts", title: "3. Accounts, roles and security", body: [
        "You must provide truthful information and keep it up to date. You are responsible for the activity on your account and for protecting your password.",
        "The owner of a company account decides who belongs to the team, which role they have (owner, manager or employee) and which individual permissions they get: request materials, upload receipts, create or send purchase orders, view costs or profit, and amount limits. The owner can change them or deactivate a person at any time; their history is kept.",
        "Tell us immediately if you suspect someone accessed your account without permission.",
      ] },
      { id: "use", title: "4. Acceptable use", body: [
        "You may not use BidPower to:",
        "- Carry out illegal, fraudulent or deceptive activity, including sending proposals, invoices or quotes with false information.",
        "- Access other companies' data, test or bypass security measures, or overload the service.",
        "- Upload viruses, malicious content or files you have no right to share.",
        "- Resell the service or copy it without authorization.",
      ] },
      { id: "content", title: "5. Your content and your data", body: [
        "The projects, customers, prices, documents, photos and other information you upload are yours. You give us the limited permission needed to store them, show them to the people you authorize and operate the service.",
        "You are responsible for having the right to upload your customers', employees' and suppliers' data, and for complying with the laws that apply to you when processing it.",
        "Allowed files are PDF, JPG, PNG and WebP up to 10 MB each.",
        "Keep copies of your important documents. You can export your operating data as CSV or JSON from Accounting.",
      ] },
      { id: "links", title: "6. Documents shared with customers and suppliers", body: [
        "Proposals, purchase orders and price requests are shared through secure links. Anyone who has the link can see that document, so send it only to the right person and treat it as private. The customer does not see supplier costs, margins or internal information; the supply house does not see what you charge your customer.",
        "When a customer approves a proposal, BidPower records the name they typed and the date and time. That record is not a certified electronic signature. If you need a signature with special legal validity, use a separately signed contract.",
        "The prices, availability and delivery times a supply house answers with are its responsibility. BidPower only displays them.",
      ] },
      { id: "invoices", title: "7. Invoices, payments and taxes", body: [
        "BidPower helps you prepare invoices and record the payments you receive. It does not charge your customers or process payments: money moves outside BidPower and you record it.",
        "You are responsible for making sure invoices, taxes, document numbers and deadlines comply with the rules of your country or state.",
      ] },
      { id: "plans", title: "8. Plans and limits", body: [
        "The Free plan includes up to 3 active projects, 3 employees, 3 proposals per month, 50 expenses per month and 20 purchase orders per month. Paid plans will remove those limits.",
        "Before charging you anything we will show you the price and conditions and wait for your confirmation. If we change a plan's limits or prices, we will give you reasonable advance notice.",
      ] },
      { id: "availability", title: "9. Availability and changes to the service", body: [
        "We work to keep BidPower available and working well, but it is provided “as is”: there may be interruptions for maintenance, provider failures or causes beyond our control. Offline, only a notice page is shown; information is saved when there is internet.",
        "We may improve, change or retire features. If a change significantly affects your use, we will let you know.",
      ] },
      { id: "ip", title: "10. Intellectual property", body: [
        "BidPower, its design, brand and software belong to their owner. These terms do not transfer any rights in them to you, except the limited right to use the service while you comply with the terms.",
        "If you send us ideas or feedback, we may use them to improve the service without owing you compensation.",
      ] },
      { id: "termination", title: "11. Suspension and account closure", body: [
        "You can stop using BidPower whenever you want. To close your account and ask us to delete your data, contact us using the details on this page.",
        "We may suspend or close an account that breaks these terms, puts the security of the service at risk or is used for fraud, giving notice when possible.",
      ] },
      { id: "liability", title: "12. Warranties and limitation of liability", body: [
        "To the extent the law allows, BidPower is not liable for indirect losses, lost profit, lost business or decisions made with the information in the app (for example budgets, estimated profit or third-party prices). The figures the app shows are an operating aid that you must verify.",
        "BidPower's total liability to you for any claim is limited to the amount you paid for the service in the previous 12 months or, on the free plan, a token amount. Nothing in these terms excludes liability that the law does not allow to be excluded.",
      ] },
      { id: "changes", title: "13. Changes to these terms", body: [
        "We may update these terms. We will publish the new version with its date and, if the change is important, notify you in the app. Continuing to use BidPower after the change means you accept it.",
      ] },
      { id: "law", title: "14. Governing law", body: [
        "These terms are governed by the laws applicable in the jurisdiction of the service operator shown at the bottom of this page, without prejudice to the rights your country's law gives you as a user.",
      ] },
    ],
  },
  privacy: {
    title: "Privacy policy",
    summaryTitle: "In plain words",
    summary: [
      "We keep only what you need to use BidPower: your account, your company details and what you upload (projects, customers, documents).",
      "We do not sell your data, show ads or use third-party trackers.",
      "Each company sees only its own data, and inside the company each person sees according to their permissions.",
    ],
    sections: [
      { id: "who", title: "1. Who is responsible", body: [
        "The data controller is the operator of the BidPower service shown at the bottom of this page. For your customers' and suppliers' data that you upload, you decide what it is used for and BidPower acts as a provider storing it on your behalf.",
      ] },
      { id: "data", title: "2. What data we process", body: [
        "- Account: name, email, phone (optional) and password. The password is stored encrypted by the authentication system; we can never see it.",
        "- Company: name, logo, address, currency, time zone and details for your documents.",
        "- Operations you upload: projects, customers and their contact details, material lists, quotes, purchase orders, proposals, invoices, expenses, receipts, photos and PDF files.",
        "- Team: invited people, their role, permissions and activity in projects (for example, who uploaded a receipt).",
        "- Messages you send us from Help & feedback, with the page you wrote from.",
        "- Minimal technical data: server and error logs to keep the service secure and fix failures.",
        "We do not ask for card or bank account details.",
      ] },
      { id: "use", title: "3. What we use it for", body: [
        "- Providing the service: signing in, saving and showing your information, generating your documents and links.",
        "- Keeping things secure, preventing abuse and fixing errors.",
        "- Answering your questions and improving the product with your feedback.",
        "- Meeting legal obligations where applicable.",
        "We do not sell personal data or use it for advertising.",
      ] },
      { id: "sharing", title: "4. Who it is shared with", body: [
        "- Inside your company: according to the role and permissions you assign.",
        "- With your customers and suppliers: only the document you choose to send through a secure link. A connected supply house sees only the requests you send it; a customer sees only what you share.",
        "- Technical providers that run the service: Supabase (database, authentication and file storage) and Vercel (application hosting). They process the data only to provide that service.",
        "- Authorities, when a law or a valid order requires it.",
      ] },
      { id: "cookies", title: "5. Cookies and local storage", body: [
        "We use only what is needed for the app to work:",
        "- Sign-in session cookies.",
        "- Your language and theme (cookie and browser storage).",
        "- A service worker that stores only a notice page for when there is no connection.",
        "We do not use advertising cookies or third-party analytics tools.",
      ] },
      { id: "security", title: "6. Security", body: [
        "Data travels encrypted (HTTPS). The database applies per-company isolation and row-level access rules, so one company cannot read another's data. Secure links use long random codes that are stored as a hash, not in readable form.",
        "No system is 100% invulnerable. If we detect an incident affecting your data, we will tell you as required by applicable law.",
      ] },
      { id: "retention", title: "7. How long we keep data", body: [
        "While your account is active. When a person leaves your company their access is deactivated and their history is kept in your projects. If you close your account, we delete or anonymize your data within a reasonable time, except what the law requires us to keep.",
      ] },
      { id: "rights", title: "8. Your rights", body: [
        "You can ask for access to your data, to correct it, export it, restrict its use or object to it, and ask us to delete it. Some of this you do yourself in the app (for example, editing your profile and company details). For the rest, contact us using the details on this page and we will reply within a reasonable time.",
        "If you believe we mishandled your data, you can also go to the data protection authority in your country.",
      ] },
      { id: "transfers", title: "9. International transfers", body: [
        "Our technical providers may process data on servers located outside your country. When that happens, we require appropriate safeguards.",
      ] },
      { id: "minors", title: "10. Minors", body: [
        "BidPower is for professional use and is not directed at people under 18.",
      ] },
      { id: "changes", title: "11. Changes to this policy", body: [
        "If we change this policy we will publish the new version with its date and, if the change is important, notify you in the app.",
      ] },
    ],
  },
  help: [
    { id: "start", title: "Getting started", blurb: "Account, company and project.", articles: [
      { id: "create-account", q: "How do I create my account?", keywords: "register sign up registro", a: [
        "Go to Create account, enter your name, email and password, then your company name. If you are a supply house, choose that option to receive price requests from contractors.",
        "If you were invited to a team, open the invitation link: your email is already filled in and you join that company.",
      ] },
      { id: "company", q: "Where do I put my logo and company details?", keywords: "settings logo currency time zone", a: [
        "In More → Settings (owner only). There you will find name, logo, address, currency and time zone. They appear on your proposals, purchase orders and invoices.",
        "The logo can be JPG, PNG or WebP.",
      ] },
      { id: "project", q: "How do I create a project?", keywords: "new project customer", a: [
        "First add the customer under Customers, then create the project from Projects → New. Inside the project you have materials, purchases, proposals, invoices, expenses and activity; you never retype the project name.",
      ] },
      { id: "forgot", q: "I forgot my password", keywords: "reset password recover", a: [
        "On the sign-in screen tap “Forgot your password?”. A secure link arrives by email so you can create a new one. Check your spam folder too.",
      ] },
      { id: "language", q: "How do I change the language?", keywords: "español english português language", a: [
        "With the language selector (top right on the access screens, and in Settings inside the app). BidPower is available in Spanish, English and Portuguese.",
      ] },
    ] },
    { id: "materials", title: "Materials and purchases", blurb: "Material list, buy now and purchase orders.", articles: [
      { id: "list", q: "How do I build a material list?", keywords: "material list cart import excel csv", a: [
        "In the project open Material. Search your library, type the item (for example “10 breakers 20A”: the quantity is detected automatically) or import a list from Excel/CSV. Every time you add something, the library learns it so it can suggest it later.",
      ] },
      { id: "buy-now", q: "What is “Buy now”?", keywords: "purchase order PO buy", a: [
        "Use it when you already know where to buy. A purchase order is created with your list, you send it to the supplier and then upload the receipt. The cost is added to the project when you complete the purchase.",
      ] },
      { id: "ask-prices", q: "What is “Request quotes from suppliers”?", keywords: "quote pricing request supply", a: [
        "Use it when you need to compare prices. A price request is created with your list and you send it to one or more suppliers. When the supply house answers, the answer appears in the request and from there you turn the chosen one into a purchase order.",
        "A price request is for the supply house. A proposal is for your customer: they are different things and never mix.",
      ] },
      { id: "po-limit", q: "Why can't I create or send a purchase order?", keywords: "permission limit approval employee", a: [
        "Your owner decides whether you can buy and up to what amount. If a purchase exceeds your limit it waits for approval. Ask them to adjust your permission under Team.",
      ] },
      { id: "receipt", q: "How do I upload a receipt?", keywords: "receipt photo proof", a: [
        "On the purchase order tap the camera and take a photo of the receipt. Employees must hand in the receipt photo before they can make another purchase. JPG, PNG and WebP (including iPhone photos) up to 10 MB are accepted.",
      ] },
    ] },
    { id: "proposals", title: "Proposals and customers", blurb: "Send, approve and change proposals.", articles: [
      { id: "create-proposal", q: "How do I create a proposal for my customer?", keywords: "proposal estimate quote", a: [
        "In the project, Proposal → New. Add the lines (you can pick them from your library), tax or discount, terms and notes. When it is ready, send it and share the secure link with your customer.",
      ] },
      { id: "customer-approves", q: "How does my customer approve?", keywords: "approve changes link", a: [
        "They open the link with no account, review the proposal and approve it by typing their name, or ask for changes with a comment. You see the response on the proposal and in what needs your attention.",
        "Approval records name, date and time; it is not a certified electronic signature.",
      ] },
      { id: "customer-sees", q: "What does my customer see?", keywords: "privacy costs margin", a: [
        "Only the proposal and what you share. They never see supplier prices, purchase order costs, margin or profit.",
      ] },
      { id: "versions", q: "The customer asked for changes, what do I do?", keywords: "version revise edit", a: [
        "Create a new version of the proposal with the changes and send it again. The previous one stays in the history.",
      ] },
    ] },
    { id: "invoices", title: "Invoices and money", blurb: "Invoice, record payments and track costs.", articles: [
      { id: "invoice", q: "How do I issue an invoice?", keywords: "invoice deposit advance", a: [
        "From an approved proposal choose Invoice. You can invoice the total or a part (for example a deposit). The invoice has a PDF to send and its own number.",
      ] },
      { id: "payments", q: "Does BidPower charge my customer?", keywords: "payment charge stripe card", a: [
        "No. BidPower does not process payments. When your customer pays you, you record the payment on the invoice and the balance and status update on their own (partial, paid or overdue).",
      ] },
      { id: "costs", q: "Where do I see how much I make on the project?", keywords: "profit budget cost reports", a: [
        "In the project you will see budget, actual cost, committed cost and estimated profit. Only roles with permission to view costs or profit see them.",
        "These are operating figures to help you decide, not accounting. Check them with your accountant.",
      ] },
      { id: "export", q: "Can I export for my accountant?", keywords: "accounting quickbooks export csv", a: [
        "Yes. In More → Accounting you export your data (expenses, invoices and more) as CSV or JSON for your accountant or for QuickBooks.",
      ] },
    ] },
    { id: "team", title: "Team and permissions", blurb: "Invite people and decide what they can do.", articles: [
      { id: "invite", q: "How do I invite an employee?", keywords: "invitation team employee manager", a: [
        "Under Team tap Invite, enter their name and email, choose a permission template and the projects they will work on. Share the invitation link; when they open it they create their account and join.",
        "The Free plan allows up to 3 employees.",
      ] },
      { id: "permissions", q: "What can each role do?", keywords: "owner manager employee permissions template", a: [
        "- Owner: everything, including team and settings.",
        "- Manager: manages projects, purchases and customers.",
        "- Employee: sees only assigned projects, requests materials and uploads receipts. They can buy only if the owner allows it, with an amount limit.",
        "Permissions can be changed or removed at any time.",
      ] },
      { id: "deactivate", q: "Someone left the company, what do I do?", keywords: "deactivate remove", a: [
        "Deactivate them under Team. They lose access immediately and their history stays in your projects.",
      ] },
    ] },
    { id: "supply", title: "Suppliers", blurb: "Answer requests and connect with contractors.", articles: [
      { id: "supply-respond", q: "I'm a supplier: how do I answer a price request?", keywords: "respond quote pdf", a: [
        "Open the link you were sent (no account needed) or go to your inbox if you have a supply account. Review the list, plans and notes, ask questions if something is unclear, and upload your quote PDF with number, total, availability and lead time.",
        "You do not see what the contractor charges their customer.",
      ] },
      { id: "supply-connect", q: "How do I connect with a contractor?", keywords: "connect code", a: [
        "The supply house generates a single-use code (it expires in 14 days) and gives it to the contractor. They enter it under Suppliers and are connected. You can also share the sign-up link so the contractor creates their account.",
      ] },
    ] },
    { id: "app", title: "App and installation", blurb: "Install on iPhone, Android and computer.", articles: [
      { id: "install-iphone", q: "How do I install it on iPhone or iPad?", keywords: "pwa install home screen safari", a: [
        "Open BidPower in Safari, tap Share and then “Add to Home Screen”. It opens like an app, full screen.",
      ] },
      { id: "install-android", q: "And on Android or a computer?", keywords: "chrome install android windows", a: [
        "In Chrome or Edge tap “Install” when the app offers it (More → Install) or use the browser menu → Install app.",
      ] },
      { id: "offline", q: "Does it work without internet?", keywords: "offline connection", a: [
        "It needs a connection to save and view your data. Without internet you will see a notice page; when the connection returns you continue where you were.",
      ] },
      { id: "broken", q: "Something is not working", keywords: "error bug problem slow", a: [
        "Try closing and reopening the app or reloading the page. If the problem continues, tell us in More → Help & feedback what you were doing and what you saw; the page you were on is saved.",
      ] },
    ] },
  ],
};
export default en;
