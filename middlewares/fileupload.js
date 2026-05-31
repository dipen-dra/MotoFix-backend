const multer = require("multer")
const { v4: uuidv4 } = require("uuid")

const storage = multer.diskStorage(
    {
        destination: (req, file, cb) => cb(null, "uploads/"),
        filename: (req, file, cb) => {
            const ext = file.originalname.split(".").pop()
            cb(null, `${file.fieldname}-${uuidv4()}.${ext}`)
        }
    }
)
const fileFilter = (req, file, cb) => {
    // 1. Prevent Null Byte Injection
    if (file.originalname.indexOf('\0') !== -1) {
        return cb(new Error('Malicious filename detected: Null Byte Injection.'), false);
    }
    
    // 2. Double Extension Prevention
    if (/\.(php|exe|sh|bat|js|html|py)\./i.test(file.originalname)) {
        return cb(new Error('Double extension file upload attempt detected.'), false);
    }

    const filetypes = /jpeg|jpg|png|gif|webp/;
    const ext = file.originalname.split(".").pop().toLowerCase();
    const extname = filetypes.test(ext);
    const mimetype = file.mimetype.startsWith("image");

    if (mimetype && extname) {
        cb(null, true);
    } else {
        cb(new Error("Only images (jpeg, jpg, png, gif, webp) are allowed"), false);
    }
};
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 mb optional
    fileFilter // optional
})

module.exports = {
    single: (fieldname) => upload.single(
        fieldname),
    array: (fieldname, maxCount) =>
        upload.array(
            fieldname, maxCount
        ),
    fields: (fieldsArray) => upload.fields(
        fieldsArray
    )
}