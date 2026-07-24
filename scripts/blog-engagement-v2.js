// GitHub Issues engagement widget for blog posts
// Requires <meta name="github-issue" content="ISSUE_NUMBER"> in the post <head>
(function(){
  var meta = document.querySelector('meta[name="github-issue"]');
  var issue = meta && meta.getAttribute('content');
  if(!issue || !/^\d+$/.test(issue.trim())) return;
  issue = issue.trim();

  var repo = 'a-5ingh/personal';
  var apiBase = 'https://api.github.com/repos/' + repo;
  var issueUrl = 'https://github.com/' + repo + '/issues/' + issue;
  var authState = { authed: false, user: null };

  function el(id){ return document.getElementById(id); }

  function fmtDate(iso){
    if(!iso) return '';
    var d = new Date(iso);
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  }

  function escapeHtml(text){
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }

  function sanitizeUrl(url){
    if(!url) return null;
    try {
      var u = new URL(url);
      if(u.protocol === 'https:' || u.protocol === 'http:') {
        return u.toString();
      }
    } catch(e) {}
    return null;
  }

  function markdownToHtml(text){
    if(!text) return '';
    var escaped = escapeHtml(text);
    return escaped
      .replace(/```([\s\S]*?)```/g, function(m, code){ return '<pre><code>' + code + '</code></pre>'; })
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, function(m, label, url){
        var safeUrl = sanitizeUrl(url);
        if(!safeUrl) return '<span>' + label + '</span>';
        return '<a href="' + safeUrl + '" target="_blank" rel="noopener noreferrer nofollow">' + label + '</a>';
      })
      .replace(/\n/g, '<br>');
  }

  function setStatus(msg, type){
    var statusEl = el('engagement-status');
    if(!statusEl) return;
    statusEl.textContent = msg;
    statusEl.className = 'text-xs mt-2 ' + (type === 'error' ? 'text-red-500' : 'text-[var(--muted)]');
  }

  function api(path, options){
    return fetch(path, options).then(function(r){
      if(!r.ok){
        return r.text().then(function(text){
          var msg = text;
          try { var parsed = JSON.parse(text); if(parsed.error) msg = parsed.error; } catch(e){}
          throw new Error(msg || ('HTTP ' + r.status));
        });
      }
      return r.json();
    });
  }

  function loadAuth(){
    return api('/api/me').then(function(data){
      authState = data || { authed: false };
      return authState;
    }).catch(function(e){
      authState = { authed: false };
      console.warn('Auth check failed:', e);
      return authState;
    });
  }

  function loadIssue(){
    return fetch(apiBase + '/issues/' + issue, { headers: { 'Accept': 'application/vnd.github+json' } })
      .then(function(r){ return r.ok ? r.json() : null; });
  }

  function loadComments(){
    return fetch(apiBase + '/issues/' + issue + '/comments', { headers: { 'Accept': 'application/vnd.github+json' } })
      .then(function(r){ return r.ok ? r.json() : []; });
  }

  function loadReactions(){
    return fetch(apiBase + '/issues/' + issue + '/reactions', { headers: { 'Accept': 'application/vnd.github.squirrel-girl-preview+json' } })
      .then(function(r){ return r.ok ? r.json() : []; });
  }

  function ensureWidget(){
    var container = el('engagement');
    if(container) return;
    container = document.createElement('section');
    container.id = 'engagement';
    container.className = 'max-w-[720px] mx-auto mt-12 pt-8 border-t border-[rgba(128,128,128,0.2)]';
    var article = document.querySelector('article');
    if(article && article.parentNode) article.parentNode.insertBefore(container, article.nextSibling);
  }

  function renderWidget(count, comments){
    ensureWidget();
    var container = el('engagement');
    var userLabel = authState.authed ? 'Commenting as ' + authState.user + ' · ' : '';
    var signInOrOut = authState.authed
      ? '<a href="/api/logout?redirect=' + encodeURIComponent(window.location.href) + '" class="text-xs text-[var(--muted)] hover:text-[var(--text)]">Sign out</a>'
      : '<a href="/api/login?redirect=' + encodeURIComponent(window.location.href) + '" class="text-xs text-[var(--muted)] hover:text-[var(--text)]">Sign in with GitHub</a>';

    container.innerHTML =
      '<div class="flex items-center gap-6 mb-6">' +
        '<button id="like-btn" class="inline-flex items-center gap-2 text-sm text-[var(--muted)] hover:text-red-500 transition-colors" title="Like this post">' +
          '<svg id="heart-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>' +
          '<span id="like-count">' + count + '</span>' +
        '</button>' +
        '<a id="comments-link" href="' + issueUrl + '" target="_blank" rel="noopener" class="text-sm text-[var(--muted)] hover:text-[var(--text)]">' + comments.length + (comments.length === 1 ? ' comment' : ' comments') + '</a>' +
      '</div>' +
      '<div id="comments-list" class="space-y-6 mb-6">' + renderComments(comments) + '</div>' +
      '<div class="comment-form">' +
        '<p class="text-xs text-[var(--muted)] mb-2">' + userLabel + signInOrOut + '</p>' +
        '<textarea id="comment-text" rows="3" class="w-full bg-transparent border border-[rgba(128,128,128,0.3)] rounded-md p-3 text-sm text-[var(--text)] placeholder:text-[var(--muted)]" placeholder="Write a comment..."></textarea>' +
        '<button id="comment-submit" class="mt-2 px-4 py-2 text-sm rounded-md bg-[var(--text)] text-[var(--bg)] hover:opacity-90 transition-opacity">Post comment</button>' +
        '<div id="engagement-status" class="text-xs text-[var(--muted)] mt-2"></div>' +
      '</div>';

    bindEvents(comments);
  }

  function renderComments(comments){
    if(!comments.length) return '<p class="text-sm text-[var(--muted)]">No comments yet.</p>';
    return comments.map(function(c){
      var safeUrl = sanitizeUrl(c.user.html_url) || '#';
      return '<div class="comment">' +
        '<div class="flex items-center gap-2 mb-1">' +
          '<img src="' + escapeHtml(c.user.avatar_url) + '" alt="" class="w-6 h-6 rounded-full" />' +
          '<a href="' + safeUrl + '" target="_blank" rel="noopener noreferrer nofollow" class="text-sm font-semibold text-[var(--text)] hover:underline">' + escapeHtml(c.user.login) + '</a>' +
          '<span class="text-xs text-[var(--muted)]">' + fmtDate(c.created_at) + '</span>' +
        '</div>' +
        '<div class="text-sm text-[var(--muted)] leading-relaxed">' + markdownToHtml(c.body) + '</div>' +
      '</div>';
    }).join('');
  }

  function bindEvents(comments){
    var likeBtn = el('like-btn');
    if(likeBtn){
      likeBtn.addEventListener('click', function(e){
        e.preventDefault();
        if(!authState.authed){
          window.location.href = '/api/login?redirect=' + encodeURIComponent(window.location.href);
          return;
        }
        likeBtn.disabled = true;
        setStatus('Saving like...');
        api('/api/like', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ issue: issue })
        }).then(function(){
          setStatus('Liked!');
          refresh();
        }).catch(function(e){
          likeBtn.disabled = false;
          setStatus('Like failed: ' + e.message, 'error');
          console.error('Like error:', e);
        });
      });
    }

    var commentSubmit = el('comment-submit');
    var commentText = el('comment-text');
    if(commentSubmit && commentText){
      commentSubmit.addEventListener('click', function(e){
        e.preventDefault();
        if(!authState.authed){
          window.location.href = '/api/login?redirect=' + encodeURIComponent(window.location.href);
          return;
        }
        var text = commentText.value.trim();
        if(!text) return;
        commentSubmit.disabled = true;
        setStatus('Posting comment...');
        api('/api/comment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ issue: issue, text: text })
        }).then(function(){
          commentText.value = '';
          setStatus('Comment posted.');
          refresh();
        }).catch(function(e){
          commentSubmit.disabled = false;
          setStatus('Comment failed: ' + e.message, 'error');
          console.error('Comment error:', e);
        });
      });
    }
  }

  function refresh(){
    Promise.all([loadAuth(), loadReactions(), loadComments()]).then(function(results){
      var reactions = results[1] || [];
      var comments = results[2] || [];
      renderWidget(reactions.length, comments);
    }).catch(function(e){
      console.error('Refresh failed:', e);
      ensureWidget();
      var container = el('engagement');
      if(container) container.innerHTML = '<p class="text-sm text-red-500">Unable to load engagement data. <a href="' + issueUrl + '" target="_blank" rel="noopener" class="underline">View on GitHub</a>.</p>';
    });
  }

  // First verify the API is reachable
  fetch('/api/ping').then(function(r){
    if(!r.ok) throw new Error('ping failed');
    refresh();
  }).catch(function(e){
    console.error('API ping failed:', e);
    ensureWidget();
    var container = el('engagement');
    if(container) container.innerHTML = '<p class="text-sm text-red-500">Comments API unavailable. Check that Cloudflare Pages Functions are deployed and environment variables are set.</p>';
  });
})();
