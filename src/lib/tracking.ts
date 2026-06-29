import { supabase } from './supabase'

export type DeliveryStatus =
  | 'label_created'
  | 'on_the_way'
  | 'out_for_delivery'
  | 'access_point'
  | 'delivered'
  | 'exception'

export interface CustomerOrder {
  id: string
  order_number: string | null
  created_at: string
  status: string
  fulfillment_status: string
  ship_name: string | null
  ship_city: string | null
  ship_country: string | null
}

export interface CustomerShipment {
  id: string
  order_id: string
  carrier: string | null
  tracking_number: string | null
  tracking_url: string | null
  status: DeliveryStatus
  status_detail: string | null
  last_location: string | null
  estimated_delivery_at: string | null
  shipped_at: string | null
  delivered_at: string | null
  updated_at: string
}

export interface TrackingEvent {
  id: string
  shipment_id: string
  status: DeliveryStatus
  description: string | null
  location: string | null
  event_at: string
}

export interface CustomerDelivery {
  order: CustomerOrder
  shipment: CustomerShipment | null
  events: TrackingEvent[]
}

export async function fetchMyDeliveries(userId: string): Promise<CustomerDelivery[]> {
  const { data: ordersData, error: ordersError } = await supabase
    .from('orders')
    .select('id, order_number, created_at, status, fulfillment_status, ship_name, ship_city, ship_country')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (ordersError) throw ordersError
  const orders = (ordersData ?? []) as CustomerOrder[]
  if (orders.length === 0) return []

  const orderIds = orders.map((order) => order.id)
  const { data: shipmentsData, error: shipmentsError } = await supabase
    .from('shipments')
    .select('id, order_id, carrier, tracking_number, tracking_url, status, status_detail, last_location, estimated_delivery_at, shipped_at, delivered_at, updated_at')
    .in('order_id', orderIds)
    .order('updated_at', { ascending: false })
  if (shipmentsError) throw shipmentsError

  const shipments = (shipmentsData ?? []) as CustomerShipment[]
  const shipmentIds = shipments.map((shipment) => shipment.id)
  let events: TrackingEvent[] = []
  if (shipmentIds.length > 0) {
    const { data, error } = await supabase
      .from('tracking_events')
      .select('id, shipment_id, status, description, location, event_at')
      .in('shipment_id', shipmentIds)
      .order('event_at', { ascending: false })
    if (error) throw error
    events = (data ?? []) as TrackingEvent[]
  }

  return orders.map((order) => {
    const shipment = shipments.find((item) => item.order_id === order.id) ?? null
    return {
      order,
      shipment,
      events: shipment ? events.filter((event) => event.shipment_id === shipment.id) : [],
    }
  })
}

export function upsTrackingUrl(trackingNumber: string) {
  return `https://www.ups.com/track?tracknum=${encodeURIComponent(trackingNumber)}`
}
