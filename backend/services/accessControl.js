const crypto = require("crypto");
const { auth } = require("express-oauth2-jwt-bearer");

let jwtCheck;

function keysMatch(providedKey, configuredKey) {
  if (!providedKey || !configuredKey) return false;

  const provided = Buffer.from(providedKey);
  const configured = Buffer.from(configuredKey);
  return (
    provided.length === configured.length &&
    crypto.timingSafeEqual(provided, configured)
  );
}

function getJwtCheck() {
  const audience = process.env.AUTH0_AUDIENCE;
  const issuerBaseURL = process.env.AUTH0_ISSUER_BASE_URL;
  if (!audience || !issuerBaseURL) return null;

  jwtCheck ??= auth({ audience, issuerBaseURL });
  return jwtCheck;
}

function requireAccess(req, res, next) {
  const configuredKey = process.env.ADMIN_ACCESS_KEY;
  const authorization = req.get("authorization") || "";
  const providedCredential = authorization.startsWith("Bearer ")
    ? authorization.slice(7)
    : "";

  if (keysMatch(providedCredential, configuredKey)) {
    req.access = { isAdmin: true, userId: "legacy-admin" };
    return next();
  }

  const checkJwt = getJwtCheck();
  if (!checkJwt) {
    return res.status(503).json({
      message: "Server access protection is not configured",
    });
  }

  return checkJwt(req, res, (error) => {
    const userId = req.auth?.payload?.sub;
    if (error || !userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    req.access = { isAdmin: false, userId };
    return next();
  });
}

module.exports = { getJwtCheck, keysMatch, requireAccess };
