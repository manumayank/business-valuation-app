#!/bin/bash

# Business Valuation App - Docker Start Script for macOS/Linux

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║   Business Valuation & Improvement App - Docker Launcher    ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed"
    echo ""
    echo "Please install Docker Desktop from: https://www.docker.com/products/docker-desktop"
    echo ""
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed"
    echo ""
    echo "Please install Docker Compose from: https://docs.docker.com/compose/install/"
    echo ""
    exit 1
fi

echo "✅ Docker is installed"
echo "✅ Docker Compose is installed"
echo ""

# Check if Docker daemon is running
if ! docker ps &> /dev/null; then
    echo "❌ Docker daemon is not running"
    echo ""
    echo "Please start Docker Desktop"
    echo ""
    exit 1
fi

echo "✅ Docker daemon is running"
echo ""

echo "🔨 Building and starting services..."
echo ""

# Start Docker Compose
docker-compose up --build

