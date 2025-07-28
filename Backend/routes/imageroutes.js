const express = require('express');
const multer = require('multer');
const uniqid = require('uniqid');
const path = require('path');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../public/images'));
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uniqid()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

router.post('/', upload.single('avatar'), (req, res) => {
  const url =` http:localhost:7000/images/${req.file.filename}`;
  return res.status(200).json({ url });
});


module.exports = router;
