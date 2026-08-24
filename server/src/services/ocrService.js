// server/src/services/ocrService.js
//
// Document ingestion / OCR pipeline for Lingkod Batas.
//
// Five-step decision flow:
//   1. Direct text extraction (pdf-parse)      -> fast path for digital-native PDFs
//   2. Usable-text-layer heuristic              -> decides whether to skip OCR entirely
//   3. Rasterization (pdf-poppler)              -> only runs if Step 2 says NO
//   4. Tesseract OCR + confidence scoring        -> local OCR attempt
//   5. Three-tier decision:
//        - high confidence  -> pass text through
//        - low confidence   -> cloud OCR fallback (Google Vision) [stub]
//        - critical failure -> flaggedForReview = true, routed to attorney
//
// Controllers should only ever call processDocument(buffer). Everything
// else here is an internal step, exported individually purely so
// test-pdf.js / unit tests can exercise each stage in isolation.

const fs = require("fs/promises");
const fsSync = require("fs");
const os = require("os");
const path = require("path");
const crypto = require("crypto");
const { PDFParse } = require("pdf-parse");
const pdfPoppler = require("pdf-poppler");
const { createWorker } = require("tesseract.js");
const Contract = require("../models/Contract");

// ---------------------------------------------------------------------------
// Tunable parameters — adjust freely during calibration against real
// contract samples. Nothing else in the pipeline needs to change when
// these do.
// ---------------------------------------------------------------------------
const CONFIDENCE_THRESHOLD = 70; // Tesseract confidence (0-100) — below this, try cloud fallback
const CLOUD_FALLBACK_THRESHOLD = 40; // Below this even cloud OCR is treated as a critical failure
const MIN_TEXT_LENGTH = 50; // Step 2: below this many chars, treat as "no usable text layer"
const MIN_ALPHANUMERIC_DENSITY = 0.3; // Step 2: below this ratio, treat extracted text as noise

// Scratch directory for rasterized page images. Gitignored — each run
// gets its own uuid-named subfolder, deleted after processing completes
// (success or failure) so temp files never pile up.
const TMP_ROOT = path.join(__dirname, "..", "..", "tmp", "ocr");

// ---------------------------------------------------------------------------
// Step 1 — Direct text extraction
// ---------------------------------------------------------------------------
/**
 * Attempts to pull embedded text straight out of the PDF, no rasterization.
 * Works for digital-native PDFs (Word/Docs exports, e-signed contracts, etc.)
 * @param {Buffer} pdfBuffer
 * @returns {Promise<string>} raw extracted text (may be empty/garbled)
 */
async function extractTextDirect(pdfBuffer) {
  const parser = new PDFParse({ data: pdfBuffer });
  const result = await parser.getText();
  return result?.text ?? "";
}

// ---------------------------------------------------------------------------
// Step 2 — Usable-text-layer heuristic
// ---------------------------------------------------------------------------
/**
 * Decides whether Step 1's output is "real" extractable text, or whether
 * the PDF is actually a scanned image with no usable text layer.
 * @param {string} text
 * @returns {boolean} true if the text layer looks usable (skip OCR)
 */
function hasUsableTextLayer(text) {
  if (!text || typeof text !== "string") return false;

  const trimmed = text.trim();
  if (trimmed.length < MIN_TEXT_LENGTH) return false;

  const alphanumericCount = (trimmed.match(/[a-zA-Z0-9]/g) || []).length;
  const density = alphanumericCount / trimmed.length;

  return density >= MIN_ALPHANUMERIC_DENSITY;
}

// ---------------------------------------------------------------------------
// Step 3 — Rasterization
// ---------------------------------------------------------------------------
/**
 * Rasterizes every page of the PDF into PNG images using Poppler.
 * pdf-poppler requires a file path (not a buffer) and writes its
 * output to disk, so this creates a scoped temp folder per run.
 * @param {Buffer} pdfBuffer
 * @returns {Promise<{ runDir: string, imagePaths: string[] }>}
 */
async function rasterizePdf(pdfBuffer) {
  const runId = crypto.randomUUID();
  const runDir = path.join(TMP_ROOT, runId);
  await fs.mkdir(runDir, { recursive: true });

  const pdfPath = path.join(runDir, "source.pdf");
  await fs.writeFile(pdfPath, pdfBuffer);

  const options = {
    format: "png",
    out_dir: runDir,
    out_prefix: "page",
    page: null, // null = rasterize every page
  };

  await pdfPoppler.convert(pdfPath, options);

  const files = await fs.readdir(runDir);
  const imagePaths = files
    .filter((f) => f.startsWith("page") && f.endsWith(".png"))
    .sort() // "page-1.png", "page-2.png", ... — lexical sort is fine up to 9 pages; see note below
    .map((f) => path.join(runDir, f));

  return { runDir, imagePaths };
}

