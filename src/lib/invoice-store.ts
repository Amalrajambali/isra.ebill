import { INITIAL_INVOICES } from '@/lib/mock-data';
import type { Invoice } from '@/lib/types';

const STORAGE_KEY = 'isra-ethnics-invoices-v2';

const isBrowser = () => typeof window !== 'undefined';

const getStorage = () => {
  if (!isBrowser()) return null;

  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

const seedInvoices = (storage: Storage) => {
  storage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_INVOICES));
  return INITIAL_INVOICES;
};

export const loadInvoices = (): Invoice[] => {
  const storage = getStorage();
  if (!storage) return INITIAL_INVOICES;

  const raw = storage.getItem(STORAGE_KEY);
  if (!raw) return seedInvoices(storage);

  try {
    const parsed = JSON.parse(raw) as Invoice[];
    if (!Array.isArray(parsed) || parsed.length === 0) return seedInvoices(storage);
    return parsed;
  } catch {
    return seedInvoices(storage);
  }
};

export const saveInvoice = (invoice: Invoice) => {
  const storage = getStorage();
  if (!storage) return [invoice];

  const invoices = loadInvoices();
  const next = [invoice, ...invoices.filter((item) => item.invoiceNumber !== invoice.invoiceNumber)];
  storage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
};

export const deleteInvoice = (invoiceNumber: string) => {
  const storage = getStorage();
  if (!storage) return INITIAL_INVOICES.filter((invoice) => invoice.invoiceNumber !== invoiceNumber);

  const next = loadInvoices().filter((invoice) => invoice.invoiceNumber !== invoiceNumber);
  storage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
};

export const getInvoiceByNumber = (invoiceNumber: string) =>
  loadInvoices().find((invoice) => invoice.invoiceNumber === invoiceNumber);

export const buildInvoiceUrl = (origin: string, invoiceNumber: string) =>
  `${origin}/invoice/${encodeURIComponent(invoiceNumber)}`;
