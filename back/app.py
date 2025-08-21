from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
from bs4 import BeautifulSoup

app = Flask(__name__)
CORS(app)  # allow frontend to talk to backend


@app.route('/')
def home():
    return "✅ Flask backend is running! Use /search?q=yourquery"


@app.route('/search')
def search():
    query = request.args.get('q')
    if not query:
        return jsonify({'error': 'Missing query'}), 400

    headers = {"User-Agent": "Mozilla/5.0"}
    url = f'https://lite.duckduckgo.com/lite/?q={query}'

    try:
        res = requests.get(url, headers=headers, timeout=10)
        soup = BeautifulSoup(res.text, 'html.parser')

        results = []
        rows = soup.find_all("tr")

        i = 0
        while i < len(rows):
            link_tag = rows[i].find("a", class_="result-link")
            if link_tag:
                title = link_tag.get_text(strip=True)
                raw_url = link_tag.get("href")

                # clean DuckDuckGo redirect link
                if "uddg=" in raw_url:
                    from urllib.parse import unquote, urlparse, parse_qs
                    parsed = urlparse(raw_url)
                    qs = parse_qs(parsed.query)
                    url_clean = unquote(qs.get("uddg", [""])[0])
                else:
                    url_clean = raw_url

                # look ahead for snippet and visible URL
                description, visible_url = "", ""
                if i + 1 < len(rows) and rows[i+1].find(class_="result-snippet"):
                    description = rows[i+1].get_text(strip=True)
                if i + 2 < len(rows) and rows[i+2].find(class_="link-text"):
                    visible_url = rows[i+2].get_text(strip=True)

                results.append({
                    "title": title,
                    "url": url_clean,
                    "description": description,
                    "visible_url": visible_url
                })
            i += 1

        return jsonify(results)

    except Exception as e:
        return jsonify({'error': str(e)}), 500



if __name__ == '__main__':
    app.run(debug=True)
