# MealMate frontend (separated HTML, CSS and JavaScript)

Put `index.html`, `styles.css` and `app.js` in one folder, then open `index.html` in a modern browser. There is no build step. Google Fonts is optional; the CSS falls back to local fonts offline.

## Where the code lives

- `index.html`: all page layout, headings, navigation, table shells, authentication forms, profile forms and entry dialogs.
- `styles.css`: colors, typography, cards, tables, forms and responsive rules. The HTML contains no inline styles.
- `app.js`: sample records, per-mess account state, role permissions, form handling, live calculations, and DOM updates for data rows. It does not contain HTML template strings or replace the page layout with `innerHTML`.

## Try the account flows

- Sample Admin: `admin@mealmate.demo` / `Admin123!`
- Sample Member: `user@mealmate.demo` / `Member123!`
- Sample mess invite code: `MEAL-2026`
- **Create mess:** Create an Admin account and a new mess. A unique invite code is generated automatically.
- **Join mess:** A Member enters that invite code to join the matching mess.

Both roles can edit their name and photo and change their password after entering the current password. An Admin can approve expenses and deposits, manage members and promote an active Member to Admin. The last active Admin remains protected. Data from the previous single-mess browser demo migrates automatically.

**Demo limitation:** All accounts, passwords, images and data are stored locally in one browser. Different devices do not share records. For real multi-device accounts, add a server, database, password hashing and server-enforced permissions.

## Meal prices and monthly accounting

- Breakfast defaults to ৳60 (Admin can change it to ৳50 or another amount), lunch ৳120, and dinner ৳70. An Admin opens **Daily meals**, chooses a month, clicks **Unlock prices**, edits and saves the prices, then clicks **Lock prices** to fix them. New months start with the defaults and locked prices. Existing records from older versions are preserved; each month receives default prices until configured.
- Member food bill = recorded breakfasts × breakfast price + recorded lunches × lunch price + recorded dinners × dinner price. An edited price recalculates bills for the selected month. The displayed *average meal rate* = total meal charges ÷ total recorded meals; it is a summary average, not a separate flat charge for every meal.
- Approved food deposits − total meal charges = food deposit remaining. Each member's food balance = their approved deposits − their food bill. A negative balance means more is due. Only approved deposits enter this calculation.
- **Expenses** has Food & grocery, Electricity / current bill, Wi-Fi bill and Other expenses. Approved grocery purchase amounts are displayed as a separate purchase ledger: they are not added to the meal bill a second time. Electricity, Wi-Fi and other shared bills are listed separately and do not reduce the food deposit balance. Pending expense requests do not affect approved expense totals.

## Shopping duty updates

- Admin assigns a shopping duty to an active member and can see **Pending**, **Cannot do**, and **Completed** counts and each member's explanation.
- The assigned member can **Mark done** or select **Cannot do**, provide a reason, and send it to Admin. A member who becomes available again can choose **Back to pending** to resume the task.
- Admin can **Reassign** an unfinished task to a different active member and choose a new due date. The prior member's reason and reassignment history remain visible to Admin in that duty's row. Admin can reopen a completed duty when needed. Old saved duties still load with their previous Pending/Done states.
- As with other frontend demo data, updates are visible to different accounts using the same browser's storage; there is no cross-device delivery or push notification without a backend.
