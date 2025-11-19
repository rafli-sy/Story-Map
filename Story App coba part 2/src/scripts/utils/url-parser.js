// src/scripts/utils/url-parser.js
const UrlParser = {
  parseActiveUrlWithCombiner() {
    const url = location.hash.slice(1).toLowerCase() || "/";
    const parts = url.split("/");

    // SUPPORT format: #/detail/123
    if (parts[1] === "detail" && parts[2]) return "/detail/:id";

    // SUPPORT format: #/detail?id=123
    if (parts[1].startsWith("detail?")) return "/detail/:id";

    return url;
  },

  getResourceId() {
    const url = location.hash.slice(1).toLowerCase() || "/";
    const parts = url.split("/");

    // Case 1: #/detail/123
    if (parts[2]) return parts[2];

    // Case 2: #/detail?id=123
    if (parts[1].includes("?")) {
      const qs = parts[1].split("?")[1];
      const params = new URLSearchParams(qs);
      return params.get("id");
    }

    return null;
  },
};

export default UrlParser;
