const router = require('express').Router();
const authCtrl = require('../controllers/authController');
const auth = require('../middleware/auth'); // ensures req.user is added

router.post('/register', authCtrl.register);
router.post('/login', authCtrl.login);
router.get('/me', auth, authCtrl.me);

// The commented-out line is correctly handled:
// router.get('/me', authMiddleware, getCurrentUser); 

module.exports = router;