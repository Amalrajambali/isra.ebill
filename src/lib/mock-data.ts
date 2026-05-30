
import { Product, Customer, Invoice, Category } from './types';

export const INITIAL_PRODUCTS: Product[] = [
  { id: '1', name: 'Banarasi Silk Saree', category: 'Saree', sellingPrice: 4500, stockQuantity: 12 },
  { id: '2', name: 'Designer Anarkali Churidar', category: 'Churidar', sellingPrice: 2800, stockQuantity: 8 },
  { id: '3', name: 'Zari Border Cotton Saree', category: 'Saree', sellingPrice: 3200, stockQuantity: 15 },
  { id: '4', name: 'Floral Printed Kurti', category: 'Kurti', sellingPrice: 1200, stockQuantity: 25 },
  { id: '5', name: 'Heavy Work Wedding Saree', category: 'Saree', sellingPrice: 8500, stockQuantity: 5 },
  { id: '6', name: 'Embroidered Pashmina Shawl', category: 'Shawl', sellingPrice: 1500, stockQuantity: 3 },
];

export const INITIAL_CUSTOMERS: Customer[] = [
  { id: 'c1', name: 'Sarah Ahmed', mobile: '8113081120', address: 'Tirur, Kerala', totalOrders: 5, lastPurchaseDate: '2024-05-15' },
  { id: 'c2', name: 'Lakshmi Nair', mobile: '9961264495', address: 'Thekkummuri, Tirur', totalOrders: 2, lastPurchaseDate: '2024-05-10' },
];

export const INITIAL_INVOICES: Invoice[] = [
  {
    id: 'inv1',
    invoiceNumber: 'ISRA-1001',
    date: '2024-05-15',
    customerId: 'c1',
    customerName: 'Sarah Ahmed',
    customerMobile: '8113081120',
    customerAddress: 'Tirur, Kerala',
    items: [
      { productId: '1', productName: 'Banarasi Silk Saree', quantity: 1, price: 4500, discount: 500, total: 4000 }
    ],
    subtotal: 4500,
    totalDiscount: 500,
    grandTotal: 4000
  }
];
