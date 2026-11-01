package tmdb

import (
	"encoding/json"
	"errors"
	"io"
	"log/slog"
	"net/http"
	"net/url"
	"time"

	gocache "github.com/robfig/go-cache"
	"github.com/sbondCo/Watcharr/database/entity"
)

var ContentStore = gocache.New(time.Hour*24, time.Minute)

type ContentProvider interface {
	CacheContentShow(content ShowDetails, onlyUpdate bool) (entity.Content, error)
	CacheContentMovie(content MovieDetails, onlyUpdate bool) (entity.Content, error)
}

type TMDB struct {
	Key             string
	Lang            string
	contentProvider ContentProvider
}

func NewTMDB(key string) *TMDB {
	return &TMDB{
		Key: key,
	}
}

func (t *TMDB) AddContentProvider(contentProvider ContentProvider) {
	t.contentProvider = contentProvider
}

func (t *TMDB) GetKey() string {
	if t.Key != "" {
		return t.Key //Config.TMDB_KEY
	}
	return "d047fa61d926371f277e7a83c9c4ff2c"
}

// Configured metadata language, en-US when unset.
func (t *TMDB) GetLang() string {
	if t.Lang != "" {
		return t.Lang
	}
	return "en-US"
}

// Is the configured language something other than english?
// Used to decide if we should backfill missing translations from en-US.
func (t *TMDB) needsFallback() bool {
	return t.GetLang() != "en-US"
}

func (t *TMDB) apiRequest(ep string, p map[string]string) ([]byte, error) {
	slog.Debug("tmdbAPIRequest", "endpoint", ep, "params", p)
	base, err := url.Parse("https://api.themoviedb.org/3")
	if err != nil {
		return nil, errors.New("failed to parse api uri")
	}

	// Path params
	base.Path += ep

	// Query params
	params := url.Values{}
	params.Add("api_key", t.GetKey())
	// Callers can override language per request (en-US fallback).
	if _, ok := p["language"]; !ok {
		params.Add("language", t.GetLang())
	}
	// Trailers (appended videos) are filtered by language too,
	// so also allow english ones and those without a language.
	if _, ok := p["include_video_language"]; !ok && t.needsFallback() {
		params.Add("include_video_language", t.langCode()+",en,null")
	}
	for k, v := range p {
		params.Add(k, v)
	}

	// Add params to url
	base.RawQuery = params.Encode()

	// Run get request
	res, err := http.Get(base.String())
	if err != nil {
		return nil, err
	}
	body, err := io.ReadAll(res.Body)
	res.Body.Close()
	if err != nil {
		return nil, err
	}
	if res.StatusCode != 200 {
		slog.Error("TMDB non 200 status code:", "status_code", res.StatusCode)
		return nil, errors.New(string(body))
	}
	return body, nil
}

func (t *TMDB) req(ep string, p map[string]string, resp interface{}) error {
	body, err := t.apiRequest(ep, p)
	if err != nil {
		return err
	}
	err = json.Unmarshal([]byte(body), &resp)
	if err != nil {
		return err
	}
	return nil
}

// Request `ep` in en-US (without extra appended data) into `resp`.
// Used to backfill fields that have no translation in the configured language.
func (t *TMDB) reqEnglish(ep string, resp interface{}) error {
	return t.req(ep, map[string]string{"language": "en-US"}, resp)
}
