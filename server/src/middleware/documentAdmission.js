// Shared per-process bound on buffered document requests. Mount before Multer.
function createAdmission(max = 4) {
  let active = 0;
  return (req, res, next) => {
    if (active >= max) { res.status(503).json({ message: "Document service busy. Try again later." }); return; }
    active++;
    let released = false;
    const release = () => {
      if (released) return;
      released = true; active--;
      res.removeListener("finish", release); res.removeListener("close", release);
    };
    res.once("finish", release); res.once("close", release);
    next();
  };
}
module.exports = { documentAdmission: createAdmission(), createAdmission };
