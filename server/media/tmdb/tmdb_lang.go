package tmdb

import (
	"log/slog"
	"strings"
)

// Helpers for non english metadata (TMDB_LANG).
// TMDB returns empty fields when content has no translation in the
// requested language, these backfill them from en-US.

// Language part of the configured language (eg "pl" for "pl-PL").
func (t *TMDB) langCode() string {
	l, _, _ := strings.Cut(t.GetLang(), "-")
	return l
}

func (t *TMDB) movieFallback(id string, m *MovieDetails) {
	if !t.needsFallback() || (m.Overview != "" && m.Title != "" && m.PosterPath != "") {
		return
	}
	en := new(MovieDetails)
	if err := t.reqEnglish("/movie/"+id, &en); err != nil {
		slog.Warn("movieFallback: en-US request failed", "id", id, "error", err)
		return
	}
	if m.Overview == "" {
		m.Overview = en.Overview
	}
	if m.Title == "" {
		m.Title = en.Title
	}
	if m.PosterPath == "" {
		m.PosterPath = en.PosterPath
	}
	if m.Tagline == "" {
		m.Tagline = en.Tagline
	}
}

func (t *TMDB) showFallback(id string, s *ShowDetails) {
	if !t.needsFallback() || (s.Overview != "" && s.Name != "" && s.PosterPath != "") {
		return
	}
	en := new(ShowDetails)
	if err := t.reqEnglish("/tv/"+id, &en); err != nil {
		slog.Warn("showFallback: en-US request failed", "id", id, "error", err)
		return
	}
	if s.Overview == "" {
		s.Overview = en.Overview
	}
	if s.Name == "" {
		s.Name = en.Name
	}
	if s.PosterPath == "" {
		s.PosterPath = en.PosterPath
	}
	if s.Tagline == "" {
		s.Tagline = en.Tagline
	}
}

func (t *TMDB) seasonFallback(showId string, seasonNumber string, s *SeasonDetails) {
	if !t.needsFallback() {
		return
	}
	missing := false
	for _, e := range s.Episodes {
		if e.Overview == "" || e.Name == "" {
			missing = true
			break
		}
	}
	if !missing {
		return
	}
	en := new(SeasonDetails)
	if err := t.reqEnglish("/tv/"+showId+"/season/"+seasonNumber, &en); err != nil {
		slog.Warn("seasonFallback: en-US request failed", "show_id", showId, "season", seasonNumber, "error", err)
		return
	}
	byNum := make(map[int]int, len(en.Episodes))
	for i, e := range en.Episodes {
		byNum[e.EpisodeNumber] = i
	}
	for i := range s.Episodes {
		ei, ok := byNum[s.Episodes[i].EpisodeNumber]
		if !ok {
			continue
		}
		if s.Episodes[i].Overview == "" {
			s.Episodes[i].Overview = en.Episodes[ei].Overview
		}
		if s.Episodes[i].Name == "" {
			s.Episodes[i].Name = en.Episodes[ei].Name
		}
	}
}
