function createUnityInstance(e, t, n) {
    function r(e, n) {
        if (!r.aborted && t.showBanner) return "error" == n && (r.aborted = !0), t.showBanner(e, n);
        switch (n) {
            case "error":
                console.error(e);
                break;
            case "warning":
                console.warn(e);
                break;
            default:
                console.log(e);
        }
    }
    function o(e) {
        var t = e.reason || e.error,
            n = t ? t.toString() : e.message || e.reason || "",
            r = t && t.stack ? t.stack.toString() : "";
        if (
            (r.startsWith(n) && (r = r.substring(n.length)),
            (n += "\n" + r.trim()),
            n && f.stackTraceRegExp && f.stackTraceRegExp.test(n))
        ) {
            var o = e.filename || (t && (t.fileName || t.sourceURL)) || "",
                a = e.lineno || (t && (t.lineNumber || t.line)) || 0;
            i(n, o, a);
        }
    }
    function a(e) {
        e.preventDefault();
    }
    function i(e, t, n) {
        if (e.indexOf("fullscreen error") == -1) {
            if (f.startupErrorHandler) return void f.startupErrorHandler(e, t, n);
            if (
                !(
                    (f.errorHandler && f.errorHandler(e, t, n)) ||
                    (console.log("Invoking error handler due to\n" + e),
                    "function" == typeof dump && dump("Invoking error handler due to\n" + e),
                    i.didShowErrorMessage)
                )
            ) {
                var e =
                    "An error occurred running the Unity content on this page. See your browser JavaScript console for more info. The error was:\n" +
                    e;
                e.indexOf("DISABLE_EXCEPTION_CATCHING") != -1
                    ? (e =
                          "An exception has occurred, but exception handling has been disabled in this build. If you are the developer of this content, enable exceptions in your project WebGL player settings to be able to catch the exception or see the stack trace.")
                    : e.indexOf("Cannot enlarge memory arrays") != -1
                    ? (e =
                          "Out of memory. If you are the developer of this content, try allocating more memory to your WebGL build in the WebGL player settings.")
                    : (e.indexOf("Invalid array buffer length") == -1 &&
                          e.indexOf("Invalid typed array length") == -1 &&
                          e.indexOf("out of memory") == -1 &&
                          e.indexOf("could not allocate memory") == -1) ||
                      (e =
                          "The browser could not allocate enough memory for the WebGL content. If you are the developer of this content, try allocating less memory to your WebGL build in the WebGL player settings."),
                    alert(e),
                    (i.didShowErrorMessage = !0);
            }
        }
    }
    function s(e, t) {
        if ("symbolsUrl" != e) {
            var r = f.downloadProgress[e];
            r ||
                (r = f.downloadProgress[e] =
                    { started: !1, finished: !1, lengthComputable: !1, total: 0, loaded: 0 }),
                "object" != typeof t ||
                    ("progress" != t.type && "load" != t.type) ||
                    (r.started || ((r.started = !0), (r.lengthComputable = t.lengthComputable)),
                    (r.total = t.total),
                    (r.loaded = t.loaded),
                    "load" == t.type && (r.finished = !0));
            var o = 0,
                a = 0,
                i = 0,
                s = 0,
                l = 0;
            for (var e in f.downloadProgress) {
                var r = f.downloadProgress[e];
                if (!r.started) return 0;
                i++,
                    r.lengthComputable ? ((o += r.loaded), (a += r.total), s++) : r.finished || l++;
            }
            var c = i ? (i - l - (a ? (s * (a - o)) / a : 0)) / i : 0;
            n(0.9 * c);
        }
    }
    function l(e, t) {
        return new Promise(function (n, r) {
            try {
                for (var o in w)
                    if (w[o].hasUnityMarker(e)) {
                        t &&
                            console.log(
                                'You can reduce startup time if you configure your web server to add "Content-Encoding: ' +
                                    o +
                                    '" response header when serving "' +
                                    t +
                                    '" file.'
                            );
                        var a = w[o];
                        if (!a.worker) {
                            var i = URL.createObjectURL(
                                new Blob(
                                    [
                                        "this.require = ",
                                        a.require.toString(),
                                        "; this.decompress = ",
                                        a.decompress.toString(),
                                        "; this.onmessage = ",
                                        function (e) {
                                            var t = {
                                                id: e.data.id,
                                                decompressed: this.decompress(e.data.compressed),
                                            };
                                            postMessage(
                                                t,
                                                t.decompressed ? [t.decompressed.buffer] : []
                                            );
                                        }.toString(),
                                        "; postMessage({ ready: true });",
                                    ],
                                    { type: "application/javascript" }
                                )
                            );
                            (a.worker = new Worker(i)),
                                (a.worker.onmessage = function (e) {
                                    return e.data.ready
                                        ? void URL.revokeObjectURL(i)
                                        : (this.callbacks[e.data.id](e.data.decompressed),
                                          void delete this.callbacks[e.data.id]);
                                }),
                                (a.worker.callbacks = {}),
                                (a.worker.nextCallbackId = 0);
                        }
                        var s = a.worker.nextCallbackId++;
                        return (
                            (a.worker.callbacks[s] = n),
                            void a.worker.postMessage({ id: s, compressed: e }, [e.buffer])
                        );
                    }
                n(e);
            } catch (e) {
                r(e);
            }
        });
    }
    function c(e) {
        s(e);
        var t = f.cacheControl(f[e]),
            n = f.companyName && f.productName ? f.cachedFetch : f.fetchWithProgress,
            o = f[e],
            a = /file:\/\//.exec(o) ? "same-origin" : void 0,
            i = n(f[e], {
                method: "GET",
                companyName: f.companyName,
                productName: f.productName,
                productVersion: f.productVersion,
                control: t,
                mode: a,
                onProgress: function (t) {
                    s(e, t);
                },
            });
        return i
            .then(function (t) {
                return l(t.parsedBody, f[e]);
            })
            .catch(function (t) {
                var n = "Failed to download file " + f[e];
                "file:" == location.protocol
                    ? r(
                          n +
                              ". Loading web pages via a file:// URL without a web server is not supported by this browser. Please use a local development web server to host Unity content, or use the Unity Build and Run option.",
                          "error"
                      )
                    : console.error(n);
            });
    }
    function d() {
        return c("frameworkUrl").then(function (e) {
            var t = URL.createObjectURL(new Blob([e], { type: "application/javascript" }));
            return new Promise(function (e, n) {
                var o = document.createElement("script");
                (o.src = t),
                    (o.onload = function () {
                        if ("undefined" == typeof unityFramework || !unityFramework) {
                            var n = [
                                ["br", "br"],
                                ["gz", "gzip"],
                            ];
                            for (var a in n) {
                                var i = n[a];
                                if (f.frameworkUrl.endsWith("." + i[0])) {
                                    var s = "Unable to parse " + f.frameworkUrl + "!";
                                    if ("file:" == location.protocol)
                                        return void r(
                                            s +
                                                " Loading pre-compressed (brotli or gzip) content via a file:// URL without a web server is not supported by this browser. Please use a local development web server to host compressed Unity content, or use the Unity Build and Run option.",
                                            "error"
                                        );
                                    if (
                                        ((s +=
                                            ' This can happen if build compression was enabled but web server hosting the content was misconfigured to not serve the file with HTTP Response Header "Content-Encoding: ' +
                                            i[1] +
                                            '" present. Check browser Console and Devtools Network tab to debug.'),
                                        "br" == i[0] && "http:" == location.protocol)
                                    ) {
                                        var l =
                                            ["localhost", "127.0.0.1"].indexOf(location.hostname) !=
                                            -1
                                                ? ""
                                                : "Migrate your server to use HTTPS.";
                                        s = /Firefox/.test(navigator.userAgent)
                                            ? "Unable to parse " +
                                              f.frameworkUrl +
                                              '!<br>If using custom web server, verify that web server is sending .br files with HTTP Response Header "Content-Encoding: br". Brotli compression may not be supported in Firefox over HTTP connections. ' +
                                              l +
                                              ' See <a href="https://bugzilla.mozilla.org/show_bug.cgi?id=1670675">https://bugzilla.mozilla.org/show_bug.cgi?id=1670675</a> for more information.'
                                            : "Unable to parse " +
                                              f.frameworkUrl +
                                              '!<br>If using custom web server, verify that web server is sending .br files with HTTP Response Header "Content-Encoding: br". Brotli compression may not be supported over HTTP connections. Migrate your server to use HTTPS.';
                                    }
                                    return void r(s, "error");
                                }
                            }
                            r(
                                "Unable to parse " +
                                    f.frameworkUrl +
                                    "! The file is corrupt, or compression was misconfigured? (check Content-Encoding HTTP Response Header on web server)",
                                "error"
                            );
                        }
                        var c = unityFramework;
                        (unityFramework = null), (o.onload = null), URL.revokeObjectURL(t), e(c);
                    }),
                    (o.onerror = function (e) {
                        r(
                            "Unable to load file " +
                                f.frameworkUrl +
                                "! Check that the file exists on the remote server. (also check browser Console and Devtools Network tab to debug)",
                            "error"
                        );
                    }),
                    document.body.appendChild(o),
                    f.deinitializers.push(function () {
                        document.body.removeChild(o);
                    });
            });
        });
    }
    function u() {
        Promise.all([d(), c("codeUrl")]).then(function (e) {
            (f.wasmBinary = e[1]), e[0](f);
        });
        var e = c("dataUrl");
        f.preRun.push(function () {
            f.addRunDependency("dataUrl"),
                e.then(function (e) {
                    var t = new DataView(e.buffer, e.byteOffset, e.byteLength),
                        n = 0,
                        r = "UnityWebData1.0\0";
                    if (!String.fromCharCode.apply(null, e.subarray(n, n + r.length)) == r)
                        throw "unknown data format";
                    n += r.length;
                    var o = t.getUint32(n, !0);
                    for (n += 4; n < o; ) {
                        var a = t.getUint32(n, !0);
                        n += 4;
                        var i = t.getUint32(n, !0);
                        n += 4;
                        var s = t.getUint32(n, !0);
                        n += 4;
                        var l = String.fromCharCode.apply(null, e.subarray(n, n + s));
                        n += s;
                        for (
                            var c = 0, d = l.indexOf("/", c) + 1;
                            d > 0;
                            c = d, d = l.indexOf("/", c) + 1
                        )
                            f.FS_createPath(l.substring(0, c), l.substring(c, d - 1), !0, !0);
                        f.FS_createDataFile(l, null, e.subarray(a, a + i), !0, !0, !0);
                    }
                    f.removeRunDependency("dataUrl");
                });
        });
    }
    n = n || function () {};
    var f = {
        canvas: e,
        webglContextAttributes: { preserveDrawingBuffer: !1, powerPreference: 2 },
        cacheControl: function (e) {
            return e == f.dataUrl || e.match(/\.bundle/) ? "must-revalidate" : "no-store";
        },
        streamingAssetsUrl: "StreamingAssets",
        downloadProgress: {},
        deinitializers: [],
        intervals: {},
        setInterval: function (e, t) {
            var n = window.setInterval(e, t);
            return (this.intervals[n] = !0), n;
        },
        clearInterval: function (e) {
            delete this.intervals[e], window.clearInterval(e);
        },
        preRun: [],
        postRun: [],
        print: function (e) {
            console.log(e);
        },
        printErr: function (e) {
            console.error(e),
                "string" == typeof e &&
                    e.indexOf("wasm streaming compile failed") != -1 &&
                    (e.toLowerCase().indexOf("mime") != -1
                        ? r(
                              'HTTP Response Header "Content-Type" configured incorrectly on the server for file ' +
                                  f.codeUrl +
                                  ' , should be "application/wasm". Startup time performance will suffer.',
                              "warning"
                          )
                        : r(
                              'WebAssembly streaming compilation failed! This can happen for example if "Content-Encoding" HTTP header is incorrectly enabled on the server for file ' +
                                  f.codeUrl +
                                  ", but the file is not pre-compressed on disk (or vice versa). Check the Network tab in browser Devtools to debug server header configuration.",
                              "warning"
                          ));
        },
        locateFile: function (e) {
            return e;
        },
        disabledCanvasEvents: ["contextmenu", "dragstart"],
    };
    for (var h in t) f[h] = t[h];
    f.streamingAssetsUrl = new URL(f.streamingAssetsUrl, document.URL).href;
    var m = f.disabledCanvasEvents.slice();
    m.forEach(function (t) {
        e.addEventListener(t, a);
    }),
        window.addEventListener("error", o),
        window.addEventListener("unhandledrejection", o);
    var b = "",
        p = "";
    document.addEventListener("webkitfullscreenchange", function (t) {
        var n = document.webkitCurrentFullScreenElement;
        n === e
            ? e.style.width &&
              ((b = e.style.width),
              (p = e.style.height),
              (e.style.width = "100%"),
              (e.style.height = "100%"))
            : b && ((e.style.width = b), (e.style.height = p), (b = ""), (p = ""));
    }),
        f.deinitializers.push(function () {
            f.disableAccessToMediaDevices(),
                m.forEach(function (t) {
                    e.removeEventListener(t, a);
                }),
                window.removeEventListener("error", o),
                window.removeEventListener("unhandledrejection", o);
            for (var t in f.intervals) window.clearInterval(t);
            f.intervals = {};
        }),
        (f.QuitCleanup = function () {
            for (var e = 0; e < f.deinitializers.length; e++) f.deinitializers[e]();
            (f.deinitializers = []), "function" == typeof f.onQuit && f.onQuit();
        });
    var g = {
        Module: f,
        SetFullscreen: function () {
            return f.SetFullscreen
                ? f.SetFullscreen.apply(f, arguments)
                : void f.print("Failed to set Fullscreen mode: Player not loaded yet.");
        },
        SendMessage: function () {
            return f.SendMessage
                ? f.SendMessage.apply(f, arguments)
                : void f.print("Failed to execute SendMessage: Player not loaded yet.");
        },
        Quit: function () {
            return new Promise(function (e, t) {
                (f.shouldQuit = !0), (f.onQuit = e);
            });
        },
    };
    (f.SystemInfo = (function () {
        function e(e, t, n) {
            return (e = RegExp(e, "i").exec(t)), e && e[n];
        }
        for (
            var t,
                n,
                r,
                o,
                a,
                i,
                s = navigator.userAgent + " ",
                l = [
                    ["Firefox", "Firefox"],
                    ["OPR", "Opera"],
                    ["Edg", "Edge"],
                    ["SamsungBrowser", "Samsung Browser"],
                    ["Trident", "Internet Explorer"],
                    ["MSIE", "Internet Explorer"],
                    ["Chrome", "Chrome"],
                    ["CriOS", "Chrome on iOS Safari"],
                    ["FxiOS", "Firefox on iOS Safari"],
                    ["Safari", "Safari"],
                ],
                c = 0;
            c < l.length;
            ++c
        )
            if ((n = e(l[c][0] + "[/ ](.*?)[ \\)]", s, 1))) {
                t = l[c][1];
                break;
            }
        "Safari" == t && (n = e("Version/(.*?) ", s, 1)),
            "Internet Explorer" == t && (n = e("rv:(.*?)\\)? ", s, 1) || n);
        for (
            var d = [
                    ["Windows (.*?)[;)]", "Windows"],
                    ["Android ([0-9_.]+)", "Android"],
                    ["iPhone OS ([0-9_.]+)", "iPhoneOS"],
                    ["iPad.*? OS ([0-9_.]+)", "iPadOS"],
                    ["FreeBSD( )", "FreeBSD"],
                    ["OpenBSD( )", "OpenBSD"],
                    ["Linux|X11()", "Linux"],
                    ["Mac OS X ([0-9_.]+)", "MacOS"],
                    ["bot|google|baidu|bing|msn|teoma|slurp|yandex", "Search Bot"],
                ],
                u = 0;
            u < d.length;
            ++u
        )
            if ((o = e(d[u][0], s, 1))) {
                (r = d[u][1]), (o = o.replace(/_/g, "."));
                break;
            }
        var f = {
            "NT 5.0": "2000",
            "NT 5.1": "XP",
            "NT 5.2": "Server 2003",
            "NT 6.0": "Vista",
            "NT 6.1": "7",
            "NT 6.2": "8",
            "NT 6.3": "8.1",
            "NT 10.0": "10",
        };
        (o = f[o] || o),
            (a = document.createElement("canvas")),
            a &&
                ((gl = a.getContext("webgl2")),
                (glVersion = gl ? 2 : 0),
                gl || ((gl = a && a.getContext("webgl")) && (glVersion = 1)),
                gl &&
                    (i =
                        (gl.getExtension("WEBGL_debug_renderer_info") && gl.getParameter(37446)) ||
                        gl.getParameter(7937)));
        var h = "undefined" != typeof SharedArrayBuffer,
            m = "object" == typeof WebAssembly && "function" == typeof WebAssembly.compile;
        return {
            width: screen.width,
            height: screen.height,
            userAgent: s.trim(),
            browser: t || "Unknown browser",
            browserVersion: n || "Unknown version",
            mobile: /Mobile|Android|iP(ad|hone)/.test(navigator.appVersion),
            os: r || "Unknown OS",
            osVersion: o || "Unknown OS Version",
            gpu: i || "Unknown GPU",
            language: navigator.userLanguage || navigator.language,
            hasWebGL: glVersion,
            hasCursorLock: !!document.body.requestPointerLock,
            hasFullscreen:
                !!document.body.requestFullscreen || !!document.body.webkitRequestFullscreen,
            hasThreads: h,
            hasWasm: m,
            hasWasmThreads: !1,
        };
    })()),
        (f.abortHandler = function (e) {
            return i(e, "", 0), !0;
        }),
        (Error.stackTraceLimit = Math.max(Error.stackTraceLimit || 0, 50)),
        (f.readBodyWithProgress = (function () {
            function e(e, t) {
                if (!t) return 0;
                var n = e.headers.get("Content-Encoding"),
                    r = parseInt(e.headers.get("Content-Length"));
                switch (n) {
                    case "br":
                        return Math.round(5 * r);
                    case "gzip":
                        return Math.round(4 * r);
                    default:
                        return r;
                }
            }
            function t(t, n) {
                function r() {
                    return "undefined" == typeof a
                        ? t.arrayBuffer().then(function (e) {
                              return (
                                  n({
                                      type: "progress",
                                      total: e.length,
                                      loaded: 0,
                                      lengthComputable: i,
                                  }),
                                  new Uint8Array(e)
                              );
                          })
                        : a.read().then(function (e) {
                              return e.done
                                  ? o()
                                  : (d + e.value.length <= l.length
                                        ? (l.set(e.value, d), (u = d + e.value.length))
                                        : c.push(e.value),
                                    (d += e.value.length),
                                    n({
                                        type: "progress",
                                        total: Math.max(s, d),
                                        loaded: d,
                                        lengthComputable: i,
                                    }),
                                    r());
                          });
                }
                function o() {
                    if (d === s) return l;
                    if (d < s) return l.slice(0, d);
                    var e = new Uint8Array(d);
                    e.set(l, 0);
                    for (var t = u, n = 0; n < c.length; ++n) e.set(c[n], t), (t += c[n].length);
                    return e;
                }
                var a = t.body ? t.body.getReader() : void 0,
                    i = "undefined" != typeof t.headers.get("Content-Length"),
                    s = e(t, i),
                    l = new Uint8Array(s),
                    c = [],
                    d = 0,
                    u = 0;
                return (
                    i ||
                        console.warn(
                            "[UnityCache] Response is served without Content-Length header. Please reconfigure server to include valid Content-Length for better download performance."
                        ),
                    r().then(function (e) {
                        return (
                            n({
                                type: "load",
                                total: e.length,
                                loaded: e.length,
                                lengthComputable: i,
                            }),
                            (t.parsedBody = e),
                            t
                        );
                    })
                );
            }
            return t;
        })()),
        (f.fetchWithProgress = (function () {
            function e(e, t) {
                var n = function () {};
                return (
                    t && t.onProgress && (n = t.onProgress),
                    fetch(e, t).then(function (e) {
                        return f.readBodyWithProgress(e, n);
                    })
                );
            }
            return e;
        })()),
        (f.UnityCache = (function () {
            function e(e) {
                console.log("[UnityCache] " + e);
            }
            function t() {
                var t = this;
                (this.isConnected = this.connect().then(function () {
                    return t.cleanUpCache();
                })),
                    this.isConnected.catch(function (t) {
                        e("Error when initializing cache: " + t);
                    });
            }
            var n = { name: "UnityCache", version: 4 },
                r = { name: "RequestMetaDataStore", version: 1 },
                o = { name: "RequestStore", version: 1 },
                a = { name: "WebAssembly", version: 1 },
                i =
                    window.indexedDB ||
                    window.mozIndexedDB ||
                    window.webkitIndexedDB ||
                    window.msIndexedDB,
                s = null;
            return (
                (t.getInstance = function () {
                    return s || (s = new t()), s;
                }),
                (t.destroyInstance = function () {
                    return s
                        ? s.close().then(function () {
                              s = null;
                          })
                        : Promise.resolve();
                }),
                (t.prototype.clearCache = function () {
                    function e(n) {
                        if (0 === n.length) return Promise.resolve();
                        var r = n.pop();
                        return t.cache.delete(r).then(function () {
                            return e(n);
                        });
                    }
                    var t = this;
                    return this.isConnected
                        .then(function () {
                            return t.execute(r.name, "clear", []);
                        })
                        .then(function () {
                            return t.cache.keys();
                        })
                        .then(function (t) {
                            return e(t);
                        });
                }),
                (t.UnityCacheDatabase = n),
                (t.RequestMetaDataStore = r),
                (t.MaximumCacheSize = 1073741824),
                (t.prototype.loadRequest = function (e) {
                    var t = this;
                    return t.isConnected
                        .then(function () {
                            return Promise.all([t.cache.match(e), t.loadRequestMetaData(e)]);
                        })
                        .then(function (e) {
                            if ("undefined" != typeof e[0] && "undefined" != typeof e[1])
                                return { response: e[0], metaData: e[1] };
                        });
                }),
                (t.prototype.loadRequestMetaData = function (e) {
                    var t = "string" == typeof e ? e : e.url;
                    return this.execute(r.name, "get", [t]);
                }),
                (t.prototype.updateRequestMetaData = function (e) {
                    return this.execute(r.name, "put", [e]);
                }),
                (t.prototype.storeRequest = function (e, t) {
                    var n = this;
                    return n.isConnected.then(function () {
                        return n.cache.put(e, t);
                    });
                }),
                (t.prototype.close = function () {
                    return this.isConnected.then(
                        function () {
                            this.database && (this.database.close(), (this.database = null)),
                                this.cache && (this.cache = null);
                        }.bind(this)
                    );
                }),
                (t.prototype.connect = function () {
                    var e = this;
                    if ("undefined" == typeof i)
                        return Promise.reject(
                            new Error("Could not connect to cache: IndexedDB is not supported.")
                        );
                    if ("undefined" == typeof window.caches)
                        return Promise.reject(
                            new Error("Could not connect to cache: Cache API is not supported.")
                        );
                    var t = new Promise(function (t, r) {
                        function o() {
                            e.openDBTimeout &&
                                (clearTimeout(e.openDBTimeout), (e.openDBTimeout = null));
                        }
                        try {
                            e.openDBTimeout = setTimeout(function () {
                                "undefined" == typeof e.database &&
                                    r(new Error("Could not connect to cache: Database timeout."));
                            }, 2e4);
                            var a = i.open(n.name, n.version);
                            (a.onupgradeneeded = e.upgradeDatabase.bind(e)),
                                (a.onsuccess = function (n) {
                                    o(), (e.database = n.target.result), t();
                                }),
                                (a.onerror = function (t) {
                                    o(),
                                        (e.database = null),
                                        r(new Error("Could not connect to database."));
                                });
                        } catch (t) {
                            o(),
                                (e.database = null),
                                (e.cache = null),
                                r(
                                    new Error(
                                        "Could not connect to cache: Could not connect to database."
                                    )
                                );
                        }
                    })
                        .then(function () {
                            var e = n.name + "_" + f.companyName + "_" + f.productName;
                            return caches.open(e);
                        })
                        .then(function (t) {
                            e.cache = t;
                        });
                    return t;
                }),
                (t.prototype.upgradeDatabase = function (e) {
                    var t = e.target.result;
                    if (!t.objectStoreNames.contains(r.name)) {
                        var n = t.createObjectStore(r.name, { keyPath: "url" });
                        ["accessedAt", "updatedAt"].forEach(function (e) {
                            n.createIndex(e, e);
                        });
                    }
                    t.objectStoreNames.contains(o.name) && t.deleteObjectStore(o.name),
                        t.objectStoreNames.contains(a.name) && t.deleteObjectStore(a.name);
                }),
                (t.prototype.execute = function (e, t, n) {
                    return this.isConnected.then(
                        function () {
                            return new Promise(
                                function (r, o) {
                                    try {
                                        if (null === this.database)
                                            return void o(new Error("indexedDB access denied"));
                                        var a =
                                                ["put", "delete", "clear"].indexOf(t) != -1
                                                    ? "readwrite"
                                                    : "readonly",
                                            i = this.database.transaction([e], a),
                                            s = i.objectStore(e);
                                        "openKeyCursor" == t &&
                                            ((s = s.index(n[0])), (n = n.slice(1)));
                                        var l = s[t].apply(s, n);
                                        (l.onsuccess = function (e) {
                                            r(e.target.result);
                                        }),
                                            (l.onerror = function (e) {
                                                o(e);
                                            });
                                    } catch (e) {
                                        o(e);
                                    }
                                }.bind(this)
                            );
                        }.bind(this)
                    );
                }),
                (t.prototype.getMetaDataEntries = function () {
                    var e = this,
                        t = 0,
                        n = [];
                    return new Promise(function (o, a) {
                        var i = e.database.transaction([r.name], "readonly"),
                            s = i.objectStore(r.name),
                            l = s.openCursor();
                        (l.onsuccess = function (e) {
                            var r = e.target.result;
                            r
                                ? ((t += r.value.size), n.push(r.value), r.continue())
                                : o({ metaDataEntries: n, cacheSize: t });
                        }),
                            (l.onerror = function (e) {
                                a(e);
                            });
                    });
                }),
                (t.prototype.cleanUpCache = function () {
                    var e = this;
                    return this.getMetaDataEntries().then(function (n) {
                        function o(t) {
                            return new Promise(function (n, o) {
                                var a = e.database.transaction([r.name], "readwrite"),
                                    i = a.objectStore(r.name);
                                i.delete(t), (a.oncomplete = n), (a.onerror = o);
                            });
                        }
                        function a() {
                            if (0 === l.length) return Promise.resolve();
                            var t = l.pop();
                            return e.cache
                                .delete(t.url)
                                .then(function (e) {
                                    if (e) return o(t.url);
                                })
                                .then(function () {
                                    return a();
                                });
                        }
                        for (
                            var i = n.metaDataEntries, s = n.cacheSize, l = [], c = [], d = 0;
                            d < i.length;
                            ++d
                        )
                            i[d].version != f.productVersion
                                ? (l.push(i[d]), (s -= i[d].size))
                                : c.push(i[d]);
                        c.sort(function (e, t) {
                            return e.accessedAt - t.accessedAt;
                        });
                        for (var d = 0; d < c.length && !(s < t.MaximumCacheSize); ++d)
                            l.push(c[d]), (s -= c[d].size);
                        return a();
                    });
                }),
                t
            );
        })()),
        (f.cachedFetch = (function () {
            function e(e) {
                console.log("[UnityCache] " + e);
            }
            function t(e) {
                return (
                    (t.link = t.link || document.createElement("a")), (t.link.href = e), t.link.href
                );
            }
            function n(e) {
                var t = window.location.href.match(/^[a-z]+:\/\/[^\/]+/);
                return !t || e.lastIndexOf(t[0], 0);
            }
            function r(e, t) {
                return (
                    (!t || !t.method || "GET" === t.method) &&
                    (!t || ["must-revalidate", "immutable"].indexOf(t.control) != -1) &&
                    !!e.match("^https?://")
                );
            }
            function o(o, l) {
                function c(t, n) {
                    return fetch(t, n).then(function (r) {
                        if (!f.enabled || f.revalidated) return r;
                        if (304 === r.status)
                            return (
                                (f.revalidated = !0),
                                d
                                    .updateRequestMetaData(f.metaData)
                                    .then(function () {
                                        e(
                                            "'" +
                                                f.metaData.url +
                                                "' successfully revalidated and served from the indexedDB cache"
                                        );
                                    })
                                    .catch(function (t) {
                                        e(
                                            "'" +
                                                f.metaData.url +
                                                "' successfully revalidated but not stored in the indexedDB cache due to the error: " +
                                                t
                                        );
                                    }),
                                s(f.response, n.onProgress)
                            );
                        if (200 == r.status) {
                            (f.response = r),
                                (f.metaData.updatedAt = f.metaData.accessedAt),
                                (f.revalidated = !0);
                            var o = r.clone();
                            return s(r, n.onProgress).then(function (n) {
                                return (
                                    (f.metaData.size = n.parsedBody.length),
                                    Promise.all([
                                        d.storeRequest(t, o),
                                        d.updateRequestMetaData(f.metaData),
                                    ])
                                        .then(function () {
                                            e(
                                                "'" +
                                                    u +
                                                    "' successfully downloaded and stored in the indexedDB cache"
                                            );
                                        })
                                        .catch(function (t) {
                                            e(
                                                "'" +
                                                    u +
                                                    "' successfully downloaded but not stored in the indexedDB cache due to the error: " +
                                                    t
                                            );
                                        }),
                                    n
                                );
                            });
                        }
                        return (
                            e(
                                "'" +
                                    u +
                                    "' request failed with status: " +
                                    r.status +
                                    " " +
                                    r.statusText
                            ),
                            s(r, n.onProgress)
                        );
                    });
                }
                var d = a.getInstance(),
                    u = t("string" == typeof o ? o : o.url),
                    f = { enabled: r(u, l) };
                return (
                    l &&
                        ((f.control = l.control),
                        (f.companyName = l.companyName),
                        (f.productName = l.productName),
                        (f.productVersion = l.productVersion)),
                    (f.revalidated = !1),
                    (f.metaData = { url: u, accessedAt: Date.now(), version: f.productVersion }),
                    (f.response = null),
                    f.enabled
                        ? d
                              .loadRequest(u)
                              .then(function (t) {
                                  if (!t) return c(o, l);
                                  var r = t.response,
                                      a = t.metaData;
                                  if (
                                      ((f.response = r),
                                      (f.metaData.size = a.size),
                                      (f.metaData.updatedAt = a.updatedAt),
                                      "immutable" == f.control)
                                  )
                                      return (
                                          (f.revalidated = !0),
                                          d.updateRequestMetaData(a).then(function () {
                                              e(
                                                  "'" +
                                                      f.metaData.url +
                                                      "' served from the indexedDB cache without revalidation"
                                              );
                                          }),
                                          s(r, l.onProgress)
                                      );
                                  if (
                                      n(u) &&
                                      (r.headers.get("Last-Modified") || r.headers.get("ETag"))
                                  )
                                      return fetch(u, { method: "HEAD" }).then(function (t) {
                                          return (
                                              (f.revalidated = ["Last-Modified", "ETag"].every(
                                                  function (e) {
                                                      return (
                                                          !r.headers.get(e) ||
                                                          r.headers.get(e) == t.headers.get(e)
                                                      );
                                                  }
                                              )),
                                              f.revalidated
                                                  ? (d.updateRequestMetaData(a).then(function () {
                                                        e(
                                                            "'" +
                                                                f.metaData.url +
                                                                "' successfully revalidated and served from the indexedDB cache"
                                                        );
                                                    }),
                                                    s(f.response, l.onProgress))
                                                  : c(o, l)
                                          );
                                      });
                                  l = l || {};
                                  var i = l.headers || {};
                                  return (
                                      (l.headers = i),
                                      r.headers.get("Last-Modified")
                                          ? ((i["If-Modified-Since"] =
                                                r.headers.get("Last-Modified")),
                                            (i["Cache-Control"] = "no-cache"))
                                          : r.headers.get("ETag") &&
                                            ((i["If-None-Match"] = r.headers.get("ETag")),
                                            (i["Cache-Control"] = "no-cache")),
                                      c(o, l)
                                  );
                              })
                              .catch(function (t) {
                                  return (
                                      e(
                                          "Failed to load '" +
                                              f.metaData.url +
                                              "' from indexedDB cache due to the error: " +
                                              t
                                      ),
                                      i(o, l)
                                  );
                              })
                        : i(o, l)
                );
            }
            var a = f.UnityCache,
                i = f.fetchWithProgress,
                s = f.readBodyWithProgress;
            return o;
        })());
    var w = {
        gzip: {
            require: function (e) {
                var t = {
                    "inflate.js": function (e, t, n) {
                        "use strict";
                        function r(e) {
                            if (!(this instanceof r)) return new r(e);
                            this.options = s.assign(
                                { chunkSize: 16384, windowBits: 0, to: "" },
                                e || {}
                            );
                            var t = this.options;
                            t.raw &&
                                t.windowBits >= 0 &&
                                t.windowBits < 16 &&
                                ((t.windowBits = -t.windowBits),
                                0 === t.windowBits && (t.windowBits = -15)),
                                !(t.windowBits >= 0 && t.windowBits < 16) ||
                                    (e && e.windowBits) ||
                                    (t.windowBits += 32),
                                t.windowBits > 15 &&
                                    t.windowBits < 48 &&
                                    0 === (15 & t.windowBits) &&
                                    (t.windowBits |= 15),
                                (this.err = 0),
                                (this.msg = ""),
                                (this.ended = !1),
                                (this.chunks = []),
                                (this.strm = new u()),
                                (this.strm.avail_out = 0);
                            var n = i.inflateInit2(this.strm, t.windowBits);
                            if (n !== c.Z_OK) throw new Error(d[n]);
                            (this.header = new f()), i.inflateGetHeader(this.strm, this.header);
                        }
                        function o(e, t) {
                            var n = new r(t);
                            if ((n.push(e, !0), n.err)) throw n.msg || d[n.err];
                            return n.result;
                        }
                        function a(e, t) {
                            return (t = t || {}), (t.raw = !0), o(e, t);
                        }
                        var i = e("./zlib/inflate"),
                            s = e("./utils/common"),
                            l = e("./utils/strings"),
                            c = e("./zlib/constants"),
                            d = e("./zlib/messages"),
                            u = e("./zlib/zstream"),
                            f = e("./zlib/gzheader"),
                            h = Object.prototype.toString;
                        (r.prototype.push = function (e, t) {
                            var n,
                                r,
                                o,
                                a,
                                d,
                                u,
                                f = this.strm,
                                m = this.options.chunkSize,
                                b = this.options.dictionary,
                                p = !1;
                            if (this.ended) return !1;
                            (r = t === ~~t ? t : t === !0 ? c.Z_FINISH : c.Z_NO_FLUSH),
                                "string" == typeof e
                                    ? (f.input = l.binstring2buf(e))
                                    : "[object ArrayBuffer]" === h.call(e)
                                    ? (f.input = new Uint8Array(e))
                                    : (f.input = e),
                                (f.next_in = 0),
                                (f.avail_in = f.input.length);
                            do {
                                if (
                                    (0 === f.avail_out &&
                                        ((f.output = new s.Buf8(m)),
                                        (f.next_out = 0),
                                        (f.avail_out = m)),
                                    (n = i.inflate(f, c.Z_NO_FLUSH)),
                                    n === c.Z_NEED_DICT &&
                                        b &&
                                        ((u =
                                            "string" == typeof b
                                                ? l.string2buf(b)
                                                : "[object ArrayBuffer]" === h.call(b)
                                                ? new Uint8Array(b)
                                                : b),
                                        (n = i.inflateSetDictionary(this.strm, u))),
                                    n === c.Z_BUF_ERROR && p === !0 && ((n = c.Z_OK), (p = !1)),
                                    n !== c.Z_STREAM_END && n !== c.Z_OK)
                                )
                                    return this.onEnd(n), (this.ended = !0), !1;
                                f.next_out &&
                                    ((0 !== f.avail_out &&
                                        n !== c.Z_STREAM_END &&
                                        (0 !== f.avail_in ||
                                            (r !== c.Z_FINISH && r !== c.Z_SYNC_FLUSH))) ||
                                        ("string" === this.options.to
                                            ? ((o = l.utf8border(f.output, f.next_out)),
                                              (a = f.next_out - o),
                                              (d = l.buf2string(f.output, o)),
                                              (f.next_out = a),
                                              (f.avail_out = m - a),
                                              a && s.arraySet(f.output, f.output, o, a, 0),
                                              this.onData(d))
                                            : this.onData(s.shrinkBuf(f.output, f.next_out)))),
                                    0 === f.avail_in && 0 === f.avail_out && (p = !0);
                            } while ((f.avail_in > 0 || 0 === f.avail_out) && n !== c.Z_STREAM_END);
                            return (
                                n === c.Z_STREAM_END && (r = c.Z_FINISH),
                                r === c.Z_FINISH
                                    ? ((n = i.inflateEnd(this.strm)),
                                      this.onEnd(n),
                                      (this.ended = !0),
                                      n === c.Z_OK)
                                    : r !== c.Z_SYNC_FLUSH ||
                                      (this.onEnd(c.Z_OK), (f.avail_out = 0), !0)
                            );
                        }),
                            (r.prototype.onData = function (e) {
                                this.chunks.push(e);
                            }),
                            (r.prototype.onEnd = function (e) {
                                e === c.Z_OK &&
                                    ("string" === this.options.to
                                        ? (this.result = this.chunks.join(""))
                                        : (this.result = s.flattenChunks(this.chunks))),
                                    (this.chunks = []),
                                    (this.err = e),
                                    (this.msg = this.strm.msg);
                            }),
                            (n.Inflate = r),
                            (n.inflate = o),
                            (n.inflateRaw = a),
                            (n.ungzip = o);
                    },
                    "utils/common.js": function (e, t, n) {
                        "use strict";
                        var r =
                            "undefined" != typeof Uint8Array &&
                            "undefined" != typeof Uint16Array &&
                            "undefined" != typeof Int32Array;
                        (n.assign = function (e) {
                            for (var t = Array.prototype.slice.call(arguments, 1); t.length; ) {
                                var n = t.shift();
                                if (n) {
                                    if ("object" != typeof n)
                                        throw new TypeError(n + "must be non-object");
                                    for (var r in n) n.hasOwnProperty(r) && (e[r] = n[r]);
                                }
                            }
                            return e;
                        }),
                            (n.shrinkBuf = function (e, t) {
                                return e.length === t
                                    ? e
                                    : e.subarray
                                    ? e.subarray(0, t)
                                    : ((e.length = t), e);
                            });
                        var o = {
                                arraySet: function (e, t, n, r, o) {
                                    if (t.subarray && e.subarray)
                                        return void e.set(t.subarray(n, n + r), o);
                                    for (var a = 0; a < r; a++) e[o + a] = t[n + a];
                                },
                                flattenChunks: function (e) {
                                    var t, n, r, o, a, i;
                                    for (r = 0, t = 0, n = e.length; t < n; t++) r += e[t].length;
                                    for (
                                        i = new Uint8Array(r), o = 0, t = 0, n = e.length;
                                        t < n;
                                        t++
                                    )
                                        (a = e[t]), i.set(a, o), (o += a.length);
                                    return i;
                                },
                            },
                            a = {
                                arraySet: function (e, t, n, r, o) {
                                    for (var a = 0; a < r; a++) e[o + a] = t[n + a];
                                },
                                flattenChunks: function (e) {
                                    return [].concat.apply([], e);
                                },
                            };
                        (n.setTyped = function (e) {
                            e
                                ? ((n.Buf8 = Uint8Array),
                                  (n.Buf16 = Uint16Array),
                                  (n.Buf32 = Int32Array),
                                  n.assign(n, o))
                                : ((n.Buf8 = Array),
                                  (n.Buf16 = Array),
                                  (n.Buf32 = Array),
                                  n.assign(n, a));
                        }),
                            n.setTyped(r);
                    },
                    "utils/strings.js": function (e, t, n) {
                        "use strict";
                        function r(e, t) {
                            if (t < 65537 && ((e.subarray && i) || (!e.subarray && a)))
                                return String.fromCharCode.apply(null, o.shrinkBuf(e, t));
                            for (var n = "", r = 0; r < t; r++) n += String.fromCharCode(e[r]);
                            return n;
                        }
                        var o = e("./common"),
                            a = !0,
                            i = !0;
                        try {
                            String.fromCharCode.apply(null, [0]);
                        } catch (e) {
                            a = !1;
                        }
                        try {
                            String.fromCharCode.apply(null, new Uint8Array(1));
                        } catch (e) {
                            i = !1;
                        }
                        for (var s = new o.Buf8(256), l = 0; l < 256; l++)
                            s[l] =
                                l >= 252
                                    ? 6
                                    : l >= 248
                                    ? 5
                                    : l >= 240
                                    ? 4
                                    : l >= 224
                                    ? 3
                                    : l >= 192
                                    ? 2
                                    : 1;
                        (s[254] = s[254] = 1),
                            (n.string2buf = function (e) {
                                var t,
                                    n,
                                    r,
                                    a,
                                    i,
                                    s = e.length,
                                    l = 0;
                                for (a = 0; a < s; a++)
                                    (n = e.charCodeAt(a)),
                                        55296 === (64512 & n) &&
                                            a + 1 < s &&
                                            ((r = e.charCodeAt(a + 1)),
                                            56320 === (64512 & r) &&
                                                ((n = 65536 + ((n - 55296) << 10) + (r - 56320)),
                                                a++)),
                                        (l += n < 128 ? 1 : n < 2048 ? 2 : n < 65536 ? 3 : 4);
                                for (t = new o.Buf8(l), i = 0, a = 0; i < l; a++)
                                    (n = e.charCodeAt(a)),
                                        55296 === (64512 & n) &&
                                            a + 1 < s &&
                                            ((r = e.charCodeAt(a + 1)),
                                            56320 === (64512 & r) &&
                                                ((n = 65536 + ((n - 55296) << 10) + (r - 56320)),
                                                a++)),
                                        n < 128
                                            ? (t[i++] = n)
                                            : n < 2048
                                            ? ((t[i++] = 192 | (n >>> 6)),
                                              (t[i++] = 128 | (63 & n)))
                                            : n < 65536
                                            ? ((t[i++] = 224 | (n >>> 12)),
                                              (t[i++] = 128 | ((n >>> 6) & 63)),
                                              (t[i++] = 128 | (63 & n)))
                                            : ((t[i++] = 240 | (n >>> 18)),
                                              (t[i++] = 128 | ((n >>> 12) & 63)),
                                              (t[i++] = 128 | ((n >>> 6) & 63)),
                                              (t[i++] = 128 | (63 & n)));
                                return t;
                            }),
                            (n.buf2binstring = function (e) {
                                return r(e, e.length);
                            }),
                            (n.binstring2buf = function (e) {
                                for (var t = new o.Buf8(e.length), n = 0, r = t.length; n < r; n++)
                                    t[n] = e.charCodeAt(n);
                                return t;
                            }),
                            (n.buf2string = function (e, t) {
                                var n,
                                    o,
                                    a,
                                    i,
                                    l = t || e.length,
                                    c = new Array(2 * l);
                                for (o = 0, n = 0; n < l; )
                                    if (((a = e[n++]), a < 128)) c[o++] = a;
                                    else if (((i = s[a]), i > 4)) (c[o++] = 65533), (n += i - 1);
                                    else {
                                        for (a &= 2 === i ? 31 : 3 === i ? 15 : 7; i > 1 && n < l; )
                                            (a = (a << 6) | (63 & e[n++])), i--;
                                        i > 1
                                            ? (c[o++] = 65533)
                                            : a < 65536
                                            ? (c[o++] = a)
                                            : ((a -= 65536),
                                              (c[o++] = 55296 | ((a >> 10) & 1023)),
                                              (c[o++] = 56320 | (1023 & a)));
                                    }
                                return r(c, o);
                            }),
                            (n.utf8border = function (e, t) {
                                var n;
                                for (
                                    t = t || e.length, t > e.length && (t = e.length), n = t - 1;
                                    n >= 0 && 128 === (192 & e[n]);

                                )
                                    n--;
                                return n < 0 ? t : 0 === n ? t : n + s[e[n]] > t ? n : t;
                            });
                    },
                    "zlib/inflate.js": function (e, t, n) {
                        "use strict";
                        function r(e) {
                            return (
                                ((e >>> 24) & 255) +
                                ((e >>> 8) & 65280) +
                                ((65280 & e) << 8) +
                                ((255 & e) << 24)
                            );
                        }
                        function o() {
                            (this.mode = 0),
                                (this.last = !1),
                                (this.wrap = 0),
                                (this.havedict = !1),
                                (this.flags = 0),
                                (this.dmax = 0),
                                (this.check = 0),
                                (this.total = 0),
                                (this.head = null),
                                (this.wbits = 0),
                                (this.wsize = 0),
                                (this.whave = 0),
                                (this.wnext = 0),
                                (this.window = null),
                                (this.hold = 0),
                                (this.bits = 0),
                                (this.length = 0),
                                (this.offset = 0),
                                (this.extra = 0),
                                (this.lencode = null),
                                (this.distcode = null),
                                (this.lenbits = 0),
                                (this.distbits = 0),
                                (this.ncode = 0),
                                (this.nlen = 0),
                                (this.ndist = 0),
                                (this.have = 0),
                                (this.next = null),
                                (this.lens = new w.Buf16(320)),
                                (this.work = new w.Buf16(288)),
                                (this.lendyn = null),
                                (this.distdyn = null),
                                (this.sane = 0),
                                (this.back = 0),
                                (this.was = 0);
                        }
                        function a(e) {
                            var t;
                            return e && e.state
                                ? ((t = e.state),
                                  (e.total_in = e.total_out = t.total = 0),
                                  (e.msg = ""),
                                  t.wrap && (e.adler = 1 & t.wrap),
                                  (t.mode = z),
                                  (t.last = 0),
                                  (t.havedict = 0),
                                  (t.dmax = 32768),
                                  (t.head = null),
                                  (t.hold = 0),
                                  (t.bits = 0),
                                  (t.lencode = t.lendyn = new w.Buf32(be)),
                                  (t.distcode = t.distdyn = new w.Buf32(pe)),
                                  (t.sane = 1),
                                  (t.back = -1),
                                  D)
                                : A;
                        }
                        function i(e) {
                            var t;
                            return e && e.state
                                ? ((t = e.state), (t.wsize = 0), (t.whave = 0), (t.wnext = 0), a(e))
                                : A;
                        }
                        function s(e, t) {
                            var n, r;
                            return e && e.state
                                ? ((r = e.state),
                                  t < 0
                                      ? ((n = 0), (t = -t))
                                      : ((n = (t >> 4) + 1), t < 48 && (t &= 15)),
                                  t && (t < 8 || t > 15)
                                      ? A
                                      : (null !== r.window && r.wbits !== t && (r.window = null),
                                        (r.wrap = n),
                                        (r.wbits = t),
                                        i(e)))
                                : A;
                        }
                        function l(e, t) {
                            var n, r;
                            return e
                                ? ((r = new o()),
                                  (e.state = r),
                                  (r.window = null),
                                  (n = s(e, t)),
                                  n !== D && (e.state = null),
                                  n)
                                : A;
                        }
                        function c(e) {
                            return l(e, we);
                        }
                        function d(e) {
                            if (ve) {
                                var t;
                                for (p = new w.Buf32(512), g = new w.Buf32(32), t = 0; t < 144; )
                                    e.lens[t++] = 8;
                                for (; t < 256; ) e.lens[t++] = 9;
                                for (; t < 280; ) e.lens[t++] = 7;
                                for (; t < 288; ) e.lens[t++] = 8;
                                for (
                                    _(S, e.lens, 0, 288, p, 0, e.work, { bits: 9 }), t = 0;
                                    t < 32;

                                )
                                    e.lens[t++] = 5;
                                _(C, e.lens, 0, 32, g, 0, e.work, { bits: 5 }), (ve = !1);
                            }
                            (e.lencode = p), (e.lenbits = 9), (e.distcode = g), (e.distbits = 5);
                        }
                        function u(e, t, n, r) {
                            var o,
                                a = e.state;
                            return (
                                null === a.window &&
                                    ((a.wsize = 1 << a.wbits),
                                    (a.wnext = 0),
                                    (a.whave = 0),
                                    (a.window = new w.Buf8(a.wsize))),
                                r >= a.wsize
                                    ? (w.arraySet(a.window, t, n - a.wsize, a.wsize, 0),
                                      (a.wnext = 0),
                                      (a.whave = a.wsize))
                                    : ((o = a.wsize - a.wnext),
                                      o > r && (o = r),
                                      w.arraySet(a.window, t, n - r, o, a.wnext),
                                      (r -= o),
                                      r
                                          ? (w.arraySet(a.window, t, n - r, r, 0),
                                            (a.wnext = r),
                                            (a.whave = a.wsize))
                                          : ((a.wnext += o),
                                            a.wnext === a.wsize && (a.wnext = 0),
                                            a.whave < a.wsize && (a.whave += o))),
                                0
                            );
                        }
                        function f(e, t) {
                            var n,
                                o,
                                a,
                                i,
                                s,
                                l,
                                c,
                                f,
                                h,
                                m,
                                b,
                                p,
                                g,
                                be,
                                pe,
                                ge,
                                we,
                                ve,
                                ye,
                                ke,
                                _e,
                                xe,
                                Se,
                                Ce,
                                Ee = 0,
                                Ue = new w.Buf8(4),
                                Be = [
                                    16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1,
                                    15,
                                ];
                            if (!e || !e.state || !e.output || (!e.input && 0 !== e.avail_in))
                                return A;
                            (n = e.state),
                                n.mode === K && (n.mode = Y),
                                (s = e.next_out),
                                (a = e.output),
                                (c = e.avail_out),
                                (i = e.next_in),
                                (o = e.input),
                                (l = e.avail_in),
                                (f = n.hold),
                                (h = n.bits),
                                (m = l),
                                (b = c),
                                (xe = D);
                            e: for (;;)
                                switch (n.mode) {
                                    case z:
                                        if (0 === n.wrap) {
                                            n.mode = Y;
                                            break;
                                        }
                                        for (; h < 16; ) {
                                            if (0 === l) break e;
                                            l--, (f += o[i++] << h), (h += 8);
                                        }
                                        if (2 & n.wrap && 35615 === f) {
                                            (n.check = 0),
                                                (Ue[0] = 255 & f),
                                                (Ue[1] = (f >>> 8) & 255),
                                                (n.check = y(n.check, Ue, 2, 0)),
                                                (f = 0),
                                                (h = 0),
                                                (n.mode = N);
                                            break;
                                        }
                                        if (
                                            ((n.flags = 0),
                                            n.head && (n.head.done = !1),
                                            !(1 & n.wrap) || (((255 & f) << 8) + (f >> 8)) % 31)
                                        ) {
                                            (e.msg = "incorrect header check"), (n.mode = fe);
                                            break;
                                        }
                                        if ((15 & f) !== O) {
                                            (e.msg = "unknown compression method"), (n.mode = fe);
                                            break;
                                        }
                                        if (
                                            ((f >>>= 4),
                                            (h -= 4),
                                            (_e = (15 & f) + 8),
                                            0 === n.wbits)
                                        )
                                            n.wbits = _e;
                                        else if (_e > n.wbits) {
                                            (e.msg = "invalid window size"), (n.mode = fe);
                                            break;
                                        }
                                        (n.dmax = 1 << _e),
                                            (e.adler = n.check = 1),
                                            (n.mode = 512 & f ? G : K),
                                            (f = 0),
                                            (h = 0);
                                        break;
                                    case N:
                                        for (; h < 16; ) {
                                            if (0 === l) break e;
                                            l--, (f += o[i++] << h), (h += 8);
                                        }
                                        if (((n.flags = f), (255 & n.flags) !== O)) {
                                            (e.msg = "unknown compression method"), (n.mode = fe);
                                            break;
                                        }
                                        if (57344 & n.flags) {
                                            (e.msg = "unknown header flags set"), (n.mode = fe);
                                            break;
                                        }
                                        n.head && (n.head.text = (f >> 8) & 1),
                                            512 & n.flags &&
                                                ((Ue[0] = 255 & f),
                                                (Ue[1] = (f >>> 8) & 255),
                                                (n.check = y(n.check, Ue, 2, 0))),
                                            (f = 0),
                                            (h = 0),
                                            (n.mode = F);
                                    case F:
                                        for (; h < 32; ) {
                                            if (0 === l) break e;
                                            l--, (f += o[i++] << h), (h += 8);
                                        }
                                        n.head && (n.head.time = f),
                                            512 & n.flags &&
                                                ((Ue[0] = 255 & f),
                                                (Ue[1] = (f >>> 8) & 255),
                                                (Ue[2] = (f >>> 16) & 255),
                                                (Ue[3] = (f >>> 24) & 255),
                                                (n.check = y(n.check, Ue, 4, 0))),
                                            (f = 0),
                                            (h = 0),
                                            (n.mode = M);
                                    case M:
                                        for (; h < 16; ) {
                                            if (0 === l) break e;
                                            l--, (f += o[i++] << h), (h += 8);
                                        }
                                        n.head && ((n.head.xflags = 255 & f), (n.head.os = f >> 8)),
                                            512 & n.flags &&
                                                ((Ue[0] = 255 & f),
                                                (Ue[1] = (f >>> 8) & 255),
                                                (n.check = y(n.check, Ue, 2, 0))),
                                            (f = 0),
                                            (h = 0),
                                            (n.mode = Z);
                                    case Z:
                                        if (1024 & n.flags) {
                                            for (; h < 16; ) {
                                                if (0 === l) break e;
                                                l--, (f += o[i++] << h), (h += 8);
                                            }
                                            (n.length = f),
                                                n.head && (n.head.extra_len = f),
                                                512 & n.flags &&
                                                    ((Ue[0] = 255 & f),
                                                    (Ue[1] = (f >>> 8) & 255),
                                                    (n.check = y(n.check, Ue, 2, 0))),
                                                (f = 0),
                                                (h = 0);
                                        } else n.head && (n.head.extra = null);
                                        n.mode = j;
                                    case j:
                                        if (
                                            1024 & n.flags &&
                                            ((p = n.length),
                                            p > l && (p = l),
                                            p &&
                                                (n.head &&
                                                    ((_e = n.head.extra_len - n.length),
                                                    n.head.extra ||
                                                        (n.head.extra = new Array(
                                                            n.head.extra_len
                                                        )),
                                                    w.arraySet(n.head.extra, o, i, p, _e)),
                                                512 & n.flags && (n.check = y(n.check, o, p, i)),
                                                (l -= p),
                                                (i += p),
                                                (n.length -= p)),
                                            n.length)
                                        )
                                            break e;
                                        (n.length = 0), (n.mode = H);
                                    case H:
                                        if (2048 & n.flags) {
                                            if (0 === l) break e;
                                            p = 0;
                                            do
                                                (_e = o[i + p++]),
                                                    n.head &&
                                                        _e &&
                                                        n.length < 65536 &&
                                                        (n.head.name += String.fromCharCode(_e));
                                            while (_e && p < l);
                                            if (
                                                (512 & n.flags && (n.check = y(n.check, o, p, i)),
                                                (l -= p),
                                                (i += p),
                                                _e)
                                            )
                                                break e;
                                        } else n.head && (n.head.name = null);
                                        (n.length = 0), (n.mode = W);
                                    case W:
                                        if (4096 & n.flags) {
                                            if (0 === l) break e;
                                            p = 0;
                                            do
                                                (_e = o[i + p++]),
                                                    n.head &&
                                                        _e &&
                                                        n.length < 65536 &&
                                                        (n.head.comment += String.fromCharCode(_e));
                                            while (_e && p < l);
                                            if (
                                                (512 & n.flags && (n.check = y(n.check, o, p, i)),
                                                (l -= p),
                                                (i += p),
                                                _e)
                                            )
                                                break e;
                                        } else n.head && (n.head.comment = null);
                                        n.mode = q;
                                    case q:
                                        if (512 & n.flags) {
                                            for (; h < 16; ) {
                                                if (0 === l) break e;
                                                l--, (f += o[i++] << h), (h += 8);
                                            }
                                            if (f !== (65535 & n.check)) {
                                                (e.msg = "header crc mismatch"), (n.mode = fe);
                                                break;
                                            }
                                            (f = 0), (h = 0);
                                        }
                                        n.head &&
                                            ((n.head.hcrc = (n.flags >> 9) & 1),
                                            (n.head.done = !0)),
                                            (e.adler = n.check = 0),
                                            (n.mode = K);
                                        break;
                                    case G:
                                        for (; h < 32; ) {
                                            if (0 === l) break e;
                                            l--, (f += o[i++] << h), (h += 8);
                                        }
                                        (e.adler = n.check = r(f)), (f = 0), (h = 0), (n.mode = V);
                                    case V:
                                        if (0 === n.havedict)
                                            return (
                                                (e.next_out = s),
                                                (e.avail_out = c),
                                                (e.next_in = i),
                                                (e.avail_in = l),
                                                (n.hold = f),
                                                (n.bits = h),
                                                R
                                            );
                                        (e.adler = n.check = 1), (n.mode = K);
                                    case K:
                                        if (t === U || t === B) break e;
                                    case Y:
                                        if (n.last) {
                                            (f >>>= 7 & h), (h -= 7 & h), (n.mode = ce);
                                            break;
                                        }
                                        for (; h < 3; ) {
                                            if (0 === l) break e;
                                            l--, (f += o[i++] << h), (h += 8);
                                        }
                                        switch (((n.last = 1 & f), (f >>>= 1), (h -= 1), 3 & f)) {
                                            case 0:
                                                n.mode = Q;
                                                break;
                                            case 1:
                                                if ((d(n), (n.mode = ne), t === B)) {
                                                    (f >>>= 2), (h -= 2);
                                                    break e;
                                                }
                                                break;
                                            case 2:
                                                n.mode = $;
                                                break;
                                            case 3:
                                                (e.msg = "invalid block type"), (n.mode = fe);
                                        }
                                        (f >>>= 2), (h -= 2);
                                        break;
                                    case Q:
                                        for (f >>>= 7 & h, h -= 7 & h; h < 32; ) {
                                            if (0 === l) break e;
                                            l--, (f += o[i++] << h), (h += 8);
                                        }
                                        if ((65535 & f) !== ((f >>> 16) ^ 65535)) {
                                            (e.msg = "invalid stored block lengths"), (n.mode = fe);
                                            break;
                                        }
                                        if (
                                            ((n.length = 65535 & f),
                                            (f = 0),
                                            (h = 0),
                                            (n.mode = X),
                                            t === B)
                                        )
                                            break e;
                                    case X:
                                        n.mode = J;
                                    case J:
                                        if ((p = n.length)) {
                                            if ((p > l && (p = l), p > c && (p = c), 0 === p))
                                                break e;
                                            w.arraySet(a, o, i, p, s),
                                                (l -= p),
                                                (i += p),
                                                (c -= p),
                                                (s += p),
                                                (n.length -= p);
                                            break;
                                        }
                                        n.mode = K;
                                        break;
                                    case $:
                                        for (; h < 14; ) {
                                            if (0 === l) break e;
                                            l--, (f += o[i++] << h), (h += 8);
                                        }
                                        if (
                                            ((n.nlen = (31 & f) + 257),
                                            (f >>>= 5),
                                            (h -= 5),
                                            (n.ndist = (31 & f) + 1),
                                            (f >>>= 5),
                                            (h -= 5),
                                            (n.ncode = (15 & f) + 4),
                                            (f >>>= 4),
                                            (h -= 4),
                                            n.nlen > 286 || n.ndist > 30)
                                        ) {
                                            (e.msg = "too many length or distance symbols"),
                                                (n.mode = fe);
                                            break;
                                        }
                                        (n.have = 0), (n.mode = ee);
                                    case ee:
                                        for (; n.have < n.ncode; ) {
                                            for (; h < 3; ) {
                                                if (0 === l) break e;
                                                l--, (f += o[i++] << h), (h += 8);
                                            }
                                            (n.lens[Be[n.have++]] = 7 & f), (f >>>= 3), (h -= 3);
                                        }
                                        for (; n.have < 19; ) n.lens[Be[n.have++]] = 0;
                                        if (
                                            ((n.lencode = n.lendyn),
                                            (n.lenbits = 7),
                                            (Se = { bits: n.lenbits }),
                                            (xe = _(x, n.lens, 0, 19, n.lencode, 0, n.work, Se)),
                                            (n.lenbits = Se.bits),
                                            xe)
                                        ) {
                                            (e.msg = "invalid code lengths set"), (n.mode = fe);
                                            break;
                                        }
                                        (n.have = 0), (n.mode = te);
                                    case te:
                                        for (; n.have < n.nlen + n.ndist; ) {
                                            for (
                                                ;
                                                (Ee = n.lencode[f & ((1 << n.lenbits) - 1)]),
                                                    (pe = Ee >>> 24),
                                                    (ge = (Ee >>> 16) & 255),
                                                    (we = 65535 & Ee),
                                                    !(pe <= h);

                                            ) {
                                                if (0 === l) break e;
                                                l--, (f += o[i++] << h), (h += 8);
                                            }
                                            if (we < 16)
                                                (f >>>= pe), (h -= pe), (n.lens[n.have++] = we);
                                            else {
                                                if (16 === we) {
                                                    for (Ce = pe + 2; h < Ce; ) {
                                                        if (0 === l) break e;
                                                        l--, (f += o[i++] << h), (h += 8);
                                                    }
                                                    if (((f >>>= pe), (h -= pe), 0 === n.have)) {
                                                        (e.msg = "invalid bit length repeat"),
                                                            (n.mode = fe);
                                                        break;
                                                    }
                                                    (_e = n.lens[n.have - 1]),
                                                        (p = 3 + (3 & f)),
                                                        (f >>>= 2),
                                                        (h -= 2);
                                                } else if (17 === we) {
                                                    for (Ce = pe + 3; h < Ce; ) {
                                                        if (0 === l) break e;
                                                        l--, (f += o[i++] << h), (h += 8);
                                                    }
                                                    (f >>>= pe),
                                                        (h -= pe),
                                                        (_e = 0),
                                                        (p = 3 + (7 & f)),
                                                        (f >>>= 3),
                                                        (h -= 3);
                                                } else {
                                                    for (Ce = pe + 7; h < Ce; ) {
                                                        if (0 === l) break e;
                                                        l--, (f += o[i++] << h), (h += 8);
                                                    }
                                                    (f >>>= pe),
                                                        (h -= pe),
                                                        (_e = 0),
                                                        (p = 11 + (127 & f)),
                                                        (f >>>= 7),
                                                        (h -= 7);
                                                }
                                                if (n.have + p > n.nlen + n.ndist) {
                                                    (e.msg = "invalid bit length repeat"),
                                                        (n.mode = fe);
                                                    break;
                                                }
                                                for (; p--; ) n.lens[n.have++] = _e;
                                            }
                                        }
                                        if (n.mode === fe) break;
                                        if (0 === n.lens[256]) {
                                            (e.msg = "invalid code -- missing end-of-block"),
                                                (n.mode = fe);
                                            break;
                                        }
                                        if (
                                            ((n.lenbits = 9),
                                            (Se = { bits: n.lenbits }),
                                            (xe = _(
                                                S,
                                                n.lens,
                                                0,
                                                n.nlen,
                                                n.lencode,
                                                0,
                                                n.work,
                                                Se
                                            )),
                                            (n.lenbits = Se.bits),
                                            xe)
                                        ) {
                                            (e.msg = "invalid literal/lengths set"), (n.mode = fe);
                                            break;
                                        }
                                        if (
                                            ((n.distbits = 6),
                                            (n.distcode = n.distdyn),
                                            (Se = { bits: n.distbits }),
                                            (xe = _(
                                                C,
                                                n.lens,
                                                n.nlen,
                                                n.ndist,
                                                n.distcode,
                                                0,
                                                n.work,
                                                Se
                                            )),
                                            (n.distbits = Se.bits),
                                            xe)
                                        ) {
                                            (e.msg = "invalid distances set"), (n.mode = fe);
                                            break;
                                        }
                                        if (((n.mode = ne), t === B)) break e;
                                    case ne:
                                        n.mode = re;
                                    case re:
                                        if (l >= 6 && c >= 258) {
                                            (e.next_out = s),
                                                (e.avail_out = c),
                                                (e.next_in = i),
                                                (e.avail_in = l),
                                                (n.hold = f),
                                                (n.bits = h),
                                                k(e, b),
                                                (s = e.next_out),
                                                (a = e.output),
                                                (c = e.avail_out),
                                                (i = e.next_in),
                                                (o = e.input),
                                                (l = e.avail_in),
                                                (f = n.hold),
                                                (h = n.bits),
                                                n.mode === K && (n.back = -1);
                                            break;
                                        }
                                        for (
                                            n.back = 0;
                                            (Ee = n.lencode[f & ((1 << n.lenbits) - 1)]),
                                                (pe = Ee >>> 24),
                                                (ge = (Ee >>> 16) & 255),
                                                (we = 65535 & Ee),
                                                !(pe <= h);

                                        ) {
                                            if (0 === l) break e;
                                            l--, (f += o[i++] << h), (h += 8);
                                        }
                                        if (ge && 0 === (240 & ge)) {
                                            for (
                                                ve = pe, ye = ge, ke = we;
                                                (Ee =
                                                    n.lencode[
                                                        ke + ((f & ((1 << (ve + ye)) - 1)) >> ve)
                                                    ]),
                                                    (pe = Ee >>> 24),
                                                    (ge = (Ee >>> 16) & 255),
                                                    (we = 65535 & Ee),
                                                    !(ve + pe <= h);

                                            ) {
                                                if (0 === l) break e;
                                                l--, (f += o[i++] << h), (h += 8);
                                            }
                                            (f >>>= ve), (h -= ve), (n.back += ve);
                                        }
                                        if (
                                            ((f >>>= pe),
                                            (h -= pe),
                                            (n.back += pe),
                                            (n.length = we),
                                            0 === ge)
                                        ) {
                                            n.mode = le;
                                            break;
                                        }
                                        if (32 & ge) {
                                            (n.back = -1), (n.mode = K);
                                            break;
                                        }
                                        if (64 & ge) {
                                            (e.msg = "invalid literal/length code"), (n.mode = fe);
                                            break;
                                        }
                                        (n.extra = 15 & ge), (n.mode = oe);
                                    case oe:
                                        if (n.extra) {
                                            for (Ce = n.extra; h < Ce; ) {
                                                if (0 === l) break e;
                                                l--, (f += o[i++] << h), (h += 8);
                                            }
                                            (n.length += f & ((1 << n.extra) - 1)),
                                                (f >>>= n.extra),
                                                (h -= n.extra),
                                                (n.back += n.extra);
                                        }
                                        (n.was = n.length), (n.mode = ae);
                                    case ae:
                                        for (
                                            ;
                                            (Ee = n.distcode[f & ((1 << n.distbits) - 1)]),
                                                (pe = Ee >>> 24),
                                                (ge = (Ee >>> 16) & 255),
                                                (we = 65535 & Ee),
                                                !(pe <= h);

                                        ) {
                                            if (0 === l) break e;
                                            l--, (f += o[i++] << h), (h += 8);
                                        }
                                        if (0 === (240 & ge)) {
                                            for (
                                                ve = pe, ye = ge, ke = we;
                                                (Ee =
                                                    n.distcode[
                                                        ke + ((f & ((1 << (ve + ye)) - 1)) >> ve)
                                                    ]),
                                                    (pe = Ee >>> 24),
                                                    (ge = (Ee >>> 16) & 255),
                                                    (we = 65535 & Ee),
                                                    !(ve + pe <= h);

                                            ) {
                                                if (0 === l) break e;
                                                l--, (f += o[i++] << h), (h += 8);
                                            }
                                            (f >>>= ve), (h -= ve), (n.back += ve);
                                        }
                                        if (((f >>>= pe), (h -= pe), (n.back += pe), 64 & ge)) {
                                            (e.msg = "invalid distance code"), (n.mode = fe);
                                            break;
                                        }
                                        (n.offset = we), (n.extra = 15 & ge), (n.mode = ie);
                                    case ie:
                                        if (n.extra) {
                                            for (Ce = n.extra; h < Ce; ) {
                                                if (0 === l) break e;
                                                l--, (f += o[i++] << h), (h += 8);
                                            }
                                            (n.offset += f & ((1 << n.extra) - 1)),
                                                (f >>>= n.extra),
                                                (h -= n.extra),
                                                (n.back += n.extra);
                                        }
                                        if (n.offset > n.dmax) {
                                            (e.msg = "invalid distance too far back"),
                                                (n.mode = fe);
                                            break;
                                        }
                                        n.mode = se;
                                    case se:
                                        if (0 === c) break e;
                                        if (((p = b - c), n.offset > p)) {
                                            if (((p = n.offset - p), p > n.whave && n.sane)) {
                                                (e.msg = "invalid distance too far back"),
                                                    (n.mode = fe);
                                                break;
                                            }
                                            p > n.wnext
                                                ? ((p -= n.wnext), (g = n.wsize - p))
                                                : (g = n.wnext - p),
                                                p > n.length && (p = n.length),
                                                (be = n.window);
                                        } else (be = a), (g = s - n.offset), (p = n.length);
                                        p > c && (p = c), (c -= p), (n.length -= p);
                                        do a[s++] = be[g++];
                                        while (--p);
                                        0 === n.length && (n.mode = re);
                                        break;
                                    case le:
                                        if (0 === c) break e;
                                        (a[s++] = n.length), c--, (n.mode = re);
                                        break;
                                    case ce:
                                        if (n.wrap) {
                                            for (; h < 32; ) {
                                                if (0 === l) break e;
                                                l--, (f |= o[i++] << h), (h += 8);
                                            }
                                            if (
                                                ((b -= c),
                                                (e.total_out += b),
                                                (n.total += b),
                                                b &&
                                                    (e.adler = n.check =
                                                        n.flags
                                                            ? y(n.check, a, b, s - b)
                                                            : v(n.check, a, b, s - b)),
                                                (b = c),
                                                (n.flags ? f : r(f)) !== n.check)
                                            ) {
                                                (e.msg = "incorrect data check"), (n.mode = fe);
                                                break;
                                            }
                                            (f = 0), (h = 0);
                                        }
                                        n.mode = de;
                                    case de:
                                        if (n.wrap && n.flags) {
                                            for (; h < 32; ) {
                                                if (0 === l) break e;
                                                l--, (f += o[i++] << h), (h += 8);
                                            }
                                            if (f !== (4294967295 & n.total)) {
                                                (e.msg = "incorrect length check"), (n.mode = fe);
                                                break;
                                            }
                                            (f = 0), (h = 0);
                                        }
                                        n.mode = ue;
                                    case ue:
                                        xe = T;
                                        break e;
                                    case fe:
                                        xe = P;
                                        break e;
                                    case he:
                                        return I;
                                    case me:
                                    default:
                                        return A;
                                }
                            return (
                                (e.next_out = s),
                                (e.avail_out = c),
                                (e.next_in = i),
                                (e.avail_in = l),
                                (n.hold = f),
                                (n.bits = h),
                                (n.wsize ||
                                    (b !== e.avail_out &&
                                        n.mode < fe &&
                                        (n.mode < ce || t !== E))) &&
                                u(e, e.output, e.next_out, b - e.avail_out)
                                    ? ((n.mode = he), I)
                                    : ((m -= e.avail_in),
                                      (b -= e.avail_out),
                                      (e.total_in += m),
                                      (e.total_out += b),
                                      (n.total += b),
                                      n.wrap &&
                                          b &&
                                          (e.adler = n.check =
                                              n.flags
                                                  ? y(n.check, a, b, e.next_out - b)
                                                  : v(n.check, a, b, e.next_out - b)),
                                      (e.data_type =
                                          n.bits +
                                          (n.last ? 64 : 0) +
                                          (n.mode === K ? 128 : 0) +
                                          (n.mode === ne || n.mode === X ? 256 : 0)),
                                      ((0 === m && 0 === b) || t === E) && xe === D && (xe = L),
                                      xe)
                            );
                        }
                        function h(e) {
                            if (!e || !e.state) return A;
                            var t = e.state;
                            return t.window && (t.window = null), (e.state = null), D;
                        }
                        function m(e, t) {
                            var n;
                            return e && e.state
                                ? ((n = e.state),
                                  0 === (2 & n.wrap) ? A : ((n.head = t), (t.done = !1), D))
                                : A;
                        }
                        function b(e, t) {
                            var n,
                                r,
                                o,
                                a = t.length;
                            return e && e.state
                                ? ((n = e.state),
                                  0 !== n.wrap && n.mode !== V
                                      ? A
                                      : n.mode === V &&
                                        ((r = 1), (r = v(r, t, a, 0)), r !== n.check)
                                      ? P
                                      : (o = u(e, t, a, a))
                                      ? ((n.mode = he), I)
                                      : ((n.havedict = 1), D))
                                : A;
                        }
                        var p,
                            g,
                            w = e("../utils/common"),
                            v = e("./adler32"),
                            y = e("./crc32"),
                            k = e("./inffast"),
                            _ = e("./inftrees"),
                            x = 0,
                            S = 1,
                            C = 2,
                            E = 4,
                            U = 5,
                            B = 6,
                            D = 0,
                            T = 1,
                            R = 2,
                            A = -2,
                            P = -3,
                            I = -4,
                            L = -5,
                            O = 8,
                            z = 1,
                            N = 2,
                            F = 3,
                            M = 4,
                            Z = 5,
                            j = 6,
                            H = 7,
                            W = 8,
                            q = 9,
                            G = 10,
                            V = 11,
                            K = 12,
                            Y = 13,
                            Q = 14,
                            X = 15,
                            J = 16,
                            $ = 17,
                            ee = 18,
                            te = 19,
                            ne = 20,
                            re = 21,
                            oe = 22,
                            ae = 23,
                            ie = 24,
                            se = 25,
                            le = 26,
                            ce = 27,
                            de = 28,
                            ue = 29,
                            fe = 30,
                            he = 31,
                            me = 32,
                            be = 852,
                            pe = 592,
                            ge = 15,
                            we = ge,
                            ve = !0;
                        (n.inflateReset = i),
                            (n.inflateReset2 = s),
                            (n.inflateResetKeep = a),
                            (n.inflateInit = c),
                            (n.inflateInit2 = l),
                            (n.inflate = f),
                            (n.inflateEnd = h),
                            (n.inflateGetHeader = m),
                            (n.inflateSetDictionary = b),
                            (n.inflateInfo = "pako inflate (from Nodeca project)");
                    },
                    "zlib/constants.js": function (e, t, n) {
                        "use strict";
                        t.exports = {
                            Z_NO_FLUSH: 0,
                            Z_PARTIAL_FLUSH: 1,
                            Z_SYNC_FLUSH: 2,
                            Z_FULL_FLUSH: 3,
                            Z_FINISH: 4,
                            Z_BLOCK: 5,
                            Z_TREES: 6,
                            Z_OK: 0,
                            Z_STREAM_END: 1,
                            Z_NEED_DICT: 2,
                            Z_ERRNO: -1,
                            Z_STREAM_ERROR: -2,
                            Z_DATA_ERROR: -3,
                            Z_BUF_ERROR: -5,
                            Z_NO_COMPRESSION: 0,
                            Z_BEST_SPEED: 1,
                            Z_BEST_COMPRESSION: 9,
                            Z_DEFAULT_COMPRESSION: -1,
                            Z_FILTERED: 1,
                            Z_HUFFMAN_ONLY: 2,
                            Z_RLE: 3,
                            Z_FIXED: 4,
                            Z_DEFAULT_STRATEGY: 0,
                            Z_BINARY: 0,
                            Z_TEXT: 1,
                            Z_UNKNOWN: 2,
                            Z_DEFLATED: 8,
                        };
                    },
                    "zlib/messages.js": function (e, t, n) {
                        "use strict";
                        t.exports = {
                            2: "need dictionary",
                            1: "stream end",
                            0: "",
                            "-1": "file error",
                            "-2": "stream error",
                            "-3": "data error",
                            "-4": "insufficient memory",
                            "-5": "buffer error",
                            "-6": "incompatible version",
                        };
                    },
                    "zlib/zstream.js": function (e, t, n) {
                        "use strict";
                        function r() {
                            (this.input = null),
                                (this.next_in = 0),
                                (this.avail_in = 0),
                                (this.total_in = 0),
                                (this.output = null),
                                (this.next_out = 0),
                                (this.avail_out = 0),
                                (this.total_out = 0),
                                (this.msg = ""),
                                (this.state = null),
                                (this.data_type = 2),
                                (this.adler = 0);
                        }
                        t.exports = r;
                    },
                    "zlib/gzheader.js": function (e, t, n) {
                        "use strict";
                        function r() {
                            (this.text = 0),
                                (this.time = 0),
                                (this.xflags = 0),
                                (this.os = 0),
                                (this.extra = null),
                                (this.extra_len = 0),
                                (this.name = ""),
                                (this.comment = ""),
                                (this.hcrc = 0),
                                (this.done = !1);
                        }
                        t.exports = r;
                    },
                    "zlib/adler32.js": function (e, t, n) {
                        "use strict";
                        function r(e, t, n, r) {
                            for (
                                var o = (65535 & e) | 0, a = ((e >>> 16) & 65535) | 0, i = 0;
                                0 !== n;

                            ) {
                                (i = n > 2e3 ? 2e3 : n), (n -= i);
                                do (o = (o + t[r++]) | 0), (a = (a + o) | 0);
                                while (--i);
                                (o %= 65521), (a %= 65521);
                            }
                            return o | (a << 16) | 0;
                        }
                        t.exports = r;
                    },
                    "zlib/crc32.js": function (e, t, n) {
                        "use strict";
                        function r() {
                            for (var e, t = [], n = 0; n < 256; n++) {
                                e = n;
                                for (var r = 0; r < 8; r++)
                                    e = 1 & e ? 3988292384 ^ (e >>> 1) : e >>> 1;
                                t[n] = e;
                            }
                            return t;
                        }
                        function o(e, t, n, r) {
                            var o = a,
                                i = r + n;
                            e ^= -1;
                            for (var s = r; s < i; s++) e = (e >>> 8) ^ o[255 & (e ^ t[s])];
                            return e ^ -1;
                        }
                        var a = r();
                        t.exports = o;
                    },
                    "zlib/inffast.js": function (e, t, n) {
                        "use strict";
                        var r = 30,
                            o = 12;
                        t.exports = function (e, t) {
                            var n,
                                a,
                                i,
                                s,
                                l,
                                c,
                                d,
                                u,
                                f,
                                h,
                                m,
                                b,
                                p,
                                g,
                                w,
                                v,
                                y,
                                k,
                                _,
                                x,
                                S,
                                C,
                                E,
                                U,
                                B;
                            (n = e.state),
                                (a = e.next_in),
                                (U = e.input),
                                (i = a + (e.avail_in - 5)),
                                (s = e.next_out),
                                (B = e.output),
                                (l = s - (t - e.avail_out)),
                                (c = s + (e.avail_out - 257)),
                                (d = n.dmax),
                                (u = n.wsize),
                                (f = n.whave),
                                (h = n.wnext),
                                (m = n.window),
                                (b = n.hold),
                                (p = n.bits),
                                (g = n.lencode),
                                (w = n.distcode),
                                (v = (1 << n.lenbits) - 1),
                                (y = (1 << n.distbits) - 1);
                            e: do {
                                p < 15 &&
                                    ((b += U[a++] << p), (p += 8), (b += U[a++] << p), (p += 8)),
                                    (k = g[b & v]);
                                t: for (;;) {
                                    if (
                                        ((_ = k >>> 24),
                                        (b >>>= _),
                                        (p -= _),
                                        (_ = (k >>> 16) & 255),
                                        0 === _)
                                    )
                                        B[s++] = 65535 & k;
                                    else {
                                        if (!(16 & _)) {
                                            if (0 === (64 & _)) {
                                                k = g[(65535 & k) + (b & ((1 << _) - 1))];
                                                continue t;
                                            }
                                            if (32 & _) {
                                                n.mode = o;
                                                break e;
                                            }
                                            (e.msg = "invalid literal/length code"), (n.mode = r);
                                            break e;
                                        }
                                        (x = 65535 & k),
                                            (_ &= 15),
                                            _ &&
                                                (p < _ && ((b += U[a++] << p), (p += 8)),
                                                (x += b & ((1 << _) - 1)),
                                                (b >>>= _),
                                                (p -= _)),
                                            p < 15 &&
                                                ((b += U[a++] << p),
                                                (p += 8),
                                                (b += U[a++] << p),
                                                (p += 8)),
                                            (k = w[b & y]);
                                        n: for (;;) {
                                            if (
                                                ((_ = k >>> 24),
                                                (b >>>= _),
                                                (p -= _),
                                                (_ = (k >>> 16) & 255),
                                                !(16 & _))
                                            ) {
                                                if (0 === (64 & _)) {
                                                    k = w[(65535 & k) + (b & ((1 << _) - 1))];
                                                    continue n;
                                                }
                                                (e.msg = "invalid distance code"), (n.mode = r);
                                                break e;
                                            }
                                            if (
                                                ((S = 65535 & k),
                                                (_ &= 15),
                                                p < _ &&
                                                    ((b += U[a++] << p),
                                                    (p += 8),
                                                    p < _ && ((b += U[a++] << p), (p += 8))),
                                                (S += b & ((1 << _) - 1)),
                                                S > d)
                                            ) {
                                                (e.msg = "invalid distance too far back"),
                                                    (n.mode = r);
                                                break e;
                                            }
                                            if (((b >>>= _), (p -= _), (_ = s - l), S > _)) {
                                                if (((_ = S - _), _ > f && n.sane)) {
                                                    (e.msg = "invalid distance too far back"),
                                                        (n.mode = r);
                                                    break e;
                                                }
                                                if (((C = 0), (E = m), 0 === h)) {
                                                    if (((C += u - _), _ < x)) {
                                                        x -= _;
                                                        do B[s++] = m[C++];
                                                        while (--_);
                                                        (C = s - S), (E = B);
                                                    }
                                                } else if (h < _) {
                                                    if (((C += u + h - _), (_ -= h), _ < x)) {
                                                        x -= _;
                                                        do B[s++] = m[C++];
                                                        while (--_);
                                                        if (((C = 0), h < x)) {
                                                            (_ = h), (x -= _);
                                                            do B[s++] = m[C++];
                                                            while (--_);
                                                            (C = s - S), (E = B);
                                                        }
                                                    }
                                                } else if (((C += h - _), _ < x)) {
                                                    x -= _;
                                                    do B[s++] = m[C++];
                                                    while (--_);
                                                    (C = s - S), (E = B);
                                                }
                                                for (; x > 2; )
                                                    (B[s++] = E[C++]),
                                                        (B[s++] = E[C++]),
                                                        (B[s++] = E[C++]),
                                                        (x -= 3);
                                                x &&
                                                    ((B[s++] = E[C++]), x > 1 && (B[s++] = E[C++]));
                                            } else {
                                                C = s - S;
                                                do
                                                    (B[s++] = B[C++]),
                                                        (B[s++] = B[C++]),
                                                        (B[s++] = B[C++]),
                                                        (x -= 3);
                                                while (x > 2);
                                                x &&
                                                    ((B[s++] = B[C++]), x > 1 && (B[s++] = B[C++]));
                                            }
                                            break;
                                        }
                                    }
                                    break;
                                }
                            } while (a < i && s < c);
                            (x = p >> 3),
                                (a -= x),
                                (p -= x << 3),
                                (b &= (1 << p) - 1),
                                (e.next_in = a),
                                (e.next_out = s),
                                (e.avail_in = a < i ? 5 + (i - a) : 5 - (a - i)),
                                (e.avail_out = s < c ? 257 + (c - s) : 257 - (s - c)),
                                (n.hold = b),
                                (n.bits = p);
                        };
                    },
                    "zlib/inftrees.js": function (e, t, n) {
                        "use strict";
                        var r = e("../utils/common"),
                            o = 15,
                            a = 852,
                            i = 592,
                            s = 0,
                            l = 1,
                            c = 2,
                            d = [
                                3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31, 35, 43, 51,
                                59, 67, 83, 99, 115, 131, 163, 195, 227, 258, 0, 0,
                            ],
                            u = [
                                16, 16, 16, 16, 16, 16, 16, 16, 17, 17, 17, 17, 18, 18, 18, 18, 19,
                                19, 19, 19, 20, 20, 20, 20, 21, 21, 21, 21, 16, 72, 78,
                            ],
                            f = [
                                1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193, 257, 385,
                                513, 769, 1025, 1537, 2049, 3073, 4097, 6145, 8193, 12289, 16385,
                                24577, 0, 0,
                            ],
                            h = [
                                16, 16, 16, 16, 17, 17, 18, 18, 19, 19, 20, 20, 21, 21, 22, 22, 23,
                                23, 24, 24, 25, 25, 26, 26, 27, 27, 28, 28, 29, 29, 64, 64,
                            ];
                        t.exports = function (e, t, n, m, b, p, g, w) {
                            var v,
                                y,
                                k,
                                _,
                                x,
                                S,
                                C,
                                E,
                                U,
                                B = w.bits,
                                D = 0,
                                T = 0,
                                R = 0,
                                A = 0,
                                P = 0,
                                I = 0,
                                L = 0,
                                O = 0,
                                z = 0,
                                N = 0,
                                F = null,
                                M = 0,
                                Z = new r.Buf16(o + 1),
                                j = new r.Buf16(o + 1),
                                H = null,
                                W = 0;
                            for (D = 0; D <= o; D++) Z[D] = 0;
                            for (T = 0; T < m; T++) Z[t[n + T]]++;
                            for (P = B, A = o; A >= 1 && 0 === Z[A]; A--);
                            if ((P > A && (P = A), 0 === A))
                                return (b[p++] = 20971520), (b[p++] = 20971520), (w.bits = 1), 0;
                            for (R = 1; R < A && 0 === Z[R]; R++);
                            for (P < R && (P = R), O = 1, D = 1; D <= o; D++)
                                if (((O <<= 1), (O -= Z[D]), O < 0)) return -1;
                            if (O > 0 && (e === s || 1 !== A)) return -1;
                            for (j[1] = 0, D = 1; D < o; D++) j[D + 1] = j[D] + Z[D];
                            for (T = 0; T < m; T++) 0 !== t[n + T] && (g[j[t[n + T]]++] = T);
                            if (
                                (e === s
                                    ? ((F = H = g), (S = 19))
                                    : e === l
                                    ? ((F = d), (M -= 257), (H = u), (W -= 257), (S = 256))
                                    : ((F = f), (H = h), (S = -1)),
                                (N = 0),
                                (T = 0),
                                (D = R),
                                (x = p),
                                (I = P),
                                (L = 0),
                                (k = -1),
                                (z = 1 << P),
                                (_ = z - 1),
                                (e === l && z > a) || (e === c && z > i))
                            )
                                return 1;
                            for (;;) {
                                (C = D - L),
                                    g[T] < S
                                        ? ((E = 0), (U = g[T]))
                                        : g[T] > S
                                        ? ((E = H[W + g[T]]), (U = F[M + g[T]]))
                                        : ((E = 96), (U = 0)),
                                    (v = 1 << (D - L)),
                                    (y = 1 << I),
                                    (R = y);
                                do (y -= v), (b[x + (N >> L) + y] = (C << 24) | (E << 16) | U | 0);
                                while (0 !== y);
                                for (v = 1 << (D - 1); N & v; ) v >>= 1;
                                if (
                                    (0 !== v ? ((N &= v - 1), (N += v)) : (N = 0),
                                    T++,
                                    0 === --Z[D])
                                ) {
                                    if (D === A) break;
                                    D = t[n + g[T]];
                                }
                                if (D > P && (N & _) !== k) {
                                    for (
                                        0 === L && (L = P), x += R, I = D - L, O = 1 << I;
                                        I + L < A && ((O -= Z[I + L]), !(O <= 0));

                                    )
                                        I++, (O <<= 1);
                                    if (((z += 1 << I), (e === l && z > a) || (e === c && z > i)))
                                        return 1;
                                    (k = N & _), (b[k] = (P << 24) | (I << 16) | (x - p) | 0);
                                }
                            }
                            return (
                                0 !== N && (b[x + N] = ((D - L) << 24) | (64 << 16) | 0),
                                (w.bits = P),
                                0
                            );
                        };
                    },
                };
                for (var n in t) t[n].folder = n.substring(0, n.lastIndexOf("/") + 1);
                var r = function (e) {
                        var n = [];
                        return (
                            (e = e.split("/").every(function (e) {
                                return ".." == e ? n.pop() : "." == e || "" == e || n.push(e);
                            })
                                ? n.join("/")
                                : null),
                            e ? t[e] || t[e + ".js"] || t[e + "/index.js"] : null
                        );
                    },
                    o = function (e, t) {
                        return e ? r(e.folder + "node_modules/" + t) || o(e.parent, t) : null;
                    },
                    a = function (e, t) {
                        var n = t.match(/^\//)
                            ? null
                            : e
                            ? t.match(/^\.\.?\//)
                                ? r(e.folder + t)
                                : o(e, t)
                            : r(t);
                        if (!n) throw "module not found: " + t;
                        return (
                            n.exports || ((n.parent = e), n(a.bind(null, n), n, (n.exports = {}))),
                            n.exports
                        );
                    };
                return a(null, e);
            },
            decompress: function (e) {
                this.exports || (this.exports = this.require("inflate.js"));
                try {
                    return this.exports.inflate(e);
                } catch (e) {}
            },
            hasUnityMarker: function (e) {
                var t = 10,
                    n = "UnityWeb Compressed Content (gzip)";
                if (t > e.length || 31 != e[0] || 139 != e[1]) return !1;
                var r = e[3];
                if (4 & r) {
                    if (t + 2 > e.length) return !1;
                    if (((t += 2 + e[t] + (e[t + 1] << 8)), t > e.length)) return !1;
                }
                if (8 & r) {
                    for (; t < e.length && e[t]; ) t++;
                    if (t + 1 > e.length) return !1;
                    t++;
                }
                return (
                    16 & r &&
                    String.fromCharCode.apply(null, e.subarray(t, t + n.length + 1)) == n + "\0"
                );
            },
        },
    };
    return new Promise(function (e, t) {
        if (f.SystemInfo.hasWebGL)
            if (1 == f.SystemInfo.hasWebGL) {
                var r =
                    'Your browser does not support graphics API "WebGL 2" which is required for this content.';
                "Safari" == f.SystemInfo.browser &&
                    parseInt(f.SystemInfo.browserVersion) < 15 &&
                    (r +=
                        f.SystemInfo.mobile || navigator.maxTouchPoints > 1
                            ? "\nUpgrade to iOS 15 or later."
                            : "\nUpgrade to Safari 15 or later."),
                    t(r);
            } else
                f.SystemInfo.hasWasm
                    ? ((f.startupErrorHandler = t),
                      n(0),
                      f.postRun.push(function () {
                          n(1), delete f.startupErrorHandler, e(g);
                      }),
                      u())
                    : t("Your browser does not support WebAssembly.");
        else t("Your browser does not support WebGL.");
    });
}
