var observableModule = require("data/observable");
var view = require("ui/core/view");

var page
var displayTenants = []

exports.loaded = function(args) {
    page = args.object;

    displayTenants = [{name:"All Tenants",id:-1,toString:function() {return "All Tenants"}}]
    var rts = page.navigationContext.tenants

    for(var i=0;i < rts.length;i++) {
        displayTenants.push({
            name: rts[i].name,
            id: rts[i].id,
            toString: function() { return this.name }
        }) 
    }
    var bindingc = new observableModule.fromObject({tenants:displayTenants});
    page.bindingContext = bindingc;

};
exports.filterTenant = function() {
    var selTenant = displayTenants[view.getViewById(page, "tenantPicker").selectedIndex]

    page.navigationContext.selection.selectedId = selTenant.id;

    const topmost = require("ui/frame").topmost;
    topmost().goBack();
} 