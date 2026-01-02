# 🚀 ScriptPad Deployment Guide

Deploy ScriptPad to your own VPS with one command.

---

## ⚡ One-Click Deployment

SSH into your VPS and run:

```bash
curl -sSL https://raw.githubusercontent.com/leksautomate/ScriptPad/main/deploy.sh | sudo bash
```

**Or with wget:**

```bash
wget -qO- https://raw.githubusercontent.com/leksautomate/ScriptPad/main/deploy.sh | sudo bash
```

That's it! The script will install everything and give you a URL when done.

---

## 📋 What Gets Installed

| Component | Details |
|-----------|---------|
| **Node.js 20** | JavaScript runtime |
| **Nginx** | Web server (serves the production build) |
| **ScriptPad** | Installed at `/var/www/scriptpad` |

---

## 🖥️ Supported Operating Systems

- ✅ Ubuntu 20.04 / 22.04 / 24.04
- ✅ Debian 11 / 12
- ✅ CentOS 7 / 8 / Stream
- ✅ RHEL 8 / 9
- ✅ Fedora 38+

---

## 🔄 Updating

To update to the latest version:

```bash
cd /var/www/scriptpad
git pull origin main
npm install
npm run build
sudo systemctl reload nginx
```

---

## 🔒 Adding SSL (HTTPS)

After deployment, secure your site with a free Let's Encrypt certificate:

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get certificate (replace with your domain)
sudo certbot --nginx -d yourdomain.com

# Auto-renewal is configured automatically
```

---

## ⚙️ Manual Deployment

If you prefer manual installation:

### 1. Prerequisites

```bash
# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -
sudo apt install -y nodejs nginx git
```

### 2. Clone & Build

```bash
sudo mkdir -p /var/www/scriptpad
sudo chown $USER:$USER /var/www/scriptpad
git clone https://github.com/leksautomate/ScriptPad.git /var/www/scriptpad
cd /var/www/scriptpad
npm install
npm run build
```

### 3. Configure Nginx

Create `/etc/nginx/sites-available/scriptpad`:

```nginx
server {
    listen 80;
    server_name _;
    
    root /var/www/scriptpad/dist;
    index index.html;
    
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Enable and start:

```bash
sudo ln -s /etc/nginx/sites-available/scriptpad /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🌐 Deploy to Namecheap Shared Hosting

Namecheap shared hosting supports static sites. Since ScriptPad is a React SPA, you can deploy the production build.

### Step 1: Build the Project

On your local machine:

```bash
cd ScriptPad
npm install
npm run build
```

This creates a `dist/` folder with all the files you need.

### Step 2: Create a Subdomain in Namecheap

1. Log in to [Namecheap](https://www.namecheap.com/)
2. Go to **Dashboard** → **Domain List** → Click **Manage** on your domain
3. Go to **Advanced DNS** tab
4. Click **Add New Record**:
   - **Type:** `A Record`
   - **Host:** `scriptpad` (or your preferred subdomain)
   - **Value:** Your hosting IP (found in cPanel → right sidebar)
   - **TTL:** Automatic
5. Click the ✓ to save

### Step 3: Set Up Subdomain in cPanel

1. Log in to your **cPanel** (from Namecheap dashboard → **Go to cPanel**)
2. Find **Domains** section → Click **Subdomains**
3. Create subdomain:
   - **Subdomain:** `scriptpad`
   - **Domain:** Select your domain
   - **Document Root:** `public_html/scriptpad` (or custom folder)
4. Click **Create**

### Step 4: Upload Files via File Manager

1. In cPanel, go to **File Manager**
2. Navigate to the document root you set (e.g., `public_html/scriptpad`)
3. Click **Upload** in the top toolbar
4. Upload **all contents** from your local `dist/` folder:
   - `index.html`
   - `assets/` folder (contains JS and CSS)
   - Any other files in `dist/`

**Or use FTP:**

1. In cPanel → **FTP Accounts** → Create an account or use the main one
2. Connect with FileZilla or any FTP client:
   - **Host:** `ftp.yourdomain.com`
   - **Username:** Your FTP username
   - **Password:** Your FTP password
   - **Port:** `21`
3. Upload the `dist/` contents to your subdomain folder

### Step 5: Add .htaccess for SPA Routing

Create a `.htaccess` file in your subdomain folder with:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>

# Enable compression
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/css application/javascript application/json
</IfModule>

# Cache static assets
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType text/css "access plus 1 year"
  ExpiresByType application/javascript "access plus 1 year"
</IfModule>
```

### Step 6: Access Your App

Your app should now be live at:

```
https://scriptpad.yourdomain.com
```

> **Note:** SSL is usually auto-enabled on Namecheap. If not, go to cPanel → **SSL/TLS Status** → Enable AutoSSL.

### Updating the App

To update:

1. Run `npm run build` locally
2. Delete old files in cPanel File Manager (except `.htaccess`)
3. Upload new `dist/` contents

---

## 🐳 Docker Deployment (Alternative)


Coming soon!

---

## ❓ Troubleshooting

| Issue | Solution |
|-------|----------|
| **Port 80 in use** | Stop other web servers: `sudo systemctl stop apache2` |
| **Permission denied** | Run with `sudo` |
| **Build fails** | Ensure Node.js 18+ is installed: `node -v` |
| **Site not loading** | Check nginx: `sudo systemctl status nginx` |

---

## 📝 License

MIT License - Feel free to use and modify!
