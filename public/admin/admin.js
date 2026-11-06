/* Admin shell. No build step and no libraries.
   Config resolves in order: server, this browser, built-in defaults. */
(function () {
  var STORAGE_KEY = "hotspot-admin-config"
  var DEFAULTS = {
    sources: { weibo: true, baidu: true },
    bannedWords: "全网第一\n国家级\n永久有效\n最好\n绝对\n100%\n万能\n史上最低\n第一品牌",
    modelName: "deepseek-chat",
    accountName: "好物研究所Lab",
  }
  var PAGES = [
    { id: "overview", href: "index.html", label: "概览" },
    { id: "sources", href: "sources.html", label: "热点源" },
    { id: "compliance", href: "compliance.html", label: "合规" },
    { id: "model", href: "model.html", label: "模型接入" },
  ]
  var SOURCE_LABEL = { server: "服务端", browser: "本机浏览器", default: "内置默认值" }

  var page = null
  var state = { source: "default", config: clone(DEFAULTS), serverUp: false }

  function clone(value) {
    return JSON.parse(JSON.stringify(value))
  }

  function readLocal() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return null
      return sanitize(JSON.parse(raw))
    } catch (error) {
      return null
    }
  }

  function writeLocal(config) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
  }

  function sanitize(input) {
    var record = input && typeof input === "object" ? input : {}
    var sources = record.sources && typeof record.sources === "object" ? record.sources : {}
    var model = typeof record.modelName === "string" ? record.modelName.trim().slice(0, 80) : ""
    var account = typeof record.accountName === "string" ? record.accountName.trim().slice(0, 40) : ""
    return {
      sources: { weibo: sources.weibo !== false, baidu: sources.baidu !== false },
      bannedWords: typeof record.bannedWords === "string" ? record.bannedWords.slice(0, 2000) : DEFAULTS.bannedWords,
      modelName: model || DEFAULTS.modelName,
      accountName: account || DEFAULTS.accountName,
    }
  }

  function fetchServer() {
    if (location.protocol === "file:") return Promise.resolve(null)
    var controller = new AbortController()
    var timer = setTimeout(function () { controller.abort() }, 1200)
    return fetch("/api/admin/config", { headers: { accept: "application/json" }, signal: controller.signal })
      .then(function (response) {
        if (!response.ok) return null
        return response.json()
      })
      .then(function (data) {
        if (!data || data.source !== "server" || !data.config) return null
        return { config: sanitize(data.config), persisted: Boolean(data.persisted) }
      })
      .catch(function () { return null })
      .finally(function () { clearTimeout(timer) })
  }

  function load() {
    return fetchServer().then(function (server) {
      if (server) {
        state = { source: "server", config: server.config, serverUp: true, persisted: server.persisted }
        return
      }
      var local = readLocal()
      if (local) {
        state = { source: "browser", config: local, serverUp: false, persisted: true }
        return
      }
      state = { source: "default", config: clone(DEFAULTS), serverUp: false, persisted: false }
    })
  }

  function sourceHint() {
    if (state.source === "server" && !state.persisted) return "服务端在线，还没有单独保存过，数值与内置默认值相同。"
    if (state.source === "server") return "这次读到的是服务端保存的配置。"
    if (state.source === "browser") return "服务没开，这次读到的是本机浏览器里保存的配置。"
    return "服务没开，本机也还没有保存过，这次用的是内置默认值。"
  }

  function fieldHtml(field) {
    var value = valueAt(state.config, field.key)
    if (field.type === "checkbox") {
      return '<label class="field"><input data-key="' + field.key + '" type="checkbox"' + (value ? " checked" : "") + "> " + escapeHtml(field.label) + "</label>"
    }
    if (field.type === "textarea") {
      return '<label class="field stack">' + escapeHtml(field.label) + '<textarea data-key="' + field.key + '">' + escapeHtml(String(value)) + "</textarea></label>"
    }
    return '<label class="field stack">' + escapeHtml(field.label) + '<input data-key="' + field.key + '" type="text" value="' + escapeAttr(String(value)) + '"></label>'
  }

  function readoutHtml() {
    var config = state.config
    return '<dl class="readout">'
      + row("热点源", (config.sources.weibo ? "微博" : "微博关") + " / " + (config.sources.baidu ? "百度" : "百度关"))
      + row("发布账号", config.accountName)
      + row("模型", config.modelName)
      + row("禁用词", config.bannedWords.split("\n").filter(Boolean).length + " 条")
      + "</dl>"
  }

  function row(label, value) {
    return "<div><dt>" + escapeHtml(label) + "</dt><dd>" + escapeHtml(value) + "</dd></div>"
  }

  function valueAt(config, key) {
    return key.split(".").reduce(function (current, part) { return current ? current[part] : undefined }, config)
  }

  function collect() {
    var next = clone(state.config)
    document.querySelectorAll("[data-key]").forEach(function (input) {
      var key = input.getAttribute("data-key").split(".")
      var cursor = next
      key.slice(0, -1).forEach(function (part) { cursor = cursor[part] })
      cursor[key[key.length - 1]] = input.type === "checkbox" ? input.checked : input.value
    })
    return sanitize(next)
  }

  function paint() {
    var badge = document.querySelector("[data-badge]")
    badge.dataset.source = state.source
    badge.textContent = "数据来源 · " + SOURCE_LABEL[state.source]
    var hint = document.querySelector("[data-hint]")
    hint.textContent = sourceHint()
    var readout = document.querySelector("[data-readout]")
    if (readout) readout.innerHTML = readoutHtml()
  }

  function save() {
    var button = document.querySelector("[data-save]")
    var config = collect()
    button.disabled = true
    var request = state.serverUp
      ? fetch("/api/admin/config", {
          method: "PUT",
          headers: { "content-type": "application/json", accept: "application/json" },
          body: JSON.stringify(config),
        }).then(function (response) {
          if (!response.ok) throw new Error("save failed")
          return response.json()
        }).then(function (data) {
          state = { source: "server", config: sanitize(data.config), serverUp: true, persisted: true }
          writeLocal(state.config)
        })
      : Promise.resolve().then(function () {
          writeLocal(config)
          state = { source: "browser", config: config, serverUp: false, persisted: true }
        })
    request.then(paint).catch(function () {
      writeLocal(config)
      state = { source: "browser", config: config, serverUp: false, persisted: true }
      paint()
    }).finally(function () { button.disabled = false })
  }

  function reset() {
    var button = document.querySelector("[data-reset]")
    button.disabled = true
    localStorage.removeItem(STORAGE_KEY)
    var request = state.serverUp
      ? fetch("/api/admin/config", { method: "DELETE" }).catch(function () { return null })
      : Promise.resolve(null)
    request.then(load).then(function () {
      mount(page)
    }).finally(function () { button.disabled = false })
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"]/g, function (char) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[char]
    })
  }

  function escapeAttr(value) {
    return escapeHtml(value).replace(/'/g, "&#39;")
  }

  function mount(spec) {
    page = spec
    var sectionNav = spec.sections.map(function (section) {
      return '<button type="button" data-jump="' + section.id + '">' + escapeHtml(section.title) + "</button>"
    }).join("")
    var pageNav = PAGES.map(function (item) {
      var current = item.id === spec.id ? ' aria-current="page"' : ""
      return '<a href="' + item.href + '"' + current + ">" + item.label + "</a>"
    }).join("")
    var cards = spec.sections.map(function (section) {
      var body = section.readout ? '<div data-readout></div>' : (section.field ? fieldHtml(section.field) : "")
      return '<section class="card" id="' + section.id + '"><h2>' + escapeHtml(section.title) + "</h2><p>" + escapeHtml(section.summary) + "</p>" + body + "</section>"
    }).join("")

    document.body.innerHTML = ''
      + '<div class="shell">'
      + '<header class="topbar">'
      + '<a class="brand" href="index.html"><span class="mark">后</span><span><span class="brand-name">后台管理</span><span class="brand-sub">Hotspot Studio</span></span></a>'
      + '<span class="badge" data-badge data-source="default">数据来源 · 读取中</span>'
      + '<a class="back" href="/">返回工作台</a>'
      + "</header>"
      + '<aside class="nav">'
      + '<div class="nav-group"><div class="nav-label">本页</div>' + sectionNav + "</div>"
      + '<div class="nav-group"><div class="nav-label">其它页面</div>' + pageNav + "</div>"
      + "</aside>"
      + '<main class="main"><h1 class="page-title">' + escapeHtml(spec.title) + '</h1><p class="page-lead">' + escapeHtml(spec.lead) + '</p><div class="cards">' + cards + "</div></main>"
      + '<footer class="action"><button class="btn btn-primary" type="button" data-save>保存</button><button class="btn btn-ghost" type="button" data-reset>恢复默认</button><span class="hint" data-hint></span></footer>'
      + "</div>"

    document.title = spec.title + " · 后台管理"
    document.querySelectorAll("[data-jump]").forEach(function (button) {
      button.addEventListener("click", function () {
        var target = document.getElementById(button.getAttribute("data-jump"))
        var main = document.querySelector(".main")
        main.scrollTo({ top: target.offsetTop - 8, behavior: "smooth" })
        setCurrent(button.getAttribute("data-jump"))
      })
    })
    document.querySelector(".main").addEventListener("scroll", highlight)
    document.querySelector("[data-save]").addEventListener("click", save)
    document.querySelector("[data-reset]").addEventListener("click", reset)
    highlight()
    paint()
  }

  function setCurrent(id) {
    document.querySelectorAll("[data-jump]").forEach(function (button) {
      if (button.getAttribute("data-jump") === id) button.setAttribute("aria-current", "true")
      else button.removeAttribute("aria-current")
    })
  }

  function highlight() {
    var main = document.querySelector(".main")
    var current = page.sections[0] ? page.sections[0].id : ""
    page.sections.forEach(function (section) {
      var node = document.getElementById(section.id)
      if (node && node.offsetTop - main.scrollTop < 80) current = section.id
    })
    setCurrent(current)
  }

  window.AdminShell = {
    start: function (spec) {
      load().then(function () { mount(spec) })
    },
  }
})()
