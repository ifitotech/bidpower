import type { HelpTopic } from "./types";

// Every screen and function of the app, in the words the app itself uses. Steps are "1. " lines.
export const helpEn: HelpTopic[] = [
  { id: "start", title: "Getting started", blurb: "Account, company and how everything connects.", articles: [
    { id: "how-it-works", q: "How does BidPower work from start to finish?", keywords: "flow overview process cycle", a: [
      "Everything revolves around the project. The typical path is:",
      "1. Customer → Project.",
      "2. Project material list (you or your team build it).",
      "3. From the list: “Buy now” (purchase order) or “Request quotes from suppliers” (you compare prices and award).",
      "4. Purchase order → the supplier delivers → you upload the receipt → the real cost goes into the project.",
      "5. Proposal for your customer → they approve by link → invoice → you record the payments.",
      "The proposal (what you charge the customer) and the quote request (what you ask the supplier) are different things and never mix: the customer never sees costs or margins and the supplier never sees what you charge.",
    ] },
    { id: "create-account", q: "How do I create my account?", keywords: "register sign up", a: [
      "Go to Create account, enter your name, email and password, then your company name. If you are a supply house, choose that option to receive quote requests from contractors.",
      "If you were invited to a team, open the invitation link: your email is already filled in and you join that company.",
    ] },
    { id: "forgot", q: "I forgot my password", keywords: "reset password recover", a: [
      "On the sign-in screen tap “Forgot your password?”. A secure link arrives by email so you can create a new one. Check your spam folder too.",
    ] },
    { id: "language-theme", q: "How do I change the language or the dark theme?", keywords: "español english português language theme dark light", a: [
      "Change the language with the small language button (ES / EN / PT) at the top, or in More → Settings → Language. The theme (light, dark or automatic by device) is in Settings → Theme.",
    ] },
    { id: "roles-summary", q: "What does each person see?", keywords: "owner manager employee supply customer privacy", a: [
      "- Owner: everything, including team, settings and profit.",
      "- Manager: manages projects, purchases and customers; profit only if the Owner allows it.",
      "- Employee: only their assigned projects; requests material, uploads receipts and buys if permitted.",
      "- Supplier: only the quote requests you send them.",
      "- Customer: only the proposal or document you share by link.",
    ] },
  ] },
  { id: "home", title: "Home, search and calendar", blurb: "What needs your attention and how to find anything.", articles: [
    { id: "home-owner", q: "What does the Home screen show?", keywords: "dashboard attention waiting", a: [
      "- Needs attention: what you must handle today (material requested, supplier replied, quote request due, PO without receipt, customer asked for changes, overdue invoice, proposal ready to invoice). If nothing is pending it says “All caught up”.",
      "- Waiting on: who has the next action on each item (supplier, customer, employee or you).",
      "- Team purchases: who bought where and which receipts are missing.",
      "- Quick actions: New project, Material, New proposal, New expense.",
      "- Your active projects.",
    ] },
    { id: "home-employee", q: "And an employee's Home screen?", keywords: "employee receipts request buy", a: [
      "It shows receipts to upload (while you have any pending you cannot make another purchase), the button to request material, the amount you can buy without approval and “My orders and purchases”.",
    ] },
    { id: "search", q: "How do I search for something?", keywords: "search find lookup", a: [
      "Use the magnifier or the Home search bar. Type at least 2 letters and it searches projects, customers, proposals and invoices (by number), purchase orders, material lists, quote requests, materials and suppliers at once. Each employee only finds what they are allowed to see.",
    ] },
    { id: "calendar", q: "What is in the Calendar?", keywords: "dates deliveries due", a: [
      "By month it shows expected purchase order deliveries, invoice due dates still owed, quote request response dates, proposals about to expire and projects' estimated end; below, projects scheduled by start date. Dates use your company's time zone.",
    ] },
  ] },
  { id: "projects", title: "Projects", blurb: "The center of everything: status, money and team.", articles: [
    { id: "create-project", q: "How do I create a project?", keywords: "new project customer status", a: [
      "1. Projects → New project (or the + button on Home).",
      "2. Enter the name, choose the customer (or create one right there with “+ New customer”) and the address.",
      "3. Under “More details” you can set start date, contract value, budget (materials, labor, subcontractors, other) and notes.",
      "If the project has a start date it appears in the Calendar.",
    ] },
    { id: "statuses", q: "What does each project status mean?", keywords: "lead quoted approved active hold completed cancelled", a: [
      "Lead (opportunity), Quoted (you already sent a proposal), Approved, Active (in progress), On hold, Completed and Cancelled. You can filter the list by status and change it when editing the project.",
    ] },
    { id: "project-control", q: "What is Project control?", keywords: "budget actual committed profit", a: [
      "It is the money summary inside each project (only for people allowed to view costs or profit):",
      "- Contract and budget.",
      "- Actual cost: what is already paid (expenses and completed purchase orders).",
      "- Committed: open purchase orders not yet paid. It becomes actual cost when you complete the PO.",
      "- Forecast cost and remaining budget.",
      "- Estimated profit. It warns when you are near or over budget.",
      "- Billed, collected and owed.",
      "These are operating numbers to decide with, not accounting.",
    ] },
    { id: "project-team", q: "How do I assign people to a project?", keywords: "assign team employees", a: [
      "Inside the project, under “Project team”, tap Assign next to the person (you must invite them first from Team). Employees only see projects they are assigned to. To remove them tap Remove.",
    ] },
    { id: "activity", q: "What is the project Activity?", keywords: "history timeline", a: [
      "A timeline of everything that happened: material lists, quote requests, supplier responses, purchase orders, proposals, customer responses, change orders and expenses.",
    ] },
    { id: "project-tools", q: "What shortcuts does a project have?", keywords: "tools takeoffs lists expenses", a: [
      "From the project you open: Material lists, Purchase orders, Proposals, Invoices, Expenses, Takeoffs and Calendar, already filtered to that project. You never choose the project again.",
    ] },
    { id: "edit-archive-project", q: "How do I edit or archive a project?", keywords: "edit archive delete", a: [
      "In the project tap Edit project to change details and status. Archive project removes it from active lists without deleting its history. Active projects count toward your plan limit.",
    ] },
  ] },
  { id: "customers", title: "Customers", blurb: "Your customers and what they owe you.", articles: [
    { id: "create-customer", q: "How do I add a customer?", keywords: "new customer contact", a: [
      "Customers → New customer. It asks for company or person name, contact, email, phone, address and notes; only the name is required.",
    ] },
    { id: "customer-card", q: "What do I see on a customer's page?", keywords: "customer detail owes", a: [
      "Their details, their projects, proposals and invoices, and how much they owe you. From there you create a project or a proposal with the customer already chosen.",
    ] },
    { id: "archive-customer", q: "How do I edit or archive a customer?", keywords: "edit archive", a: [
      "On their page tap Edit. Archive customer marks them inactive; their projects and documents are kept. Employees only see customers of the projects they are assigned to.",
    ] },
  ] },
  { id: "materials", title: "Materials", blurb: "Library, material lists and team requests.", articles: [
    { id: "library", q: "What is the material library for?", keywords: "library items nicknames favorites", a: [
      "It is your own catalog of items you order often. Each item has description, part number, manufacturer, unit, category, notes and field nicknames (for example “romex” or “mud ring”) so you find it the way you say it on site. You can mark favorites. It learns on its own: what you add to a list as free text can be saved to the library.",
      "BidPower also includes a standard catalog of more than 2,600 electrical materials (wire, conduit, fittings, boxes, devices, breakers, panels, lighting…): when you search in a material list it shows up tagged “Catalog”, and using it adds it to your library automatically. Search understands shorthand and run-together names: “thhn8blk” finds “THHN/THWN-2 Copper #8 AWG Black Stranded”. In the library, searching also lets you tap “Add to my library”. To create your own: More → Material → Library → Add item. Archiving an item does not change earlier requests.",
    ] },
    { id: "price-history", q: "Can I see a material's price history?", keywords: "price history lowest", a: [
      "Yes. Open an item to see what you paid (purchase orders) and what you were quoted, with the recent lowest price and the vendor. Only people allowed to view costs see it.",
    ] },
    { id: "import", q: "How do I import my list from Excel?", keywords: "import excel csv template xlsx", a: [
      "1. In the library tap “Import list (Excel or CSV)”.",
      "2. Download the template (columns: description, part number, manufacturer, unit, category and nicknames) or use your file, or paste the rows from Excel.",
      "3. Check the preview (“N materials ready to import”) and tap Import.",
      "Maximum 2000 rows per import. Existing ones are skipped by part number and rows without a description are ignored. Old .xls files cannot be read: in Excel use Save as .xlsx or CSV.",
    ] },
    { id: "build-list", q: "How do I build a material list for a project?", keywords: "material list request cart", a: [
      "1. Material → choose the project (or enter from the project → New material list).",
      "2. Search for an item (for example “thhn 8 red x 500”: the quantity is detected automatically) and tap Add to list. There are also Favorites, Recent and Saved lists.",
      "3. If it does not exist, add it as free text; tick “Save new items to the library” to reuse it.",
      "4. You can also Paste list: paste from WhatsApp, email or Excel, one item per line (for example “20 x EMT 3/4”).",
      "5. Tick “Allow substitution” if equivalents are fine, add notes and tap Send request.",
      "You can save the list under a name to reuse it on another project.",
    ] },
    { id: "next-step", q: "I have the list, what now?", keywords: "buy now quote next step", a: [
      "When you review a list, BidPower asks what you want to do:",
      "- Buy now: you already know where to buy. Choose the supplier (or type another), the estimated amount and the purchase order is created with the list's lines.",
      "- Request quotes from suppliers: compare prices from several and buy from the best.",
      "The project and materials are never retyped.",
    ] },
    { id: "review-request", q: "My employee requested material, how do I review it?", keywords: "review send back request employee", a: [
      "It appears under Needs attention and in Material → Material lists. Open it and choose Mark as reviewed (with an optional note) or Send back. Then you decide whether to buy or request quotes. An employee can cancel their own request while it is unreviewed.",
    ] },
  ] },
  { id: "quotes", title: "Supplier quote requests", blurb: "Ask for prices, compare and award.", articles: [
    { id: "request-quotes", q: "How do I request quotes from my suppliers?", keywords: "pricing request bid date", a: [
      "A quote request always starts from a material list (if you have none, BidPower takes you to create one).",
      "1. Quote requests → Request quote, or “Request quotes from suppliers” from the list.",
      "2. Choose the list. The materials and project come from it.",
      "3. Set “Respond before” (Bid Date), whether it is delivery to site or pickup, and the specifications.",
      "4. Under “More options” you can set a title, type (Gear, Lighting, Material or Other) and links to plans or specs. You can upload files (plans, PDFs).",
    ] },
    { id: "quote-steps", q: "What are the steps of a quote request?", keywords: "steps status flow", a: [
      "Four steps you see at the top of the request: 1 · What you ask for, 2 · Who you ask, 3 · Responses and 4 · Decide.",
    ] },
    { id: "send-supplier", q: "How do I send it to the supplier?", keywords: "secure link supply account send email", a: [
      "In step 2 you choose the supplier and contact:",
      "- If the supplier has a connected Supply account (“Supply account” badge), tap “Send to their Supply account”: they will see it in their inbox.",
      "- Otherwise, “Create secure link”: set the validity days, copy the link and send it by WhatsApp or email. The link is shown only once; if you lose it, revoke it and create another.",
      "BidPower does not send emails for you yet: you share the link or use “Copy text to send”, then tap “Mark as sent”. You see whether the link was opened, when it expires, and you can Revoke it.",
    ] },
    { id: "record-response", q: "The supplier answered, how do I record their price?", keywords: "response quote total pdf record", a: [
      "If they answered through the link or their account, the response shows up on its own. If they sent it another way tap Record response: enter supplier, quote number, total, availability, lead time, freight and tax, and attach the PDF. If you only have the total, enter just the total; line detail is optional.",
      "Prices are only visible to people allowed to view costs.",
    ] },
    { id: "supplier-questions", q: "The supplier asked me a question", keywords: "questions answer", a: [
      "It appears under “Supplier questions” inside the request and in Needs attention. Tap Answer and the supplier gets your reply on their link or inbox.",
    ] },
    { id: "award", q: "How do I compare and pick the winner?", keywords: "award best price compare", a: [
      "In step 3 you see all the responses, with a “Best price” tag. Tap Award on the chosen one: the others are declined. Then tap “Create purchase order” and it is generated from that response. If the order already exists it shows “View PO-…”.",
    ] },
    { id: "close-cancel", q: "Can I close or cancel a quote request?", keywords: "close cancel", a: [
      "Yes: Close marks the request as finished and Cancel voids it. Links already sent follow the request's status.",
    ] },
  ] },
  { id: "purchasing", title: "Purchase orders", blurb: "Buy, receive and close with the receipt.", articles: [
    { id: "create-po", q: "How do I create a purchase order (PO)?", keywords: "po purchase order create", a: [
      "There are two paths: “Buy now” from a material list, or “Create purchase order” from an awarded quote response. You can also go to Purchase orders → New. It carries the supplier, the project, the lines and the estimated amount, and numbers itself (PO-…).",
    ] },
    { id: "po-statuses", q: "What do the order statuses mean?", keywords: "statuses po sent received completed", a: [
      "Awaiting approval (above the creator's limit), Approved, Rejected, Sent (you sent it to the supplier), Received, No document (receipt missing), Document received, In review, Completed and Cancelled. In the list you can filter Awaiting approval, In progress or Completed.",
    ] },
    { id: "limit-approval", q: "My PO is “awaiting approval”, why?", keywords: "limit approve reject employee permission", a: [
      "The Owner decides whether you can buy and up to what amount. If the PO is above your limit it stays “Awaiting approval” and the Owner or a Manager Approves or Rejects it (optional note). An unknown amount never skips the limit.",
    ] },
    { id: "send-receive", q: "How do I mark it as sent and as arrived?", keywords: "sent received expected delivery partial", a: [
      "Tap “Mark as sent to supplier” when you send it. You can set the Expected delivery: if it runs late, we warn you on Home. When the order arrives use “All arrived” or “Save received” to enter the quantity received for each line (partial receipts: “Received 3 of 5”).",
    ] },
    { id: "po-receipt", q: "How do I close the PO with the receipt?", keywords: "receipt photo complete document packing slip", a: [
      "1. On the PO tap the camera (“Take receipt photo”) or choose a photo/file. It can be a receipt, invoice or packing slip.",
      "2. Enter the actual cost and the tax included shown on the document.",
      "3. Tap Complete PO.",
      "Without a document it cannot be completed. On completing, the actual cost is recorded as a project expense and stops being “committed”. PDF, JPG, PNG and WebP (including iPhone photos) up to 10 MB are accepted.",
    ] },
    { id: "cancel-po", q: "Can I cancel an order?", keywords: "cancel po history", a: [
      "Yes, with Cancel PO while it is not completed. The order's History keeps every status change and who made it.",
    ] },
  ] },
  { id: "expenses", title: "Expenses and receipts", blurb: "Record expenses and approve them.", articles: [
    { id: "new-expense", q: "How do I record an expense?", keywords: "expense new photo receipt category", a: [
      "Expenses → New expense (or the + button on Home). Choose project (or “No project”), vendor, category, amount, date, notes and the photo or file of the receipt, invoice or packing slip.",
    ] },
    { id: "approve-expense", q: "An employee's expense is “awaiting approval”", keywords: "approve reject expense pending", a: [
      "That is normal: an employee's expense stays pending until the Owner or a Manager approves it, and until then it does not count as project cost. Its creator can fix or cancel it while it is pending.",
    ] },
    { id: "categories", q: "How do I manage expense categories?", keywords: "categories settings", a: [
      "More → Settings → Expense categories (Owner only). Create your own and turn system ones on or off.",
    ] },
    { id: "receipt-rule", q: "Why can't an employee buy again?", keywords: "receipt required block", a: [
      "Every employee purchase requires uploading the receipt photo. While they have receipts pending they cannot create another purchase. Once they upload it, they can buy again. The Owner sees on Home who has overdue receipts.",
    ] },
  ] },
  { id: "proposals", title: "Proposals and changes", blurb: "What you send to the customer for approval.", articles: [
    { id: "create-proposal", q: "How do I create a proposal?", keywords: "proposal new lines tax", a: [
      "1. Proposals → New proposal (or from the project or the customer).",
      "2. Choose customer and project, and the tax %.",
      "3. Under Line items add articles: typing in description suggests items from your library; set part number, unit (each, ft, box, roll, hour, lot), quantity and price. You can add notes per line.",
      "4. Add terms and notes, and save. The total is calculated for you.",
    ] },
    { id: "send-proposal", q: "How do I send it to the customer?", keywords: "customer link send copy", a: [
      "On the proposal tap “Create link and send”, enter the customer's name (and email, optional), copy the link and send it by WhatsApp or email. The customer needs no account. The link is shown only once; if it is lost, revoke it and create another. Under “Customer links” you see whether they opened it.",
    ] },
    { id: "customer-responds", q: "How does my customer approve or ask for changes?", keywords: "approve sign changes", a: [
      "They open the link, review the proposal and approve it by typing their name, or ask for changes with a message. You see the response on the proposal and in Needs attention. Approval stores name, date, time and IP: it is not a handwritten or certified electronic signature.",
      "The customer only sees line items, tax and total: never costs, margins or suppliers.",
    ] },
    { id: "versions", q: "I already sent it and want to change it", keywords: "version new edit locked", a: [
      "A sent proposal is not edited. Tap “New version”: an editable copy is created and the current one is replaced (its links stop working). You see the versions under “Versions”.",
    ] },
    { id: "manual-decision", q: "The customer approved by phone or in person", keywords: "manual decision approve outside", a: [
      "Use “Record manual decision” → “The customer approved outside the app” (or rejected). It is saved as a manual decision, without a customer link.",
    ] },
    { id: "change-orders", q: "What are Change Requests and Change Orders?", keywords: "changes change order extra credit", a: [
      "If the customer asks for changes through the link, it appears under “Changes requested by the customer”. From there you can Decline it or Create Change Order.",
      "A Change Order has a title, description and lines; a negative price is a credit. When approved, the difference is added to the project's contract value.",
    ] },
    { id: "margin", q: "Where do I see an approved proposal's margin?", keywords: "margin profit", a: [
      "On the approved proposal, the “Project margin” card compares the contract against actual cost plus committed. Only people allowed to view profit see it.",
    ] },
  ] },
  { id: "invoices", title: "Invoices and collections", blurb: "Invoice, record payments and statuses.", articles: [
    { id: "invoice-from-proposal", q: "How do I issue an invoice from a proposal?", keywords: "invoice deposit percentage", a: [
      "1. On an approved proposal, Billing card → Create invoice.",
      "2. Choose how much to bill: everything, a percentage (for example a 30% deposit) or “What is left”.",
      "3. Check the due date and notes, and save as a draft.",
      "The card shows “Billed X of Y”; when everything is billed it says the proposal is fully invoiced.",
    ] },
    { id: "manual-invoice", q: "Can I make an invoice without a proposal?", keywords: "invoice manual new", a: [
      "Yes: Invoices → New invoice. Choose customer, due date, description and amount. The number is suggested for you and never repeats.",
    ] },
    { id: "invoice-statuses", q: "What do the invoice statuses mean?", keywords: "draft sent partial paid overdue", a: [
      "Draft, Sent, Partial payment, Paid, Overdue (past its date without being paid in full) and Cancelled. The status updates itself from the payments and due date.",
    ] },
    { id: "record-payment", q: "My customer paid me, how do I record it?", keywords: "payment record collect", a: [
      "Open the invoice, tap Record manual payment, enter the amount and confirm; or “Mark as paid” if they paid everything. The balance recalculates on its own. BidPower does not charge your customer or process cards: the money moves outside and you record it.",
    ] },
    { id: "invoice-pdf", q: "How do I send the invoice?", keywords: "pdf print send", a: [
      "The invoice has a PDF with your company's logo and details. Download it and send it by email or WhatsApp, then tap “Mark as sent”. A cancelled invoice cannot be undone; it can only be cancelled if it has no payments.",
    ] },
  ] },
  { id: "reports", title: "Reports and accounting", blurb: "Business numbers and export.", articles: [
    { id: "reports", q: "What do the Reports show?", keywords: "reports sales expenses profit conversion", a: [
      "Contracted sales, approved proposals, expenses, estimated profit, pending and overdue invoices, projects by status and proposal conversion (total, approved, pending). Only for Owner and Manager, and they can be exported.",
    ] },
    { id: "export", q: "How do I export data for my accountant or QuickBooks?", keywords: "accounting export csv json quickbooks", a: [
      "More → Accounting (Owner or Manager). Choose the data to export, the format (CSV or JSON; all together only as JSON), the date range and optionally a project, and tap Download. Only approved and reimbursed expenses are exported.",
      "BidPower is not accounting software and does not sync directly with QuickBooks yet. Below you see the export history.",
    ] },
  ] },
  { id: "team", title: "Team and permissions", blurb: "Invite people and decide what they can do.", articles: [
    { id: "invite", q: "How do I invite an employee or manager?", keywords: "invitation team employee", a: [
      "1. Team → Invite employee.",
      "2. Enter full name and email, and choose the template (Basic employee, Employee with purchasing or Manager) and the projects.",
      "3. Copy the link or share it by WhatsApp. It is single-use, expires in 7 days and is shown only once. The person must sign up with that same email.",
      "Under “Pending invitations” you can Revoke. The Free plan allows up to 3 employees.",
    ] },
    { id: "templates", q: "What does each template include?", keywords: "template basic purchasing manager", a: [
      "- Basic employee: requests material and uploads receipts and documents. Does not buy.",
      "- Employee with purchasing: the above, plus creating purchase orders up to $500 without approval (you can change the limit).",
      "- Manager: manages projects, purchases, quote requests, proposals and the library; sees costs but not profit unless you allow it.",
    ] },
    { id: "permissions", q: "What individual permissions exist?", keywords: "permissions request material upload documents library po send costs profit", a: [
      "On each person's page (Team → person → Permissions) you turn on or off: request material, upload documents, manage the library, create quote requests, create PO, send PO, view costs, view profit and create proposals, plus the PO limit (empty = no limit). Save with “Save changes”. They apply instantly and you can remove them any time.",
    ] },
    { id: "deactivate", q: "Someone left the company", keywords: "deactivate reactivate", a: [
      "On their page tap “Deactivate access”: they lose access immediately and their history is kept. You can reactivate them later.",
    ] },
  ] },
  { id: "suppliers", title: "Suppliers (for contractors)", blurb: "Your supply houses and connecting with them.", articles: [
    { id: "add-supplier", q: "How do I add a supplier?", keywords: "supplier vendor contact", a: [
      "Suppliers → Add supplier: company name and a contact (name, email, phone). You can have several contacts and mark one as Primary. If the email looks shared (sales@, info@) we warn you because anyone at that company can read it.",
    ] },
    { id: "connect-supply", q: "How do I connect with a supplier that uses BidPower?", keywords: "code connect supply account", a: [
      "Ask them for the connection code, go to Suppliers → “Connect with a code”, enter it and choose to link it to an existing supplier or create a new one. It shows “Connected” and you send quote requests inside the app. You can Disconnect any time; what was already sent is kept.",
    ] },
  ] },
  { id: "supply", title: "Supply account", blurb: "For supply houses that receive requests.", articles: [
    { id: "supply-inbox", q: "I'm a supplier: where do I see the requests?", keywords: "inbox requests", a: [
      "In Inbox you see the quote requests contractors sent you, with To quote and Quoted filters, the Bid Date and whether it is due today or tomorrow. Opening one shows the items, plans, links, specifications and notes.",
    ] },
    { id: "supply-respond", q: "How do I answer a request?", keywords: "respond quote pdf total availability", a: [
      "Enter your quote number, total, availability and lead time, or detail it per line, and upload your quote PDF. If something is unclear, ask a question first. You can see whether you were Awarded or Not awarded. If you use a link (no account) it works the same way.",
      "You never see what the contractor charges their customer, nor their project beyond what they sent you.",
    ] },
    { id: "supply-contractors", q: "How do I connect my contractors?", keywords: "connection code contractors", a: [
      "Under Contractors generate a “Connection code” (single-use, expires in 14 days, with an optional note such as the contractor's name) and share it, or share the sign-up link. You see how many requests, quotes and awards you have with each one and can Revoke the connection.",
    ] },
  ] },
  { id: "takeoffs", title: "Takeoffs", blurb: "Counts and preliminary material estimates.", articles: [
    { id: "what-is-takeoff", q: "What is a Takeoff and how does it work?", keywords: "takeoff plans counts panels feeders preliminary", a: [
      "Inside a project, Takeoffs lets you record what you count and measure: counts (lighting, devices, gear, other), panels and circuits, and feeders (length, conductor size, conduit, waste %). From that it builds a preliminary material list.",
      "Everything is PRELIMINARY: BidPower does not read the plans or run automatic analysis; you count. You can upload the plans as reference and mark the takeoff as Verified (if you change a number it goes back to unverified).",
    ] },
  ] },
  { id: "settings", title: "Settings and plan", blurb: "Company details, logo, plan and feedback.", articles: [
    { id: "company-data", q: "How do I change my company details and logo?", keywords: "company logo currency time zone", a: [
      "More → Settings → Company details (Owner only): name, phone, currency, email, address, logo (PNG, JPG or WebP, max 5 MB) and time zone. They appear on your proposals, purchase orders and invoices. The time zone defines what “today” is for due dates and reminders.",
    ] },
    { id: "plan", q: "What does my plan include?", keywords: "plan free pro limits", a: [
      "The Free plan includes up to 3 active projects, 3 employees, 3 proposals per month, 50 expenses per month and 20 purchase orders per month. When you reach a limit the app tells you. You see your plan in Settings → Plan and billing.",
    ] },
    { id: "feedback", q: "How do I send feedback or report a problem?", keywords: "feedback help comments error", a: [
      "More → Help & feedback. Write what you were doing and what you saw; the page you were on is saved and you see your earlier messages.",
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
      "Close and reopen the app or reload the page. If it continues, tell us in More → Help & feedback what you were doing.",
    ] },
  ] },
];
