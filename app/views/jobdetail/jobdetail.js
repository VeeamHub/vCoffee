var observableModule = require("data/observable");
var oA = require("data/observable-array");
var rI = require("./../../backend/restIntegration");
var view = require("ui/core/view");
var timer = require("timer");

var page
var maincontext
var activejob
var refreshtimeout = null;
var stoprefreshing = false;

exports.loaded = function(args) {
    page = args.object;
    activejob = new observableModule.fromObject(page.navigationContext.job);
    page.bindingContext = activejob;
    maincontext = page.navigationContext.maincontext;
};
function refresh() {
    rI.updateJobStatus(maincontext,activejob,(job) => {},(err)=> { alert("Error :"+err)})
}
exports.refresh = refresh 
exports.startJob = function() {
    rI.actionJob(maincontext,activejob,"start",() => {alert("Start command fired!");refresh();},(err) => {alert("Error :"+err)})
}
exports.stopJob = function() {
    rI.actionJob(maincontext,activejob,"stop",() => {alert("Stop command fired!");refresh();},(err) => {alert("Error :"+err)})

}
function timedRefresh() {
    rI.updateJobStatus(maincontext,activejob,(job) => {
        //console.log("refreshed");
        if(!stoprefreshing) {
            refreshtimeout = timer.setTimeout(() => {timedRefresh()}, 5000);
        }
    },(err)=> { alert("Error :"+err)})
}
exports.navstart = function() {
    stoprefreshing = false;
    refreshtimeout = timer.setTimeout(() => {timedRefresh()}, 5000);
}
exports.navstop = function() {
    stoprefreshing  = true;
    if (refreshtimeout != null) { timer.clearInterval(refreshtimeout)}
    //console.log("Need to stop refreshing")
}