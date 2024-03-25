function resetFirstMessagesSent(user) {
    setTimeout(() => {
        firstMessagesSent[user] = false;
    }, 30 * 60 * 1000); 
}

module.exports = resetFirstMessagesSent;
