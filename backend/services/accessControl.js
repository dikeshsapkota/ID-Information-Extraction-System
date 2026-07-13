const crypto = require("crypto");

function keysMatch(providedKey, configuredKey) {
  if (!providedKey || !configuredKey) return false;

  const provided = Buffer.from(providedKey);
  const configured = Buffer.from(configuredKey);
  return (
    provided.length === configured.length &&
    crypto.timingSafeEqual(provided, configured)
  );
}

function requireAccess(req, res, next) {
  const configuredKey = process.env.ADMIN_ACCESS_KEY;
  if (!configuredKey) {
    return res.status(503).json({
      message: "Server access protection is not configured",
    });
  }

  const authorization = req.get("authorization") || "";
  const providedKey = authorization.startsWith("Bearer ")
    ? authorization.slice(7)
    : "";

  if (!keysMatch(providedKey, configuredKey)) {
    return res.status(401).json({ message: "Invalid access key" });
  }

  return next();
}

module.exports = { keysMatch, requireAccess };
