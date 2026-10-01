import { useState, type ChangeEvent, type FormEvent } from "react";
import { ApiError } from "../../../../lib/api";
import { createWorkLog } from "../../../../services/admin/staffService.service";

const empty = {
  workDate: "",
  startTime: "",
  endTime: "",
  hoursWorked: "",
  overtimeHours: "0",
  notes: "",
};

export default function WorkLogForm({
  staffUid,
  onSaved,
}: {
  staffUid: string;
  onSaved: () => void;
}) {
  const [form, setForm] = useState(empty);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.workDate) return setError("Select the work date.");
    if (!form.startTime || !form.endTime)
      return setError("Enter start and end time.");
    if (!form.hoursWorked || Number(form.hoursWorked) <= 0)
      return setError("Enter the hours worked.");

    setLoading(true);
    try {
      await createWorkLog(staffUid, {
        workDate: form.workDate,
        startTime: `${form.startTime}:00`,
        endTime: `${form.endTime}:00`,
        hoursWorked: Number(form.hoursWorked),
        overtimeHours: Number(form.overtimeHours) || 0,
        bookingUid: null,
        notes: form.notes.trim(),
      });
      setForm(empty);
      onSaved();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Could not save the work log.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="rsv-form sa-flat" onSubmit={handleSubmit}>
      <div className="rsv-grid">
        <label>
          Work date
          <input
            name="workDate"
            type="date"
            value={form.workDate}
            onChange={handleChange}
          />
        </label>
        <label>
          Start time
          <input
            name="startTime"
            type="time"
            value={form.startTime}
            onChange={handleChange}
          />
        </label>
        <label>
          End time
          <input
            name="endTime"
            type="time"
            value={form.endTime}
            onChange={handleChange}
          />
        </label>
        <label>
          Hours worked
          <input
            name="hoursWorked"
            type="number"
            min={0}
            step={0.5}
            value={form.hoursWorked}
            onChange={handleChange}
          />
        </label>
        <label>
          Overtime hours
          <input
            name="overtimeHours"
            type="number"
            min={0}
            step={0.5}
            value={form.overtimeHours}
            onChange={handleChange}
          />
        </label>
      </div>
      <label>
        Notes
        <textarea
          name="notes"
          rows={2}
          value={form.notes}
          onChange={handleChange}
        />
      </label>

      {error && <p className="rsv-error">{error}</p>}

      <div className="rsv-actions">
        <button type="submit" className="rsv-btn" disabled={loading}>
          {loading ? "Saving…" : "Add work log"}
        </button>
      </div>
    </form>
  );
}
