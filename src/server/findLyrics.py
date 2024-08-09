import syncedlyrics
import logging
import argparse
from flask import Flask, request, jsonify

app = Flask(__name__)


def searchLyrics(track, artist, enhanced):
    logging.info(f"Searching for lyrics for {track} by {artist}")
    enhancedLyrics = syncedlyrics.search(f"{track} {artist}", enhanced=True)
    notEnhancedLyrics = syncedlyrics.search(
        f"{track} {artist}", enhanced=False)
    lyrics = syncedlyrics.search(f"{track} {artist}", enhanced=enhanced)
    return lyrics


@app.route('/search-lyrics', methods=['POST'])
def search_lyrics_endpoint():
    data = request.json
    track = data.get('track')
    artist = data.get('artist')
    enhanced = data.get('enhanced', True)
    lyrics = searchLyrics(track, artist, enhanced)
    return jsonify({'lyrics': lyrics})


if __name__ == "__main__":
    app.run(debug=True)
