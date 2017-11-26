//Push.debug = true;

Push.allow({
    send: function(userId, notification) {
        return true; // Allow all users to send
    }
});

Meteor.methods({
    serverNotification: function(text,title,from) {
		check(text, String);
		check(title, String);
        check(from, String);
        var badge = 1;
        Push.send({
            from: from,
            title: title,
            text: text,
            badge: badge,
            query: {
                // this will send to all users
            }
        });
    },
    userNotification: function(text,title,userId,from) {
        if (!userId) return false;
        check(text, String);
		check(title, String);
        check(userId, String);
        check(from, String);
        var badge = 1;
        Push.send({
            from: from,
            title: title,
            text: text,
            badge: badge,
            query: {
                userId: userId
            },
        });
    },
});
