sap.ui.define([
  "sap/ui/core/UIComponent",
  "sap/ui/model/json/JSONModel",
  "project1/model/models",
  "project1/localService/mockserver"
], function (UIComponent, JSONModel, models, mockserver) {
  "use strict";

  return UIComponent.extend("project1.Component", {
    metadata: {
      manifest: "json"
    },

    init: function () {
      UIComponent.prototype.init.apply(this, arguments);

      // Start mockserver when running locally (BAS, preview, etc.)
      mockserver.init();

      // OData model (V2) from manifest datasource
      this.setModel(models.createODataModel(this.getManifestEntry("sap.app").dataSources.mainService.uri));

      // UI state model
      this.setModel(new JSONModel({ selectedTitle: "All Documents" }), "ui");

        sap.ui.getCore().applyTheme("sap_horizon");

  jQuery.sap.includeStyleSheet(sap.ui.require.toUrl("project1/css/style.css"));
    }
  });
});
