import axios from 'axios';
import { showAlert } from './alerts';

export const login = async (email, password) => {
  console.log(email, password);
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
      console.log('hello boss');
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
