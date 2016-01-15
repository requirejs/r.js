({
	appDir: "src/",
	baseUrl: "./",
	dir: "built/",
	optimize: "none",
	modules: [
		{
			name: "a",
			exclude: ["b", "z"]
		},
		{
			name: "b",
			exclude: ["a", "z"]
		},
		{
			name: "z",
			exclude: ["a", "b"]
		}
	]
})