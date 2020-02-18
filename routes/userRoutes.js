const express = require('express');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');

const router = express.Router();

// router.param('id', userController.checkID);

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logout);
router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

/* This middleware protect all the routes that comes after this */
router.use(authController.protect);

router.patch(
  '/updateMyPassword', // As for the currently logged in users
  authController.updatePassword
);

router.get('/me', userController.getMe, userController.getUser);
router.delete('/deleteMe', userController.deleteMe);
router.patch(
  '/updateMe',
  userController.uploadUserPhoto,
  userController.resizeUserPhoto,
  userController.updateMe
);

/* All other routes after this middleware are restricted for others except admins */
router.use(authController.restrictTo('admin'));

router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
