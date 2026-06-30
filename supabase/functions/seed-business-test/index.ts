import Stripe from 'npm:stripe@17'
import { createClient } from 'npm:@supabase/supabase-js@2'

const stripeKey = Deno.env.get('STRIPE_SECRET_KEY') ?? ''
const stripe = new Stripe(stripeKey)
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

const EMAIL = 'discusmilenium@outlook.com'
const USER_ID = '76d427ca-5f08-43b0-9f1d-4a629168a600'
const PRODUCT_ID = 'e52eca6e-9d6b-45dd-bb77-77de237672bc'
const SEED_KEY = 'business-invoice-demo-v1'

const business = {
  company: 'BlueWave Aquatics Ltd',
  vatNumber: 'CY12345678X',
  registrationNumber: 'HE 458921',
  contactName: 'Andreas Nikolaou',
  phone: '+357 99 456789',
  address1: '28 Coral Bay Avenue',
  address2: 'Office 4B',
  city: 'Limassol',
  state: 'Limassol',
  postalCode: '3105',
  country: 'CY',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)
  if (!stripeKey.startsWith('sk_test_')) {
    return json({ error: 'Safety stop: Stripe is not in test mode.' }, 412)
  }
  if (req.headers.get('x-seed-token') !== Deno.env.get('TEST_SEED_TOKEN')) {
    return json({ error: 'Unauthorized' }, 401)
  }

  try {
    const { data: existingOrder } = await supabase
      .from('orders')
      .select('id, order_number, stripe_session_id, stripe_payment_intent_id')
      .eq('admin_note', `seed:${SEED_KEY}`)
      .maybeSingle()
    if (existingOrder) {
      return json({ created: false, message: 'Seed already exists', order: existingOrder })
    }

    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(USER_ID)
    if (authError || authUser.user?.email?.toLowerCase() !== EMAIL) {
      throw new Error('Expected Supabase Auth user was not found.')
    }

    const userMetadata = {
      ...(authUser.user.user_metadata ?? {}),
      account_type: 'business',
      company_name: business.company,
      vat_number: business.vatNumber,
      registration_number: business.registrationNumber,
      contact_name: business.contactName,
      phone: business.phone,
      billing_email: EMAIL,
      address_line1: business.address1,
      address_line2: business.address2,
      city: business.city,
      state: business.state,
      postal_code: business.postalCode,
      country: business.country,
    }
    const { error: authUpdateError } = await supabase.auth.admin.updateUserById(USER_ID, {
      user_metadata: userMetadata,
    })
    if (authUpdateError) throw authUpdateError

    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        account_type: 'business',
        company_name: business.company,
        vat_number: business.vatNumber,
        registration_number: business.registrationNumber,
        contact_name: business.contactName,
        phone: business.phone,
        billing_email: EMAIL,
        address_line1: business.address1,
        address_line2: business.address2,
        city: business.city,
        state: business.state,
        postal_code: business.postalCode,
        country: business.country,
      })
      .eq('id', USER_ID)
    if (profileError) throw profileError

    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, name, price_cents, currency')
      .eq('id', PRODUCT_ID)
      .single()
    if (productError) throw productError

    const customers = await stripe.customers.list({ email: EMAIL, limit: 1 })
    const customer = customers.data[0]
      ? await stripe.customers.update(customers.data[0].id, customerData())
      : await stripe.customers.create(customerData(), {
          idempotencyKey: `${SEED_KEY}-customer`,
        })

    const attachedMethods = await stripe.paymentMethods.list({
      customer: customer.id,
      type: 'card',
      limit: 10,
    })
    let paymentMethod = attachedMethods.data.find(
      (method) => method.card?.brand === 'visa' && method.card?.last4 === '4242',
    )
    if (!paymentMethod) {
      paymentMethod = await stripe.paymentMethods.attach('pm_card_visa', {
        customer: customer.id,
      })
    }
    await stripe.customers.update(customer.id, {
      invoice_settings: { default_payment_method: paymentMethod.id },
    })

    await stripe.invoiceItems.create(
      {
        customer: customer.id,
        amount: product.price_cents,
        currency: product.currency,
        description: `${product.name} × 1`,
        metadata: { seed_key: SEED_KEY, product_id: product.id },
      },
      { idempotencyKey: `${SEED_KEY}-item` },
    )

    const draft = await stripe.invoices.create(
      {
        customer: customer.id,
        collection_method: 'charge_automatically',
        auto_advance: false,
        pending_invoice_items_behavior: 'include',
        default_payment_method: paymentMethod.id,
        description: 'DiscusFish business customer test order',
        custom_fields: [
          { name: 'Company', value: business.company },
          { name: 'VAT / Tax ID', value: business.vatNumber },
        ],
        metadata: { seed_key: SEED_KEY, user_id: USER_ID },
      },
      { idempotencyKey: `${SEED_KEY}-invoice` },
    )
    const finalized = await stripe.invoices.finalizeInvoice(
      draft.id,
      { auto_advance: false },
      { idempotencyKey: `${SEED_KEY}-finalize` },
    )
    const paid = await stripe.invoices.pay(
      finalized.id,
      { payment_method: paymentMethod.id },
      { idempotencyKey: `${SEED_KEY}-pay` },
    )
    if (paid.status !== 'paid') throw new Error(`Stripe invoice status is ${paid.status}.`)

    const invoice = await stripe.invoices.retrieve(paid.id, {
      expand: ['payment_intent.latest_charge'],
    })
    const invoiceWithPayment = invoice as Stripe.Invoice & {
      payment_intent?: string | Stripe.PaymentIntent | null
    }
    const intent =
      invoiceWithPayment.payment_intent && typeof invoiceWithPayment.payment_intent !== 'string'
        ? invoiceWithPayment.payment_intent
        : invoiceWithPayment.payment_intent
          ? await stripe.paymentIntents.retrieve(invoiceWithPayment.payment_intent, { expand: ['latest_charge'] })
          : null
    if (!intent) throw new Error('Stripe did not return the invoice PaymentIntent.')

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        stripe_session_id: `seed-invoice-${invoice.id}`,
        stripe_payment_intent_id: intent.id,
        email: EMAIL,
        amount_total_cents: invoice.amount_paid,
        currency: invoice.currency,
        status: 'paid',
        user_id: USER_ID,
        subtotal_cents: product.price_cents,
        shipping_cents: 0,
        discount_cents: 0,
        tax_cents: Math.round(product.price_cents - product.price_cents / 1.19),
        ship_name: business.contactName,
        ship_phone: business.phone,
        ship_address1: business.address1,
        ship_address2: business.address2,
        ship_city: business.city,
        ship_postal_code: business.postalCode,
        ship_country: business.country,
        billing_company: business.company,
        billing_vat_number: business.vatNumber,
        billing_registration_number: business.registrationNumber,
        billing_contact_name: business.contactName,
        billing_phone: business.phone,
        billing_email: EMAIL,
        billing_address1: business.address1,
        billing_address2: business.address2,
        billing_city: business.city,
        billing_state: business.state,
        billing_postal_code: business.postalCode,
        billing_country: business.country,
        admin_note: `seed:${SEED_KEY}`,
      })
      .select('id, order_number')
      .single()
    if (orderError) throw orderError

    const { error: itemError } = await supabase.from('order_items').insert({
      order_id: order.id,
      product_id: product.id,
      name: product.name,
      unit_price_cents: product.price_cents,
      quantity: 1,
    })
    if (itemError) throw itemError

    return json({
      created: true,
      testMode: !invoice.livemode,
      customerId: customer.id,
      invoiceId: invoice.id,
      paymentIntentId: intent.id,
      orderId: order.id,
      orderNumber: order.order_number,
      amountPaid: invoice.amount_paid,
      currency: invoice.currency,
      invoicePdf: invoice.invoice_pdf,
      hostedInvoiceUrl: invoice.hosted_invoice_url,
    })
  } catch (err) {
    console.error('[seed-business-test]', err)
    return json({ error: err instanceof Error ? err.message : 'Seed failed' }, 500)
  }
})

function customerData(): Stripe.CustomerUpdateParams & Stripe.CustomerCreateParams {
  return {
    email: EMAIL,
    name: business.company,
    phone: business.phone,
    preferred_locales: ['en'],
    address: {
      line1: business.address1,
      line2: business.address2,
      city: business.city,
      state: business.state,
      postal_code: business.postalCode,
      country: business.country,
    },
    shipping: {
      name: business.contactName,
      phone: business.phone,
      address: {
        line1: business.address1,
        line2: business.address2,
        city: business.city,
        state: business.state,
        postal_code: business.postalCode,
        country: business.country,
      },
    },
    metadata: { seed_key: SEED_KEY, supabase_user_id: USER_ID },
  }
}
