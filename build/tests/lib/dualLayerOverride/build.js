({
    "optimize": "none",
    "dir" : "built",
    "modules" : [
        { "name" : "message", "override" : { "paths" : { "who" : "empty:" } } },
        { "name" : "who", "override" : { "paths" : { "message" : "empty:" } } }
    ]
})

