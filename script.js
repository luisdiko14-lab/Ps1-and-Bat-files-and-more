const downloadBtn = document.getElementById("downloadBtn");
const viewRepoBtn = document.getElementById("viewRepo");
const compatibilityBtn = document.getElementById("compatibility");
const loader = document.getElementById("loader");

// Helper function to show loader briefly
function handleClick(url) {
  loader.classList.remove("hidden");
  setTimeout(() => {
    window.location.href = url;
    loader.classList.add("hidden");
  }, 700); // simulate loading
}

downloadBtn.addEventListener("click", () => {
  handleClick("https://github.com/luisdiko14-lab/Ps1-and-Bat-files-and-more");
});

viewRepoBtn.addEventListener("click", () => {
  handleClick("https://github.com/luisdiko14-lab/Ps1-and-Bat-files/tree/main/Cool%20Folder%20With%20Files");
});

compatibilityBtn.addEventListener("click", () => {
  handleClick("https://github.com/luisdiko14-lab/Ps1-and-Bat-files-and-more/blob/main/compatibility.md");
});
