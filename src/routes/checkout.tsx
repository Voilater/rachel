import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";

import { PageLayout } from "@/components/layout/PageLayout";
import { Price } from "@/components/Price";
import { useAuth } from "@/lib/auth";
import { getCartItemKey, useCart, type CartItem } from "@/lib/cart";
import { logClientAudit } from "@/lib/client-audit";
import {
  DEFAULT_PRODUCT_WEIGHT_GRAMS,
  computeOrderTotals,
  deliveryOptions,
  formatWeightGrams,
  type CourierMethod,
  type DeliveryMethod,
} from "@/lib/order-totals";
import {
  generateOrderNumber,
  getDeliveryLabel,
  getEstimatedDelivery,
  saveConfirmedOrder,
} from "@/lib/order-confirmation";
import { isStaticSite } from "@/lib/static-site";
import { formatPrice, siteConfig } from "@/lib/site-data";
import {
  INDIAN_MOBILE_ERROR,
  normalizeIndianMobileNumber,
} from "@/lib/form-validation";
import {
  readPaymentReceipt,
  type PaymentReceiptOcrResult,
} from "@/lib/payment-receipt-ocr";
import { buildPageHead } from "@/lib/seo";
import { getAccountProfile } from "@/server/profile";
import { createUpiPayment, reportUpiPayment } from "@/server/payment";
import { cn } from "@/lib/utils";
import { migrateStorageKeys } from "@/lib/storage-migration";

export const Route = createFileRoute("/checkout")({
  head: () =>
    buildPageHead({
      title: `Shipping & Payment`,
      description: `Secure checkout for ${siteConfig.brandName} orders.`,
      path: "/checkout",
      noIndex: true,
    }),
  component: CheckoutPage,
});

function StepBadge({ step }: { step: number }) {
  return (
    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-burgundy text-sm font-semibold text-white">
      {step}
    </span>
  );
}

type ShippingField = "fullName" | "street" | "city" | "zip" | "phone";

type UpiPayment = {
  paymentReference: string;
  orderNumber: string;
  upiUri: string;
  amount: string;
  upiId: string;
  payeeName: string;
};

type CheckoutDraft = {
  version: 1;
  userId: string;
  savedAt: number;
  fullName: string;
  street: string;
  city: string;
  zip: string;
  phone: string;
  delivery: DeliveryMethod;
  billingSameAsShipping: boolean;
  promoCode: string;
  paymentCartFingerprint: string | null;
  upiPayment: UpiPayment | null;
  receiptOcr: PaymentReceiptOcrResult | null;
  receiptError: string | null;
};

const CHECKOUT_DRAFT_KEY = "rachelparadise_checkout_draft";
const CHECKOUT_DRAFT_TTL_MS = 12 * 60 * 60 * 1000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isUpiPayment(value: unknown): value is UpiPayment {
  if (!isRecord(value)) return false;
  return [
    value.paymentReference,
    value.orderNumber,
    value.upiUri,
    value.amount,
    value.upiId,
    value.payeeName,
  ].every((field) => typeof field === "string");
}

function isPaymentReceipt(value: unknown): value is PaymentReceiptOcrResult {
  if (!isRecord(value)) return false;
  const nullableStrings = [
    value.transactionReference,
    value.orderReference,
    value.paymentStatus,
    value.paidAt,
    value.payeeName,
    value.payeeUpiId,
    value.payerName,
    value.payerBank,
    value.payerBankAccount,
    value.payerUpiId,
  ];
  return (
    (value.amount === null || typeof value.amount === "number") &&
    nullableStrings.every(
      (field) => field === null || typeof field === "string",
    ) &&
    (value.confidence === null || typeof value.confidence === "number")
  );
}

function isCheckoutDraft(value: unknown): value is CheckoutDraft {
  if (!isRecord(value)) return false;
  return (
    value.version === 1 &&
    typeof value.userId === "string" &&
    typeof value.savedAt === "number" &&
    Number.isFinite(value.savedAt) &&
    typeof value.fullName === "string" &&
    typeof value.street === "string" &&
    typeof value.city === "string" &&
    typeof value.zip === "string" &&
    typeof value.phone === "string" &&
    (value.delivery === "st-courier" ||
      value.delivery === "professional-courier" ||
      value.delivery === "india-post" ||
      value.delivery === "standard" ||
      value.delivery === "express") &&
    typeof value.billingSameAsShipping === "boolean" &&
    typeof value.promoCode === "string" &&
    (value.paymentCartFingerprint === null ||
      typeof value.paymentCartFingerprint === "string") &&
    (value.upiPayment === null || isUpiPayment(value.upiPayment)) &&
    (value.receiptOcr === null || isPaymentReceipt(value.receiptOcr)) &&
    (value.receiptError === null || typeof value.receiptError === "string")
  );
}

