import type { Customer } from '@/lib/types';

const STORAGE_KEY = 'isra-ethnics-customers-v1';
const EMPTY_CUSTOMERS: Customer[] = [];

const isBrowser = () => typeof window !== 'undefined';

const getStorage = () => {
  if (!isBrowser()) return null;

  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

const normalizeMobile = (mobile: string) => mobile.replace(/\D/g, '');

const readLocalCustomers = (): Customer[] => {
  const storage = getStorage();
  if (!storage) return EMPTY_CUSTOMERS;

  const raw = storage.getItem(STORAGE_KEY);
  if (!raw) return EMPTY_CUSTOMERS;

  try {
    const parsed = JSON.parse(raw) as Customer[];
    return Array.isArray(parsed) ? parsed : EMPTY_CUSTOMERS;
  } catch {
    return EMPTY_CUSTOMERS;
  }
};

const writeLocalCustomers = (customers: Customer[]) => {
  const storage = getStorage();
  if (!storage) return;
  storage.setItem(STORAGE_KEY, JSON.stringify(customers));
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

const nextCustomerId = (customers: Customer[]) => {
  const maxId = customers.reduce((max, current) => {
    const numeric = Number(current.id.replace(/\D/g, ''));
    return Number.isFinite(numeric) && numeric > max ? numeric : max;
  }, 0);

  return `c${maxId + 1}`;
};

export const loadCustomers = async (): Promise<Customer[]> => {
  try {
    const remote = await fetchJson<Customer[]>('/api/customers');
    writeLocalCustomers(remote);
    return remote;
  } catch {
    return [];
  }
};

export const saveCustomers = async (customers: Customer[]) => {
  try {
    const saved = await fetchJson<Customer[]>('/api/customers', {
      method: 'POST',
      body: JSON.stringify({ customers }),
    });
    writeLocalCustomers(saved);
    return saved;
  } catch {
    writeLocalCustomers(customers);
    return customers;
  }
};

export const findCustomerByMobile = async (mobile: string) => {
  const normalized = normalizeMobile(mobile);
  if (!normalized) return undefined;

  const customers = await loadCustomers();
  return customers.find((customer) => normalizeMobile(customer.mobile) === normalized);
};

export const upsertCustomer = async (customer: Omit<Customer, 'id' | 'totalOrders'> & Partial<Pick<Customer, 'id' | 'totalOrders' | 'lastPurchaseDate'>>) => {
  const customers = await loadCustomers();
  const normalizedMobile = normalizeMobile(customer.mobile);
  const existingIndex = customers.findIndex(
    (item) => normalizeMobile(item.mobile) === normalizedMobile || (customer.id ? item.id === customer.id : false),
  );

  if (existingIndex >= 0) {
    const existing = customers[existingIndex];
    const next = customers.map((item, index) =>
      index === existingIndex
        ? {
            ...existing,
            ...customer,
            mobile: normalizedMobile || existing.mobile,
            id: existing.id,
            totalOrders: customer.totalOrders ?? existing.totalOrders,
          }
        : item,
    );
    const saved = await saveCustomers(next);
    return saved[existingIndex];
  }

  const newCustomer: Customer = {
    id: customer.id || nextCustomerId(customers),
    name: customer.name.trim(),
    mobile: normalizedMobile || customer.mobile,
    address: customer.address.trim(),
    notes: customer.notes,
    totalOrders: customer.totalOrders ?? 0,
    lastPurchaseDate: customer.lastPurchaseDate,
  };

  const saved = await saveCustomers([...customers, newCustomer]);
  return saved[saved.length - 1];
};

export const addCustomer = async (customer: Omit<Customer, 'id' | 'totalOrders'>) => upsertCustomer(customer);

export const updateCustomer = async (customer: Customer) => {
  const customers = await loadCustomers();
  const next = await saveCustomers(customers.map((item) => (item.id === customer.id ? customer : item)));
  return next;
};
