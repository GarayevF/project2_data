const jsonServer = require("json-server"); 
const server = jsonServer.create();
const router = jsonServer.router("db.json");
const middlewares = jsonServer.defaults();

server.get("/api/search", (req, res) => {
  const query = req.query.q?.toLowerCase() || ""; 
  const recipes = router.db.get("recipes").value(); 

  const filteredRecipes = recipes.filter((recipe) => {
    const { title, description, ingredients } = recipe;

    return (
      title.toLowerCase().includes(query) || 
      description.toLowerCase().includes(query) ||
      ingredients.toLowerCase().includes(query)
    );
  });

  res.json(filteredRecipes); 
});

server.get("/api/filter", (req, res) => {
  try {
    const { tags: tagsQuery, difficulty: difficultyQuery } = req.query;
    const recipes = router.db.get("recipes").value();

    if (!recipes) {
      return res.status(404).json({ error: "Recipes not found" });
    }

    const filteredRecipes = recipes.filter((recipe) => {
      const { tags, difficulty } = recipe;

      const matchesTags = tagsQuery
        ? Array.isArray(tags) &&
          tagsQuery.split(",").every((tag) =>
            tags.map((t) => t.toLowerCase()).includes(tag.toLowerCase())
          )
        : true;

      
      const matchesDifficulty = difficultyQuery
        ? difficultyQuery.toLowerCase() === difficulty?.toLowerCase()
        : true;

      
      return matchesTags && matchesDifficulty;
    });

    res.json(filteredRecipes);
  } catch (error) {
    console.error("Error in /api/filter endpoint:", error.message);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
});

const port = process.env.PORT || 8080;

server.use(middlewares);
server.use(router);

server.listen(port);
