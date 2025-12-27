sap.ui.define([
  "sap/ui/core/util/MockServer"
], function (MockServer) {
  "use strict";

  let _oMockServer;

  function _isAlreadyRunning() {
    return !!_oMockServer;
  }

  return {
    init: function () {
      if (_isAlreadyRunning()) {
        return;
      }

      const sRootUri = "/localService/mainService/";
      _oMockServer = new MockServer({ rootUri: sRootUri });

      MockServer.config({
        autoRespond: true,
        autoRespondAfter: 250
      });

      _oMockServer.simulate(
        "localService/mainService/metadata.xml",
        {
          sMockdataBaseUrl: "mockdata",
          bGenerateMissingMockData: false
        }
      );

      _oMockServer.start();
      // eslint-disable-next-line no-console
      console.log("MockServer running at " + sRootUri);
    }
  };
});
