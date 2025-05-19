
document.addEventListener("DOMContentLoaded", async () => {
  const modelSearch = document.getElementById("model-search");
  const modelGrid = document.getElementById("model-grid");
  const categoryTabs = document.getElementById("category-tabs");

  let models = [];
  let selectedCategory = "All";
  let selectedModel = null;
  let fuse;

  // Load models.json
  try {
    const res = await fetch("/models.json");
    console.log("Fetching /models.json...");
    console.log("Fetching models.json...");    models = await res.json();

    console.log("Loaded models:", models);  } catch (err) {
    console.error("Failed to load models.json", err);
    return;
  }

  // Extract unique categories
  const categories = ["All", ...new Set(models.map(m => m.category))];

  // Create category tabs
  categories.forEach(cat => {
    const tab = document.createElement("button");
    tab.textContent = cat;
    tab.className = "category-tab";
    if (cat === "All") tab.classList.add("active");
    tab.addEventListener("click", () => {
      selectedCategory = cat;
      document.querySelectorAll(".category-tab").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      renderModels();
    });
    categoryTabs.appendChild(tab);
  });

  // Fuse.js setup for search
  fuse = new Fuse(models, {
    keys: ["name", "tags", "category"],
    threshold: 0.3
  });

  modelSearch.addEventListener("input", () => {
    renderModels(modelSearch.value);
  });

  // Render models grid
  function renderModels(searchTerm = "") {
    modelGrid.innerHTML = "";

    let filtered = [...models];
    if (selectedCategory !== "All") {
      filtered = filtered.filter(m => m.category === selectedCategory);
    }

    if (searchTerm.trim()) {
      filtered = fuse.search(searchTerm).map(res => res.item);
    }

    filtered.forEach(model => {
      const card = document.createElement("div");
      card.className = "model-card";
      card.dataset.model = model.id;
      card.innerHTML = \`
        <img src="\${model.image}" alt="\${model.name}" title="\${model.name}" />
        <div class="model-name">\${model.name}</div>
      \`;
      card.addEventListener("click", () => {
        document.querySelectorAll(".model-card").forEach(c => c.classList.remove("active"));
        card.classList.add("active");
        selectedModel = model.id;
      });
      modelGrid.appendChild(card);
    });
  }

  renderModels();

  // Image generation logic (same as before)
  const generateButton = document.getElementById("generate-button");
  const promptInput = document.getElementById("prompt");
  const negativePromptInput = document.getElementById("negative-prompt");
  const imagePreview = document.getElementById("image-preview");

  generateButton?.addEventListener("click", async () => {
    const prompt = promptInput.value.trim();
    const negativePrompt = negativePromptInput.value.trim();

    if (!prompt || !selectedModel) {
      alert("Enter a prompt and select a model.");
      return;
    }

    window.location.href = "loading.html";

    const payload = {
      prompt,
      negative_prompt: negativePrompt,
      model: selectedModel,
      options: {
        restore_faces: true,
        high_res: true
      }
    };

    try {
      const response = await fetch("/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      const imageUrl = data.image_url;

      setTimeout(() => {
        window.location.href = \`index.html?image=\${encodeURIComponent(imageUrl)}\`;
      }, 1000);
    } catch (err) {
      alert("Generation failed.");
      console.error(err);
    }
  });

  const urlParams = new URLSearchParams(window.location.search);
  const imageUrl = urlParams.get("image");
  if (imageUrl && imagePreview) {
    const img = document.createElement("img");
    img.src = imageUrl;
    img.style.width = "100%";
    imagePreview.appendChild(img);
  }
});
