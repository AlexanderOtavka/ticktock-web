// Copyright (c) 2016 Drake Developers Club All Rights Reserved.

/**
 * Defines GAPIManager object for promise oriented GAPI communication.
 *
 * Client library must be loaded after gapi-manager.js with callback named
 * '__onGAPILoad__', eg:
 * ```
 *   <script src="https://apis.google.com/js/client.js?onload=__onGAPILoad__">
 *   </script>
 * ```
 *
 * @author Zander Otavka
 */
(function () {
'use strict';

if (window.hasOwnProperty('GAPIManager')) {
  return;
}

let _scopes = [];
let _clientId = '';
let _loadedAPIs = {};

let _onLoad;

// Promise that resolves to the gapi object.
let _gapiLoaded = new Promise(resolve => {
  _onLoad = () => {
    resolve(window.gapi);
  };
});

/**
 * Base class for errors in GAPIManager.
 */
class GAPIError {
  constructor(message, data = {}) {
    this.message = message;
    this.data = data;
  }
}

/**
 * Error with an HTTP status code, thrown when API request fails.
 */
class HTTPError extends GAPIError {
  constructor(code, message, data) {
    super(message, data);
    this.code = code;
  }
}

/**
 * Error signaling authorization failed.
 */
class AuthError extends GAPIError {
  static get ACCESS_DENIED() {
    return 'access_denied';
  }

  static getUnknownError(data) {
    return new AuthError('unknown', AuthError.ACCESS_DENIED, data);
  }

  constructor(errorType, errorSubtype, data) {
    super(`${errorType}: ${errorSubtype}`, data);
    this.type = errorType;
    this.subtype = errorSubtype;

    this.accessDenied = (errorSubtype === AuthError.ACCESS_DENIED);
  }
}

let GAPIManager = {
  HTTPError,
  AuthError,

  /**
   * Load an api with the given data.
   *
   * @param {String} name - API name.
   * @param {String} version - API version.
   * @param {String} apiRoot - Root URI of the API, or undefined for Google
   *   APIs.
   * @return Promise that resolves to an API object.
   */
  loadAPI(name, version, apiRoot) {
    let id = `${name} ${version} ${apiRoot}`;
    return _loadedAPIs[id] || _gapiLoaded
      .then(gapi => {
        let loadedAPI = new Promise((resolve, reject) =>
          gapi.client.load(name, version, null, apiRoot).then(resp => {
            if (resp && resp.error) {
              reject(new HTTPError(resp.error.code, resp.error.message));
            } else if (!gapi.client[name]) {
              reject(new HTTPError(404, 'Not Found.'));
            } else {
              resolve(_patchifyAPI(gapi.client[name]));
            }
          })
        );

        _loadedAPIs[id] = loadedAPI;
        return loadedAPI;
      });
  },

  /**
   * Finish loading all APIs set to load with APIManager.loadAPI.
   *
   * @return Promise that resolves when all loadAPI promises previously made
   *   have resolved.
   */
  loadAllAPIs() {
    return Promise.all(_loadedAPIs.values());
  },

  /**
   * Set scopes to authorize.
   *
   * This should be done before calling GAPIManager.authenticate().
   */
  setScopes(scopes) {
    _scopes = scopes;
  },

  /**
   * Set client ID to authorize with.
   *
   * This should be done before calling GAPIManager.authenticate().
   */
  setClientId(clientId) {
    _clientId = clientId;
  },

  /**
   * Authenticate with the clientId and scopes set previously.
   *
   * @return Promise that resolves with undefined when authenticated.
   */
  authorize(mode) {
    return _gapiLoaded
      .then(gapi => new Promise((resolve, reject) => {
        gapi.auth.authorize({
          client_id: _clientId,
          scope: _scopes,
          immediate: mode,
          cookie_policy: window.location.origin,
        }, resp => {
          if (!resp) {
            reject(AuthError.getUnknownError(resp));
          } else if (resp.error) {
            reject(new AuthError(resp.error, resp.error_subtype));
          } else {
            resolve(resp);
          }
        });
      }));
  },

  /**
   * Sign the currently authed user out.
   */
  signOut() {
    _gapiLoaded.then(gapi => gapi.auth.signOut());
  },
};

/**
 * Recursively crawl the API and return a modified copy that uses promises.
 */
function _patchifyAPI(apiObject) {
  if (apiObject instanceof Function) {
    return params => new Promise((resolve, reject) => {
      apiObject(params).execute(resp => {
        if (!resp) {
          reject(new HTTPError(404, 'Not Found.'));
        } else if (resp.code) {
          reject(new HTTPError(resp.code, resp.message));
        } else {
          resolve(resp);
        }
      });
    });
  } else {
    let copy = {};
    Object.keys(apiObject).forEach(name => {
      if (name !== 'kB') {
        copy[name] = _patchifyAPI(apiObject[name], true);
      }
    });

    return copy;
  }
}

window.GAPIManager = GAPIManager;
window.__onGAPILoad__ = _onLoad;

})();
