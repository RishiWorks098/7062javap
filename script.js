let programs = [];
let selectedFolder = null;
let selectedProgram = null;

const $ = id => document.getElementById(id);

// ZIP filename in your GitHub repository
const DEFAULT_ZIP = "java_programs.zip";

// Convert folder names into readable headings
function formatName(name) {
    return name
        .split("/")
        .map(part =>
            part.replace(/[-_]/g, " ")
                .replace(/\b\w/g, c => c.toUpperCase())
        )
        .join(" / ");
}

// Get unique topic folders
function getFolders() {
    return [...new Set(programs.map(p => p.folder))]
        .sort((a, b) => a.localeCompare(b));
}

// Load ZIP file
async function loadZip(file) {

    if (!file || !file.name.toLowerCase().endsWith(".zip")) {
        $("uploadStatus").textContent = "Please select a valid ZIP file.";
        return;
    }

    $("uploadStatus").textContent = "Loading Java programs...";

    try {

        const zip = await JSZip.loadAsync(file);
        const loadedPrograms = [];

        for (const [path, entry] of Object.entries(zip.files)) {

            if (entry.dir || !path.toLowerCase().endsWith(".java")) {
                continue;
            }

            let parts = path.split("/").filter(Boolean);

            // Remove main ZIP folder name, if present
            if (parts[0] === "java_programs") {
                parts.shift();
            }

            if (parts.length === 0) continue;

            const filename = parts[parts.length - 1];

            const folder = parts.length > 1
                ? parts.slice(0, -1).join("/")
                : "General";

            const code = await entry.async("string");

            loadedPrograms.push({
                folder: folder,
                file: filename,
                path: parts.join("/"),
                code: code
            });

        }

        if (loadedPrograms.length === 0) {
            throw new Error("No Java files found in this ZIP.");
        }

        programs = loadedPrograms.sort((a, b) =>
            a.folder.localeCompare(b.folder) ||
            a.file.localeCompare(b.file, undefined, { numeric: true })
        );

        selectedFolder = null;
        selectedProgram = null;

        $("totalPrograms").textContent = programs.length;
        $("totalTopics").textContent = getFolders().length;

        $("uploadStatus").textContent =
            `Successfully loaded ${programs.length} Java programs!`;

        showHome();

    } catch (error) {

        $("uploadStatus").textContent = error.message;

    }

}

// Sidebar
function renderNav() {

    const nav = $("topicNav");

    nav.innerHTML = "";

    const allLink = document.createElement("a");

    allLink.className = "topic-link";
    allLink.textContent = "All Programs";

    const count = document.createElement("small");
    count.textContent = programs.length;

    allLink.appendChild(count);

    if (!selectedFolder) {
        allLink.classList.add("active");
    }

    allLink.onclick = showHome;

    nav.appendChild(allLink);

    getFolders().forEach(folder => {

        const link = document.createElement("a");

        link.className = "topic-link";

        if (selectedFolder === folder) {
            link.classList.add("active");
        }

        link.textContent = formatName(folder);

        const number = document.createElement("small");

        number.textContent = programs.filter(
            p => p.folder === folder
        ).length;

        link.appendChild(number);

        link.onclick = () => showFolder(folder);

        nav.appendChild(link);

    });

}

// Create topic cards
function renderTopicCards(filter = "") {

    const container = $("topicCards");

    container.innerHTML = "";

    const folders = getFolders().filter(folder => {

        return formatName(folder)
            .toLowerCase()
            .includes(filter.toLowerCase()) ||
            programs.some(p =>
                p.folder === folder &&
                p.file.toLowerCase().includes(filter.toLowerCase())
            );

    });

    $("topicCount").textContent = folders.length + " Topics";

    folders.forEach((folder, index) => {

        const card = document.createElement("div");

        card.className = "topic-card";

        const count = programs.filter(
            p => p.folder === folder
        ).length;

        card.innerHTML = `
            <div class="card-top">
                <span class="topic-symbol">
                    ${String(index + 1).padStart(2, "0")}
                </span>

                <small>${count} PROGRAMS</small>
            </div>

            <h3></h3>
            <p>Browse Java source programs</p>
        `;

        card.querySelector("h3").textContent = formatName(folder);

        card.onclick = () => showFolder(folder);

        container.appendChild(card);

    });

}

// Home page
function showHome() {

    selectedFolder = null;
    selectedProgram = null;

    $("homeSection").classList.remove("hidden");
    $("programSection").classList.add("hidden");
    $("codeSection").classList.add("hidden");

    $("breadcrumbTopic").textContent = "All Topics";

    $("searchInput").value = "";

    renderNav();
    renderTopicCards();

}

