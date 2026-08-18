const I18N = (() => {
  let dict = {};
  let currentLang = "hi";
  const cache = {};

  async function load(langCode) {
    if (cache[langCode]) {
      dict = cache[langCode];
    } else {
      const res = await fetch(`locales/${langCode}.json`);
      dict = await res.json();
      cache[langCode] = dict;
    }
    currentLang = langCode;
    applyToDom();
    document.documentElement.setAttribute("data-lang", langCode);
    document.documentElement.setAttribute("lang", langCode);
    document.documentElement.setAttribute(
      "dir",
      langCode === "ur" ? "rtl" : "ltr"
    );
    localStorage.setItem("ksh_lang", langCode);
  }

  function t(key) {
    return dict[key] || key;
  }

  function applyToDom() {
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      el.textContent = t(key);
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      const key = el.getAttribute("data-i18n-placeholder");
      el.setAttribute("placeholder", t(key));
    });
    document.querySelectorAll("[data-i18n-aria-label]").forEach((el) => {
      const key = el.getAttribute("data-i18n-aria-label");
      el.setAttribute("aria-label", t(key));
    });
  }

  function getCurrentLang() {
    return currentLang;
  }

  return { load, t, applyToDom, getCurrentLang };
})();
