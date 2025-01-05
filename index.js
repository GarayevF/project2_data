const jsonServer = require("json-server"); 
const server = jsonServer.create();
const router = jsonServer.router("db.json");
const middlewares = jsonServer.defaults();

server.get("/api/search", (req, res) => {
  const query = req.query.q?.toLowerCase() || ""; 
  const recipes = router.db.get("recipes").value(); 

  // Sorguya göre filtreleme
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

const port = process.env.PORT || 8080;

server.use(middlewares);
server.use(router);

server.listen(port);
