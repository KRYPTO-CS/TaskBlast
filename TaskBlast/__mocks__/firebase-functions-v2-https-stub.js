// Minimal stub for firebase-functions/v2/https — overridden by jest.mock() factory in test files
class HttpsError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
    this.name = 'HttpsError';
  }
}
module.exports = {
  onCall: function (_opts, handler) { return handler; },
  HttpsError,
  CallableRequest: function () {},
};