// ---------------------------------------------------------------------------
// Step 4 — Tesseract OCR + confidence scoring
// ---------------------------------------------------------------------------
/**
 * Runs Tesseract over each rasterized page image and aggregates the
 * results into a single text blob and an overall confidence score.
 * @param {string[]} imagePaths
 * @returns {Promise<{ text: string, confidence: number }>}
 */
async function runTesseractOcr(imagePaths) {
  if (imagePaths.length === 0) {
    return { text: "", confidence: 0 };
  }

  const worker = await createWorker("eng");

  try {
    const pageResults = [];
    for (const imagePath of imagePaths) {
      const { data } = await worker.recognize(imagePath);
      pageResults.push({
        text: data.text ?? "",
        confidence: data.confidence ?? 0,
      });
    }

    const combinedText = pageResults.map((p) => p.text).join("\n\n");
    const averageConfidence =
      pageResults.reduce((sum, p) => sum + p.confidence, 0) /
      pageResults.length;

    return { text: combinedText, confidence: averageConfidence };
  } finally {
    await worker.terminate();
  }
}

// ---------------------------------------------------------------------------
// Step 5 (branch) — Cloud OCR fallback [STUB]
// ---------------------------------------------------------------------------
/**
 * Placeholder for Google Vision's DOCUMENT_TEXT_DETECTION. Wired to match
 * the eventual real response shape so swapping in the actual API call is
 * a drop-in replacement — no other pipeline code should need to change.
 *
 * TODO: replace the mock block with a real @google-cloud/vision call:
 *   const vision = require('@google-cloud/vision');
 *   const client = new vision.ImageAnnotatorClient();
 *   const [result] = await client.documentTextDetection(imagePath);
 *   const detection = result.fullTextAnnotation;
 *
 * @param {string[]|Buffer[]} imageSources
 * @returns {Promise<{ text: string, confidence: number }>}
 */
async function cloudOcrFallback(imageSources) {
  // eslint-disable-next-line no-console
  console.warn(
    "[ocrService] cloudOcrFallback is a stub — Google Vision is not yet wired up. " +
      `Would have processed ${imageSources.length} image source(s).`,
  );

  // Stubbed as a low-confidence non-result until the real API key/client exists.
  // This deliberately routes through to the "critical failure" branch below
  // rather than pretending to succeed.
  return { text: "", confidence: 0 };
}

// ---------------------------------------------------------------------------
// Cleanup helper
// ---------------------------------------------------------------------------
async function cleanupRunDir(runDir) {
  if (!runDir) return;
  try {
    await fs.rm(runDir, { recursive: true, force: true });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn(
      `[ocrService] Failed to clean up temp dir ${runDir}:`,
      err.message,
    );
  }
}

// ---------------------------------------------------------------------------
// Image OCR Ingestion (PNG / JPEG)
// ---------------------------------------------------------------------------
/**
 * Processes an uploaded image contract buffer using Tesseract.js directly.
 * @param {Buffer} imageBuffer
 * @returns {Promise<{
 *   text: string,
 *   method: "tesseract" | "cloud",
 *   confidence: number,
 *   flaggedForReview: boolean,
 * }>}
 */
async function processImage(imageBuffer) {
  const worker = await createWorker("eng");
  let tesseractResult;

  try {
    const { data } = await worker.recognize(imageBuffer);
    tesseractResult = {
      text: data.text ?? "",
      confidence: data.confidence ?? 0,
    };
  } finally {
    await worker.terminate();
  }

  if (tesseractResult.confidence >= CONFIDENCE_THRESHOLD) {
    return {
      text: tesseractResult.text,
      method: "tesseract",
      confidence: tesseractResult.confidence,
      flaggedForReview: false,
    };
  }

  // Try cloud OCR fallback if Tesseract confidence is low
  const cloudResult = await cloudOcrFallback([imageBuffer]);

  if (cloudResult.confidence >= CONFIDENCE_THRESHOLD) {
    return {
      text: cloudResult.text,
      method: "cloud",
      confidence: cloudResult.confidence,
      flaggedForReview: false,
    };
  }

  const bestAttempt =
    cloudResult.confidence >= tesseractResult.confidence
      ? cloudResult
      : tesseractResult;
  const bestMethod = bestAttempt === cloudResult ? "cloud" : "tesseract";

  return {
    text: bestAttempt.text,
    method: bestMethod,
    confidence: bestAttempt.confidence,
    flaggedForReview: true,
  };
}