function getCartFingerprint(
  items: CartItem[],
  delivery: CourierMethod,
) {
  return JSON.stringify({
    delivery,
    items: items
      .map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
        size: item.size,
        colorId: item.colorId,
        linePrice: item.linePrice,
        weightGrams:
          item.product.weightGrams ?? DEFAULT_PRODUCT_WEIGHT_GRAMS,
      }))
      .sort(
        (a, b) =>
          a.productId.localeCompare(b.productId) ||
          a.size.localeCompare(b.size) ||
          a.colorId.localeCompare(b.colorId),
      ),
  });
}

const CHECKOUT_ERROR_MESSAGES: Record<string, string> = {
  "Sign in again before starting payment.":
    "Your session has expired. Sign in again before placing your order.",
  "The signed-in customer does not match this checkout.":
    "Your session has changed. Sign in again before placing your order.",
  "A complete shipping address is required.":
    "Enter your complete delivery address to continue.",
  "Order amount must be at least ₹1.":
    "Your order total must be at least ₹1.",
  "Enter a valid email address.": "Check the email address on your account.",
  [INDIAN_MOBILE_ERROR]: INDIAN_MOBILE_ERROR,
  "A product in this checkout is no longer available.":
    "A product in your bag is no longer available. Review your bag and try again.",
  "A product price changed. Please review your cart and try again.":
    "A product price changed. Review your bag before continuing.",
  "A product in this checkout no longer has enough stock.":
    "There isn't enough stock for one of the items in your bag. Update your bag and try again.",
  "The checkout total changed. Please review your cart and try again.":
    "Your order total changed. Review your bag before continuing.",
  "Payment request was not found. Please try checkout again.":
    "Your payment request has expired. Start checkout again to get a new QR code.",
  "The amount read from the screenshot does not match this order.":
    "The amount on the receipt doesn't match this order.",
  "The order reference read from the screenshot does not match this order.":
    "The receipt belongs to a different order. Upload the receipt for this order.",
  "The screenshot does not show a completed payment. Upload the successful receipt.":
    "This receipt doesn't show a completed payment. Upload the successful receipt.",
  "Enter a valid UPI transaction reference / UTR.":
    "We couldn't read a valid UTR. Try a clearer screenshot.",
  "Sign in to the account used for this checkout to view the order.":
    "Sign in to the same account you used when starting checkout.",
  "This UPI payment report has already been submitted.":
    "This payment report has already been submitted.",
  "This UPI transaction reference has already been submitted.":
    "This UTR was already used for another order. Contact us if you need help.",
  "Choose a JPG, PNG, or WebP payment screenshot.":
    "Choose a JPG, PNG, or WebP screenshot.",
  "The screenshot must be 5 MB or smaller.":
    "Choose a screenshot that is 5 MB or smaller.",
  "The screenshot dimensions are too large to process.":
    "This screenshot is too large to read. Try a smaller image.",
};

function getCheckoutErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    return CHECKOUT_ERROR_MESSAGES[error.message] ?? fallback;
  }
  return fallback;
}

