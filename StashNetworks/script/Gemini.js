async function request(method, params) {
  return new Promise((resolve, reject) => {
    const httpMethod = $httpClient[method.toLowerCase()];
    httpMethod(params, (error, response, data) => {
      resolve({ error, response, data });
    });
  });
}

async function main() {
  const { error, response, data } = await request(
    "GET",
    "https://gemini.google.com"
  );

  if (error) {
    $done({ content: "Network Error", backgroundColor: "" });
    return;
  }

  // 当地区不支持时，Gemini 页面会包含特定的不支持说明
  if (data.includes("isn't supported") || data.includes("isn't available")) {
    $done({
      content: "不支持的地区",
      backgroundColor: "#666666",
    });
    return;
  }

  $done({
    content: "Available",
    backgroundColor: "#4285F4", // Google 蓝色
  });
}

(async () => {
  main().catch((error) => { $done({}); });
})();