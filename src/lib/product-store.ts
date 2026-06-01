import { INITIAL_PRODUCTS } from '@/lib/mock-data';
import type { Product } from '@/lib/types';

const STORAGE_KEY = 'isra-ethnics-products-v1';

const isBrowser = () => typeof window !== 'undefined';

const getStorage = () => {
  if (!isBrowser()) return null;

  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

const seedProducts = (storage: Storage) => {
  storage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_PRODUCTS));
  return INITIAL_PRODUCTS;
};

export const loadProducts = (): Product[] => {
  const storage = getStorage();
  if (!storage) return INITIAL_PRODUCTS;

  const raw = storage.getItem(STORAGE_KEY);
  if (!raw) return seedProducts(storage);

  try {
    const parsed = JSON.parse(raw) as Product[];
    if (!Array.isArray(parsed) || parsed.length === 0) return seedProducts(storage);
    return parsed;
  } catch {
    return seedProducts(storage);
  }
};

export const saveProducts = (products: Product[]) => {
  const storage = getStorage();
  if (!storage) return products;
  storage.setItem(STORAGE_KEY, JSON.stringify(products));
  return products;
};

export const addProduct = (product: Omit<Product, 'id'>) => {
  const products = loadProducts();
  const nextId = String(
    products.reduce((max, current) => Math.max(max, Number(current.id) || 0), 0) + 1
  );
  const next = [...products, { ...product, id: nextId }];
  saveProducts(next);
  return next;
};

export const updateProduct = (product: Product) => {
  const next = loadProducts().map((item) => (item.id === product.id ? product : item));
  saveProducts(next);
  return next;
};

export const deleteProduct = (productId: string) => {
  const next = loadProducts().filter((item) => item.id !== productId);
  saveProducts(next);
  return next;
};
