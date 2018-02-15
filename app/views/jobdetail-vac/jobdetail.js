var observableModule = require("data/observable");
var oA = require("data/observable-array");
var rI = require("./../../backend/restIntegration-vac");
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

exports.startJob = function() {
    rI.actionJob(maincontext,activejob,"start",() => {alert("Start command fired!");refresh();},(err) => {alert("Error :"+err)})
}
exports.stopJob = function() {
    rI.actionJob(maincontext,activejob,"stop",() => {alert("Stop command fired!");refresh();},(err) => {alert("Error :"+err)})
}
exports.retryJob = function() {
    rI.actionJob(maincontext,activejob,"retry",() => {alert("Retry command fired!");refresh();},(err) => {alert("Error :"+err)})
}
exports.enableJob = function() {
    rI.actionJob(maincontext,activejob,"enable",() => {alert("Enable command fired!");refresh();},(err) => {alert("Error :"+err)})
}
exports.disableJob = function() {
    rI.actionJob(maincontext,activejob,"disable",() => {alert("Disable command fired!");refresh();},(err) => {alert("Error :"+err)})
}
function refresh(isTimedRefresh) {
    rI.getJob(maincontext,activejob.id,(job) => {
        //console.dir(job)

        activejob.status = job.status
        activejob.lastRun = job.lastRun
        activejob.endTime = job.endTime
        activejob.isEnabled = job.isEnabled
        if(isTimedRefresh && !stoprefreshing) {
            refreshtimeout = timer.setTimeout(() => {timedRefresh()}, 5000);
        }
    },(err)=> { alert("Error :"+err)})
}
function timedRefresh() {
    refresh(true);
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