import { installRuntimeRegistry, createClientInit } from '$pano/kit/hooks-client.js';

installRuntimeRegistry();

export const init = createClientInit();
