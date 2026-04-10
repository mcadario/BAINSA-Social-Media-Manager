import json
import requests
import time
from newspaper import Article, Config
from dotenv import load_dotenv
import nltk
from pathlib import Path


try:
    nltk.data.find('tokenizers/punkt_tab')
except LookupError:
    nltk.download('punkt_tab')

import os


BASE_DIR = Path(__file__).resolve().parent
PROJECT_DIR = BASE_DIR.parent.parent.parent

ENV_PATH = PROJECT_DIR / ".env"

load_dotenv(dotenv_path=ENV_PATH)

NEWSDATA_API_KEY = os.getenv("NEWSDATA_API_KEY")

def get_links(articles:dict)->dict:
    links = {}
    for key,article in articles.items():
        links[key] = article["link"]

    return links

def get_titles(articles:dict)->dict:
    titles = {}
    for key,article in articles.items():
        titles[key] = article["title"]

    return titles

config = Config()
config.browser_user_agent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
config.request_timeout = 10

def get_news_clean(keywords, exclude, limit=5, start_page=None) -> tuple:
    clean_articles = {}
    links = {}
    titles = {}
    seen_links = set()
    next_page = start_page
    fetched = 0

    while fetched < limit:
        url = ('https://newsdata.io/api/1/latest?'
               'apikey=' + NEWSDATA_API_KEY +
               '&excludecategory=' + exclude +
               '&q=' + keywords +
               '&removeduplicate=1')
        
        if next_page:
            url += '&page=' + next_page
        
        response = requests.get(url)
        data = json.loads(response.content)

        for article in data['results']:
            if fetched >= limit:
                break

            #assertion to check data type
            assert isinstance(article, dict), f"Expected dict, got {type(article)}"
            
            link = article['link']
            title = article['title']
            
            if link in seen_links:
                continue
            seen_links.add(link)

            try:
                art = Article(link, config=config)
                art.download()
                art.parse()
                if art.text:
                    art.nlp()
                    key = "a" + str(fetched + 1)
                    clean_articles[key] = art.summary
                    links[key] = link
                    titles[key] = title
                    fetched += 1
                    print(f"{key} scraped ({fetched}/{limit})")
                else:
                    print(f"empty, skipping")
            except Exception as e:
                print(f"failed: {e}, retrying with same key")

        next_page = data.get('nextPage')
        if not next_page:
            print("No more pages available")
            break

    return clean_articles, links, titles