import { siteConfig } from "@/config/site";

const { shipping, contact } = siteConfig;

export interface FaqItem {
  q: string;
  a: string;
}

export const faqs: { title: string; items: FaqItem[] }[] = [
  {
    title: "Ordering",
    items: [
      {
        q: "How do I place an order?",
        a: "Add your favourites to the cart, head to checkout and fill in your details. Online payment is coming soon — for now, tap “Order via WhatsApp” and we will confirm availability, the final total and payment details with you.",
      },
      {
        q: "Can I pay online?",
        a: "Not yet! Online payment (UPI and cards) is coming soon. Until then we confirm every order personally on WhatsApp.",
      },
      {
        q: "Can I personalise a product?",
        a: "Yes! Products marked “Customisable”, like the Alphabet Bead Bracelet, let you choose letters, colours and sizes right on the product page.",
      },
      {
        q: "How do coupon codes work?",
        a: "Enter your code in the cart. If it is valid for your order you will see the discount straight away. Final prices are confirmed with your order.",
      },
    ],
  },
  {
    title: "Products",
    items: [
      {
        q: "Are the products really handmade?",
        a: "Yes. The Hi 5 by Jia collection is handmade, so tiny differences in colour or bead placement make each piece one of a kind.",
      },
      {
        q: "Which size should I choose?",
        a: "Our bracelets come in approximate Kids (15 cm), Teens (16.5 cm) and Adults (18 cm) sizes. Measure around your wrist and add about 1 cm for comfort. Not sure? Add a note and we will help.",
      },
      {
        q: "Are the products suitable for young children?",
        a: "Our accessories contain small beads and parts and are not suitable for children under 3 years. Younger kids should wear them with adult supervision.",
      },
      {
        q: "How do I care for my bracelet?",
        a: "Keep it away from water, perfume and lotions, roll it on instead of stretching it, and store it in its pouch.",
      },
    ],
  },
  {
    title: "Shipping & returns",
    items: [
      {
        q: "Do you ship across India?",
        a: `Yes, we plan to ship across India. Orders are usually dispatched in ${shipping.dispatchTime}. Shipping costs are confirmed with your order.`,
      },
      {
        q: "Is shipping free?",
        a: `Orders of ₹${shipping.freeShippingThreshold} or more get free standard shipping. Below that, standard shipping is estimated at ₹${shipping.standardRate}.`,
      },
      {
        q: "What if something arrives damaged?",
        a: `So sorry! Email ${contact.email} within 48 hours of delivery with a photo and we will make it right.`,
      },
    ],
  },
  {
    title: "About Hi 5 by Jia",
    items: [
      {
        q: "Who is behind Hi 5 by Jia?",
        a: "Hi 5 by Jia was started by Jia (Nainu at home), a young creator who loves arts & crafts. Her family helps with orders, packing and shipping.",
      },
      {
        q: "Can I collaborate with Hi 5 by Jia?",
        a: `We are exploring collaborations with young creators. Please email ${contact.email}. For creators under 18, a parent or guardian must be involved.`,
      },
    ],
  },
];

export interface PolicySection {
  heading: string;
  body: string[];
}

export const shippingPolicy: PolicySection[] = [
  {
    heading: "Where we ship",
    body: ["We plan to ship across India. If you are outside India, please email us before ordering."],
  },
  {
    heading: "Shipping costs",
    body: [
      `Standard shipping is estimated at ₹${shipping.standardRate} per order.`,
      `Orders of ₹${shipping.freeShippingThreshold} or more get free standard shipping.`,
      "Your exact shipping cost is confirmed when we confirm your order on WhatsApp.",
    ],
  },
  {
    heading: "Processing & delivery times",
    body: [
      `Ready-made items are usually dispatched in ${shipping.dispatchTime}. Personalised items may take a little longer because each one is made to order.`,
      `Delivery usually takes ${shipping.deliveryTime}, depending on your location.`,
    ],
  },
  {
    heading: "Tracking",
    body: ["Where available, we will share tracking details with you once your order is dispatched."],
  },
];

export const returnsPolicy: PolicySection[] = [
  {
    heading: "Damaged or incorrect items",
    body: [
      `If your order arrives damaged or incorrect, email ${contact.email} within 48 hours of delivery with your order reference and a photo. We will offer a replacement or refund.`,
    ],
  },
  {
    heading: "Returns",
    body: [
      "Because our products are handmade and low-cost, we generally cannot accept returns for change of mind.",
      "Personalised items (like Alphabet bracelets) are made just for you and cannot be returned unless they arrive damaged or incorrect.",
    ],
  },
  {
    heading: "Cancellations",
    body: [
      "You can cancel an order any time before it is dispatched — just message us on WhatsApp or email us.",
    ],
  },
];

export const privacyPolicy: PolicySection[] = [
  {
    heading: "What we collect",
    body: [
      "When you place an order request, we collect the details you enter at checkout (name, mobile number, email, delivery address) so we can confirm and deliver your order.",
      "If you sign up for “Notify me”, we keep your email address so we can tell you when the product is available.",
      "If you submit a review, we collect your name, rating and review text. Reviews are only published after approval.",
    ],
  },
  {
    heading: "What is stored on your device",
    body: [
      "Your cart, saved-for-later items and wishlist are stored in your own browser (local storage) so they survive a page refresh. You can clear them at any time by clearing your browser data.",
    ],
  },
  {
    heading: "How we use your information",
    body: [
      "Only to process your orders, answer your messages and send updates you asked for. We never sell your data.",
      "If analytics are enabled, we may use privacy-friendly analytics tools to understand how the website is used.",
    ],
  },
  {
    heading: "Children’s privacy",
    body: [
      "Hi 5 by Jia is run by a young creator with her family. We do not publish personal details of any minor.",
      "Customers under 18 should place orders with the help of a parent or guardian.",
    ],
  },
  {
    heading: "Contact",
    body: [`Questions about your data? Email ${contact.email}.`],
  },
];

export const termsOfService: PolicySection[] = [
  {
    heading: "About these terms",
    body: [
      "By using hifivebyjia.in you agree to these terms. Hi 5 by Jia is a small handmade brand run by a young creator with her family.",
    ],
  },
  {
    heading: "Orders & pricing",
    body: [
      "All prices are in Indian Rupees (₹). Submitting an order request through the website or WhatsApp does not form a contract until we confirm the order, availability and final total.",
      "Discounts and coupons are subject to their stated conditions and may be changed or withdrawn at any time.",
      "Taxes (if applicable) and shipping are confirmed with your order.",
    ],
  },
  {
    heading: "Handmade products",
    body: [
      "Our products are handmade, so slight variations in colour, size and bead placement are normal. Product images on the website may be illustrations and are for reference only.",
      "Products contain small parts and are not suitable for children under 3.",
    ],
  },
  {
    heading: "Reviews & content",
    body: [
      "Reviews are moderated and only published after approval. We may decline reviews that are abusive, off-topic or contain personal information.",
      "All website content, including the Hi 5 by Jia logo and name, belongs to Hi 5 by Jia.",
    ],
  },
  {
    heading: "Contact",
    body: [`Questions? Email ${contact.email}.`],
  },
];
