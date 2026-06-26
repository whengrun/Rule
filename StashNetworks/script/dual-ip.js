// 封装的通用请求函数 (基于你的代码优化)
async function request(params) {
  return new Promise((resolve) => {
    // 强制使用 GET 请求
    $httpClient.get(params, (error, response, data) => {
      resolve({ error, response, data });
    });
  });
}

// 1. 获取本地直连 IP
async function getLocalIp() {
  const url = `http://ip-api.com/json/?lang=zh-CN&t=${Date.now()}`;
  const { error, response, data } = await request({ url: url, policy: "DIRECT", timeout: 5000 });

  if (error) return { text: "🇨🇳 直连: 请求超时或失败", hasError: true };

  try {
    const obj = JSON.parse(data);
    if (obj.status === "success") {
      return { text: `🇨🇳 直连: ${obj.query} (${obj.countryCode})`, hasError: false };
    }
    return { text: "🇨🇳 直连: 查询异常", hasError: true };
  } catch (e) {
    return { text: "🇨🇳 直连: 解析异常", hasError: true };
  }
}

// 2. 获取海外代理 IP
async function getProxyIp() {
  const url = `https://api.my-ip.io/v1/ip?t=${Date.now()}`;
  const { error, response, data } = await request({ url: url, timeout: 5000 });

  if (error) return { text: "✈️ 代理: 请求超时或失败", hasError: true };

  let ipStr = data ? data.trim() : "未知";
  try {
    const obj = JSON.parse(ipStr);
    if (obj && obj.ip) ipStr = obj.ip;
  } catch (e) {
    // 非 JSON 格式，保持原样（纯文本 IP）
  }

  return { text: `✈️ 代理: ${ipStr}`, hasError: false };
}

// 主函数
async function main() {
  // 使用 Promise.all 让两个 await 并发执行，节省一半等待时间
  const [local, proxy] = await Promise.all([getLocalIp(), getProxyIp()]);

  // 如果任意一个出错，使用警告色；否则使用正常色
  const hasError = local.hasError || proxy.hasError;

  $done({
    title: "双路 IP 检测",
    content: `${local.text}\n${proxy.text}`,
    backgroundColor: hasError ? "#FF9500" : "#34C759", // 橙色 vs 绿色
    icon: "arrow.left.arrow.right.circle.fill"
  });
}

// 立即执行函数 (IIFE) 启动脚本
(async () => {
  try {
    await main();
  } catch (error) {
    // 捕获不可预见的全局严重错误
    $done({
      title: "双路 IP 检测",
      content: "脚本执行遭遇未知错误",
      backgroundColor: "#FF3B30", // 红色
      icon: "exclamationmark.triangle.fill"
    });
  }
})();