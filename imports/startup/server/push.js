//Push.debug = true;

Push.allow({
    send: function(userId, notification) {
        return true; // Allow all users to send
    }
});

Meteor.startup(() => {
    process.env.MAIL_URL = "smtps://postmaster%40zabudem.ru:77518840c9fe93a746b8d6bfb3d7b71a@smtp.mailgun.org:587";
});

Meteor.methods({
    sendEmail: function(to,text,subject) {
        check(to, String);
		check(text, String);
        check(subject, String);
        Email.send({
            from: 'postmaster@zabudem.ru',
            to: to,
            subject: subject,
            text: text
        });
    },
    serverNotification: function(text,title,notId) {
		check(text, String);
		check(title, String);
        check(notId, Number);
        var badge = 1;
        Push.send({
            from: 'push',
            title: title,
            text: text,
            badge: badge,
            query: {
                // this will send to all users
            },
            notId: notId
        });
    },
    userNotification: function(text,title,userId,notId) {
        if (!userId) return false;
        check(text, String);
		check(title, String);
        check(userId, String);
        check(notId, Number);
        var badge = 1;
        Push.send({
            from: 'push',
            title: title,
            text: text,
            badge: badge,
            query: {
                userId: userId
            },
            notId: notId
        });
    },
});
