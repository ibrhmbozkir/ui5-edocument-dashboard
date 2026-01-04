sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/json/JSONModel",
  "sap/ui/model/Filter",
  "sap/ui/model/FilterOperator",
  "sap/m/MessageToast"
], function (Controller, JSONModel, Filter, FilterOperator, MessageToast) {
  "use strict";

  return Controller.extend("project1.controller.Main", {

    onInit: function () {
      // ---- UI Model (view>/...) ----
      this._viewModel = new JSONModel({
        selectionText: "Showing all documents.",
        quickFilter: "ALL",
        kpi: { total: 0, error: 0, sent: 0, queued: 0, received: 0 }
      });
      this.getView().setModel(this._viewModel, "view");

      // ---- Navigation Model (nav>/...) ----
      // (ÇALIŞAN model: /countries -> country item -> processes)
      this._navModel = new JSONModel({
        selectedKey: "ALL",
        countries: [{
          key: "ALL",
          text: "All (0)",
          icon: "sap-icon://home",
          processes: []
        }]
      });
      this.getView().setModel(this._navModel, "nav");

      this._currentNodeFilters = [];
      this._lastSearch = "";

      const oTable = this.byId("tblDocs");
      if (oTable) {
        oTable.attachUpdateFinished(() => {
          this._rebuildNavigation();
          this._updateKpisFromBinding();
        });
      }
    },

    onRefresh: function () {
      const oBinding = this._getTableBinding();
      if (oBinding) oBinding.refresh(true);
      MessageToast.show("Refreshed");
    },

    onOpenSettings: function () {
      MessageToast.show("Settings (demo)");
    },

    onNavSelect: function (oEvent) {
      const oItem = oEvent.getParameter("item");
      const sKey = oItem ? oItem.getKey() : "ALL";
      this._navModel.setProperty("/selectedKey", sKey);

      this._viewModel.setProperty("/quickFilter", "ALL");
      this._lastSearch = "";

      if (sKey === "ALL") {
        this._currentNodeFilters = [];
        this._applyFilters([]);
        this._viewModel.setProperty("/selectionText", "Showing all documents.");
        return;
      }

      if (sKey.startsWith("C::")) {
        const sCountry = sKey.substring(3);
        this._currentNodeFilters = [new Filter("Country", FilterOperator.EQ, sCountry)];
        this._applyFilters(this._currentNodeFilters);
        this._viewModel.setProperty("/selectionText", `Country = ${sCountry}`);
        return;
      }

      if (sKey.includes("::")) {
        const [sCountry, sProcess] = sKey.split("::");
        this._currentNodeFilters = [
          new Filter("Country", FilterOperator.EQ, sCountry),
          new Filter("Process", FilterOperator.EQ, sProcess)
        ];
        this._applyFilters(this._currentNodeFilters);
        this._viewModel.setProperty("/selectionText", `Country = ${sCountry}, Process = ${sProcess}`);
      }
    },

    onQuickFilterChange: function (oEvent) {
      const sKey = oEvent.getParameter("key") || "ALL";
      this._viewModel.setProperty("/quickFilter", sKey);
      this._applyFilters(this._currentNodeFilters || []);
    },

    onSearch: function (oEvent) {
      const sQuery = (oEvent.getParameter("newValue") || oEvent.getParameter("query") || "").trim();
      this._lastSearch = sQuery;
      this._applyFilters(this._currentNodeFilters || []);
    },

    onRowPress: function (oEvent) {
      const oObj = oEvent.getSource().getBindingContext() && oEvent.getSource().getBindingContext().getObject();
      if (oObj) MessageToast.show(`Doc ${oObj.DocId} selected`);
    },

    onKpiPress: function (oEvent) {
      const sHeader = oEvent.getSource().getHeader();
      this._lastSearch = "";

      if (sHeader === "Errors") this._viewModel.setProperty("/quickFilter", "ERROR");
      else if (sHeader === "Sent") this._viewModel.setProperty("/quickFilter", "SENT");
      else if (sHeader === "Queued") this._viewModel.setProperty("/quickFilter", "QUEUED");
      else if (sHeader === "Received") this._viewModel.setProperty("/quickFilter", "RECEIVED");
      else this._viewModel.setProperty("/quickFilter", "ALL");

      this._applyFilters(this._currentNodeFilters || []);
    },

    _getTableBinding: function () {
      const oTable = this.byId("tblDocs");
      return oTable ? oTable.getBinding("items") : null;
    },

    _applyFilters: function (aNodeFilters) {
      const aFilters = [...(aNodeFilters || [])];

      const sQuick = this._viewModel.getProperty("/quickFilter");
      if (sQuick && sQuick !== "ALL") {
        aFilters.push(new Filter("Status", FilterOperator.EQ, sQuick));
      }

      if (this._lastSearch) {
        aFilters.push(new Filter({
          filters: [
            new Filter("DocId", FilterOperator.Contains, this._lastSearch),
            new Filter("Process", FilterOperator.Contains, this._lastSearch),
            new Filter("FileName", FilterOperator.Contains, this._lastSearch)
          ],
          and: false
        }));
      }

      const oBinding = this._getTableBinding();
      if (oBinding) oBinding.filter(aFilters);
    },

    _rebuildNavigation: function () {
      const oBinding = this._getTableBinding();
      if (!oBinding) return;

      const aDocs = oBinding.getCurrentContexts().map(c => c.getObject()).filter(Boolean);

      const countryMap = new Map();
      let total = 0;

      aDocs.forEach(d => {
        const c = d.Country || "??";
        const p = d.Process || "UNKNOWN";
        total++;

        if (!countryMap.has(c)) countryMap.set(c, { total: 0, procMap: new Map() });
        const entry = countryMap.get(c);
        entry.total++;
        entry.procMap.set(p, (entry.procMap.get(p) || 0) + 1);
      });

      const aCountries = [{
        key: "ALL",
        text: `All (${total})`,
        icon: "sap-icon://home",
        processes: []
      }];

      Array.from(countryMap.keys()).sort().forEach(country => {
        const entry = countryMap.get(country);

        const aProc = Array.from(entry.procMap.keys()).sort().map(proc => ({
          key: `${country}::${proc}`,
          text: `${proc} (${entry.procMap.get(proc)})`,
          icon: "sap-icon://chevron-phase"
        }));

        aCountries.push({
          key: `C::${country}`,
          text: `${country} (${entry.total})`,
          icon: "sap-icon://globe",
          processes: aProc
        });
      });

      this._navModel.setProperty("/countries", aCountries);
    },

    _updateKpisFromBinding: function () {
      const oBinding = this._getTableBinding();
      if (!oBinding) return;

      const aDocs = oBinding.getCurrentContexts().map(c => c.getObject()).filter(Boolean);
      const kpi = { total: aDocs.length, error: 0, sent: 0, queued: 0, received: 0 };

      aDocs.forEach(d => {
        const s = (d.Status || "").toUpperCase();
        if (s === "ERROR") kpi.error++;
        if (s === "SENT") kpi.sent++;
        if (s === "QUEUED") kpi.queued++;
        if (s === "RECEIVED") kpi.received++;
      });

      this._viewModel.setProperty("/kpi", kpi);
    }

  });
});
