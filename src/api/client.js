/**
 * Pre-configured Axios instance.
 *
 * baseURL is read from the project-root .config.json so no API paths
 * are hard-coded in component files.
 *
 * @module api/client
 * @license CC BY-NC-SA 4.0
 */

import axios from 'axios';
import config from '../../.config.json';

const client = axios.create({
    baseURL: config.apiBase,
    withCredentials: true,
    headers: { 'Content-Type': 'application/json' },
});

export default client;
