/* Prabhas SaaS — cross-subdomain SSO.
 *
 * Stores the Supabase auth session in a cookie scoped to `.prabhassaas.in`
 * instead of per-origin localStorage, so one login carries across every app
 * subdomain (seedhabill / accounts / lekhya / shilp3d / …). Chunked to stay
 * under the ~4KB per-cookie limit.
 *
 * Usage: load AFTER the supabase-js UMD, then create clients with
 *   window.pssClient(SUPABASE_URL, SUPABASE_ANON_KEY)
 * All apps must share the same storageKey (set below) to read the same cookie.
 */
(function () {
  var DOMAIN = ".prabhassaas.in";
  var MAX = 3200;                 // chunk size (bytes of encoded value)
  var ATTRS = "; domain=" + DOMAIN + "; path=/; secure; samesite=Lax";
  var YEAR = "; max-age=31536000";

  function esc(n) { return n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
  function raw(name) {
    var m = document.cookie.match(new RegExp("(?:^|; )" + esc(name) + "=([^;]*)"));
    return m ? m[1] : null;
  }
  function del(name) { document.cookie = name + "=" + ATTRS + "; max-age=0"; }
  function clearChunks(name) {
    var n = raw(name + ".n");
    if (n) { for (var i = 0; i < parseInt(n, 10); i++) del(name + "." + i); del(name + ".n"); }
    del(name);
  }
  function setCookie(name, value) {
    var v = encodeURIComponent(value);
    clearChunks(name);
    if (v.length <= MAX) {
      document.cookie = name + "=" + v + ATTRS + YEAR;
    } else {
      var i = 0, idx = 0;
      while (i < v.length) { document.cookie = name + "." + idx + "=" + v.slice(i, i + MAX) + ATTRS + YEAR; i += MAX; idx++; }
      document.cookie = name + ".n=" + idx + ATTRS + YEAR;
    }
  }
  function getCookie(name) {
    var n = raw(name + ".n");
    if (n) {
      var out = "";
      for (var i = 0; i < parseInt(n, 10); i++) out += (raw(name + "." + i) || "");
      return out ? decodeURIComponent(out) : null;
    }
    var v = raw(name);
    return v == null ? null : decodeURIComponent(v);
  }

  var storage = {
    getItem: function (k) { try { return getCookie(k); } catch (e) { return null; } },
    setItem: function (k, v) { try { setCookie(k, v); } catch (e) {} },
    removeItem: function (k) { try { clearChunks(k); } catch (e) {} },
  };

  window.PSS_STORAGE = storage;
  window.pssClient = function (url, key, opts) {
    opts = opts || {};
    var auth = opts.auth || {};
    return window.supabase.createClient(url, key, Object.assign({}, opts, {
      auth: Object.assign({}, auth, {
        storage: storage,
        storageKey: "sb-ezgfvvqwokxvqmheijmd-auth-token",
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      }),
    }));
  };
})();
