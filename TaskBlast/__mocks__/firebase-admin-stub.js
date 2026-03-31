// Minimal stub for firebase-admin — overridden by jest.mock() factory in test files
module.exports = {
  initializeApp: function () {},
  firestore: Object.assign(function () { return {}; }, {
    FieldValue: { serverTimestamp: function () {}, increment: function () {} },
    Timestamp: { fromMillis: function () {} },
    Transaction: function () {},
  }),
  auth: function () { return {}; },
};
