
const multer = require("multer");
const streamifier = require("streamifier");
const cloudinary = require("../config/cloudinary");
const path = require("path");

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
  fileFilter: (req, file, cb) => {
    const allowedExtensions = [
      ".jpg",
      ".jpeg",
      ".png",
      ".webp",
      ".pdf",
      ".doc",
      ".docx",
      ".xls",
      ".xlsx",
      ".ppt",
      ".pptx",
    ];

    const ext = path.extname(file.originalname).toLowerCase();

    if (allowedExtensions.includes(ext)) {
      return cb(null, true);
    }

    cb(new Error("Unsupported file format."));
  },
});

const uploadToCloudinary = (fieldName) => {
  const multerMiddleware = upload.single(fieldName);

  return (req, res, next) => {
    multerMiddleware(req, res, async (err) => {
      if (err) return next(err);
      if (!req.file) return next();

      try {
        const ext = path.extname(req.file.originalname).toLowerCase();

        const isImage = [
          ".jpg",
          ".jpeg",
          ".png",
          ".webp",
        ].includes(ext);

        const resourceType = isImage ? "image" : "raw";

        const result = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder: "erm-report-attachments",
              resource_type: resourceType,
              use_filename: true,
              unique_filename: true,
            },
            (error, result) => {
              if (error) return reject(error);
              resolve(result);
            }
          );

          streamifier
            .createReadStream(req.file.buffer)
            .pipe(stream);
        });

        req.file.path = result.secure_url;
        req.file.filename = result.public_id;
        req.file.cloudinaryResult = result;

        next();
      } catch (uploadErr) {
        console.error("Cloudinary Upload Error:", uploadErr);
        next(uploadErr);
      }
    });
  };
};

module.exports = uploadToCloudinary;