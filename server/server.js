require("dotenv").config();
if (process.env.NODE_ENV === "production") {
  const required = ["MONGO_URI", "JWT_SECRET", "CLIENT_URL", "CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"];
  const missing = required.filter((name) => !process.env[name]?.trim());
  if (missing.length) throw new Error(`Missing production environment variables: ${missing.join(", ")}`);
  const clientUrl = new URL(process.env.CLIENT_URL);
  if (clientUrl.protocol !== "https:" || clientUrl.origin !== process.env.CLIENT_URL) {
    throw new Error("CLIENT_URL must be the exact HTTPS frontend origin without a trailing slash.");
  }
}
const connectDB = require("./src/config/db");
const app = require("./src/app");

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || "0.0.0.0";

connectDB().then(() => {
  require("./src/services/processingWorker").startProcessingWorker();
  require("./src/services/accountLifecycle").startAccountLifecycle();
  app.listen(PORT, HOST, () => {
    console.log(
      `Server running on http://${HOST}:${PORT} [${process.env.NODE_ENV || "development"}]`,
    );
  });
});
