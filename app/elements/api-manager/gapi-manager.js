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

let _onLoad;

/**
 * Error with an HTTP status code, thrown when API request fails.
 */
class HTTPError extends Error {
  constructor(code, message) {
    super();
    this.message = message;
    this.code = code;
  }
}

/**
 * Error signaling authorization failed.
 */
class AuthError extends Error {
  constructor(errorType, errorSubtype) {
    super();
    this.message = errorType + ': ' + errorSubtype;
    this.type = errorType;
    this.subtype = errorSubtype;

    this.accessDenied = (errorSubtype === 'access_denied');
  }
}

class GAPIManager {
  constructor() {
    this._scopes = [];
    this._clientId = '';
    this._loadedAPIs = [];

    // Promise that resolves to the gapi object.
    this._loadedGAPI = new Promise(resolve => {
      _onLoad = () => {
        resolve(window.gapi);
      };
    });
  }

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
    return this._loadedGAPI
      .then(_gapi => {
        let loadedAPI = new Promise((resolve, reject) => {
          _gapi.client.load(name, version, null, apiRoot).then(resp => {
            if (resp && resp.error) {
              reject(new HTTPError(resp.error.code, resp.error.message));
            } else if (!_gapi.client[name]) {
              reject(new HTTPError(404, 'Not Found.'));
            } else {
              resolve(_patchifyAPI(_gapi.client[name]));
            }
          });
        });

        this._loadedAPIs.push(loadedAPI);
        return loadedAPI;
      });
  }

  /**
   * Finish loading all APIs set to load with APIManager.loadAPI.
   *
   * @return Promise that resolves when all loadAPI promises previously made
   *   have resolved.
   */
  loadAllAPIs() {
    return Promise.all(this._loadedAPIs);
  }

  /**
   * Set scopes to authorize.
   *
   * This should be done before calling GAPIManager.authenticate().
   */
  setScopes(scopes) {
    this._scopes = scopes;
  }

  /**
   * Set client ID to authorize with.
   *
   * This should be done before calling GAPIManager.authenticate().
   */
  setClientId(clientId) {
    this._clientId = clientId;
  }

  /**
   * Authenticate with the clientId and scopes set previously.
   *
   * @return Promise that resolves with undefined when authenticated.
   */
  authorize(mode) {
    return this._loadedGAPI
      .then(_gapi => new Promise((resolve, reject) => {
        _gapi.auth.authorize({
          client_id: this._clientId,
          scope: this._scopes,
          immediate: mode,
          cookie_policy: window.location.origin,
        }, resp => {
          if (resp.error) {
            reject(new AuthError(resp.error, resp.error_subtype));
          } else {
            resolve(resp);
          }
        });
      }));
  }

  /**
   * Sign the currently authed user out.
   */
  signOut() {
    this._loadedGAPI.then(_gapi => _gapi.auth.signOut());
  }
}

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

window.GAPIManager = new GAPIManager();
window.__onGAPILoad__ = _onLoad;

window.GAPIManager.HTTPError = HTTPError;
window.GAPIManager.AuthError = AuthError;

})();
