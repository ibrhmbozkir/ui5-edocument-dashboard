sap.ui.define([
  "sap/ui/model/odata/v2/ODataModel"
], function (ODataModel) {
  "use strict";

  return {
    createODataModel: function (sServiceUrl) {
      return new ODataModel(sServiceUrl, {
        json: true,
        defaultBindingMode: "TwoWay",
        useBatch: false
      });
    }
  };
});
