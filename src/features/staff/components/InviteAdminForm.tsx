import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useInviteAdmin } from "@/features/staff/hooks/useInviteAdmin";
import {
  inviteAdminSchema,
  type InviteAdminFormValues,
} from "@/features/staff/schemas";
import { getApiErrorMessage } from "@/utils/errors";

export default function InviteAdminForm({
  propertyUid,
}: {
  propertyUid: string;
}) {
  const mutation = useInviteAdmin();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InviteAdminFormValues>({
    resolver: zodResolver(inviteAdminSchema),
    defaultValues: { firstName: "", lastName: "", email: "" },
  });

  const result = mutation.data;
  const succeeded = mutation.isSuccess;

  const onSubmit = (values: InviteAdminFormValues) => {
    mutation.mutate({
      propertyUid,
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      email: values.email.trim(),
    });
  };

  const notice = succeeded
    ? result?.emailSent === false
      ? result.temporaryPassword
        ? `Admin created, but the email could not be sent. Temporary password: ${result.temporaryPassword}`
        : "Admin created, but the email could not be sent."
      : "Invitation sent successfully."
    : "";

  return (
    <section className="sa-section">
      <div className="sa-section-head">
        <h3>Administrator</h3>
      </div>

      {succeeded ? (
        <>
          <p className="rsv-success">{notice}</p>
          <div className="rsv-actions">
            <button
              type="button"
              className="rsv-btn rsv-btn-ghost"
              onClick={() => {
                mutation.reset();
                reset();
              }}
            >
              Invite another admin
            </button>
          </div>
        </>
      ) : (
        <form className="rsv-form sa-flat" onSubmit={handleSubmit(onSubmit)}>
          <div className="rsv-grid">
            <label>
              First name
              <input {...register("firstName")} />
              {errors.firstName && (
                <p className="rsv-error">{errors.firstName.message}</p>
              )}
            </label>
            <label>
              Last name
              <input {...register("lastName")} />
              {errors.lastName && (
                <p className="rsv-error">{errors.lastName.message}</p>
              )}
            </label>
            <label>
              Email
              <input type="email" {...register("email")} />
              {errors.email && (
                <p className="rsv-error">{errors.email.message}</p>
              )}
            </label>
          </div>

          {mutation.isError && (
            <p className="rsv-error">
              {getApiErrorMessage(
                mutation.error,
                "Could not send the invitation.",
              )}
            </p>
          )}

          <div className="rsv-actions">
            <button
              type="submit"
              className="rsv-btn"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Sending…" : "Invite Admin"}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
