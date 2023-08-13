const multer = require('multer');

const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, './public/uploads');
    },
    filename: (req, file, callback) => {
        callback(null, file.originalname);
    }
});

const fileFilter = (req, file, callback) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
        callback(null, true);
    } else {
        callback(new Error('Invalid file type. Only image and video files are allowed.'));
    }
};

const uploadFile = multer({ storage: storage, fileFilter: fileFilter });

module.exports = uploadFile;
