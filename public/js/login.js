import axios from 'axios';
import { showAlert } from './alerts';

export const login = async (email, password) => {
  // console.log(email, password);
  try {
    const res = await axios({
      method: 'POST',
      url: 'http://localhost:3000/api/v1/users/login',
      data: {
        email,
        password
      }
    });

    // console.log('data here', res.data.message);
    if (res.data.message === 'success') {
      // console.log('hello');
      showAlert('success', 'Logged in successfully!');
      window.setTimeout(() => {
        location.assign('/');
      }, 1500);
    }
    // console.log('just res ', res);
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};

export const logout = async () => {
  try {
    const res = await axios({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/users/logout'
    });
    // Tried both res.data.message and res.data.status but does not works
    // if (res.data.message === 'success') location.reload(true);
    console.log('res.data.message ', res.data.message);
    console.log('res.data.status ', res.data.status);
    if (res.data.status === 'success') location.reload(true);
  } catch (err) {
    console.log(err.response);
    showAlert('error', 'Error logging out! Try again.');
  }
};
