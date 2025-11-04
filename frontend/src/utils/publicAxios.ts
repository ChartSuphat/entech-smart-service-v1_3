// import axios from 'axios';

// const publicApi = axios.create({
//   baseURL: '/api',
//   withCredentials: true,
//   headers: {
//     'Content-Type': 'application/json',
//   },
//   timeout: 30000,
// });

// publicApi.interceptors.request.use(
//   (config) => {
//     const token = localStorage.getItem('token');
//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }
//     return config;
//   },
//   (error) => {
//     return Promise.reject(error);
//   }
// );

// // publicApi.interceptors.response.use(
// //   (response) => response,
// //   (error) => {
// //     if (error.response?.status === 401) {
// //       localStorage.removeItem('user');
// //       localStorage.removeItem('userId');
// //       localStorage.removeItem('token');
// //       // window.location.href = '/login';
// //     }
// //     return Promise.reject(error);
// //   }
// // );

// export default publicApi;