//A test of a config modification that adds a path.
requirejs.config({
    'something/else': 'ok',
    _another_thing: 'ok',
    baseUrl: 'some/thing',
    paths: {
        newlyAdded: 'some/added/path'
    }
});
