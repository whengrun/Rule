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
    "https://www.disneyplus.com"
  );

  if (error) {
    $done({ content: "Network Error", backgroundColor: "" });
    return;
  }

  // Disney+ 在不支持的区域通常会重定向到特定页面或返回 403
  if (response.status === 403 || data.toLowerCase().includes("not available")) {
    $done({
      content: "不支持的地区",
      backgroundColor: "#666666",
    });
    return;
  }

  $done({
    content: "Available",
    backgroundColor: "#0063E5", // Disney+ 蓝色
  });
}

(async () => {
  main().catch((error) => { $done({}); });
})();