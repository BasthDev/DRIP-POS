import { supabase } from '@/lib/supabase';
import { OrderValidator } from '@/validators/orderValidator';

export interface CartItemForCheckout {
  product_id: string;
  product_name: string;
  unit_price: number;
  quantity: number;
  notes?: string;
}

export const PosController = {
  /**
   * Generate receipt number: DRIP-YYYYMMDD-HHMMSS-RANDOM
   */
  generateReceiptNumber(): string {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const date = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
    const time = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `DRIP-${date}-${time}-${rand}`;
  },

  /**
   * Execute atomic POS checkout via database procedure
   */
  async processCheckout(params: {
    organizationId: string;
    storeId: string;
    warehouseId: string;
    items: CartItemForCheckout[];
    paymentMethod: 'cash' | 'qris' | 'card' | 'bank';
    grandTotal: number;
    tenderedAmount: number;
    discount?: number;
    tax?: number;
  }) {
    // 1. Validate checkout inputs
    const val = OrderValidator.validateCheckout({
      itemsCount: params.items.length,
      grandTotal: params.grandTotal,
      paymentMethod: params.paymentMethod,
      tenderedAmount: params.tenderedAmount,
    });
    if (!val.isValid) return { data: null, error: new Error(val.errors.join('\n')) };

    // 2. Execute atomic sale procedure on database
    try {
      const receiptNumber = this.generateReceiptNumber();

      const itemsPayload = params.items.map((it) => ({
        product_id: it.product_id,
        product_name: it.product_name,
        unit_price: it.unit_price,
        quantity: it.quantity,
        notes: it.notes || null,
      }));

      const { data, error } = await supabase.rpc('process_pos_sale', {
        p_organization_id: params.organizationId,
        p_store_id: params.storeId,
        p_warehouse_id: params.warehouseId,
        p_receipt_number: receiptNumber,
        p_items: itemsPayload,
        p_payment_method: params.paymentMethod,
        p_amount: params.grandTotal,
        p_tendered: params.tenderedAmount,
        p_discount: params.discount || 0,
        p_tax: params.tax || 0,
      });

      if (error) return { data: null, error };
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err };
    }
  },

  async fetchSales(orgId: string, storeId: string, limit: number = 50) {
    return await supabase
      .from('sales')
      .select('*')
      .eq('organization_id', orgId)
      .eq('store_id', storeId)
      .order('created_at', { ascending: false })
      .limit(limit);
  },

  async fetchSaleDetail(saleId: string) {
    const [saleRes, itemsRes, paymentsRes] = await Promise.all([
      supabase.from('sales').select('*').eq('id', saleId).single(),
      supabase.from('sale_items').select('*').eq('sale_id', saleId),
      supabase.from('sale_payments').select('*').eq('sale_id', saleId),
    ]);

    return {
      sale: saleRes.data,
      items: itemsRes.data || [],
      payments: paymentsRes.data || [],
      error: saleRes.error || itemsRes.error || paymentsRes.error,
    };
  },
};
