/**
 * Created by Krzysztof on 2015-05-23.
 */
var assert = require("assert");
var Log = function(args) {
    assert.ok(args.subject && args.entry && args.userId, "need subject, entry and user Id");

    var log = {};
    log.subject = args.subject;
    log.entry = args.entry;
    log.createdAt = new Date();
    log.userId = args.userId;

    return log;
};

module.exports = Log;