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

const readLocalProducts = (): Product[] => {
  const storage = getStorage();
  if (!storage) return INITIAL_PRODUCTS;

  const raw = storage.getItem(STORAGE_KEY);
  if (!raw) return INITIAL_PRODUCTS;

  try {
    const parsed = JSON.parse(raw) as Product[];
    return Array.isArray(parsed) ? parsed : INITIAL_PRODUCTS;
  } catch {
    return INITIAL_PRODUCTS;
  }
};

const writeLocalProducts = (products: Product[]) => {
  const storage = getStorage();
  if (!storage) return;
  storage.setItem(STORAGE_KEY, JSON.stringify(products));
};

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    cache: 'no-store',
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json() as Promise<T>;
}

const seedRemoteProducts = async (products: Product[]) => {
  await fetchJson('/api/products', {
    method: 'POST',
    body: JSON.stringify({ products }),
  });
  writeLocalProducts(products);
  return products;
};

export const loadProducts = async (): Promise<Product[]> => {
  try {
    const remote = await fetchJson<Product[]>('/api/products');
    if (remote.length > 0) {
      writeLocalProducts(remote);
      return remote;
    }

    const local = readLocalProducts();
    return seedRemoteProducts(local.length > 0 ? local : INITIAL_PRODUCTS);
  } catch {
    const local = readLocalProducts();
    return local.length > 0 ? local : INITIAL_PRODUCTS;
  }
};

export const saveProducts = async (products: Product[]) => {
  try {
    const saved = await fetchJson<Product[]>('/api/products', {
      method: 'POST',
      body: JSON.stringify({ products }),
    });
    writeLocalProducts(saved);
    return saved;
  } catch {
    writeLocalProducts(products);
    return products;
  }
};

export const addProduct = async (product: Omit<Product, 'id'>) => {
  const products = await loadProducts();
  const nextId = String(
    products.reduce((max, current) => Math.max(max, Number(current.id) || 0), 0) + 1,
  );
  const next = await saveProducts([...products, { ...product, id: nextId }]);
  return next;
};

export const updateProduct = async (product: Product) => {
  const products = await loadProducts();
  const next = await saveProducts(products.map((item) => (item.id === product.id ? product : item)));
  return next;
};

export const deleteProduct = async (productId: string) => {
  const products = await loadProducts();
  const next = await saveProducts(products.filter((item) => item.id !== productId));
  return next;
};

