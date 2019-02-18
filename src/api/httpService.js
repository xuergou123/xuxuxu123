import axios from 'axios';
let port = 8010
let host = 'http://192.168.0.155:'+port

let axiosConfig = {
    host,
    timeout:5000
}

let instanceTmp = axios.create(axiosConfig)

export default {
    getAxios: instanceTmp,
    getCancelToken: axios.CancelToken
}