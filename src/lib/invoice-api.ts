import type { Invoice } from '@/lib/types';

const LOCAL_STORAGE_KEY = 'isra-ethnics-invoices-v3';
const EMPTY_INVOICES: Invoice[] = [];

const isBrowser = () => typeof window !== 'undefined';

const readLocalInvoices = (): Invoice[] => {
  if (!isBrowser()) return EMPTY_INVOICES;

  try {
    const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return EMPTY_INVOICES;
    const parsed = JSON.parse(raw) as Invoice[];
    return Array.isArray(parsed) ? parsed : EMPTY_INVOICES;
  } catch {
    return EMPTY_INVOICES;
  }
};

const writeLocalInvoices = (invoices: Invoice[]) => {
  if (!isBrowser()) return;
  window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(invoices));
};

const upsertLocalInvoice = (invoice: Invoice) => {
  const next = [invoice, ...readLocalInvoices().filter((item) => item.invoiceNumber !== invoice.invoiceNumber)];
  writeLocalInvoices(next);
  return next;
};

const removeLocalInvoice = (invoiceNumber: string) => {
  const next = readLocalInvoices().filter((item) => item.invoiceNumber !== invoiceNumber);
  writeLocalInvoices(next);
  return next;
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

export async function listInvoices(): Promise<Invoice[]> {
  try {
    return await fetchJson<Invoice[]>('/api/invoices');
  } catch {
    return readLocalInvoices();
  }
}

export async function getInvoice(invoiceNumber: string): Promise<Invoice | null> {
  try {
    const data = await fetchJson<{ invoice: Invoice }>(`/api/invoices/${encodeURIComponent(invoiceNumber)}`);
    return data.invoice;
  } catch {
    return readLocalInvoices().find((invoice) => invoice.invoiceNumber === invoiceNumber) ?? null;
  }
}

export async function upsertInvoice(invoice: Invoice): Promise<Invoice> {
  try {
    const data = await fetchJson<{ invoice: Invoice }>('/api/invoices', {
      method: 'POST',
      body: JSON.stringify({ invoice }),
    });
    upsertLocalInvoice(data.invoice);
    return data.invoice;
  } catch {
    upsertLocalInvoice(invoice);
    return invoice;
  }
}

export async function deleteInvoice(invoiceNumber: string): Promise<Invoice[]> {
  try {
    await fetchJson<{ ok: true }>(`/api/invoices/${encodeURIComponent(invoiceNumber)}`, {
      method: 'DELETE',
    });
    return removeLocalInvoice(invoiceNumber);
  } catch {
    return removeLocalInvoice(invoiceNumber);
  }
}
