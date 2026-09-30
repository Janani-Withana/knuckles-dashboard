import { useEffect, useId, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { PageError, PageLoading } from "../../../components/common/PageState";
import { useAuth } from "../../../context/AuthContext";
import { ApiError } from "../../../lib/api";
import {
  createAccommodationUnit,
  createUnitBlock,
  deleteUnitBlock,
  getAccommodationUnit,
  listAccommodationTypes,
  listAccommodationUnits,
  toUnitBlock,
  updateAccommodationUnit,
} from "../../../services/accommodationService.service";
import {
  BLOCK_TYPE_LABELS,
  HOUSEKEEPING_STATUS_LABELS,
  UNIT_STATUS_LABELS,
  blockTypeLabel,
  housekeepingStatusLabel,
  unitStatusLabel,
  type AccommodationType,
  type AccommodationUnit,
  type UnitBlock,
} from "../../../types/accommodation";
import type { Raw } from "../../../lib/normalize";
import "./RoomsScreen.css";

type Draft = {
  accommodationTypeUid: string;
  unitCode: string;
  unitName: string;
  floorOrArea: string;
  status: string;
  housekeepingStatus: string;
  notes: string;
  isActive: boolean;
};

type BlockDraft = {
  startDate: string;
  endDate: string;
  blockType: string;
  reason: string;
};

const emptyDraft = (typeUid = ""): Draft => ({
  accommodationTypeUid: typeUid,
  unitCode: "",
  unitName: "",
  floorOrArea: "",
  status: "0",
  housekeepingStatus: "0",
  notes: "",
  isActive: true,
});

const draftFrom = (unit: AccommodationUnit): Draft => ({
  accommodationTypeUid: unit.accommodationTypeUid,
  unitCode: unit.unitCode,
  unitName: unit.unitName,
  floorOrArea: unit.floorOrArea,
  status: String(unit.status),
  housekeepingStatus: String(unit.housekeepingStatus),
  notes: unit.notes,
  isActive: unit.isActive,
});

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

const emptyBlock = (): BlockDraft => {
  const startDate = isoDate(new Date());
  return {
    startDate,
    endDate: addDays(startDate, 1),
    blockType: "0",
    reason: "",
  };
};

const formatDate = (iso: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!match) return iso;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])).toLocaleDateString(
    undefined,
    { day: "numeric", month: "short", year: "numeric" },
  );
};

const statusTone = (status: number) => {
  if (status === 1) return "occupied";
  if (status === 2) return "out";
  if (status === 3) return "maintenance";
  if (status === 4) return "inactive";
  return "available";
};

const blocksKey = (propertyUid: string) => `hms.unit-blocks.${propertyUid}`;

const readBlocks = (propertyUid: string): UnitBlock[] => {
  try {
    const raw = localStorage.getItem(blocksKey(propertyUid));
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const block = toUnitBlock(item as Raw);
      return block.uid && block.unitUid ? [block] : [];
    });
  } catch {
    return [];
  }
};

const writeBlocks = (propertyUid: string, blocks: UnitBlock[]) => {
  localStorage.setItem(blocksKey(propertyUid), JSON.stringify(blocks));
};

