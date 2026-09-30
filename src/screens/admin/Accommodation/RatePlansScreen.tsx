import { useEffect, useId, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { PageError, PageLoading } from "../../../components/common/PageState";
import { useAuth } from "../../../context/AuthContext";
import { ApiError } from "../../../lib/api";
import type { Raw } from "../../../lib/normalize";
import {
  createRatePlan,
  createRatePlanPrice,
  deleteRatePlan,
  getRatePlan,
  listAccommodationTypes,
  listMealPlans,
  listRatePlans,
  toRatePlanPrice,
  updateRatePlan,
} from "../../../services/admin/accommodationService.service";
import { getProperty } from "../../../services/superAdmin/propertyService.service";
import {
  DAY_OF_WEEK_LABELS,
  PRICING_BASIS_LABELS,
  dayOfWeekLabel,
  pricingBasisLabel,
  type AccommodationType,
  type MealPlan,
  type RatePlan,
  type RatePlanPrice,
} from "../../../types/accommodation";
import "./RatePlansScreen.css";

type Draft = {
  accommodationTypeUid: string;
  mealPlanUid: string;
  code: string;
  name: string;
  pricingBasis: string;
  currency: string;
  description: string;
  isRefundable: boolean;
};

type PriceDraft = {
  startDate: string;
  endDate: string;
  unitRate: string;
  dayOfWeek: string;
  adultRate: string;
  childRate: string;
  minimumStay: string;
};

const isoDate = (date: Date) => {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
};

const addDays = (iso: string, days: number) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  const date = match
    ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
    : new Date();
  date.setDate(date.getDate() + days);
  return isoDate(date);
};

const formatDate = (iso: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!match) return iso;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])).toLocaleDateString(
    undefined,
    { day: "numeric", month: "short", year: "numeric" },
  );
};

const money = (amount: number, currency: string) => {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency || "LKR",
      maximumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    }).format(amount);
  } catch {
    return `${amount.toLocaleString()} ${currency}`;
  }
};

const emptyDraft = (typeUid = "", currency = "LKR"): Draft => ({
  accommodationTypeUid: typeUid,
  mealPlanUid: "",
  code: "",
  name: "",
  pricingBasis: "0",
  currency,
  description: "",
  isRefundable: true,
});

const emptyPrice = (): PriceDraft => {
  const startDate = isoDate(new Date());
  return {
    startDate,
    endDate: addDays(startDate, 30),
    unitRate: "",
    dayOfWeek: "",
    adultRate: "",
    childRate: "",
    minimumStay: "1",
  };
};

const pricesKey = (propertyUid: string) => `hms.rate-prices.${propertyUid}`;

const readPrices = (propertyUid: string): RatePlanPrice[] => {
  try {
    const raw = localStorage.getItem(pricesKey(propertyUid));
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const price = toRatePlanPrice(item as Raw);
      return price.uid && price.ratePlanUid ? [price] : [];
    });
  } catch {
    return [];
  }
};

const writePrices = (propertyUid: string, prices: RatePlanPrice[]) => {
  localStorage.setItem(pricesKey(propertyUid), JSON.stringify(prices));
};

const amount = (value: string) => {
  if (!value.trim()) return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return undefined;
  return n;
};

