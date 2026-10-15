// Database orchestration stays in the parent; untrusted parsing runs in an isolated process.
const Contract = require("../models/Contract");
const { maskPII } = require("../utils/piiSanitizer");
const { processDocument, processImage } = require("./documentProcessingService");

async function processContract(contractId, fileBuffer, mimeType, job = null) {
  try {
    // 1. Mark contract as in-progress
    if (!job) await Contract.findByIdAndUpdate(contractId, {
      status: "ocr_processing",
    });

    // 2. Run appropriate extraction pipeline
    let result;
    if (mimeType === "application/pdf") {
      result = await processDocument(fileBuffer, { signal: job?.signal });
    } else if (["image/png", "image/jpeg", "image/jpg"].includes(mimeType)) {
      result = await processImage(fileBuffer, { signal: job?.signal });
    } else {
      throw new Error(`Unsupported MIME type for OCR: ${mimeType}`);
    }

    // 3. Apply RA 10173 Sensitive Personal Information (SPI) Redaction
    const rawExtracted = result.text || "";
    const { sanitizedText, redactionCounts, totalRedacted } =
      maskPII(rawExtracted);
    result.text = sanitizedText;

    // 4. Determine next lifecycle stage:
    // If OCR quality failed thresholds, route to manual attorney review.
    // Otherwise advance to ai_analysis for the durable worker to continue.
    const nextStatus = result.flaggedForReview
      ? "awaiting_attorney_review"
      : "ai_analysis";

    const persist = job ? job.update : (fields) => Contract.findByIdAndUpdate(contractId, fields, { new: true });
    const updatedContract = await persist(
      {
        rawOcrText: sanitizedText,
        piiSanitized: true,
        piiRedactionCount: totalRedacted,
        ocrConfidence: result.confidence,
        ocrMethod: result.method,
        flaggedForManualReview: result.flaggedForReview,
        status: nextStatus,
      },
    );

    const { logAction } = require("./auditService");
    await logAction({
      action: "OCR_PROCESSED",
      entityType: "contract",
      entityId: contractId,
      entityLabel:
        updatedContract?.requestNumber ||
        updatedContract?.title ||
        String(contractId),
      userRole: "system",
      userName: "OCR Engine",
      details: {
        method: result.method,
        confidence: result.confidence,
        flaggedForReview: result.flaggedForReview,
        textLength: sanitizedText.length,
        piiRedacted: totalRedacted > 0,
        piiRedactionCount: totalRedacted,
      },
    }).catch(() => {});

    if (totalRedacted > 0) {
      await logAction({
        action: "PII_REDACTION_APPLIED",
        entityType: "contract",
        entityId: contractId,
        entityLabel:
          updatedContract?.requestNumber ||
          updatedContract?.title ||
          String(contractId),
        userRole: "system",
        userName: "RA 10173 Privacy Guard",
        details: {
          totalRedacted,
          redactionCategories: redactionCounts,
          complianceStandard:
            "Republic Act No. 10173 (Data Privacy Act of 2012)",
        },
      }).catch(() => {});
    }

    return result;
  } catch (error) {
    if (job) throw error;
    // eslint-disable-next-line no-console
    console.error(
      `[ocrService] Error processing contract ${contractId}:`,
      error.message,
    );

    // Ensure contract doesn't get stuck in 'ocr_processing'
    await Contract.findByIdAndUpdate(contractId, {
      status: "awaiting_attorney_review",
      flaggedForManualReview: true,
      ocrMethod: "manual",
      attorneyNotes: `OCR processing error: ${error.message}`,
    }).catch(() => {});

    throw error;
  }
}

module.exports = { processContract, processDocument, processImage, maskPII };
