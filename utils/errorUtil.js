const os = require('os');

/*
err - error object from Promise
action - string containing type of the action (create, update, delete..)
entity - entity name (user, company, event ...)
*/
const buildErrorMessage = (err, action, entity) => {
    if (!err || !err.errors) {
        return 'Internal server error';
    }
    const keys = Object.keys(err.errors);
    let errorMessage = `Unable to ${action} ${entity}. ` +
        `Please reffer to reasons below as to why. ${os.EOL}`;
    keys.forEach(key => {
        errorMessage += `\t${err.errors[key].message} ${os.EOL}`;
    });
    return errorMessage;
};

module.exports = {
    buildErrorMessage
}