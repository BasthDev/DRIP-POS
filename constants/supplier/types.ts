export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  taxId: string;
  paymentTerms: string;
  notes: string;
  isActive: boolean;
  rating: number; // 1-5
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierFormData {
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  taxId: string;
  paymentTerms: string;
  notes: string;
}

export interface SupplierFilter {
  search: string;
  status: 'all' | 'active' | 'inactive';
  sortBy: 'name' | 'rating' | 'totalOrders' | 'totalSpent' | 'lastOrderDate';
  sortOrder: 'asc' | 'desc';
}

export type SupplierValidationErrors = Partial<Record<keyof SupplierFormData, string>>;