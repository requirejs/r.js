//A test of a config modification that adds a path.
requirejs.config({
    "baseUrl": "some/thing",
    "paths": {
        "newlyAdded": "some/added/path"
    }
});
