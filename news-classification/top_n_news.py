from lib.pipeline import pipe 
from lib import news
import os
import json


KEYWORDS = "ai, artificial intelligence, machine learning, ai agents"
EXCLUDE_CAT = "business"
LIMIT = 50 # news to download
TOP_N = 5
OUTPUT_PATH = "output/top_articles.md"; os.makedirs("output", exist_ok=True)

art, links, titles = news.get_news_clean(keywords=KEYWORDS, exclude=EXCLUDE_CAT, limit=LIMIT)
print("executed API and scraped")
with open("articles_chkpt.json", "w") as f:
    json.dump(art, f)

keys = list(art.keys())

print("Classifying...")
probas = pipe.predict_proba(art)


#map interest to keys
print("Mapping back to keys")
interest = {k: p for k, p in zip(keys, probas)}
top = sorted(interest.items(), key=lambda x: x[1][1], reverse=True)[:TOP_N]

print("Writing file")
with open(OUTPUT_PATH, "w") as f:
    f.write("# Daily AI Updates\n\n")
    for i, (key, proba) in enumerate(top):
        f.write(f'## Topic {i+1}\n\n')
        f.write(f"Headline: {titles[key]}\n\n")
        f.write(f"Summary: {art[key]}\n\n")
        f.write(f"Source: {links[key]}\n\n")
        f.write("---\n\n")
print("\n########### ARTICLES SAVED IN "+OUTPUT_PATH)


print(f"\n\n #### INTEREST ##### \n {interest}")