// ---------------------------------------------------------------------------
// PDF Document Ingestion
// ---------------------------------------------------------------------------
/**
 * Runs the full ingestion pipeline against an uploaded PDF buffer.
 *
 * @param {Buffer} pdfBuffer
 * @returns {Promise<{
 *   text: string,
 *   method: "direct" | "tesseract" | "cloud",
 *   confidence: number | null,   // null when method === "direct" (n/a — text is exact)
 *   flaggedForReview: boolean,
 * }>}
 */
async function processDocument(pdfBuffer) {
  // --- Step 1 + 2: try direct extraction first ---
  const directText = await extractTextDirect(pdfBuffer);

  if (hasUsableTextLayer(directText)) {
    return {
      text: directText,
      method: "direct",
      confidence: null,
      flaggedForReview: false,
    };
  }

  // --- Step 3: rasterize, since there's no usable text layer ---
  let runDir;
  try {
    const rasterResult = await rasterizePdf(pdfBuffer);
    runDir = rasterResult.runDir;
    const { imagePaths } = rasterResult;

    // --- Step 4: local OCR attempt ---
    const tesseractResult = await runTesseractOcr(imagePaths);

    if (tesseractResult.confidence >= CONFIDENCE_THRESHOLD) {
      return {
        text: tesseractResult.text,
        method: "tesseract",
        confidence: tesseractResult.confidence,
        flaggedForReview: false,
      };
    }

    // --- Step 5: low confidence -> try cloud OCR fallback ---
    const cloudResult = await cloudOcrFallback(imagePaths);

    if (cloudResult.confidence >= CONFIDENCE_THRESHOLD) {
      return {
        text: cloudResult.text,
        method: "cloud",
        confidence: cloudResult.confidence,
        flaggedForReview: false,
      };
    }

    // --- Critical failure: neither local nor cloud OCR met the bar ---
    // Per panel requirement #4, this routes to manual attorney review
    // rather than silently passing through low-quality text.
    const bestAttempt =
      cloudResult.confidence >= tesseractResult.confidence
        ? cloudResult
        : tesseractResult;
    const bestMethod = bestAttempt === cloudResult ? "cloud" : "tesseract";

    return {
      text: bestAttempt.text,
      method: bestMethod,
      confidence: bestAttempt.confidence,
      flaggedForReview: true,
    };
  } finally {
    await cleanupRunDir(runDir);
  }
}

// ---------------------------------------------------------------------------
// Contract Orchestrator — Background Job Worker
// ---------------------------------------------------------------------------
/**
 * Processes an uploaded contract in the background:
 * 1. Sets status to 'ocr_processing'
 * 2. Extracts text via direct PDF parsing or OCR
 * 3. Updates Contract in MongoDB with extracted text, confidence, method, and next status
 *
 * @param {string|mongoose.Types.ObjectId} contractId
 * @param {Buffer} fileBuffer
 * @param {string} mimeType
 * @returns {Promise<Object>} OCR result
 */
async function processContract(contractId, fileBuffer, mimeType) {
  try {
    // 1. Mark contract as in-progress
    await Contract.findByIdAndUpdate(contractId, {
      status: "ocr_processing",
    });

    // 2. Run appropriate extraction pipeline
    let result;
    if (mimeType === "application/pdf") {
      result = await processDocument(fileBuffer);
    } else if (["image/png", "image/jpeg", "image/jpg"].includes(mimeType)) {
      result = await processImage(fileBuffer);
    } else {
      throw new Error(`Unsupported MIME type for OCR: ${mimeType}`);
    }

    // 3. Determine next lifecycle stage:
    // If OCR quality failed thresholds, route to manual attorney review.
    // Otherwise advance to ai_analysis and trigger RAG pipeline.
    const nextStatus = result.flaggedForReview
      ? "awaiting_attorney_review"
      : "ai_analysis";

    await Contract.findByIdAndUpdate(contractId, {
      rawOcrText: result.text || "",
      ocrConfidence: result.confidence,
      ocrMethod: result.method,
      flaggedForManualReview: result.flaggedForReview,
      status: nextStatus,
    });

    // 4. If advanced to ai_analysis, trigger RAG analysis asynchronously
    if (nextStatus === "ai_analysis") {
      setImmediate(() => {
        const { analyzeContract } = require("./ragService");
        analyzeContract(contractId).catch((ragErr) => {
          // eslint-disable-next-line no-console
          console.error(
            `[ocrService] Background RAG analysis failed for contract ${contractId}:`,
            ragErr.message,
          );
        });
      });
    }

    return result;
  } catch (error) {
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

module.exports = {
  processContract,
  processDocument,
  processImage,
  // individual steps exported for testing / test-pdf.js
  extractTextDirect,
  hasUsableTextLayer,
  rasterizePdf,
  runTesseractOcr,
  cloudOcrFallback,
  CONFIDENCE_THRESHOLD,
  CLOUD_FALLBACK_THRESHOLD,
};
