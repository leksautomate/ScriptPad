#!/bin/bash

# ScriptPad One-Click VPS Deployment Script
# Usage: curl -sSL https://raw.githubusercontent.com/leksautomate/ScriptPad/main/deploy.sh | bash
# Or: wget -qO- https://raw.githubusercontent.com/leksautomate/ScriptPad/main/deploy.sh | bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════════╗"
echo "║           ScriptPad VPS Deployment            ║"
echo "╚═══════════════════════════════════════════════╝"
echo -e "${NC}"

# Configuration
APP_NAME="scriptpad"
INSTALL_DIR="/var/www/$APP_NAME"
REPO_URL="https://github.com/leksautomate/ScriptPad.git"
PORT=3000

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${YELLOW}⚠ Not running as root. Some operations may require sudo.${NC}"
    SUDO="sudo"
else
    SUDO=""
fi

# Detect OS
detect_os() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$ID
    else
        echo -e "${RED}❌ Cannot detect OS. Exiting.${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ Detected OS: $OS${NC}"
}

# Install Node.js if not present
install_nodejs() {
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node -v)
        echo -e "${GREEN}✓ Node.js already installed: $NODE_VERSION${NC}"
    else
        echo -e "${YELLOW}📦 Installing Node.js...${NC}"
        if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
            $SUDO apt-get update
            $SUDO apt-get install -y curl
            curl -fsSL https://deb.nodesource.com/setup_20.x | $SUDO bash -
            $SUDO apt-get install -y nodejs
        elif [ "$OS" = "centos" ] || [ "$OS" = "rhel" ] || [ "$OS" = "fedora" ]; then
            curl -fsSL https://rpm.nodesource.com/setup_20.x | $SUDO bash -
            $SUDO yum install -y nodejs
        else
            echo -e "${RED}❌ Unsupported OS for automatic Node.js installation.${NC}"
            echo "Please install Node.js 18+ manually and re-run this script."
            exit 1
        fi
        echo -e "${GREEN}✓ Node.js installed: $(node -v)${NC}"
    fi
}

# Install nginx
install_nginx() {
    if command -v nginx &> /dev/null; then
        echo -e "${GREEN}✓ Nginx already installed${NC}"
    else
        echo -e "${YELLOW}📦 Installing Nginx...${NC}"
        if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
            $SUDO apt-get install -y nginx
        elif [ "$OS" = "centos" ] || [ "$OS" = "rhel" ] || [ "$OS" = "fedora" ]; then
            $SUDO yum install -y nginx
        fi
        echo -e "${GREEN}✓ Nginx installed${NC}"
    fi
}

# Install git if not present
install_git() {
    if command -v git &> /dev/null; then
        echo -e "${GREEN}✓ Git already installed${NC}"
    else
        echo -e "${YELLOW}📦 Installing Git...${NC}"
        if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
            $SUDO apt-get install -y git
        elif [ "$OS" = "centos" ] || [ "$OS" = "rhel" ] || [ "$OS" = "fedora" ]; then
            $SUDO yum install -y git
        fi
        echo -e "${GREEN}✓ Git installed${NC}"
    fi
}

# Clone and build app
setup_app() {
    echo -e "${YELLOW}📂 Setting up application directory...${NC}"
    
    # Create directory
    $SUDO mkdir -p $INSTALL_DIR
    $SUDO chown $USER:$USER $INSTALL_DIR
    
    # Clone or update repo
    if [ -d "$INSTALL_DIR/.git" ]; then
        echo -e "${YELLOW}📥 Updating existing installation...${NC}"
        cd $INSTALL_DIR
        git pull origin main
    else
        echo -e "${YELLOW}📥 Cloning repository...${NC}"
        $SUDO rm -rf $INSTALL_DIR/*
        git clone $REPO_URL $INSTALL_DIR
        cd $INSTALL_DIR
    fi
    
    echo -e "${GREEN}✓ Repository cloned${NC}"
    
    # Install dependencies
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    npm install
    echo -e "${GREEN}✓ Dependencies installed${NC}"
    
    # Build for production
    echo -e "${YELLOW}🔨 Building for production...${NC}"
    npm run build
    echo -e "${GREEN}✓ Production build complete${NC}"
}

# Configure nginx
configure_nginx() {
    echo -e "${YELLOW}⚙️  Configuring Nginx...${NC}"
    
    NGINX_CONF="/etc/nginx/sites-available/$APP_NAME"
    
    $SUDO tee $NGINX_CONF > /dev/null <<EOF
server {
    listen 80;
    server_name _;
    
    root $INSTALL_DIR/dist;
    index index.html;
    
    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
    
    location / {
        try_files \$uri \$uri/ /index.html;
    }
    
    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF
    
    # Enable site
    $SUDO ln -sf $NGINX_CONF /etc/nginx/sites-enabled/
    $SUDO rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true
    
    # Test and reload nginx
    $SUDO nginx -t
    $SUDO systemctl reload nginx
    $SUDO systemctl enable nginx
    
    echo -e "${GREEN}✓ Nginx configured${NC}"
}

# Get server IP
get_server_ip() {
    SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')
    echo $SERVER_IP
}

# Main installation
main() {
    detect_os
    install_git
    install_nodejs
    install_nginx
    setup_app
    configure_nginx
    
    SERVER_IP=$(get_server_ip)
    
    echo ""
    echo -e "${GREEN}"
    echo "╔═══════════════════════════════════════════════╗"
    echo "║         🎉 Installation Complete! 🎉          ║"
    echo "╚═══════════════════════════════════════════════╝"
    echo -e "${NC}"
    echo ""
    echo -e "  ${BLUE}ScriptPad is now live at:${NC}"
    echo ""
    echo -e "  🌐 http://$SERVER_IP"
    echo ""
    echo -e "  ${YELLOW}To update later, run:${NC}"
    echo -e "  cd $INSTALL_DIR && git pull && npm run build && sudo systemctl reload nginx"
    echo ""
    echo -e "  ${YELLOW}To add SSL (recommended):${NC}"
    echo -e "  sudo apt install certbot python3-certbot-nginx"
    echo -e "  sudo certbot --nginx -d yourdomain.com"
    echo ""
}

main
