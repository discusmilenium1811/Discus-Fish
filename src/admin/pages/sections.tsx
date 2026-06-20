import { SectionPage } from '../components/SectionPage'

// Each section's interactive UI lands in a later phase; the DB is already live.

export const ProductsPage = () => (
  <SectionPage
    icon="🐟"
    title="Products"
    description="Create and edit the fish foods and preparations you sell."
    capabilities={[
      'Add new products (name, description, details)',
      'Set price and a compare-at price for sales / price ranges',
      'Upload and order product pictures (gallery)',
      'Assign a category and SKU',
      'Set weight, stock and low-stock threshold',
      'Activate / deactivate products in the store',
    ]}
  />
)

export const CategoriesPage = () => (
  <SectionPage
    icon="🗂️"
    title="Categories"
    description="Organise products into shoppable categories."
    capabilities={[
      'Create and rename categories',
      'Set category image and description',
      'Reorder how categories appear',
      'Activate / hide categories',
    ]}
  />
)

export const InventoryPage = () => (
  <SectionPage
    icon="📦"
    title="Stock & Inventory"
    description="Track and adjust stock levels across all products."
    capabilities={[
      'See current stock for every product',
      'Low-stock and out-of-stock alerts',
      'Restock and manual corrections',
      'Full stock-movement history (audit log)',
    ]}
  />
)

export const ReviewsPage = () => (
  <SectionPage
    icon="💬"
    title="Comments & Reviews"
    description="Moderate customer comments left after their orders."
    capabilities={[
      'Approve or reject pending reviews',
      'See star ratings per product',
      'Only verified buyers can submit',
      'Remove inappropriate comments',
    ]}
  />
)

export const OrdersPage = () => (
  <SectionPage
    icon="🧾"
    title="Manage Orders"
    description="View and process every customer order."
    capabilities={[
      'Browse all orders with status filters',
      'See line items, totals, shipping & discounts',
      'Update fulfillment status',
      'Add internal notes',
      'Trigger invoice generation',
    ]}
  />
)

export const PaymentsPage = () => (
  <SectionPage
    icon="💳"
    title="Order Payments"
    description="Stripe payment records for each order."
    capabilities={[
      'See payment status (paid, failed, refunded)',
      'Match payments to orders',
      'Issue full or partial refunds via Stripe',
      'Reconcile Stripe payouts',
    ]}
  />
)

export const TrackingPage = () => (
  <SectionPage
    icon="🚚"
    title="Track Orders"
    description="Manage shipments and tracking for orders."
    capabilities={[
      'Add carrier and tracking number',
      'Share tracking links with customers',
      'Log tracking events / status updates',
      'Mark orders shipped and delivered',
    ]}
  />
)

export const InvoicesPage = () => (
  <SectionPage
    icon="📄"
    title="Invoices"
    description="Generate and manage order invoices."
    capabilities={[
      'Auto-numbered invoices (INV-1001…)',
      'Download / send invoice PDFs',
      'Per-order totals and tax breakdown',
      'Reissue or void invoices',
    ]}
  />
)

export const ReturnsPage = () => (
  <SectionPage
    icon="↩️"
    title="Returns"
    description="Handle return requests and refunds."
    capabilities={[
      'Review customer return requests',
      'Approve / reject with notes',
      'Track received items',
      'Issue refunds tied to payments',
    ]}
  />
)

export const CouponsPage = () => (
  <SectionPage
    icon="🏷️"
    title="Coupons"
    description="Discount codes customers enter at checkout."
    capabilities={[
      'Create percent or fixed-amount codes',
      'Set minimum order and expiry',
      'Limit total and per-customer redemptions',
      'Activate / deactivate codes',
    ]}
  />
)

export const OffersPage = () => (
  <SectionPage
    icon="✨"
    title="Offers"
    description="Automatic promotions on products or categories."
    capabilities={[
      'Run category-wide or product sales',
      'Schedule start / end dates',
      'Add promotional banner images',
      'Combine with price ranges',
    ]}
  />
)

export const GiftCardsPage = () => (
  <SectionPage
    icon="🎁"
    title="Gift Cards"
    description="Issue and manage store gift cards."
    capabilities={[
      'Generate gift card codes with a balance',
      'Track remaining balance and usage',
      'Disable or expire cards',
      'Redeem at checkout',
    ]}
  />
)

export const ShippingPage = () => (
  <SectionPage
    icon="🌍"
    title="Shipping & Free Shipping"
    description="Configure shipping zones, methods and free-shipping rules."
    capabilities={[
      'Define shipping zones by country',
      'Add methods (Standard, Express) with prices',
      'Set free-shipping thresholds (e.g. free over €35)',
      'Set delivery time estimates',
    ]}
  />
)