export default function RatePlansScreen() {
  const { user } = useAuth();
  const propertyUid = user?.propertyUid || user?.propertyUids?.[0] || "";
  const editorTitleId = useId();
  const priceTitleId = useId();
  const archiveTitleId = useId();

  const [plans, setPlans] = useState<RatePlan[]>([]);
  const [types, setTypes] = useState<AccommodationType[]>([]);
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [prices, setPrices] = useState<RatePlanPrice[]>([]);
  const [currency, setCurrency] = useState("LKR");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tick, setTick] = useState(0);
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");

  const [editor, setEditor] = useState<"create" | string | null>(null);
  const [editorLoading, setEditorLoading] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [pendingArchive, setPendingArchive] = useState<RatePlan | null>(null);
  const [archiving, setArchiving] = useState(false);
  const [archiveError, setArchiveError] = useState("");

  const [pricing, setPricing] = useState<RatePlan | null>(null);
  const [priceDraft, setPriceDraft] = useState<PriceDraft>(emptyPrice);
  const [priceSaving, setPriceSaving] = useState(false);
  const [priceError, setPriceError] = useState("");

  useEffect(() => {
    if (!propertyUid) {
      setLoading(false);
      return;
    }
    setPrices(readPrices(propertyUid));
    let active = true;
    setLoading(true);
    setError("");
    Promise.all([
      listRatePlans(propertyUid),
      listAccommodationTypes(propertyUid),
      listMealPlans(propertyUid),
    ])
      .then(([nextPlans, nextTypes, nextMeals]) => {
        if (!active) return;
        setPlans(nextPlans);
        setTypes(nextTypes);
        setMealPlans(nextMeals);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(err instanceof ApiError ? err.message : "Could not load rate plans.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    getProperty(propertyUid)
      .then((property) => {
        if (active && property.defaultCurrency) setCurrency(property.defaultCurrency);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [propertyUid, tick]);

  useEffect(() => {
    if (!editor && !pricing && !pendingArchive) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || saving || priceSaving || archiving || editorLoading) return;
      setEditor(null);
      setPricing(null);
      setPendingArchive(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [editor, pricing, pendingArchive, saving, priceSaving, archiving, editorLoading]);

  const typeName = useMemo(() => {
    const names = new Map(types.map((type) => [type.uid, type.name]));
    return (uid: string) => names.get(uid) || "Unknown type";
  }, [types]);

  const mealName = useMemo(() => {
    const names = new Map(mealPlans.map((plan) => [plan.uid, plan.name]));
    return (uid: string) => (uid ? names.get(uid) || "Meal plan" : "No meal plan");
  }, [mealPlans]);

  const pricesFor = (ratePlanUid: string) =>
    prices
      .filter((price) => price.ratePlanUid === ratePlanUid && price.isActive)
      .sort((a, b) => a.startDate.localeCompare(b.startDate));

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...plans]
      .sort((a, b) => a.name.localeCompare(b.name) || a.code.localeCompare(b.code))
      .filter((plan) =>
        `${plan.code} ${plan.name} ${plan.description} ${typeName(plan.accommodationTypeUid)} ${mealName(plan.mealPlanUid)} ${pricingBasisLabel(plan.pricingBasis)}`
          .toLowerCase()
          .includes(q),
      );
  }, [plans, query, typeName, mealName]);

  const rememberPrices = (next: RatePlanPrice[]) => {
    setPrices(next);
    if (propertyUid) writePrices(propertyUid, next);
  };

  const openCreate = () => {
    setNotice("");
    setSaveError("");
    setPricing(null);
    setPendingArchive(null);
    setDraft(
      emptyDraft(types.find((type) => type.isActive)?.uid || types[0]?.uid || "", currency),
    );
    setEditor("create");
  };

  const openEdit = (uid: string) => {
    setNotice("");
    setSaveError("");
    setPricing(null);
    setPendingArchive(null);
    setDraft(null);
    setEditor(uid);
    setEditorLoading(true);
    getRatePlan(uid)
      .then((plan) =>
        setDraft({
          accommodationTypeUid: plan.accommodationTypeUid,
          mealPlanUid: plan.mealPlanUid,
          code: plan.code,
          name: plan.name,
          pricingBasis: String(plan.pricingBasis),
          currency: plan.currency,
          description: plan.description,
          isRefundable: plan.isRefundable,
        }),
      )
      .catch((err: unknown) => {
        setSaveError(err instanceof ApiError ? err.message : "Could not load this rate plan.");
      })
      .finally(() => setEditorLoading(false));
  };

  const openPrice = (plan: RatePlan) => {
    setNotice("");
    setPriceError("");
    setEditor(null);
    setPendingArchive(null);
    setPriceDraft(emptyPrice());
    setPricing(plan);
  };

  const onChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = event.target;
    const next =
      type === "checkbox" && event.target instanceof HTMLInputElement
        ? event.target.checked
        : name === "code" || name === "currency"
          ? value.toUpperCase()
          : value;
    setDraft((current) => (current ? { ...current, [name]: next } : current));
  };

  const onPriceChange = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target;
    setPriceDraft((current) => ({ ...current, [name]: value }));
  };

  const onSave = async (event: FormEvent) => {
    event.preventDefault();
    if (!propertyUid || !editor || !draft) return;
    setSaveError("");

    const code = draft.code.trim().toUpperCase();
    const name = draft.name.trim();
    const planCurrency = draft.currency.trim().toUpperCase();
    if (editor === "create" && !draft.accommodationTypeUid) {
      return setSaveError("Choose an accommodation type.");
    }
    if (!code || !name) return setSaveError("Enter a code and a name.");
    if (code.length > 30) return setSaveError("Code cannot exceed 30 characters.");
    if (name.length > 150) return setSaveError("Name cannot exceed 150 characters.");
    if (planCurrency.length !== 3) return setSaveError("Currency must be a 3-letter code.");

    const shared = {
      code,
      name,
      pricingBasis: Number(draft.pricingBasis),
      currency: planCurrency,
      description: draft.description.trim() || null,
      isRefundable: draft.isRefundable,
    };

    setSaving(true);
    try {
      if (editor === "create") {
        await createRatePlan(propertyUid, {
          ...shared,
          accommodationTypeUid: draft.accommodationTypeUid,
          mealPlanUid: draft.mealPlanUid || null,
        });
        setNotice(`${name} added.`);
      } else {
        await updateRatePlan(editor, shared);
        setNotice(`${name} updated.`);
      }
      setEditor(null);
      setTick((n) => n + 1);
    } catch (err) {
      setSaveError(
        err instanceof ApiError
          ? err.message
          : editor === "create"
            ? "Could not add this rate plan."
            : "Could not update this rate plan.",
      );
    } finally {
      setSaving(false);
    }
  };

  const onArchive = async () => {
    if (!pendingArchive) return;
    setArchiveError("");
    setArchiving(true);
    try {
      await deleteRatePlan(pendingArchive.uid);
      setNotice(`${pendingArchive.name} archived.`);
      setPendingArchive(null);
      setTick((n) => n + 1);
    } catch (err) {
      setArchiveError(err instanceof ApiError ? err.message : "Could not archive this rate plan.");
    } finally {
      setArchiving(false);
    }
  };

  const onAddPrice = async (event: FormEvent) => {
    event.preventDefault();
    if (!pricing) return;
    setPriceError("");

    if (!priceDraft.startDate || !priceDraft.endDate) {
      return setPriceError("Choose a start and end date.");
    }
    if (priceDraft.endDate < priceDraft.startDate) {
      return setPriceError("End date cannot be before the start date.");
    }
    const unitRate = amount(priceDraft.unitRate);
    if (unitRate === undefined || unitRate === null) {
      return setPriceError("Enter a unit rate of zero or more.");
    }
    const adultRate = amount(priceDraft.adultRate);
    const childRate = amount(priceDraft.childRate);
    if (adultRate === undefined || childRate === undefined) {
      return setPriceError("Adult and child rates must be zero or more.");
    }
    const minimumStay = Number(priceDraft.minimumStay);
    if (!Number.isInteger(minimumStay) || minimumStay < 1) {
      return setPriceError("Minimum stay must be at least 1 night.");
    }
    const dayOfWeek = priceDraft.dayOfWeek === "" ? null : Number(priceDraft.dayOfWeek);
    if (dayOfWeek !== null && (dayOfWeek < 0 || dayOfWeek > 6)) {
      return setPriceError("Choose a day of the week, or leave it as every day.");
    }

    setPriceSaving(true);
    try {
      const created = await createRatePlanPrice(pricing.uid, {
        startDate: priceDraft.startDate,
        endDate: priceDraft.endDate,
        unitRate,
        dayOfWeek,
        adultRate,
        childRate,
        minimumStay,
      });
      if (!created.uid) {
        setPriceError("The price was saved, but it came back without an id.");
        return;
      }
      rememberPrices([...prices.filter((price) => price.uid !== created.uid), created]);
      setNotice(`Price added to ${pricing.code}.`);
      setPriceDraft(emptyPrice());
    } catch (err) {
      setPriceError(err instanceof ApiError ? err.message : "Could not add this price.");
    } finally {
      setPriceSaving(false);
    }
  };

  const activeTypes = types.filter((type) => type.isActive);
  const activeMeals = mealPlans.filter((plan) => plan.isActive);

  return (
    <div className="rp-page">
      {!propertyUid && (
        <p className="rp-empty-note">This account is not assigned to a property.</p>
      )}

      {propertyUid && (
        <header className="rp-hero">
          <div>
            <p className="rp-kicker">Accommodation</p>
            <h1>Rate plans</h1>
            <p>Sell a room type with a meal plan, then set the rate for each date range.</p>
          </div>
          <button
            type="button"
            className="rp-add"
            onClick={openCreate}
            disabled={loading || !!error || activeTypes.length === 0}
          >
            Add rate plan
          </button>
        </header>
      )}

      {propertyUid && loading && <PageLoading />}
      {propertyUid && !loading && error && (
        <PageError message={error} onRetry={() => setTick((n) => n + 1)} />
      )}

      {propertyUid && !loading && !error && (
        <>
          {notice && <p className="rp-notice">{notice}</p>}
          {activeTypes.length === 0 && (
            <p className="rp-empty-note">Add an accommodation type before creating a rate plan.</p>
          )}
          {plans.length > 0 && (
            <input
              className="rp-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by code, name, room type, or meal plan"
            />
          )}

          {visible.length === 0 ? (
            <div className="rp-blank">
              <h2>{plans.length === 0 ? "No rate plans yet" : "No matches"}</h2>
              <p>
                {plans.length === 0
                  ? "Add a best available rate, or another plan tied to a room type."
                  : "Try a different code or name."}
              </p>
            </div>
          ) : (
            <div className="rp-grid">
              {visible.map((plan) => {
                const planPrices = pricesFor(plan.uid);
                return (
                  <article key={plan.uid} className="rp-card">
                    <div className="rp-card-top">
                      <div>
                        <div className="rp-code">{plan.code}</div>
                        <h2>{plan.name}</h2>
                      </div>
                      <span className={`rp-badge ${plan.isActive ? "" : "off"}`}>
                        {plan.isRefundable ? "Refundable" : "Non-refundable"}
                      </span>
                    </div>
                    {plan.description && <p className="rp-desc">{plan.description}</p>}
                    <ul className="rp-meta">
                      <li>{typeName(plan.accommodationTypeUid)}</li>
                      <li>{mealName(plan.mealPlanUid)}</li>
                      <li>{pricingBasisLabel(plan.pricingBasis)}</li>
                      <li>{plan.currency}</li>
                    </ul>
                    {planPrices.length > 0 && (
                      <ul className="rp-prices">
                        {planPrices.slice(0, 2).map((price) => (
                          <li key={price.uid}>
                            <strong>{money(price.unitRate, plan.currency)}</strong>
                            <span>
                              {formatDate(price.startDate)} – {formatDate(price.endDate)}
                            </span>
                            <em>
                              {dayOfWeekLabel(price.dayOfWeek)} · {price.minimumStay} night
                              {price.minimumStay === 1 ? "" : "s"} min
                            </em>
                          </li>
                        ))}
                        {planPrices.length > 2 && <li>+{planPrices.length - 2} more</li>}
                      </ul>
                    )}
                    <div className="rp-card-actions">
                      <button
                        type="button"
                        className="rp-text-danger"
                        onClick={() => {
                          setArchiveError("");
                          setEditor(null);
                          setPricing(null);
                          setPendingArchive(plan);
                        }}
                      >
                        Archive
                      </button>
                      <button type="button" className="rp-text" onClick={() => openEdit(plan.uid)}>
                        Edit
                      </button>
                      <button type="button" className="rp-text" onClick={() => openPrice(plan)}>
                        {planPrices.length > 0 ? "Prices" : "Add price"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}

      {editor &&
        createPortal(
          <div className="rp-backdrop" onClick={() => !saving && !editorLoading && setEditor(null)}>
            <div
              className="rp-dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby={editorTitleId}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="rp-dialog-head">
                <h2 id={editorTitleId}>{editor === "create" ? "New rate plan" : "Edit rate plan"}</h2>
                <button
                  type="button"
                  className="rp-close"
                  aria-label="Close"
                  onClick={() => !saving && !editorLoading && setEditor(null)}
                >
                  ×
                </button>
              </div>
              {editorLoading && <p className="rp-hint">Loading this rate plan…</p>}
              {!editorLoading && !draft && saveError && <p className="rp-error">{saveError}</p>}
              {!editorLoading && draft && (
              <form className="rp-form" onSubmit={onSave}>
                {editor !== "create" && (
                  <p className="rp-hint rp-span">
                    Room type and meal plan stay as they are.
                  </p>
                )}
                <label>
                  Code
                  <input
                    name="code"
                    value={draft.code}
                    onChange={onChange}
                    maxLength={30}
                    placeholder="BAR"
                  />
                </label>
                <label>
                  Name
                  <input
                    name="name"
                    value={draft.name}
                    onChange={onChange}
                    maxLength={150}
                    placeholder="Best Available Rate"
                  />
                </label>
                <label>
                  Accommodation type
                  <select
                    name="accommodationTypeUid"
                    value={draft.accommodationTypeUid}
                    onChange={onChange}
                    disabled={editor !== "create"}
                  >
                    <option value="">Select a type</option>
                    {(editor === "create" ? activeTypes : types).map((type) => (
                      <option key={type.uid} value={type.uid}>
                        {type.name}
                      </option>
                    ))}
                    {editor !== "create" &&
                      draft.accommodationTypeUid &&
                      !types.some((type) => type.uid === draft.accommodationTypeUid) && (
                        <option value={draft.accommodationTypeUid}>
                          {typeName(draft.accommodationTypeUid)}
                        </option>
                      )}
                  </select>
                </label>
                <label>
                  Meal plan
                  <select
                    name="mealPlanUid"
                    value={draft.mealPlanUid}
                    onChange={onChange}
                    disabled={editor !== "create"}
                  >
                    <option value="">None</option>
                    {(editor === "create" ? activeMeals : mealPlans).map((plan) => (
                      <option key={plan.uid} value={plan.uid}>
                        {plan.name}
                      </option>
                    ))}
                    {editor !== "create" &&
                      draft.mealPlanUid &&
                      !mealPlans.some((plan) => plan.uid === draft.mealPlanUid) && (
                        <option value={draft.mealPlanUid}>{mealName(draft.mealPlanUid)}</option>
                      )}
                  </select>
                </label>
                <label>
                  Pricing
                  <select name="pricingBasis" value={draft.pricingBasis} onChange={onChange}>
                    {Object.entries(PRICING_BASIS_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Currency
                  <input
                    name="currency"
                    value={draft.currency}
                    onChange={onChange}
                    maxLength={3}
                    placeholder="LKR"
                  />
                </label>
                <label className="rp-span">
                  Description
                  <textarea
                    name="description"
                    rows={2}
                    value={draft.description}
                    onChange={onChange}
                    placeholder="Flexible BAR"
                  />
                </label>
                <label className="rp-switch">
                  <input
                    name="isRefundable"
                    type="checkbox"
                    checked={draft.isRefundable}
                    onChange={onChange}
                  />
                  Refundable
                </label>
                {saveError && <p className="rp-error">{saveError}</p>}
                <div className="rp-form-actions">
                  <button
                    type="button"
                    className="rp-ghost"
                    onClick={() => setEditor(null)}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="rp-save" disabled={saving}>
                    {saving ? "Saving…" : editor === "create" ? "Add rate plan" : "Save changes"}
                  </button>
                </div>
              </form>
              )}
            </div>
          </div>,
          document.body,
        )}

      {pricing &&
        createPortal(
          <div className="rp-backdrop" onClick={() => !priceSaving && setPricing(null)}>
            <div
              className="rp-dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby={priceTitleId}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="rp-dialog-head">
                <h2 id={priceTitleId}>Prices for {pricing.name}</h2>
                <button
                  type="button"
                  className="rp-close"
                  aria-label="Close"
                  onClick={() => !priceSaving && setPricing(null)}
                >
                  ×
                </button>
              </div>
              <p className="rp-hint">
                The end date can be the same day as the start. Leave the weekday blank to apply
                every day. Adult and child rates are optional.
              </p>
              <div className="rp-price-list">
                {pricesFor(pricing.uid).length === 0 ? (
                  <p className="rp-hint">No prices on this plan yet.</p>
                ) : (
                  pricesFor(pricing.uid).map((price) => (
                    <div key={price.uid} className="rp-price-row">
                      <strong>{money(price.unitRate, pricing.currency)}</strong>
                      <span>
                        {formatDate(price.startDate)} – {formatDate(price.endDate)}
                      </span>
                      <em>
                        {dayOfWeekLabel(price.dayOfWeek)}
                        {price.adultRate !== null ? ` · Adult ${money(price.adultRate, pricing.currency)}` : ""}
                        {price.childRate !== null ? ` · Child ${money(price.childRate, pricing.currency)}` : ""}
                        {` · ${price.minimumStay} night${price.minimumStay === 1 ? "" : "s"} min`}
                      </em>
                    </div>
                  ))
                )}
              </div>
              <form className="rp-form" onSubmit={onAddPrice}>
                <label>
                  Start date
                  <input
                    name="startDate"
                    type="date"
                    value={priceDraft.startDate}
                    onChange={onPriceChange}
                    required
                  />
                </label>
                <label>
                  End date
                  <input
                    name="endDate"
                    type="date"
                    value={priceDraft.endDate}
                    onChange={onPriceChange}
                    required
                  />
                </label>
                <label>
                  Unit rate
                  <input
                    name="unitRate"
                    type="number"
                    min={0}
                    step="0.01"
                    value={priceDraft.unitRate}
                    onChange={onPriceChange}
                    placeholder="25000"
                  />
                </label>
                <label>
                  Weekday
                  <select name="dayOfWeek" value={priceDraft.dayOfWeek} onChange={onPriceChange}>
                    <option value="">Every day</option>
                    {Object.entries(DAY_OF_WEEK_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Adult rate
                  <input
                    name="adultRate"
                    type="number"
                    min={0}
                    step="0.01"
                    value={priceDraft.adultRate}
                    onChange={onPriceChange}
                    placeholder="Optional"
                  />
                </label>
                <label>
                  Child rate
                  <input
                    name="childRate"
                    type="number"
                    min={0}
                    step="0.01"
                    value={priceDraft.childRate}
                    onChange={onPriceChange}
                    placeholder="Optional"
                  />
                </label>
                <label>
                  Minimum stay
                  <input
                    name="minimumStay"
                    type="number"
                    min={1}
                    step={1}
                    value={priceDraft.minimumStay}
                    onChange={onPriceChange}
                  />
                </label>
                {priceError && <p className="rp-error">{priceError}</p>}
                <div className="rp-form-actions">
                  <button
                    type="button"
                    className="rp-ghost"
                    onClick={() => setPricing(null)}
                    disabled={priceSaving}
                  >
                    Close
                  </button>
                  <button type="submit" className="rp-save" disabled={priceSaving}>
                    {priceSaving ? "Saving…" : "Add price"}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body,
        )}

      {pendingArchive &&
        createPortal(
          <div className="rp-backdrop" onClick={() => !archiving && setPendingArchive(null)}>
            <div
              className="rp-dialog rp-confirm"
              role="dialog"
              aria-modal="true"
              aria-labelledby={archiveTitleId}
              onClick={(event) => event.stopPropagation()}
            >
              <h2 id={archiveTitleId}>Archive {pendingArchive.name}?</h2>
              <p>This hides the plan from new bookings. Prices already on it stay linked.</p>
              {archiveError && <p className="rp-error">{archiveError}</p>}
              <div className="rp-form-actions">
                <button
                  type="button"
                  className="rp-ghost"
                  onClick={() => setPendingArchive(null)}
                  disabled={archiving}
                >
                  Keep
                </button>
                <button type="button" className="rp-danger" onClick={onArchive} disabled={archiving}>
                  {archiving ? "Archiving…" : "Archive"}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
