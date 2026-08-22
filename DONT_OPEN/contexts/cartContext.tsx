import { validateSaleStock } from '@/lib/stockValidation';
import { supabase } from '@/lib/supabase';
import React, { createContext, useContext, useState } from 'react';
import { Product } from './catalogContext';
import { useInventory } from './inventoryContext';
import { useOrganization } from './organizationContext';
import { useStore } from './storeContext';

export interface CartItem {
  product: Product;
  quantity: number;
  notes?: string;
  unitPrice: number;
}

export interface CheckoutResult {
  success: boolean;
  saleId: string;
  receiptNumber: string;
  grandTotal: number;
  totalCogs: number;
  grossProfit: number;
  change: number;
}

interface CartContextType {
  items: CartItem[];
  subtotal: number;
  discount: number;
  tax: number;
  grandTotal: number;
  itemCount: number;
  addItem: (product: Product, quantity?: number) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  updateItemNotes: (productId: string, notes: string) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  setDiscountAmount: (discount: number) => void;
  processCheckout: (paymentMethod: 'cash' | 'qris' | 'card' | 'bank', tendered?: number) => Promise<{ data: CheckoutResult | null; error: any }>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentOrganization } = useOrganization();
  const { currentStore } = useStore();
  const { currentWarehouse, refreshInventory } = useInventory();

  const [items, setItems] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  const [tax, setTax] = useState<number>(0);

  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const grandTotal = Math.max(0, subtotal - discount + tax);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const addItem = (product: Product, quantity: number = 1) => {
    const existingIndex = items.findIndex((i) => i.product.id === product.id);
    const resolvedPrice = product.store_price ?? product.selling_price;

    if (existingIndex > -1) {
      const updated = [...items];
      updated[existingIndex].quantity += quantity;
      setItems(updated);
    } else {
      setItems([
        ...items,
        {
          product,
          quantity,
          unitPrice: resolvedPrice,
        },
      ]);
    }
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    setItems(items.map((i) => (i.product.id === productId ? { ...i, quantity } : i)));
  };

  const updateItemNotes = (productId: string, notes: string) => {
    setItems(items.map((i) => (i.product.id === productId ? { ...i, notes } : i)));
  };

  const removeItem = (productId: string) => {
    setItems(items.filter((i) => i.product.id !== productId));
  };

  const clearCart = () => {
    setItems([]);
    setDiscount(0);
    setTax(0);
  };

  const processCheckout = async (
    paymentMethod: 'cash' | 'qris' | 'card' | 'bank',
    tendered?: number
  ) => {
    if (!currentOrganization || !currentStore || !currentWarehouse) {
      return { data: null, error: new Error('Missing active store or warehouse context') };
    }

    if (items.length === 0) {
      return { data: null, error: new Error('Cart is empty') };
    }

    // Validate stock availability before processing sale
    const stockErrors = await validateSaleStock(
      items.map((i) => ({
        product_id: i.product.id,
        qty: i.quantity,
        product_name: i.product.name,
      })),
      currentWarehouse.id
    );

    if (stockErrors.length > 0) {
      const errorMessages = stockErrors
        .map((e) => {
          const unitStr = e.unit ? ` ${e.unit}` : '';
          return e.ingredientName
            ? `${e.product_name}: ${e.ingredientName} needs ${e.required.toFixed(2)}${unitStr}, only ${e.available.toFixed(2)}${unitStr} available`
            : `${e.product_name}: needs ${e.required}, only ${e.available} in stock`;
        })
        .join('\n');
      return { data: null, error: new Error(`Insufficient stock:\n${errorMessages}`) };
    }

    const receiptNumber = `DRIP-${Date.now().toString().slice(-8)}`;

    const itemsPayload = items.map((i) => ({
      product_id: i.product.id,
      product_name: i.product.name,
      unit_price: i.unitPrice,
      quantity: i.quantity,
      notes: i.notes || null,
    }));

    const { data, error } = await supabase.rpc('process_pos_sale', {
      p_organization_id: currentOrganization.id,
      p_store_id: currentStore.id,
      p_warehouse_id: currentWarehouse.id,
      p_receipt_number: receiptNumber,
      p_items: itemsPayload,
      p_payment_method: paymentMethod,
      p_amount: grandTotal,
      p_tendered: tendered || grandTotal,
      p_discount: discount,
      p_tax: tax,
    });

    if (error) {
      return { data: null, error };
    }

    clearCart();
    await refreshInventory();

    const result: CheckoutResult = {
      success: true,
      saleId: data.sale_id,
      receiptNumber: data.receipt_number,
      grandTotal: data.grand_total,
      totalCogs: data.total_cogs,
      grossProfit: data.gross_profit,
      change: data.change || 0,
    };

    return { data: result, error: null };
  };

  return (
    <CartContext.Provider
      value={{
        items,
        subtotal,
        discount,
        tax,
        grandTotal,
        itemCount,
        addItem,
        updateQuantity,
        updateItemNotes,
        removeItem,
        clearCart,
        setDiscountAmount: setDiscount,
        processCheckout,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
