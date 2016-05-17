exports.index = function (req, res) {
    res.render('index', {title: 'delolap'});
};

exports.partials = function (req, res) {
    var name = req.params.name;
    res.render('partials/' + name);
};