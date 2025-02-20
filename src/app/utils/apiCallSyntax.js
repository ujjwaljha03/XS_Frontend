import axios from "axios";

const api = axios.create({
    baseURL: "http://localhost:8080" , // My backend Base Url
    withCredentials: true,     // ensure cookies, session are included when I am using cookies instead of localStorage
});
export default api;