var errors = {
    BAD_REQUEST: {
        status: 400
    },
    UNAUTHORIZED: { // require login
        code: 1,
        status: 401
    },
    FORBIDDEN: {
        code: 1,
        status: 403
    },
    NOT_FOUND: {
        status: 404
    },
    INTERNAL_SERVER_ERROR: {
        code: -1,
        status: 500
    },
    SERVICE_UNAVAILABLE: {
        status: 503
    }
};

/**
 * `ApplicationError` error.
 *
 * @api public
 */
function ApplicationError(message, errorName, errorCode, uri, status) {
    Error.call(this);
    Error.captureStackTrace(this, arguments.callee);
    this.name = 'ApplicationError';

    var error = errors[errorName || 'INTERNAL_SERVER_ERROR'] || {};
    this.message = message;
    this.name = errorName || 'INTERNAL_SERVER_ERROR';
    this.code = errorCode || error.code || -1;
    this.uri = uri;
    this.status = status || error.status || 500;
}

/**
 * Inherit from `Error`.
 */
ApplicationError.prototype.__proto__ = Error.prototype;


/**
 * Expose `ApplicationError`.
 */
module.exports = ApplicationError;