function CheckoutPage() {
  const navigate = useNavigate();
  const { items, clearCart, ready: cartReady } = useCart();
  const { clientUser } = useAuth();
  const [delivery, setDelivery] = useState<CourierMethod>("st-courier");
  const [billingSameAsShipping, setBillingSameAsShipping] = useState(true);
  const [promoCode, setPromoCode] = useState("");
  const [isPaying, setIsPaying] = useState(false);
  const [isReportingPayment, setIsReportingPayment] = useState(false);
  const [upiPayment, setUpiPayment] = useState<UpiPayment | null>(null);
  const [paymentCartFingerprint, setPaymentCartFingerprint] = useState<
    string | null
  >(null);
  const [isReadingReceipt, setIsReadingReceipt] = useState(false);
  const [receiptOcr, setReceiptOcr] = useState<PaymentReceiptOcrResult | null>(
    null,
  );
  const [receiptError, setReceiptError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<ShippingField, string>>
  >({});

  const [fullName, setFullName] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [zip, setZip] = useState("");
  const [phone, setPhone] = useState("");
  const [checkoutHydratedForUser, setCheckoutHydratedForUser] = useState<
    string | null
  >(null);
  const [checkoutDraftCleared, setCheckoutDraftCleared] = useState(false);

  useEffect(() => {
    if (!clientUser) {
      void navigate({
        to: "/login",
        search: {
          registered: false,
          email: "",
          error: "",
          redirect: "/checkout",
        },
      });
      return;
    }

    if (!cartReady || checkoutHydratedForUser === clientUser.id) return;

    let cancelled = false;
    const restoreCheckout = async () => {
      let savedDraft: CheckoutDraft | null = null;
      try {
        migrateStorageKeys(sessionStorage, [
          ["vk_checkout_draft", CHECKOUT_DRAFT_KEY],
        ]);
        const storedDraft = sessionStorage.getItem(CHECKOUT_DRAFT_KEY);
        if (storedDraft) {
          const parsedDraft: unknown = JSON.parse(storedDraft);
          if (
            isCheckoutDraft(parsedDraft) &&
            parsedDraft.userId === clientUser.id &&
            parsedDraft.savedAt <= Date.now() &&
            Date.now() - parsedDraft.savedAt <= CHECKOUT_DRAFT_TTL_MS
          ) {
            savedDraft = parsedDraft;
          } else {
            sessionStorage.removeItem(CHECKOUT_DRAFT_KEY);
          }
        }
      } catch {
        setError(
          "We couldn't restore your saved checkout. Please review your details before continuing.",
        );
      }

      if (cancelled) return;

      if (savedDraft) {
        const draftDelivery: CourierMethod =
          savedDraft.delivery === "standard"
            ? "india-post"
            : savedDraft.delivery === "express"
              ? "professional-courier"
              : savedDraft.delivery;
        const hasCurrentDelivery = savedDraft.delivery === draftDelivery;
        const canRestorePayment =
          savedDraft.upiPayment !== null &&
          hasCurrentDelivery &&
          savedDraft.paymentCartFingerprint ===
            getCartFingerprint(items, draftDelivery);
        setFullName(savedDraft.fullName);
        setStreet(savedDraft.street);
        setCity(savedDraft.city);
        setZip(savedDraft.zip);
        setPhone(savedDraft.phone);
        setDelivery(draftDelivery);
        setBillingSameAsShipping(savedDraft.billingSameAsShipping);
        setPromoCode(savedDraft.promoCode);
        setUpiPayment(canRestorePayment ? savedDraft.upiPayment : null);
        setPaymentCartFingerprint(
          canRestorePayment ? savedDraft.paymentCartFingerprint : null,
        );
        setReceiptOcr(canRestorePayment ? savedDraft.receiptOcr : null);
        setReceiptError(canRestorePayment ? savedDraft.receiptError : null);
        if (savedDraft.upiPayment && !canRestorePayment) {
          setError(
            "Your saved payment QR no longer matches the items in your bag. If you already paid, contact us before paying again.",
          );
        }
        setCheckoutHydratedForUser(clientUser.id);
        return;
      }

      setFullName(clientUser.name);
      if (isStaticSite) {
        setCheckoutHydratedForUser(clientUser.id);
        return;
      }

      try {
        const profile = await getAccountProfile();
        if (cancelled) return;
        if (profile) {
          setFullName(profile.name);
          setPhone(profile.phone);
          setStreet(profile.shippingStreet);
          setCity(profile.shippingCity);
          setZip(profile.shippingZip);
        }
      } catch {
        if (!cancelled) {
          setError(
            "We couldn't load your saved delivery details. Please enter them below.",
          );
        }
      } finally {
        if (!cancelled) setCheckoutHydratedForUser(clientUser.id);
      }
    };

    void restoreCheckout();
    return () => {
      cancelled = true;
    };
  }, [cartReady, checkoutHydratedForUser, clientUser, items, navigate]);

  useEffect(() => {
    if (
      !clientUser ||
      !cartReady ||
      checkoutDraftCleared ||
      checkoutHydratedForUser !== clientUser.id
    ) {
      return;
    }

    const draft: CheckoutDraft = {
      version: 1,
      userId: clientUser.id,
      savedAt: Date.now(),
      fullName,
      street,
      city,
      zip,
      phone,
      delivery,
      billingSameAsShipping,
      promoCode,
      paymentCartFingerprint,
      upiPayment,
      receiptOcr,
      receiptError,
    };
    try {
      sessionStorage.setItem(CHECKOUT_DRAFT_KEY, JSON.stringify(draft));
    } catch {
      setError(
        "Your browser couldn't save checkout progress. Keep this tab open while completing payment.",
      );
    }
  }, [
    billingSameAsShipping,
    cartReady,
    checkoutDraftCleared,
    checkoutHydratedForUser,
    city,
    clientUser,
    delivery,
    fullName,
    paymentCartFingerprint,
    phone,
    promoCode,
    receiptError,
    receiptOcr,
    street,
    upiPayment,
    zip,
  ]);

  const {
    subtotal,
    shipping,
    processingFee,
    shipmentWeightGrams,
    billableWeightKg,
    tax,
    total,
  } = computeOrderTotals(
    items.map((item) => ({
      linePrice: item.linePrice,
      quantity: item.quantity,
      weightGrams:
        item.product.weightGrams ?? DEFAULT_PRODUCT_WEIGHT_GRAMS,
    })),
    delivery,
  );
  const receiptMatchesPayment =
    upiPayment !== null &&
    receiptOcr?.amount !== null &&
    receiptOcr?.amount !== undefined &&
    Math.round(receiptOcr.amount * 100) ===
      Math.round(Number(upiPayment.amount) * 100) &&
    receiptOcr.orderReference?.toLowerCase() ===
      upiPayment.orderNumber.toLowerCase() &&
    ["completed", "successful", "succeeded"].includes(
      receiptOcr.paymentStatus?.toLowerCase() ?? "",
    ) &&
    Boolean(receiptOcr.transactionReference);

  if (!clientUser) {
    return (
      <PageLayout>
        <div className="mx-auto max-w-lg px-4 py-20 text-center">
          <p className="text-muted-foreground">
            Sign in required to place an order.
          </p>
          <Link
            to="/login"
            search={{
              registered: false,
              email: "",
              error: "",
              redirect: "/checkout",
            }}
            className="mt-6 inline-flex bg-burgundy px-6 py-3 text-xs font-bold uppercase tracking-[0.15em] text-white"
          >
            Sign in to Checkout
          </Link>
        </div>
      </PageLayout>
    );
  }

  const clearSavedCheckout = () => {
    setCheckoutDraftCleared(true);
    try {
      sessionStorage.removeItem(CHECKOUT_DRAFT_KEY);
    } catch {
      setError(
        "Your order was submitted, but saved checkout details couldn't be cleared from this browser. Close this tab to remove them.",
      );
    }
  };

  const handleReceiptUpload = async (file: File | undefined) => {
    setReceiptOcr(null);
    setReceiptError(null);
    if (!file) return;

    setIsReadingReceipt(true);
    try {
      const result = await readPaymentReceipt(file);
      setReceiptOcr(result);
      if (result.amount === null) {
        setReceiptError(
          "Could not read the paid amount. Upload a clear screenshot showing the amount.",
        );
      } else if (!result.transactionReference) {
        setReceiptError(
          "Could not read the UPI transaction ID. Make sure the receipt details are visible.",
        );
      } else if (!result.orderReference) {
        setReceiptError(
          "Could not read the order reference. Upload the receipt for this payment.",
        );
      } else if (!result.paymentStatus) {
        setReceiptError(
          "Could not read the payment status. Upload a screenshot showing it as completed.",
        );
      } else if (
        !upiPayment ||
        Math.round(result.amount * 100) !==
          Math.round(Number(upiPayment.amount) * 100)
      ) {
        setReceiptError(
          "The amount read from the screenshot does not match this order.",
        );
      } else if (
        result.orderReference.toLowerCase() !==
        upiPayment.orderNumber.toLowerCase()
      ) {
        setReceiptError(
          "This receipt does not match the current payment QR. Upload the receipt for the QR shown here. If you already paid using an earlier QR, contact us before paying again.",
        );
      } else if (
        !["completed", "successful", "succeeded"].includes(
          result.paymentStatus.toLowerCase(),
        )
      ) {
        setReceiptError(
          "The screenshot does not show a completed payment. Upload the successful receipt.",
        );
      }
    } catch (err) {
      setReceiptError(
        getCheckoutErrorMessage(
          err,
          "We couldn't read this screenshot. Try a clear image.",
        ),
      );
    } finally {
      setIsReadingReceipt(false);
    }
  };

  const handlePlaceOrder = async () => {
    setError(null);
    const normalizedPhone = normalizeIndianMobileNumber(phone);
    const nextFieldErrors: Partial<Record<ShippingField, string>> = {};
    if (!fullName.trim()) nextFieldErrors.fullName = "Enter your full name.";
    if (!street.trim()) nextFieldErrors.street = "Enter your street address.";
    if (!city.trim()) nextFieldErrors.city = "Enter your city.";
    if (!zip.trim()) nextFieldErrors.zip = "Enter your postal code.";
    if (!normalizedPhone) nextFieldErrors.phone = INDIAN_MOBILE_ERROR;
    setFieldErrors(nextFieldErrors);
    if (Object.keys(nextFieldErrors).length > 0 || !normalizedPhone) {
      return;
    }

    logClientAudit("order.place.attempt", {
      status: "info",
      email: clientUser?.email,
      userId: clientUser?.id,
      message: "Checkout place-order started",
      metadata: {
        itemCount: items.length,
        total,
        delivery,
        city: city.trim(),
        zip: zip.trim(),
      },
    });

    setIsPaying(true);
    try {
      const orderNumber = generateOrderNumber();
      const orderItems = items.map((item) => ({
        name: item.product.name,
        subtitle: item.subtitle,
        image: item.product.image,
        quantity: item.quantity,
        linePrice: item.linePrice,
        productId: item.product.id,
        weightGrams:
          item.product.weightGrams ?? DEFAULT_PRODUCT_WEIGHT_GRAMS,
      }));

      const completeDemoOrder = async () => {
        saveConfirmedOrder({
          orderNumber,
          deliveryMethod: delivery,
          deliveryLabel: getDeliveryLabel(delivery),
          estimatedDelivery: getEstimatedDelivery(delivery),
          subtotal,
          shipping,
          processingFee,
          shipmentWeightGrams,
          tax,
          total,
          items: orderItems,
        });

        clearSavedCheckout();
        clearCart();
        navigate({ to: "/checkout/success" });
      };

      if (isStaticSite) {
        await completeDemoOrder();
        return;
      }

      const payment = await createUpiPayment({
        data: {
          orderNumber,
          customer: {
            userId: clientUser.id,
            name: fullName.trim(),
            email: clientUser.email,
            phone: normalizedPhone,
            isGuest: false,
          },
          shippingAddress: {
            street: street.trim(),
            city: city.trim(),
            zip: zip.trim(),
          },
          deliveryMethod: delivery,
          deliveryLabel: getDeliveryLabel(delivery),
          estimatedDelivery: getEstimatedDelivery(delivery),
          subtotal,
          shipping,
          processingFee,
          shipmentWeightGrams,
          tax,
          total,
          items: orderItems,
        },
      });
      setPaymentCartFingerprint(getCartFingerprint(items, delivery));
      setUpiPayment(payment);
    } catch (err) {
      const message = getCheckoutErrorMessage(
        err,
        "We couldn't start checkout right now. Please try again.",
      );
      if (message !== "Payment cancelled.") {
        setError(message);
      } else {
        setError(null);
      }
    } finally {
      setIsPaying(false);
    }
  };

  const handleReportPayment = async () => {
    if (
      !upiPayment ||
      !receiptOcr?.transactionReference ||
      receiptOcr.amount === null ||
      !receiptMatchesPayment
    ) {
      return;
    }
    setError(null);
    setIsReportingPayment(true);
    try {
      const order = await reportUpiPayment({
        data: {
          paymentReference: upiPayment.paymentReference,
          receipt: receiptOcr,
        },
      });
      saveConfirmedOrder({ ...order, paymentStatus: "pending" });
      clearSavedCheckout();
      clearCart();
      window.location.assign("/checkout/success?payment=pending");
    } catch (err) {
      setError(
        getCheckoutErrorMessage(
          err,
          "We couldn't submit your payment report. Please try again.",
        ),
      );
    } finally {
      setIsReportingPayment(false);
    }
  };

  if (!cartReady || checkoutHydratedForUser !== clientUser.id) {
    return (
      <PageLayout>
        <div className="mx-auto max-w-2xl px-4 py-20 text-center text-sm text-muted-foreground md:px-8">
          Restoring your checkout…
        </div>
      </PageLayout>
    );
  }

  if (items.length === 0) {
    return (
      <PageLayout>
        <div className="mx-auto max-w-2xl px-4 py-20 text-center md:px-8">
          <h1 className="font-serif text-3xl text-burgundy">
            Your bag is empty
          </h1>
          {error ? (
            <p className="mt-4 text-sm text-red-700" role="alert">
              {error}
            </p>
          ) : null}
          <p className="mt-4 text-muted-foreground">
            Add pieces before checkout.
          </p>
          <Link
            to="/shop"
            className="mt-8 inline-flex bg-burgundy px-8 py-3.5 text-xs font-bold uppercase tracking-[0.15em] text-white hover:opacity-90"
          >
            Continue Shopping
          </Link>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="mx-auto max-w-7xl px-4 py-10 md:px-8 md:py-14">
        <h1 className="font-serif text-4xl text-burgundy md:text-5xl">
          Shipping &amp; Payment
        </h1>
        {clientUser ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Signed in as{" "}
            <span className="font-medium text-burgundy">
              {clientUser.email}
            </span>
          </p>
        ) : null}

        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_360px] lg:gap-12">
          <div className="space-y-6">
            {/* Shipping address */}
            <section className="rounded-2xl bg-blush-card/60 p-6 md:p-8">
              <div className="flex items-center gap-3">
                <StepBadge step={1} />
                <h2 className="font-serif text-xl text-foreground">
                  Shipping Address
                </h2>
              </div>
              <div className="mt-6 space-y-4">
                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Full Name
                  </span>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      setFieldErrors((current) => ({
                        ...current,
                        fullName: undefined,
                      }));
                    }}
                    autoComplete="name"
                    maxLength={100}
                    required
                    aria-invalid={Boolean(fieldErrors.fullName)}
                    aria-describedby={
                      fieldErrors.fullName ? "checkout-name-error" : undefined
                    }
                    className={cn(
                      "mt-2 w-full rounded-xl border bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-burgundy/20",
                      fieldErrors.fullName ? "border-red-500" : "border-border",
                    )}
                  />
                  {fieldErrors.fullName ? (
                    <p
                      id="checkout-name-error"
                      role="alert"
                      className="mt-1 text-xs text-red-700"
                    >
                      {fieldErrors.fullName}
                    </p>
                  ) : null}
                </label>
                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Street Address
                  </span>
                  <input
                    type="text"
                    value={street}
                    onChange={(e) => {
                      setStreet(e.target.value);
                      setFieldErrors((current) => ({
                        ...current,
                        street: undefined,
                      }));
                    }}
                    autoComplete="street-address"
                    maxLength={200}
                    required
                    aria-invalid={Boolean(fieldErrors.street)}
                    aria-describedby={
                      fieldErrors.street ? "checkout-street-error" : undefined
                    }
                    placeholder="2/1013, Ezhil Nagar"
                    className={cn(
                      "mt-2 w-full rounded-xl border bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-burgundy/20",
                      fieldErrors.street ? "border-red-500" : "border-border",
                    )}
                  />
                  {fieldErrors.street ? (
                    <p
                      id="checkout-street-error"
                      role="alert"
                      className="mt-1 text-xs text-red-700"
                    >
                      {fieldErrors.street}
                    </p>
                  ) : null}
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      City
                    </span>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => {
                        setCity(e.target.value);
                        setFieldErrors((current) => ({
                          ...current,
                          city: undefined,
                        }));
                      }}
                      autoComplete="address-level2"
                      maxLength={80}
                      required
                      aria-invalid={Boolean(fieldErrors.city)}
                      aria-describedby={
                        fieldErrors.city ? "checkout-city-error" : undefined
                      }
                      className={cn(
                        "mt-2 w-full rounded-xl border bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-burgundy/20",
                        fieldErrors.city ? "border-red-500" : "border-border",
                      )}
                    />
                    {fieldErrors.city ? (
                      <p
                        id="checkout-city-error"
                        role="alert"
                        className="mt-1 text-xs text-red-700"
                      >
                        {fieldErrors.city}
                      </p>
                    ) : null}
                  </label>
                  <label className="block">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Zip / Postal Code
                    </span>
                    <input
                      type="text"
                      value={zip}
                      onChange={(e) => {
                        setZip(e.target.value);
                        setFieldErrors((current) => ({
                          ...current,
                          zip: undefined,
                        }));
                      }}
                      autoComplete="postal-code"
                      maxLength={12}
                      required
                      aria-invalid={Boolean(fieldErrors.zip)}
                      aria-describedby={
                        fieldErrors.zip ? "checkout-zip-error" : undefined
                      }
                      className={cn(
                        "mt-2 w-full rounded-xl border bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-burgundy/20",
                        fieldErrors.zip ? "border-red-500" : "border-border",
                      )}
                    />
                    {fieldErrors.zip ? (
                      <p
                        id="checkout-zip-error"
                        role="alert"
                        className="mt-1 text-xs text-red-700"
                      >
                        {fieldErrors.zip}
                      </p>
                    ) : null}
                  </label>
                </div>
                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Phone Number
                  </span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      setFieldErrors((current) => ({
                        ...current,
                        phone: undefined,
                      }));
                    }}
                    autoComplete="tel"
                    inputMode="tel"
                    maxLength={20}
                    required
                    aria-invalid={Boolean(fieldErrors.phone)}
                    aria-describedby={
                      fieldErrors.phone ? "checkout-phone-error" : undefined
                    }
                    placeholder="+91 98765 43210"
                    className={cn(
                      "mt-2 w-full rounded-xl border bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-burgundy/20",
                      fieldErrors.phone ? "border-red-500" : "border-border",
                    )}
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Enter 10 digits; you may include the +91 country code.
                  </p>
                  {fieldErrors.phone ? (
                    <p
                      id="checkout-phone-error"
                      role="alert"
                      className="mt-1 text-xs text-red-700"
                    >
                      {fieldErrors.phone}
                    </p>
                  ) : null}
                </label>
              </div>
            </section>

            {/* Delivery */}
            <section className="rounded-2xl bg-blush-card/60 p-6 md:p-8">
              <div className="flex items-center gap-3">
                <StepBadge step={2} />
                <h2 className="font-serif text-xl text-foreground">
                  Delivery Method
                </h2>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                Product weight: {formatWeightGrams(shipmentWeightGrams)} total.
                Courier charges are rounded up to {billableWeightKg} kg.
              </p>
              <div className="mt-6 space-y-3">
                {deliveryOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setDelivery(option.id)}
                    disabled={Boolean(upiPayment)}
                    className={cn(
                      "w-full rounded-xl border-2 bg-white p-4 text-left transition-colors",
                      delivery === option.id
                        ? "border-burgundy"
                        : "border-transparent hover:border-border",
                      upiPayment && "cursor-not-allowed opacity-60",
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium text-foreground">
                          {option.label}{" "}
                          <span className="text-muted-foreground">
                            ({formatPrice(option.pricePerKg)} / kg)
                          </span>
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {option.eta}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {option.note} Estimated shipping:{" "}
                          {formatPrice(option.pricePerKg * billableWeightKg)}.
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            {/* UPI payment */}
            <section className="rounded-2xl bg-blush-card/60 p-6 md:p-8">
              <div className="flex items-center gap-3">
                <StepBadge step={3} />
                <h2 className="font-serif text-xl text-foreground">
                  Payment Method
                </h2>
              </div>
              <div className="mt-6 rounded-xl border border-burgundy/20 bg-white p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-foreground">
                      UPI QR Payment
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Scan the one-time QR code using any UPI app.
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-burgundy">
                    <Lock className="size-3.5" />
                    Secure
                  </div>
                </div>
                <p className="mt-4 text-xs text-muted-foreground">
                  Upload your payment screenshot to read its amount, order
                  reference, UTR, status, time, and payer/payee details. OCR
                  only assists the report; payment still needs a manual
                  bank-record check.
                </p>
              </div>

              {upiPayment ? (
                <div className="mt-5 rounded-xl border border-border bg-white p-5 text-center">
                  <p className="font-semibold text-foreground">
                    Pay {formatPrice(Number(upiPayment.amount))}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    To {upiPayment.payeeName} · {upiPayment.upiId}
                  </p>
                  <div className="mx-auto mt-4 w-fit rounded-xl border border-border bg-white p-3">
                    <QRCodeSVG value={upiPayment.upiUri} size={220} level="M" />
                  </div>
                  <a
                    href={upiPayment.upiUri}
                    className="mt-4 inline-flex rounded-lg bg-burgundy px-5 py-3 text-xs font-bold uppercase tracking-wider text-white md:hidden"
                  >
                    Open UPI app
                  </a>
                  <p className="mt-4 text-left text-xs leading-relaxed text-muted-foreground">
                    Complete the payment in your UPI app, then upload its
                    successful receipt. Do not upload a screenshot that shows
                    your UPI PIN.
                  </p>
                  <label className="mt-4 block text-left">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Payment screenshot
                    </span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      disabled={isReadingReceipt || isReportingPayment}
                      onChange={(event) => {
                        const file = event.currentTarget.files?.[0];
                        event.currentTarget.value = "";
                        void handleReceiptUpload(file);
                      }}
                      className="mt-2 w-full rounded-lg border border-border px-4 py-3 text-sm outline-none file:mr-3 file:rounded-md file:border-0 file:bg-burgundy file:px-3 file:py-2 file:text-xs file:font-bold file:text-white"
                    />
                  </label>
                  <p className="mt-2 text-left text-xs text-muted-foreground">
                    The image is read in your browser and isn&apos;t uploaded or
                    saved. Parsed details stay in this tab across refresh and
                    are sent for admin review when you submit. You&apos;ll need
                    to select the screenshot again after a refresh.
                  </p>
                  {isReadingReceipt ? (
                    <p className="mt-3 text-left text-sm text-muted-foreground">
                      Reading screenshot…
                    </p>
                  ) : null}
                  {receiptOcr ? (
                    <div className="mt-3 rounded-lg bg-blush-section p-3 text-left text-sm">
                      <p>
                        Detected amount:{" "}
                        {receiptOcr.amount === null
                          ? "Not found"
                          : formatPrice(receiptOcr.amount)}
                      </p>
                      <p className="mt-1 break-all">
                        Detected UTR:{" "}
                        {receiptOcr.transactionReference ?? "Not found"}
                      </p>
                      <p className="mt-1">
                        Detected status: {receiptOcr.paymentStatus ?? "Not found"}
                      </p>
                    </div>
                  ) : null}
                  {receiptError ? (
                    <p className="mt-3 text-left text-sm text-red-700">
                      {receiptError}
                    </p>
                  ) : null}
                  <button
                    type="button"
                    disabled={
                      isReportingPayment ||
                      isReadingReceipt ||
                      !receiptOcr?.transactionReference ||
                      !receiptMatchesPayment
                    }
                    onClick={() => void handleReportPayment()}
                    className="mt-4 w-full rounded-lg bg-burgundy px-5 py-3 text-xs font-bold uppercase tracking-wider text-white disabled:opacity-60"
                  >
                    {isReportingPayment
                      ? "Submitting…"
                      : "I’ve paid — submit for verification"}
                  </button>
                  <p className="mt-3 text-left text-xs leading-relaxed text-amber-800">
                    Your order stays pending until the payment is checked in the
                    bank account. A QR scan or email alert alone does not
                    confirm payment.
                  </p>
                </div>
              ) : null}

              <label className="mt-5 flex items-center gap-3 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  checked={billingSameAsShipping}
                  onChange={(e) => setBillingSameAsShipping(e.target.checked)}
                  className="size-4 rounded border-border text-burgundy focus:ring-burgundy/30"
                />
                Billing address same as shipping
              </label>
            </section>
          </div>

          {/* Order summary */}
          <aside className="rounded-2xl border border-border bg-white p-6 shadow-sm md:p-8 lg:sticky lg:top-24 lg:self-start">
            <h2 className="font-serif text-2xl text-foreground">
              Order Summary
            </h2>
            <ul className="mt-6 space-y-4">
              {items.map((item) => (
                <li key={getCartItemKey(item)} className="flex gap-3">
                  <img
                    src={item.product.image}
                    alt=""
                    className="size-14 shrink-0 rounded-lg object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {item.product.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatWeightGrams(
                        (item.product.weightGrams ??
                          DEFAULT_PRODUCT_WEIGHT_GRAMS) * item.quantity,
                      )}{" "}
                      total · Qty: {item.quantity}
                    </p>
                  </div>
                  <Price
                    amount={item.linePrice * item.quantity}
                    className="shrink-0"
                  />
                </li>
              ))}
            </ul>

            <div className="mt-6 flex gap-2">
              <input
                type="text"
                placeholder="Enter code"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-burgundy/20"
              />
              <button
                type="button"
                className="rounded-lg border border-border px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-burgundy hover:bg-muted"
              >
                Apply
              </button>
            </div>

            <dl className="mt-6 space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd>
                  <Price amount={subtotal} />
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">
                  Shipping ({deliveryOptions.find((option) => option.id === delivery)?.label})
                </dt>
                <dd className="font-medium">
                  <Price amount={shipping} />
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Processing fee</dt>
                <dd>
                  <Price amount={processingFee} />
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Tax</dt>
                <dd>
                  <Price amount={tax} />
                </dd>
              </div>
              <div className="flex justify-between gap-4 border-t border-border pt-4">
                <dt className="font-semibold text-foreground">Total</dt>
                <dd>
                  <Price amount={total} emphasis className="text-base" />
                </dd>
              </div>
            </dl>

            {error && (
              <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </p>
            )}

            <button
              type="button"
              disabled={isPaying || Boolean(upiPayment)}
              onClick={handlePlaceOrder}
              className="mt-6 flex w-full items-center justify-center bg-burgundy py-4 text-xs font-bold uppercase tracking-[0.15em] text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {isPaying
                ? "Preparing QR…"
                : upiPayment
                  ? "QR ready"
                  : "Place Order"}
            </button>
            <p className="mt-4 text-center text-xs text-muted-foreground">
              By placing an order, you agree to our Terms and Privacy Policy.
            </p>
          </aside>
        </div>
      </div>
    </PageLayout>
  );
}
