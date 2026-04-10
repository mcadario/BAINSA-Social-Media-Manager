#!/bin/bash

echo "=== News API Setup ==="

# check if mamba is available
# if command -v mamba &> /dev/null; then
    # echo "Creating mamba environment..."
    # mamba create -n newsdata python=3.11 -y
    # mamba activate newsdata
# else
    # echo "Mamba not found, using pip directly..."
# fi

# install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

# create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "Creating .env file..."
    echo "GEMINI_API_KEY=your_gemini_api_key_here" > .env # write this to .env
    echo "NEWSDATA_API_KEY=your_newsdata_api_key_here" > .env
    echo "Please edit .env and add your API key!"
else
    echo ".env already exists, skipping..."
fi

echo ""
echo "=== Setup complete! ==="
echo "1. Edit .env and add your NEWSDATA_API_KEY and GEMINI_API_KEY"
echo "3. Run: python top_n_news.py"