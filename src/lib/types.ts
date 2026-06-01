
export type Category = 'Churidar' | 'Saree' | 'Kurti' | 'Dupatta' | 'Shawl' | 'Other';

export interface Product {
  id: string;
  name: string;
  category: Category;
  sellingPrice: number;
  stockQuantity: number;
  imageUrl?: string;
}

export interface Customer {
  id: string;
  name: string;
  mobile: string;
  address: string;
  notes?: string;
  totalOrders: number;
  lastPurchaseDate?: string;
}

export interface InvoiceItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  discount: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  customerId: string;
  customerName: string;
  customerMobile: string;
  customerAddress: string;
  items: InvoiceItem[];
  subtotal: number;
  totalDiscount: number;
  grandTotal: number;
  pdfUrl?: string;
  pdfPublicId?: string;
  pdfUploadStatus?: 'pending' | 'uploaded' | 'failed';
}

export interface ShopSettings {
  name: string;
  address: string;
  phone1: string;
  phone2: string;
  instagram: string;
  thankYouMessage: string;
}