export default function RoomsScreen() {
  const { user } = useAuth();
  const propertyUid = user?.propertyUid || user?.propertyUids?.[0] || "";
  const editorTitleId = useId();
  const blockTitleId = useId();

  const [units, setUnits] = useState<AccommodationUnit[]>([]);
  const [types, setTypes] = useState<AccommodationType[]>([]);
  const [blocks, setBlocks] = useState<UnitBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tick, setTick] = useState(0);
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");

  const [editor, setEditor] = useState<"create" | string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [editorLoading, setEditorLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const [blocking, setBlocking] = useState<AccommodationUnit | null>(null);
  const [blockDraft, setBlockDraft] = useState<BlockDraft>(emptyBlock);
  const [blockSaving, setBlockSaving] = useState(false);
  const [blockError, setBlockError] = useState("");
  const [pendingUnblock, setPendingUnblock] = useState<string | null>(null);
  const [unblocking, setUnblocking] = useState(false);

  useEffect(() => {
    if (!propertyUid) {
      setLoading(false);
      return;
    }
    setBlocks(readBlocks(propertyUid));
    let active = true;
    setLoading(true);
    setError("");
    Promise.all([listAccommodationUnits(propertyUid), listAccommodationTypes(propertyUid)])
      .then(([nextUnits, nextTypes]) => {
        if (!active) return;
        setUnits(nextUnits);
        setTypes(nextTypes);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(err instanceof ApiError ? err.message : "Could not load rooms.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [propertyUid, tick]);

  useEffect(() => {
    if (!editor && !blocking) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || saving || blockSaving || unblocking) return;
      setEditor(null);
      setBlocking(null);
      setPendingUnblock(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [editor, blocking, saving, blockSaving, unblocking]);

  const typeName = useMemo(() => {
    const names = new Map(types.map((type) => [type.uid, type.name]));
    return (uid: string) => names.get(uid) || "Unknown type";
  }, [types]);

  const blocksFor = (unitUid: string) =>
    blocks
      .filter((block) => block.unitUid === unitUid && block.isActive)
      .sort((a, b) => a.startDate.localeCompare(b.startDate) || a.endDate.localeCompare(b.endDate));

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...units]
      .sort((a, b) => a.unitCode.localeCompare(b.unitCode, undefined, { numeric: true }))
      .filter((unit) =>
        `${unit.unitCode} ${unit.unitName} ${unit.floorOrArea} ${typeName(unit.accommodationTypeUid)} ${unitStatusLabel(unit.status)}`
          .toLowerCase()
          .includes(q),
      );
  }, [units, query, typeName]);

  const rememberBlocks = (next: UnitBlock[]) => {
    setBlocks(next);
    if (propertyUid) writeBlocks(propertyUid, next);
  };

  const openCreate = () => {
    setNotice("");
    setSaveError("");
    setBlocking(null);
    setDraft(emptyDraft(types.find((type) => type.isActive)?.uid || types[0]?.uid || ""));
    setEditor("create");
  };

  const openEdit = (uid: string) => {
    setNotice("");
    setSaveError("");
    setBlocking(null);
    setDraft(null);
    setEditor(uid);
    setEditorLoading(true);
    getAccommodationUnit(uid)
      .then((unit) => setDraft(draftFrom(unit)))
      .catch((err: unknown) => {
        setSaveError(err instanceof ApiError ? err.message : "Could not load this room.");
      })
      .finally(() => setEditorLoading(false));
  };

  const openBlock = (unit: AccommodationUnit) => {
    setNotice("");
    setBlockError("");
    setPendingUnblock(null);
    setEditor(null);
    setBlockDraft(emptyBlock());
    setBlocking(unit);
  };

  const onChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = event.target;
    const next =
      type === "checkbox" && event.target instanceof HTMLInputElement
        ? event.target.checked
        : value;
    setDraft((current) => (current ? { ...current, [name]: next } : current));
  };

  const onBlockChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target;
    setBlockDraft((current) => ({ ...current, [name]: value }));
  };

  const onSave = async (event: FormEvent) => {
    event.preventDefault();
    if (!draft || !propertyUid || !editor) return;
    setSaveError("");

    const unitCode = draft.unitCode.trim();
    if (!unitCode) return setSaveError("Enter a unit code.");
    if (unitCode.length > 50) return setSaveError("Unit code cannot exceed 50 characters.");
    if (!draft.accommodationTypeUid) return setSaveError("Choose an accommodation type.");
    if (draft.unitName.trim().length > 150) {
      return setSaveError("Name cannot exceed 150 characters.");
    }
    if (draft.floorOrArea.trim().length > 100) {
      return setSaveError("Floor or area cannot exceed 100 characters.");
    }

    const payload = {
      accommodationTypeUid: draft.accommodationTypeUid,
      unitCode,
      unitName: draft.unitName.trim() || null,
      floorOrArea: draft.floorOrArea.trim() || null,
      status: Number(draft.status),
      housekeepingStatus: Number(draft.housekeepingStatus),
      notes: draft.notes.trim() || null,
    };

    setSaving(true);
    try {
      if (editor === "create") {
        await createAccommodationUnit(propertyUid, payload);
        setNotice(`${unitCode} added.`);
      } else {
        await updateAccommodationUnit(editor, { ...payload, isActive: draft.isActive });
        setNotice(`${unitCode} updated.`);
      }
      setEditor(null);
      setTick((n) => n + 1);
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : "Could not save this room.");
    } finally {
      setSaving(false);
    }
  };

  const onBlock = async (event: FormEvent) => {
    event.preventDefault();
    if (!blocking) return;
    setBlockError("");

    const reason = blockDraft.reason.trim();
    if (!blockDraft.startDate || !blockDraft.endDate) {
      return setBlockError("Choose a start and end date.");
    }
    if (blockDraft.endDate <= blockDraft.startDate) {
      return setBlockError("End date must be after the start date.");
    }
    if (!reason) return setBlockError("Enter a reason for this block.");

    setBlockSaving(true);
    try {
      const created = await createUnitBlock(blocking.uid, {
        startDate: blockDraft.startDate,
        endDate: blockDraft.endDate,
        blockType: Number(blockDraft.blockType),
        reason,
      });
      if (!created.uid) {
        setBlockError("The block was saved, but it came back without an id to remove later.");
        return;
      }
      rememberBlocks([
        ...blocks.filter((block) => block.uid !== created.uid),
        { ...created, reason: created.reason || reason, isActive: true },
      ]);
      setNotice(`${blocking.unitCode} blocked until ${formatDate(created.endDate)}.`);
      setBlockDraft(emptyBlock());
    } catch (err) {
      setBlockError(err instanceof ApiError ? err.message : "Could not block this room.");
    } finally {
      setBlockSaving(false);
    }
  };

  const onUnblock = async (block: UnitBlock) => {
    if (!blocking) return;
    setBlockError("");
    setUnblocking(true);
    try {
      await deleteUnitBlock(block.uid);
      rememberBlocks(blocks.filter((item) => item.uid !== block.uid));
      setPendingUnblock(null);
      setNotice(`${blocking.unitCode} is open again from ${formatDate(block.startDate)}.`);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        rememberBlocks(blocks.filter((item) => item.uid !== block.uid));
        setPendingUnblock(null);
        setNotice("That block was already removed.");
        return;
      }
      setBlockError(err instanceof ApiError ? err.message : "Could not remove this block.");
    } finally {
      setUnblocking(false);
    }
  };

  const activeTypes = types.filter((type) => type.isActive);

  return (
    <div className="rm-page">
      {!propertyUid && (
        <p className="rm-empty-note">This account is not assigned to a property.</p>
      )}

      {propertyUid && (
        <header className="rm-hero">
          <div>
            <p className="rm-kicker">Accommodation</p>
            <h1>Rooms</h1>
            <p>Physical rooms and units. Block any of them, for any reason, and open the dates again.</p>
          </div>
          <button
            type="button"
            className="rm-add"
            onClick={openCreate}
            disabled={loading || !!error || activeTypes.length === 0}
          >
            Add unit
          </button>
        </header>
      )}

      {propertyUid && loading && <PageLoading />}
      {propertyUid && !loading && error && (
        <PageError message={error} onRetry={() => setTick((n) => n + 1)} />
      )}

      {propertyUid && !loading && !error && (
        <>
          {notice && <p className="rm-notice">{notice}</p>}
          {activeTypes.length === 0 && (
            <p className="rm-empty-note">Add an accommodation type before creating a room.</p>
          )}
          {units.length > 0 && (
            <input
              className="rm-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by code, name, floor, or type"
            />
          )}

          {visible.length === 0 ? (
            <div className="rm-blank">
              <h2>{units.length === 0 ? "No rooms yet" : "No matches"}</h2>
              <p>
                {units.length === 0
                  ? "Add a room, villa, or other unit so it can be booked or blocked."
                  : "Try a different code or name."}
              </p>
            </div>
          ) : (
            <div className="rm-grid">
              {visible.map((unit) => {
                const unitBlocks = blocksFor(unit.uid);
                return (
                  <article key={unit.uid} className="rm-card">
                    <div className="rm-card-top">
                      <div>
                        <div className="rm-code">{unit.unitCode}</div>
                        <h2>{unit.unitName || unit.unitCode}</h2>
                      </div>
                      <span className={`rm-badge ${statusTone(unit.status)}`}>
                        {unit.isActive ? unitStatusLabel(unit.status) : "Inactive"}
                      </span>
                    </div>
                    <ul className="rm-meta">
                      <li>{typeName(unit.accommodationTypeUid)}</li>
                      {unit.floorOrArea && <li>{unit.floorOrArea}</li>}
                      <li>{housekeepingStatusLabel(unit.housekeepingStatus)}</li>
                    </ul>
                    {unit.notes && <p className="rm-notes">{unit.notes}</p>}
                    {unitBlocks.length > 0 && (
                      <ul className="rm-blocks">
                        {unitBlocks.slice(0, 2).map((block) => (
                          <li key={block.uid}>
                            <strong>{blockTypeLabel(block.blockType)}</strong>
                            <span>
                              {formatDate(block.startDate)} – {formatDate(block.endDate)}
                            </span>
                            {block.reason && <em>{block.reason}</em>}
                          </li>
                        ))}
                        {unitBlocks.length > 2 && <li>+{unitBlocks.length - 2} more</li>}
                      </ul>
                    )}
                    <div className="rm-card-actions">
                      <button type="button" className="rm-text-danger" onClick={() => openBlock(unit)}>
                        {unitBlocks.length > 0 ? "Blocks" : "Block"}
                      </button>
                      <button type="button" className="rm-text" onClick={() => openEdit(unit.uid)}>
                        Edit
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
          <div className="rm-backdrop" onClick={() => !saving && setEditor(null)}>
            <div
              className="rm-dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby={editorTitleId}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="rm-dialog-head">
                <h2 id={editorTitleId}>{editor === "create" ? "New unit" : "Edit unit"}</h2>
                <button
                  type="button"
                  className="rm-close"
                  aria-label="Close"
                  onClick={() => !saving && setEditor(null)}
                >
                  ×
                </button>
              </div>
              {editorLoading && <PageLoading />}
              {!editorLoading && draft && (
                <form className="rm-form" onSubmit={onSave}>
                  <label>
                    Unit code
                    <input
                      name="unitCode"
                      value={draft.unitCode}
                      onChange={onChange}
                      maxLength={50}
                      placeholder="101"
                    />
                  </label>
                  <label>
                    Name
                    <input
                      name="unitName"
                      value={draft.unitName}
                      onChange={onChange}
                      maxLength={150}
                      placeholder="Deluxe 101"
                    />
                  </label>
                  <label className="rm-span">
                    Accommodation type
                    <select
                      name="accommodationTypeUid"
                      value={draft.accommodationTypeUid}
                      onChange={onChange}
                    >
                      <option value="">Select a type</option>
                      {(editor === "create" ? activeTypes : types).map((type) => (
                        <option key={type.uid} value={type.uid}>
                          {type.name}
                          {type.isActive ? "" : " (inactive)"}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Floor or area
                    <input
                      name="floorOrArea"
                      value={draft.floorOrArea}
                      onChange={onChange}
                      maxLength={100}
                      placeholder="1"
                    />
                  </label>
                  <label>
                    Status
                    <select name="status" value={draft.status} onChange={onChange}>
                      {Object.entries(UNIT_STATUS_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Housekeeping
                    <select
                      name="housekeepingStatus"
                      value={draft.housekeepingStatus}
                      onChange={onChange}
                    >
                      {Object.entries(HOUSEKEEPING_STATUS_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="rm-span">
                    Notes
                    <textarea name="notes" rows={2} value={draft.notes} onChange={onChange} />
                  </label>
                  {editor !== "create" && (
                    <label className="rm-switch">
                      <input
                        name="isActive"
                        type="checkbox"
                        checked={draft.isActive}
                        onChange={onChange}
                      />
                      <span>Active</span>
                    </label>
                  )}
                  {saveError && <p className="rm-error">{saveError}</p>}
                  <div className="rm-form-actions">
                    <button
                      type="button"
                      className="rm-ghost"
                      onClick={() => setEditor(null)}
                      disabled={saving}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="rm-save" disabled={saving}>
                      {saving ? "Saving…" : editor === "create" ? "Add unit" : "Save changes"}
                    </button>
                  </div>
                </form>
              )}
              {!editorLoading && !draft && saveError && <p className="rm-error">{saveError}</p>}
            </div>
          </div>,
          document.body,
        )}

      {blocking &&
        createPortal(
          <div
            className="rm-backdrop"
            onClick={() => !blockSaving && !unblocking && setBlocking(null)}
          >
            <div
              className="rm-dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby={blockTitleId}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="rm-dialog-head">
                <h2 id={blockTitleId}>Block {blocking.unitName || blocking.unitCode}</h2>
                <button
                  type="button"
                  className="rm-close"
                  aria-label="Close"
                  onClick={() => !blockSaving && !unblocking && setBlocking(null)}
                >
                  ×
                </button>
              </div>
              <p className="rm-hint">
                Close these dates for maintenance, an owner stay, or any other reason. The end date
                is the first morning the unit is open again.
              </p>

              <div className="rm-block-list">
                {blocksFor(blocking.uid).length === 0 ? (
                  <p className="rm-hint">No blocks on this unit yet.</p>
                ) : (
                  blocksFor(blocking.uid).map((block) => (
                    <div key={block.uid} className="rm-block-row">
                      <div>
                        <strong>{blockTypeLabel(block.blockType)}</strong>
                        <span>
                          {formatDate(block.startDate)} – {formatDate(block.endDate)}
                        </span>
                        {block.reason && <em>{block.reason}</em>}
                      </div>
                      {pendingUnblock === block.uid ? (
                        <div className="rm-inline-actions">
                          <button
                            type="button"
                            className="rm-ghost"
                            onClick={() => setPendingUnblock(null)}
                            disabled={unblocking}
                          >
                            Keep
                          </button>
                          <button
                            type="button"
                            className="rm-danger"
                            onClick={() => onUnblock(block)}
                            disabled={unblocking}
                          >
                            {unblocking ? "Opening…" : "Unblock"}
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="rm-text-danger"
                          onClick={() => {
                            setBlockError("");
                            setPendingUnblock(block.uid);
                          }}
                          disabled={unblocking || blockSaving}
                        >
                          Unblock
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>

              <form className="rm-form" onSubmit={onBlock}>
                <label>
                  Start date
                  <input
                    name="startDate"
                    type="date"
                    value={blockDraft.startDate}
                    onChange={onBlockChange}
                    required
                  />
                </label>
                <label>
                  End date
                  <input
                    name="endDate"
                    type="date"
                    value={blockDraft.endDate}
                    onChange={onBlockChange}
                    required
                  />
                </label>
                <label className="rm-span">
                  Block type
                  <select name="blockType" value={blockDraft.blockType} onChange={onBlockChange}>
                    {Object.entries(BLOCK_TYPE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="rm-span">
                  Reason
                  <textarea
                    name="reason"
                    rows={2}
                    value={blockDraft.reason}
                    onChange={onBlockChange}
                    placeholder="Scheduled maintenance, owner visit, private event…"
                  />
                </label>
                {blockError && <p className="rm-error">{blockError}</p>}
                <div className="rm-form-actions">
                  <button
                    type="button"
                    className="rm-ghost"
                    onClick={() => setBlocking(null)}
                    disabled={blockSaving || unblocking}
                  >
                    Close
                  </button>
                  <button type="submit" className="rm-save" disabled={blockSaving || unblocking}>
                    {blockSaving ? "Blocking…" : "Block dates"}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
