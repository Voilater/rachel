const MAX_RECEIPT_BYTES = 5 * 1024 * 1024;
const MAX_RECEIPT_PIXELS = 16_000_000;

export interface PaymentReceiptOcrResult {
  amount: number | null;
  transactionReference: string | null;
  orderReference: string | null;
  paymentStatus: string | null;
  paidAt: string | null;
  payeeName: string | null;
  payeeUpiId: string | null;
  payerName: string | null;
  payerBank: string | null;
  payerBankAccount: string | null;
  payerUpiId: string | null;
  confidence: number | null;
}

export function parsePaymentReceiptText(
  text: string,
  confidence: number | null = null,
): PaymentReceiptOcrResult {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const currencyAmountMatch = text.match(
    /(?:₹|INR|Rs\.?)\s*([0-9][0-9,]*(?:\.\d{1,2})?)/i,
  );
  const standaloneAmountMatch =
    lines
      .map((line) => line.match(/^[^\d]{0,4}\s*([0-9][0-9,]*\.\d{2})\s*$/))
      .find((match) => match !== null) ?? null;
  const amountMatch = currencyAmountMatch ?? standaloneAmountMatch;
  const amount = amountMatch
    ? Number(amountMatch[1].replaceAll(",", ""))
    : null;

  const referenceMatch = text.match(
    /(?:UTR|UPI\s*(?:ref(?:erence)?|transaction(?:\s*(?:id|ref(?:erence)?))?)(?:\s*(?:id|no\.?|number))?|transaction\s*(?:id|ref(?:erence)?)(?:\s*(?:no\.?|number))?)[\s:#-]*([A-Z0-9][A-Z0-9-]{5,39})\b/i,
  );
  const transactionReference =
    referenceMatch && /\d/.test(referenceMatch[1])
      ? referenceMatch[1].toUpperCase()
      : null;

  const orderMatch = text.match(/\bOrder[+\s:#-]*([A-Z0-9][A-Z0-9-]{5,39})\b/i);
  const statusMatch = text.match(
    /\b(Completed|Successful|Succeeded|Failed|Pending)\b/i,
  );
  const paidAtMatch = text.match(
    /\b(\d{1,2}\s+[A-Z]{3,9}\s+\d{4},?\s+\d{1,2}:\d{2}\s*(?:AM|PM))\b/i,
  );
  const toIndex = lines.findIndex((line) => /^To\s*:/i.test(line));
  const fromIndex = lines.findIndex((line) => /^From\s*:/i.test(line));
  const sectionName = (index: number, label: "To" | "From") => {
    if (index < 0) return null;
    const firstLine = lines[index].replace(
      label === "To" ? /^To\s*:\s*/i : /^From\s*:\s*/i,
      "",
    );
    const parts = [firstLine.replace(/\s*\([^)]*\)\s*$/, "").trim()];
    for (let i = index + 1; i < lines.length && parts.length < 3; i += 1) {
      const line = lines[i];
      if (
        /^(?:To|From)\s*:/i.test(line) ||
        line.includes("@") ||
        /\bGoogle Pay\b/i.test(line) ||
        /\bBank\s+\d{4}\b/i.test(line)
      ) {
        break;
      }
      parts.push(line);
    }
    return parts.filter(Boolean).join(" ").trim() || null;
  };
  const sectionUpiId = (index: number) => {
    if (index < 0) return null;
    const nextSection = lines.findIndex(
      (line, lineIndex) => lineIndex > index && /^(?:To|From)\s*:/i.test(line),
    );
    const section = lines.slice(
      index + 1,
      nextSection < 0 ? undefined : nextSection,
    );
    const line = section.find((value) => value.includes("@"));
    return line?.split(/\s+on\s+/i)[0].trim() ?? null;
  };
  const payerLine = fromIndex >= 0 ? lines[fromIndex] : "";
  const payerBank = payerLine.match(/\(([^)]+)\)/)?.[1]?.trim() ?? null;
  const payerBankAccount =
    lines.find((line) => /\bBank\s+\d{4}\b/i.test(line)) ?? null;

  return {
    amount: amount !== null && Number.isFinite(amount) ? amount : null,
    transactionReference,
    orderReference: orderMatch?.[1]?.toUpperCase() ?? null,
    paymentStatus: statusMatch?.[1] ?? null,
    paidAt: paidAtMatch?.[1] ?? null,
    payeeName: sectionName(toIndex, "To"),
    payeeUpiId: sectionUpiId(toIndex),
    payerName:
      fromIndex < 0
        ? null
        : payerLine
            .replace(/^From\s*:\s*/i, "")
            .replace(/\s*\([^)]*\)\s*$/, "")
            .trim() || null,
    payerBank,
    payerBankAccount,
    payerUpiId: sectionUpiId(fromIndex),
    confidence:
      confidence !== null && Number.isFinite(confidence)
        ? Math.max(0, Math.min(100, confidence))
        : null,
  };
}

export async function readPaymentReceipt(
  file: File,
): Promise<PaymentReceiptOcrResult> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    throw new Error("Choose a JPG, PNG, or WebP payment screenshot.");
  }
  if (file.size > MAX_RECEIPT_BYTES) {
    throw new Error("The screenshot must be 5 MB or smaller.");
  }

  const bitmap = await createImageBitmap(file);
  const isTooLarge = bitmap.width * bitmap.height > MAX_RECEIPT_PIXELS;
  bitmap.close();
  if (isTooLarge) {
    throw new Error("The screenshot dimensions are too large to process.");
  }

  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("eng");
  try {
    const { data } = await worker.recognize(file);
    return parsePaymentReceiptText(data.text, data.confidence);
  } finally {
    await worker.terminate();
  }
}
