export function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  if (error.name === "ValidationError") {
    return res.status(400).json({ message: error.message });
  }
  if (error.name === "CastError") {
    return res.status(400).json({ message: "The requested record ID is invalid." });
  }
  if (error.code === 11000) {
    return res.status(409).json({ message: "An account with that email already exists." });
  }

  console.error(error);
  res.status(error.status || 500).json({
    message: error.status ? error.message : "Something went wrong. Please try again."
  });
}
