import { installRuntimeRegistry, createClientInit, createClientHandleError } from '$pano/kit/hooks-client.js';

installRuntimeRegistry();

export const init = createClientInit();
export const handleError = createClientHandleError();
