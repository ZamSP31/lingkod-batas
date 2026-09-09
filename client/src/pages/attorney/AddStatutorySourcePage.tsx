import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button.js";
import TextField from "../../components/ui/TextField.js";
import { useAuth } from "../../context/AuthContext.js";
import { useToast } from "../../context/ToastContext.js";
import { createStatutorySource } from "../../services/kbService.js";

interface FormErrors {
  citation?: string;
  title?: string;
  sourceType?: string;
  provisionText?: string;
  form?: string;
}

/**
 * "Add source" page for attorneys.
 * Registers a new Philippine statutory source, DOLE order, or Supreme Court doctrine
 * into MongoDB Atlas to expand the RAG AI knowledge base.
 */
function AddStatutorySourcePage() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const { showToast } = useToast();

  const [citation, setCitation] = useState("");
  const [title, setTitle] = useState("");
  const [sourceType, setSourceType] = useState("dole_department_order");
  const [tag, setTag] = useState("wage_and_hours");
  const [provisionText, setProvisionText] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function validate(): FormErrors {
    const nextErrors: FormErrors = {};
    if (!citation.trim())
      nextErrors.citation =
        "Enter an official citation (e.g. DOLE D.O. 174-17).";
    if (!title.trim()) nextErrors.title = "Enter a title or subject.";
    if (!provisionText.trim())
      nextErrors.provisionText =
        "Enter the verbatim text of this legal provision.";
    return nextErrors;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    if (!token) {
      setErrors({
        form: "You must be logged in as an attorney to add sources.",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await createStatutorySource(
        {
          citation: citation.trim(),
          title: title.trim(),
          sourceType,
          provisionText: provisionText.trim(),
          tags: [tag],
        },
        token,
      );

      showToast(`Added ${citation.trim()} to statutory corpus! ⚖️`, "success");
      navigate("/attorney/statutory-corpus");
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to register source.";
      setErrors({ form: msg });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-xl animate-fade-in-up pb-12">
      <h1 className="font-serif text-[28px] font-medium tracking-[-0.01em] text-navy-deep">
        Add statutory source
      </h1>
      <p className="mt-1 text-sm text-ink-soft">
        Register a new Philippine legal reference for the RAG AI to cite and
        ground risk evaluations against.
      </p>

      {errors.form && (
        <div className="mt-4 rounded-[6px] border border-maroon/30 bg-maroon/5 p-3.5 text-xs text-maroon font-mono">
          {errors.form}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-5">
        <TextField
          label="Official Citation"
          placeholder="e.g. DOLE Department Order No. 174-17, Sec. 4"
          value={citation}
          onChange={(event) => setCitation(event.target.value)}
          error={errors.citation}
        />

        <TextField
          label="Title / Subject Doctrine"
          placeholder="e.g. Rules Implementing Articles 106 to 109 of the Labor Code"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          error={errors.title}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="sourceType"
              className="mb-1.5 block font-mono text-[11px] font-medium uppercase text-ink-soft"
            >
              Source Type
            </label>
            <select
              id="sourceType"
              value={sourceType}
              onChange={(e) => setSourceType(e.target.value)}
              className="w-full rounded-[6px] border border-line bg-white px-3.5 py-2.5 text-sm text-ink focus:border-navy focus:outline-none"
            >
              <option value="labor_code">Labor Code</option>
              <option value="dole_department_order">
                DOLE Department Order
              </option>
              <option value="dole_advisory">DOLE Advisory</option>
              <option value="republic_act">Republic Act / Civil Code</option>
              <option value="other">Supreme Court Jurisprudence</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="tag"
              className="mb-1.5 block font-mono text-[11px] font-medium uppercase text-ink-soft"
            >
              Primary Category Tag
            </label>
            <select
              id="tag"
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              className="w-full rounded-[6px] border border-line bg-white px-3.5 py-2.5 text-sm text-ink focus:border-navy focus:outline-none"
            >
              <option value="wage_and_hours">Wage &amp; Hours</option>
              <option value="termination">Termination &amp; Due Process</option>
              <option value="non_compete">Non-Compete</option>
              <option value="confidentiality">Confidentiality</option>
              <option value="liability_waiver">Liability Waiver</option>
              <option value="contracting_and_subcontracting">
                Contracting
              </option>
              <option value="other">General / Other</option>
            </select>
          </div>
        </div>

        <div>
          <label
            htmlFor="provisionText"
            className="mb-1.5 block font-mono text-[11px] font-medium uppercase text-ink-soft"
          >
            Verbatim Provision Text
          </label>
          <textarea
            id="provisionText"
            rows={5}
            placeholder="Paste the verbatim statutory article, section, or judicial ruling text..."
            value={provisionText}
            onChange={(e) => setProvisionText(e.target.value)}
            className="w-full rounded-[6px] border border-line bg-white p-3 text-sm text-ink placeholder:text-[#a39c8e] focus:border-navy focus:outline-none"
          />
          {errors.provisionText && (
            <p className="mt-1 text-xs text-maroon font-mono">
              {errors.provisionText}
            </p>
          )}
        </div>

        <div className="mt-3 flex items-center gap-3">
          <Button
            type="button"
            variant="secondary"
            fullWidth={false}
            onClick={() => navigate("/attorney/statutory-corpus")}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            fullWidth={false}
            isLoading={isSubmitting}
            className="bg-maroon hover:bg-maroon-bright text-parchment font-semibold px-6"
          >
            Register source
          </Button>
        </div>
      </form>
    </div>
  );
}

export default AddStatutorySourcePage;
