// @route  POST /api/uploads
// @desc   Uploads a single file to Cloudinary and returns its URL.
// Used by dynamic report fields of type "file" — the returned url gets
// stored directly in the report's data object, same as any other field value.
const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    res.status(200).json({
      url: req.file.path, // Cloudinary storage engine sets this to the full https URL
      filename: req.file.originalname,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { uploadFile };