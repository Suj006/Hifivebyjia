# Hi Five by Jia — Admin guide

Everything about the shop is managed at **https://hifivebyjia.in/admin**.
Sign in with the admin password. Changes appear on the website **straight away** — no code, no redeploy.

Works on a phone or a computer.

---

## Dashboard

The home screen of the admin shows what needs attention:

- **New order requests** — orders waiting for you to confirm on WhatsApp
- **Reviews to check** — customer reviews waiting for approval
- **Unread messages** — from the Contact page
- **Low stock** — products with 3 or fewer left

Red number badges in the menu show the same counts.

---

## Products

**Products → Add product**

1. **Photos** – tap *Add photos* and pick photos from your phone or computer (up to 12).
   They’re resized automatically and never cropped. The first photo is the main one —
   use the ★ button to make another photo the main one, and the arrows to reorder.
2. **Basic details** – name (the web address fills itself in), a one-line short description
   for product cards, and the full description.
3. **Price & stock** – selling price; optionally an *original price* to show a discount
   (e.g. ₹90 → ₹70 shows “22% OFF”); and how many you have.
4. **Status**
   - **On sale** – visible and can be ordered
   - **Coming soon** – visible with “Notify me”; add a launch message/date
   - **Sold out** – visible with “Notify me”
   - **Hidden (draft)** / **Discontinued** – not shown on the website
5. **Where it appears** – category, who it’s for, collections, search tags, and badges
   (*Featured* shows it on the homepage, *New arrival*, *Bestseller*).
6. **Personalisation** – switch on to let customers choose a size, colour or letters.
   Use the ready-made buttons (*Size*, *Name / letters*, *Colour*, *Special instructions*)
   or add your own. Tick *Customer must fill this in* for required choices. You can add an
   extra price for an option.
7. Press **Create product**.

**Editing:** tap a product, change anything, press **Save changes**.
**Stock:** you can change stock right on the product list — type the number and tap ✓.
**Duplicate:** copies a product (as a hidden draft) — handy for similar designs.
**Delete:** removes it permanently. To keep it for later, set the status to *Hidden* instead.

---

## Coupons & offers

**Coupons & offers → New coupon**

| Setting | What it does |
| --- | --- |
| **Coupon code / Automatic offer** | A code customers type in the cart (e.g. `DIWALI15`), or an offer that applies to everyone by itself (a sale). |
| **Offer name** | Shown in the cart, e.g. “Diwali 15% off”. |
| **Discount type** | **Percentage** (e.g. 15%), **Fixed amount** (e.g. ₹50 off) or **Buy X, get Y** (e.g. buy 2, get 1 free — the cheapest items are discounted). |
| **Maximum discount (₹)** | The discount is never more than this. Example: 15% off, maximum ₹100. |
| **Minimum order (₹)** | Cart total needed before the code works. |
| **Starts / Ends** | Date and time in **India time**. Before the start the cart says “hasn’t started yet”; after the end, “this offer has ended”. Leave empty to start now / never end. |
| **Usage limit** | Maximum number of orders that can use it. The list shows “Used 3 / 50 times”. |
| **Applies to** | Whole order, or only certain categories, collections or products. |
| **First order only** | Only for customers who haven’t ordered before (checked by mobile number and email). |
| **Show as a hint in the cart** | Shows “Psst… try CODE” in the cart. Leave off for secret codes. |
| **Switched on** | Pause or resume anytime — also available as a switch on the coupon list. |

The coupon list shows each coupon’s status: **Active**, **Scheduled**, **Expired**,
**Switched off** or **Limit reached**.

Coupon codes are checked on the server, so secret codes can’t be found by looking at the website.

---

## Orders

When a customer checks out, they send the order to you on WhatsApp **and** it appears in **Orders**.
The total in admin is calculated by the server (prices, coupon and shipping), so it’s always correct.

Open an order to see the items (with sizes, letters, colours), the customer’s address and buttons to
**WhatsApp**, call or email them. Then update the status:

1. **New request** → confirm availability and payment details with the customer
2. **Confirmed** → **stock is reduced automatically**
3. **Paid** → **Packed** → **Shipped** → **Delivered** (ask for a review!)
4. **Cancelled** → stock is put back automatically

Use the **private note** for things like “Paid by UPI on 6 Oct” or a tracking number.

---

## Reviews

New reviews wait in **Reviews → Waiting for approval**. Nothing is published until you tap **Approve**.
Approved reviews appear on the product page with the star rating. **Feature on homepage** shows a review
in “Loved by Our Customers”. **Reject** hides it; **Delete** removes it.

---

## Notify-me list

People who tapped “Notify me” on coming-soon or sold-out products, plus newsletter and creator-collaboration
sign-ups, grouped by product. When a product is ready, use **Email everyone waiting (BCC)**, then
**Mark all as notified**. **Download CSV** exports the list.

---

## Messages

Messages from the Contact page. **Reply by email**, mark as read/unread, or delete.

---

## Collections

Edit the collections shown in “Shop by Collection”: name, emoji, tagline, colour, order (arrows) and
visibility (eye). **Add products automatically** includes products by category, audience or tag
(e.g. every product tagged `gift` goes into *Gifts*). **Add collection** creates a new one with its own page.

**Categories** (Bracelets, Keychains…) are edited below. A category can’t be removed while products use it.

---

## Settings

- **WhatsApp number** for orders (business number with country code, e.g. `919876543210`)
- **Shipping**: standard rate, free-shipping amount, dispatch and delivery times — used in the cart,
  FAQ and Shipping page

The admin password is set in Vercel (see `docs/DEPLOYMENT.md`).

---

## Tips

- Square, well-lit photos on a plain background look best.
- Use **Hidden (draft)** while you’re still preparing a product.
- Sign out on shared computers (**Sign out** at the bottom of the menu).
- Never share the admin password, and never use a child’s personal phone number for WhatsApp.
