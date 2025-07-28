// const multer = require('multer');
// const path = require('path');

// // Store files in ./uploads/resumes folder
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'uploads/resumes/');
//   },
//   filename: (req, file, cb) => {
//     const unique = Date.now() + '-' + file.originalname;
//     cb(null, unique);
//   }
// });

// const upload = multer({
//   storage,
//   limits: { fileSize: 5 * 1024 * 1024 }, // limit 5MB
//   fileFilter(req, file, cb) {
//     if (!file.originalname.match(/\.(pdf|doc|docx)$/)) {
//       return cb(new Error('Only PDF or Word documents are allowed'));
//     }
//     cb(null, true);
//   }
// });

// module.exports = upload;
