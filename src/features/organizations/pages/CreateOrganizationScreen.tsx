import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreateOrganization } from "@/features/organizations/hooks/useCreateOrganization";
import {
  createOrganizationSchema,
  type CreateOrganizationForm,
} from "@/features/organizations/schemas";
import { ROUTES, superOrganizationPath } from "@/routes/paths";
import { getApiErrorMessage } from "@/utils/errors";
import "@/styles/reservations.css";
import "@/styles/superAdmin.css";

const CURRENCIES = ["LKR", "USD", "EUR", "GBP", "AUD", "INR"];

export default function CreateOrganizationScreen() {
  const navigate = useNavigate();
  const mutation = useCreateOrganization();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateOrganizationForm>({
    resolver: zodResolver(createOrganizationSchema),
    defaultValues: {
      code: "",
      name: "",
      legalName: "",
      defaultCurrency: "LKR",
      timezone: "Asia/Colombo",
    },
  });

  const onSubmit = (values: CreateOrganizationForm) => {
    mutation.mutate(
      {
        code: values.code.trim().toUpperCase(),
        name: values.name.trim(),
        legalName: values.legalName?.trim() || values.name.trim(),
        defaultCurrency: values.defaultCurrency,
        timezone: values.timezone.trim(),
      },
      {
        onSuccess: (organization) => {
          navigate(
            organization.uid
              ? superOrganizationPath(organization.uid)
              : ROUTES.SUPER_ORGANIZATIONS,
          );
        },
      },
    );
  };

  return (
    <div className="rsv-page">
      <div className="rsv-header">
        <div>
          <Link className="rsv-back" to={ROUTES.SUPER_ORGANIZATIONS}>
            ← Back to organizations
          </Link>
          <p className="rsv-eyebrow">Platform</p>
          <h2>New organization</h2>
          <p className="rsv-sub">
            Next you'll add its properties, then invite an admin for each one.
          </p>
        </div>
      </div>

      <form className="rsv-form" onSubmit={handleSubmit(onSubmit)}>
        <div className="rsv-grid">
          <label>
            Code
            <input placeholder="ABC" {...register("code")} />
            {errors.code && <p className="rsv-error">{errors.code.message}</p>}
          </label>
          <label>
            Name
            <input placeholder="ABC Hotels" {...register("name")} />
            {errors.name && <p className="rsv-error">{errors.name.message}</p>}
          </label>
          <label>
            Legal name
            <input
              placeholder="ABC Hotels Pvt Ltd"
              {...register("legalName")}
            />
          </label>
          <label>
            Default currency
            <select {...register("defaultCurrency")}>
              {CURRENCIES.map((currency) => (
                <option key={currency}>{currency}</option>
              ))}
            </select>
          </label>
          <label>
            Timezone
            <input {...register("timezone")} />
            {errors.timezone && (
              <p className="rsv-error">{errors.timezone.message}</p>
            )}
          </label>
        </div>

        {mutation.isError && (
          <p className="rsv-error">
            Unable to create organization.
            <br />
            {getApiErrorMessage(
              mutation.error,
              "Could not create the organization.",
            )}
          </p>
        )}

        <div className="rsv-actions">
          <button
            type="button"
            className="rsv-btn rsv-btn-ghost"
            onClick={() => navigate(ROUTES.SUPER_ORGANIZATIONS)}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rsv-btn"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Creating…" : "Create organization"}
          </button>
        </div>
      </form>
    </div>
  );
}
