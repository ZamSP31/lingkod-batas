import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button.js";
import TextField from "../../components/ui/TextField.js";

interface FormErrors {
  title?: string;
  category?: string;
  sourceUrl?: string;
}

/**
 * "Add source" — reached from the Statutory Corpus page's "Add source"
 * button. Registers a new legal reference (Civil Code, a new DOLE
 * issuance, etc.) that the AI can cite against. No mockup for this
 * screen was provided yet, so the fields here are inferred directly
 * from the StatutorySource shape (title, category, sourceUrl) that
 * the corpus table already renders — swap in the real design once
 * you have it.
 */
function AddStatutorySourcePage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function validate(): FormErrors {
    const nextErrors: FormErrors = {};
    if (!title.trim()) nextErrors.title = "Enter a title for this source.";
    if (!category.trim())
      nextErrors.category = 'Enter a category, e.g. "Labor law".';
    if (!sourceUrl.trim()) {
      nextErrors.sourceUrl = "Enter a link to the source text.";
    } else {
      try {
        new URL(sourceUrl);
      } catch {
        nextErrors.sourceUrl = "Enter a valid URL, including https://.";
      }
    }
    return nextErrors;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitting(true);
    // TODO: replace with the real POST /api/statutory-sources once the API exists.
    window.setTimeout(() => {
      setIsSubmitting(false);
      navigate("/attorney/statutory-corpus");
    }, 700);
  }

  return (
    <div className="max-w-xl">
      <h1 className="font-display text-2xl font-semibold text-navy-950">
        Add source
      </h1>
      <p className="mt-1 text-sm text-ink-600">
        Register a new legal reference for the AI to cite against.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-5">
        <TextField
          label="Title"
          placeholder="e.g. Labor Code of the Philippines"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          error={errors.title}
        />

        <TextField
          label="Category"
          placeholder="e.g. Labor law"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          error={errors.category}
        />

        <TextField
          label="Source URL"
          type="url"
          placeholder="https://lawphil.net/..."
          value={sourceUrl}
          onChange={(event) => setSourceUrl(event.target.value)}
          error={errors.sourceUrl}
        />

        <div className="mt-2 flex gap-3">
          <Button
            type="button"
            variant="secondary"
            fullWidth={false}
            onClick={() => navigate("/attorney/statutory-corpus")}
          >
            Cancel
          </Button>
          <Button type="submit" fullWidth={false} isLoading={isSubmitting}>
            Add source
          </Button>
        </div>
      </form>
    </div>
  );
}

export default AddStatutorySourcePage;
