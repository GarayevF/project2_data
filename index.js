const express = require("express");
const bodyParser = require('body-parser');
const jsonServer = require("json-server"); 
const server = jsonServer.create();
const router = jsonServer.router("db.json");
const middlewares = jsonServer.defaults();

server.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  next();
});


server.use(bodyParser.json());
server.use(bodyParser.urlencoded({ extended: true }));

server.use(middlewares);

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

      const matchesTags = tagsQuery ?
        tags.split(",").some(a => tagsQuery.toLowerCase() == a.toLowerCase())
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

server.get("/api/sort", (req, res) => {
  try {
    const { sortBy, order = "asc" } = req.query; 

    if (!sortBy) {
      return res.status(400).json({ error: 'Missing sortBy parameter. Please provide a valid "sort by" value.' });
    }

    const recipes = router.db.get("recipes").value();

    if (!recipes) {
      return res.status(404).json({ error: "Recipes not found" });
    }

    const sortedRecipes = recipes.sort((a, b) => {
      let result = 0;

      switch (sortBy.toLowerCase()) {
        case "title":
          result = a.title.localeCompare(b.title);
          break;

        case "date":
          result = new Date(a.lastUpdated) - new Date(b.lastUpdated);
          break;

        case "tags":
          result = (a.tags?.length || 0) - (b.tags?.length || 0);
          break;

        case "difficulty":
          const difficultyOrder = { easy: 1, medium: 2, hard: 3 };
          result =
            (difficultyOrder[a.difficulty?.toLowerCase()] || 0) -
            (difficultyOrder[b.difficulty?.toLowerCase()] || 0);
          break;

        default:
          return res.status(400).json({ error: `Invalid sortBy value: ${sortBy}. Valid options are 'title', 'createdTime', 'tags', 'difficulty'.` });
      }

      return order.toLowerCase() === "desc" ? -result : result;
    });

    res.json(sortedRecipes);
  } catch (error) {
    console.error("Error in /api/sort endpoint:", error.message);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
});

server.get("/recipes", (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + parseInt(limit);

  const recipes = router.db.get("recipes").value();
  const paginatedRecipes = recipes.slice(startIndex, endIndex);

  res.json(paginatedRecipes);
});

server.patch("/api/update-order", (req, res) => {
  try {
    const { id, order } = req.body;

    if (!order || typeof order !== "object" || !order.id || !order.order) {
      return res.status(400).json({ error: "Invalid order format" });
    }

    const recipe = router.db.get("recipes").find({ id }).value();
    console.log(router.db.get("recipes"))
    console.log(router.db.get("recipes").find({ id }))
    console.log(recipe)
    if (recipe) {
      router.db.get("recipes").find({ id }).assign({ order }).write();
    }
    

    res.status(200).json({ message: "Order updated successfully" });
  } catch (error) {
    console.error("Error updating order:", error.message);
    res.status(500).json({ error: "Internal Server Error 500." });
  }
});


const port = process.env.PORT || 8080;


server.use(router);

server.listen(port);
