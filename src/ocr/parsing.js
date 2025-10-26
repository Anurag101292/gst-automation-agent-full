export function parseInvoice(text) {
  const lines = (text||'').split('\n').map(l=>l.trim()).filter(Boolean);
  const raw = lines.join('\n');
  const billNo = raw.match(/(?:Invoice|Bill)\s*(?:No|No\.|#|:)[:\s]*([A-Z0-9-\/]+)/i)?.[1] || null;
  const gstin = raw.match(/\b\d{2}[A-Z]{5}\d{4}[A-Z]\wZ[0-9A-Z]\b/)?.[0] || raw.match(/\b\d{2}[A-Z0-9]{13}\b/)?.[0] || null;
  const date = raw.match(/(\d{2}[\/\-]\d{2}[\/\-]\d{4})/)?.[1] || null;
  const taxable = raw.match(/Taxable\s*Value[:\s]*([\d,\.]+)/i)?.[1] || null;
  const total = raw.match(/Total\s*(?:Amount|Value)?[:\s]*([\d,\.]+)/i)?.[1] || null;

  function toNumber(str){ if(!str) return null; return Number(str.replace(/[,₹\s]/g,'')); }

  return {
    invoice_no: billNo,
    invoice_date: date,
    supplier_gstin: gstin,
    taxable_value_total: toNumber(taxable),
    tax_total: null,
    invoice_total: toNumber(total),
    raw_text: raw,
    confidence: 0.7
  };
}
