// middleware/upload.js
const multer = require("multer");
const streamifier = require("streamifier"); // npm install streamifier
const cloudinary = require("../config/cloudinary");

// Step 1: hold the file in memory (no disk write)
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// Step 2: after multer parses the file, push it to Cloudinary
// and reshape req.file to look like what CloudinaryStorage used to produce
const uploadToCloudinary = (fieldName) => {
  const multerMiddleware = upload.single(fieldName);

  return (req, res, next) => {
    multerMiddleware(req, res, async (err) => {
      if (err) return next(err);
      if (!req.file) return next(); // no file attached, let controller decide

      try {
        const streamUpload = () =>
          new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              {
                folder: "erm-report-attachments",
                allowed_formats: ["jpg", "jpeg", "png", "webp", "pdf"],
                resource_type: "auto",
              },
              (error, result) => {
                if (result) resolve(result);
                else reject(error);
              }
            );
            streamifier.createReadStream(req.file.buffer).pipe(stream);
          });

        const result = await streamUpload();

        // reshape req.file so downstream controller code keeps working unchanged
        req.file.path = result.secure_url;       // was the Cloudinary URL before
        req.file.filename = result.public_id;    // was the Cloudinary public_id before
        req.file.cloudinaryResult = result;       // full result, in case you need more later

        next();
      } catch (uploadErr) {
        next(uploadErr);
      }
    });
  };
};

module.exports = uploadToCloudinary;