// Display programs of a folder
function showFolder(folder) {

    selectedFolder = folder;
    selectedProgram = null;

    $("homeSection").classList.add("hidden");
    $("programSection").classList.remove("hidden");
    $("codeSection").classList.add("hidden");

    $("selectedTopic").textContent = formatName(folder);

    $("breadcrumbTopic").textContent = formatName(folder);

    $("searchInput").value = "";

    renderProgramList(
        programs.filter(p => p.folder === folder)
    );

    renderNav();

}

// Program list
function renderProgramList(list) {

    const container = $("programList");

    container.innerHTML = "";

    $("programCount").textContent =
        list.length + " Programs";

    list.forEach(program => {

        const card = document.createElement("div");

        card.className = "program-card";

        card.innerHTML = `
            <div class="card-top">
                <span class="topic-symbol">{ }</span>
                <small>JAVA</small>
            </div>
            <h3></h3>
            <p></p>
        `;

        card.querySelector("h3").textContent = program.file;
        card.querySelector("p").textContent = formatName(program.folder);

        card.onclick = () => showProgram(program);

        container.appendChild(card);

    });

    if (list.length === 0) {
        container.textContent = "No programs found.";
    }

}

// Open code viewer
function showProgram(program) {

    selectedProgram = program;

    $("homeSection").classList.add("hidden");
    $("programSection").classList.add("hidden");
    $("codeSection").classList.remove("hidden");

    $("fileName").textContent = program.file;

    $("filePath").textContent =
        formatName(program.folder) + " / " + program.file;

    $("programDescription").textContent =
        "Java source code from the " +
        formatName(program.folder) +
        " topic. File: " + program.file;

    // textContent safely displays Java source code
    $("codeBlock").textContent = program.code;

    $("breadcrumbTopic").textContent =
        formatName(program.folder) + " / " + program.file;

    $("copyBtn").textContent = "▢ Copy Code";

    renderNav();

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}

// Copy Java code
$("copyBtn").addEventListener("click", async () => {

    if (!selectedProgram) return;

    try {

        await navigator.clipboard.writeText(
            selectedProgram.code
        );

        $("copyBtn").textContent = "✓ Copied!";

    } catch {

        $("copyBtn").textContent =
            "Copy unavailable";

    }

});

// Download individual Java file
$("downloadBtn").addEventListener("click", () => {

    if (!selectedProgram) return;

    const blob = new Blob(
        [selectedProgram.code],
        { type: "text/plain;charset=utf-8" }
    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download = selectedProgram.file;

    document.body.appendChild(link);

    link.click();

    link.remove();

    URL.revokeObjectURL(url);

});

// Back button
$("backBtn").addEventListener("click", () => {

    if (selectedFolder) {
        showFolder(selectedFolder);
    } else {
        showHome();
    }

});

// Search programs
$("searchInput").addEventListener("input", event => {

    const query = event.target.value.trim().toLowerCase();

    if (!query) {

        if (selectedFolder) {
            showFolder(selectedFolder);
        } else {
            renderTopicCards();
        }

        return;
    }

    // Search across every topic and filename
    const results = programs.filter(program => {

        return (
            program.file.toLowerCase().includes(query) ||
            program.folder.toLowerCase().includes(query) ||
            program.code.toLowerCase().includes(query)
        );

    });

    selectedFolder = null;

    $("homeSection").classList.add("hidden");
    $("programSection").classList.remove("hidden");
    $("codeSection").classList.add("hidden");

    $("selectedTopic").textContent = "Search Results";

    $("breadcrumbTopic").textContent = "Search";

    renderProgramList(results);

    renderNav();

});

// Mobile sidebar
$("menuBtn").addEventListener("click", () => {

    $("sidebar").classList.toggle("open");

});

// Upload ZIP manually
$("zipInput").addEventListener("change", event => {

    const file = event.target.files[0];

    if (file) {
        loadZip(file);
    }

});

// Automatically load ZIP from repository
async function initializeWebsite() {

    try {

        const response = await fetch(DEFAULT_ZIP);

        if (!response.ok) {
            throw new Error("Default ZIP not found.");
        }

        const blob = await response.blob();

        const file = new File(
            [blob],
            DEFAULT_ZIP,
            { type: "application/zip" }
        );

        await loadZip(file);

    } catch {

        $("uploadStatus").textContent =
            "Upload your Java programs ZIP to get started.";

    }

}

initializeWebsite();
