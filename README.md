# ✍️ ScriptPad

A modern script writing application for content creators. Write your scripts, organize them, and export them for your workflow.

![ScriptPad Screenshot](https://raw.githubusercontent.com/leksautomate/ScriptPad/main/screenshot.png)

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 📝 **Multi-Script Editor** | Create and manage multiple scripts in tabs |
| 📄 **Description Editor** | Dedicated space for YouTube video descriptions |
| 🎨 **4 Themes** | Studio Dark, Studio Blue, Hacker Pro, Light Mode |
| 💾 **Auto-Save** | Scripts save automatically to LocalStorage |
| 📊 **Word Count & Read Time** | Estimates based on your speaking pace (WPM) |
| 📋 **Workflow Status** | Track scripts: Draft → Ready → Posted |
| 📥 **Import/Export** | Import `.txt` files and export your scripts |

---

## 🚀 Quick Start

### Run Locally

```bash
# Clone the repository
git clone https://github.com/leksautomate/ScriptPad.git
cd ScriptPad

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for Production

```bash
npm run build
```

Output will be in the `dist/` folder.

---

## � Usage

### Writing Scripts
- Use the main editor to write your video script.
- **Word Count & Read Time** stats update automatically as you type.
- **Themes** can be toggled to match your environment (Dark/Light/Hacker).

### YouTube Description Editor
- Toggle the **[ Script | Desc ]** button in the header to switch views.
- Use the **Desc** view to draft your video summary, hashtags, links, and SEO tags.
- This content is saved alongside your script, keeping everything in one place.

### Exporting
- **Export to .txt**: Downloads your script as a plain text file.
- **Export to PDF**: Creates a formatted PDF including your script and metadata.

---

## �🖥️ Deploy to VPS

One-command deployment to your own server:

```bash
curl -sSL https://raw.githubusercontent.com/leksautomate/ScriptPad/main/deploy.sh | sudo bash
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for full instructions.

---

## 🛠️ Tech Stack

- **Frontend:** React 19 + Vite
- **Styling:** Tailwind CSS v4
- **Icons:** Lucide React
- **Storage:** Browser LocalStorage (no backend required)

---

## 📁 Project Structure

```
scriptpad/
├── src/
│   ├── App.jsx           # Main application component
│   ├── storageUtils.js   # LocalStorage helpers
│   ├── index.css         # Tailwind CSS imports
│   └── main.jsx          # React entry point
├── deploy.sh             # VPS deployment script
├── DEPLOYMENT.md         # Deployment documentation
└── package.json
```

---

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

---

## 📄 License

MIT License - feel free to use for personal or commercial projects.

---

<p align="center">
  Made with ❤️ for content creators
</p>
#
