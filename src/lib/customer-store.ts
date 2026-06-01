import { INITIAL_CUSTOMERS } from '@/lib/mock-data';
import type { Customer } from '@/lib/types';

const STORAGE_KEY = 'isra-ethnics-customers-v1';

const isBrowser = () => typeof window !== 'undefined';

const getStorage = () => {
  if (!isBrowser()) return null;

  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

const seedCustomers = (storage: Storage) => {
  storage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_CUSTOMERS));
  return INITIAL_CUSTOMERS;
};

export const loadCustomers = (): Customer[] => {
  const storage = getStorage();
  if (!storage) return INITIAL_CUSTOMERS;

  const raw = storage.getItem(STORAGE_KEY);
  if (!raw) return seedCustomers(storage);

  try {
    const parsed = JSON.parse(raw) as Customer[];
    if (!Array.isArray(parsed) || parsed.length === 0) return seedCustomers(storage);
    return parsed;
  } catch {
    return seedCustomers(storage);
  }
};

export const saveCustomers = (customers: Customer[]) => {
  const storage = getStorage();
  if (!storage) return customers;
  storage.setItem(STORAGE_KEY, JSON.stringify(customers));
  return customers;
};

const normalizeMobile = (mobile: string) => mobile.replace(/\D/g, '');

const nextCustomerId = (customers: Customer[]) => {
  const maxId = customers.reduce((max, current) => {
    const numeric = Number(current.id.replace(/\D/g, ''));
    return Number.isFinite(numeric) && numeric > max ? numeric : max;
  }, 0);

  return `c${maxId + 1}`;
};

export const findCustomerByMobile = (mobile: string) => {
  const normalized = normalizeMobile(mobile);
  if (!normalized) return undefined;

  return loadCustomers().find((customer) => normalizeMobile(customer.mobile) === normalized);
};

export const upsertCustomer = (customer: Omit<Customer, 'id' | 'totalOrders'> & Partial<Pick<Customer, 'id' | 'totalOrders' | 'lastPurchaseDate'>>) => {
  const customers = loadCustomers();
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
    saveCustomers(next);
    return next[existingIndex];
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

  const next = [...customers, newCustomer];
  saveCustomers(next);
  return newCustomer;
};

export const addCustomer = (customer: Omit<Customer, 'id' | 'totalOrders'>) => upsertCustomer(customer);

export const updateCustomer = (customer: Customer) => {
  const next = loadCustomers().map((item) => (item.id === customer.id ? customer : item));
  saveCustomers(next);
  return next;
};

