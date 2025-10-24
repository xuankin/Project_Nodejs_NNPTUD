module.exports = {
    Response: function (res, statusCode,success, data) {
        res.status(statusCode).send({
            success: success,
            data: data
        })
    }
}